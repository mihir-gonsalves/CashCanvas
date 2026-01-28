# app/schemas.py - pydantic enforces data integrity by enabling type checking into Python's more lax OOP
from pydantic import BaseModel, Field, field_validator

import datetime
from typing import Optional, List


# ============================================
# COST CENTER SCHEMAS
# ============================================


class CostCenterBase(BaseModel):
    name: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9\s\-'/&,]+$")

    @field_validator('name', mode='before')
    @classmethod
    def default_to_uncategorized(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            return "Uncategorized"
        return v.strip()


class CostCenterCreate(CostCenterBase):
    pass


class CostCenterWithID(CostCenterBase):
    id: int

    class Config:
        from_attributes = True


# ============================================
# SPEND CATEGORY SCHEMAS
# ============================================


class SpendCategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9\s\-'/&]+$")

    @field_validator('name', mode='before')
    @classmethod
    def default_to_uncategorized(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            return "Uncategorized"
        return v.strip()


class SpendCategoryCreate(SpendCategoryBase):
    pass


class SpendCategoryWithID(SpendCategoryBase):
    id: int

    class Config:
        from_attributes = True


# ============================================
# TRANSACTION SCHEMAS
# ============================================


class TransactionBase(BaseModel):
    date: datetime.date
    description: str = Field(min_length=1, max_length=200)
    amount: float
    account: str = Field(min_length=1, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=200)

    @field_validator("description", "account", mode="before")
    @classmethod
    def strip_and_validate(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v.strip()
    
    @field_validator("notes", mode="before")
    @classmethod
    def strip_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        return v.strip()


class TransactionCreate(TransactionBase):
    cost_center_name: Optional[str] = None
    spend_category_names: Optional[List[str]] = Field(default_factory=list)

    @field_validator("cost_center_name", mode="before")
    @classmethod
    def default_cost_center(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            return "Uncategorized"
        return v.strip()

    @field_validator("spend_category_names", mode="before")
    @classmethod
    def default_spend_categories(cls, v: Optional[List[str]]) -> List[str]:
        if not v or not any(name.strip() for name in v):
            return ["Uncategorized"]
        cleaned = [name.strip() for name in v if name.strip()]
        return list(dict.fromkeys(cleaned))


class TransactionUpdate(BaseModel):
    date: Optional[datetime.date] = None
    description: Optional[str] = Field(default=None, min_length=1, max_length=200)
    cost_center_name: Optional[str] = None
    spend_category_names: Optional[List[str]] = None
    amount: Optional[float] = None
    account: Optional[str] = Field(default=None, min_length=1, max_length=50)
    notes: Optional[str] = Field(default=None, max_length=200)

    @field_validator("description", "account", mode="before")
    @classmethod
    def validate_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if v and v.strip() else None

    @field_validator("cost_center_name", mode="before")
    @classmethod
    def update_cost_center(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip() or "Uncategorized"

    @field_validator("spend_category_names", mode="before")
    @classmethod
    def update_spend_categories(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return None
        cleaned = [name.strip() for name in v if name.strip()]
        return cleaned or ["Uncategorized"]
    
    @field_validator("notes", mode="before")
    @classmethod
    def update_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return v.strip() if v.strip() else None


class TransactionWithID(TransactionBase):
    id: int
    cost_center: CostCenterWithID
    spend_categories: List[SpendCategoryWithID] = Field(default_factory=list)

    class Config:
        from_attributes = True


class TransactionCompact(BaseModel):
    """Compact transaction representation with only IDs for relationships."""
    id: int
    date: datetime.date
    description: str
    amount: float
    account: str
    cost_center_id: int
    spend_category_ids: List[int]
    notes: Optional[str]

    class Config:
        from_attributes = True


# ============================================
# RESPONSE WRAPPERS
# ============================================


class TransactionListResponse(BaseModel):
    transactions: List[TransactionWithID]
    count: int


class PaginatedTransactionResponse(BaseModel):
    """Paginated response with compact transactions and metadata."""
    transactions: List[TransactionCompact]
    cost_centers: List[CostCenterWithID]
    spend_categories: List[SpendCategoryWithID]
    page: int
    page_size: int
    total: int
    total_pages: int


class CostCenterListResponse(BaseModel):
    cost_centers: List[CostCenterWithID]
    count: int


class SpendCategoryListResponse(BaseModel):
    spend_categories: List[SpendCategoryWithID]
    count: int


# ============================================
# ANALYTICS SCHEMAS
# ============================================


class BalanceTimelinePoint(BaseModel):
    """Individual point in the balance timeline."""
    date: datetime.date
    balance: float
    description: str
    amount: float
    cost_center_name: str


class MonthlySpending(BaseModel):
    """Spending aggregated by month with cost center breakdown."""
    month: str  # Format: "2026-01"
    total: float
    expense_total: float
    income_total: float
    transaction_count: int
    by_cost_center: dict[str, float] = Field(default_factory=dict)  # NEW - for tooltips


class CostCenterSpending(BaseModel):
    """Spending aggregated by cost center."""
    cost_center_id: int
    cost_center_name: str
    total: float
    expense_total: float
    income_total: float
    transaction_count: int


class SpendCategoryStats(BaseModel):
    """Spending aggregated by spend category."""
    spend_category_id: int
    spend_category_name: str
    total: float
    expense_total: float
    income_total: float
    transaction_count: int


class AnalyticsResponse(BaseModel):
    """Complete analytics response with balance timeline."""
    total_spent: float
    total_income: float
    total_cash: float  # Final balance after all filtered transactions
    total_transactions: int
    total_cost_centers: int
    total_spend_categories: int
    avg_expense: float
    avg_income: float
    monthly_spending: List[MonthlySpending]
    cost_center_spending: List[CostCenterSpending]
    spend_category_stats: List[SpendCategoryStats]
    balance_timeline: List[BalanceTimelinePoint] = Field(default_factory=list)  # NEW
