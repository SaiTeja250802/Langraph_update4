"""Authentication utilities and middleware."""

from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from .database import (
    JWT_SECRET, JWT_ALGORITHM, get_user_by_id, UserInDB, UserResponse
)

security = HTTPBearer()

class AuthException(HTTPException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    """Get current authenticated user from JWT token."""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AuthException()
    except JWTError:
        raise AuthException()
    
    user = await get_user_by_id(user_id)
    if user is None:
        raise AuthException()
    
    if not user.is_active:
        raise AuthException("Inactive user")
    
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
        preferences=user.preferences
    )

async def get_current_active_user(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Get current active user."""
    if not current_user.is_active:
        raise AuthException("Inactive user")
    return current_user

def create_user_response(user: UserInDB) -> UserResponse:
    """Convert UserInDB to UserResponse."""
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login,
        preferences=user.preferences
    )