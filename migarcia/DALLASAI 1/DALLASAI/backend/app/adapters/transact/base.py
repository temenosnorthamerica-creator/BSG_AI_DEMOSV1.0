"""
Base interface for Transact API adapter.
"""
from abc import ABC, abstractmethod
from typing import Optional, List
from decimal import Decimal

from app.models.loan import (
    PersonalLoanCreate,
    AutoLoanCreate,
    LoanResponse,
    LoanSimulationRequest,
    LoanSimulationResponse,
    LoanSummary,
    LoanDetail,
)
from app.models.customer import Customer, CustomerSearchQuery, CustomerCreate
from app.models.payment_schedule import PaymentSchedule


class TransactAdapterBase(ABC):
    """Abstract base class for Transact API adapter"""

    # Customer Operations
    @abstractmethod
    async def search_customers(self, query: CustomerSearchQuery) -> List[Customer]:
        """Search for customers based on query parameters"""
        pass

    @abstractmethod
    async def get_customer(self, customer_id: str) -> Optional[Customer]:
        """Get customer by ID"""
        pass

    @abstractmethod
    async def create_customer(self, customer: CustomerCreate) -> Customer:
        """Create a new customer"""
        pass

    # Loan Operations
    @abstractmethod
    async def create_personal_loan(self, loan: PersonalLoanCreate) -> LoanResponse:
        """Create a personal loan"""
        pass

    @abstractmethod
    async def create_auto_loan(self, loan: AutoLoanCreate) -> LoanResponse:
        """Create an auto loan"""
        pass

    @abstractmethod
    async def get_loan(self, loan_id: str) -> Optional[LoanDetail]:
        """Get loan details by ID"""
        pass

    @abstractmethod
    async def get_customer_loans(self, customer_id: str) -> List[LoanSummary]:
        """Get all loans for a customer"""
        pass

    # Simulation
    @abstractmethod
    async def simulate_loan(self, simulation: LoanSimulationRequest) -> LoanSimulationResponse:
        """Simulate a loan without creating it"""
        pass

    # Payment Schedule
    @abstractmethod
    async def get_payment_schedule(self, loan_id: str) -> Optional[PaymentSchedule]:
        """Get payment schedule for a loan"""
        pass

    # Product Catalog
    @abstractmethod
    async def get_interest_rate(self, loan_type: str, term_months: int, vehicle_type: Optional[str] = None) -> Decimal:
        """Get interest rate for a loan type"""
        pass
