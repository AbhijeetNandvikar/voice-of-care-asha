"""
Integration tests for workers CRUD endpoints
Tests create, list, get, and update worker operations
"""

import pytest
from fastapi import status
from app.services.auth_service import AuthService


class TestCreateWorker:
    """Test POST /api/v1/workers endpoint"""
    
    def test_create_worker_with_valid_data(self, client, test_worker):
        """Test creating a worker with valid data"""
        # Login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create new worker
        response = client.post(
            "/api/v1/workers",
            json={
                "first_name": "New",
                "last_name": "Worker",
                "phone_number": "9876543299",
                "aadhar_id": "123456789099",
                "email": "newworker@example.com",
                "address": "New Address",
                "worker_type": "asha_worker",
                "password": "newpass123",
                "collection_center_id": test_worker.collection_center_id
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        assert data["first_name"] == "New"
        assert data["last_name"] == "Worker"
        assert data["phone_number"] == "9876543299"
        assert data["worker_type"] == "asha_worker"
        assert "worker_id" in data
        assert len(data["worker_id"]) == 8
        assert "password_hash" not in data  # Password should not be returned
    
    def test_create_worker_without_authentication(self, client):
        """Test creating a worker without authentication token"""
        response = client.post(
            "/api/v1/workers",
            json={
                "first_name": "New",
                "last_name": "Worker",
                "phone_number": "9876543299",
                "worker_type": "asha_worker",
                "password": "newpass123"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_worker_with_invalid_phone_number(self, client, test_worker):
        """Test creating a worker with invalid phone number format"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/workers",
            json={
                "first_name": "New",
                "last_name": "Worker",
                "phone_number": "123",  # Invalid: not 10 digits
                "worker_type": "asha_worker",
                "password": "newpass123"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_worker_with_invalid_worker_type(self, client, test_worker):
        """Test creating a worker with invalid worker_type"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/workers",
            json={
                "first_name": "New",
                "last_name": "Worker",
                "phone_number": "9876543299",
                "worker_type": "invalid_type",
                "password": "newpass123"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_worker_with_short_password(self, client, test_worker):
        """Test creating a worker with password shorter than 8 characters"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/workers",
            json={
                "first_name": "New",
                "last_name": "Worker",
                "phone_number": "9876543299",
                "worker_type": "asha_worker",
                "password": "short"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_worker_password_is_hashed(self, client, test_worker, db_session):
        """Test that password is hashed before storing"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/workers",
            json={
                "first_name": "New",
                "last_name": "Worker",
                "phone_number": "9876543299",
                "worker_type": "asha_worker",
                "password": "newpass123"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify password is hashed in database
        from app.models.worker import Worker
        new_worker = db_session.query(Worker).filter(
            Worker.id == response.json()["id"]
        ).first()
        
        assert new_worker.password_hash != "newpass123"
        assert AuthService.verify_password("newpass123", new_worker.password_hash)


class TestListWorkers:
    """Test GET /api/v1/workers endpoint"""
    
    def test_list_workers_default_pagination(self, client, test_worker):
        """Test listing workers with default pagination"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/v1/workers",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "workers" in data
        assert "total_count" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert data["page"] == 1
        assert data["page_size"] == 20
        assert len(data["items"]) >= 1
    
    def test_list_workers_with_custom_pagination(self, client, test_worker):
        """Test listing workers with custom page size"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/v1/workers?page=1&page_size=5",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["page"] == 1
        assert data["page_size"] == 5
    
    def test_list_workers_search_by_name(self, client, test_worker):
        """Test searching workers by name"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            f"/api/v1/workers?search={test_worker.first_name}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert len(data["items"]) >= 1
        assert any(w["first_name"] == test_worker.first_name for w in data["items"])
    
    def test_list_workers_search_by_worker_id(self, client, test_worker):
        """Test searching workers by worker_id"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            f"/api/v1/workers?search={test_worker.worker_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert len(data["items"]) >= 1
        assert any(w["worker_id"] == test_worker.worker_id for w in data["items"])
    
    def test_list_workers_without_authentication(self, client):
        """Test listing workers without authentication token"""
        response = client.get("/api/v1/workers")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetWorker:
    """Test GET /api/v1/workers/{id} endpoint"""
    
    def test_get_worker_by_id(self, client, test_worker):
        """Test getting a single worker by ID"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            f"/api/v1/workers/{test_worker.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["id"] == test_worker.id
        assert data["first_name"] == test_worker.first_name
        assert data["last_name"] == test_worker.last_name
        assert data["worker_id"] == test_worker.worker_id
        assert data["worker_type"] == test_worker.worker_type
    
    def test_get_nonexistent_worker(self, client, test_worker):
        """Test getting a worker that doesn't exist"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/v1/workers/99999",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_worker_without_authentication(self, client, test_worker):
        """Test getting a worker without authentication token"""
        response = client.get(f"/api/v1/workers/{test_worker.id}")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestUpdateWorker:
    """Test PUT /api/v1/workers/{id} endpoint"""
    
    def test_update_worker_name(self, client, test_worker):
        """Test updating worker name"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            f"/api/v1/workers/{test_worker.id}",
            json={
                "first_name": "Updated",
                "last_name": "Name"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["first_name"] == "Updated"
        assert data["last_name"] == "Name"
        assert data["id"] == test_worker.id
    
    def test_update_worker_password(self, client, test_worker, db_session):
        """Test updating worker password"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            f"/api/v1/workers/{test_worker.id}",
            json={
                "password": "newpassword123"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        
        # Verify new password works
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "newpassword123"
            }
        )
        
        assert login_response.status_code == status.HTTP_200_OK
    
    def test_update_worker_partial_fields(self, client, test_worker):
        """Test updating only some fields"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        original_last_name = test_worker.last_name
        
        response = client.put(
            f"/api/v1/workers/{test_worker.id}",
            json={
                "first_name": "PartialUpdate"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["first_name"] == "PartialUpdate"
        assert data["last_name"] == original_last_name  # Should remain unchanged
    
    def test_update_nonexistent_worker(self, client, test_worker):
        """Test updating a worker that doesn't exist"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            "/api/v1/workers/99999",
            json={
                "first_name": "Updated"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_worker_without_authentication(self, client, test_worker):
        """Test updating a worker without authentication token"""
        response = client.put(
            f"/api/v1/workers/{test_worker.id}",
            json={
                "first_name": "Updated"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_worker_with_invalid_phone_number(self, client, test_worker):
        """Test updating worker with invalid phone number"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            f"/api/v1/workers/{test_worker.id}",
            json={
                "phone_number": "123"  # Invalid: not 10 digits
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
