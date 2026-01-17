"""
Authentication Service

Handles JWT token generation, validation, user authentication,
and session management using MongoDB.
"""

from datetime import timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.config import settings
from app.core.logging import get_logger, audit_logger
from app.models.user import User, UserSession, UserRole, PyObjectId
from app.utils.security import verify_password, hash_password
from app.utils.datetime_utils import utc_now, add_minutes, add_days

logger = get_logger(__name__)


class AuthenticationError(Exception):
    """Raised when authentication fails."""
    pass


class AuthorizationError(Exception):
    """Raised when user lacks required permissions."""
    pass


class AuthService:
    """Service for handling authentication and authorization."""

    @staticmethod
    def create_access_token(
        user_id: str,
        username: str,
        role: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create JWT access token.

        Args:
            user_id: User ID (as string)
            username: Username
            role: User role
            expires_delta: Token expiration time

        Returns:
            JWT token string
        """
        if expires_delta is None:
            expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

        expire = utc_now() + expires_delta

        payload = {
            "sub": str(user_id),
            "username": username,
            "role": role,
            "type": "access",
            "exp": expire.timestamp(),
            "iat": utc_now().timestamp(),
        }

        token = jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        logger.debug(f"Created access token for user {username} (ID: {user_id})")
        return token

    @staticmethod
    def create_refresh_token(
        user_id: str,
        username: str,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        Create JWT refresh token.

        Args:
            user_id: User ID (as string)
            username: Username
            expires_delta: Token expiration time

        Returns:
            JWT token string
        """
        if expires_delta is None:
            expires_delta = timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

        expire = utc_now() + expires_delta

        payload = {
            "sub": str(user_id),
            "username": username,
            "type": "refresh",
            "exp": expire.timestamp(),
            "iat": utc_now().timestamp(),
        }

        token = jwt.encode(
            payload,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

        logger.debug(f"Created refresh token for user {username} (ID: {user_id})")
        return token

    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        Verify and decode JWT token.

        Args:
            token: JWT token string
            token_type: Expected token type (access or refresh)

        Returns:
            Token payload

        Raises:
            AuthenticationError: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )

            # Verify token type
            if payload.get("type") != token_type:
                raise AuthenticationError(f"Invalid token type. Expected {token_type}")

            return payload

        except JWTError as e:
            logger.warning(f"Token verification failed: {e}")
            raise AuthenticationError("Invalid or expired token")

    @staticmethod
    async def authenticate_user(
        db: AsyncIOMotorDatabase,
        username: str,
        password: str,
        ip_address: Optional[str] = None
    ) -> Optional[User]:
        """
        Authenticate user with username and password.

        Args:
            db: MongoDB database
            username: Username or email
            password: Plain text password
            ip_address: User's IP address for audit logging

        Returns:
            User object if authentication successful, None otherwise
        """
        # Try to find user by username or email
        user_doc = await db.users.find_one({
            "$or": [
                {"username": username},
                {"email": username}
            ]
        })

        # Log authentication attempt
        if not user_doc:
            audit_logger.log_auth_event(
                "login_failed",
                username=username,
                ip_address=ip_address,
                success=False,
                details={"reason": "user_not_found"}
            )
            return None

        user = User(**user_doc)

        # Verify password
        if not verify_password(password, user.hashed_password):
            audit_logger.log_auth_event(
                "login_failed",
                user_id=str(user.id),
                username=username,
                ip_address=ip_address,
                success=False,
                details={"reason": "invalid_password"}
            )
            return None

        # Check if user is active
        if not user.is_active:
            audit_logger.log_auth_event(
                "login_failed",
                user_id=str(user.id),
                username=username,
                ip_address=ip_address,
                success=False,
                details={"reason": "account_inactive"}
            )
            return None

        # Update last login
        await db.users.update_one(
            {"_id": user.id},
            {"$set": {"last_login": utc_now()}}
        )

        # Log successful authentication
        audit_logger.log_auth_event(
            "login_success",
            user_id=str(user.id),
            username=username,
            ip_address=ip_address,
            success=True
        )

        logger.info(f"User {username} authenticated successfully")
        return user

    @staticmethod
    async def create_session(
        db: AsyncIOMotorDatabase,
        user: User,
        refresh_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        remember_me: bool = False
    ) -> UserSession:
        """
        Create a new user session.

        Args:
            db: MongoDB database
            user: User object
            refresh_token: Refresh token
            user_agent: User agent string
            ip_address: IP address
            remember_me: Whether to remember user

        Returns:
            UserSession object
        """
        # Calculate expiration
        if remember_me:
            expires_at = add_days(utc_now(), 30)  # 30 days for remember me
        else:
            expires_at = add_days(utc_now(), settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

        # Create session document
        session_dict = {
            "user_id": user.id,
            "refresh_token": refresh_token,
            "user_agent": user_agent,
            "ip_address": ip_address,
            "is_active": True,
            "remember_me": remember_me,
            "created_at": utc_now(),
            "expires_at": expires_at,
            "last_activity": utc_now(),
        }

        result = await db.user_sessions.insert_one(session_dict)
        session_dict["_id"] = result.inserted_id
        session = UserSession(**session_dict)

        logger.info(f"Created session for user {user.username} (ID: {user.id})")
        return session

    @staticmethod
    async def invalidate_session(db: AsyncIOMotorDatabase, refresh_token: str) -> bool:
        """
        Invalidate a user session.

        Args:
            db: MongoDB database
            refresh_token: Refresh token to invalidate

        Returns:
            True if session was invalidated, False if not found
        """
        result = await db.user_sessions.update_one(
            {
                "refresh_token": refresh_token,
                "is_active": True
            },
            {
                "$set": {"is_active": False}
            }
        )

        if result.modified_count == 0:
            return False

        logger.info(f"Invalidated session with refresh token {refresh_token[:20]}...")
        return True

    @staticmethod
    async def invalidate_all_user_sessions(db: AsyncIOMotorDatabase, user_id: ObjectId) -> int:
        """
        Invalidate all sessions for a user.

        Args:
            db: MongoDB database
            user_id: User ID

        Returns:
            Number of sessions invalidated
        """
        result = await db.user_sessions.update_many(
            {
                "user_id": user_id,
                "is_active": True
            },
            {
                "$set": {"is_active": False}
            }
        )

        logger.info(f"Invalidated {result.modified_count} sessions for user {user_id}")
        return result.modified_count

    @staticmethod
    async def refresh_access_token(
        db: AsyncIOMotorDatabase,
        refresh_token: str
    ) -> tuple[str, str]:
        """
        Refresh access token using refresh token.

        Args:
            db: MongoDB database
            refresh_token: Refresh token

        Returns:
            Tuple of (new_access_token, new_refresh_token)

        Raises:
            AuthenticationError: If refresh token is invalid
        """
        # Verify refresh token
        try:
            payload = AuthService.verify_token(refresh_token, token_type="refresh")
        except AuthenticationError:
            raise

        # Check if session exists and is active
        session_doc = await db.user_sessions.find_one({
            "refresh_token": refresh_token,
            "is_active": True
        })

        if not session_doc:
            raise AuthenticationError("Session expired or invalid")

        session = UserSession(**session_doc)
        if session.is_expired():
            raise AuthenticationError("Session expired or invalid")

        # Get user
        user_doc = await db.users.find_one({"_id": session.user_id})
        if not user_doc:
            raise AuthenticationError("User not found or inactive")

        user = User(**user_doc)
        if not user.is_active:
            raise AuthenticationError("User not found or inactive")

        # Create new tokens
        new_access_token = AuthService.create_access_token(
            str(user.id),
            user.username,
            user.role.value
        )

        new_refresh_token = AuthService.create_refresh_token(
            str(user.id),
            user.username
        )

        # Update session with new refresh token
        await db.user_sessions.update_one(
            {"_id": session.id},
            {
                "$set": {
                    "refresh_token": new_refresh_token,
                    "last_activity": utc_now()
                }
            }
        )

        logger.info(f"Refreshed tokens for user {user.username} (ID: {user.id})")
        return new_access_token, new_refresh_token

    @staticmethod
    def check_permission(user: User, required_role: UserRole) -> bool:
        """
        Check if user has required role.

        Args:
            user: User object
            required_role: Required role

        Returns:
            True if user has permission, False otherwise
        """
        # Admins have all permissions
        if user.is_admin():
            return True

        # Check role hierarchy
        role_hierarchy = {
            UserRole.ADMIN: 3,
            UserRole.USER: 2,
            UserRole.GUEST: 1
        }

        user_level = role_hierarchy.get(user.role, 0)
        required_level = role_hierarchy.get(required_role, 0)

        return user_level >= required_level

    @staticmethod
    def require_permission(user: User, required_role: UserRole) -> None:
        """
        Require user to have specific role.

        Args:
            user: User object
            required_role: Required role

        Raises:
            AuthorizationError: If user lacks required permission
        """
        if not AuthService.check_permission(user, required_role):
            logger.warning(
                f"User {user.username} (ID: {user.id}) lacks required permission: {required_role}"
            )
            audit_logger.log_auth_event(
                "authorization_failed",
                user_id=str(user.id),
                username=user.username,
                success=False,
                details={"required_role": required_role.value, "user_role": user.role.value}
            )
            raise AuthorizationError(f"Required role: {required_role.value}")
