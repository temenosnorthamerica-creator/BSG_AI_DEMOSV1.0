"""
REST API endpoints for loan operations.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from app.services.loan_service import get_loan_service, LoanService
from app.models.loan import (
    PersonalLoanCreate,
    AutoLoanCreate,
    LoanResponse,
    LoanSimulationRequest,
    LoanSimulationResponse,
    LoanSummary,
    LoanDetail,
)
from app.models.customer import (
    Customer,
    CustomerSearchQuery,
    CustomerCreate,
)
from app.models.payment_schedule import PaymentSchedule

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/loans", tags=["loans"])


def get_service() -> LoanService:
    """Dependency to get loan service"""
    return get_loan_service()


# Customer Endpoints
@router.get("/customers/search", response_model=List[Customer])
async def search_customers(
    document_number: Optional[str] = Query(None, description="Search by document number"),
    name: Optional[str] = Query(None, description="Search by name"),
    account_number: Optional[str] = Query(None, description="Search by account number"),
    phone: Optional[str] = Query(None, description="Search by phone"),
    service: LoanService = Depends(get_service),
):
    """
    Search for customers based on query parameters.

    At least one search parameter must be provided.
    """
    if not any([document_number, name, account_number, phone]):
        raise HTTPException(
            status_code=400,
            detail="At least one search parameter is required"
        )

    query = CustomerSearchQuery(
        document_number=document_number,
        name=name,
        account_number=account_number,
        phone=phone,
    )

    try:
        customers = await service.search_customers(query)
        return customers
    except Exception as e:
        logger.error(f"Error searching customers: {e}")
        raise HTTPException(status_code=500, detail="Error searching customers")


@router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(
    customer_id: str,
    service: LoanService = Depends(get_service),
):
    """Get customer by ID"""
    try:
        customer = await service.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting customer: {e}")
        raise HTTPException(status_code=500, detail="Error getting customer")


@router.post("/customers", response_model=Customer, status_code=201)
async def create_customer(
    customer: CustomerCreate,
    service: LoanService = Depends(get_service),
):
    """Create a new customer"""
    try:
        return await service.create_customer(customer)
    except Exception as e:
        logger.error(f"Error creating customer: {e}")
        raise HTTPException(status_code=500, detail="Error creating customer")


# Loan Validation Endpoints
@router.post("/personal/validate")
async def validate_personal_loan(
    loan: PersonalLoanCreate,
    service: LoanService = Depends(get_service),
):
    """
    Validate eligibility for a personal loan without creating it.

    Returns validation results including eligibility status, errors, and warnings.
    """
    try:
        customer = await service.get_customer(loan.customer_id)
        validation = service.validate_personal_loan_eligibility(loan, customer)
        return validation
    except Exception as e:
        logger.error(f"Error validating personal loan: {e}")
        raise HTTPException(status_code=500, detail="Error validating loan")


@router.post("/auto/validate")
async def validate_auto_loan(
    loan: AutoLoanCreate,
    service: LoanService = Depends(get_service),
):
    """
    Validate eligibility for an auto loan without creating it.

    Returns validation results including eligibility status, errors, and warnings.
    """
    try:
        customer = await service.get_customer(loan.customer_id)
        validation = service.validate_auto_loan_eligibility(loan, customer)
        return validation
    except Exception as e:
        logger.error(f"Error validating auto loan: {e}")
        raise HTTPException(status_code=500, detail="Error validating loan")


# Loan Creation Endpoints
@router.post("/personal", response_model=LoanResponse, status_code=201)
async def create_personal_loan(
    loan: PersonalLoanCreate,
    service: LoanService = Depends(get_service),
):
    """
    Create a personal loan application.

    The loan will be validated before creation. If validation fails,
    a 400 error will be returned with the validation errors.
    """
    try:
        return await service.create_personal_loan(loan)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating personal loan: {e}")
        raise HTTPException(status_code=500, detail="Error creating loan")


@router.post("/auto", response_model=LoanResponse, status_code=201)
async def create_auto_loan(
    loan: AutoLoanCreate,
    service: LoanService = Depends(get_service),
):
    """
    Create an auto loan application.

    The loan will be validated before creation. If validation fails,
    a 400 error will be returned with the validation errors.
    """
    try:
        return await service.create_auto_loan(loan)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating auto loan: {e}")
        raise HTTPException(status_code=500, detail="Error creating loan")


# Loan Query Endpoints
@router.get("/{loan_id}", response_model=LoanDetail)
async def get_loan(
    loan_id: str,
    service: LoanService = Depends(get_service),
):
    """Get loan details by ID"""
    try:
        loan = await service.get_loan(loan_id)
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        return loan
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting loan: {e}")
        raise HTTPException(status_code=500, detail="Error getting loan")


@router.get("/customer/{customer_id}", response_model=List[LoanSummary])
async def get_customer_loans(
    customer_id: str,
    service: LoanService = Depends(get_service),
):
    """Get all loans for a customer"""
    try:
        return await service.get_customer_loans(customer_id)
    except Exception as e:
        logger.error(f"Error getting customer loans: {e}")
        raise HTTPException(status_code=500, detail="Error getting loans")


# Simulation Endpoint
@router.post("/simulate", response_model=LoanSimulationResponse)
async def simulate_loan(
    simulation: LoanSimulationRequest,
    service: LoanService = Depends(get_service),
):
    """
    Simulate a loan without creating it.

    Returns estimated monthly payment, total payment, and interest.
    """
    try:
        return await service.simulate_loan(simulation)
    except Exception as e:
        logger.error(f"Error simulating loan: {e}")
        raise HTTPException(status_code=500, detail="Error simulating loan")


# Payment Schedule Endpoints
@router.get("/{loan_id}/schedule", response_model=PaymentSchedule)
async def get_payment_schedule(
    loan_id: str,
    service: LoanService = Depends(get_service),
):
    """
    Get the payment schedule for a loan.

    Returns the complete amortization schedule with all payments.
    """
    try:
        schedule = await service.get_payment_schedule(loan_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="Payment schedule not found")
        return schedule
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting payment schedule: {e}")
        raise HTTPException(status_code=500, detail="Error getting payment schedule")
