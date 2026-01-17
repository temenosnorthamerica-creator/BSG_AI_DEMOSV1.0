"""
Factory for Transact adapter instances.
"""
from functools import lru_cache
from .transact_adapter import TransactAdapter
from .base import TransactAdapterBase


@lru_cache()
def get_transact_adapter() -> TransactAdapterBase:
    """
    Get a singleton instance of the Transact adapter.

    Returns:
        TransactAdapterBase: The Transact adapter instance
    """
    return TransactAdapter()
