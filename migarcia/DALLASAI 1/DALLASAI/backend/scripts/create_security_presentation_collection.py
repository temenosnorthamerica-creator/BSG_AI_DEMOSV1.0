"""
Create security_presentation collection in MongoDB.

This script creates the security_presentation collection with the required schema:
- presentation_number (integer, unique)
- presentation_name (text)
- presentation (object)
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

async def create_security_presentation_collection():
    """Create security_presentation collection with indexes."""
    # Get connection details from environment variables
    connection_string = os.getenv("DATABASE_URL")
    if not connection_string:
        print("[ERROR] DATABASE_URL environment variable is not set")
        return False
    database_name = os.getenv("DATABASE_NAME", "bsg_demo")
    collection_name = "security_presentation"
    
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
        print(f"[OK] Database '{database_name}' accessible")
        
        # Check if collection exists
        existing_collections = await db.list_collection_names()
        
        if collection_name in existing_collections:
            print(f"\n[INFO] Collection '{collection_name}' already exists")
            doc_count = await db[collection_name].count_documents({})
            print(f"[INFO] Collection has {doc_count} document(s)")
        else:
            # Create collection by inserting an empty document and then deleting it
            await db[collection_name].insert_one({"_created": True})
            await db[collection_name].delete_one({"_created": True})
            print(f"\n[OK] Created collection '{collection_name}'")
        
        # Create indexes
        print(f"\nCreating indexes...")
        
        try:
            # Unique index on presentation_number
            await db[collection_name].create_index("presentation_number", unique=True)
            print("  [OK] Created unique index on 'presentation_number'")
        except Exception as e:
            print(f"  [WARN] Index on 'presentation_number' may already exist: {e}")
        
        try:
            # Index on presentation_name
            await db[collection_name].create_index("presentation_name")
            print("  [OK] Created index on 'presentation_name'")
        except Exception as e:
            print(f"  [WARN] Index on 'presentation_name' may already exist: {e}")
        
        # Display collection schema information
        print(f"\n[INFO] Collection Schema:")
        print(f"  - presentation_number: integer (unique, required)")
        print(f"  - presentation_name: string (required)")
        print(f"  - presentation: object (any JSON object)")
        print(f"  - created_at: datetime (optional)")
        print(f"  - updated_at: datetime (optional)")
        
        # List indexes
        print(f"\n[INFO] Collection Indexes:")
        indexes = await db[collection_name].index_information()
        for index_name, index_info in indexes.items():
            print(f"  - {index_name}: {index_info.get('key', [])}")
        
        client.close()
        print(f"\n[SUCCESS] Collection '{collection_name}' is ready!")
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
    success = asyncio.run(create_security_presentation_collection())
    exit(0 if success else 1)

