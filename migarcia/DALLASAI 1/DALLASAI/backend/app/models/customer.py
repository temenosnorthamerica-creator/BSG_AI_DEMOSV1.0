"""
Customer models for loan applications.
"""
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class DocumentType(str, Enum):
    """Type of identification document"""
    INE = "INE"
    PASSPORT = "PASSPORT"
    CURP = "CURP"
    OTHER = "OTHER"


class Address(BaseModel):
    """Customer address"""
    street: str = Field(..., description="Street address")
    exterior_number: str = Field(..., description="Exterior number")
    interior_number: Optional[str] = Field(None, description="Interior number")
    neighborhood: str = Field(..., description="Neighborhood/Colonia")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State")
    postal_code: str = Field(..., min_length=5, max_length=5, description="Postal code")
    country: str = Field(default="Mexico", description="Country")


class ProductSummary(BaseModel):
    """Summary of customer's existing products"""
    product_id: str
    product_type: str
    product_name: str
    status: str
    balance: Optional[Decimal] = None
    currency: str = "MXN"


class CustomerCreate(BaseModel):
    """Request model for creating a new customer"""
    document_type: DocumentType = Field(..., description="Type of ID document")
    document_number: str = Field(..., min_length=10, max_length=20, description="Document number")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    middle_name: Optional[str] = Field(None, max_length=100, description="Middle name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    second_last_name: Optional[str] = Field(None, max_length=100, description="Second last name")
    birth_date: date = Field(..., description="Date of birth")
    email: EmailStr = Field(..., description="Email address")
    phone: str = Field(..., min_length=10, max_length=15, description="Phone number")
    address: Address = Field(..., description="Customer address")


class CustomerSearchQuery(BaseModel):
    """Query parameters for customer search"""
    document_number: Optional[str] = Field(None, description="Search by document number")
    name: Optional[str] = Field(None, description="Search by name (partial match)")
    account_number: Optional[str] = Field(None, description="Search by account number")
    phone: Optional[str] = Field(None, description="Search by phone number")


class Customer(BaseModel):
    """Customer information model"""
    id: str = Field(..., description="Customer ID")
    document_type: DocumentType
    document_number: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    second_last_name: Optional[str] = None
    full_name: str
    birth_date: date
    email: EmailStr
    phone: str
    address: Address
    credit_score: Optional[int] = Field(None, ge=300, le=850, description="Credit score")
    active_products: List[ProductSummary] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None

    @property
    def age(self) -> int:
        """Calculate customer age"""
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )


class CustomerResponse(BaseModel):
    """Response model for customer operations"""
    id: str
    document_type: DocumentType
    document_number: str
    full_name: str
    email: EmailStr
    phone: str
    credit_score: Optional[int] = None
    active_products_count: int = 0
    created_at: datetime
