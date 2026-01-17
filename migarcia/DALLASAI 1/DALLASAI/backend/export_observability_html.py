"""
Export Observability Content HTML

Exports the stored HTML content to a file for preview.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


async def export_html():
    """Export observability HTML content to a file."""

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

        # Query observability content
        content = await db.content.find_one({
            "component_id": "observability",
            "content_id": "monitoring-architecture-image"
        })

        if not content:
            print("[ERROR] Content not found!")
            return False

        if 'body_html' not in content:
            print("[ERROR] No HTML content in document!")
            return False

        # Export to file
        output_path = Path(__file__).parent / "observability_preview.html"
        output_path.write_text(content['body_html'], encoding='utf-8')

        print(f"[OK] HTML exported to: {output_path}")
        print(f"    File size: {output_path.stat().st_size / 1024:.2f} KB")
        print(f"\nYou can open this file in a browser to preview the content:")
        print(f"    file://{output_path}")

        client.close()
        return True

    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(export_html())
    exit(0 if success else 1)
