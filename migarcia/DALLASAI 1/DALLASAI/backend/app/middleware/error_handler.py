"""
Error Handling Middleware

Provides consistent error responses and exception handling.
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pymongo.errors import PyMongoError
from typing import Union

from app.core.logging import get_logger, get_request_id
from app.utils.datetime_utils import utc_now, format_iso8601
from app.services.auth_service import AuthenticationError, AuthorizationError

logger = get_logger(__name__)


class APIError(Exception):
    """Base exception for API errors."""

    def __init__(
        self,
        message: str,
        code: str = "API_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class NotFoundError(APIError):
    """Resource not found error."""

    def __init__(self, message: str = "Resource not found", details: dict = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )


class ValidationError(APIError):
    """Validation error."""

    def __init__(self, message: str = "Validation error", details: dict = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class ConflictError(APIError):
    """Resource conflict error."""

    def __init__(self, message: str = "Resource conflict", details: dict = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


def create_error_response(
    code: str,
    message: str,
    status_code: int,
    details: dict = None,
    request_id: str = None
) -> JSONResponse:
    """
    Create standardized error response.

    Args:
        code: Error code
        message: Error message
        status_code: HTTP status code
        details: Additional error details
        request_id: Request ID for tracing

    Returns:
        JSON response
    """
    response_data = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
        },
        "metadata": {
            "timestamp": format_iso8601(utc_now()),
            "request_id": request_id or get_request_id(),
        }
    }

    if details:
        response_data["error"]["details"] = details

    return JSONResponse(
        status_code=status_code,
        content=response_data
    )


async def api_error_handler(request: Request, exc: APIError) -> JSONResponse:
    """Handle custom API errors."""
    logger.warning(
        f"API error: {exc.code} - {exc.message}",
        extra={"error_code": exc.code, "details": exc.details}
    )

    return create_error_response(
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    logger.warning(f"Validation error: {errors}")

    return create_error_response(
        code="VALIDATION_ERROR",
        message="Request validation failed",
        status_code=status.HTTP_400_BAD_REQUEST,
        details={"errors": errors}
    )


async def authentication_error_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    """Handle authentication errors."""
    logger.warning(f"Authentication error: {str(exc)}")

    return create_error_response(
        code="AUTHENTICATION_ERROR",
        message=str(exc),
        status_code=status.HTTP_401_UNAUTHORIZED
    )


async def authorization_error_handler(request: Request, exc: AuthorizationError) -> JSONResponse:
    """Handle authorization errors."""
    logger.warning(f"Authorization error: {str(exc)}")

    return create_error_response(
        code="AUTHORIZATION_ERROR",
        message="Insufficient permissions",
        status_code=status.HTTP_403_FORBIDDEN,
        details={"required": str(exc)}
    )


async def database_error_handler(request: Request, exc: PyMongoError) -> JSONResponse:
    """Handle database errors."""
    logger.error(f"Database error: {str(exc)}", exc_info=True)

    # Don't expose internal database errors in production
    from app.core.config import settings
    if settings.is_production:
        message = "An internal database error occurred"
    else:
        message = str(exc)

    return create_error_response(
        code="DATABASE_ERROR",
        message=message,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all other exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)

    # Don't expose internal errors in production
    from app.core.config import settings
    if settings.is_production:
        message = "An internal server error occurred"
    else:
        message = str(exc)

    return create_error_response(
        code="INTERNAL_ERROR",
        message=message,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


def register_error_handlers(app):
    """
    Register all error handlers with FastAPI app.

    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(APIError, api_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(AuthenticationError, authentication_error_handler)
    app.add_exception_handler(AuthorizationError, authorization_error_handler)
    app.add_exception_handler(PyMongoError, database_error_handler)
    app.add_exception_handler(Exception, generic_error_handler)

    logger.info("Registered error handlers")
