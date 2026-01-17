from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from ..models.card import PinAuthRequest, PinAuthResponse
from ..services.card_service import card_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/pin", response_model=PinAuthResponse)
async def authenticate_pin(request: PinAuthRequest):
    """Authenticate with card number and PIN."""
    success, message, session = card_service.authenticate_pin(
        request.card_number, request.pin
    )

    if not success:
        return PinAuthResponse(success=False, message=message)

    return PinAuthResponse(
        success=True,
        message=message,
        session_token=session.session_id,
        card_masked=session.card_masked,
        holder_name=session.holder_name,
    )


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout and invalidate session."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    session_id = authorization.replace("Bearer ", "")
    success = card_service.invalidate_session(session_id)

    return {"success": success, "message": "Logged out successfully" if success else "Session not found"}


@router.get("/validate")
async def validate_session(authorization: Optional[str] = Header(None)):
    """Validate current session."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    session_id = authorization.replace("Bearer ", "")
    is_valid, session = card_service.validate_session(session_id)

    if not is_valid:
        raise HTTPException(status_code=401, detail="Session invalid or expired")

    return {
        "success": True,
        "card_masked": session.card_masked,
        "holder_name": session.holder_name,
        "expires_at": session.expires_at.isoformat(),
    }
