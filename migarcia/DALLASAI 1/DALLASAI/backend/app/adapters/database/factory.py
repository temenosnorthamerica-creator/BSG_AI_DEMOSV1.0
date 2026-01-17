"""
Database Adapter Factory

Factory for creating database adapter instances based on configuration.
"""

from typing import Optional
from app.adapters.database.base import DatabaseAdapter
from app.adapters.database.mongodb_adapter import MongoDBAdapter
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Global adapter instance
_db_adapter: Optional[DatabaseAdapter] = None


def get_database_adapter() -> DatabaseAdapter:
    """
    Get database adapter instance (singleton).
    
    Returns:
        DatabaseAdapter instance based on configuration
    """
    global _db_adapter
    
    if _db_adapter is None:
        # Determine adapter type from configuration
        db_type = getattr(settings, 'DATABASE_TYPE', 'mongodb').lower()
        
        if db_type == 'mongodb':
            _db_adapter = MongoDBAdapter()
            logger.info("Using MongoDB adapter")
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
    
    return _db_adapter

