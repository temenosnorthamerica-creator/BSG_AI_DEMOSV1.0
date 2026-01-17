"""
Security Item Model

Database model for security items stored in MongoDB.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId

from app.models.user import PyObjectId
from app.utils.datetime_utils import utc_now


class SecurityItem(BaseModel):
    """Security item model for storing security-related documents."""
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    document_number: int = Field(..., ge=1, description="Document number (must be >= 1, unique)")
    document_name: str = Field(..., min_length=1, description="Document name (text)")
    document: Dict[str, Any] = Field(default_factory=dict, description="Document object (any JSON object)")
    created_at: Optional[datetime] = Field(default_factory=utc_now)
    updated_at: Optional[datetime] = Field(default_factory=utc_now)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "document_number": 1,
                "document_name": "Security Policy Document",
                "document": {
                    "type": "policy",
                    "content": "This is a sample security document.",
                    "version": "1.0"
                }
            }
        }

    def __repr__(self):
        return f"<SecurityItem(document_number={self.document_number}, document_name={self.document_name})>"

    def to_dict(self):
        """Convert security item to dictionary."""
        return {
            "id": str(self.id) if self.id else None,
            "document_number": self.document_number,
            "document_name": self.document_name,
            "document": self.document,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

