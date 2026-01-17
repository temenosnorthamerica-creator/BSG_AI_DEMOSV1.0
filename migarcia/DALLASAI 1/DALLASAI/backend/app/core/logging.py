"""
Logging Service

Provides structured JSON logging with correlation IDs, audit trails,
and log redaction for sensitive information.
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import uuid4
from contextvars import ContextVar

from app.core.config import settings


# Context variable for request ID (correlation ID)
request_id_var: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""

    SENSITIVE_FIELDS = {"password", "token", "secret", "authorization", "api_key"}

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request ID if available
        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id

        # Add extra fields
        if hasattr(record, "extra"):
            extra = self._redact_sensitive(record.extra)
            log_data.update(extra)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info),
            }

        return json.dumps(log_data, default=str)

    def _redact_sensitive(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Redact sensitive fields from log data."""
        redacted = {}
        for key, value in data.items():
            if any(sensitive in key.lower() for sensitive in self.SENSITIVE_FIELDS):
                redacted[key] = "***REDACTED***"
            elif isinstance(value, dict):
                redacted[key] = self._redact_sensitive(value)
            else:
                redacted[key] = value
        return redacted


class TextFormatter(logging.Formatter):
    """Simple text formatter for development."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as text."""
        request_id = request_id_var.get()
        request_id_str = f"[{request_id[:8]}] " if request_id else ""

        log_message = (
            f"{self.formatTime(record)} - "
            f"{request_id_str}"
            f"{record.levelname} - "
            f"{record.name} - "
            f"{record.getMessage()}"
        )

        if record.exc_info:
            log_message += f"\n{self.formatException(record.exc_info)}"

        return log_message


def setup_logging() -> logging.Logger:
    """
    Set up application logging.

    Returns:
        Configured root logger
    """
    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Remove existing handlers
    logger.handlers.clear()

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Set formatter based on configuration
    if settings.LOG_FORMAT == "json":
        formatter = JSONFormatter()
    else:
        formatter = TextFormatter(
            fmt="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Add file handler if configured
    if settings.LOG_FILE:
        file_handler = logging.FileHandler(settings.LOG_FILE)
        file_handler.setLevel(getattr(logging, settings.LOG_LEVEL))
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    # Reduce noise from third-party libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("motor").setLevel(logging.WARNING)

    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def set_request_id(request_id: Optional[str] = None) -> str:
    """
    Set request ID in context.

    Args:
        request_id: Request ID or None to generate new

    Returns:
        The request ID that was set
    """
    if request_id is None:
        request_id = str(uuid4())
    request_id_var.set(request_id)
    return request_id


def get_request_id() -> Optional[str]:
    """
    Get current request ID from context.

    Returns:
        Current request ID or None
    """
    return request_id_var.get()


def log_with_context(
    logger: logging.Logger,
    level: int,
    message: str,
    **kwargs
) -> None:
    """
    Log message with additional context.

    Args:
        logger: Logger instance
        level: Log level
        message: Log message
        **kwargs: Additional context fields
    """
    extra_data = {"extra": kwargs}
    logger.log(level, message, extra=extra_data)


class AuditLogger:
    """Special logger for audit events."""

    def __init__(self):
        self.logger = get_logger("audit")

    def log_auth_event(
        self,
        event_type: str,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        ip_address: Optional[str] = None,
        success: bool = True,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log authentication event."""
        log_data = {
            "event_type": event_type,
            "event_category": "authentication",
            "user_id": user_id,
            "username": username,
            "ip_address": ip_address,
            "success": success,
            "details": details or {},
        }
        log_with_context(
            self.logger,
            logging.INFO if success else logging.WARNING,
            f"Auth event: {event_type}",
            **log_data
        )

    def log_data_modification(
        self,
        operation: str,
        table: str,
        record_id: Any,
        user_id: int,
        changes: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log data modification event."""
        log_data = {
            "event_type": "data_modification",
            "event_category": "audit",
            "operation": operation,
            "table": table,
            "record_id": str(record_id),
            "user_id": user_id,
            "changes": changes or {},
        }
        log_with_context(
            self.logger,
            logging.INFO,
            f"Data modification: {operation} on {table}",
            **log_data
        )

    def log_admin_action(
        self,
        action: str,
        user_id: int,
        target: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Log administrative action."""
        log_data = {
            "event_type": "admin_action",
            "event_category": "audit",
            "action": action,
            "user_id": user_id,
            "target": target,
            "details": details or {},
        }
        log_with_context(
            self.logger,
            logging.WARNING,
            f"Admin action: {action}",
            **log_data
        )


# Global audit logger instance
audit_logger = AuditLogger()
