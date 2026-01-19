# app/schemas.py - pydantic enforces data integrity by enabling type checking into Python's more lax OOP
from pydantic import BaseModel, Field, field_validator

import datetime
from typing import Optional, List


# ============================================
# COST CENTER SCHEMAS
# ============================================


class CostCenterBase(BaseModel):
    name: str = Field(min_length=1, max_length=50, pattern=r"^[a-zA-Z0-9\s\-'/&]+$")

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
        return list(dict.fromkeys(cleaned))  # remove duplicates


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


# ============================================
# RESPONSE WRAPPERS
# ============================================


class TransactionListResponse(BaseModel):
    transactions: List[TransactionWithID]
    count: int


class CostCenterListResponse(BaseModel):
    cost_centers: List[CostCenterWithID]
    count: int


class SpendCategoryListResponse(BaseModel):
    spend_categories: List[SpendCategoryWithID]
    count: int
