from typing import Dict, Optional
from datetime import datetime, timedelta
import uuid
import hashlib
from ..models.card import Card, CardSession
from ..core.config import settings


class CardService:
    """In-memory card service for demo purposes."""

    MAX_PIN_ATTEMPTS = 3
    SESSION_DURATION_MINUTES = 30

    def __init__(self):
        # Initialize demo card
        self._cards: Dict[str, Card] = {
            settings.DEMO_CARD_NUMBER: Card(
                id="card_001",
                card_number=settings.DEMO_CARD_NUMBER,
                masked_number=f"**** **** **** {settings.DEMO_CARD_NUMBER[-4:]}",
                pin_hash=self._hash_pin(settings.DEMO_PIN),
                holder_name="John Doe",
                expiry_date="12/28",
                is_active=True,
            )
        }
        self._sessions: Dict[str, CardSession] = {}

    def _hash_pin(self, pin: str) -> str:
        """Hash PIN for storage."""
        return hashlib.sha256(pin.encode()).hexdigest()

    def authenticate_pin(self, card_number: str, pin: str) -> tuple[bool, str, Optional[CardSession]]:
        """Authenticate card with PIN. Returns (success, message, session)."""
        card = self._cards.get(card_number)

        if not card:
            return False, "Card not found", None

        if not card.is_active:
            return False, "Card is inactive", None

        if card.is_locked:
            return False, "Card is locked due to too many failed attempts. Please contact support.", None

        # Verify PIN
        if self._hash_pin(pin) != card.pin_hash:
            card.failed_attempts += 1
            if card.failed_attempts >= self.MAX_PIN_ATTEMPTS:
                card.is_locked = True
                return False, "Card locked due to too many failed attempts", None
            remaining = self.MAX_PIN_ATTEMPTS - card.failed_attempts
            return False, f"Invalid PIN. {remaining} attempts remaining.", None

        # Reset failed attempts on success
        card.failed_attempts = 0
        card.last_activity = datetime.utcnow()

        # Create session
        session = CardSession(
            session_id=str(uuid.uuid4()),
            card_id=card.id,
            card_masked=card.masked_number,
            holder_name=card.holder_name,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=self.SESSION_DURATION_MINUTES),
        )
        self._sessions[session.session_id] = session

        return True, "Authentication successful", session

    def validate_session(self, session_id: str) -> tuple[bool, Optional[CardSession]]:
        """Validate a session token. Returns (is_valid, session)."""
        session = self._sessions.get(session_id)

        if not session:
            return False, None

        if not session.is_active:
            return False, None

        if datetime.utcnow() > session.expires_at:
            session.is_active = False
            return False, None

        return True, session

    def invalidate_session(self, session_id: str) -> bool:
        """Invalidate a session."""
        session = self._sessions.get(session_id)
        if session:
            session.is_active = False
            return True
        return False

    def get_card_masked(self, card_number: str) -> Optional[str]:
        """Get masked card number."""
        card = self._cards.get(card_number)
        return card.masked_number if card else None


# Global instance
card_service = CardService()
