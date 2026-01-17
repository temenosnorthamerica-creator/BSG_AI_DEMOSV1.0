"""
Loan models for personal and auto loans.
"""
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class LoanPurpose(str, Enum):
    """Purpose of personal loan"""
    DEBT_CONSOLIDATION = "DEBT_CONSOLIDATION"
    HOME_IMPROVEMENT = "HOME_IMPROVEMENT"
    MEDICAL_EXPENSES = "MEDICAL_EXPENSES"
    EDUCATION = "EDUCATION"
    TRAVEL = "TRAVEL"
    WEDDING = "WEDDING"
    EMERGENCY = "EMERGENCY"
    OTHER = "OTHER"


class EmploymentType(str, Enum):
    """Type of employment"""
    SALARIED = "SALARIED"
    SELF_EMPLOYED = "SELF_EMPLOYED"
    BUSINESS_OWNER = "BUSINESS_OWNER"
    RETIRED = "RETIRED"
    OTHER = "OTHER"


class VehicleType(str, Enum):
    """Type of vehicle"""
    NEW = "NEW"
    USED = "USED"


class LoanStatus(str, Enum):
    """Status of a loan application"""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"


class LoanType(str, Enum):
    """Type of loan"""
    PERSONAL = "PERSONAL"
    AUTO = "AUTO"


class VehicleInfo(BaseModel):
    """Vehicle information for auto loans"""
    brand: str = Field(..., min_length=1, max_length=50, description="Vehicle brand")
    model: str = Field(..., min_length=1, max_length=50, description="Vehicle model")
    year: int = Field(..., ge=2020, le=2027, description="Vehicle year")
    vehicle_type: VehicleType = Field(..., description="New or used vehicle")
    vin: Optional[str] = Field(None, min_length=17, max_length=17, description="Vehicle Identification Number")


class PersonalLoanCreate(BaseModel):
    """Request model for creating a personal loan"""
    customer_id: str = Field(..., description="Customer identifier")
    amount: Decimal = Field(..., ge=5000, le=500000, description="Loan amount in MXN")
    term_months: int = Field(..., ge=6, le=60, description="Loan term in months")
    purpose: LoanPurpose = Field(..., description="Purpose of the loan")
    monthly_income: Decimal = Field(..., gt=0, description="Monthly income in MXN")
    employment_type: EmploymentType = Field(..., description="Type of employment")
    employment_months: int = Field(..., ge=0, description="Months at current employment")


class AutoLoanCreate(BaseModel):
    """Request model for creating an auto loan"""
    customer_id: str = Field(..., description="Customer identifier")
    vehicle_price: Decimal = Field(..., gt=0, description="Total vehicle price in MXN")
    down_payment: Decimal = Field(..., ge=0, description="Down payment amount in MXN")
    term_months: int = Field(..., ge=12, le=72, description="Loan term in months")
    vehicle_info: VehicleInfo = Field(..., description="Vehicle information")
    monthly_income: Decimal = Field(..., gt=0, description="Monthly income in MXN")

    def get_financed_amount(self) -> Decimal:
        """Calculate the amount to be financed"""
        return self.vehicle_price - self.down_payment


class LoanSimulationRequest(BaseModel):
    """Request model for loan simulation"""
    loan_type: LoanType = Field(..., description="Type of loan")
    amount: Decimal = Field(..., gt=0, description="Loan amount")
    term_months: int = Field(..., gt=0, description="Loan term in months")
    vehicle_type: Optional[VehicleType] = Field(None, description="Vehicle type for auto loans")


class LoanSimulationResponse(BaseModel):
    """Response model for loan simulation"""
    loan_type: LoanType
    amount: Decimal
    term_months: int
    interest_rate: Decimal
    monthly_payment: Decimal
    total_payment: Decimal
    total_interest: Decimal
    currency: str = "MXN"


class LoanResponse(BaseModel):
    """Response model for loan creation"""
    loan_id: str
    arrangement_id: str
    customer_id: str
    loan_type: LoanType
    status: LoanStatus
    amount: Decimal
    term_months: int
    interest_rate: Decimal
    monthly_payment: Decimal
    total_payment: Decimal
    currency: str = "MXN"
    created_at: datetime
    disbursement_date: Optional[datetime] = None


class LoanSummary(BaseModel):
    """Summary model for loan list"""
    loan_id: str
    loan_type: LoanType
    status: LoanStatus
    amount: Decimal
    remaining_balance: Decimal
    monthly_payment: Decimal
    next_payment_date: Optional[datetime] = None
    currency: str = "MXN"


class LoanDetail(BaseModel):
    """Detailed loan information"""
    loan_id: str
    arrangement_id: str
    customer_id: str
    loan_type: LoanType
    status: LoanStatus
    amount: Decimal
    remaining_balance: Decimal
    term_months: int
    interest_rate: Decimal
    monthly_payment: Decimal
    total_payment: Decimal
    total_interest: Decimal
    payments_made: int
    payments_remaining: int
    next_payment_date: Optional[datetime] = None
    currency: str = "MXN"
    created_at: datetime
    disbursement_date: Optional[datetime] = None
    vehicle_info: Optional[VehicleInfo] = None
