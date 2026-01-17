"""
Validation Utilities

Common validation functions for email, URL, file types, and input sanitization.
"""

import re
from typing import Optional, List
from pathlib import Path


def validate_email(email: str) -> bool:
    """
    Validate email address format.

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_url(url: str) -> bool:
    """
    Validate URL format.

    Args:
        url: URL to validate

    Returns:
        True if valid, False otherwise
    """
    pattern = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
    return bool(re.match(pattern, url))


def validate_password_strength(password: str, min_length: int = 8) -> tuple[bool, Optional[str]]:
    """
    Validate password strength.

    Args:
        password: Password to validate
        min_length: Minimum password length

    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < min_length:
        return False, f"Password must be at least {min_length} characters long"

    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, "Password must contain at least one special character"

    return True, None


def validate_username(username: str) -> tuple[bool, Optional[str]]:
    """
    Validate username format.

    Args:
        username: Username to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(username) < 3:
        return False, "Username must be at least 3 characters long"

    if len(username) > 50:
        return False, "Username must not exceed 50 characters"

    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username can only contain letters, numbers, underscores, and hyphens"

    return True, None


def validate_file_extension(filename: str, allowed_extensions: List[str]) -> bool:
    """
    Validate file extension.

    Args:
        filename: File name to validate
        allowed_extensions: List of allowed extensions (e.g., ['mp4', 'avi'])

    Returns:
        True if valid, False otherwise
    """
    file_path = Path(filename)
    extension = file_path.suffix.lstrip('.').lower()
    return extension in [ext.lower() for ext in allowed_extensions]


def validate_file_size(file_size: int, max_size_mb: int) -> tuple[bool, Optional[str]]:
    """
    Validate file size.

    Args:
        file_size: File size in bytes
        max_size_mb: Maximum allowed size in MB

    Returns:
        Tuple of (is_valid, error_message)
    """
    max_size_bytes = max_size_mb * 1024 * 1024

    if file_size > max_size_bytes:
        return False, f"File size exceeds maximum allowed size of {max_size_mb}MB"

    return True, None


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing potentially dangerous characters.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    # Remove path separators and other dangerous characters
    sanitized = re.sub(r'[^\w\s.-]', '', filename)
    # Replace multiple spaces/underscores with single
    sanitized = re.sub(r'[\s_]+', '_', sanitized)
    # Remove leading/trailing dots and spaces
    sanitized = sanitized.strip('. ')
    return sanitized


def sanitize_html(text: str) -> str:
    """
    Basic HTML sanitization (removes tags).

    Args:
        text: Text potentially containing HTML

    Returns:
        Sanitized text
    """
    # Remove HTML tags
    clean = re.sub(r'<[^>]*>', '', text)
    # Remove script content
    clean = re.sub(r'<script[^>]*>.*?</script>', '', clean, flags=re.DOTALL | re.IGNORECASE)
    return clean


def validate_slug(slug: str) -> tuple[bool, Optional[str]]:
    """
    Validate URL slug format.

    Args:
        slug: Slug to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not slug:
        return False, "Slug cannot be empty"

    if not re.match(r'^[a-z0-9-]+$', slug):
        return False, "Slug can only contain lowercase letters, numbers, and hyphens"

    if slug.startswith('-') or slug.endswith('-'):
        return False, "Slug cannot start or end with a hyphen"

    if '--' in slug:
        return False, "Slug cannot contain consecutive hyphens"

    return True, None
