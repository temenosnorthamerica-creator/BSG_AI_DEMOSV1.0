from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, List
from datetime import datetime
import uuid
from ..models.transaction import (
    WithdrawRequest,
    DepositCashRequest,
    DepositCheckRequest,
    TransferRequest,
    BalanceInquiryRequest,
    TransactionResponse,
    TransactionHistoryResponse,
    Transaction,
    TransactionType,
    TransactionStatus,
)
from ..models.card import CardSession
from ..services.account_service import account_service
from ..services.card_service import card_service
from ..services.event_publisher import transaction_event_publisher
from ..core.config import settings

router = APIRouter(prefix="/transactions", tags=["Transactions"])

# In-memory transaction history
transaction_history: List[Transaction] = []


def get_current_session(authorization: Optional[str] = Header(None)) -> CardSession:
    """Dependency to validate session."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    session_id = authorization.replace("Bearer ", "")
    is_valid, session = card_service.validate_session(session_id)

    if not is_valid:
        raise HTTPException(status_code=401, detail="Session invalid or expired")

    return session


@router.post("/withdraw", response_model=TransactionResponse)
async def withdraw(request: WithdrawRequest, session: CardSession = Depends(get_current_session)):
    """Withdraw cash from account."""
    account = account_service.get_account(request.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    balance_before = account.balance
    success, message, new_balance = account_service.withdraw(request.account_id, request.amount)

    status = TransactionStatus.SUCCESS if success else TransactionStatus.FAILED
    balance_after = new_balance if new_balance is not None else balance_before

    # Publish event
    event_success, event_id = await transaction_event_publisher.publish_withdrawal_event(
        card_number=settings.DEMO_CARD_NUMBER,
        account_id=request.account_id,
        account_name=account.name,
        amount=request.amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status=status,
    )

    # Create transaction record
    transaction = Transaction(
        id=str(uuid.uuid4()),
        event_id=event_id,
        transaction_type=TransactionType.WITHDRAWAL,
        card_number=f"**** **** **** {settings.DEMO_CARD_NUMBER[-4:]}",
        account_id=request.account_id,
        account_name=account.name,
        amount=request.amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status=status,
        timestamp=datetime.utcnow(),
    )
    transaction_history.insert(0, transaction)

    return TransactionResponse(
        success=success,
        message=message,
        transaction=transaction,
        new_balance=new_balance,
    )


@router.post("/deposit/cash", response_model=TransactionResponse)
async def deposit_cash(request: DepositCashRequest, session: CardSession = Depends(get_current_session)):
    """Deposit cash to account."""
    account = account_service.get_account(request.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    balance_before = account.balance
    success, message, new_balance = account_service.deposit(request.account_id, request.amount)

    status = TransactionStatus.SUCCESS if success else TransactionStatus.FAILED
    balance_after = new_balance if new_balance is not None else balance_before

    # Publish event
    event_success, event_id = await transaction_event_publisher.publish_cash_deposit_event(
        card_number=settings.DEMO_CARD_NUMBER,
        account_id=request.account_id,
        account_name=account.name,
        amount=request.amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status=status,
    )

    # Create transaction record
    transaction = Transaction(
        id=str(uuid.uuid4()),
        event_id=event_id,
        transaction_type=TransactionType.CASH_DEPOSIT,
        card_number=f"**** **** **** {settings.DEMO_CARD_NUMBER[-4:]}",
        account_id=request.account_id,
        account_name=account.name,
        amount=request.amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status=status,
        timestamp=datetime.utcnow(),
    )
    transaction_history.insert(0, transaction)

    return TransactionResponse(
        success=success,
        message=message,
        transaction=transaction,
        new_balance=new_balance,
    )


@router.post("/deposit/check", response_model=TransactionResponse)
async def deposit_check(request: DepositCheckRequest, session: CardSession = Depends(get_current_session)):
    """Deposit check to account."""
    account = account_service.get_account(request.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    balance_before = account.balance
    success, message, new_balance = account_service.deposit(request.account_id, request.amount)

    status = TransactionStatus.SUCCESS if success else TransactionStatus.FAILED
    balance_after = new_balance if new_balance is not None else balance_before

    # Publish event
    event_success, event_id = await transaction_event_publisher.publish_check_deposit_event(
        card_number=settings.DEMO_CARD_NUMBER,
        account_id=request.account_id,
        account_name=account.name,
        amount=request.amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status=status,
        check_number=request.check_number,
    )

    # Create transaction record
    transaction = Transaction(
        id=str(uuid.uuid4()),
        event_id=event_id,
        transaction_type=TransactionType.CHECK_DEPOSIT,
        card_number=f"**** **** **** {settings.DEMO_CARD_NUMBER[-4:]}",
        account_id=request.account_id,
        account_name=account.name,
        amount=request.amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status=status,
        timestamp=datetime.utcnow(),
        metadata={"checkNumber": request.check_number},
    )
    transaction_history.insert(0, transaction)

    return TransactionResponse(
        success=success,
        message=message,
        transaction=transaction,
        new_balance=new_balance,
    )


@router.post("/transfer", response_model=TransactionResponse)
async def transfer(request: TransferRequest, session: CardSession = Depends(get_current_session)):
    """Transfer between accounts."""
    source_account = account_service.get_account(request.source_account_id)
    dest_account = account_service.get_account(request.destination_account_id)

    if not source_account:
        raise HTTPException(status_code=404, detail="Source account not found")
    if not dest_account:
        raise HTTPException(status_code=404, detail="Destination account not found")

    balance_before = source_account.balance
    success, message, source_new, dest_new = account_service.transfer(
        request.source_account_id, request.destination_account_id, request.amount
    )

    status = TransactionStatus.SUCCESS if success else TransactionStatus.FAILED
    balance_after = source_new if source_new is not None else balance_before

    # Publish event
    event_success, event_id = await transaction_event_publisher.publish_transfer_event(
        card_number=settings.DEMO_CARD_NUMBER,
        source_account_id=request.source_account_id,
        source_account_name=source_account.name,
        dest_account_id=request.destination_account_id,
        dest_account_name=dest_account.name,
        amount=request.amount,
        source_balance_before=balance_before,
        source_balance_after=balance_after,
        status=status,
    )

    # Create transaction record
    transaction = Transaction(
        id=str(uuid.uuid4()),
        event_id=event_id,
        transaction_type=TransactionType.TRANSFER,
        card_number=f"**** **** **** {settings.DEMO_CARD_NUMBER[-4:]}",
        account_id=request.source_account_id,
        account_name=source_account.name,
        amount=request.amount,
        balance_before=balance_before,
        balance_after=balance_after,
        status=status,
        timestamp=datetime.utcnow(),
        metadata={
            "sourceAccount": request.source_account_id,
            "sourceAccountName": source_account.name,
            "destinationAccount": request.destination_account_id,
            "destinationAccountName": dest_account.name,
        },
    )
    transaction_history.insert(0, transaction)

    return TransactionResponse(
        success=success,
        message=message,
        transaction=transaction,
        new_balance=source_new,
    )


@router.post("/balance-inquiry", response_model=TransactionResponse)
async def balance_inquiry(request: BalanceInquiryRequest, session: CardSession = Depends(get_current_session)):
    """Check account balance."""
    account = account_service.get_account(request.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # Publish event
    event_success, event_id = await transaction_event_publisher.publish_balance_inquiry_event(
        card_number=settings.DEMO_CARD_NUMBER,
        account_id=request.account_id,
        account_name=account.name,
        balance=account.balance,
        status=TransactionStatus.SUCCESS,
    )

    # Create transaction record
    transaction = Transaction(
        id=str(uuid.uuid4()),
        event_id=event_id,
        transaction_type=TransactionType.BALANCE_INQUIRY,
        card_number=f"**** **** **** {settings.DEMO_CARD_NUMBER[-4:]}",
        account_id=request.account_id,
        account_name=account.name,
        amount=0,
        balance_before=account.balance,
        balance_after=account.balance,
        status=TransactionStatus.SUCCESS,
        timestamp=datetime.utcnow(),
    )
    transaction_history.insert(0, transaction)

    return TransactionResponse(
        success=True,
        message=f"Balance: ${account.balance:,.2f}",
        transaction=transaction,
        new_balance=account.balance,
    )


@router.get("/history", response_model=TransactionHistoryResponse)
async def get_transaction_history(
    limit: int = 10,
    session: CardSession = Depends(get_current_session),
):
    """Get transaction history."""
    transactions = transaction_history[:limit]
    return TransactionHistoryResponse(
        success=True,
        transactions=transactions,
        total_count=len(transaction_history),
    )
