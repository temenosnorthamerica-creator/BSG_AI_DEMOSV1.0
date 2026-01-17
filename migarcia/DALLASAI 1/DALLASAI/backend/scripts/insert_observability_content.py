"""
Script to insert observability content (Monitoring Architecture image) into the database.

This script converts the MonitoringArchitecture.png image to base64 HTML and stores it in the database.

Usage:
    # Activate virtual environment first:
    source venv/bin/activate
    
    # Then run:
    python scripts/insert_observability_content.py
"""

import sys
import base64
from pathlib import Path

# Add parent directory to path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Try to add venv to path if it exists (detect Python version)
python_version = f"{sys.version_info.major}.{sys.version_info.minor}"
venv_path = backend_dir / "venv" / "lib" / f"python{python_version}" / "site-packages"
if venv_path.exists():
    sys.path.insert(0, str(venv_path))

from app.core.database import SessionLocal, init_db
from app.models.content import Content
from app.core.logging import get_logger

logger = get_logger(__name__)


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
    
    # Create HTML
    html = f'''<div class="card">
  <div class="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
    <img src="data:image/png;base64,{img_base64}" alt="Monitoring Architecture Diagram" class="w-full h-auto rounded-lg shadow-lg" />
  </div>
</div>'''
    
    return html


def insert_observability_content():
    """Insert observability content into the database."""
    # Path to the image
    image_path = Path(__file__).parent.parent.parent / "frontend" / "src" / "components" / "observability" / "MonitoringArchitecture.png"
    
    if not image_path.exists():
        logger.error(f"Image not found at: {image_path}")
        return False
    
    # Convert image to HTML
    logger.info("Converting image to HTML...")
    html_content = convert_image_to_html(image_path)
    logger.info(f"Generated HTML content ({len(html_content)} characters)")
    
    # Initialize database
    logger.info("Initializing database...")
    init_db()
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Check if content already exists
        existing = db.query(Content).filter(
            Content.component_id == "observability",
            Content.content_id == "monitoring-architecture-image"
        ).first()
        
        if existing:
            logger.info("Content already exists, updating...")
            existing.body_html = html_content
            existing.title = "Monitoring Architecture"
            existing.type = "html"
            existing.order = 1
        else:
            logger.info("Creating new content entry...")
            content = Content(
                content_id="monitoring-architecture-image",
                component_id="observability",
                title="Monitoring Architecture",
                type="html",
                order=1,
                body_html=html_content,
                content_metadata={
                    "description": "Monitoring Architecture Diagram showing the complete observability stack"
                }
            )
            db.add(content)
        
        # Commit changes
        db.commit()
        logger.info("Successfully inserted/updated observability content in database")
        return True
        
    except Exception as e:
        logger.error(f"Error inserting content: {e}")
        db.rollback()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = insert_observability_content()
    sys.exit(0 if success else 1)

