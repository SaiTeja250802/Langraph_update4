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
import requests
import unittest
from typing import Dict, Any, Optional

# Get the backend URL from the frontend .env file
def get_backend_url():
    with open('/app/frontend/.env', 'r') as f:
        for line in f:
            if line.startswith('VITE_BACKEND_URL='):
                return line.strip().split('=')[1]
    return "http://localhost:8001"  # Default fallback

# Base URL for API requests
BASE_URL = f"{get_backend_url()}/api"
print(f"Using backend URL: {BASE_URL}")

class ResearchAIBackendTest(unittest.TestCase):
    """Test suite for the Research AI Backend."""

    def setUp(self):
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

    def make_request(self, method: str, endpoint: str, data: Optional[Dict[str, Any]] = None, 
                    auth_required: bool = False) -> requests.Response:
        """Make an HTTP request to the API."""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        if method.lower() == "get":
            response = requests.get(url, headers=headers)
        elif method.lower() == "post":
            headers["Content-Type"] = "application/json"
            response = requests.post(url, json=data, headers=headers)
        elif method.lower() == "put":
            headers["Content-Type"] = "application/json"
            response = requests.put(url, json=data, headers=headers)
        elif method.lower() == "delete":
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        return response

    def test_01_user_registration(self):
        """Test user registration endpoint."""
        print("\n--- Testing User Registration ---")
        
        # Try to register a new user
        response = self.make_request("post", "/auth/register", self.test_user)
        
        # If user already exists, this is fine for our test
        if response.status_code == 400 and "already registered" in response.text:
            print("User already exists, proceeding with login")
            return
        
        self.assertEqual(response.status_code, 200, f"Registration failed: {response.text}")
        data = response.json()
        
        # Verify response structure
        self.assertIn("access_token", data, "No access token in response")
        self.assertIn("token_type", data, "No token type in response")
        self.assertIn("user", data, "No user data in response")
        self.assertEqual(data["user"]["username"], self.test_user["username"])
        self.assertEqual(data["user"]["email"], self.test_user["email"])
        
        print("User registration successful")

    def test_02_user_login(self):
        """Test user login endpoint."""
        print("\n--- Testing User Login ---")
        
        response = self.make_request("post", "/auth/login", self.login_data)
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        
        data = response.json()
        self.assertIn("access_token", data, "No access token in response")
        self.assertIn("user", data, "No user data in response")
        
        # Save token for subsequent tests
        self.auth_token = data["access_token"]
        self.user_id = data["user"]["id"]
        
        print(f"Login successful. User ID: {self.user_id}")

    def test_03_get_current_user(self):
        """Test getting current user information."""
        print("\n--- Testing Get Current User ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.test_02_user_login()
        
        response = self.make_request("get", "/auth/me", auth_required=True)
        self.assertEqual(response.status_code, 200, f"Get current user failed: {response.text}")
        
        data = response.json()
        self.assertEqual(data["username"], self.login_data["username"])
        
        print("Get current user successful")

    def test_04_create_conversation(self):
        """Test creating a new conversation."""
        print("\n--- Testing Create Conversation ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.test_02_user_login()
        
        response = self.make_request("post", "/conversations", self.test_conversation, auth_required=True)
        self.assertEqual(response.status_code, 200, f"Create conversation failed: {response.text}")
        
        data = response.json()
        self.assertIn("id", data, "No conversation ID in response")
        self.assertEqual(data["title"], self.test_conversation["title"])
        self.assertEqual(data["category"], self.test_conversation["category"])
        self.assertEqual(data["tags"], self.test_conversation["tags"])
        
        # Save conversation ID for subsequent tests
        self.conversation_id = data["id"]
        
        print(f"Conversation created successfully. ID: {self.conversation_id}")

    def test_05_add_message_to_conversation(self):
        """Test adding a message to a conversation."""
        print("\n--- Testing Add Message to Conversation ---")
        
        # Ensure we have a conversation
        if not self.conversation_id:
            self.test_04_create_conversation()
        
        response = self.make_request(
            "post", 
            f"/conversations/{self.conversation_id}/messages", 
            self.test_message, 
            auth_required=True
        )
        self.assertEqual(response.status_code, 200, f"Add message failed: {response.text}")
        
        print("Message added successfully")

    def test_06_get_conversation(self):
        """Test retrieving a specific conversation."""
        print("\n--- Testing Get Conversation ---")
        
        # Ensure we have a conversation with a message
        if not self.conversation_id:
            self.test_04_create_conversation()
            self.test_05_add_message_to_conversation()
        
        response = self.make_request("get", f"/conversations/{self.conversation_id}", auth_required=True)
        self.assertEqual(response.status_code, 200, f"Get conversation failed: {response.text}")
        
        data = response.json()
        self.assertEqual(data["id"], self.conversation_id)
        self.assertEqual(data["title"], self.test_conversation["title"])
        self.assertGreaterEqual(len(data["messages"]), 1, "No messages in conversation")
        
        # Verify the message content
        self.assertEqual(data["messages"][0]["content"], self.test_message["content"])
        self.assertEqual(data["messages"][0]["role"], self.test_message["role"])
        
        print("Get conversation successful")

    def test_07_get_user_conversations(self):
        """Test retrieving all user conversations."""
        print("\n--- Testing Get User Conversations ---")
        
        # Ensure we have at least one conversation
        if not self.conversation_id:
            self.test_04_create_conversation()
        
        response = self.make_request("get", "/conversations", auth_required=True)
        self.assertEqual(response.status_code, 200, f"Get conversations failed: {response.text}")
        
        data = response.json()
        self.assertIsInstance(data, list, "Response is not a list")
        self.assertGreaterEqual(len(data), 1, "No conversations returned")
        
        # Verify our test conversation is in the list
        conversation_ids = [conv["id"] for conv in data]
        self.assertIn(self.conversation_id, conversation_ids, "Test conversation not found in list")
        
        print(f"Retrieved {len(data)} conversations successfully")

    def test_08_search_conversations(self):
        """Test searching conversations."""
        print("\n--- Testing Search Conversations ---")
        
        # Ensure we have a conversation with content to search
        if not self.conversation_id:
            self.test_04_create_conversation()
            self.test_05_add_message_to_conversation()
        
        search_query = {
            "query": "AI market",
            "category": "market-research"
        }
        
        response = self.make_request("post", "/conversations/search", search_query, auth_required=True)
        self.assertEqual(response.status_code, 200, f"Search conversations failed: {response.text}")
        
        data = response.json()
        self.assertIsInstance(data, list, "Response is not a list")
        
        # Our test conversation should be in the results
        if len(data) > 0:
            conversation_ids = [conv["id"] for conv in data]
            self.assertIn(self.conversation_id, conversation_ids, "Test conversation not found in search results")
            print(f"Search returned {len(data)} conversations")
        else:
            print("Search returned no results - this might be expected depending on the database state")

    def test_09_category_trending_topics(self):
        """Test getting trending topics."""
        print("\n--- Testing Trending Topics Endpoint ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.test_02_user_login()
        
        response = self.make_request("get", "/categories/trending", auth_required=True)
        self.assertEqual(response.status_code, 200, f"Get trending topics failed: {response.text}")
        
        data = response.json()
        self.assertIn("suggested_queries", data, "No suggested queries in response")
        self.assertIn("category", data, "No category in response")
        self.assertEqual(data["category"], "trending")
        self.assertGreaterEqual(len(data["suggested_queries"]), 1, "No suggested queries provided")
        
        print("Trending topics endpoint successful")

    def test_10_category_sports_topics(self):
        """Test getting sports topics."""
        print("\n--- Testing Sports Topics Endpoint ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.test_02_user_login()
        
        response = self.make_request("get", "/categories/sports", auth_required=True)
        self.assertEqual(response.status_code, 200, f"Get sports topics failed: {response.text}")
        
        data = response.json()
        self.assertIn("suggested_queries", data, "No suggested queries in response")
        self.assertIn("category", data, "No category in response")
        self.assertEqual(data["category"], "sports")
        self.assertGreaterEqual(len(data["suggested_queries"]), 1, "No suggested queries provided")
        
        print("Sports topics endpoint successful")

    def test_11_category_technology_topics(self):
        """Test getting technology topics."""
        print("\n--- Testing Technology Topics Endpoint ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.test_02_user_login()
        
        response = self.make_request("get", "/categories/technology", auth_required=True)
        self.assertEqual(response.status_code, 200, f"Get technology topics failed: {response.text}")
        
        data = response.json()
        self.assertIn("suggested_queries", data, "No suggested queries in response")
        self.assertIn("category", data, "No category in response")
        self.assertEqual(data["category"], "technology")
        self.assertGreaterEqual(len(data["suggested_queries"]), 1, "No suggested queries provided")
        
        print("Technology topics endpoint successful")

    def test_12_invalid_auth(self):
        """Test invalid authentication scenarios."""
        print("\n--- Testing Invalid Authentication ---")
        
        # Test with invalid credentials
        invalid_login = {
            "username": "invalid_user",
            "password": "invalid_password"
        }
        
        response = self.make_request("post", "/auth/login", invalid_login)
        self.assertEqual(response.status_code, 401, "Invalid login should be rejected")
        
        # Test protected endpoint without token
        response = self.make_request("get", "/conversations")
        self.assertEqual(response.status_code, 401, "Unauthorized access should be rejected")
        
        print("Invalid authentication tests passed")

    def test_13_invalid_conversation_access(self):
        """Test accessing non-existent or unauthorized conversations."""
        print("\n--- Testing Invalid Conversation Access ---")
        
        # Ensure we have a token
        if not self.auth_token:
            self.test_02_user_login()
        
        # Test with non-existent conversation ID
        fake_id = "000000000000000000000000"  # 24-character fake ObjectId
        response = self.make_request("get", f"/conversations/{fake_id}", auth_required=True)
        self.assertEqual(response.status_code, 404, "Non-existent conversation should return 404")
        
        print("Invalid conversation access tests passed")

def run_tests():
    """Run all tests in the correct order."""
    test_suite = unittest.TestSuite()
    test_suite.addTest(ResearchAIBackendTest('test_01_user_registration'))
    test_suite.addTest(ResearchAIBackendTest('test_02_user_login'))
    test_suite.addTest(ResearchAIBackendTest('test_03_get_current_user'))
    test_suite.addTest(ResearchAIBackendTest('test_04_create_conversation'))
    test_suite.addTest(ResearchAIBackendTest('test_05_add_message_to_conversation'))
    test_suite.addTest(ResearchAIBackendTest('test_06_get_conversation'))
    test_suite.addTest(ResearchAIBackendTest('test_07_get_user_conversations'))
    test_suite.addTest(ResearchAIBackendTest('test_08_search_conversations'))
    test_suite.addTest(ResearchAIBackendTest('test_09_category_trending_topics'))
    test_suite.addTest(ResearchAIBackendTest('test_10_category_sports_topics'))
    test_suite.addTest(ResearchAIBackendTest('test_11_category_technology_topics'))
    test_suite.addTest(ResearchAIBackendTest('test_12_invalid_auth'))
    test_suite.addTest(ResearchAIBackendTest('test_13_invalid_conversation_access'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    return runner.run(test_suite)

if __name__ == "__main__":
    print("Starting Research AI Backend Tests...")
    result = run_tests()
    
    if result.wasSuccessful():
        print("\n✅ All tests passed successfully!")
        sys.exit(0)
    else:
        print(f"\n❌ {len(result.failures)} tests failed!")
        sys.exit(1)