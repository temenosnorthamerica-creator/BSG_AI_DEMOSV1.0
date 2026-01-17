from typing import Dict, List, Optional
from datetime import datetime
from ..models.account import Account, AccountType


class AccountService:
    """In-memory account service for demo purposes."""

    def __init__(self):
        # Initialize demo accounts
        self._accounts: Dict[str, Account] = {
            "1001": Account(
                id="1001",
                account_number="1001",
                name="Checking",
                account_type=AccountType.CHECKING,
                balance=5000.00,
                currency="USD",
            ),
            "1002": Account(
                id="1002",
                account_number="1002",
                name="Savings",
                account_type=AccountType.SAVINGS,
                balance=10000.00,
                currency="USD",
            ),
            "1003": Account(
                id="1003",
                account_number="1003",
                name="Investment",
                account_type=AccountType.INVESTMENT,
                balance=25000.00,
                currency="USD",
            ),
        }

    def get_all_accounts(self) -> List[Account]:
        """Get all accounts."""
        return list(self._accounts.values())

    def get_account(self, account_id: str) -> Optional[Account]:
        """Get account by ID."""
        return self._accounts.get(account_id)

    def get_balance(self, account_id: str) -> Optional[float]:
        """Get account balance."""
        account = self._accounts.get(account_id)
        return account.balance if account else None

    def update_balance(self, account_id: str, new_balance: float) -> bool:
        """Update account balance."""
        if account_id in self._accounts:
            self._accounts[account_id].balance = new_balance
            return True
        return False

    def withdraw(self, account_id: str, amount: float) -> tuple[bool, str, Optional[float]]:
        """Withdraw from account. Returns (success, message, new_balance)."""
        account = self._accounts.get(account_id)
        if not account:
            return False, "Account not found", None

        if amount > account.balance:
            return False, "Insufficient funds", None

        new_balance = account.balance - amount
        self._accounts[account_id].balance = new_balance
        return True, "Withdrawal successful", new_balance

    def deposit(self, account_id: str, amount: float) -> tuple[bool, str, Optional[float]]:
        """Deposit to account. Returns (success, message, new_balance)."""
        account = self._accounts.get(account_id)
        if not account:
            return False, "Account not found", None

        new_balance = account.balance + amount
        self._accounts[account_id].balance = new_balance
        return True, "Deposit successful", new_balance

    def transfer(
        self, source_id: str, dest_id: str, amount: float
    ) -> tuple[bool, str, Optional[float], Optional[float]]:
        """Transfer between accounts. Returns (success, message, source_balance, dest_balance)."""
        source = self._accounts.get(source_id)
        dest = self._accounts.get(dest_id)

        if not source:
            return False, "Source account not found", None, None
        if not dest:
            return False, "Destination account not found", None, None
        if source_id == dest_id:
            return False, "Cannot transfer to the same account", None, None
        if amount > source.balance:
            return False, "Insufficient funds", None, None

        source_new = source.balance - amount
        dest_new = dest.balance + amount

        self._accounts[source_id].balance = source_new
        self._accounts[dest_id].balance = dest_new

        return True, "Transfer successful", source_new, dest_new


# Global instance
account_service = AccountService()
