"""API routes for authentication and chat management."""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from agent.database import (
    UserCreate, UserLogin, UserResponse, ConversationInDB, ConversationMessage,
    create_user, authenticate_user, get_user_by_username, get_user_by_email,
    create_access_token, save_conversation, get_user_conversations,
    get_conversation_by_id, update_conversation, search_conversations
)
from agent.auth import get_current_active_user, create_user_response

router = APIRouter()
security = HTTPBearer()

# Auth models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ConversationCreate(BaseModel):
    title: str
    category: Optional[str] = None
    tags: List[str] = []

class ConversationResponse(BaseModel):
    id: str
    title: str
    category: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    message_count: int
    last_message_preview: Optional[str]

class MessageCreate(BaseModel):
    role: str
    content: str
    metadata: dict = {}

class SearchRequest(BaseModel):
    query: str
    category: Optional[str] = None

# Authentication endpoints
@router.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate):
    """Register a new user."""
    # Check if user already exists
    existing_user = await get_user_by_username(user.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    existing_email = await get_user_by_email(user.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = await create_user(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": db_user.id})
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=create_user_response(db_user)
    )

@router.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Authenticate user and return token."""
    user = await authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.id})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=create_user_response(user)
    )

@router.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

# Conversation endpoints
@router.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Create a new conversation."""
    new_conversation = ConversationInDB(
        user_id=current_user.id,
        title=conversation.title,
        category=conversation.category,
        tags=conversation.tags,
        messages=[]
    )
    
    conversation_id = await save_conversation(new_conversation)
    
    return ConversationResponse(
        id=conversation_id,
        title=new_conversation.title,
        category=new_conversation.category,
        tags=new_conversation.tags,
        created_at=new_conversation.created_at,
        updated_at=new_conversation.updated_at,
        message_count=0,
        last_message_preview=None
    )

@router.get("/api/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    skip: int = 0,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get user's conversations."""
    conversations = await get_user_conversations(current_user.id, skip, limit)
    
    return [
        ConversationResponse(
            id=conv.id,
            title=conv.title,
            category=conv.category,
            tags=conv.tags,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=len(conv.messages),
            last_message_preview=conv.messages[-1].content[:100] + "..." if conv.messages else None
        )
        for conv in conversations
    ]

@router.get("/api/conversations/{conversation_id}", response_model=ConversationInDB)
async def get_conversation(
    conversation_id: str,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Get a specific conversation."""
    conversation = await get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
    
    return conversation

@router.post("/api/conversations/{conversation_id}/messages")
async def add_message_to_conversation(
    conversation_id: str,
    message: MessageCreate,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Add a message to a conversation."""
    conversation = await get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this conversation")
    
    new_message = ConversationMessage(
        id=str(len(conversation.messages) + 1),
        role=message.role,
        content=message.content,
        metadata=message.metadata
    )
    
    conversation.messages.append(new_message)
    await update_conversation(conversation_id, {"messages": [msg.dict() for msg in conversation.messages]})
    
    return {"message": "Message added successfully"}

@router.post("/api/conversations/search", response_model=List[ConversationResponse])
async def search_user_conversations(
    search_request: SearchRequest,
    current_user: UserResponse = Depends(get_current_active_user)
):
    """Search through user's conversations."""
    conversations = await search_conversations(
        current_user.id, 
        search_request.query, 
        search_request.category
    )
    
    return [
        ConversationResponse(
            id=conv.id,
            title=conv.title,
            category=conv.category,
            tags=conv.tags,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=len(conv.messages),
            last_message_preview=conv.messages[-1].content[:100] + "..." if conv.messages else None
        )
        for conv in conversations
    ]

# Category-specific endpoints
@router.get("/api/categories/trending")
async def get_trending_topics(current_user: UserResponse = Depends(get_current_active_user)):
    """Get trending topics for today."""
    return {
        "suggested_queries": [
            "What are the top trending topics today?",
            "Latest viral news and social media trends",
            "Breaking news and current events",
            "Popular culture and entertainment trends",
            "Trending hashtags and social movements"
        ],
        "category": "trending"
    }

@router.get("/api/categories/sports")
async def get_sports_topics(current_user: UserResponse = Depends(get_current_active_user)):
    """Get sports topics for today."""
    return {
        "suggested_queries": [
            "Latest sports news and scores today",
            "NFL/NBA/MLB/NHL highlights and updates",
            "Soccer/Football matches and results",
            "Olympic updates and sports events",
            "Sports transfers and trade news"
        ],
        "category": "sports"
    }

@router.get("/api/categories/technology")
async def get_technology_topics(current_user: UserResponse = Depends(get_current_active_user)):
    """Get technology topics for today."""
    return {
        "suggested_queries": [
            "Latest tech news and innovations",
            "AI and machine learning breakthroughs",
            "New gadgets and product launches",
            "Tech industry mergers and acquisitions",
            "Software updates and cybersecurity news"
        ],
        "category": "technology"
    }