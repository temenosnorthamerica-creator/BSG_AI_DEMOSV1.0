from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TransactionType(str, Enum):
    WITHDRAWAL = "WITHDRAWAL"
    CASH_DEPOSIT = "CASH_DEPOSIT"
    CHECK_DEPOSIT = "CHECK_DEPOSIT"
    TRANSFER = "TRANSFER"
    BALANCE_INQUIRY = "BALANCE_INQUIRY"


class TransactionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    PENDING = "PENDING"


class Transaction(BaseModel):
    id: str
    event_id: str
    transaction_type: TransactionType
    card_number: str
    account_id: str
    account_name: str
    amount: float = Field(ge=0)
    currency: str = "USD"
    balance_before: float
    balance_after: float
    status: TransactionStatus
    timestamp: datetime
    metadata: Dict[str, Any] = {}


class WithdrawRequest(BaseModel):
    account_id: str
    amount: float = Field(gt=0, le=10000)


class DepositCashRequest(BaseModel):
    account_id: str
    amount: float = Field(gt=0, le=10000)


class DepositCheckRequest(BaseModel):
    account_id: str
    amount: float = Field(gt=0, le=50000)
    check_number: str = Field(..., min_length=1)


class TransferRequest(BaseModel):
    source_account_id: str
    destination_account_id: str
    amount: float = Field(gt=0, le=50000)


class BalanceInquiryRequest(BaseModel):
    account_id: str


class TransactionResponse(BaseModel):
    success: bool
    message: str
    transaction: Optional[Transaction] = None
    new_balance: Optional[float] = None


class TransactionHistoryResponse(BaseModel):
    success: bool
    transactions: list[Transaction]
    total_count: int
