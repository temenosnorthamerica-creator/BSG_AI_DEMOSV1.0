"""
Script to create the security_items collection with proper schema and indexes.
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


async def create_security_items_collection():
    """Create the security_items collection with proper indexes."""
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
        if collection_name in collections:
            print(f"[INFO] Collection '{collection_name}' already exists")
            print(f"[INFO] Dropping existing collection...")
            await db.drop_collection(collection_name)
            print(f"[OK] Existing collection dropped")
        
        # Create collection by inserting and deleting a sample document
        collection = db[collection_name]
        await collection.insert_one({
            "document_number": 0,
            "document_name": "_collection_created",
            "document": {}
        })
        await collection.delete_one({"document_number": 0})
        print(f"[OK] Collection '{collection_name}' created")
        
        # Create indexes
        print(f"\nCreating indexes...")
        
        # Index on document_number (unique)
        await collection.create_index("document_number", unique=True)
        print(f"  [OK] Index created on 'document_number' (unique)")
        
        # Index on document_name for faster searches
        await collection.create_index("document_name")
        print(f"  [OK] Index created on 'document_name'")
        
        # Verify collection
        count = await collection.count_documents({})
        indexes = await collection.index_information()
        
        print(f"\n[SUCCESS] Collection setup complete!")
        print(f"  Collection: {collection_name}")
        print(f"  Documents: {count}")
        print(f"  Indexes: {len(indexes)}")
        print(f"  Index details:")
        for idx_name, idx_info in indexes.items():
            print(f"    - {idx_name}: {idx_info.get('key', [])}")
        
        # Show expected schema
        print(f"\n[INFO] Expected schema:")
        print(f"  - document_number: integer (unique, indexed)")
        print(f"  - document_name: string (indexed)")
        print(f"  - document: object (any JSON object)")
        
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
    print("Create Security Items Collection")
    print("=" * 60)
    print()
    
    success = asyncio.run(create_security_items_collection())
    
    print()
    if success:
        print("[SUCCESS] Operation completed")
        sys.exit(0)
    else:
        print("[ERROR] Operation failed")
        sys.exit(1)

