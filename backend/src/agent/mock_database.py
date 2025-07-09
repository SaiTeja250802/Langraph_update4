"""Mock database implementation for testing without MongoDB."""

import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from bson import ObjectId
from .database import (
    UserInDB, UserCreate, UserLogin, UserResponse, ConversationInDB, 
    ConversationMessage, SessionInDB
)

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN = os.getenv("JWT_EXPIRES_IN", "7d")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Mock data storage
mock_users = {}
mock_conversations = {}
mock_sessions = {}

def generate_mock_id():
    return str(ObjectId())

# Pre-populate with test user
test_user = UserInDB(
    id=generate_mock_id(),
    email="test@example.com",
    username="testuser",
    full_name="Test User",
    hashed_password=pwd_context.hash("password123"),
    is_active=True,
    created_at=datetime.utcnow(),
    preferences={}
)
mock_users["testuser"] = test_user
mock_users["test@example.com"] = test_user

# Database initialization
async def init_db():
    """Initialize the mock database."""
    print("Mock database initialized successfully")

# Authentication functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_user_by_username(username: str) -> Optional[UserInDB]:
    return mock_users.get(username)

async def get_user_by_email(email: str) -> Optional[UserInDB]:
    return mock_users.get(email)

async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    for user in mock_users.values():
        if user.id == user_id:
            return user
    return None

async def create_user(user: UserCreate) -> UserInDB:
    hashed_password = get_password_hash(user.password)
    user_id = generate_mock_id()
    
    user_doc = UserInDB(
        id=user_id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_active=True,
        created_at=datetime.utcnow(),
        preferences={}
    )
    
    mock_users[user.username] = user_doc
    mock_users[user.email] = user_doc
    return user_doc

async def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = await get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    # Update last login
    user.last_login = datetime.utcnow()
    return user

async def save_conversation(conversation: ConversationInDB) -> str:
    conversation_id = generate_mock_id()
    conversation.id = conversation_id
    mock_conversations[conversation_id] = conversation
    return conversation_id

async def get_user_conversations(user_id: str, skip: int = 0, limit: int = 50) -> List[ConversationInDB]:
    conversations = []
    for conv in mock_conversations.values():
        if conv.user_id == user_id and not conv.is_archived:
            conversations.append(conv)
    
    # Sort by updated_at descending
    conversations.sort(key=lambda x: x.updated_at, reverse=True)
    return conversations[skip:skip + limit]

async def get_conversation_by_id(conversation_id: str) -> Optional[ConversationInDB]:
    return mock_conversations.get(conversation_id)

async def update_conversation(conversation_id: str, update_data: Dict[str, Any]) -> bool:
    conversation = mock_conversations.get(conversation_id)
    if not conversation:
        return False
    
    for key, value in update_data.items():
        if hasattr(conversation, key):
            setattr(conversation, key, value)
    
    conversation.updated_at = datetime.utcnow()
    return True

async def search_conversations(user_id: str, query: str, category: Optional[str] = None) -> List[ConversationInDB]:
    conversations = []
    for conv in mock_conversations.values():
        if conv.user_id == user_id and not conv.is_archived:
            # Simple search in title and messages
            if (query.lower() in conv.title.lower() or 
                any(query.lower() in msg.content.lower() for msg in conv.messages) or
                any(query.lower() in tag.lower() for tag in conv.tags)):
                if not category or conv.category == category:
                    conversations.append(conv)
    
    return conversations
