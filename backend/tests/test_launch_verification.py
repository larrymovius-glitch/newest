"""
Final Launch Verification Tests - All core features and endpoints
Tests: Auth, Plans, Products, Integration, Admin, Videos endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"test_launch_{uuid.uuid4().hex[:8]}@example.com"
TEST_PASSWORD = "TestPass123"
TEST_NAME = "Test Launch User"

ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"


class TestHealthAndBasicEndpoints:
    """Basic health and root endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root responds: {data}")
    
    def test_plans_endpoint(self):
        """Test public plans endpoint for pricing page"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        assert len(plans) == 3
        plan_ids = [p["id"] for p in plans]
        assert "free" in plan_ids
        assert "pro" in plan_ids
        assert "lifetime" in plan_ids
        print(f"✓ Plans endpoint returns {len(plans)} plans: {plan_ids}")
    
    def test_templates_endpoint(self):
        """Test templates endpoint"""
        response = requests.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Templates endpoint returns {len(data)} templates")
    
    def test_videos_list_endpoint(self):
        """Test videos list endpoint"""
        response = requests.get(f"{BASE_URL}/api/videos")
        assert response.status_code == 200
        data = response.json()
        assert "videos" in data
        print(f"✓ Videos list returns {len(data['videos'])} videos")
    
    def test_gallery_endpoint(self):
        """Test community gallery endpoint"""
        response = requests.get(f"{BASE_URL}/api/gallery")
        assert response.status_code == 200
        data = response.json()
        assert "videos" in data
        print(f"✓ Gallery endpoint returns {len(data['videos'])} shared videos")
    
    def test_analytics_overview(self):
        """Test analytics overview endpoint"""
        response = requests.get(f"{BASE_URL}/api/analytics/overview")
        assert response.status_code == 200
        data = response.json()
        assert "total_videos" in data
        assert "completed_videos" in data
        print(f"✓ Analytics overview: {data['total_videos']} videos, {data['completed_videos']} completed")


class TestUserRegistration:
    """User registration flow tests"""
    
    def test_register_new_user(self):
        """Register a new user"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL.lower()
        assert data["user"]["plan"] == "free"
        print(f"✓ User registered: {data['user']['email']}")
        return data["token"]
    
    def test_register_duplicate_email(self):
        """Attempt to register with existing email"""
        # First register
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"dup_{TEST_EMAIL}",
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        # Try duplicate
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"dup_{TEST_EMAIL}",
            "password": TEST_PASSWORD,
            "name": TEST_NAME
        })
        assert response.status_code == 400
        print("✓ Duplicate email rejected correctly")


class TestUserLogin:
    """User login tests"""
    
    @pytest.fixture
    def registered_user(self):
        """Create a user for login tests"""
        email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "name": "Login Test"
        })
        return email
    
    def test_login_success(self, registered_user):
        """Login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": registered_user,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == registered_user.lower()
        print(f"✓ Login successful for {registered_user}")
    
    def test_login_invalid_password(self, registered_user):
        """Login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": registered_user,
            "password": "wrong_password"
        })
        assert response.status_code == 401
        print("✓ Invalid password rejected correctly")
    
    def test_login_nonexistent_user(self):
        """Login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": TEST_PASSWORD
        })
        assert response.status_code == 401
        print("✓ Non-existent user rejected correctly")


class TestAuthenticatedEndpoints:
    """Tests for endpoints requiring authentication"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for testing"""
        email = f"auth_test_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "name": "Auth Test"
        })
        return response.json()["token"]
    
    def test_get_me_authenticated(self, auth_token):
        """Get current user with valid token"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "plan" in data
        print(f"✓ /auth/me works: {data['email']} ({data['plan']})")
    
    def test_get_me_no_token(self):
        """Get current user without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me requires authentication")
    
    def test_get_me_invalid_token(self):
        """Get current user with invalid token"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": "Bearer invalid_token"
        })
        assert response.status_code == 401
        print("✓ Invalid token rejected")


class TestProductsCRUD:
    """Product catalog CRUD tests"""
    
    def test_list_products(self):
        """List products (public)"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Products list: {len(data['products'])} products")
    
    def test_create_product(self):
        """Create a new product"""
        product_name = f"TEST_Product_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/products", json={
            "name": product_name,
            "description": "Test product for launch verification",
            "affiliate_link": "https://example.com/product",
            "price": 29.99,
            "category": "Tech & Software"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == product_name
        assert data["price"] == 29.99
        print(f"✓ Product created: {data['id']}")
        return data["id"]
    
    def test_get_product(self):
        """Create and retrieve a product"""
        # Create first
        product_id = self.test_create_product()
        
        # Then get
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product_id
        print(f"✓ Product retrieved: {product_id}")
    
    def test_update_product(self):
        """Create and update a product"""
        # Create first
        product_id = self.test_create_product()
        
        # Update
        response = requests.put(f"{BASE_URL}/api/products/{product_id}", json={
            "name": "Updated Product Name",
            "price": 39.99
        })
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Product Name"
        assert data["price"] == 39.99
        print(f"✓ Product updated: {product_id}")
    
    def test_publish_unpublish_product(self):
        """Publish and unpublish a product"""
        # Create first
        product_id = self.test_create_product()
        
        # Publish
        response = requests.post(f"{BASE_URL}/api/products/{product_id}/publish")
        assert response.status_code == 200
        print(f"✓ Product published: {product_id}")
        
        # Unpublish
        response = requests.post(f"{BASE_URL}/api/products/{product_id}/unpublish")
        assert response.status_code == 200
        print(f"✓ Product unpublished: {product_id}")
    
    def test_delete_product(self):
        """Create and delete a product"""
        # Create first
        product_id = self.test_create_product()
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        print(f"✓ Product deleted: {product_id}")


class TestStoreFeed:
    """Store feed endpoints for external apps"""
    
    def test_store_feed_public(self):
        """Test public store feed endpoint"""
        response = requests.get(f"{BASE_URL}/api/store/feed")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "count" in data
        print(f"✓ Store feed: {data['count']} published products")


class TestIntegrationKeys:
    """Integration API key management tests"""
    
    def test_create_integration_key(self):
        """Create an API integration key"""
        response = requests.post(f"{BASE_URL}/api/integration/keys", json={
            "app_name": f"TEST_App_{uuid.uuid4().hex[:8]}",
            "permissions": ["read_products", "read_videos"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "api_key" in data
        assert data["api_key"].startswith("ezad-")
        print(f"✓ Integration key created: {data['id']}")
        return data
    
    def test_list_integration_keys(self):
        """List integration keys"""
        response = requests.get(f"{BASE_URL}/api/integration/keys")
        assert response.status_code == 200
        data = response.json()
        assert "keys" in data
        print(f"✓ Integration keys list: {len(data['keys'])} keys")
    
    def test_revoke_integration_key(self):
        """Create and revoke an integration key"""
        # Create first
        key_data = self.test_create_integration_key()
        key_id = key_data["id"]
        
        # Revoke
        response = requests.delete(f"{BASE_URL}/api/integration/keys/{key_id}")
        assert response.status_code == 200
        print(f"✓ Integration key revoked: {key_id}")


class TestExternalAPIs:
    """External API endpoints (secured with API key)"""
    
    @pytest.fixture
    def api_key(self):
        """Create an API key for testing"""
        response = requests.post(f"{BASE_URL}/api/integration/keys", json={
            "app_name": "External API Test",
            "permissions": ["read_products", "read_videos"]
        })
        return response.json()["api_key"]
    
    def test_external_products_without_key(self):
        """External products without API key"""
        response = requests.get(f"{BASE_URL}/api/external/products")
        assert response.status_code == 401
        print("✓ External products requires API key")
    
    def test_external_products_with_key(self, api_key):
        """External products with valid API key"""
        response = requests.get(f"{BASE_URL}/api/external/products", headers={
            "X-API-Key": api_key
        })
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ External products with key: {len(data['products'])} products")
    
    def test_external_videos_with_key(self, api_key):
        """External videos with valid API key"""
        response = requests.get(f"{BASE_URL}/api/external/videos", headers={
            "X-API-Key": api_key
        })
        assert response.status_code == 200
        data = response.json()
        assert "videos" in data
        print(f"✓ External videos with key: {len(data['videos'])} videos")


class TestAdminEndpoints:
    """Admin dashboard endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin account not available")
        return response.json()["token"]
    
    def test_admin_users_list(self, admin_token):
        """Admin list all users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        print(f"✓ Admin users list: {data['total']} users")
    
    def test_admin_revenue(self, admin_token):
        """Admin revenue stats"""
        response = requests.get(f"{BASE_URL}/api/admin/revenue", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "total_revenue" in data
        assert "plan_distribution" in data
        print(f"✓ Admin revenue: ${data['total_revenue']}, {data['total_users']} users")
    
    def test_admin_access_denied_for_regular_user(self):
        """Regular user cannot access admin endpoints"""
        # Register regular user
        email = f"regular_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_PASSWORD,
            "name": "Regular User"
        })
        token = response.json()["token"]
        
        # Try admin endpoint
        response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 403
        print("✓ Admin endpoints protected from regular users")


class TestVideoGeneration:
    """Video generation endpoints (without actual generation)"""
    
    def test_video_generate_endpoint_exists(self):
        """Verify video generation endpoint exists"""
        # Just verify endpoint responds (don't actually generate)
        response = requests.post(f"{BASE_URL}/api/videos/generate", json={
            "prompt": "Test video prompt",
            "model": "sora-2",
            "size": "1280x720",
            "duration": 4
        })
        # Either 200 (started) or some auth/validation error
        assert response.status_code in [200, 401, 403, 422]
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "status" in data
            print(f"✓ Video generation endpoint works: {data['id']}")
        else:
            print(f"✓ Video generation endpoint responds: {response.status_code}")


# Cleanup function - run at end of tests
def test_cleanup_test_data():
    """Cleanup any test-created data"""
    # List and delete test products
    response = requests.get(f"{BASE_URL}/api/products")
    if response.status_code == 200:
        products = response.json().get("products", [])
        for p in products:
            if p.get("name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/products/{p['id']}")
                print(f"Cleaned up product: {p['name']}")
    
    # List and delete test integration keys
    response = requests.get(f"{BASE_URL}/api/integration/keys")
    if response.status_code == 200:
        keys = response.json().get("keys", [])
        for k in keys:
            if k.get("app_name", "").startswith("TEST_"):
                requests.delete(f"{BASE_URL}/api/integration/keys/{k['id']}")
                print(f"Cleaned up key: {k['app_name']}")
    
    print("✓ Test data cleanup complete")
