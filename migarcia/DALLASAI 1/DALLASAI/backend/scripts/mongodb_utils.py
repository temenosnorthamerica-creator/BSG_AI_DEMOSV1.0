"""
MongoDB Utility Script

Provides utilities for MongoDB database operations, collection management,
and data inspection.
"""

import asyncio
import sys
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

# Add parent directory to path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class MongoDBUtils:
    """Utility class for MongoDB operations."""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
    
    async def connect(self) -> bool:
        """Connect to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(
                settings.DATABASE_URL,
                maxPoolSize=settings.DB_MAX_POOL_SIZE,
                minPoolSize=settings.DB_MIN_POOL_SIZE,
                serverSelectionTimeoutMS=settings.DB_CONNECT_TIMEOUT * 1000,
                connectTimeoutMS=settings.DB_CONNECT_TIMEOUT * 1000,
                socketTimeoutMS=settings.DB_CONNECT_TIMEOUT * 1000,
            )
            
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            return True
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
    
    async def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
    
    async def list_collections(self) -> List[str]:
        """List all collections in the database."""
        if not self.db:
            raise RuntimeError("Not connected to database")
        return await self.db.list_collection_names()
    
    async def get_collection_info(self, collection_name: str) -> Dict[str, Any]:
        """Get information about a collection."""
        if not self.db:
            raise RuntimeError("Not connected to database")
        
        collection = self.db[collection_name]
        count = await collection.count_documents({})
        
        # Get indexes
        indexes = await collection.index_information()
        
        # Get sample document
        sample = await collection.find_one()
        
        return {
            "name": collection_name,
            "document_count": count,
            "indexes": indexes,
            "sample_fields": list(sample.keys()) if sample else []
        }
    
    async def show_collection_contents(
        self, 
        collection_name: str, 
        limit: int = 10,
        filter_query: Optional[Dict] = None
    ) -> List[Dict]:
        """Show contents of a collection."""
        if not self.db:
            raise RuntimeError("Not connected to database")
        
        collection = self.db[collection_name]
        query = filter_query or {}
        
        cursor = collection.find(query).limit(limit)
        documents = await cursor.to_list(length=limit)
        
        return documents
    
    async def create_collection(self, collection_name: str) -> bool:
        """Create a collection if it doesn't exist."""
        if not self.db:
            raise RuntimeError("Not connected to database")
        
        try:
            # Check if collection exists
            collections = await self.db.list_collection_names()
            if collection_name in collections:
                print(f"Collection '{collection_name}' already exists")
                return True
            
            # Create collection by inserting and deleting a document
            await self.db[collection_name].insert_one({"_created": True})
            await self.db[collection_name].delete_one({"_created": True})
            print(f"Collection '{collection_name}' created successfully")
            return True
        except Exception as e:
            print(f"Error creating collection: {e}")
            return False
    
    async def create_index(
        self, 
        collection_name: str, 
        field: str, 
        unique: bool = False
    ) -> bool:
        """Create an index on a collection."""
        if not self.db:
            raise RuntimeError("Not connected to database")
        
        try:
            collection = self.db[collection_name]
            await collection.create_index(field, unique=unique)
            print(f"Index created on '{collection_name}.{field}' (unique={unique})")
            return True
        except Exception as e:
            print(f"Error creating index: {e}")
            return False


async def main():
    """Main function for command-line usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description="MongoDB Utility Script")
    parser.add_argument(
        "action",
        choices=["list", "info", "show", "create-collection", "create-index"],
        help="Action to perform"
    )
    parser.add_argument(
        "--collection",
        help="Collection name (required for most actions)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Limit for show action (default: 10)"
    )
    parser.add_argument(
        "--field",
        help="Field name for create-index action"
    )
    parser.add_argument(
        "--unique",
        action="store_true",
        help="Create unique index"
    )
    
    args = parser.parse_args()
    
    utils = MongoDBUtils()
    
    try:
        # Connect
        if not await utils.connect():
            print("Failed to connect to MongoDB")
            return 1
        
        # Perform action
        if args.action == "list":
            collections = await utils.list_collections()
            print("\nCollections:")
            for coll in sorted(collections):
                info = await utils.get_collection_info(coll)
                print(f"  - {coll}: {info['document_count']} document(s)")
        
        elif args.action == "info":
            if not args.collection:
                print("Error: --collection is required for info action")
                return 1
            info = await utils.get_collection_info(args.collection)
            print(f"\nCollection: {info['name']}")
            print(f"Documents: {info['document_count']}")
            print(f"Indexes: {len(info['indexes'])}")
            if info['sample_fields']:
                print(f"Fields: {', '.join(info['sample_fields'])}")
        
        elif args.action == "show":
            if not args.collection:
                print("Error: --collection is required for show action")
                return 1
            documents = await utils.show_collection_contents(
                args.collection, 
                limit=args.limit
            )
            print(f"\nDocuments in '{args.collection}' (showing {len(documents)}):")
            for i, doc in enumerate(documents, 1):
                print(f"\n--- Document {i} ---")
                # Convert ObjectId to string for JSON serialization
                doc_str = json.dumps(doc, default=str, indent=2)
                print(doc_str)
        
        elif args.action == "create-collection":
            if not args.collection:
                print("Error: --collection is required for create-collection action")
                return 1
            await utils.create_collection(args.collection)
        
        elif args.action == "create-index":
            if not args.collection or not args.field:
                print("Error: --collection and --field are required for create-index action")
                return 1
            await utils.create_index(args.collection, args.field, args.unique)
        
        return 0
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        await utils.disconnect()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

