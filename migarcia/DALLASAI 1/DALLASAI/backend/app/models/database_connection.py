"""
Database Connection Model

Represents external database connection configurations stored in MongoDB.
Used for demo purposes to connect to SQL Server databases dynamically.
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId

from app.models.user import PyObjectId


class DatabaseConnection(BaseModel):
    """Database connection configuration model."""

    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    config_type: str = Field(default="database_connection", description="Configuration type identifier")
    connection_name: str = Field(..., min_length=1, max_length=100, description="Unique name for this connection")
    component_id: str = Field(default="data-architecture", description="Component this connection belongs to")

    # Connection details
    host: str = Field(..., description="Database server hostname or IP address")
    port: int = Field(..., ge=1, le=65535, description="Database server port")
    user: str = Field(..., description="Database username")
    password: str = Field(..., description="Database password")
    database: str = Field(..., description="Database name")
    schemas: List[str] = Field(default_factory=list, description="Available schemas")

    # Metadata
    description: Optional[str] = Field(None, max_length=500, description="Connection description")
    is_active: bool = Field(default=True, description="Whether this connection is active")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "connection_name": "demo_sql_server",
                "component_id": "data-architecture",
                "host": "10.1.4.135",
                "port": 1433,
                "user": "dist1",
                "password": "dist1",
                "database": "ODS",
                "schemas": ["ODS", "SDS"],
                "description": "Demo SQL Server for Data Architecture component",
                "is_active": True
            }
        }

    def __repr__(self):
        return f"<DatabaseConnection {self.connection_name}: {self.host}:{self.port}/{self.database}>"
