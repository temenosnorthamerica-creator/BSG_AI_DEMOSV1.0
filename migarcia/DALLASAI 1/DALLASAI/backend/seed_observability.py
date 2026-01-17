"""
Seed Observability Component

Creates the observability component in MongoDB database.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def seed_observability():
    """Seed the observability component into MongoDB."""

    connection_string = os.getenv("DATABASE_URL")
    database_name = os.getenv("DATABASE_NAME", "bsg_demo")

    try:
        print(f"Connecting to MongoDB...")
        print(f"Database: {database_name}")

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

        # Check if observability component already exists
        existing = await db.components.find_one({"component_id": "observability"})

        if existing:
            print(f"[INFO] Observability component already exists with ID: {existing['_id']}")
            print(f"       Name: {existing['name']}")
            print(f"       Description: {existing['description']}")
            print(f"       Status: {existing['status']}")
        else:
            # Create observability component
            observability_component = {
                "component_id": "observability",
                "name": "Observability",
                "description": "Monitoring, logging, and observability",
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            result = await db.components.insert_one(observability_component)
            print(f"[OK] Created observability component with ID: {result.inserted_id}")

        # List all components
        print(f"\nAll components in database:")
        components = await db.components.find({}).to_list(length=None)
        for comp in components:
            print(f"  - {comp['component_id']}: {comp['name']} ({comp['status']})")

        # Check for content collection
        print(f"\nChecking content collection...")
        content_count = await db.content.count_documents({"component_id": "observability"})
        print(f"  Observability content items: {content_count}")

        client.close()
        print(f"\n[SUCCESS] Observability component verified/created successfully!")
        return True

    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(seed_observability())
    exit(0 if success else 1)
