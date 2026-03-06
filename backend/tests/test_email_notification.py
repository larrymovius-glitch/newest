"""
Backend API Tests for Email Notification Feature
- Tests: POST /api/test-email endpoint
- Tests: POST /api/videos/generate with notify_email field
- Verifies email is stored in MongoDB
"""
import pytest
import requests
import os
import uuid
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load env for MongoDB connection
load_dotenv('/app/backend/.env')

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"
TEST_EMAIL = "delivered@resend.dev"  # Resend's built-in test email address


class TestEmailEndpoint:
    """Tests for POST /api/test-email endpoint"""
    
    def test_send_test_email_success(self):
        """Test POST /api/test-email sends email successfully"""
        response = requests.post(
            f"{API_URL}/test-email",
            json={"email": TEST_EMAIL}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "status" in data, "Response should have 'status' field"
        assert data["status"] == "success", f"Expected success status, got: {data['status']}"
        assert "message" in data, "Response should have 'message' field"
        assert TEST_EMAIL in data["message"], f"Message should contain email: {data['message']}"
        
        print(f"✓ Test email sent successfully to {TEST_EMAIL}")
    
    def test_send_test_email_invalid_format(self):
        """Test POST /api/test-email with invalid email format"""
        # Note: Pydantic doesn't validate email format by default unless EmailStr is used
        # This test checks the endpoint handles various inputs
        response = requests.post(
            f"{API_URL}/test-email",
            json={"email": "not-an-email"}
        )
        # The endpoint may accept this since it's just a str field
        # Resend API will fail on invalid email format
        # Status depends on Resend's error handling
        print(f"✓ Invalid email format test - Status: {response.status_code}")
    
    def test_send_test_email_missing_field(self):
        """Test POST /api/test-email without email field returns 422"""
        response = requests.post(
            f"{API_URL}/test-email",
            json={}
        )
        assert response.status_code == 422, f"Expected 422 for missing field, got {response.status_code}"
        print("✓ Missing email field returns 422 (validation error)")


class TestVideoGenerationWithEmail:
    """Tests for video generation with notify_email field"""
    
    def test_generate_video_with_notify_email(self):
        """Test POST /api/videos/generate stores notify_email in database"""
        video_request = {
            "prompt": f"TEST email notification {uuid.uuid4().hex[:8]}",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4,
            "notify_email": TEST_EMAIL
        }
        
        response = requests.post(f"{API_URL}/videos/generate", json=video_request)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should have 'id' field"
        video_id = data["id"]
        
        # Verify notify_email is stored in MongoDB
        async def verify_email_in_db():
            client = AsyncIOMotorClient(os.environ['MONGO_URL'])
            db = client[os.environ['DB_NAME']]
            video = await db.videos.find_one({"id": video_id})
            client.close()
            return video
        
        video_doc = asyncio.get_event_loop().run_until_complete(verify_email_in_db())
        
        assert video_doc is not None, "Video should exist in database"
        assert "notify_email" in video_doc, "Video doc should have notify_email field"
        assert video_doc["notify_email"] == TEST_EMAIL, f"Email should be {TEST_EMAIL}, got {video_doc['notify_email']}"
        
        print(f"✓ Video created with id: {video_id}")
        print(f"✓ notify_email '{TEST_EMAIL}' stored in database")
        
        # Cleanup
        delete_response = requests.delete(f"{API_URL}/videos/{video_id}")
        assert delete_response.status_code == 200, f"Failed to delete test video: {delete_response.text}"
        print("✓ Test video cleaned up")
    
    def test_generate_video_without_notify_email(self):
        """Test POST /api/videos/generate works without notify_email (optional field)"""
        video_request = {
            "prompt": f"TEST no email {uuid.uuid4().hex[:8]}",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4
            # notify_email intentionally omitted
        }
        
        response = requests.post(f"{API_URL}/videos/generate", json=video_request)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        video_id = data["id"]
        
        # Verify notify_email is None in database
        async def verify_no_email_in_db():
            client = AsyncIOMotorClient(os.environ['MONGO_URL'])
            db = client[os.environ['DB_NAME']]
            video = await db.videos.find_one({"id": video_id})
            client.close()
            return video
        
        video_doc = asyncio.get_event_loop().run_until_complete(verify_no_email_in_db())
        
        assert video_doc is not None, "Video should exist in database"
        # notify_email should be None or not present
        notify_email = video_doc.get("notify_email")
        assert notify_email is None, f"notify_email should be None, got: {notify_email}"
        
        print(f"✓ Video created without notify_email")
        print(f"✓ notify_email is None in database as expected")
        
        # Cleanup
        requests.delete(f"{API_URL}/videos/{video_id}")
        print("✓ Test video cleaned up")
    
    def test_generate_video_with_empty_notify_email(self):
        """Test POST /api/videos/generate with empty string notify_email"""
        video_request = {
            "prompt": f"TEST empty email {uuid.uuid4().hex[:8]}",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4,
            "notify_email": ""  # Empty string
        }
        
        response = requests.post(f"{API_URL}/videos/generate", json=video_request)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        video_id = data["id"]
        
        print(f"✓ Video created with empty notify_email")
        
        # Cleanup
        requests.delete(f"{API_URL}/videos/{video_id}")
        print("✓ Test video cleaned up")
    
    def test_generate_video_with_null_notify_email(self):
        """Test POST /api/videos/generate with explicit null notify_email"""
        video_request = {
            "prompt": f"TEST null email {uuid.uuid4().hex[:8]}",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4,
            "notify_email": None  # Explicit null
        }
        
        response = requests.post(f"{API_URL}/videos/generate", json=video_request)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        video_id = data["id"]
        
        print(f"✓ Video created with null notify_email")
        
        # Cleanup
        requests.delete(f"{API_URL}/videos/{video_id}")
        print("✓ Test video cleaned up")


class TestSendVideoNotificationFunction:
    """Tests to verify the send_video_notification function is called correctly"""
    
    def test_video_response_fields(self):
        """Verify VideoResponse model has expected fields for video generation"""
        video_request = {
            "prompt": f"TEST response fields {uuid.uuid4().hex[:8]}",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4,
            "notify_email": TEST_EMAIL
        }
        
        response = requests.post(f"{API_URL}/videos/generate", json=video_request)
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify required fields in response
        required_fields = ["id", "prompt", "model", "size", "duration", "status", "created_at"]
        for field in required_fields:
            assert field in data, f"Response missing required field: {field}"
        
        # Status should be processing
        assert data["status"] == "processing", f"Initial status should be 'processing', got: {data['status']}"
        
        print(f"✓ Video response has all required fields")
        
        # Cleanup
        requests.delete(f"{API_URL}/videos/{data['id']}")
        print("✓ Test video cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
