from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Card(BaseModel):
    id: str
    card_number: str  # Full card number (stored securely)
    masked_number: str  # Last 4 digits visible
    pin_hash: str
    holder_name: str
    expiry_date: str
    is_active: bool = True
    is_locked: bool = False
    failed_attempts: int = 0
    last_activity: Optional[datetime] = None


class PinAuthRequest(BaseModel):
    card_number: str = Field(..., min_length=16, max_length=16)
    pin: str = Field(..., min_length=4, max_length=4)


class PinAuthResponse(BaseModel):
    success: bool
    message: str
    session_token: Optional[str] = None
    card_masked: Optional[str] = None
    holder_name: Optional[str] = None


class CardSession(BaseModel):
    session_id: str
    card_id: str
    card_masked: str
    holder_name: str
    created_at: datetime
    expires_at: datetime
    is_active: bool = True
