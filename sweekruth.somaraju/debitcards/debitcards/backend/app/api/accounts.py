from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
from ..models.account import AccountListResponse, AccountResponse, AccountBalance
from ..services.account_service import account_service
from ..services.card_service import card_service

router = APIRouter(prefix="/accounts", tags=["Accounts"])


def get_current_session(authorization: Optional[str] = Header(None)):
    """Dependency to validate session."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    session_id = authorization.replace("Bearer ", "")
    is_valid, session = card_service.validate_session(session_id)

    if not is_valid:
        raise HTTPException(status_code=401, detail="Session invalid or expired")

    return session


@router.get("", response_model=AccountListResponse)
async def get_accounts(session=Depends(get_current_session)):
    """Get all accounts for the authenticated card."""
    accounts = account_service.get_all_accounts()
    return AccountListResponse(success=True, data=accounts)


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: str, session=Depends(get_current_session)):
    """Get a specific account by ID."""
    account = account_service.get_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return AccountResponse(success=True, data=account)


@router.get("/{account_id}/balance", response_model=AccountBalance)
async def get_balance(account_id: str, session=Depends(get_current_session)):
    """Get account balance."""
    account = account_service.get_account(account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return AccountBalance(
        account_id=account.id,
        account_name=account.name,
        balance=account.balance,
        currency=account.currency,
        available_balance=account.balance,  # In demo, available = actual
    )
