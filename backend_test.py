#!/usr/bin/env python3
"""
Comprehensive backend test for the LangGraph Research API.

This test script covers:
1. Authentication System
2. Conversation Management
3. Category-Specific Features
4. Database Integration
"""

import os
import sys
import json
import pytest
import httpx
import asyncio
from agent.app import app

# Test data
TEST_USER = {
    "username": "research_user",
    "email": "researcher@example.com",
    "full_name": "Research User",
    "password": "SecurePass123!"
}

LOGIN_DATA = {
    "username": "research_user",
    "password": "SecurePass123!"
}

TEST_CONVERSATION = {
    "title": "AI Market Research Analysis",
    "category": "market-research",
    "tags": ["ai", "market", "analysis"]
}

TEST_MESSAGE = {
    "role": "human",
    "content": "What are the latest trends in AI market research?",
    "metadata": {"effort": "medium", "model": "gemini-2.5-flash"}
}

# Global variables to store state between tests
auth_token = None
user_id = None
conversation_id = None

@pytest.mark.asyncio
async def test_01_user_registration():
    """Test user registration endpoint."""
    print("\n--- Testing User Registration ---")
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        # Try to register a new user
        response = await client.post("/api/auth/register", json=TEST_USER)
        
        # If user already exists, this is fine for our test
        if response.status_code == 400 and "already registered" in response.text:
            print("User already exists, proceeding with login")
            return
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "access_token" in data, "No access token in response"
        assert "token_type" in data, "No token type in response"
        assert "user" in data, "No user data in response"
        assert data["user"]["username"] == TEST_USER["username"]
        assert data["user"]["email"] == TEST_USER["email"]
        
        print("User registration successful")

@pytest.mark.asyncio
async def test_02_user_login():
    """Test user login endpoint."""
    global auth_token, user_id
    
    print("\n--- Testing User Login ---")
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/auth/login", json=LOGIN_DATA)
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access token in response"
        assert "user" in data, "No user data in response"
        
        # Save token for subsequent tests
        auth_token = data["access_token"]
        user_id = data["user"]["id"]
        
        print(f"Login successful. User ID: {user_id}")
        return auth_token

@pytest.mark.asyncio
async def test_03_get_current_user():
    """Test getting current user information."""
    global auth_token
    
    print("\n--- Testing Get Current User ---")
    
    # Ensure we have a token
    if not auth_token:
        auth_token = await test_02_user_login()
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/auth/me", 
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get current user failed: {response.text}"
        
        data = response.json()
        assert data["username"] == LOGIN_DATA["username"]
        
        print("Get current user successful")

@pytest.mark.asyncio
async def test_04_create_conversation():
    """Test creating a new conversation."""
    global auth_token, conversation_id
    
    print("\n--- Testing Create Conversation ---")
    
    # Ensure we have a token
    if not auth_token:
        auth_token = await test_02_user_login()
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/conversations", 
            json=TEST_CONVERSATION,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Create conversation failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "No conversation ID in response"
        assert data["title"] == TEST_CONVERSATION["title"]
        assert data["category"] == TEST_CONVERSATION["category"]
        assert data["tags"] == TEST_CONVERSATION["tags"]
        
        # Save conversation ID for subsequent tests
        conversation_id = data["id"]
        
        print(f"Conversation created successfully. ID: {conversation_id}")
        return conversation_id

@pytest.mark.asyncio
async def test_05_add_message_to_conversation():
    """Test adding a message to a conversation."""
    global auth_token, conversation_id
    
    print("\n--- Testing Add Message to Conversation ---")
    
    # Ensure we have a conversation
    if not conversation_id:
        conversation_id = await test_04_create_conversation()
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            f"/api/conversations/{conversation_id}/messages", 
            json=TEST_MESSAGE,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Add message failed: {response.text}"
        
        print("Message added successfully")

@pytest.mark.asyncio
async def test_06_get_conversation():
    """Test retrieving a specific conversation."""
    global auth_token, conversation_id
    
    print("\n--- Testing Get Conversation ---")
    
    # Ensure we have a conversation with a message
    if not conversation_id:
        conversation_id = await test_04_create_conversation()
        await test_05_add_message_to_conversation()
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/conversations/{conversation_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get conversation failed: {response.text}"
        
        data = response.json()
        assert data["id"] == conversation_id
        assert data["title"] == TEST_CONVERSATION["title"]
        assert len(data["messages"]) >= 1, "No messages in conversation"
        
        # Verify the message content
        assert data["messages"][0]["content"] == TEST_MESSAGE["content"]
        assert data["messages"][0]["role"] == TEST_MESSAGE["role"]
        
        print("Get conversation successful")

@pytest.mark.asyncio
async def test_07_get_user_conversations():
    """Test retrieving all user conversations."""
    global auth_token, conversation_id
    
    print("\n--- Testing Get User Conversations ---")
    
    # Ensure we have at least one conversation
    if not conversation_id:
        conversation_id = await test_04_create_conversation()
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/conversations",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get conversations failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response is not a list"
        assert len(data) >= 1, "No conversations returned"
        
        # Verify our test conversation is in the list
        conversation_ids = [conv["id"] for conv in data]
        assert conversation_id in conversation_ids, "Test conversation not found in list"
        
        print(f"Retrieved {len(data)} conversations successfully")

@pytest.mark.asyncio
async def test_08_search_conversations():
    """Test searching conversations."""
    global auth_token, conversation_id
    
    print("\n--- Testing Search Conversations ---")
    
    # Ensure we have a conversation with content to search
    if not conversation_id:
        conversation_id = await test_04_create_conversation()
        await test_05_add_message_to_conversation()
    
    search_query = {
        "query": "AI market",
        "category": "market-research"
    }
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/conversations/search", 
            json=search_query,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Search conversations failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response is not a list"
        
        # Our test conversation should be in the results
        if len(data) > 0:
            conversation_ids = [conv["id"] for conv in data]
            assert conversation_id in conversation_ids, "Test conversation not found in search results"
            print(f"Search returned {len(data)} conversations")
        else:
            print("Search returned no results - this might be expected depending on the database state")

@pytest.mark.asyncio
async def test_09_category_trending_topics():
    """Test getting trending topics."""
    global auth_token
    
    print("\n--- Testing Trending Topics Endpoint ---")
    
    # Ensure we have a token
    if not auth_token:
        auth_token = await test_02_user_login()
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/categories/trending",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get trending topics failed: {response.text}"
        
        data = response.json()
        assert "suggested_queries" in data, "No suggested queries in response"
        assert "category" in data, "No category in response"
        assert data["category"] == "trending"
        assert len(data["suggested_queries"]) >= 1, "No suggested queries provided"
        
        print("Trending topics endpoint successful")

@pytest.mark.asyncio
async def test_10_category_sports_topics():
    """Test getting sports topics."""
    global auth_token
    
    print("\n--- Testing Sports Topics Endpoint ---")
    
    # Ensure we have a token
    if not auth_token:
        auth_token = await test_02_user_login()
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/categories/sports",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get sports topics failed: {response.text}"
        
        data = response.json()
        assert "suggested_queries" in data, "No suggested queries in response"
        assert "category" in data, "No category in response"
        assert data["category"] == "sports"
        assert len(data["suggested_queries"]) >= 1, "No suggested queries provided"
        
        print("Sports topics endpoint successful")

@pytest.mark.asyncio
async def test_11_category_technology_topics():
    """Test getting technology topics."""
    global auth_token
    
    print("\n--- Testing Technology Topics Endpoint ---")
    
    # Ensure we have a token
    if not auth_token:
        auth_token = await test_02_user_login()
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/categories/technology",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get technology topics failed: {response.text}"
        
        data = response.json()
        assert "suggested_queries" in data, "No suggested queries in response"
        assert "category" in data, "No category in response"
        assert data["category"] == "technology"
        assert len(data["suggested_queries"]) >= 1, "No suggested queries provided"
        
        print("Technology topics endpoint successful")

@pytest.mark.asyncio
async def test_12_invalid_auth():
    """Test invalid authentication scenarios."""
    print("\n--- Testing Invalid Authentication ---")
    
    # Test with invalid credentials
    invalid_login = {
        "username": "invalid_user",
        "password": "invalid_password"
    }
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/auth/login", json=invalid_login)
        assert response.status_code == 401, "Invalid login should be rejected"
        
        # Test protected endpoint without token
        response = await client.get("/api/conversations")
        assert response.status_code == 401, "Unauthorized access should be rejected"
        
        print("Invalid authentication tests passed")

@pytest.mark.asyncio
async def test_13_invalid_conversation_access():
    """Test accessing non-existent or unauthorized conversations."""
    global auth_token
    
    print("\n--- Testing Invalid Conversation Access ---")
    
    # Ensure we have a token
    if not auth_token:
        auth_token = await test_02_user_login()
    
    # Test with non-existent conversation ID
    fake_id = "000000000000000000000000"  # 24-character fake ObjectId
    
    async with httpx.AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            f"/api/conversations/{fake_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 404, "Non-existent conversation should return 404"
        
        print("Invalid conversation access tests passed")

if __name__ == "__main__":
    print("Starting Research AI Backend Tests...")
    
    # Run all tests using pytest
    pytest.main(["-xvs", __file__])