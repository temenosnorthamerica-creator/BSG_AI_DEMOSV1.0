"""
Script to clear all data from security_presentation collection.

Usage:
    python scripts/clear_security_presentation.py
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


async def clear_security_presentation_collection():
    """
    Clear all documents from the security_presentation collection.
    """
    print(f"\nConnecting to MongoDB...")
    try:
        client = AsyncIOMotorClient(
            settings.DATABASE_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
        )
        await client.admin.command('ping')
        print("[OK] Connection successful!")
        db = client[settings.DATABASE_NAME]
        print(f"Database: {settings.DATABASE_NAME}")
        
        collection = db["security_presentation"]
        print(f"Collection: security_presentation")

        # Count documents before deletion
        count_before = await collection.count_documents({})
        print(f"\nDocuments in collection before deletion: {count_before}")

        if count_before == 0:
            print("[INFO] Collection is already empty.")
            return

        # Delete all documents
        print(f"\nDeleting all documents...")
        result = await collection.delete_many({})
        
        print(f"[OK] Deleted {result.deleted_count} document(s)")

        # Verify deletion
        count_after = await collection.count_documents({})
        print(f"\nDocuments in collection after deletion: {count_after}")

        if count_after == 0:
            print(f"\n[SUCCESS] Collection 'security_presentation' has been cleared successfully!")
        else:
            print(f"\n[WARNING] Some documents may still exist. Count: {count_after}")

    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if 'client' in locals() and client:
            client.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Clear Security Presentation Collection")
    print("=" * 60)
    
    # Confirm before deletion
    response = input("\nAre you sure you want to delete ALL documents from 'security_presentation' collection? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        asyncio.run(clear_security_presentation_collection())
    else:
        print("\n[INFO] Operation cancelled.")

