"""
Database Seed Script

Seeds the MongoDB database with initial component and content data.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.database import init_db, get_database
from app.models import Component, Content
from app.core.logging import get_logger

logger = get_logger(__name__)


async def seed_database():
    """Seed the MongoDB database with initial data."""
    
    # Initialize database connection
    db = await init_db()
    
    try:
        # Check if data already exists
        existing_components = await db.components.count_documents({})
        if existing_components > 0:
            logger.info(f"Database already contains {existing_components} components. Skipping seed.")
            return
        
        logger.info("Seeding database with component and content data...")
        
        # Create Components
        components = [
            {
                "component_id": "integration",
                "name": "Integration",
                "description": "API integration and connectivity",
                "status": "active"
            },
            {
                "component_id": "data-architecture",
                "name": "Data Architecture",
                "description": "Data modeling and architecture patterns",
                "status": "active"
            },
            {
                "component_id": "deployment",
                "name": "Deployment",
                "description": "Deployment strategies and infrastructure",
                "status": "active"
            },
            {
                "component_id": "security",
                "name": "Security",
                "description": "Security practices and compliance",
                "status": "active"
            },
            {
                "component_id": "observability",
                "name": "Observability",
                "description": "Monitoring, logging, and observability",
                "status": "active"
            },
            {
                "component_id": "design-time",
                "name": "Design Time",
                "description": "Design-time tools and development experience",
                "status": "active"
            },
        ]
        
        await db.components.insert_many(components)
        
        # Create Content for Integration Component
        integration_contents = [
            {
                "content_id": "int-001",
                "component_id": "integration",
                "title": "API Overview",
                "type": "document",
                "order": 1,
                "body_json": {
                    "image_path": "/app/uploads/videos/api-overview.jpg",
                    "image_url": "/api/v1/static/api-overview.jpg",
                    "interactive_areas": [
                        {
                            "title": "REST APIs",
                            "description": "Temenos exposes its business and data capabilities through a comprehensive set of RESTful APIs that use JSON payloads and adhere to semantic versioning and OpenAPI specifications, enabling seamless and standardized integration with external systems. These APIs cover most core banking functionalities and can be customized or extended using the Workbench low-code tool to meet specific business requirements.",
                            "position": {"top": "31%", "left": "12%", "width": "32%", "height": "4%"}
                        }
                    ]
                },
                "content_metadata": {
                    "duration_minutes": 3,
                    "difficulty": "beginner",
                    "format": "image/jpeg",
                    "file_size": 111626
                }
            },
            {
                "content_id": "int-002",
                "component_id": "integration",
                "title": "REST API Overview",
                "type": "slide",
                "order": 2,
                "body_json": {
                    "heading": "Temenos REST API Architecture",
                    "description": "Comprehensive REST APIs for core banking",
                    "bullets": [
                        "JSON payloads with semantic versioning",
                        "OpenAPI specifications for standardization",
                        "Covers all core banking functionalities",
                        "Customizable via Workbench low-code tool"
                    ]
                },
                "content_metadata": {
                    "duration_minutes": 5,
                    "difficulty": "beginner"
                }
            },
            {
                "content_id": "int-003",
                "component_id": "integration",
                "title": "API Integration Patterns",
                "type": "slide",
                "order": 3,
                "body_json": {
                    "heading": "Common Integration Patterns",
                    "description": "Best practices for integrating with Temenos APIs",
                    "bullets": [
                        "Authentication using API keys",
                        "Rate limiting and throttling",
                        "Error handling and retries",
                        "Webhook notifications for async operations"
                    ]
                },
                "content_metadata": {
                    "duration_minutes": 8,
                    "difficulty": "intermediate"
                }
            },
        ]
        
        await db.content.insert_many(integration_contents)
        
        # Create indexes
        await db.components.create_index("component_id", unique=True)
        await db.content.create_index("content_id", unique=True)
        await db.content.create_index("component_id")
        
        logger.info("Database seeded successfully!")
        
    except Exception as e:
        logger.error(f"Error seeding database: {str(e)}", exc_info=True)
        raise


if __name__ == "__main__":
    asyncio.run(seed_database())
