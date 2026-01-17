"""
Configuration Service

Handles environment-based configuration with validation.
Supports environment variables, .env files, and secret injection.
"""

import os
from typing import List, Optional, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import secrets


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    # Application Settings
    APP_NAME: str = "BSG Demo Platform"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", description="Environment: dev/staging/production")
    DEBUG: bool = Field(default=False, description="Debug mode")

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = Field(default="0.0.0.0", description="API host")
    PORT: int = Field(
        default_factory=lambda: int(os.getenv("PORT", "8000")),
        description="API port (Azure App Service sets PORT automatically)"
    )

    # Database Settings
    DATABASE_TYPE: str = Field(default="mongodb", description="Database type: mongodb, postgresql, etc.")
    DATABASE_URL: str = Field(
        default="",
        description="Database connection string (Azure Cosmos DB MongoDB API) - Must be set via environment variable"
    )
    DATABASE_NAME: str = Field(default="bsg_demo", description="Database name")
    DB_MAX_POOL_SIZE: int = Field(default=50, description="Database connection pool size")
    DB_MIN_POOL_SIZE: int = Field(default=10, description="Minimum connection pool size")
    DB_CONNECT_TIMEOUT: int = Field(default=30, description="Connection timeout in seconds")

    # MSSQL External Database
    MSSQL_HOST: str = Field(default="10.1.4.135", description="MSSQL server host")
    MSSQL_PORT: int = Field(default=1433, description="MSSQL server port")
    MSSQL_USER: str = Field(default="dist1", description="MSSQL username")
    MSSQL_PASSWORD: str = Field(default="dist1", description="MSSQL password")
    MSSQL_DATABASE: str = Field(default="ODS", description="MSSQL database name")
    MSSQL_SCHEMA: str = Field(default="ODS", description="MSSQL default schema")

    # External API Integration
    TEMENOS_DEV_PORTAL_APIKEY: str = Field(default="", description="Temenos Developer Portal API Key")

    # JWT Authentication
    JWT_SECRET_KEY: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="Secret key for JWT signing"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Access token expiry")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, description="Refresh token expiry")

    # CORS Settings (not loaded from environment variables to avoid parsing issues)
    CORS_CREDENTIALS: bool = Field(default=True, description="Allow credentials in CORS")

    # Logging Settings
    LOG_LEVEL: str = Field(default="INFO", description="Logging level")
    LOG_FORMAT: str = Field(default="json", description="Log format: json or text")
    LOG_FILE: Optional[str] = Field(default=None, description="Log file path")

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(default=True, description="Enable rate limiting")
    RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="Requests per minute per IP")
    RATE_LIMIT_PER_HOUR: int = Field(default=1000, description="Requests per hour per IP")

    # Redis Cache (Optional)
    REDIS_URL: Optional[str] = Field(default=None, description="Redis connection string")
    CACHE_ENABLED: bool = Field(default=False, description="Enable caching")
    CACHE_TTL: int = Field(default=300, description="Default cache TTL in seconds")

    # Video Storage
    VIDEO_STORAGE_PATH: str = Field(
        default="./uploads/videos",
        description="Path to video storage directory"
    )
    VIDEO_MAX_SIZE_MB: int = Field(default=500, description="Max video size in MB")
    VIDEO_ALLOWED_FORMATS: List[str] = Field(
        default=["mp4", "mov", "avi", "webm"],
        description="Allowed video formats"
    )
    VIDEO_CHUNK_SIZE: int = Field(default=1024 * 1024, description="Video streaming chunk size")

    # Security
    BCRYPT_ROUNDS: int = Field(default=12, description="Bcrypt hashing rounds")
    PASSWORD_MIN_LENGTH: int = Field(default=8, description="Minimum password length")
    SECURE_COOKIES: bool = Field(default=True, description="Use secure cookies in production")

    # Monitoring
    METRICS_ENABLED: bool = Field(default=True, description="Enable Prometheus metrics")
    TRACING_ENABLED: bool = Field(default=False, description="Enable OpenTelemetry tracing")

    # Health Check
    HEALTH_CHECK_TIMEOUT: int = Field(default=5, description="Health check timeout in seconds")

    # RAG Tool (Temenos tbsg.temenos.com)
    RAG_TYPE: str = Field(default="temenos", description="RAG provider type: temenos, openai, etc.")
    RAG_JWT_TOKEN: Optional[str] = Field(
        default=None,
        description="JWT token for RAG tool API authentication (tbsg.temenos.com)"
    )
    RAG_API_URL: str = Field(
        default="https://tbsg.temenos.com",
        description="RAG tool API base URL"
    )

    # Azure Default Subscription
    AZURE_SUBSCRIPTION_ID: Optional[str] = Field(
        default=None,
        description="Default Azure subscription ID (used if not provided by user)"
    )

    model_config = SettingsConfigDict(
        env_file=[".env", "../.env"],  # Check current dir and parent dir
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """Validate environment value."""
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"ENVIRONMENT must be one of {allowed}")
        return v

    @field_validator("LOG_LEVEL")
    def validate_log_level(cls, v):
        """Validate log level."""
        allowed = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        v = v.upper()
        if v not in allowed:
            raise ValueError(f"LOG_LEVEL must be one of {allowed}")
        return v

    @field_validator("JWT_SECRET_KEY")
    def validate_jwt_secret(cls, v, info):
        """Ensure JWT secret is set in production."""
        if info.data.get("ENVIRONMENT") == "production" and len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters in production")
        return v

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """Get CORS origins (hardcoded to avoid environment variable parsing issues).
        
        Note: Exact origins are listed here, but CORS middleware in main.py uses
        regex patterns to allow all Azure Static Web Apps and App Service domains.
        """
        origins = [
            # Local development
            "http://localhost:3000",
            "http://localhost:5173",
            # Azure Static Web Apps (specific domain - regex pattern handles all *.azurestaticapps.net)
            "https://kind-beach-01c0a990f.3.azurestaticapps.net",
            # Azure App Service (for testing backend directly - regex pattern handles all *.azurewebsites.net)
            "https://bsg-demo-platform-app.azurewebsites.net",
        ]
        return origins

    @property
    def CORS_METHODS(self) -> List[str]:
        """Get CORS methods (hardcoded to avoid environment variable parsing issues)."""
        return ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"]

    @property
    def CORS_HEADERS(self) -> List[str]:
        """Get CORS headers (hardcoded to avoid environment variable parsing issues)."""
        return ["*", "Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"]

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development."""
        return self.ENVIRONMENT == "development"

    @property
    def database_url_async(self) -> str:
        """Get async database URL (same as DATABASE_URL for MongoDB)."""
        return self.DATABASE_URL


# Global settings instance
settings = Settings()


def get_settings() -> Settings:
    """Dependency for FastAPI to inject settings."""
    return settings
