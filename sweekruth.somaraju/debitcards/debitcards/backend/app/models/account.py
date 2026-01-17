from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class AccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    INVESTMENT = "investment"


class Account(BaseModel):
    id: str
    account_number: str
    name: str
    account_type: AccountType
    balance: float = Field(ge=0)
    currency: str = "USD"
    is_active: bool = True


class AccountBalance(BaseModel):
    account_id: str
    account_name: str
    balance: float
    currency: str
    available_balance: float


class AccountResponse(BaseModel):
    success: bool
    data: Optional[Account] = None
    message: Optional[str] = None


class AccountListResponse(BaseModel):
    success: bool
    data: list[Account]
    message: Optional[str] = None
