# app/parsers.py - parses .csv downloads from Discover CC and Schwab Checking Account
import csv
import re
from datetime import datetime


def clean_header(header):
    """Clean header string by removing all whitespace, newlines, BOM, and special characters."""
    if not header:
        return ""
    
    # Remove BOM character that appears at start of some CSV files
    cleaned = header.replace('\ufeff', '').replace('\ufffe', '')
    
    # Remove all types of whitespace including newlines, carriage returns, tabs, etc.
    return ''.join(cleaned.split()).strip()


def validate_headers(expected_headers, actual_headers, source_name):
    """Validate that all expected headers are present in the CSV. Normalizes headers by removing all whitespace for comparison."""
    # Create normalized versions for comparison
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


def clean_currency_string(value):
    """Remove currency symbols, commas, and whitespace from monetary values."""
    if not value or value.strip() == "":
        return 0.0
    
    # Remove dollar signs, commas, and whitespace
    cleaned = re.sub(r'[$,\s]', '', str(value).strip())
    
    # Handle empty string after cleaning
    if not cleaned:
        return 0.0
    
    try:
        return float(cleaned)
    except ValueError:
        print(f"Warning: Could not convert '{value}' to float, using 0.0")
        return 0.0


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
    
    with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
        # Read the CSV with original headers (utf-8-sig automatically removes BOM)
        reader = csv.DictReader(csvfile)
        
        if not reader.fieldnames:
            raise ValueError("CSV file appears to be empty")
        
        # Clean any remaining special characters from headers
        original_headers = [h.strip() for h in reader.fieldnames]
        
        # Create a mapping from cleaned headers to original headers
        header_mapping = {clean_header(h): h for h in original_headers}
        
        # Expected headers (normalized)
        expected_normalized = {
            clean_header("Trans. Date"): "Trans. Date",
            clean_header("Description"): "Description",
            clean_header("Amount"): "Amount",
            clean_header("Category"): "Category"
        }
        
        # Validate that all expected headers exist
        validate_headers(
            list(expected_normalized.values()),
            original_headers,
            "Discover"
        )
        
        # Find the actual header names in the CSV (with whatever whitespace they have)
        date_header = header_mapping.get(clean_header("Trans. Date"))
        desc_header = header_mapping.get(clean_header("Description"))
        amount_header = header_mapping.get(clean_header("Amount"))
        category_header = header_mapping.get(clean_header("Category"))
        
        for row in reader:
            # Parse amount
            raw_amount = clean_currency_string(row[amount_header])
            
            # Get cost center from Discover's Category column
            cost_center = row[category_header].strip() if row[category_header].strip() else "Uncategorized"
            
            # For Discover: negative amounts in CSV = credits (positive in ledger)
            #               positive amounts in CSV = expenses (negative in ledger)
            amount = -raw_amount
            
            transactions.append({
                "date": datetime.strptime(row[date_header].strip(), "%m/%d/%Y").date(),
                "description": row[desc_header].strip(),
                "cost_center": cost_center,
                "spend_categories": [],  # Empty by default - user can categorize later
                "amount": amount,
                "account": "Discover",
                "notes": None,  # Institution CSVs don't have notes
            })
    
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
    
    with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        
        if not reader.fieldnames:
            raise ValueError("CSV file appears to be empty")
        
        # Clean any remaining special characters from headers
        original_headers = [h.strip() for h in reader.fieldnames]
        
        # Create a mapping from cleaned headers to original headers
        header_mapping = {clean_header(h): h for h in original_headers}
        
        # Expected headers (normalized) - only validate the ones needed
        expected_normalized = {
            clean_header("Date"): "Date",
            clean_header("Description"): "Description",
            clean_header("Withdrawal"): "Withdrawal",
            clean_header("Deposit"): "Deposit"
        }
        
        # Validate headers
        validate_headers(
            list(expected_normalized.values()),
            original_headers,
            "Schwab Checking"
        )
        
        # Find the actual header names in the CSV
        date_header = header_mapping.get(clean_header("Date"))
        desc_header = header_mapping.get(clean_header("Description"))
        withdrawal_header = header_mapping.get(clean_header("Withdrawal"))
        deposit_header = header_mapping.get(clean_header("Deposit"))
        
        for row in reader:
            # Clean and process amounts
            withdrawal_str = row.get(withdrawal_header, "").strip()
            deposit_str = row.get(deposit_header, "").strip()
            description = row[desc_header].strip()
            
            # Determine amount
            if withdrawal_str and withdrawal_str != "":
                # Withdrawals are expenses (negative in DB)
                amount = -clean_currency_string(withdrawal_str)
            elif deposit_str and deposit_str != "":
                # Deposits are income (positive in DB)
                amount = clean_currency_string(deposit_str)
            else:
                # Skip rows with no amount (shouldn't happen but just in case)
                amount = 0.0
            
            transactions.append({
                "date": datetime.strptime(row[date_header].strip(), "%m/%d/%Y").date(),
                "description": description,
                "amount": amount,
                "account": "Schwab Checking",
                "cost_center": None,  # Schwab doesn't provide categories - will default to "Uncategorized"
                "spend_categories": [],  # Empty by default - user can categorize later
                "notes": None,  # Institution CSVs don't have notes
            })
    
    return transactions


def load_custom_csv(file_path: str):
    """
    Parse custom export CSV format from this app.
    
    Expected columns:
    - Date: Transaction date (YYYY-MM-DD)
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
    
    with open(file_path, newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        
        if not reader.fieldnames:
            raise ValueError("CSV file appears to be empty")
        
        # Clean any remaining special characters from headers
        original_headers = [h.strip() for h in reader.fieldnames]
        
        # Create a mapping from cleaned headers to original headers
        header_mapping = {clean_header(h): h for h in original_headers}
        
        # Expected headers (normalized)
        expected_normalized = {
            clean_header("Date"): "Date",
            clean_header("Description"): "Description",
            clean_header("Amount"): "Amount",
            clean_header("Account"): "Account",
            clean_header("Cost Center"): "Cost Center",
            clean_header("Spend Categories"): "Spend Categories",
            clean_header("Notes"): "Notes",
        }
        
        # Validate headers
        validate_headers(
            list(expected_normalized.values()),
            original_headers,
            "Custom Export"
        )
        
        # Find the actual header names in the CSV
        date_header = header_mapping.get(clean_header("Date"))
        desc_header = header_mapping.get(clean_header("Description"))
        amount_header = header_mapping.get(clean_header("Amount"))
        account_header = header_mapping.get(clean_header("Account"))
        cost_center_header = header_mapping.get(clean_header("Cost Center"))
        spend_categories_header = header_mapping.get(clean_header("Spend Categories"))
        notes_header = header_mapping.get(clean_header("Notes"))
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
            try:
                # Parse date - handle both YYYY-MM-DD and MM/DD/YYYY formats
                date_str = row[date_header].strip()
                try:
                    # Try ISO format first (YYYY-MM-DD)
                    transaction_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                except ValueError:
                    # Fall back to MM/DD/YYYY
                    transaction_date = datetime.strptime(date_str, "%m/%d/%Y").date()
                
                # Parse amount
                amount = clean_currency_string(row[amount_header])
                
                # Get cost center
                cost_center = row[cost_center_header].strip() if row[cost_center_header].strip() else None
                if cost_center and cost_center.lower() == "uncategorized":
                    cost_center = None  # Will default to "Uncategorized" in loader
                
                # Parse spend categories (comma-separated)
                spend_categories_str = row[spend_categories_header].strip()
                spend_categories = []
                
                if spend_categories_str and spend_categories_str.lower() != "uncategorized":
                    # Split by comma and clean each category
                    raw_categories = spend_categories_str.split(',')
                    for cat in raw_categories:
                        # Strip leading/trailing whitespace but preserve internal spacing
                        cleaned_cat = cat.strip()
                        if cleaned_cat:
                            spend_categories.append(cleaned_cat)

                notes = None  # Default to None
                if notes_header and notes_header in row:
                    notes_str = row[notes_header].strip()
                    notes = notes_str if notes_str else None # None if cell is empty
                
                transactions.append({
                    "date": transaction_date,
                    "description": row[desc_header].strip(),
                    "amount": amount,
                    "account": row[account_header].strip(),
                    "cost_center": cost_center,
                    "spend_categories": spend_categories,
                    "notes": row[notes_header].strip(),
                })
                
            except Exception as e:
                # Provide helpful error message with row number
                print(f"Warning: Error parsing row {row_num}: {str(e)}")
                # Continue processing other rows
                continue
    
    return transactions


def parse_csv(file_path: str, institution: str):
    """
    Route to the correct parser based on institution name.
    
    Args:
        file_path: Path to the CSV file
        institution: Institution name (e.g., 'discover', 'schwab', 'custom')
    
    Returns:
        List of transaction dictionaries with keys:
        - date: datetime.date
        - description: str
        - amount: float (negative = expense, positive = income/credit)
        - account: str
        - cost_center: str or None (maps to cost center name)
        - spend_categories: list[str] (empty by default, user categorizes later)
        - notes: str or None
    """
    institution = institution.lower().strip()
    
    if institution == "discover":
        return load_discover_csv(file_path)
    elif institution in ["schwab", "schwab checking"]:
        return load_schwab_csv(file_path)
    elif institution == "custom":
        return load_custom_csv(file_path)
    else:
        raise ValueError(f"No parser available for institution: {institution}")
