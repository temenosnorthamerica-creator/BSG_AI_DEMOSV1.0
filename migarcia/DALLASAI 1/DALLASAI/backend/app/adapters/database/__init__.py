"""
Database Adapter

Abstract interface for database connections.
"""

from app.adapters.database.base import DatabaseAdapter
from app.adapters.database.mongodb_adapter import MongoDBAdapter
from app.adapters.database.factory import get_database_adapter

__all__ = [
    "DatabaseAdapter",
    "MongoDBAdapter",
    "get_database_adapter",
]

