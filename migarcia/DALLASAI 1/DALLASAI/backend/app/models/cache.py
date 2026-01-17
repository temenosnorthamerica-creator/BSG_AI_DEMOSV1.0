"""
Cache Models

Database models for caching tooltip and demo content using MongoDB.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId

from app.models.user import PyObjectId
from app.utils.datetime_utils import utc_now


class CacheEntry(BaseModel):
    """Cache model for storing tooltip and demo content."""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    cache_key: str = Field(..., max_length=255)  # Unique key like 'kafka_tooltip', 'deployment_tooltip'
    content: str = Field(...)  # The cached content (text, html, json string)
    content_type: str = Field(default="text")  # 'text', 'html', 'json'
    metadata: Optional[Dict[str, Any]] = None  # Additional metadata
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    expires_at: Optional[datetime] = None  # Optional expiration

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

    def __repr__(self):
        return f"<CacheEntry(cache_key='{self.cache_key}', content_type='{self.content_type}')>"

    def to_dict(self):
        """Convert cache entry to dictionary."""
        return {
            "cache_key": self.cache_key,
            "content": self.content,
            "content_type": self.content_type,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }
