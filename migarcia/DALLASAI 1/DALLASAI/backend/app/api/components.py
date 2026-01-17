"""
Component Content API Endpoints

Provides endpoints for retrieving component content using MongoDB.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.models.content import Content
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["Components"])


def create_pagination_metadata(page: int, page_size: int, total_items: int, total_pages: int) -> dict:
    """Create pagination metadata for API responses."""
    return {
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1,
    }


@router.get("/components/{component_id}/content", status_code=status.HTTP_200_OK)
async def get_component_content(
    component_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    type: Optional[str] = Query(None, description="Filter by content type"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get content for a specific component.

    Args:
        component_id: Component identifier
        page: Page number (1-indexed)
        page_size: Items per page
        type: Optional content type filter
        db: MongoDB database

    Returns:
        Paginated list of content items
    """
    try:
        # Build query filter
        query_filter = {"component_id": component_id}
        if type:
            query_filter["type"] = type
        
        # Get total count
        total_count = await db.content.count_documents(query_filter)
        total_pages = (total_count + page_size - 1) // page_size
        
        # Calculate skip
        skip = (page - 1) * page_size

        # Fetch items (removed sort by order due to Cosmos DB indexing constraints)
        cursor = db.content.find(query_filter).skip(skip).limit(page_size)
        items = await cursor.to_list(length=page_size)

        # Sort in memory if order field exists
        items = sorted(items, key=lambda x: x.get("order", 0))
        
        # Convert to Content models and then to dict
        content_list = [Content(**item).to_dict() for item in items]
        
        # Create response
        return {
            "success": True,
            "data": content_list,
            "pagination": create_pagination_metadata(page, page_size, total_count, total_pages)
        }
    except Exception as e:
        logger.error(f"Error fetching content for component {component_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch content: {str(e)}"
        )


@router.get("/components/{component_id}/content/{content_id}", status_code=status.HTTP_200_OK)
async def get_content_item(
    component_id: str,
    content_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific content item.

    Args:
        component_id: Component identifier
        content_id: Content identifier
        db: MongoDB database

    Returns:
        Content item
    """
    try:
        content_doc = await db.content.find_one({
            "component_id": component_id,
            "content_id": content_id
        })
        
        if not content_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Content not found: {content_id}"
            )
        
        content = Content(**content_doc)
        return {
            "success": True,
            "data": content.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching content item {content_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch content item: {str(e)}"
        )
