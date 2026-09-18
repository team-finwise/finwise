from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date

TransactionType = Literal["expense", "income", "savings", "debt"]


class TransactionBase(BaseModel):
    date: str = Field(..., description="Transaction date (YYYY-MM-DD)")
    description: str = Field(..., min_length=1, max_length=255, description="Short description or merchant name")
    category: str = Field(..., min_length=1, max_length=50, description="Expense or income category")
    amount: float = Field(..., gt=0, description="Transaction amount in INR")
    type: TransactionType = Field("expense", description="Transaction type: expense, income, savings, debt")
    payment_method: Optional[str] = Field("UPI", description="Payment method: UPI, Credit Card, Debit Card, Net Banking, Cash")
    notes: Optional[str] = Field(None, max_length=500, description="Optional notes")


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[TransactionType] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True


class TransactionSummary(BaseModel):
    total_income: float = 0.0
    total_expense: float = 0.0
    total_savings: float = 0.0
    total_debt: float = 0.0
    net_cash_flow: float = 0.0
    total_count: int = 0
