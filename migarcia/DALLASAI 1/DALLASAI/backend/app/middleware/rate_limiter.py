"""
Rate Limiting Middleware

Implements rate limiting to prevent abuse.
"""

import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class InMemoryRateLimiter:
    """Simple in-memory rate limiter."""

    def __init__(self):
        # Store: {ip: [(timestamp, count)]}
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 300  # Clean up every 5 minutes
        self.last_cleanup = time.time()

    def is_rate_limited(self, ip: str, max_per_minute: int, max_per_hour: int) -> Tuple[bool, Dict]:
        """
        Check if IP is rate limited.

        Args:
            ip: IP address
            max_per_minute: Max requests per minute
            max_per_hour: Max requests per hour

        Returns:
            Tuple of (is_limited, rate_limit_info)
        """
        current_time = time.time()
        one_minute_ago = current_time - 60
        one_hour_ago = current_time - 3600

        # Clean up old entries periodically
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries(current_time)

        # Get requests for this IP
        ip_requests = self.requests[ip]

        # Remove requests older than 1 hour
        ip_requests = [req for req in ip_requests if req > one_hour_ago]
        self.requests[ip] = ip_requests

        # Count requests
        requests_last_minute = sum(1 for req in ip_requests if req > one_minute_ago)
        requests_last_hour = len(ip_requests)

        # Check limits
        if requests_last_minute >= max_per_minute:
            reset_time = int(ip_requests[-max_per_minute] + 60)
            return True, {
                "limit": max_per_minute,
                "remaining": 0,
                "reset": reset_time,
                "period": "minute"
            }

        if requests_last_hour >= max_per_hour:
            reset_time = int(ip_requests[0] + 3600)
            return True, {
                "limit": max_per_hour,
                "remaining": 0,
                "reset": reset_time,
                "period": "hour"
            }

        # Record this request
        ip_requests.append(current_time)

        # Calculate remaining
        remaining_minute = max_per_minute - requests_last_minute - 1
        remaining_hour = max_per_hour - requests_last_hour - 1

        return False, {
            "limit": max_per_minute,
            "remaining": min(remaining_minute, remaining_hour),
            "reset": int(current_time + 60),
            "period": "minute"
        }

    def _cleanup_old_entries(self, current_time: float):
        """Remove old entries to prevent memory bloat."""
        one_hour_ago = current_time - 3600

        for ip in list(self.requests.keys()):
            self.requests[ip] = [req for req in self.requests[ip] if req > one_hour_ago]
            if not self.requests[ip]:
                del self.requests[ip]

        self.last_cleanup = current_time
        logger.debug(f"Rate limiter cleanup completed. Active IPs: {len(self.requests)}")


# Global rate limiter instance
rate_limiter = InMemoryRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting requests."""

    def __init__(self, app, enabled: bool = True):
        super().__init__(app)
        self.enabled = enabled

    async def dispatch(self, request: Request, call_next):
        """
        Apply rate limiting to requests.

        Args:
            request: FastAPI request
            call_next: Next middleware/handler

        Returns:
            Response or rate limit error
        """
        if not self.enabled or not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Skip rate limiting for health check endpoints
        if request.url.path in ["/health", "/ready", "/live", "/metrics"]:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Check if behind proxy and get real IP
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        # Check rate limit
        is_limited, rate_info = rate_limiter.is_rate_limited(
            client_ip,
            settings.RATE_LIMIT_PER_MINUTE,
            settings.RATE_LIMIT_PER_HOUR
        )

        if is_limited:
            logger.warning(
                f"Rate limit exceeded for IP: {client_ip}",
                extra={
                    "ip": client_ip,
                    "path": request.url.path,
                    "period": rate_info["period"]
                }
            )

            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Try again in {rate_info['period']}.",
                    }
                },
                headers={
                    "X-RateLimit-Limit": str(rate_info["limit"]),
                    "X-RateLimit-Remaining": str(rate_info["remaining"]),
                    "X-RateLimit-Reset": str(rate_info["reset"]),
                    "Retry-After": str(rate_info["reset"] - int(time.time()))
                }
            )

        # Process request and add rate limit headers
        response = await call_next(request)

        response.headers["X-RateLimit-Limit"] = str(rate_info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(rate_info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(rate_info["reset"])

        return response
