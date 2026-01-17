"""
Add Data Flow Architecture Content to MongoDB

This script adds the animated Data Flow Architecture content to the database
for the Data Architecture component.
"""

import asyncio
import sys
import os
from datetime import datetime, timezone

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.database import init_db


async def add_data_flow_content():
    """Add Data Flow Architecture content to MongoDB."""

    # Initialize database connection
    db = await init_db()

    try:
        # Check if content already exists
        existing = await db.content.find_one({
            "component_id": "data-architecture",
            "content_id": "data-flow-architecture"
        })

        if existing:
            print("WARNING: Data Flow Architecture content already exists. Updating...")
            result = await db.content.update_one(
                {"content_id": "data-flow-architecture"},
                {"$set": {
                    "title": "Data Flow Architecture",
                    "type": "html",
                    "order": 1,
                    "body_html": None,
                    "body_json": {
                        "component_type": "animated_diagram",
                        "description": "Interactive animated diagram showing data flow patterns in Temenos architecture"
                    },
                    "content_metadata": {
                        "duration_minutes": 10,
                        "difficulty": "intermediate",
                        "interactive": True,
                        "animation_paths": 3
                    },
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            print(f"SUCCESS: Updated Data Flow Architecture content!")
        else:
            print("Adding new Data Flow Architecture content...")

            content_entry = {
                "content_id": "data-flow-architecture",
                "component_id": "data-architecture",
                "title": "Data Flow Architecture",
                "type": "html",
                "order": 1,
                "body_html": None,
                "body_json": {
                    "component_type": "animated_diagram",
                    "description": "Interactive animated diagram showing data flow patterns in Temenos architecture",
                    "features": [
                        "3 distinct animation paths",
                        "Keyboard shortcuts (1, 2, 3, Space)",
                        "Play/pause/step controls",
                        "Interactive tooltips",
                        "Path highlighting"
                    ],
                    "paths": {
                        "path_c": "High-Volume Query: Pub/Sub → Data Hub → Analytics",
                        "path_a": "Event-Driven: Core → Events → Pub/Sub → Microservices",
                        "path_b": "ETL Pipeline: Core → File → ETL → Data Warehouse → Analytics"
                    }
                },
                "content_metadata": {
                    "duration_minutes": 10,
                    "difficulty": "intermediate",
                    "interactive": True,
                    "animation_paths": 3,
                    "requires_keyboard": True
                },
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }

            result = await db.content.insert_one(content_entry)
            print(f"SUCCESS: Successfully added Data Flow Architecture content with ID: {result.inserted_id}")

        # Verify the content was added
        content = await db.content.find_one({"content_id": "data-flow-architecture"})
        if content:
            print(f"\nContent Details:")
            print(f"   Component ID: {content['component_id']}")
            print(f"   Title: {content['title']}")
            print(f"   Type: {content['type']}")
            print(f"   Order: {content['order']}")
            print(f"   Interactive: {content['content_metadata'].get('interactive', False)}")
            print(f"   Animation Paths: {content['content_metadata'].get('animation_paths', 0)}")

        print("\nData Flow Architecture content is ready!")
        print("Navigate to http://localhost:3000 -> Data Architecture -> Content tab")

    except Exception as e:
        print(f"ERROR: Error adding content: {str(e)}")
        raise


if __name__ == "__main__":
    print("=" * 70)
    print("  Adding Data Flow Architecture Content to MongoDB")
    print("=" * 70)
    print()

    asyncio.run(add_data_flow_content())
