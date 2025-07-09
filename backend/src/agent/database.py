"""Database configuration and models for the LangGraph Research Application."""

import os
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from passlib.context import CryptContext
from jose import jwt
from dotenv import load_dotenv

load_dotenv()

# Database configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/langgraph_research")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN = os.getenv("JWT_EXPIRES_IN", "7d")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
client = AsyncIOMotorClient(MONGO_URL)
db = client.langgraph_research

# Collections
users_collection = db.users
conversations_collection = db.conversations
sessions_collection = db.sessions

# Pydantic models
class UserInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    email: EmailStr
    username: str
    full_name: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    preferences: Dict[str, Any] = Field(default_factory=dict)

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    preferences: Dict[str, Any]

class ConversationMessage(BaseModel):
    id: str
    role: str  # "human" or "ai"
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ConversationInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    user_id: str
    title: str
    messages: List[ConversationMessage]
    category: Optional[str] = None  # "trending", "sports", "technology", "general"
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_archived: bool = False
    sources_used: List[Dict[str, Any]] = Field(default_factory=list)

class SessionInDB(BaseModel):
    id: str = Field(default_factory=lambda: str(ObjectId()))
    user_id: str
    conversation_id: str
    session_data: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=24))

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
    user_doc = await users_collection.find_one({"username": username})
    if user_doc:
        user_doc["id"] = str(user_doc["_id"])
        return UserInDB(**user_doc)
    return None

async def get_user_by_email(email: str) -> Optional[UserInDB]:
    user_doc = await users_collection.find_one({"email": email})
    if user_doc:
        user_doc["id"] = str(user_doc["_id"])
        return UserInDB(**user_doc)
    return None

async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
    if user_doc:
        user_doc["id"] = str(user_doc["_id"])
        return UserInDB(**user_doc)
    return None

async def create_user(user: UserCreate) -> UserInDB:
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "_id": ObjectId(),
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "hashed_password": hashed_password,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "preferences": {}
    }
    await users_collection.insert_one(user_doc)
    user_doc["id"] = str(user_doc["_id"])
    return UserInDB(**user_doc)

async def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = await get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    # Update last login
    await users_collection.update_one(
        {"_id": ObjectId(user.id)},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    return user

async def save_conversation(conversation: ConversationInDB) -> str:
    conversation_doc = conversation.dict()
    conversation_doc["_id"] = ObjectId(conversation.id)
    conversation_doc.pop("id")
    result = await conversations_collection.insert_one(conversation_doc)
    return str(result.inserted_id)

async def get_user_conversations(user_id: str, skip: int = 0, limit: int = 50) -> List[ConversationInDB]:
    conversations = []
    async for conv_doc in conversations_collection.find(
        {"user_id": user_id, "is_archived": False}
    ).sort("updated_at", -1).skip(skip).limit(limit):
        conv_doc["id"] = str(conv_doc["_id"])
        conversations.append(ConversationInDB(**conv_doc))
    return conversations

async def get_conversation_by_id(conversation_id: str) -> Optional[ConversationInDB]:
    conv_doc = await conversations_collection.find_one({"_id": ObjectId(conversation_id)})
    if conv_doc:
        conv_doc["id"] = str(conv_doc["_id"])
        return ConversationInDB(**conv_doc)
    return None

async def update_conversation(conversation_id: str, update_data: Dict[str, Any]) -> bool:
    result = await conversations_collection.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {**update_data, "updated_at": datetime.utcnow()}}
    )
    return result.modified_count > 0

async def search_conversations(user_id: str, query: str, category: Optional[str] = None) -> List[ConversationInDB]:
    search_filter = {
        "user_id": user_id,
        "is_archived": False,
        "$or": [
            {"title": {"$regex": query, "$options": "i"}},
            {"messages.content": {"$regex": query, "$options": "i"}},
            {"tags": {"$regex": query, "$options": "i"}}
        ]
    }
    
    if category:
        search_filter["category"] = category
    
    conversations = []
    async for conv_doc in conversations_collection.find(search_filter).sort("updated_at", -1).limit(20):
        conv_doc["id"] = str(conv_doc["_id"])
        conversations.append(ConversationInDB(**conv_doc))
    return conversations

# Initialize database indexes
async def init_db():
    # Create indexes for better performance
    await users_collection.create_index("username", unique=True)
    await users_collection.create_index("email", unique=True)
    await conversations_collection.create_index([("user_id", 1), ("updated_at", -1)])
    await conversations_collection.create_index([("user_id", 1), ("category", 1)])
    await conversations_collection.create_index([("title", "text"), ("messages.content", "text"), ("tags", "text")])
    await sessions_collection.create_index("expires_at", expireAfterSeconds=0)