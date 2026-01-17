from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId

from app.models.user import PyObjectId
from app.utils.datetime_utils import utc_now


class SecurityPresentation(BaseModel):
    """Security presentation model for storing security-related presentation documents."""
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    presentation_number: int = Field(..., ge=1, description="Presentation number (must be >= 1, unique)")
    presentation_name: str = Field(..., min_length=1, description="Presentation name (text)")
    presentation: Dict[str, Any] = Field(default_factory=dict, description="Presentation object (any JSON object)")
    created_at: Optional[datetime] = Field(default_factory=utc_now)
    updated_at: Optional[datetime] = Field(default_factory=utc_now)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "presentation_number": 1,
                "presentation_name": "Security Overview Presentation",
                "presentation": {
                    "type": "presentation",
                    "slides": [],
                    "version": "1.0"
                }
            }
        }

    def __repr__(self):
        return f"<SecurityPresentation(presentation_number={self.presentation_number}, presentation_name={self.presentation_name})>"

    def to_dict(self):
        """Convert security presentation to dictionary."""
        return {
            "id": str(self.id) if self.id else None,
            "presentation_number": self.presentation_number,
            "presentation_name": self.presentation_name,
            "presentation": self.presentation,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

