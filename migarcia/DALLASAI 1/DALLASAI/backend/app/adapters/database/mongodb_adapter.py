"""
MongoDB Adapter Implementation

MongoDB-specific implementation of DatabaseAdapter.
"""

from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from bson import ObjectId

from app.adapters.database.base import DatabaseAdapter
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class MongoDBAdapter(DatabaseAdapter):
    """MongoDB implementation of DatabaseAdapter."""
    
    def __init__(self):
        """Initialize MongoDB adapter."""
        self._client: Optional[AsyncIOMotorClient] = None
        self._database: Optional[AsyncIOMotorDatabase] = None
        self._connection_string = settings.DATABASE_URL
        self._database_name = settings.DATABASE_NAME
    
    async def connect(self) -> None:
        """Initialize MongoDB connection."""
        if self._database is not None:
            return
        
        try:
            logger.info(f"Connecting to MongoDB: {self._connection_string.split('@')[-1] if '@' in self._connection_string else 'localhost'}")
            
            self._client = AsyncIOMotorClient(
                self._connection_string,
                maxPoolSize=settings.DB_MAX_POOL_SIZE,
                minPoolSize=settings.DB_MIN_POOL_SIZE,
                serverSelectionTimeoutMS=settings.DB_CONNECT_TIMEOUT * 1000,
                connectTimeoutMS=settings.DB_CONNECT_TIMEOUT * 1000,
                socketTimeoutMS=settings.DB_CONNECT_TIMEOUT * 1000,
            )
            
            # Test connection
            await self._client.admin.command('ping')
            
            # Get database
            self._database = self._client[self._database_name]
            
            logger.info(f"Connected to MongoDB database: {self._database_name}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            self._client = None
            self._database = None
            logger.info("MongoDB connection closed")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check MongoDB health status."""
        try:
            if self._database is None or self._client is None:
                return {
                    "status": "unhealthy",
                    "database": self._database_name,
                    "error": "Database not initialized",
                    "connected": False
                }
            
            # Ping the database
            await self._client.admin.command('ping')
            
            # Get server status
            server_info = await self._client.server_info()
            
            return {
                "status": "healthy",
                "database": self._database_name,
                "server_version": server_info.get("version", "unknown"),
                "connected": True
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "database": self._database_name,
                "error": str(e),
                "connected": False
            }
    
    async def get_database(self) -> AsyncIOMotorDatabase:
        """Get MongoDB database instance."""
        if self._database is None:
            await self.connect()
        return self._database
    
    async def get_collection(self, collection_name: str) -> AsyncIOMotorCollection:
        """Get MongoDB collection instance."""
        db = await self.get_database()
        return db[collection_name]
    
    async def find_one(self, collection_name: str, filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find one document."""
        collection = await self.get_collection(collection_name)
        result = await collection.find_one(filter)
        if result and "_id" in result:
            result["_id"] = str(result["_id"])
        return result
    
    async def find_many(self, collection_name: str, filter: Optional[Dict[str, Any]] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Find multiple documents."""
        collection = await self.get_collection(collection_name)
        cursor = collection.find(filter or {})
        if limit:
            cursor = cursor.limit(limit)
        results = await cursor.to_list(length=limit)
        # Convert ObjectId to string
        for result in results:
            if "_id" in result:
                result["_id"] = str(result["_id"])
        return results
    
    async def insert_one(self, collection_name: str, document: Dict[str, Any]) -> str:
        """Insert one document."""
        collection = await self.get_collection(collection_name)
        result = await collection.insert_one(document)
        return str(result.inserted_id)
    
    async def insert_many(self, collection_name: str, documents: List[Dict[str, Any]]) -> List[str]:
        """Insert multiple documents."""
        collection = await self.get_collection(collection_name)
        result = await collection.insert_many(documents)
        return [str(id) for id in result.inserted_ids]
    
    async def update_one(self, collection_name: str, filter: Dict[str, Any], update: Dict[str, Any]) -> bool:
        """Update one document."""
        collection = await self.get_collection(collection_name)
        result = await collection.update_one(filter, {"$set": update})
        return result.modified_count > 0
    
    async def delete_one(self, collection_name: str, filter: Dict[str, Any]) -> bool:
        """Delete one document."""
        collection = await self.get_collection(collection_name)
        result = await collection.delete_one(filter)
        return result.deleted_count > 0
    
    async def create_index(self, collection_name: str, index_fields: List[tuple], unique: bool = False) -> None:
        """Create index on collection."""
        collection = await self.get_collection(collection_name)
        await collection.create_index(index_fields, unique=unique)

