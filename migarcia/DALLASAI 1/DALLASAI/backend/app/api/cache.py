"""
Cache API Endpoints

Endpoints for managing cached tooltip and demo content.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.models.cache import CacheEntry
from app.core.logging import get_logger
from app.utils.datetime_utils import utc_now

router = APIRouter(prefix="/cache", tags=["cache"])
logger = get_logger(__name__)


class CacheUpdateRequest(BaseModel):
    """Request model for updating cache."""
    cache_key: str
    content: str
    content_type: str = "text"
    metadata: Optional[dict] = None


class CacheResponse(BaseModel):
    """Response model for cache retrieval."""
    cache_key: str
    content: str
    content_type: str
    metadata: Optional[dict] = None
    updated_at: str


@router.get("/{cache_key}")
async def get_cache(cache_key: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Get cached content by key.

    Args:
        cache_key: The unique cache key (e.g., 'kafka_tooltip')
        db: MongoDB database

    Returns:
        Cached content or 404 if not found
    """
    try:
        # Find cache entry
        result = await db.cache.find_one({"cache_key": cache_key})

        if not result:
            raise HTTPException(status_code=404, detail=f"Cache entry '{cache_key}' not found")

        cache_entry = CacheEntry(**result)

        return {
            "success": True,
            "data": {
                "cache_key": cache_entry.cache_key,
                "content": cache_entry.content,
                "content_type": cache_entry.content_type,
                "metadata": cache_entry.metadata,
                "updated_at": cache_entry.updated_at.isoformat() if cache_entry.updated_at else None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving cache: {str(e)}")


@router.post("/{cache_key}")
async def update_cache(cache_key: str, request: CacheUpdateRequest, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Update or create cache entry.

    Args:
        cache_key: The unique cache key
        request: Cache update request with content
        db: MongoDB database

    Returns:
        Updated cache entry
    """
    try:
        # Check if entry exists
        existing = await db.cache.find_one({"cache_key": cache_key})

        now = utc_now()

        if existing:
            # Update existing entry
            await db.cache.update_one(
                {"cache_key": cache_key},
                {
                    "$set": {
                        "content": request.content,
                        "content_type": request.content_type,
                        "metadata": request.metadata,
                        "updated_at": now
                    }
                }
            )
            logger.info(f"Updated cache entry: {cache_key}")
        else:
            # Create new entry
            cache_entry = CacheEntry(
                cache_key=cache_key,
                content=request.content,
                content_type=request.content_type,
                metadata=request.metadata,
                created_at=now,
                updated_at=now
            )

            await db.cache.insert_one(cache_entry.dict(by_alias=True))
            logger.info(f"Created cache entry: {cache_key}")

        # Retrieve and return the updated entry
        result = await db.cache.find_one({"cache_key": cache_key})
        cache_entry = CacheEntry(**result)

        return {
            "success": True,
            "data": {
                "cache_key": cache_entry.cache_key,
                "content": cache_entry.content,
                "content_type": cache_entry.content_type,
                "metadata": cache_entry.metadata,
                "updated_at": cache_entry.updated_at.isoformat() if cache_entry.updated_at else None
            }
        }

    except Exception as e:
        logger.error(f"Error updating cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating cache: {str(e)}")


@router.delete("/{cache_key}")
async def delete_cache(cache_key: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Delete cache entry.

    Args:
        cache_key: The unique cache key
        db: MongoDB database

    Returns:
        Success message
    """
    try:
        result = await db.cache.delete_one({"cache_key": cache_key})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Cache entry '{cache_key}' not found")

        logger.info(f"Deleted cache entry: {cache_key}")

        return {
            "success": True,
            "message": f"Cache entry '{cache_key}' deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting cache: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting cache: {str(e)}")
