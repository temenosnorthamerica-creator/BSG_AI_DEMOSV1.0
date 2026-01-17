"""
Loan service for business logic operations.
"""
import logging
from decimal import Decimal
from typing import Optional, List

from app.adapters.transact.factory import get_transact_adapter
from app.models.loan import (
    PersonalLoanCreate,
    AutoLoanCreate,
    LoanResponse,
    LoanSimulationRequest,
    LoanSimulationResponse,
    LoanSummary,
    LoanDetail,
    LoanType,
    VehicleType,
)
from app.models.customer import Customer, CustomerSearchQuery, CustomerCreate
from app.models.payment_schedule import PaymentSchedule

logger = logging.getLogger(__name__)


class LoanService:
    """
    Service class for loan operations.

    This service handles business logic for:
    - Loan eligibility validation
    - Loan creation coordination
    - Payment schedule management
    """

    # Business rules configuration
    MIN_PERSONAL_LOAN = Decimal("5000")
    MAX_PERSONAL_LOAN = Decimal("500000")
    MIN_AUTO_DOWN_PAYMENT_PERCENT = Decimal("0.10")  # 10%
    MAX_PAYMENT_TO_INCOME_RATIO = Decimal("0.40")  # 40%
    MIN_AGE = 18
    MAX_AGE_AT_TERM_END = 75

    def __init__(self):
        self.transact_adapter = get_transact_adapter()

    # Customer Operations
    async def search_customers(self, query: CustomerSearchQuery) -> List[Customer]:
        """Search for customers"""
        return await self.transact_adapter.search_customers(query)

    async def get_customer(self, customer_id: str) -> Optional[Customer]:
        """Get customer by ID"""
        return await self.transact_adapter.get_customer(customer_id)

    async def create_customer(self, customer: CustomerCreate) -> Customer:
        """Create a new customer"""
        return await self.transact_adapter.create_customer(customer)

    # Loan Eligibility Validation
    def validate_personal_loan_eligibility(
        self, loan: PersonalLoanCreate, customer: Optional[Customer] = None
    ) -> dict:
        """
        Validate eligibility for a personal loan.

        Returns:
            dict: {
                "eligible": bool,
                "errors": List[str],
                "warnings": List[str]
            }
        """
        errors = []
        warnings = []

        # Amount validation
        if loan.amount < self.MIN_PERSONAL_LOAN:
            errors.append(
                f"El monto mínimo para préstamo personal es ${self.MIN_PERSONAL_LOAN:,.2f} MXN"
            )
        if loan.amount > self.MAX_PERSONAL_LOAN:
            errors.append(
                f"El monto máximo para préstamo personal es ${self.MAX_PERSONAL_LOAN:,.2f} MXN"
            )

        # Payment to income ratio
        simulation = LoanSimulationRequest(
            loan_type=LoanType.PERSONAL,
            amount=loan.amount,
            term_months=loan.term_months,
        )
        # Note: In production, we'd await this, but for validation we use estimates
        estimated_rate = Decimal("14.50")  # Average rate
        monthly_payment = self._estimate_monthly_payment(
            loan.amount, estimated_rate, loan.term_months
        )

        payment_ratio = monthly_payment / loan.monthly_income
        if payment_ratio > self.MAX_PAYMENT_TO_INCOME_RATIO:
            errors.append(
                f"La mensualidad estimada (${monthly_payment:,.2f}) excede el 40% de su ingreso mensual"
            )

        # Employment validation
        if loan.employment_months < 6:
            warnings.append(
                "La antigüedad laboral es menor a 6 meses, esto podría afectar la aprobación"
            )

        # Credit score check (if customer provided)
        if customer and customer.credit_score:
            if customer.credit_score < 600:
                errors.append(
                    "El score crediticio es insuficiente para este producto"
                )
            elif customer.credit_score < 650:
                warnings.append(
                    "El score crediticio es bajo, podría requerir revisión adicional"
                )

        return {
            "eligible": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }

    def validate_auto_loan_eligibility(
        self, loan: AutoLoanCreate, customer: Optional[Customer] = None
    ) -> dict:
        """
        Validate eligibility for an auto loan.

        Returns:
            dict: {
                "eligible": bool,
                "errors": List[str],
                "warnings": List[str]
            }
        """
        errors = []
        warnings = []

        # Down payment validation
        min_down_payment = loan.vehicle_price * self.MIN_AUTO_DOWN_PAYMENT_PERCENT
        if loan.down_payment < min_down_payment:
            errors.append(
                f"El enganche mínimo es del 10% (${min_down_payment:,.2f} MXN)"
            )

        # Financed amount
        financed_amount = loan.get_financed_amount()
        if financed_amount <= 0:
            errors.append("El monto a financiar debe ser mayor a cero")

        # Payment to income ratio
        vehicle_type = "NEW" if loan.vehicle_info.vehicle_type == VehicleType.NEW else "USED"
        estimated_rate = Decimal("10.00") if vehicle_type == "NEW" else Decimal("12.00")
        monthly_payment = self._estimate_monthly_payment(
            financed_amount, estimated_rate, loan.term_months
        )

        payment_ratio = monthly_payment / loan.monthly_income
        if payment_ratio > self.MAX_PAYMENT_TO_INCOME_RATIO:
            errors.append(
                f"La mensualidad estimada (${monthly_payment:,.2f}) excede el 40% de su ingreso mensual"
            )

        # Vehicle age validation for used vehicles
        if loan.vehicle_info.vehicle_type == VehicleType.USED:
            from datetime import date
            current_year = date.today().year
            vehicle_age = current_year - loan.vehicle_info.year
            if vehicle_age > 5:
                warnings.append(
                    f"El vehículo tiene {vehicle_age} años de antigüedad, esto podría afectar las condiciones"
                )
            if vehicle_age > 10:
                errors.append(
                    "No se financian vehículos con más de 10 años de antigüedad"
                )

        # Credit score check (if customer provided)
        if customer and customer.credit_score:
            if customer.credit_score < 600:
                errors.append(
                    "El score crediticio es insuficiente para este producto"
                )
            elif customer.credit_score < 650:
                warnings.append(
                    "El score crediticio es bajo, podría requerir revisión adicional"
                )

        return {
            "eligible": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
        }

    # Loan Operations
    async def create_personal_loan(self, loan: PersonalLoanCreate) -> LoanResponse:
        """Create a personal loan after validation"""
        # Get customer for validation
        customer = await self.get_customer(loan.customer_id)

        # Validate eligibility
        validation = self.validate_personal_loan_eligibility(loan, customer)
        if not validation["eligible"]:
            raise ValueError("; ".join(validation["errors"]))

        # Create loan in Transact
        return await self.transact_adapter.create_personal_loan(loan)

    async def create_auto_loan(self, loan: AutoLoanCreate) -> LoanResponse:
        """Create an auto loan after validation"""
        # Get customer for validation
        customer = await self.get_customer(loan.customer_id)

        # Validate eligibility
        validation = self.validate_auto_loan_eligibility(loan, customer)
        if not validation["eligible"]:
            raise ValueError("; ".join(validation["errors"]))

        # Create loan in Transact
        return await self.transact_adapter.create_auto_loan(loan)

    async def get_loan(self, loan_id: str) -> Optional[LoanDetail]:
        """Get loan details by ID"""
        return await self.transact_adapter.get_loan(loan_id)

    async def get_customer_loans(self, customer_id: str) -> List[LoanSummary]:
        """Get all loans for a customer"""
        return await self.transact_adapter.get_customer_loans(customer_id)

    # Simulation
    async def simulate_loan(
        self, simulation: LoanSimulationRequest
    ) -> LoanSimulationResponse:
        """Simulate a loan without creating it"""
        return await self.transact_adapter.simulate_loan(simulation)

    # Payment Schedule
    async def get_payment_schedule(self, loan_id: str) -> Optional[PaymentSchedule]:
        """Get payment schedule for a loan"""
        return await self.transact_adapter.get_payment_schedule(loan_id)

    # Helper Methods
    def _estimate_monthly_payment(
        self, principal: Decimal, annual_rate: Decimal, term_months: int
    ) -> Decimal:
        """Estimate monthly payment for validation purposes"""
        if annual_rate == 0:
            return principal / term_months

        monthly_rate = annual_rate / Decimal("100") / Decimal("12")
        numerator = monthly_rate * ((1 + monthly_rate) ** term_months)
        denominator = ((1 + monthly_rate) ** term_months) - 1

        return principal * (numerator / denominator)


# Singleton instance
_loan_service: Optional[LoanService] = None


def get_loan_service() -> LoanService:
    """Get singleton instance of LoanService"""
    global _loan_service
    if _loan_service is None:
        _loan_service = LoanService()
    return _loan_service
