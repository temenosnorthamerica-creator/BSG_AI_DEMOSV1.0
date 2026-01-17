"""
Security Utilities

Password hashing, encryption, and secure random generation.
"""

import secrets
import string
from typing import Optional

from passlib.context import CryptContext

from app.core.config import settings


# Password hashing context
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def generate_random_string(length: int = 32) -> str:
    """
    Generate a cryptographically secure random string.

    Args:
        length: Length of the string

    Returns:
        Random string
    """
    return secrets.token_urlsafe(length)


def generate_random_hex(length: int = 32) -> str:
    """
    Generate a cryptographically secure random hex string.

    Args:
        length: Length of the string in bytes

    Returns:
        Random hex string
    """
    return secrets.token_hex(length)


def generate_password(
    length: int = 16,
    use_letters: bool = True,
    use_digits: bool = True,
    use_special: bool = True
) -> str:
    """
    Generate a secure random password.

    Args:
        length: Password length
        use_letters: Include letters
        use_digits: Include digits
        use_special: Include special characters

    Returns:
        Generated password
    """
    chars = ""
    if use_letters:
        chars += string.ascii_letters
    if use_digits:
        chars += string.digits
    if use_special:
        chars += "!@#$%^&*()_+-=[]{}|;:,.<>?"

    if not chars:
        raise ValueError("At least one character set must be enabled")

    # Ensure password has at least one character from each enabled set
    password_chars = []

    if use_letters:
        password_chars.append(secrets.choice(string.ascii_lowercase))
        password_chars.append(secrets.choice(string.ascii_uppercase))

    if use_digits:
        password_chars.append(secrets.choice(string.digits))

    if use_special:
        password_chars.append(secrets.choice("!@#$%^&*()_+-=[]{}|;:,.<>?"))

    # Fill the rest randomly
    remaining_length = length - len(password_chars)
    password_chars.extend(secrets.choice(chars) for _ in range(remaining_length))

    # Shuffle the password
    secrets.SystemRandom().shuffle(password_chars)

    return ''.join(password_chars)


def generate_api_key() -> str:
    """
    Generate a secure API key.

    Returns:
        API key string
    """
    return f"bsg_{secrets.token_urlsafe(32)}"


def constant_time_compare(a: str, b: str) -> bool:
    """
    Compare two strings in constant time to prevent timing attacks.

    Args:
        a: First string
        b: Second string

    Returns:
        True if strings are equal, False otherwise
    """
    return secrets.compare_digest(a, b)
