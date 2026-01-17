"""
Request Middleware

Handles request logging, correlation IDs, and request/response tracking.
"""

import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

from app.core.logging import get_logger, set_request_id, get_request_id
from app.utils.datetime_utils import format_iso8601, utc_now

logger = get_logger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging requests and responses."""

    async def dispatch(self, request: Request, call_next: Callable):
        """
        Process request and log details.

        Args:
            request: FastAPI request
            call_next: Next middleware/handler

        Returns:
            Response
        """
        # Generate or extract request ID
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = set_request_id()
        else:
            set_request_id(request_id)

        # Start timer
        start_time = time.time()

        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "query_params": dict(request.query_params),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            }
        )

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time

        # Add custom headers
        response.headers["X-Request-ID"] = request_id or ""
        response.headers["X-Response-Time"] = f"{duration:.3f}s"

        # Log response
        logger.info(
            f"Request completed: {request.method} {request.url.path} - {response.status_code}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration": duration,
            }
        )

        # Log slow requests
        if duration > 1.0:
            logger.warning(
                f"Slow request detected: {request.method} {request.url.path}",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration": duration,
                }
            )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers."""

    async def dispatch(self, request: Request, call_next: Callable):
        """
        Add security headers to response.

        Args:
            request: FastAPI request
            call_next: Next middleware/handler

        Returns:
            Response with security headers
        """
        response = await call_next(request)

        # Add security headers
        from app.core.config import settings

        # Don't add restrictive headers if this is a CORS preflight (OPTIONS) request
        # CORS middleware needs to handle OPTIONS requests without interference
        if request.method == "OPTIONS":
            return response
        
        if settings.is_production:
            # Strict security headers for production (but don't interfere with CORS)
            # Note: Content-Security-Policy might interfere with CORS, so we make it permissive
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            # Make CSP less restrictive to allow cross-origin requests
            response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:"
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        else:
            # More relaxed headers for development
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "SAMEORIGIN"

        return response
