"""
Backend API Tests for NEW Integration Features
- Tests: Products CRUD, Integration Keys, Store Feed, External APIs with API Key Auth
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"


class TestProductsCRUD:
    """Product catalog CRUD operations tests"""
    
    def test_get_products_list(self):
        """Test GET /api/products returns products list"""
        response = requests.get(f"{API_URL}/products")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert isinstance(data["products"], list)
        
        # Verify product structure if products exist
        if len(data["products"]) > 0:
            product = data["products"][0]
            assert "id" in product
            assert "name" in product
            assert "affiliate_link" in product
            assert "price" in product
            assert "status" in product
            assert "store_listed" in product
        
        print(f"✓ GET /api/products returned {len(data['products'])} products")
    
    def test_create_product(self):
        """Test POST /api/products creates a product"""
        test_product = {
            "name": f"TEST_Product_{uuid.uuid4().hex[:8]}",
            "description": "Test product description",
            "affiliate_link": "https://example.com/affiliate/test",
            "price": 29.99,
            "category": "Tech & Software",
            "image_url": "https://example.com/image.jpg"
        }
        
        response = requests.post(f"{API_URL}/products", json=test_product)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == test_product["name"]
        assert data["affiliate_link"] == test_product["affiliate_link"]
        assert data["price"] == test_product["price"]
        assert data["category"] == test_product["category"]
        assert data["status"] == "draft"
        assert data["store_listed"] == False
        
        print(f"✓ POST /api/products created product with id: {data['id']}")
        
        # Verify GET returns the created product
        get_response = requests.get(f"{API_URL}/products/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == test_product["name"]
        print(f"✓ GET /api/products/{data['id']} - Product persisted correctly")
        
        # Cleanup
        delete_response = requests.delete(f"{API_URL}/products/{data['id']}")
        assert delete_response.status_code == 200
        print("✓ DELETE /api/products/{id} - Product deleted")
    
    def test_update_product(self):
        """Test PUT /api/products/{id} updates a product"""
        # Create product first
        create_response = requests.post(f"{API_URL}/products", json={
            "name": f"TEST_UpdateProduct_{uuid.uuid4().hex[:8]}",
            "description": "Original description",
            "affiliate_link": "https://example.com/original",
            "price": 19.99,
            "category": "General"
        })
        assert create_response.status_code == 200
        product_id = create_response.json()["id"]
        
        # Update product
        update_data = {
            "name": "TEST_Updated_Name",
            "price": 39.99,
            "description": "Updated description"
        }
        update_response = requests.put(f"{API_URL}/products/{product_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        
        assert updated["name"] == update_data["name"]
        assert updated["price"] == update_data["price"]
        assert updated["description"] == update_data["description"]
        
        print(f"✓ PUT /api/products/{product_id} - Product updated successfully")
        
        # Verify with GET
        get_response = requests.get(f"{API_URL}/products/{product_id}")
        assert get_response.json()["price"] == 39.99
        print("✓ GET verified update persisted")
        
        # Cleanup
        requests.delete(f"{API_URL}/products/{product_id}")
    
    def test_delete_product(self):
        """Test DELETE /api/products/{id} removes a product"""
        # Create product first
        create_response = requests.post(f"{API_URL}/products", json={
            "name": f"TEST_DeleteProduct_{uuid.uuid4().hex[:8]}",
            "description": "To be deleted",
            "affiliate_link": "https://example.com/delete-me",
            "price": 9.99,
            "category": "General"
        })
        product_id = create_response.json()["id"]
        
        # Delete product
        delete_response = requests.delete(f"{API_URL}/products/{product_id}")
        assert delete_response.status_code == 200
        
        # Verify 404 on GET
        get_response = requests.get(f"{API_URL}/products/{product_id}")
        assert get_response.status_code == 404
        
        print(f"✓ DELETE /api/products/{product_id} - Product deleted and verified 404")


class TestProductPublishWorkflow:
    """Publish/unpublish product to store tests"""
    
    def test_publish_product_to_store(self):
        """Test POST /api/products/{id}/publish publishes product"""
        # Create product
        create_response = requests.post(f"{API_URL}/products", json={
            "name": f"TEST_PublishProduct_{uuid.uuid4().hex[:8]}",
            "description": "Test product for publishing",
            "affiliate_link": "https://example.com/publish-test",
            "price": 49.99,
            "category": "Health & Wellness"
        })
        product_id = create_response.json()["id"]
        
        # Initially should be draft and not listed
        initial = requests.get(f"{API_URL}/products/{product_id}").json()
        assert initial["status"] == "draft"
        assert initial["store_listed"] == False
        
        # Publish product
        publish_response = requests.post(f"{API_URL}/products/{product_id}/publish")
        assert publish_response.status_code == 200
        
        # Verify published
        published = requests.get(f"{API_URL}/products/{product_id}").json()
        assert published["status"] == "active"
        assert published["store_listed"] == True
        
        print(f"✓ POST /api/products/{product_id}/publish - Product published to store")
        
        # Verify it appears in store feed
        store_feed = requests.get(f"{API_URL}/store/feed").json()
        product_ids = [p["id"] for p in store_feed["products"]]
        assert product_id in product_ids
        print("✓ Published product appears in /api/store/feed")
        
        # Cleanup
        requests.delete(f"{API_URL}/products/{product_id}")
    
    def test_unpublish_product(self):
        """Test POST /api/products/{id}/unpublish removes from store"""
        # Create and publish product
        create_response = requests.post(f"{API_URL}/products", json={
            "name": f"TEST_UnpublishProduct_{uuid.uuid4().hex[:8]}",
            "description": "Test product for unpublishing",
            "affiliate_link": "https://example.com/unpublish-test",
            "price": 29.99,
            "category": "General"
        })
        product_id = create_response.json()["id"]
        requests.post(f"{API_URL}/products/{product_id}/publish")
        
        # Unpublish
        unpublish_response = requests.post(f"{API_URL}/products/{product_id}/unpublish")
        assert unpublish_response.status_code == 200
        
        # Verify unlisted
        product = requests.get(f"{API_URL}/products/{product_id}").json()
        assert product["store_listed"] == False
        
        print(f"✓ POST /api/products/{product_id}/unpublish - Product removed from store")
        
        # Cleanup
        requests.delete(f"{API_URL}/products/{product_id}")


class TestLinkVideoToProduct:
    """Link video to product tests"""
    
    def test_link_video_to_product(self):
        """Test POST /api/products/{id}/link-video links a video"""
        # Create product
        create_response = requests.post(f"{API_URL}/products", json={
            "name": f"TEST_LinkVideoProduct_{uuid.uuid4().hex[:8]}",
            "description": "Test product for video linking",
            "affiliate_link": "https://example.com/link-video-test",
            "price": 19.99,
            "category": "General"
        })
        product_id = create_response.json()["id"]
        
        # Get a video to link
        videos_response = requests.get(f"{API_URL}/videos")
        videos = videos_response.json().get("videos", [])
        
        if not videos:
            pytest.skip("No videos available for link test")
        
        video_id = videos[0]["id"]
        
        # Link video
        link_response = requests.post(f"{API_URL}/products/{product_id}/link-video?video_id={video_id}")
        assert link_response.status_code == 200
        
        # Verify linked
        product = requests.get(f"{API_URL}/products/{product_id}").json()
        assert video_id in product.get("promo_video_ids", [])
        
        print(f"✓ POST /api/products/{product_id}/link-video - Video {video_id} linked")
        
        # Cleanup
        requests.delete(f"{API_URL}/products/{product_id}")


class TestIntegrationKeys:
    """Integration API key management tests"""
    
    def test_list_integration_keys(self):
        """Test GET /api/integration/keys returns keys list"""
        response = requests.get(f"{API_URL}/integration/keys")
        assert response.status_code == 200
        data = response.json()
        
        assert "keys" in data
        assert isinstance(data["keys"], list)
        
        # Verify key structure if keys exist
        if len(data["keys"]) > 0:
            key = data["keys"][0]
            assert "id" in key
            assert "app_name" in key
            assert "api_key" in key
            assert "permissions" in key
            assert key["api_key"].startswith("ezad-")
        
        print(f"✓ GET /api/integration/keys returned {len(data['keys'])} keys")
    
    def test_create_integration_key(self):
        """Test POST /api/integration/keys creates an API key"""
        key_request = {
            "app_name": f"TEST_App_{uuid.uuid4().hex[:8]}",
            "permissions": ["read_products", "write_products", "read_videos"]
        }
        
        response = requests.post(f"{API_URL}/integration/keys", json=key_request)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["app_name"] == key_request["app_name"]
        assert data["api_key"].startswith("ezad-")
        assert set(data["permissions"]) == set(key_request["permissions"])
        
        print(f"✓ POST /api/integration/keys - Key created: {data['api_key'][:20]}...")
        
        # Cleanup
        delete_response = requests.delete(f"{API_URL}/integration/keys/{data['id']}")
        assert delete_response.status_code == 200
        print("✓ DELETE /api/integration/keys/{id} - Key revoked")
    
    def test_revoke_integration_key(self):
        """Test DELETE /api/integration/keys/{id} revokes key"""
        # Create key first
        create_response = requests.post(f"{API_URL}/integration/keys", json={
            "app_name": f"TEST_RevokeApp_{uuid.uuid4().hex[:8]}",
            "permissions": ["read_products"]
        })
        key_id = create_response.json()["id"]
        
        # Revoke key
        revoke_response = requests.delete(f"{API_URL}/integration/keys/{key_id}")
        assert revoke_response.status_code == 200
        
        # Verify key is gone from list
        keys_response = requests.get(f"{API_URL}/integration/keys")
        key_ids = [k["id"] for k in keys_response.json()["keys"]]
        assert key_id not in key_ids
        
        print(f"✓ DELETE /api/integration/keys/{key_id} - Key revoked and verified removed")


class TestStoreFeed:
    """Store feed public endpoint tests"""
    
    def test_get_store_feed(self):
        """Test GET /api/store/feed returns published products"""
        response = requests.get(f"{API_URL}/store/feed")
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert "count" in data
        assert isinstance(data["products"], list)
        assert data["count"] == len(data["products"])
        
        # All products in feed should be store_listed and active
        for product in data["products"]:
            assert product.get("store_listed") == True
            assert product.get("status") == "active"
        
        print(f"✓ GET /api/store/feed returned {data['count']} published products")
    
    def test_store_feed_product_has_video_details(self):
        """Test store feed includes promo video details"""
        response = requests.get(f"{API_URL}/store/feed")
        data = response.json()
        
        # If there are products with linked videos, verify video details
        for product in data["products"]:
            if product.get("promo_video_ids") and len(product["promo_video_ids"]) > 0:
                assert "promo_videos" in product
                for video in product.get("promo_videos", []):
                    assert "id" in video
                    assert "video_url" in video
                break
        
        print("✓ Store feed products include promo_videos details")


class TestExternalAPIsWithApiKey:
    """External API endpoints requiring X-API-Key header tests"""
    
    def get_valid_api_key(self):
        """Helper to get a valid API key for testing"""
        keys_response = requests.get(f"{API_URL}/integration/keys")
        keys = keys_response.json().get("keys", [])
        
        # Find key with all permissions
        for key in keys:
            if "write_products" in key.get("permissions", []):
                return key["api_key"]
        
        # Create one if needed
        create_response = requests.post(f"{API_URL}/integration/keys", json={
            "app_name": "TEST_ExternalAPI",
            "permissions": ["read_products", "write_products", "read_videos"]
        })
        return create_response.json()["api_key"]
    
    def test_external_products_without_key_returns_401(self):
        """Test GET /api/external/products WITHOUT key returns 401"""
        response = requests.get(f"{API_URL}/external/products")
        assert response.status_code == 401
        
        data = response.json()
        assert "detail" in data
        assert "Missing" in data["detail"] or "X-API-Key" in data["detail"]
        
        print("✓ GET /api/external/products without key - 401 Unauthorized")
    
    def test_external_products_with_invalid_key_returns_403(self):
        """Test GET /api/external/products with invalid key returns 403"""
        response = requests.get(
            f"{API_URL}/external/products",
            headers={"X-API-Key": "invalid-key-12345"}
        )
        assert response.status_code == 403
        
        print("✓ GET /api/external/products with invalid key - 403 Forbidden")
    
    def test_external_products_with_valid_key(self):
        """Test GET /api/external/products with valid X-API-Key returns products"""
        api_key = self.get_valid_api_key()
        
        response = requests.get(
            f"{API_URL}/external/products",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        assert isinstance(data["products"], list)
        
        print(f"✓ GET /api/external/products with valid key - {len(data['products'])} products")
    
    def test_external_videos_with_valid_key(self):
        """Test GET /api/external/videos with valid X-API-Key returns videos"""
        api_key = self.get_valid_api_key()
        
        response = requests.get(
            f"{API_URL}/external/videos",
            headers={"X-API-Key": api_key}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "videos" in data
        assert isinstance(data["videos"], list)
        
        # All videos should be completed
        for video in data["videos"]:
            assert video.get("status") == "completed"
        
        print(f"✓ GET /api/external/videos with valid key - {len(data['videos'])} completed videos")
    
    def test_external_create_product_with_valid_key(self):
        """Test POST /api/external/products with valid key creates product"""
        api_key = self.get_valid_api_key()
        
        product_data = {
            "name": f"TEST_ExternalProduct_{uuid.uuid4().hex[:8]}",
            "description": "Created via external API",
            "affiliate_link": "https://example.com/external-product",
            "price": 79.99,
            "category": "Tech & Software"
        }
        
        response = requests.post(
            f"{API_URL}/external/products",
            headers={"X-API-Key": api_key},
            json=product_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "message" in data
        
        product_id = data["id"]
        print(f"✓ POST /api/external/products with valid key - Product created: {product_id}")
        
        # Verify product exists and is auto-listed in store
        product = requests.get(f"{API_URL}/products/{product_id}").json()
        assert product["name"] == product_data["name"]
        assert product["store_listed"] == True  # External products auto-publish
        assert product["status"] == "active"
        
        print("✓ External product is auto-published to store")
        
        # Cleanup
        requests.delete(f"{API_URL}/products/{product_id}")
    
    def test_external_create_product_without_write_permission(self):
        """Test POST /api/external/products fails without write_products permission"""
        # Create key with only read permissions
        create_response = requests.post(f"{API_URL}/integration/keys", json={
            "app_name": "TEST_ReadOnlyApp",
            "permissions": ["read_products", "read_videos"]  # No write_products
        })
        read_only_key = create_response.json()["api_key"]
        key_id = create_response.json()["id"]
        
        # Try to create product with read-only key
        response = requests.post(
            f"{API_URL}/external/products",
            headers={"X-API-Key": read_only_key},
            json={
                "name": "Should Fail",
                "description": "No write permission",
                "affiliate_link": "https://example.com/fail"
            }
        )
        assert response.status_code == 403
        
        data = response.json()
        assert "write_products" in data.get("detail", "")
        
        print("✓ POST /api/external/products without write permission - 403 Forbidden")
        
        # Cleanup
        requests.delete(f"{API_URL}/integration/keys/{key_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
