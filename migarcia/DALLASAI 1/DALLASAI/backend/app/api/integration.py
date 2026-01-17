"""
Integration API Endpoints

Provides integration-related endpoints including API key management and proxy.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.core.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime
import httpx

router = APIRouter(prefix="/integration", tags=["integration"])
logger = get_logger(__name__)


class ApiKeyUpdate(BaseModel):
    """Model for API key update request."""
    api_key: str


@router.get("/config")
async def get_integration_config(
    settings: Settings = Depends(get_settings)
) -> Dict[str, str]:
    """
    Get integration configuration including API keys.

    Returns:
        Integration configuration with API keys
    """
    return {
        "temenos_api_key": settings.TEMENOS_DEV_PORTAL_APIKEY or ""
    }


@router.get("/api-key")
async def get_user_api_key(
    user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Get the user's stored API key.

    Args:
        user_id: User identifier from header (optional for demo)
        db: Database connection

    Returns:
        User's API key information
    """
    try:
        # Use a default user_id for demo purposes if not provided
        if not user_id:
            user_id = "demo_user"

        # Find the user's API key in the integration collection
        api_key_doc = await db.integration.find_one({"user_id": user_id})

        if api_key_doc:
            return {
                "success": True,
                "has_key": True,
                "api_key": api_key_doc.get("api_key", ""),
                "updated_at": api_key_doc.get("updated_at")
            }
        else:
            return {
                "success": True,
                "has_key": False,
                "api_key": "",
                "updated_at": None
            }
    except Exception as e:
        logger.error(f"Error retrieving API key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve API key: {str(e)}")


@router.post("/api-key")
async def save_user_api_key(
    key_data: ApiKeyUpdate,
    user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Save or update the user's API key.

    Args:
        key_data: API key data
        user_id: User identifier from header (optional for demo)
        db: Database connection

    Returns:
        Success confirmation
    """
    try:
        # Use a default user_id for demo purposes if not provided
        if not user_id:
            user_id = "demo_user"

        # Upsert the API key
        result = await db.integration.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "user_id": user_id,
                    "api_key": key_data.api_key,
                    "updated_at": datetime.utcnow().isoformat()
                }
            },
            upsert=True
        )

        return {
            "success": True,
            "message": "API key saved successfully",
            "updated": result.modified_count > 0 or result.upserted_id is not None
        }
    except Exception as e:
        logger.error(f"Error saving API key: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save API key: {str(e)}")


@router.api_route("/proxy", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_api_request(
    request: Request,
    url: str,
    user_id: Optional[str] = Header(None, alias="X-User-Id"),
    settings: Settings = Depends(get_settings),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Proxy requests to external APIs to bypass CORS restrictions.
    Uses user's stored API key from database if available, falls back to system key.

    Args:
        request: FastAPI request object
        url: Target URL to proxy to
        user_id: User identifier from header (optional for demo)
        settings: Application settings
        db: Database connection

    Returns:
        Response from the external API
    """
    try:
        # Get request body if present
        body = None
        if request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()

        # Prepare headers
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        # Try to get user's API key from database first
        api_key = None
        if not user_id:
            user_id = "demo_user"

        api_key_doc = await db.integration.find_one({"user_id": user_id})
        if api_key_doc and api_key_doc.get("api_key"):
            api_key = api_key_doc.get("api_key")
            logger.info(f"Using user's stored API key for {user_id}")
        elif settings.TEMENOS_DEV_PORTAL_APIKEY:
            api_key = settings.TEMENOS_DEV_PORTAL_APIKEY
            logger.info("Using system default API key")

        # Add API key to headers if available
        if api_key:
            headers["apikey"] = api_key

        logger.info(f"Proxying {request.method} request to {url}")

        # Make the external request with SSL verification disabled for development
        # Note: In production, you should use proper SSL certificates
        async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body
            )

        # Try to parse as JSON, fallback to text
        try:
            data = response.json()
        except:
            data = {"text": response.text}

        return {
            "success": response.is_success,
            "status": response.status_code,
            "data": data,
            "headers": dict(response.headers)
        }

    except httpx.TimeoutException:
        logger.error(f"Timeout when proxying to {url}")
        raise HTTPException(status_code=504, detail="Gateway timeout")
    except Exception as e:
        logger.error(f"Error proxying request to {url}: {str(e)}")
        raise HTTPException(status_code=502, detail=f"Bad gateway: {str(e)}")
