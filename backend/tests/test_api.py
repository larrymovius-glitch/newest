"""
Backend API Tests for Affiliate Pro EZ AD Creator
- Tests: Videos CRUD, Templates, Analytics, Gallery endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"


class TestHealthAndBasics:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint returns welcome message"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Affiliate Pro" in data["message"]
        print("✓ API root endpoint working")


class TestTemplatesAPI:
    """Template endpoints tests"""
    
    def test_get_templates(self):
        """Test GET /api/templates returns list of templates"""
        response = requests.get(f"{API_URL}/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 8  # Should have at least 8 default templates
        
        # Verify template structure
        template = data[0]
        assert "id" in template
        assert "name" in template
        assert "category" in template
        assert "prompt" in template
        assert "model" in template
        assert "size" in template
        assert "duration" in template
        print(f"✓ Templates endpoint returned {len(data)} templates")
    
    def test_create_custom_template(self):
        """Test POST /api/templates creates custom template"""
        test_template = {
            "name": f"TEST_Template_{uuid.uuid4().hex[:8]}",
            "category": "Custom",
            "prompt": "Test prompt for custom template",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4
        }
        
        response = requests.post(f"{API_URL}/templates", json=test_template)
        assert response.status_code == 200
        data = response.json()
        
        assert data["name"] == test_template["name"]
        assert data["category"] == test_template["category"]
        assert data["prompt"] == test_template["prompt"]
        assert data["is_custom"] == True
        assert "id" in data
        
        print(f"✓ Custom template created with id: {data['id']}")
        
        # Cleanup - delete the test template
        delete_response = requests.delete(f"{API_URL}/templates/{data['id']}")
        assert delete_response.status_code == 200
        print("✓ Custom template deleted successfully")


class TestVideosAPI:
    """Video endpoints tests"""
    
    def test_get_videos(self):
        """Test GET /api/videos returns video list"""
        response = requests.get(f"{API_URL}/videos")
        assert response.status_code == 200
        data = response.json()
        
        assert "videos" in data
        assert isinstance(data["videos"], list)
        
        # Verify video structure if videos exist
        if len(data["videos"]) > 0:
            video = data["videos"][0]
            assert "id" in video
            assert "prompt" in video
            assert "model" in video
            assert "size" in video
            assert "duration" in video
            assert "status" in video
            assert video["status"] in ["processing", "completed", "failed"]
        
        print(f"✓ Videos endpoint returned {len(data['videos'])} videos")
    
    def test_generate_video(self):
        """Test POST /api/videos/generate creates video job"""
        video_request = {
            "prompt": f"TEST video generation {uuid.uuid4().hex[:8]}",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4
        }
        
        response = requests.post(f"{API_URL}/videos/generate", json=video_request)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["prompt"] == video_request["prompt"]
        assert data["model"] == video_request["model"]
        assert data["size"] == video_request["size"]
        assert data["duration"] == video_request["duration"]
        assert data["status"] == "processing"
        
        video_id = data["id"]
        print(f"✓ Video generation started with id: {video_id}")
        
        # Verify video status can be retrieved
        status_response = requests.get(f"{API_URL}/videos/{video_id}")
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert status_data["id"] == video_id
        print(f"✓ Video status retrieved: {status_data['status']}")
        
        # Cleanup - delete test video
        delete_response = requests.delete(f"{API_URL}/videos/{video_id}")
        assert delete_response.status_code == 200
        print("✓ Test video deleted successfully")
    
    def test_get_video_not_found(self):
        """Test GET /api/videos/{id} returns 404 for non-existent video"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{API_URL}/videos/{fake_id}")
        assert response.status_code == 404
        print("✓ Non-existent video returns 404")


class TestGalleryAPI:
    """Gallery endpoints tests"""
    
    def test_get_gallery(self):
        """Test GET /api/gallery returns shared videos"""
        response = requests.get(f"{API_URL}/gallery")
        assert response.status_code == 200
        data = response.json()
        
        assert "videos" in data
        assert isinstance(data["videos"], list)
        
        # All videos in gallery should be shared and completed
        for video in data["videos"]:
            assert video.get("shared") == True
            assert video.get("status") == "completed"
        
        print(f"✓ Gallery endpoint returned {len(data['videos'])} shared videos")


class TestAnalyticsAPI:
    """Analytics endpoints tests"""
    
    def test_get_analytics_overview(self):
        """Test GET /api/analytics/overview returns stats"""
        response = requests.get(f"{API_URL}/analytics/overview")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields
        assert "total_videos" in data
        assert "completed_videos" in data
        assert "shared_videos" in data
        assert "total_views" in data
        assert "total_likes" in data
        assert "total_shares" in data
        assert "avg_engagement" in data
        
        # Verify data types
        assert isinstance(data["total_videos"], int)
        assert isinstance(data["total_views"], int)
        assert isinstance(data["avg_engagement"], float)
        
        print(f"✓ Analytics overview: {data['total_videos']} videos, {data['total_views']} views")


class TestBatchGeneration:
    """Batch video generation tests"""
    
    def test_batch_generate_videos(self):
        """Test POST /api/videos/batch-generate creates multiple videos"""
        batch_request = {
            "videos": [
                {
                    "prompt": f"TEST batch video 1 {uuid.uuid4().hex[:8]}",
                    "model": "sora-2",
                    "size": "1280x720",
                    "duration": 4
                },
                {
                    "prompt": f"TEST batch video 2 {uuid.uuid4().hex[:8]}",
                    "model": "sora-2",
                    "size": "1024x1024",
                    "duration": 4
                }
            ]
        }
        
        response = requests.post(f"{API_URL}/videos/batch-generate", json=batch_request)
        assert response.status_code == 200
        data = response.json()
        
        assert "video_ids" in data
        assert len(data["video_ids"]) == 2
        assert "message" in data
        
        print(f"✓ Batch generation started for {len(data['video_ids'])} videos")
        
        # Cleanup - delete test videos
        for video_id in data["video_ids"]:
            requests.delete(f"{API_URL}/videos/{video_id}")
        print("✓ Test batch videos deleted")


class TestVideoSharing:
    """Video sharing functionality tests"""
    
    def test_share_completed_video(self):
        """Test sharing a completed video to gallery"""
        # First, get a completed video if exists
        response = requests.get(f"{API_URL}/videos")
        videos = response.json().get("videos", [])
        
        completed_videos = [v for v in videos if v["status"] == "completed"]
        
        if not completed_videos:
            pytest.skip("No completed videos available for share test")
        
        video = completed_videos[0]
        video_id = video["id"]
        original_shared = video.get("shared", False)
        
        # Toggle share status
        share_request = {"video_id": video_id, "share_to_gallery": not original_shared}
        share_response = requests.post(f"{API_URL}/videos/{video_id}/share", json=share_request)
        assert share_response.status_code == 200
        
        # Verify status changed
        check_response = requests.get(f"{API_URL}/videos/{video_id}")
        assert check_response.json()["shared"] == (not original_shared)
        
        print(f"✓ Video share status toggled to: {not original_shared}")
        
        # Restore original state
        restore_request = {"video_id": video_id, "share_to_gallery": original_shared}
        requests.post(f"{API_URL}/videos/{video_id}/share", json=restore_request)
        print("✓ Video share status restored")


class TestLikeVideo:
    """Video like functionality tests"""
    
    def test_like_video(self):
        """Test liking a video increments like count"""
        # Get a video
        response = requests.get(f"{API_URL}/videos")
        videos = response.json().get("videos", [])
        
        if not videos:
            pytest.skip("No videos available for like test")
        
        video_id = videos[0]["id"]
        original_likes = videos[0].get("likes", 0)
        
        # Like the video
        like_response = requests.post(f"{API_URL}/videos/{video_id}/like")
        assert like_response.status_code == 200
        
        data = like_response.json()
        assert "likes" in data
        assert data["likes"] == original_likes + 1
        
        print(f"✓ Video liked successfully. Total likes: {data['likes']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
