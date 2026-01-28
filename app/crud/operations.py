# app/crud/operations.py - database CRUD operations
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Union
from datetime import date
from collections import defaultdict

from app import schemas
from app.models import Transaction, SpendCategory, CostCenter


logger = logging.getLogger(__name__)


# ============================================
# CREATE
# ============================================


def create_transaction(db: Session, txn: schemas.TransactionCreate) -> Transaction:
    """Create a transaction with categories."""
    cost_center = _get_or_create_cost_center(db, txn.cost_center_name)
    spend_categories = _resolve_spend_categories(db, txn.spend_category_names or [])
    
    new_tx = Transaction(
        date = txn.date or date.today(),
        description = txn.description,
        cost_center = cost_center,
        spend_categories = spend_categories,
        amount = txn.amount,
        account = txn.account,
        notes = txn.notes,
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx


# ============================================
# READ
# ============================================


def get_transactions(
    session: Session,
    search: Optional[str] = None,
    cost_center_ids: Optional[Union[int, List[int]]] = None,
    spend_category_ids: Optional[Union[int, List[int]]] = None,
    account: Optional[Union[str, List[str]]] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
) -> List[Transaction]:
    """The ONE query function that handles all filtering."""
    query = session.query(Transaction)
    
    # Apply filters
    if search:
        # Safe: SQLAlchemy parameterizes .ilike() to prevent SQL injection
        query = query.filter(Transaction.description.ilike(f"%{search}%"))

    if cost_center_ids:
        ids = [cost_center_ids] if isinstance(cost_center_ids, int) else cost_center_ids
        query = query.filter(Transaction.cost_center_id.in_(ids))

    if spend_category_ids:
        ids = [spend_category_ids] if isinstance(spend_category_ids, int) else spend_category_ids
        query = query.filter(Transaction.spend_categories.any(SpendCategory.id.in_(ids)))
    
    if account:
        accounts = [account] if isinstance(account, str) else account
        query = query.filter(Transaction.account.in_(accounts))

    if start_date:
        query = query.filter(Transaction.date >= start_date)

    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)
    
    return query.all()


def build_filter_query(
    session: Session,
    search: Optional[str] = None,
    cost_center_ids: Optional[Union[int, List[int]]] = None,
    spend_category_ids: Optional[Union[int, List[int]]] = None,
    account: Optional[Union[str, List[str]]] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
):
    """Build filtered query without executing. Used for pagination."""
    query = session.query(Transaction)
    
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))

    if cost_center_ids:
        ids = [cost_center_ids] if isinstance(cost_center_ids, int) else cost_center_ids
        query = query.filter(Transaction.cost_center_id.in_(ids))

    if spend_category_ids:
        ids = [spend_category_ids] if isinstance(spend_category_ids, int) else spend_category_ids
        query = query.filter(Transaction.spend_categories.any(SpendCategory.id.in_(ids)))
    
    if account:
        accounts = [account] if isinstance(account, str) else account
        query = query.filter(Transaction.account.in_(accounts))

    if start_date:
        query = query.filter(Transaction.date >= start_date)

    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)

    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)
    
    return query


# ============================================
# UPDATE
# ============================================


def update_transaction(db: Session, tx_id: int, txn: schemas.TransactionUpdate):
    """Update a transaction with auto-cleanup of orphaned categories."""
    existing = db.get(Transaction, tx_id)
    if not existing:
        return None
    
    # Store old cost center/spend categories for cleanup
    old_cost_center_id = existing.cost_center_id
    old_spend_categories = list(existing.spend_categories)
    
    # Update fields
    update_data = txn.model_dump(exclude_unset=True)
    
    # Handle categories
    if 'cost_center_name' in update_data:
        existing.cost_center = _get_or_create_cost_center(db, update_data.pop('cost_center_name'))
    
    if 'spend_category_names' in update_data:
        existing.spend_categories = _resolve_spend_categories(db, update_data.pop('spend_category_names'))
    
    # Update scalar fields
    for field, value in update_data.items():
        setattr(existing, field, value)
    
    db.commit()
    db.refresh(existing)
    
    # Cleanup orphaned cost center (if changed)
    if old_cost_center_id and old_cost_center_id != existing.cost_center_id:
        _cleanup_orphaned_cost_center(db, old_cost_center_id)
    
    # Cleanup orphaned categories
    _cleanup_orphaned_spend_categories(db, old_spend_categories)

    return existing


# ============================================
# DELETE
# ============================================


def delete_transaction(db: Session, tx_id: int) -> bool:
    """Delete a transaction and auto-cleanup orphaned categories/cost centers."""
    tx = db.get(Transaction, tx_id)
    if not tx:
        return False
    
    # Store references before deletion
    old_cost_center_id = tx.cost_center_id
    old_spend_categories = list(tx.spend_categories)
    
    # Delete the transaction
    db.delete(tx)
    db.commit()
    
    # Cleanup orphaned cost center
    if old_cost_center_id:
        _cleanup_orphaned_cost_center(db, old_cost_center_id)

    # Cleanup orphaned spend categories
    _cleanup_orphaned_spend_categories(db, old_spend_categories)
    
    return True


# ============================================
# METADATA QUERIES
# ============================================


def get_all_cost_centers(session: Session) -> List[CostCenter]:
    """Get all cost centers."""
    return session.query(CostCenter).order_by(CostCenter.name).all()


def get_all_spend_categories(session: Session) -> List[SpendCategory]:
    """Get all spend categories."""
    return session.query(SpendCategory).order_by(SpendCategory.name).all()


def get_unique_accounts(session: Session) -> List[str]:
    """Get all unique account names."""
    return [acc for (acc,) in session.query(Transaction.account).distinct().order_by(Transaction.account).all()]


# ============================================
# ANALYTICS HELPERS
# ============================================


def compute_analytics(transactions: List[Transaction]) -> dict:
    """
    Compute analytics from a list of transactions.
    
    Args:
        transactions: List of Transaction objects (already filtered)
    
    Returns:
        Dictionary with analytics data including balance timeline
    """
    if not transactions:
        return {
            "total_spent": 0.0,
            "total_income": 0.0,
            "total_cash": 0.0,
            "total_transactions": 0,
            "total_cost_centers": 0,
            "total_spend_categories": 0,
            "avg_expense": 0.0,
            "avg_income": 0.0,
            "monthly_spending": [],
            "cost_center_spending": [],
            "spend_category_stats": [],
            "balance_timeline": [],
        }
    
    # Calculate totals
    expenses = [t.amount for t in transactions if t.amount < 0]
    incomes = [t.amount for t in transactions if t.amount > 0]
    
    total_spent = sum(expenses) * -1
    total_income = sum(incomes)
    
    # Group by month with cost center breakdown
    monthly_data = defaultdict(lambda: {
        "total": 0.0,
        "expenses": 0.0,
        "income": 0.0,
        "count": 0,
        "by_cost_center": defaultdict(float)  # NEW - for tooltips
    })
    for t in transactions:
        month_key = t.date.strftime("%Y-%m")
        monthly_data[month_key]["total"] += t.amount
        monthly_data[month_key]["count"] += 1
        if t.amount < 0:
            monthly_data[month_key]["expenses"] += t.amount
            # Track expenses by cost center for tooltip breakdown
            monthly_data[month_key]["by_cost_center"][t.cost_center.name] += t.amount
        else:
            monthly_data[month_key]["income"] += t.amount
    
    # Group by cost center
    cost_center_data = defaultdict(lambda: {
        "id": None, "name": None, "total": 0.0, "expenses": 0.0, "income": 0.0, "count": 0
    })
    for t in transactions:
        cc_id = t.cost_center_id
        if cost_center_data[cc_id]["id"] is None:
            cost_center_data[cc_id]["id"] = t.cost_center_id
            cost_center_data[cc_id]["name"] = t.cost_center.name
        
        cost_center_data[cc_id]["total"] += t.amount
        cost_center_data[cc_id]["count"] += 1
        if t.amount < 0:
            cost_center_data[cc_id]["expenses"] += t.amount
        else:
            cost_center_data[cc_id]["income"] += t.amount
    
    # Group by spend category
    spend_category_data = defaultdict(lambda: {
        "id": None, "name": None, "total": 0.0, "expenses": 0.0, "income": 0.0, "count": 0
    })
    for t in transactions:
        for cat in t.spend_categories:
            cat_id = cat.id
            if spend_category_data[cat_id]["id"] is None:
                spend_category_data[cat_id]["id"] = cat.id
                spend_category_data[cat_id]["name"] = cat.name
            
            spend_category_data[cat_id]["total"] += t.amount
            spend_category_data[cat_id]["count"] += 1
            if t.amount < 0:
                spend_category_data[cat_id]["expenses"] += t.amount
            else:
                spend_category_data[cat_id]["income"] += t.amount
    
    # Get unique cost centers and spend categories
    unique_cost_centers = set(t.cost_center_id for t in transactions)
    unique_spend_categories = set(cat.id for t in transactions for cat in t.spend_categories)
    
    # NEW: Compute balance timeline
    # Sort transactions chronologically by (date, id) for deterministic ordering
    sorted_txns = sorted(transactions, key=lambda t: (t.date, t.id))
    balance = 0.0
    balance_timeline = []
    
    for t in sorted_txns:
        balance += t.amount
        balance_timeline.append({
            "date": t.date,
            "balance": balance,
            "description": t.description,
            "amount": t.amount,
            "cost_center_name": t.cost_center.name,
        })
    
    # total_cash is the final balance (last point in timeline)
    final_balance = balance_timeline[-1]["balance"] if balance_timeline else 0.0
    
    return {
        "total_spent": total_spent,
        "total_income": total_income,
        "total_cash": final_balance,  # Updated to use timeline's final balance
        "total_transactions": len(transactions),
        "total_cost_centers": len(unique_cost_centers),
        "total_spend_categories": len(unique_spend_categories),
        "avg_expense": sum(expenses) / len(expenses) if expenses else 0.0,
        "avg_income": sum(incomes) / len(incomes) if incomes else 0.0,
        "monthly_spending": [
            {
                "month": month,
                "total": data["total"],
                "expense_total": data["expenses"],
                "income_total": data["income"],
                "transaction_count": data["count"],
                "by_cost_center": dict(data["by_cost_center"]),  # Convert defaultdict to dict
            }
            for month, data in sorted(monthly_data.items())  # Sorted by month ASC
        ],
        # Sort by expense ASC because expenses are negative
        # -500 < -100, so ASC gives us biggest spending first
        "cost_center_spending": [
            {
                "cost_center_id": data["id"],
                "cost_center_name": data["name"],
                "total": data["total"],
                "expense_total": data["expenses"],
                "income_total": data["income"],
                "transaction_count": data["count"],
            }
            for data in sorted(cost_center_data.values(), key=lambda x: x["expenses"])  # Sorted by expense ASC
        ],
        # Sort by expense ASC because expenses are negative
        # -500 < -100, so ASC gives us biggest spending first
        "spend_category_stats": [
            {
                "spend_category_id": data["id"],
                "spend_category_name": data["name"],
                "total": data["total"],
                "expense_total": data["expenses"],
                "income_total": data["income"],
                "transaction_count": data["count"],
            }
            for data in sorted(spend_category_data.values(), key=lambda x: x["expenses"])  # Sorted by expense ASC
        ],
        "balance_timeline": balance_timeline,  # NEW
    }


# ============================================
# INTERNAL HELPERS
# ============================================


def _get_or_create_cost_center(db: Session, name: Optional[str]) -> CostCenter:
    """Get or create a cost center."""
    if not name or not name.strip():
        name = "Uncategorized"
    
    cost_center = db.query(CostCenter).filter(CostCenter.name == name).first()
    if not cost_center:
        cost_center = CostCenter(name=name)
        db.add(cost_center)
        db.commit()
        db.refresh(cost_center)
    
    return cost_center


def _get_or_create_spend_category(db: Session, name: Optional[str]) -> SpendCategory:
    """Get or create a spend category."""
    if not name or not name.strip():
        name = "Uncategorized"
    
    spend_category = db.query(SpendCategory).filter(SpendCategory.name == name).first()
    if not spend_category:
        spend_category = SpendCategory(name=name)
        db.add(spend_category)
        db.commit()
        db.refresh(spend_category)
    
    return spend_category


def _resolve_spend_categories(db: Session, names: List[str]) -> List[SpendCategory]:
    """Get or create spend categories from names."""
    if not names:
        names = ["Uncategorized"]
    
    categories = []
    seen = set()
    
    for name in names:
        name = name.strip()
        if not name or name in seen:
            continue
        
        category = _get_or_create_spend_category(db, name)
        categories.append(category)
        seen.add(name)
    
    return categories if categories else [_get_or_create_spend_category(db, "Uncategorized")]


# ============================================
# CLEANUP HELPERS (Auto-cleanup orphaned items)
# ============================================


def _cleanup_orphaned_spend_categories(db: Session, old_categories: List[SpendCategory]) -> None:
    """
    Delete spend categories that are no longer used by any transactions.
    Called after transaction update/delete.
    """
    for category in old_categories:
        try:
            # Refresh to get latest state from database
            db.refresh(category)
            
            # Check if this category is still used by any transaction
            if not category.transactions:
                db.delete(category)
                logger.info(f"Cleaned up orphaned spend category: {category.name} (ID: {category.id})")
        except SQLAlchemyError as e:
            # Category might already be deleted or session issues
            logger.warning(f"Failed to cleanup spend category {category.id}: {e}")
    
    # Commit all deletions at once
    try:
        db.commit()
    except SQLAlchemyError as e:
        logger.error(f"Failed to commit spend category cleanup: {e}")
        db.rollback()


def _cleanup_orphaned_cost_center(db: Session, cost_center_id: int) -> None:
    """
    Delete a cost center if it's no longer used by any transactions.
    Called after transaction update/delete.
    """
    try:
        cost_center = db.get(CostCenter, cost_center_id)
        if not cost_center:
            return
        
        # Refresh to get latest state
        db.refresh(cost_center)
        
        # Check if this cost center is still used
        if not cost_center.transactions:
            db.delete(cost_center)
            db.commit()
            logger.info(f"Cleaned up orphaned cost center: {cost_center.name} (ID: {cost_center.id})")
    except SQLAlchemyError as e:
        logger.error(f"Failed to cleanup cost center {cost_center_id}: {e}")
        db.rollback()
