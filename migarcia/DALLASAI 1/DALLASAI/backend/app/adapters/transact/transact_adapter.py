"""
Transact API adapter implementation.
"""
import httpx
import logging
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional, List

from app.core.config import get_settings
from app.models.loan import (
    PersonalLoanCreate,
    AutoLoanCreate,
    LoanResponse,
    LoanSimulationRequest,
    LoanSimulationResponse,
    LoanSummary,
    LoanDetail,
    LoanStatus,
    LoanType,
    VehicleType,
)
from app.models.customer import (
    Customer,
    CustomerSearchQuery,
    CustomerCreate,
    CustomerResponse,
    Address,
    DocumentType,
    ProductSummary,
)
from app.models.payment_schedule import (
    PaymentSchedule,
    Payment,
    PaymentStatus,
    ScheduleSummary,
)
from .base import TransactAdapterBase

logger = logging.getLogger(__name__)

# Module-level storage for created loans (persists across adapter instances)
# In production, this would be stored in MongoDB
_CREATED_LOANS: dict[str, "LoanResponse"] = {}


class TransactAdapter(TransactAdapterBase):
    """
    Adapter for Temenos Transact API.

    This adapter handles all communication with Transact APIs for:
    - Customer management
    - Loan creation and management
    - Payment schedule retrieval
    """

    def __init__(self):
        settings = get_settings()
        self.base_url = getattr(settings, 'TRANSACT_API_URL', 'https://api.transact.temenos.com')
        self.api_key = getattr(settings, 'TRANSACT_API_KEY', '')
        self.timeout = 30.0

        # Interest rates configuration (would come from Transact Product Catalog in production)
        self.interest_rates = {
            "PERSONAL": {
                6: Decimal("18.00"),
                12: Decimal("16.50"),
                18: Decimal("15.50"),
                24: Decimal("14.50"),
                36: Decimal("13.50"),
                48: Decimal("13.00"),
                60: Decimal("12.50"),
            },
            "AUTO_NEW": {
                12: Decimal("11.00"),
                24: Decimal("10.50"),
                36: Decimal("10.00"),
                48: Decimal("9.50"),
                60: Decimal("9.00"),
                72: Decimal("8.50"),
            },
            "AUTO_USED": {
                12: Decimal("13.00"),
                24: Decimal("12.50"),
                36: Decimal("12.00"),
                48: Decimal("11.50"),
                60: Decimal("11.00"),
                72: Decimal("10.50"),
            },
        }

        # Tax rate for interest (IVA in Mexico)
        self.tax_rate = Decimal("0.16")

    def _get_headers(self) -> dict:
        """Get headers for API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[dict] = None,
        params: Optional[dict] = None,
    ) -> dict:
        """Make HTTP request to Transact API"""
        url = f"{self.base_url}{endpoint}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=self._get_headers(),
                    json=data,
                    params=params,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error calling Transact API: {e}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Request error calling Transact API: {e}")
                raise

    # Customer Operations
    async def search_customers(self, query: CustomerSearchQuery) -> List[Customer]:
        """Search for customers based on query parameters"""
        # In production, this would call Transact Party API
        # For demo, return mock data from sample customers
        mock_customers = self._get_all_mock_customers()
        results = []

        for customer in mock_customers:
            # Search by document number (partial match)
            if query.document_number:
                if query.document_number.upper() in customer.document_number.upper():
                    results.append(customer)
                    continue

            # Search by name (partial match)
            if query.name:
                if query.name.upper() in customer.full_name.upper():
                    results.append(customer)
                    continue

            # Search by phone (partial match)
            if query.phone:
                if query.phone in customer.phone:
                    results.append(customer)
                    continue

        return results

    async def get_customer(self, customer_id: str) -> Optional[Customer]:
        """Get customer by ID"""
        # In production, this would call Transact Party API
        # GET /party/customers/{customerId}
        mock_customers = self._get_all_mock_customers()
        for customer in mock_customers:
            if customer.id == customer_id:
                return customer
        return None

    async def create_customer(self, customer: CustomerCreate) -> Customer:
        """Create a new customer"""
        # In production, this would call Transact Party API
        # POST /party/customers
        customer_id = f"CUST{uuid.uuid4().hex[:6].upper()}"

        return Customer(
            id=customer_id,
            document_type=customer.document_type,
            document_number=customer.document_number,
            first_name=customer.first_name,
            middle_name=customer.middle_name,
            last_name=customer.last_name,
            second_last_name=customer.second_last_name,
            full_name=f"{customer.first_name} {customer.last_name}",
            birth_date=customer.birth_date,
            email=customer.email,
            phone=customer.phone,
            address=customer.address,
            credit_score=None,
            active_products=[],
            created_at=datetime.utcnow(),
        )

    # Loan Operations
    async def create_personal_loan(self, loan: PersonalLoanCreate) -> LoanResponse:
        """Create a personal loan in Transact"""
        # In production, this would call Transact Arrangements API
        # POST /holdings/arrangements

        loan_id = f"PL{uuid.uuid4().hex[:8].upper()}"
        arrangement_id = f"AA{uuid.uuid4().hex[:10].upper()}"

        interest_rate = await self.get_interest_rate("PERSONAL", loan.term_months)
        monthly_payment = self._calculate_monthly_payment(
            loan.amount, interest_rate, loan.term_months
        )
        total_payment = monthly_payment * loan.term_months

        loan_response = LoanResponse(
            loan_id=loan_id,
            arrangement_id=arrangement_id,
            customer_id=loan.customer_id,
            loan_type=LoanType.PERSONAL,
            status=LoanStatus.APPROVED,
            amount=loan.amount,
            term_months=loan.term_months,
            interest_rate=interest_rate,
            monthly_payment=monthly_payment,
            total_payment=total_payment,
            currency="MXN",
            created_at=datetime.utcnow(),
        )

        # Store the loan for later retrieval
        _CREATED_LOANS[loan_id] = loan_response
        logger.info(f"Stored loan {loan_id} for customer {loan.customer_id}. Total loans: {len(_CREATED_LOANS)}")

        return loan_response

    async def create_auto_loan(self, loan: AutoLoanCreate) -> LoanResponse:
        """Create an auto loan in Transact"""
        # In production, this would call Transact Arrangements API
        # POST /holdings/arrangements

        loan_id = f"AL{uuid.uuid4().hex[:8].upper()}"
        arrangement_id = f"AA{uuid.uuid4().hex[:10].upper()}"

        financed_amount = loan.get_financed_amount()
        vehicle_type = "NEW" if loan.vehicle_info.vehicle_type == VehicleType.NEW else "USED"
        interest_rate = await self.get_interest_rate("AUTO", loan.term_months, vehicle_type)
        monthly_payment = self._calculate_monthly_payment(
            financed_amount, interest_rate, loan.term_months
        )
        total_payment = monthly_payment * loan.term_months

        loan_response = LoanResponse(
            loan_id=loan_id,
            arrangement_id=arrangement_id,
            customer_id=loan.customer_id,
            loan_type=LoanType.AUTO,
            status=LoanStatus.APPROVED,
            amount=financed_amount,
            term_months=loan.term_months,
            interest_rate=interest_rate,
            monthly_payment=monthly_payment,
            total_payment=total_payment,
            currency="MXN",
            created_at=datetime.utcnow(),
        )

        # Store the loan for later retrieval
        _CREATED_LOANS[loan_id] = loan_response

        return loan_response

    async def get_loan(self, loan_id: str) -> Optional[LoanDetail]:
        """Get loan details by ID"""
        # In production, this would call Transact Arrangements API
        # GET /holdings/arrangements/{arrangementId}

        # Check in-memory storage first
        if loan_id in _CREATED_LOANS:
            loan = _CREATED_LOANS[loan_id]
            return LoanDetail(
                loan_id=loan.loan_id,
                arrangement_id=loan.arrangement_id,
                customer_id=loan.customer_id,
                loan_type=loan.loan_type,
                status=loan.status,
                amount=loan.amount,
                term_months=loan.term_months,
                interest_rate=loan.interest_rate,
                monthly_payment=loan.monthly_payment,
                total_payment=loan.total_payment,
                currency=loan.currency,
                created_at=loan.created_at,
                remaining_balance=loan.amount,  # For demo, assuming no payments yet
                total_interest=loan.total_payment - loan.amount,
                payments_made=0,
                payments_remaining=loan.term_months,
            )
        return None

    async def get_customer_loans(self, customer_id: str) -> List[LoanSummary]:
        """Get all loans for a customer"""
        # In production, this would call Transact Arrangements API
        # GET /holdings/arrangements?customerId={customerId}

        logger.info(f"Getting loans for customer {customer_id}. Total loans in storage: {len(_CREATED_LOANS)}")

        # Filter loans by customer_id from in-memory storage
        customer_loans = [
            loan for loan in _CREATED_LOANS.values()
            if loan.customer_id == customer_id
        ]
        logger.info(f"Found {len(customer_loans)} loans for customer {customer_id}")

        # Convert to LoanSummary
        summaries = []
        for loan in customer_loans:
            # Calculate next payment date (first of next month for demo)
            today = date.today()
            if today.month == 12:
                next_payment = date(today.year + 1, 1, 1)
            else:
                next_payment = date(today.year, today.month + 1, 1)

            summaries.append(LoanSummary(
                loan_id=loan.loan_id,
                loan_type=loan.loan_type,
                status=loan.status,
                amount=loan.amount,
                remaining_balance=loan.amount,  # For demo, assuming no payments yet
                monthly_payment=loan.monthly_payment,
                next_payment_date=next_payment,
                currency=loan.currency,
            ))

        return summaries

    # Simulation
    async def simulate_loan(self, simulation: LoanSimulationRequest) -> LoanSimulationResponse:
        """Simulate a loan without creating it"""
        loan_type_key = simulation.loan_type.value

        if simulation.loan_type == LoanType.AUTO and simulation.vehicle_type:
            vehicle_type = simulation.vehicle_type.value
        else:
            vehicle_type = None

        interest_rate = await self.get_interest_rate(
            loan_type_key, simulation.term_months, vehicle_type
        )

        monthly_payment = self._calculate_monthly_payment(
            simulation.amount, interest_rate, simulation.term_months
        )
        total_payment = monthly_payment * simulation.term_months
        total_interest = total_payment - simulation.amount

        return LoanSimulationResponse(
            loan_type=simulation.loan_type,
            amount=simulation.amount,
            term_months=simulation.term_months,
            interest_rate=interest_rate,
            monthly_payment=monthly_payment,
            total_payment=total_payment,
            total_interest=total_interest,
            currency="MXN",
        )

    # Payment Schedule
    async def get_payment_schedule(self, loan_id: str) -> Optional[PaymentSchedule]:
        """Get payment schedule for a loan"""
        # In production, this would call Transact Payment Schedules API
        # GET /holdings/paymentSchedules?arrangementId={arrangementId}

        # For demo, generate a sample schedule
        return self._generate_sample_schedule(loan_id)

    # Product Catalog
    async def get_interest_rate(
        self, loan_type: str, term_months: int, vehicle_type: Optional[str] = None
    ) -> Decimal:
        """Get interest rate for a loan type"""
        # In production, this would call Transact Product Catalog API
        # GET /reference/products/{productId}

        if loan_type == "AUTO" and vehicle_type:
            rate_key = f"AUTO_{vehicle_type}"
        else:
            rate_key = loan_type

        rates = self.interest_rates.get(rate_key, self.interest_rates["PERSONAL"])

        # Find the closest term
        available_terms = sorted(rates.keys())
        closest_term = min(available_terms, key=lambda x: abs(x - term_months))

        return rates[closest_term]

    # Helper Methods
    def _calculate_monthly_payment(
        self, principal: Decimal, annual_rate: Decimal, term_months: int
    ) -> Decimal:
        """Calculate monthly payment using amortization formula"""
        if annual_rate == 0:
            return (principal / term_months).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        monthly_rate = annual_rate / Decimal("100") / Decimal("12")

        # PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
        numerator = monthly_rate * ((1 + monthly_rate) ** term_months)
        denominator = ((1 + monthly_rate) ** term_months) - 1

        monthly_payment = principal * (numerator / denominator)
        return monthly_payment.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _generate_sample_schedule(self, loan_id: str) -> PaymentSchedule:
        """Generate a sample payment schedule for demo purposes"""
        # Sample loan data
        principal = Decimal("100000.00")
        annual_rate = Decimal("14.50")
        term_months = 24

        monthly_rate = annual_rate / Decimal("100") / Decimal("12")
        monthly_payment = self._calculate_monthly_payment(principal, annual_rate, term_months)

        payments = []
        remaining_balance = principal
        start_date = date.today() + timedelta(days=30)

        total_principal = Decimal("0")
        total_interest = Decimal("0")
        total_tax = Decimal("0")

        for i in range(1, term_months + 1):
            interest = (remaining_balance * monthly_rate).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            tax = (interest * self.tax_rate).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            principal_payment = monthly_payment - interest
            remaining_balance = max(Decimal("0"), remaining_balance - principal_payment)

            due_date = start_date + timedelta(days=30 * (i - 1))

            # Determine status based on due date
            if due_date < date.today():
                status = PaymentStatus.PAID
            elif due_date == date.today():
                status = PaymentStatus.PENDING
            else:
                status = PaymentStatus.PENDING

            payment = Payment(
                payment_number=i,
                due_date=due_date,
                principal=principal_payment,
                interest=interest,
                tax=tax,
                total_payment=monthly_payment + tax,
                remaining_balance=remaining_balance,
                status=status,
                paid_date=due_date if status == PaymentStatus.PAID else None,
                paid_amount=monthly_payment + tax if status == PaymentStatus.PAID else None,
            )
            payments.append(payment)

            total_principal += principal_payment
            total_interest += interest
            total_tax += tax

        # Calculate summary
        payments_made = sum(1 for p in payments if p.status == PaymentStatus.PAID)
        payments_pending = sum(1 for p in payments if p.status == PaymentStatus.PENDING)
        payments_overdue = sum(1 for p in payments if p.status == PaymentStatus.OVERDUE)

        amount_paid = sum(
            p.paid_amount for p in payments if p.paid_amount is not None
        )

        next_pending = next(
            (p for p in payments if p.status == PaymentStatus.PENDING), None
        )

        summary = ScheduleSummary(
            total_payments=term_months,
            payments_made=payments_made,
            payments_pending=payments_pending,
            payments_overdue=payments_overdue,
            total_principal=total_principal,
            total_interest=total_interest,
            total_tax=total_tax,
            total_amount=total_principal + total_interest + total_tax,
            amount_paid=amount_paid,
            amount_remaining=total_principal + total_interest + total_tax - amount_paid,
            next_payment_date=next_pending.due_date if next_pending else None,
            next_payment_amount=next_pending.total_payment if next_pending else None,
        )

        return PaymentSchedule(
            loan_id=loan_id,
            arrangement_id=f"AA{loan_id}",
            customer_id="CUST001",
            currency="MXN",
            payments=payments,
            summary=summary,
        )

    def _get_all_mock_customers(self) -> List[Customer]:
        """Get all mock customers for demo purposes"""
        return [
            # Customer 1 - Juan Garcia
            Customer(
                id="CUST001",
                document_type=DocumentType.INE,
                document_number="INE1234567890",
                first_name="Juan",
                middle_name="Carlos",
                last_name="García",
                second_last_name="López",
                full_name="Juan Carlos García López",
                birth_date=date(1985, 5, 15),
                email="juan.garcia@email.com",
                phone="5551234567",
                address=Address(
                    street="Av. Reforma",
                    exterior_number="123",
                    interior_number="4B",
                    neighborhood="Juárez",
                    city="Ciudad de México",
                    state="CDMX",
                    postal_code="06600",
                    country="Mexico",
                ),
                credit_score=720,
                active_products=[
                    ProductSummary(
                        product_id="CC001",
                        product_type="CREDIT_CARD",
                        product_name="Tarjeta Oro",
                        status="ACTIVE",
                        balance=Decimal("15000.00"),
                    ),
                ],
                created_at=datetime(2020, 1, 15, 10, 30, 0),
                updated_at=datetime(2024, 6, 20, 14, 45, 0),
            ),
            # Customer 2 - Maria Rodriguez
            Customer(
                id="CUST002",
                document_type=DocumentType.INE,
                document_number="INE9876543210",
                first_name="María",
                middle_name="Elena",
                last_name="Rodríguez",
                second_last_name="Martínez",
                full_name="María Elena Rodríguez Martínez",
                birth_date=date(1990, 8, 22),
                email="maria.rodriguez@email.com",
                phone="5559876543",
                address=Address(
                    street="Calle Insurgentes",
                    exterior_number="456",
                    interior_number=None,
                    neighborhood="Roma Norte",
                    city="Ciudad de México",
                    state="CDMX",
                    postal_code="06700",
                    country="Mexico",
                ),
                credit_score=780,
                active_products=[
                    ProductSummary(
                        product_id="SA002",
                        product_type="SAVINGS",
                        product_name="Cuenta Premium",
                        status="ACTIVE",
                        balance=Decimal("125000.00"),
                    ),
                ],
                created_at=datetime(2019, 3, 10, 9, 15, 0),
                updated_at=datetime(2024, 8, 5, 11, 20, 0),
            ),
            # Customer 3 - Carlos Hernandez
            Customer(
                id="CUST003",
                document_type=DocumentType.PASSPORT,
                document_number="PASS12345678",
                first_name="Carlos",
                middle_name="Alberto",
                last_name="Hernández",
                second_last_name="Sánchez",
                full_name="Carlos Alberto Hernández Sánchez",
                birth_date=date(1978, 12, 3),
                email="carlos.hernandez@email.com",
                phone="5552468135",
                address=Address(
                    street="Av. Chapultepec",
                    exterior_number="789",
                    interior_number="10A",
                    neighborhood="Condesa",
                    city="Ciudad de México",
                    state="CDMX",
                    postal_code="06140",
                    country="Mexico",
                ),
                credit_score=650,
                active_products=[
                    ProductSummary(
                        product_id="CC003",
                        product_type="CREDIT_CARD",
                        product_name="Tarjeta Clásica",
                        status="ACTIVE",
                        balance=Decimal("8500.00"),
                    ),
                    ProductSummary(
                        product_id="PL001",
                        product_type="PERSONAL_LOAN",
                        product_name="Préstamo Personal",
                        status="ACTIVE",
                        balance=Decimal("45000.00"),
                    ),
                ],
                created_at=datetime(2018, 6, 20, 14, 0, 0),
                updated_at=datetime(2024, 9, 12, 16, 30, 0),
            ),
            # Customer 4 - Ana Martinez
            Customer(
                id="CUST004",
                document_type=DocumentType.INE,
                document_number="INE5555666677",
                first_name="Ana",
                middle_name="Patricia",
                last_name="Martínez",
                second_last_name="Flores",
                full_name="Ana Patricia Martínez Flores",
                birth_date=date(1995, 4, 18),
                email="ana.martinez@email.com",
                phone="5551112233",
                address=Address(
                    street="Calle Polanco",
                    exterior_number="234",
                    interior_number="5B",
                    neighborhood="Polanco",
                    city="Ciudad de México",
                    state="CDMX",
                    postal_code="11550",
                    country="Mexico",
                ),
                credit_score=700,
                active_products=[],
                created_at=datetime(2022, 2, 14, 10, 45, 0),
                updated_at=datetime(2024, 7, 8, 9, 0, 0),
            ),
            # Customer 5 - Roberto Gomez
            Customer(
                id="CUST005",
                document_type=DocumentType.CURP,
                document_number="CURPGOMR850101",
                first_name="Roberto",
                middle_name=None,
                last_name="Gómez",
                second_last_name="Ruiz",
                full_name="Roberto Gómez Ruiz",
                birth_date=date(1985, 1, 1),
                email="roberto.gomez@email.com",
                phone="5554445566",
                address=Address(
                    street="Av. Universidad",
                    exterior_number="1000",
                    interior_number=None,
                    neighborhood="Del Valle",
                    city="Ciudad de México",
                    state="CDMX",
                    postal_code="03100",
                    country="Mexico",
                ),
                credit_score=580,
                active_products=[
                    ProductSummary(
                        product_id="SA005",
                        product_type="SAVINGS",
                        product_name="Cuenta Básica",
                        status="ACTIVE",
                        balance=Decimal("3500.00"),
                    ),
                ],
                created_at=datetime(2021, 9, 5, 13, 30, 0),
                updated_at=datetime(2024, 10, 1, 8, 15, 0),
            ),
        ]

    def _get_mock_customer(self) -> Customer:
        """Get a mock customer for demo purposes"""
        return self._get_all_mock_customers()[0]
