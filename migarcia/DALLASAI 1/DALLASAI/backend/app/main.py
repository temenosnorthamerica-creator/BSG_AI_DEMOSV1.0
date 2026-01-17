"""
BSG Demo Platform - Backend Application

Main FastAPI application with middleware, routing, and configuration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.core.database import init_db, close_db
from app.middleware.error_handler import register_error_handlers
from app.middleware.request_middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.middleware.rate_limiter import RateLimitMiddleware
from app.api import health, auth, database, grafana_proxy, grafana_auth, components, security, integration, deployment, chatbot, cache, loans

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events.

    Handles startup and shutdown logic.
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # Initialize MongoDB connection
    # Don't fail startup if DB is temporarily unavailable - health check will report it
    try:
        await init_db()
        logger.info(f"Database: {settings.DATABASE_NAME}")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        logger.warning("Application will start but database-dependent features may not work")
        # Don't raise - allow app to start for health checks

    # Log configuration
    logger.info(f"CORS origins: {settings.CORS_ORIGINS}")
    logger.info(f"Rate limiting: {'enabled' if settings.RATE_LIMIT_ENABLED else 'disabled'}")

    yield

    # Shutdown
    logger.info("Shutting down application")
    await close_db()
    logger.info("Database connections closed")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for BSG Demo Platform - showcasing Temenos products and capabilities",
    docs_url="/docs" if not settings.is_production else None,  # Disable in production
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# Configure CORS - MUST be the outermost middleware to handle preflight OPTIONS requests
# Use allow_origin_regex to allow all Azure Static Web Apps and App Service domains
# This is more flexible than hardcoding specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.azurestaticapps\.net|https://.*\.azurewebsites\.net|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add custom middleware (order matters - first added is outermost)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, enabled=settings.RATE_LIMIT_ENABLED)
app.add_middleware(RequestLoggingMiddleware)

# Register error handlers
register_error_handlers(app)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(database.router, prefix=settings.API_V1_PREFIX)
app.include_router(components.router, prefix=settings.API_V1_PREFIX)
app.include_router(integration.router, prefix=settings.API_V1_PREFIX)
app.include_router(grafana_proxy.router, prefix=settings.API_V1_PREFIX)
app.include_router(grafana_auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(security.router, prefix=settings.API_V1_PREFIX)
app.include_router(deployment.router, prefix=settings.API_V1_PREFIX)
app.include_router(chatbot.router, prefix=settings.API_V1_PREFIX)
app.include_router(cache.router, prefix=settings.API_V1_PREFIX)
app.include_router(loans.router, prefix=settings.API_V1_PREFIX)

# Serve static files (frontend) if directory exists
static_dir = os.path.join(os.path.dirname(__file__), "static")
index_path = os.path.join(static_dir, "index.html") if static_dir else None

if os.path.exists(static_dir) and os.path.isdir(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    logger.info(f"Static files mounted at /static from {static_dir}")
    
    # Root endpoint - must be defined BEFORE catch-all route
    @app.get("/")
    async def root():
        """Root endpoint - serves frontend index.html."""
        if index_path and os.path.exists(index_path):
            logger.info(f"Serving frontend index.html from {index_path}")
            return FileResponse(index_path)
        logger.warning(f"index.html not found at {index_path}")
        return {"detail": "Frontend not found", "static_dir": str(static_dir), "exists": os.path.exists(static_dir)}
    
    # Serve index.html for all non-API routes (SPA routing)
    # This catch-all must be AFTER the root route
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve frontend SPA or API routes."""
        # Don't interfere with API routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
            return {"detail": "Not Found"}
        
        # Serve index.html for frontend routes (SPA routing)
        if index_path and os.path.exists(index_path):
            return FileResponse(index_path)
        logger.warning(f"index.html not found at {index_path}, static_dir exists: {os.path.exists(static_dir)}")
        return {"detail": "Frontend not found", "static_dir": str(static_dir), "exists": os.path.exists(static_dir)}
else:
    # Root endpoint (only if static files not mounted)
    @app.get("/")
    async def root():
        """Root endpoint with API information."""
        logger.info(f"Root endpoint accessed - static directory exists: {os.path.exists(static_dir) if static_dir else False}")
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "api_version": "v1",
            "docs": f"{settings.API_V1_PREFIX}/docs" if not settings.is_production else None,
            "health": f"{settings.API_V1_PREFIX}/health",
            "live": f"{settings.API_V1_PREFIX}/live",
            "frontend_available": os.path.exists(static_dir) if static_dir else False,
            "static_dir": str(static_dir) if static_dir else None,
            "message": "BSG Demo Platform API is running. Use /api/v1/health for health check."
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
