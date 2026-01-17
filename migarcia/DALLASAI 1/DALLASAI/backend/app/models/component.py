"""
Component Model

Represents different components of the BSG Demo Platform using MongoDB.
"""

from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
import enum

from app.models.user import PyObjectId


class ComponentStatus(str, enum.Enum):
    """Component status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"


class Component(BaseModel):
    """Component model for storing component information."""
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    component_id: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    status: ComponentStatus = ComponentStatus.ACTIVE

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

    def __repr__(self):
        return f"<Component {self.component_id}: {self.name}>"
