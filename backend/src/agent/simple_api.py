"""Simple API routes for basic authentication and testing."""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext

# Simple app
app = FastAPI(title="LangGraph Research API - Simple", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this-in-production")
JWT_ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Models
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    preferences: dict = {}

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Mock user data
test_user = UserResponse(
    id="test_user_id",
    username="testuser",
    email="test@example.com",
    full_name="Test User",
    is_active=True,
    created_at=datetime.utcnow(),
    last_login=datetime.utcnow(),
    preferences={}
)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

@app.post("/api/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Simple login endpoint."""
    # Simple check - accept testuser/password123
    if user_credentials.username == "testuser" and user_credentials.password == "password123":
        access_token = create_access_token(data={"sub": test_user.id})
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=test_user
        )
    else:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user():
    """Get current user."""
    return test_user

# Category endpoints
@app.get("/api/categories/trending")
async def get_trending_topics():
    """Get trending topics."""
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

@app.get("/api/categories/sports")
async def get_sports_topics():
    """Get sports topics."""
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

@app.get("/api/categories/technology")
async def get_technology_topics():
    """Get technology topics."""
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

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "LangGraph Research API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2024)
