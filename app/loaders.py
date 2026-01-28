# app/loaders.py - takes parsed .csv data and loads it into DB
from sqlalchemy.orm import Session

from typing import List, Dict, Any, Optional

from .database import SessionLocal, init_db
from .models import Transaction, CostCenter, SpendCategory


def get_or_create_cost_center(db: Session, name: Optional[str]) -> CostCenter:
    """
    Get existing cost center or create if it doesn't exist.
    If name is None or empty, returns/creates "Uncategorized".
    """
    if not name or not name.strip():
        name = "Uncategorized"
    else:
        name = name.strip()
    
    cost_center = db.query(CostCenter).filter(CostCenter.name == name).first()
    
    if not cost_center:
        cost_center = CostCenter(name=name)
        db.add(cost_center)
        db.flush()  # Ensure cost center gets an ID before continuing
    
    return cost_center


def get_or_create_spend_categories(db: Session, names: List[str]) -> List[SpendCategory]:
    """
    Get or create spend categories from a list of names.
    If the list is empty or all names are empty, returns ["Uncategorized"].
    Removes duplicates and empty strings.
    """
    # Clean and deduplicate names
    cleaned_names = []
    seen = set()
    
    for name in names:
        if name and name.strip():
            cleaned = name.strip()
            if cleaned not in seen:
                cleaned_names.append(cleaned)
                seen.add(cleaned)
    
    # If no valid names, default to Uncategorized
    if not cleaned_names:
        cleaned_names = ["Uncategorized"]
    
    # Get or create each category
    categories = []
    for name in cleaned_names:
        category = db.query(SpendCategory).filter(SpendCategory.name == name).first()
        
        if not category:
            category = SpendCategory(name=name)
            db.add(category)
            db.flush()  # Ensure category gets an ID
        
        categories.append(category)
    
    return categories


def save_transactions(transactions: List[Dict[str, Any]], db_session: Optional[Session] = None):
    """
    Save a list of parsed transactions to the database.
    
    Args:
        transactions: List of transaction dictionaries with keys:
            - date: datetime.date
            - description: str
            - cost_center_name: str or None (cost center name)  # FIXED: was "cost_center"
            - spend_category_names: list[str] (spend category names, can be empty)  # FIXED: was "spend_categories"
            - amount: float
            - account: str
            - notes: str or None (optional notes)

        db_session: Optional SQLAlchemy session. If None, creates a new session.
    
    Raises:
        Exception: If database operations fail (transaction will be rolled back)
    """
    own_session = db_session is None
    
    if own_session:
        init_db()
        db_session = SessionLocal()
    
    try:
        for t in transactions:
            # Get or create cost center
            cost_center = get_or_create_cost_center(db_session, t.get("cost_center_name"))
            
            # Get or create spend categories
            spend_category_names = t.get("spend_category_names", [])
            spend_categories = get_or_create_spend_categories(db_session, spend_category_names)
            
            # Create transaction
            db_transaction = Transaction(
                date = t["date"],
                description = t["description"],
                cost_center = cost_center,
                spend_categories = spend_categories,
                amount = t["amount"],
                account = t["account"],
                notes = t["notes"],
            )
            
            db_session.add(db_transaction)
        
        db_session.commit()
        
    except Exception as e:
        db_session.rollback()
        raise
    
    finally:
        # Only close if session is created
        if own_session:
            db_session.close()
