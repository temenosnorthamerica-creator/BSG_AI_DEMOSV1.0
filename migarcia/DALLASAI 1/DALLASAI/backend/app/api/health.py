"""
Health Check API Endpoints

Provides health, readiness, and liveness endpoints for monitoring using MongoDB.
"""

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database, get_db_health
from app.core.config import settings
from app.core.logging import get_logger
from app.utils.datetime_utils import utc_now, format_iso8601

router = APIRouter(tags=["Health"])
logger = get_logger(__name__)


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Comprehensive health check endpoint.

    Checks:
    - API availability
    - Database connectivity
    - Storage availability

    Returns:
        Health status with detailed component checks
    """
    health_status = {
        "status": "healthy",
        "timestamp": format_iso8601(utc_now()),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": {}
    }

    # Check database - handle errors gracefully
    # Don't use Depends(get_database) here to avoid failing if DB is down
    try:
        db_health = await get_db_health()
        health_status["checks"]["database"] = db_health
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
            "connected": False
        }
        # Don't fail the health check if DB is down - app can still serve some endpoints
        logger.warning(f"Database health check failed: {e}")

    # Check video storage
    from app.services.video_service import video_service
    try:
        storage_exists = video_service.storage_path.exists()
        storage_writable = video_service.storage_path.is_dir()
        storage_status = {
            "status": "healthy" if storage_exists and storage_writable else "unhealthy",
            "path": str(video_service.storage_path),
            "exists": storage_exists,
            "writable": storage_writable
        }
    except Exception as e:
        storage_status = {
            "status": "unhealthy",
            "error": str(e)
        }

    health_status["checks"]["storage"] = storage_status

    # Determine overall status
    all_healthy = all(
        check.get("status") == "healthy"
        for check in health_status["checks"].values()
    )

    if not all_healthy:
        health_status["status"] = "degraded"

    return health_status


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Kubernetes readiness probe endpoint.

    Checks if the application is ready to receive traffic.

    Returns:
        Ready status
    """
    # Check database connection
    try:
        await db.client.admin.command('ping')
        return {
            "ready": True,
            "timestamp": format_iso8601(utc_now())
        }
    except Exception as e:
        return {
            "ready": False,
            "reason": f"Database connection failed: {str(e)}"
        }


@router.get("/live", status_code=status.HTTP_200_OK)
async def liveness_check():
    """
    Kubernetes liveness probe endpoint.

    Simple check to verify the application is running.
    This endpoint does NOT require database connectivity.

    Returns:
        Live status
    """
    return {
        "alive": True,
        "timestamp": format_iso8601(utc_now()),
        "version": settings.APP_VERSION
    }


@router.get("/metrics", status_code=status.HTTP_200_OK)
async def metrics(db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    Basic metrics endpoint.

    In production, this could expose Prometheus metrics.

    Returns:
        Application metrics
    """
    try:
        # Get MongoDB server status
        server_status = await db.client.admin.command('serverStatus')
        
        # Get database stats
        db_stats = await db.command('dbStats')
        
        metrics_data = {
            "connections": {
                "current": server_status.get("connections", {}).get("current", 0),
                "available": server_status.get("connections", {}).get("available", 0),
            },
            "database": {
                "name": db_stats.get("db", "unknown"),
                "collections": db_stats.get("collections", 0),
                "data_size": db_stats.get("dataSize", 0),
                "storage_size": db_stats.get("storageSize", 0),
            }
        }
    except Exception as e:
        metrics_data = {"error": str(e)}

    return {
        "timestamp": format_iso8601(utc_now()),
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "metrics": metrics_data
    }
