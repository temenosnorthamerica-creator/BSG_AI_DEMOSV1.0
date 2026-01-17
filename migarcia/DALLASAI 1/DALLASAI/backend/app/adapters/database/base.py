"""
Base Database Adapter Interface

Defines the contract for database adapters.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List


class DatabaseAdapter(ABC):
    """Abstract base class for database adapters."""
    
    @abstractmethod
    async def connect(self) -> None:
        """Initialize database connection."""
        pass
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Close database connection."""
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check database health status."""
        pass
    
    @abstractmethod
    async def get_database(self):
        """Get database instance."""
        pass
    
    @abstractmethod
    async def get_collection(self, collection_name: str):
        """Get collection instance."""
        pass
    
    @abstractmethod
    async def find_one(self, collection_name: str, filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find one document."""
        pass
    
    @abstractmethod
    async def find_many(self, collection_name: str, filter: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Find multiple documents."""
        pass
    
    @abstractmethod
    async def insert_one(self, collection_name: str, document: Dict[str, Any]) -> str:
        """Insert one document."""
        pass
    
    @abstractmethod
    async def insert_many(self, collection_name: str, documents: List[Dict[str, Any]]) -> List[str]:
        """Insert multiple documents."""
        pass
    
    @abstractmethod
    async def update_one(self, collection_name: str, filter: Dict[str, Any], update: Dict[str, Any]) -> bool:
        """Update one document."""
        pass
    
    @abstractmethod
    async def delete_one(self, collection_name: str, filter: Dict[str, Any]) -> bool:
        """Delete one document."""
        pass
    
    @abstractmethod
    async def create_index(self, collection_name: str, index_fields: List[tuple], unique: bool = False) -> None:
        """Create index on collection."""
        pass

