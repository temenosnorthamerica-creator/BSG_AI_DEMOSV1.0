"""
Script to clean (delete all documents from) the security_items collection.
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


async def clean_security_items():
    """Delete all documents from security_items collection."""
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
            print(f"[WARNING] Collection '{collection_name}' does not exist")
            client.close()
            return False
        
        # Get current count
        collection = db[collection_name]
        count_before = await collection.count_documents({})
        print(f"[INFO] Current document count: {count_before}")
        
        if count_before == 0:
            print(f"[INFO] Collection '{collection_name}' is already empty")
            client.close()
            return True
        
        # Confirm deletion
        print(f"\n[WARNING] About to delete {count_before} document(s) from '{collection_name}'")
        print("This action cannot be undone!")
        
        # Delete documents one at a time to avoid rate limiting (Cosmos DB has strict rate limits)
        total_deleted = 0
        max_retries = 3
        
        print(f"\n[INFO] Deleting documents one at a time to respect rate limits...")
        print(f"[INFO] This may take a while for {count_before} documents...")
        
        while True:
            # Get one document ID
            doc = await collection.find_one({}, {"_id": 1})
            
            if not doc:
                break
            
            doc_id = doc["_id"]
            
            # Try to delete with retries
            deleted = False
            for attempt in range(max_retries):
                try:
                    result = await collection.delete_one({"_id": doc_id})
                    if result.deleted_count > 0:
                        total_deleted += 1
                        deleted = True
                        if total_deleted % 10 == 0:
                            print(f"  Deleted {total_deleted}/{count_before} documents...")
                        break
                except Exception as e:
                    error_msg = str(e)
                    if "16500" in error_msg or "RetryAfterMs" in error_msg:
                        # Extract retry delay if available
                        import re
                        retry_match = re.search(r'RetryAfterMs[=:](\d+)', error_msg)
                        if retry_match:
                            delay_ms = int(retry_match.group(1))
                            delay_sec = (delay_ms / 1000) + 0.5  # Add small buffer
                        else:
                            delay_sec = (attempt + 1) * 0.5  # Exponential backoff
                        
                        if attempt < max_retries - 1:
                            await asyncio.sleep(delay_sec)
                            continue
                        else:
                            print(f"\n[WARNING] Rate limit hit. Waiting 2 seconds...")
                            await asyncio.sleep(2)
                            break
                    else:
                        raise
            
            # Small delay between deletions to avoid rate limiting
            await asyncio.sleep(0.2)
            
            # Check if we're done
            remaining = await collection.count_documents({})
            if remaining == 0:
                break
        
        # Verify deletion
        count_after = await collection.count_documents({})
        
        print(f"\n[SUCCESS] Deleted {total_deleted} document(s)")
        print(f"[INFO] Remaining documents: {count_after}")
        
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
    print("Clean Security Items Collection")
    print("=" * 60)
    print()
    
    success = asyncio.run(clean_security_items())
    
    print()
    if success:
        print("[SUCCESS] Operation completed")
        sys.exit(0)
    else:
        print("[ERROR] Operation failed")
        sys.exit(1)

