"""
Verify Observability Content in MongoDB

Queries the database to verify the observability content is properly stored.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


async def verify_content():
    """Verify observability content exists in MongoDB."""

    connection_string = os.getenv("DATABASE_URL")
    database_name = os.getenv("DATABASE_NAME", "bsg_demo")

    try:
        print(f"Connecting to MongoDB...")
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

        # Query observability component
        print("\n--- Observability Component ---")
        component = await db.components.find_one({"component_id": "observability"})
        if component:
            print(f"  ID: {component['_id']}")
            print(f"  Component ID: {component['component_id']}")
            print(f"  Name: {component['name']}")
            print(f"  Description: {component['description']}")
            print(f"  Status: {component['status']}")
        else:
            print("  [ERROR] Component not found!")

        # Query observability content
        print("\n--- Observability Content ---")
        contents = await db.content.find({"component_id": "observability"}).to_list(length=None)

        if contents:
            print(f"Found {len(contents)} content item(s):\n")

            for idx, content in enumerate(contents, 1):
                print(f"Content #{idx}:")
                print(f"  MongoDB ID: {content['_id']}")
                print(f"  Content ID: {content['content_id']}")
                print(f"  Component ID: {content['component_id']}")
                print(f"  Title: {content['title']}")
                print(f"  Type: {content['type']}")
                print(f"  Order: {content['order']}")

                if 'body_html' in content:
                    html_preview = content['body_html'][:200].replace('\n', ' ')
                    print(f"  HTML Preview: {html_preview}...")
                    print(f"  HTML Length: {len(content['body_html'])} characters")

                if 'content_metadata' in content:
                    print(f"  Metadata:")
                    for key, value in content['content_metadata'].items():
                        print(f"    - {key}: {value}")

                if 'created_at' in content:
                    print(f"  Created: {content['created_at']}")
                if 'updated_at' in content:
                    print(f"  Updated: {content['updated_at']}")

                print()
        else:
            print("  [WARNING] No content found!")

        # Summary
        print("\n--- Summary ---")
        total_components = await db.components.count_documents({"component_id": "observability"})
        total_content = await db.content.count_documents({"component_id": "observability"})
        print(f"  Observability Components: {total_components}")
        print(f"  Observability Content Items: {total_content}")

        client.close()
        print(f"\n[SUCCESS] Verification complete!")
        return True

    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(verify_content())
    exit(0 if success else 1)
