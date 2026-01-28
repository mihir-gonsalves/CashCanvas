# app/parsers.py - parses .csv downloads from Discover CC and Schwab Checking Account
import csv
import re
from datetime import datetime
from typing import Dict, List
from pydantic import ValidationError
from app import schemas


def clean_header(header):
    """Clean header string by removing all whitespace, newlines, BOM, and special characters."""
    if not header:
        return ""
    
    # Remove BOM character that appears at start of some CSV files
    cleaned = header.replace('\ufeff', '').replace('\ufffe', '')
    
    # Remove all types of whitespace including newlines, carriage returns, tabs, etc.
    return ''.join(cleaned.split()).strip()


def validate_headers(expected_headers, actual_headers, source_name):
    """Validate that all expected headers are present in the CSV."""
    normalized_actual = {clean_header(h): h for h in actual_headers if h}
    normalized_expected = {clean_header(h): h for h in expected_headers}
    
    # Check if all expected headers exist (in normalized form)
    missing = [expected for norm_exp, expected in normalized_expected.items() 
               if norm_exp not in normalized_actual]
    
    if missing:
        raise ValueError(
            f"CSV file does not look like a {source_name} export. "
            f"Missing columns: {missing}. "
            f"Found columns: {list(actual_headers)}"
        )


def clean_currency_string(value, row_num=None):
    """Remove currency symbols, commas, and whitespace from monetary values."""
    if not value or value.strip() == "":
        error_msg = f"Empty or invalid currency value: '{value}'"
        if row_num:
            error_msg = f"Row {row_num}: {error_msg}"
        raise ValueError(error_msg)
    
    # Remove dollar signs, commas, and whitespace
    cleaned = re.sub(r'[$,\s]', '', str(value).strip())
    
    if not cleaned:
        error_msg = f"Empty or invalid currency value: '{value}'"
        if row_num:
            error_msg = f"Row {row_num}: {error_msg}"
        raise ValueError(error_msg)
    
    try:
        return float(cleaned)
    except ValueError:
        error_msg = f"Invalid currency value: '{value}'. Expected a number."
        if row_num:
            error_msg = f"Row {row_num}: {error_msg}"
        raise ValueError(error_msg)


def _parse_headers(reader, expected_headers_map: Dict[str, str], institution_name: str) -> Dict[str, str]:
    """
    Parse and validate CSV headers.
    
    Args:
        reader: CSV DictReader
        expected_headers_map: Dict mapping clean names to display names
            e.g., {"date": "Trans. Date", "description": "Description"}
        institution_name: Name for error messages
    
    Returns:
        Dict mapping clean names to actual header names in CSV
    """
    if not reader.fieldnames:
        raise ValueError("CSV file appears to be empty")
    
    original_headers = [h.strip() for h in reader.fieldnames]
    header_mapping = {clean_header(h): h for h in original_headers}
    
    validate_headers(
        list(expected_headers_map.values()),
        original_headers,
        institution_name
    )
    
    return {
        clean_key: header_mapping[clean_header(display_name)]
        for clean_key, display_name in expected_headers_map.items()
    }


def _validate_transaction_data(txn_data: dict, row_num: int) -> None:
    """
    Validate transaction data with Pydantic schema.
    
    Args:
        txn_data: Transaction dictionary
        row_num: Row number for error messages
    
    Raises:
        ValueError: If validation fails
    """
    try:
        schemas.TransactionCreate(**txn_data)
    except ValidationError as e:
        errors = []
        for error in e.errors():
            field = error['loc'][0] if error['loc'] else 'unknown'
            msg = error['msg']
            errors.append(f"{field}: {msg}")
        raise ValueError(f"Row {row_num} validation failed: {'; '.join(errors)}")


def load_discover_csv(file_path: str):
    """
    Parse Discover credit card CSV export.
    
    Expected columns:
    - Trans. Date: Transaction date (MM/DD/YYYY)
    - Description: Transaction description
    - Amount: Transaction amount (positive = expense, negative = credit)
    - Category: Discover's category (maps to cost_center)
    """
    transactions = []
    errors = []
    
    with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
        # Read the CSV with original headers (utf-8-sig automatically removes BOM)
        reader = csv.DictReader(csvfile)
        
        headers = _parse_headers(reader, {
            "date": "Trans. Date",
            "description": "Description",
            "amount": "Amount",
            "category": "Category"
        }, "Discover")
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Validate and parse date
                date_str = row[headers["date"]].strip()
                if not date_str:
                    raise ValueError("Date is empty")
                date_obj = datetime.strptime(date_str, "%m/%d/%Y").date()
                
                # Validate description
                description = row[headers["description"]].strip()
                if not description:
                    raise ValueError("Description is empty")
                
                # Validate and parse amount
                raw_amount_str = row[headers["amount"]].strip()
                if not raw_amount_str:
                    raise ValueError("Amount is empty")
                raw_amount = clean_currency_string(raw_amount_str, row_num)
                
                # Get cost center
                cost_center = row[headers["category"]].strip() if row[headers["category"]].strip() else "Uncategorized"
                
                # For Discover: negative amounts in CSV = credits (positive in ledger)
                #               positive amounts in CSV = expenses (negative in ledger)
                amount = -raw_amount
                
                txn_data = {
                    "date": date_obj,
                    "description": description,
                    "cost_center_name": cost_center,
                    "spend_category_names": [],
                    "amount": amount,
                    "account": "Discover",
                    "notes": None,
                }
                
                # Validate with Pydantic
                _validate_transaction_data(txn_data, row_num)
                
                transactions.append(txn_data)
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
    
    if errors:
        raise ValueError(
            f"CSV validation failed ({len(errors)} error(s)):\n" + 
            "\n".join(errors[:20])  # Limit to first 20 errors
        )
    
    return transactions


def load_schwab_csv(file_path: str):
    """
    Parse Schwab checking account CSV export.
    
    Expected columns:
    - Date: Transaction date (MM/DD/YYYY)
    - Status: Transaction status (ignored)
    - Type: Transaction type (ignored)
    - CheckNumber: Check number if applicable (ignored)
    - Description: Transaction description
    - Withdrawal: Withdrawal amount (expenses - will be negative in DB)
    - Deposit: Deposit amount (income - will be positive in DB)
    - RunningBalance: Running balance (ignored)
    
    Note: Schwab doesn't provide categories, so cost_center defaults to "Uncategorized".
    """
    transactions = []
    errors = []
    
    with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        
        headers = _parse_headers(reader, {
            "date": "Date",
            "description": "Description",
            "withdrawal": "Withdrawal",
            "deposit": "Deposit"
        }, "Schwab Checking")
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Validate and parse date
                date_str = row[headers["date"]].strip()
                if not date_str:
                    raise ValueError("Date is empty")
                date_obj = datetime.strptime(date_str, "%m/%d/%Y").date()
                
                # Validate description
                description = row[headers["description"]].strip()
                if not description:
                    raise ValueError("Description is empty")
                
                # Process amounts
                withdrawal_str = row.get(headers["withdrawal"], "").strip()
                deposit_str = row.get(headers["deposit"], "").strip()
                
                # Determine amount
                if withdrawal_str and withdrawal_str != "":
                    amount = -clean_currency_string(withdrawal_str, row_num)
                elif deposit_str and deposit_str != "":
                    amount = clean_currency_string(deposit_str, row_num)
                else:
                    raise ValueError("Both Withdrawal and Deposit are empty")
                
                txn_data = {
                    "date": date_obj,
                    "description": description,
                    "amount": amount,
                    "account": "Schwab Checking",
                    "cost_center_name": None,
                    "spend_category_names": [],
                    "notes": None,
                }
                
                # Validate with Pydantic
                _validate_transaction_data(txn_data, row_num)
                
                transactions.append(txn_data)
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
    
    if errors:
        raise ValueError(
            f"CSV validation failed ({len(errors)} error(s)):\n" + 
            "\n".join(errors[:20])
        )
    
    return transactions


def load_cashcanvas_csv(file_path: str):
    """
    Parse custom CashCanvas export CSV format from this app.
    
    Expected columns:
    - Date: Transaction date (YYYY-MM-DD or MM/DD/YYYY)
    - Description: Transaction description
    - Amount: Transaction amount (negative = expense, positive = income)
    - Account: Account name
    - Cost Center: Cost center name
    - Spend Categories: Comma-separated list of spend category names
    - Notes: Optional notes field
    
    This format is used for exporting and re-importing transactions after bulk editing.
    Spend categories should be comma-separated (e.g., "Restaurant, Night Life").
    """
    transactions = []
    errors = []
    
    with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        
        headers = _parse_headers(reader, {
            "date": "Date",
            "description": "Description",
            "amount": "Amount",
            "account": "Account",
            "cost_center": "Cost Center",
            "spend_categories": "Spend Categories",
            "notes": "Notes",
        }, "CashCanvas Export")
        
        for row_num, row in enumerate(reader, start=2):
            try:
                # Validate and parse date
                date_str = row[headers["date"]].strip()
                if not date_str:
                    raise ValueError("Date is empty")
                
                try:
                    # Try ISO format first (YYYY-MM-DD)
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    # Fall back to MM/DD/YYYY
                    date_obj = datetime.strptime(date_str, "%m/%d/%Y").date()
                
                # Validate description
                description = row[headers["description"]].strip()
                if not description:
                    raise ValueError("Description is empty")
                
                # Validate and parse amount
                amount_str = row[headers["amount"]].strip()
                if not amount_str:
                    raise ValueError("Amount is empty")
                amount = clean_currency_string(amount_str, row_num)
                
                # Validate account
                account = row[headers["account"]].strip()
                if not account:
                    raise ValueError("Account is empty")
                
                # Parse cost center
                cost_center = row[headers["cost_center"]].strip() if row[headers["cost_center"]].strip() else None
                if cost_center and cost_center.lower() == "uncategorized":
                    cost_center = None
                
                # Parse spend categories
                spend_categories_str = row[headers["spend_categories"]].strip()
                spend_categories = []
                
                if spend_categories_str and spend_categories_str.lower() != "uncategorized":
                    # Split by comma and clean each category
                    raw_categories = spend_categories_str.split(',')
                    for cat in raw_categories:
                        # Strip leading/trailing whitespace but preserve internal spacing
                        cleaned_cat = cat.strip()
                        if cleaned_cat:
                            spend_categories.append(cleaned_cat)
                
                # Parse notes
                notes = None
                if headers["notes"] in row:
                    notes_str = row[headers["notes"]].strip()
                    notes = notes_str if notes_str else None
                
                txn_data = {
                    "date": date_obj,
                    "description": description,
                    "amount": amount,
                    "account": account,
                    "cost_center_name": cost_center,
                    "spend_category_names": spend_categories,
                    "notes": notes,
                }
                
                # Validate with Pydantic
                _validate_transaction_data(txn_data, row_num)
                
                transactions.append(txn_data)
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
    
    if errors:
        raise ValueError(
            f"CSV validation failed ({len(errors)} error(s)):\n" + 
            "\n".join(errors[:20])
        )
    
    return transactions


def parse_csv(file_path: str, institution: str):
    """
    Route to the correct parser based on institution name.
    
    Args:
        file_path: Path to the CSV file
        institution: Institution name (e.g., 'discover', 'schwab', 'cashcanvas')
    
    Returns:
        List of validated transaction dictionaries
    
    Raises:
        ValueError: If institution is unknown or CSV validation fails
    """
    institution = institution.lower().strip()
    
    if institution == "discover":
        return load_discover_csv(file_path)
    elif institution in ["schwab", "schwab checking"]:
        return load_schwab_csv(file_path)
    elif institution == "cashcanvas":
        return load_cashcanvas_csv(file_path)
    else:
        raise ValueError(
            f"Unknown institution: '{institution}'. "
            f"Supported institutions: 'discover', 'schwab', 'cashcanvas'"
        )
