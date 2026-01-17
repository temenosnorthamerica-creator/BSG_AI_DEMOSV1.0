"""Create MongoDB collections for BSG Demo Platform."""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

async def create_collections():
    """Create required collections in MongoDB."""
    # Use local MongoDB for development
    connection_string = "mongodb://localhost:27017"
    database_name = "bsg_demo"

    collections_to_create = [
        "videos",
        "security_docs",  # MongoDB collection names can't have spaces, using underscore
        "presentations",
        "integration",  # Component/Collection convention: integration component uses integration collection
        "security_items",
        "security_presentation",
        "data_architecture"  # Data Architecture component collection
    ]
    
    try:
        print(f"Connecting to MongoDB...")
        print(f"Host: localhost:27017")
        
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
        
        # Create collections
        print(f"\nCreating collections...")
        for collection_name in collections_to_create:
            # Check if collection exists
            existing_collections = await db.list_collection_names()
            
            if collection_name in existing_collections:
                print(f"  [SKIP] Collection '{collection_name}' already exists")
            else:
                # Create collection by inserting an empty document and then deleting it
                # This ensures the collection is created
                await db[collection_name].insert_one({"_created": True})
                await db[collection_name].delete_one({"_created": True})
                print(f"  [OK] Created collection '{collection_name}'")
        
        # Create indexes for better performance
        print(f"\nCreating indexes...")
        
        # Videos collection indexes
        await db["videos"].create_index("video_id", unique=True)
        await db["videos"].create_index("component_id")
        await db["videos"].create_index("title")
        print("  [OK] Indexes created for 'videos' collection")
        
        # Security docs collection indexes
        await db["security_docs"].create_index("doc_id", unique=True)
        await db["security_docs"].create_index("title")
        await db["security_docs"].create_index("category")
        print("  [OK] Indexes created for 'security_docs' collection")
        
        # Presentations collection indexes
        await db["presentations"].create_index("presentation_id", unique=True)
        await db["presentations"].create_index("title")
        await db["presentations"].create_index("component_id")
        print("  [OK] Indexes created for 'presentations' collection")

        # Integration collection indexes
        await db["integration"].create_index("integration_id", unique=True)
        await db["integration"].create_index("name")
        await db["integration"].create_index("status")
        print("  [OK] Indexes created for 'integration' collection")

        # Security items collection indexes
        await db["security_items"].create_index("document_number", unique=True)
        await db["security_items"].create_index("document_name")
        print("  [OK] Indexes created for 'security_items' collection")

        # Security presentation collection indexes
        await db["security_presentation"].create_index("presentation_number", unique=True)
        await db["security_presentation"].create_index("presentation_name")
        print("  [OK] Indexes created for 'security_presentation' collection")

        # List all collections
        print(f"\nAll collections in database:")
        all_collections = await db.list_collection_names()
        for coll in sorted(all_collections):
            count = await db[coll].count_documents({})
            print(f"  - {coll}: {count} document(s)")
        
        client.close()
        print(f"\n[SUCCESS] All collections created successfully!")
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
    success = asyncio.run(create_collections())
    exit(0 if success else 1)

