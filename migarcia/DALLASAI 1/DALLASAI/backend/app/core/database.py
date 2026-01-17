"""
Database Service

Provides database connection via adapter pattern.
Uses adapter abstraction to support multiple database types.
"""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.adapters.database import get_database_adapter
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Global database adapter instance
_db_adapter = None


def _get_adapter():
    """Get database adapter instance."""
    global _db_adapter
    if _db_adapter is None:
        _db_adapter = get_database_adapter()
    return _db_adapter


async def init_db():
    """
    Initialize database connection via adapter.
    
    This function:
    - Creates a MongoDB client with connection pooling
    - Tests the connection with a ping command
    - Returns the database instance for use in the application
    
    Returns:
        Database instance (adapter-specific)
    """
    adapter = _get_adapter()
    await adapter.connect()
    return await adapter.get_database()


async def close_db():
    """Close database connection."""
    adapter = _get_adapter()
    await adapter.disconnect()


async def get_db_health() -> dict:
    """
    Get database health status via adapter.
    
    Returns:
        Dictionary with health status information
    """
    try:
        adapter = _get_adapter()
        return await adapter.health_check()
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "database": settings.DATABASE_NAME,
            "error": str(e),
            "connected": False
        }


# Dependency for FastAPI
async def get_database() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency to get database instance.
    
    Returns:
        Database instance (adapter-specific, currently MongoDB)
    
    Raises:
        HTTPException: If database connection fails
    """
    try:
        adapter = _get_adapter()
        await adapter.connect()
        return await adapter.get_database()
    except Exception as e:
        logger.error(f"Failed to get database connection: {e}")
        # Re-raise to let FastAPI handle it with proper error response
        raise
