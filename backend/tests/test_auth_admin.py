"""
Test Auth, Plans, and Admin API Endpoints
Covers: registration, login, JWT auth, plans, and admin user/revenue management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "admin123"
TEST_USER_PREFIX = "TEST_AUTH_"


class TestHealthAndPlans:
    """Test basic API health and public plans endpoint"""
    
    def test_api_root(self):
        """API root should return message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("PASS: API root endpoint working")
    
    def test_get_plans(self):
        """GET /api/plans should return 3 plans with correct prices"""
        response = requests.get(f"{BASE_URL}/api/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        assert len(plans) == 3
        
        # Check plan details
        plan_ids = [p["id"] for p in plans]
        assert "free" in plan_ids
        assert "pro" in plan_ids
        assert "lifetime" in plan_ids
        
        # Check prices
        for plan in plans:
            if plan["id"] == "free":
                assert plan["price"] == 0
                assert plan["period"] == ""
            elif plan["id"] == "pro":
                assert plan["price"] == 9.99
                assert plan["period"] == "/month"
            elif plan["id"] == "lifetime":
                assert plan["price"] == 19.99
                assert plan["period"] == "one-time"
        
        print("PASS: /api/plans returns 3 plans with correct prices")


class TestAuthRegistration:
    """Test user registration flow"""
    
    def test_register_new_user(self):
        """POST /api/auth/register should create a new user"""
        unique_email = f"{TEST_USER_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check token
        assert "token" in data
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        
        # Check user data
        assert "user" in data
        user = data["user"]
        assert user["email"] == unique_email.lower()
        assert user["name"] == "Test User"
        assert user["plan"] == "free"
        assert user["is_admin"] == False
        assert "id" in user
        
        print(f"PASS: Registered new user: {unique_email}")
        
        # Store for cleanup
        return {"token": data["token"], "user_id": user["id"], "email": unique_email}
    
    def test_register_duplicate_email_fails(self):
        """POST /api/auth/register with existing email should fail"""
        # First register
        unique_email = f"{TEST_USER_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User"
        })
        
        # Try to register again with same email
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass456",
            "name": "Another User"
        })
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print("PASS: Duplicate email registration correctly rejected")


class TestAuthLogin:
    """Test user login flow"""
    
    def test_login_admin_user(self):
        """POST /api/auth/login with admin credentials should return JWT token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check token
        assert "token" in data
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        
        # Check user data
        assert "user" in data
        user = data["user"]
        assert user["email"] == ADMIN_EMAIL
        assert user["is_admin"] == True
        
        print("PASS: Admin login successful with JWT token")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with wrong password should fail with 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("PASS: Invalid login correctly rejected with 401")
    
    def test_login_nonexistent_user(self):
        """POST /api/auth/login with non-existent email should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "anypassword"
        })
        
        assert response.status_code == 401
        print("PASS: Non-existent user login rejected with 401")


class TestAuthMe:
    """Test /api/auth/me endpoint"""
    
    def test_get_me_with_valid_token(self):
        """GET /api/auth/me with valid token should return user data"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert "plan" in data
        assert "is_admin" in data
        print("PASS: GET /api/auth/me returns correct user data")
    
    def test_get_me_without_token(self):
        """GET /api/auth/me without token should fail with 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("PASS: GET /api/auth/me without token returns 401")
    
    def test_get_me_with_invalid_token(self):
        """GET /api/auth/me with invalid token should fail"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": "Bearer invalidtoken123"
        })
        assert response.status_code == 401
        print("PASS: GET /api/auth/me with invalid token returns 401")


class TestAdminUsers:
    """Test admin user management endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_admin_get_users(self, admin_token):
        """GET /api/admin/users with admin token should return users list"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)
        print(f"PASS: GET /api/admin/users returns {data['total']} users")
    
    def test_admin_get_users_without_admin(self):
        """GET /api/admin/users without admin should fail with 403"""
        # Register a non-admin user
        unique_email = f"{TEST_USER_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Non Admin"
        })
        token = register_response.json()["token"]
        
        # Try to access admin endpoint
        response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {token}"
        })
        
        assert response.status_code == 403
        print("PASS: Non-admin user correctly blocked from admin endpoint")
    
    def test_admin_change_user_plan(self, admin_token):
        """PUT /api/admin/users/{id}/plan should update user plan"""
        # First create a test user
        unique_email = f"{TEST_USER_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Plan Test User"
        })
        user_id = register_response.json()["user"]["id"]
        
        # Change plan to pro
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}/plan?plan=pro",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Verify the change
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        users = users_response.json()["users"]
        user = next((u for u in users if u["id"] == user_id), None)
        assert user is not None
        assert user["plan"] == "pro"
        
        print("PASS: Admin can change user plan to pro")
    
    def test_admin_toggle_admin_status(self, admin_token):
        """PUT /api/admin/users/{id}/toggle-admin should toggle admin status"""
        # Create a test user
        unique_email = f"{TEST_USER_PREFIX}{uuid.uuid4().hex[:8]}@test.com"
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Admin Toggle User"
        })
        user_id = register_response.json()["user"]["id"]
        
        # Toggle admin on
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}/toggle-admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        
        # Verify
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        users = users_response.json()["users"]
        user = next((u for u in users if u["id"] == user_id), None)
        assert user["is_admin"] == True
        
        # Toggle admin off
        response = requests.put(
            f"{BASE_URL}/api/admin/users/{user_id}/toggle-admin",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        
        # Verify again
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        users = users_response.json()["users"]
        user = next((u for u in users if u["id"] == user_id), None)
        assert user["is_admin"] == False
        
        print("PASS: Admin toggle works correctly")


class TestAdminRevenue:
    """Test admin revenue endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_admin_get_revenue(self, admin_token):
        """GET /api/admin/revenue with admin token should return revenue data"""
        response = requests.get(f"{BASE_URL}/api/admin/revenue", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "total_revenue" in data
        assert "total_users" in data
        assert "plan_distribution" in data
        assert isinstance(data["total_revenue"], (int, float))
        assert isinstance(data["total_users"], int)
        assert "free" in data["plan_distribution"]
        assert "pro" in data["plan_distribution"]
        assert "lifetime" in data["plan_distribution"]
        
        print(f"PASS: GET /api/admin/revenue returns data: ${data['total_revenue']} revenue, {data['total_users']} users")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_users(self):
        """Clean up all TEST_AUTH_ prefixed users"""
        # Get admin token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        admin_token = login_response.json()["token"]
        
        # Get all users
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        users = users_response.json()["users"]
        
        # Delete test users
        deleted_count = 0
        for user in users:
            if user["email"].startswith(TEST_USER_PREFIX.lower()):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/admin/users/{user['id']}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"CLEANUP: Deleted {deleted_count} test users")
        assert True  # Always pass cleanup
