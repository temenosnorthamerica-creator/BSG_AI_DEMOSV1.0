"""
Date/Time Utilities

Timezone-aware datetime handling and formatting utilities.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import pytz


def utc_now() -> datetime:
    """
    Get current UTC datetime.

    Returns:
        Current UTC datetime (timezone-aware)
    """
    return datetime.now(timezone.utc)


def to_utc(dt: datetime) -> datetime:
    """
    Convert datetime to UTC.

    Args:
        dt: Datetime object (naive or aware)

    Returns:
        UTC datetime (timezone-aware)
    """
    if dt.tzinfo is None:
        # Assume naive datetime is UTC
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def from_timestamp(timestamp: int) -> datetime:
    """
    Convert Unix timestamp to UTC datetime.

    Args:
        timestamp: Unix timestamp in seconds

    Returns:
        UTC datetime
    """
    return datetime.fromtimestamp(timestamp, tz=timezone.utc)


def to_timestamp(dt: datetime) -> int:
    """
    Convert datetime to Unix timestamp.

    Args:
        dt: Datetime object

    Returns:
        Unix timestamp in seconds
    """
    return int(dt.timestamp())


def format_iso8601(dt: datetime) -> str:
    """
    Format datetime as ISO 8601 string.

    Args:
        dt: Datetime object

    Returns:
        ISO 8601 formatted string
    """
    utc_dt = to_utc(dt)
    return utc_dt.isoformat().replace('+00:00', 'Z')


def parse_iso8601(date_string: str) -> datetime:
    """
    Parse ISO 8601 date string to datetime.

    Args:
        date_string: ISO 8601 formatted string

    Returns:
        UTC datetime

    Raises:
        ValueError: If string is not valid ISO 8601 format
    """
    # Handle 'Z' suffix
    if date_string.endswith('Z'):
        date_string = date_string[:-1] + '+00:00'

    return datetime.fromisoformat(date_string).astimezone(timezone.utc)


def add_days(dt: datetime, days: int) -> datetime:
    """
    Add days to a datetime.

    Args:
        dt: Datetime object
        days: Number of days to add

    Returns:
        New datetime
    """
    return dt + timedelta(days=days)


def add_hours(dt: datetime, hours: int) -> datetime:
    """
    Add hours to a datetime.

    Args:
        dt: Datetime object
        hours: Number of hours to add

    Returns:
        New datetime
    """
    return dt + timedelta(hours=hours)


def add_minutes(dt: datetime, minutes: int) -> datetime:
    """
    Add minutes to a datetime.

    Args:
        dt: Datetime object
        minutes: Number of minutes to add

    Returns:
        New datetime
    """
    return dt + timedelta(minutes=minutes)


def is_expired(expiry_time: datetime) -> bool:
    """
    Check if a datetime has expired.

    Args:
        expiry_time: Expiry datetime

    Returns:
        True if expired, False otherwise
    """
    return utc_now() >= to_utc(expiry_time)


def time_until_expiry(expiry_time: datetime) -> Optional[timedelta]:
    """
    Get time remaining until expiry.

    Args:
        expiry_time: Expiry datetime

    Returns:
        Time remaining as timedelta, or None if already expired
    """
    time_remaining = to_utc(expiry_time) - utc_now()
    return time_remaining if time_remaining.total_seconds() > 0 else None


def format_timedelta(td: timedelta) -> str:
    """
    Format timedelta as human-readable string.

    Args:
        td: Timedelta object

    Returns:
        Formatted string (e.g., "2h 30m")
    """
    total_seconds = int(td.total_seconds())

    if total_seconds < 0:
        return "expired"

    days = total_seconds // 86400
    hours = (total_seconds % 86400) // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60

    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    if seconds > 0 and not parts:  # Only show seconds if no larger units
        parts.append(f"{seconds}s")

    return " ".join(parts) if parts else "0s"


def convert_timezone(dt: datetime, target_tz: str) -> datetime:
    """
    Convert datetime to a specific timezone.

    Args:
        dt: Datetime object
        target_tz: Target timezone name (e.g., 'America/New_York')

    Returns:
        Datetime in target timezone
    """
    tz = pytz.timezone(target_tz)
    return to_utc(dt).astimezone(tz)


def get_start_of_day(dt: Optional[datetime] = None) -> datetime:
    """
    Get start of day (00:00:00) in UTC.

    Args:
        dt: Datetime object, or None for today

    Returns:
        Start of day datetime
    """
    if dt is None:
        dt = utc_now()
    return to_utc(dt).replace(hour=0, minute=0, second=0, microsecond=0)


def get_end_of_day(dt: Optional[datetime] = None) -> datetime:
    """
    Get end of day (23:59:59) in UTC.

    Args:
        dt: Datetime object, or None for today

    Returns:
        End of day datetime
    """
    if dt is None:
        dt = utc_now()
    return to_utc(dt).replace(hour=23, minute=59, second=59, microsecond=999999)
