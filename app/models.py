# app/models.py - sets up SQLite database tables using SQLAlchemy ORM
from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Table, Index
from sqlalchemy.orm import declarative_base, relationship


Base = declarative_base()


# ============================================
# Association Table
# ============================================


transaction_spend_categories = Table(
    'transaction_spend_categories',
    Base.metadata,
    Column('transaction_id', Integer, ForeignKey('transactions.id'), primary_key=True),
    Column('spend_category_id', Integer, ForeignKey('spend_categories.id'), primary_key=True)
)


# ============================================
# Cost Center Model
# ============================================


class CostCenter(Base):
    """Top-level grouping for spending (e.g., 'Meals', 'Car', 'Health & Wellness')"""
    __tablename__ = "cost_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    # One-to-many relationship with transactions
    transactions = relationship(
        "Transaction",
        back_populates="cost_center",
    )

    def __repr__(self):
        return f"<CostCenter(id={self.id}, name={self.name})>"


# ============================================
# Spend Category Model
# ============================================


class SpendCategory(Base):
    """
    Spend categories that can be used across multiple cost centers.
    Each transaction can have multiple spend categories.
    """
    __tablename__ = "spend_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)

    # Many-to-many with transactions
    transactions = relationship(
        "Transaction",
        secondary=transaction_spend_categories,
        back_populates="spend_categories"
    )

    def __repr__(self):
        return f"<SpendCategory(id={self.id}, name={self.name})>"


# ============================================
# Transaction Model
# ============================================


class Transaction(Base):
    """A financial transaction linked optionally to one cost center and multiple spend categories."""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    account = Column(String, nullable=False, index=True)
    notes = Column(String, nullable=True)
    cost_center_id = Column(Integer, ForeignKey('cost_centers.id'), nullable=False)

    # Many-to-one with cost center
    cost_center = relationship(
        "CostCenter",
        back_populates="transactions",
        passive_deletes=True
    )

    # Many-to-many with spend categories
    spend_categories = relationship(
        "SpendCategory",
        secondary=transaction_spend_categories,
        back_populates="transactions"
    )

    __table_args__ = (
        Index('idx_account_date', 'account', 'date'),
        Index('idx_cost_center', 'cost_center_id'),
    )

    def __repr__(self):
        return (
            f"<Transaction(id={self.id}, date={self.date}, amount={self.amount}, "
            f"account={self.account}, cost_center_id={self.cost_center_id})>"
        )
