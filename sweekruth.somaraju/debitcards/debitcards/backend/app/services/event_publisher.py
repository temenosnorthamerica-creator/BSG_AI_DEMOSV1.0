import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from ..models.transaction import TransactionType, TransactionStatus
from ..core.event_hub import event_hub_publisher

logger = logging.getLogger(__name__)


class TransactionEventPublisher:
    """Service for publishing transaction events to Azure Event Hub."""

    async def publish_transaction_event(
        self,
        event_type: TransactionType,
        card_number: str,
        account_id: str,
        account_name: str,
        amount: float,
        balance_before: float,
        balance_after: float,
        status: TransactionStatus,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> tuple[bool, str]:
        """
        Publish a transaction event to Azure Event Hub.
        Returns (success, event_id).
        """
        event_id = str(uuid.uuid4())

        event_data = {
            "eventId": event_id,
            "eventType": event_type.value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "cardNumber": self._mask_card_number(card_number),
            "accountId": account_id,
            "accountName": account_name,
            "amount": amount,
            "currency": "USD",
            "balanceBefore": balance_before,
            "balanceAfter": balance_after,
            "status": status.value,
            "metadata": metadata or {},
        }

        logger.info(f"Publishing event: {event_type.value} for account {account_id}")

        success = await event_hub_publisher.publish_event(event_data)

        if success:
            logger.info(f"Event published successfully: {event_id}")
        else:
            logger.warning(f"Failed to publish event: {event_id}")

        return success, event_id

    def _mask_card_number(self, card_number: str) -> str:
        """Mask card number for security."""
        if len(card_number) >= 4:
            return f"**** **** **** {card_number[-4:]}"
        return "****"

    async def publish_withdrawal_event(
        self,
        card_number: str,
        account_id: str,
        account_name: str,
        amount: float,
        balance_before: float,
        balance_after: float,
        status: TransactionStatus,
    ) -> tuple[bool, str]:
        """Publish withdrawal event."""
        return await self.publish_transaction_event(
            event_type=TransactionType.WITHDRAWAL,
            card_number=card_number,
            account_id=account_id,
            account_name=account_name,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            status=status,
        )

    async def publish_cash_deposit_event(
        self,
        card_number: str,
        account_id: str,
        account_name: str,
        amount: float,
        balance_before: float,
        balance_after: float,
        status: TransactionStatus,
    ) -> tuple[bool, str]:
        """Publish cash deposit event."""
        return await self.publish_transaction_event(
            event_type=TransactionType.CASH_DEPOSIT,
            card_number=card_number,
            account_id=account_id,
            account_name=account_name,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            status=status,
        )

    async def publish_check_deposit_event(
        self,
        card_number: str,
        account_id: str,
        account_name: str,
        amount: float,
        balance_before: float,
        balance_after: float,
        status: TransactionStatus,
        check_number: str,
    ) -> tuple[bool, str]:
        """Publish check deposit event."""
        return await self.publish_transaction_event(
            event_type=TransactionType.CHECK_DEPOSIT,
            card_number=card_number,
            account_id=account_id,
            account_name=account_name,
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            status=status,
            metadata={"checkNumber": check_number},
        )

    async def publish_transfer_event(
        self,
        card_number: str,
        source_account_id: str,
        source_account_name: str,
        dest_account_id: str,
        dest_account_name: str,
        amount: float,
        source_balance_before: float,
        source_balance_after: float,
        status: TransactionStatus,
    ) -> tuple[bool, str]:
        """Publish transfer event."""
        return await self.publish_transaction_event(
            event_type=TransactionType.TRANSFER,
            card_number=card_number,
            account_id=source_account_id,
            account_name=source_account_name,
            amount=amount,
            balance_before=source_balance_before,
            balance_after=source_balance_after,
            status=status,
            metadata={
                "sourceAccount": source_account_id,
                "sourceAccountName": source_account_name,
                "destinationAccount": dest_account_id,
                "destinationAccountName": dest_account_name,
            },
        )

    async def publish_balance_inquiry_event(
        self,
        card_number: str,
        account_id: str,
        account_name: str,
        balance: float,
        status: TransactionStatus,
    ) -> tuple[bool, str]:
        """Publish balance inquiry event."""
        return await self.publish_transaction_event(
            event_type=TransactionType.BALANCE_INQUIRY,
            card_number=card_number,
            account_id=account_id,
            account_name=account_name,
            amount=0,
            balance_before=balance,
            balance_after=balance,
            status=status,
        )


# Global instance
transaction_event_publisher = TransactionEventPublisher()
