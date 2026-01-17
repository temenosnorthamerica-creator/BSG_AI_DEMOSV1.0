"""
Insert Observability Content into MongoDB

Converts the MonitoringArchitecture.png image to base64 HTML and stores it in MongoDB.
"""

import asyncio
import base64
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def convert_image_to_html(image_path: Path) -> str:
    """
    Convert image to base64 encoded HTML img tag.

    Args:
        image_path: Path to the image file

    Returns:
        HTML string with embedded image
    """
    # Read image file
    img_data = image_path.read_bytes()

    # Encode to base64
    img_base64 = base64.b64encode(img_data).decode('utf-8')

    # Create HTML with responsive design and interactive image map
    html = f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring Architecture</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: transparent;
        }}
        .container {{
            max-width: 100%;
            margin: 0 auto;
            position: relative;
        }}
        .image-container {{
            width: 100%;
            position: relative;
        }}
        img {{
            width: 100%;
            height: auto;
            display: block;
        }}
        area {{
            cursor: pointer;
        }}
        area:hover {{
            opacity: 0.8;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="image-container">
            <img src="data:image/png;base64,{img_base64}"
                 alt="Monitoring Architecture Diagram"
                 usemap="#architecture-map"
                 loading="lazy"
                 id="architecture-img" />
            <map name="architecture-map">
                <!-- Grafana clickable area - adjust coordinates based on actual position in image -->
                <!-- Coordinates are in format: x1,y1,x2,y2 for rectangle -->
                <area shape="rect"
                      coords="580,180,820,280"
                      alt="Grafana Dashboard"
                      onclick="openGrafanaDashboard(event)">
            </map>
        </div>
    </div>
    <script>
        function openGrafanaDashboard(event) {{
            event.preventDefault();
            const url = 'https://transactwb.temenos.com/grafana/d/mrtS77BGz/channel-transaction-summary?orgId=1';
            window.open(url, '_blank', 'noopener,noreferrer,width=1400,height=900');
        }}

        // Make image map responsive
        function resizeImageMap() {{
            const img = document.getElementById('architecture-img');
            const map = document.querySelector('map[name="architecture-map"]');
            if (!img || !map) return;

            const originalWidth = 1284; // Original image width
            const currentWidth = img.clientWidth;
            const scale = currentWidth / originalWidth;

            const areas = map.getElementsByTagName('area');
            for (let area of areas) {{
                const coords = area.getAttribute('data-coords') || area.getAttribute('coords');
                if (!area.hasAttribute('data-coords')) {{
                    area.setAttribute('data-coords', coords);
                }}
                const coordsArray = coords.split(',').map(coord => Math.round(parseFloat(coord) * scale));
                area.setAttribute('coords', coordsArray.join(','));
            }}
        }}

        // Resize on load and window resize
        window.addEventListener('load', resizeImageMap);
        window.addEventListener('resize', resizeImageMap);
    </script>
</body>
</html>'''

    return html


async def insert_observability_content():
    """Insert observability content into MongoDB."""

    connection_string = os.getenv("DATABASE_URL")
    database_name = os.getenv("DATABASE_NAME", "bsg_demo")

    # Path to the image
    image_path = Path(__file__).parent.parent / "frontend" / "src" / "components" / "observability" / "MonitoringArchitecture.png"

    if not image_path.exists():
        print(f"[ERROR] Image not found at: {image_path}")
        return False

    print(f"[OK] Found image at: {image_path}")
    print(f"    Image size: {image_path.stat().st_size / 1024:.2f} KB")

    # Convert image to HTML
    print("Converting image to HTML...")
    html_content = convert_image_to_html(image_path)
    print(f"[OK] Generated HTML content ({len(html_content)} characters)")

    try:
        print(f"\nConnecting to MongoDB...")
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

        # Check if content already exists
        existing = await db.content.find_one({
            "component_id": "observability",
            "content_id": "monitoring-architecture-image"
        })

        if existing:
            print(f"[INFO] Content already exists with ID: {existing['_id']}")
            print("       Updating existing content...")

            result = await db.content.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "body_html": html_content,
                    "title": "Monitoring Architecture",
                    "type": "html",
                    "order": 1,
                    "updated_at": datetime.utcnow(),
                    "content_metadata": {
                        "description": "Monitoring Architecture Diagram showing the complete observability stack",
                        "image_size_kb": image_path.stat().st_size / 1024,
                        "html_size_chars": len(html_content)
                    }
                }}
            )
            print(f"[OK] Updated {result.modified_count} document(s)")
        else:
            print("Creating new content entry...")
            content = {
                "content_id": "monitoring-architecture-image",
                "component_id": "observability",
                "title": "Monitoring Architecture",
                "type": "html",
                "order": 1,
                "body_html": html_content,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "content_metadata": {
                    "description": "Monitoring Architecture Diagram showing the complete observability stack",
                    "image_size_kb": image_path.stat().st_size / 1024,
                    "html_size_chars": len(html_content)
                }
            }

            result = await db.content.insert_one(content)
            print(f"[OK] Created content with ID: {result.inserted_id}")

        # Verify content exists
        print("\nVerifying content in database...")
        all_observability_content = await db.content.find({"component_id": "observability"}).to_list(length=None)
        print(f"[OK] Found {len(all_observability_content)} observability content item(s):")

        for item in all_observability_content:
            print(f"    - {item['content_id']}: {item['title']} (type: {item['type']})")
            if 'content_metadata' in item:
                metadata = item['content_metadata']
                if 'html_size_chars' in metadata:
                    print(f"      HTML size: {metadata['html_size_chars']} characters")
                if 'image_size_kb' in metadata:
                    print(f"      Image size: {metadata['image_size_kb']:.2f} KB")

        client.close()
        print(f"\n[SUCCESS] Observability content inserted/updated successfully!")
        return True

    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(insert_observability_content())
    exit(0 if success else 1)
