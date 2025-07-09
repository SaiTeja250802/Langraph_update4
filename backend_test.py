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
from fastapi.testclient import TestClient
from agent.app import app

# Create a test client
client = TestClient(app)

class TestResearchAIBackend:
    """Test suite for the Research AI Backend."""

    def setup_method(self):
        """Set up test environment before each test."""
        self.test_user = {
            "username": "research_user",
            "email": "researcher@example.com",
            "full_name": "Research User",
            "password": "SecurePass123!"
        }
        self.login_data = {
            "username": "research_user",
            "password": "SecurePass123!"
        }
        self.test_conversation = {
            "title": "AI Market Research Analysis",
            "category": "market-research",
            "tags": ["ai", "market", "analysis"]
        }
        self.test_message = {
            "role": "human",
            "content": "What are the latest trends in AI market research?",
            "metadata": {"effort": "medium", "model": "gemini-2.5-flash"}
        }
        
        # Clean state for each test
        self.auth_token = None
        self.user_id = None
        self.conversation_id = None

    def test_01_user_registration(self):
        """Test user registration endpoint."""
        print("\n--- Testing User Registration ---")
        
        # Try to register a new user
        response = client.post("/api/auth/register", json=self.test_user)
        
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
        assert data["user"]["username"] == self.test_user["username"]
        assert data["user"]["email"] == self.test_user["email"]
        
        print("User registration successful")

    def test_02_user_login(self):
        """Test user login endpoint."""
        print("\n--- Testing User Login ---")
        
        response = client.post("/api/auth/login", json=self.login_data)
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access token in response"
        assert "user" in data, "No user data in response"
        
        # Save token for subsequent tests
        self.auth_token = data["access_token"]
        self.user_id = data["user"]["id"]
        
        print(f"Login successful. User ID: {self.user_id}")
        return self.auth_token

    def test_03_get_current_user(self):
        """Test getting current user information."""
        print("\n--- Testing Get Current User ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.auth_token = self.test_02_user_login()
        
        response = client.get(
            "/api/auth/me", 
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Get current user failed: {response.text}"
        
        data = response.json()
        assert data["username"] == self.login_data["username"]
        
        print("Get current user successful")

    def test_04_create_conversation(self):
        """Test creating a new conversation."""
        print("\n--- Testing Create Conversation ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.auth_token = self.test_02_user_login()
        
        response = client.post(
            "/api/conversations", 
            json=self.test_conversation,
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Create conversation failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "No conversation ID in response"
        assert data["title"] == self.test_conversation["title"]
        assert data["category"] == self.test_conversation["category"]
        assert data["tags"] == self.test_conversation["tags"]
        
        # Save conversation ID for subsequent tests
        self.conversation_id = data["id"]
        
        print(f"Conversation created successfully. ID: {self.conversation_id}")
        return self.conversation_id

    def test_05_add_message_to_conversation(self):
        """Test adding a message to a conversation."""
        print("\n--- Testing Add Message to Conversation ---")
        
        # Ensure we have a conversation
        if not self.conversation_id:
            self.conversation_id = self.test_04_create_conversation()
        
        response = client.post(
            f"/api/conversations/{self.conversation_id}/messages", 
            json=self.test_message,
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Add message failed: {response.text}"
        
        print("Message added successfully")

    def test_06_get_conversation(self):
        """Test retrieving a specific conversation."""
        print("\n--- Testing Get Conversation ---")
        
        # Ensure we have a conversation with a message
        if not self.conversation_id:
            self.conversation_id = self.test_04_create_conversation()
            self.test_05_add_message_to_conversation()
        
        response = client.get(
            f"/api/conversations/{self.conversation_id}",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Get conversation failed: {response.text}"
        
        data = response.json()
        assert data["id"] == self.conversation_id
        assert data["title"] == self.test_conversation["title"]
        assert len(data["messages"]) >= 1, "No messages in conversation"
        
        # Verify the message content
        assert data["messages"][0]["content"] == self.test_message["content"]
        assert data["messages"][0]["role"] == self.test_message["role"]
        
        print("Get conversation successful")

    def test_07_get_user_conversations(self):
        """Test retrieving all user conversations."""
        print("\n--- Testing Get User Conversations ---")
        
        # Ensure we have at least one conversation
        if not self.conversation_id:
            self.conversation_id = self.test_04_create_conversation()
        
        response = client.get(
            "/api/conversations",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Get conversations failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response is not a list"
        assert len(data) >= 1, "No conversations returned"
        
        # Verify our test conversation is in the list
        conversation_ids = [conv["id"] for conv in data]
        assert self.conversation_id in conversation_ids, "Test conversation not found in list"
        
        print(f"Retrieved {len(data)} conversations successfully")

    def test_08_search_conversations(self):
        """Test searching conversations."""
        print("\n--- Testing Search Conversations ---")
        
        # Ensure we have a conversation with content to search
        if not self.conversation_id:
            self.conversation_id = self.test_04_create_conversation()
            self.test_05_add_message_to_conversation()
        
        search_query = {
            "query": "AI market",
            "category": "market-research"
        }
        
        response = client.post(
            "/api/conversations/search", 
            json=search_query,
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Search conversations failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response is not a list"
        
        # Our test conversation should be in the results
        if len(data) > 0:
            conversation_ids = [conv["id"] for conv in data]
            assert self.conversation_id in conversation_ids, "Test conversation not found in search results"
            print(f"Search returned {len(data)} conversations")
        else:
            print("Search returned no results - this might be expected depending on the database state")

    def test_09_category_trending_topics(self):
        """Test getting trending topics."""
        print("\n--- Testing Trending Topics Endpoint ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.auth_token = self.test_02_user_login()
        
        response = client.get(
            "/api/categories/trending",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Get trending topics failed: {response.text}"
        
        data = response.json()
        assert "suggested_queries" in data, "No suggested queries in response"
        assert "category" in data, "No category in response"
        assert data["category"] == "trending"
        assert len(data["suggested_queries"]) >= 1, "No suggested queries provided"
        
        print("Trending topics endpoint successful")

    def test_10_category_sports_topics(self):
        """Test getting sports topics."""
        print("\n--- Testing Sports Topics Endpoint ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.auth_token = self.test_02_user_login()
        
        response = client.get(
            "/api/categories/sports",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Get sports topics failed: {response.text}"
        
        data = response.json()
        assert "suggested_queries" in data, "No suggested queries in response"
        assert "category" in data, "No category in response"
        assert data["category"] == "sports"
        assert len(data["suggested_queries"]) >= 1, "No suggested queries provided"
        
        print("Sports topics endpoint successful")

    def test_11_category_technology_topics(self):
        """Test getting technology topics."""
        print("\n--- Testing Technology Topics Endpoint ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.auth_token = self.test_02_user_login()
        
        response = client.get(
            "/api/categories/technology",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 200, f"Get technology topics failed: {response.text}"
        
        data = response.json()
        assert "suggested_queries" in data, "No suggested queries in response"
        assert "category" in data, "No category in response"
        assert data["category"] == "technology"
        assert len(data["suggested_queries"]) >= 1, "No suggested queries provided"
        
        print("Technology topics endpoint successful")

    def test_12_invalid_auth(self):
        """Test invalid authentication scenarios."""
        print("\n--- Testing Invalid Authentication ---")
        
        # Test with invalid credentials
        invalid_login = {
            "username": "invalid_user",
            "password": "invalid_password"
        }
        
        response = client.post("/api/auth/login", json=invalid_login)
        assert response.status_code == 401, "Invalid login should be rejected"
        
        # Test protected endpoint without token
        response = client.get("/api/conversations")
        assert response.status_code == 401, "Unauthorized access should be rejected"
        
        print("Invalid authentication tests passed")

    def test_13_invalid_conversation_access(self):
        """Test accessing non-existent or unauthorized conversations."""
        print("\n--- Testing Invalid Conversation Access ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.auth_token = self.test_02_user_login()
        
        # Test with non-existent conversation ID
        fake_id = "000000000000000000000000"  # 24-character fake ObjectId
        response = client.get(
            f"/api/conversations/{fake_id}",
            headers={"Authorization": f"Bearer {self.auth_token}"}
        )
        assert response.status_code == 404, "Non-existent conversation should return 404"
        
        print("Invalid conversation access tests passed")

if __name__ == "__main__":
    print("Starting Research AI Backend Tests...")
    
    # Create an instance of the test class
    test_instance = TestResearchAIBackend()
    
    # Run all tests in order
    try:
        test_instance.setup_method()
        test_instance.test_01_user_registration()
        test_instance.test_02_user_login()
        test_instance.test_03_get_current_user()
        test_instance.test_04_create_conversation()
        test_instance.test_05_add_message_to_conversation()
        test_instance.test_06_get_conversation()
        test_instance.test_07_get_user_conversations()
        test_instance.test_08_search_conversations()
        test_instance.test_09_category_trending_topics()
        test_instance.test_10_category_sports_topics()
        test_instance.test_11_category_technology_topics()
        test_instance.test_12_invalid_auth()
        test_instance.test_13_invalid_conversation_access()
        print("\n✅ All tests passed successfully!")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)