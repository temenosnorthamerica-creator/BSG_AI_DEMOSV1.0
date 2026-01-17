"""
Content Models

Database models for component content using MongoDB.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId

from app.models.user import PyObjectId
from app.utils.datetime_utils import utc_now


class Content(BaseModel):
    """Content model for component content."""
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    content_id: str = Field(..., max_length=255)
    component_id: str = Field(..., max_length=50)
    title: str = Field(..., max_length=255)
    type: str = Field(..., max_length=50)  # 'slide', 'document', 'tutorial', 'html'
    order: int = Field(default=0)
    body_html: Optional[str] = None  # For HTML content
    body_json: Optional[Dict[str, Any]] = None  # For structured content
    content_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

    def __repr__(self):
        return f"<Content(content_id='{self.content_id}', component_id='{self.component_id}', title='{self.title}')>"

    def to_dict(self):
        """Convert content to dictionary."""
        body = {}
        if self.body_html:
            body["html"] = self.body_html
        if self.body_json:
            body.update(self.body_json)
        
        return {
            "content_id": self.content_id,
            "title": self.title,
            "type": self.type,
            "order": self.order,
            "body": body if body else None,
            "metadata": self.content_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
