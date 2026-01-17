"""
Payment schedule models for loan payments.
"""
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class PaymentStatus(str, Enum):
    """Status of a payment"""
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    PARTIALLY_PAID = "PARTIALLY_PAID"


class Payment(BaseModel):
    """Individual payment in the schedule"""
    payment_number: int = Field(..., ge=1, description="Payment sequence number")
    due_date: date = Field(..., description="Payment due date")
    principal: Decimal = Field(..., ge=0, description="Principal amount")
    interest: Decimal = Field(..., ge=0, description="Interest amount")
    tax: Decimal = Field(..., ge=0, description="Tax (IVA) on interest")
    total_payment: Decimal = Field(..., ge=0, description="Total payment amount")
    remaining_balance: Decimal = Field(..., ge=0, description="Remaining balance after payment")
    status: PaymentStatus = Field(..., description="Payment status")
    paid_date: Optional[date] = Field(None, description="Actual payment date")
    paid_amount: Optional[Decimal] = Field(None, description="Amount actually paid")


class ScheduleSummary(BaseModel):
    """Summary of the payment schedule"""
    total_payments: int = Field(..., description="Total number of payments")
    payments_made: int = Field(..., ge=0, description="Number of payments made")
    payments_pending: int = Field(..., ge=0, description="Number of pending payments")
    payments_overdue: int = Field(..., ge=0, description="Number of overdue payments")
    total_principal: Decimal = Field(..., description="Total principal amount")
    total_interest: Decimal = Field(..., description="Total interest amount")
    total_tax: Decimal = Field(..., description="Total tax amount")
    total_amount: Decimal = Field(..., description="Total amount to pay")
    amount_paid: Decimal = Field(..., ge=0, description="Amount already paid")
    amount_remaining: Decimal = Field(..., ge=0, description="Amount remaining to pay")
    next_payment_date: Optional[date] = Field(None, description="Next payment due date")
    next_payment_amount: Optional[Decimal] = Field(None, description="Next payment amount")


class PaymentSchedule(BaseModel):
    """Complete payment schedule for a loan"""
    loan_id: str = Field(..., description="Loan identifier")
    arrangement_id: str = Field(..., description="Transact arrangement ID")
    customer_id: str = Field(..., description="Customer identifier")
    currency: str = Field(default="MXN", description="Currency code")
    payments: List[Payment] = Field(..., description="List of payments")
    summary: ScheduleSummary = Field(..., description="Schedule summary")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="Generation timestamp")


class PaymentScheduleQuery(BaseModel):
    """Query parameters for payment schedule"""
    loan_id: Optional[str] = Field(None, description="Filter by loan ID")
    status: Optional[PaymentStatus] = Field(None, description="Filter by payment status")
    from_date: Optional[date] = Field(None, description="Filter from date")
    to_date: Optional[date] = Field(None, description="Filter to date")


class NextPaymentInfo(BaseModel):
    """Information about the next payment"""
    loan_id: str
    payment_number: int
    due_date: date
    days_until_due: int
    principal: Decimal
    interest: Decimal
    tax: Decimal
    total_payment: Decimal
    remaining_balance: Decimal
    currency: str = "MXN"
    is_overdue: bool = False
