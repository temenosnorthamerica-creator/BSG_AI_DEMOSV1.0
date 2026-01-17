"""
Script to drop (remove) the security_items collection entirely.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings


async def drop_security_items():
    """Drop the security_items collection entirely."""
    # Use environment variable if set, otherwise use settings
    import os
    connection_string = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    database_name = os.getenv("DATABASE_NAME", settings.DATABASE_NAME)
    collection_name = "security_items"
    
    try:
        print(f"Connecting to MongoDB...")
        print(f"Database: {database_name}")
        print(f"Collection: {collection_name}")
        
        client = AsyncIOMotorClient(
            connection_string,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=30000,
            socketTimeoutMS=30000,
        )
        
        # Test connection
        await client.admin.command('ping')
        print("[OK] Connection successful!")
        
        # Get database
        db = client[database_name]
        
        # Check if collection exists
        collections = await db.list_collection_names()
        if collection_name not in collections:
            print(f"[INFO] Collection '{collection_name}' does not exist")
            client.close()
            return True
        
        # Get current count
        collection = db[collection_name]
        count = await collection.count_documents({})
        print(f"[INFO] Current document count: {count}")
        
        # Confirm deletion
        print(f"\n[WARNING] About to DROP collection '{collection_name}'")
        print(f"[WARNING] This will permanently delete the collection and all {count} document(s)")
        print("[WARNING] This action cannot be undone!")
        
        # Drop the collection
        await db.drop_collection(collection_name)
        
        # Verify collection is dropped
        collections_after = await db.list_collection_names()
        if collection_name not in collections_after:
            print(f"\n[SUCCESS] Collection '{collection_name}' has been dropped successfully")
        else:
            print(f"\n[WARNING] Collection '{collection_name}' may still exist")
        
        client.close()
        return True
        
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"[ERROR] Connection failed: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Drop Security Items Collection")
    print("=" * 60)
    print()
    
    success = asyncio.run(drop_security_items())
    
    print()
    if success:
        print("[SUCCESS] Operation completed")
        sys.exit(0)
    else:
        print("[ERROR] Operation failed")
        sys.exit(1)

