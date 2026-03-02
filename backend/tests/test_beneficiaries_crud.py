"""
Integration tests for beneficiaries CRUD endpoints
Tests create, list, get, and update beneficiary operations
"""

import pytest
from fastapi import status


class TestCreateBeneficiary:
    """Test POST /api/v1/beneficiaries endpoint"""
    
    def test_create_beneficiary_with_valid_data(self, client, test_worker):
        """Test creating a beneficiary with valid data"""
        # Login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create new beneficiary
        response = client.post(
            "/api/v1/beneficiaries",
            json={
                "first_name": "Test",
                "last_name": "Beneficiary",
                "phone_number": "9876543210",
                "aadhar_id": "123456789012",
                "email": "beneficiary@example.com",
                "address": "Test Address",
                "age": 25,
                "weight": 55.5,
                "mcts_id": "MCTS123456",
                "beneficiary_type": "mother_child",
                "assigned_asha_id": test_worker.id
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        
        assert data["first_name"] == "Test"
        assert data["last_name"] == "Beneficiary"
        assert data["mcts_id"] == "MCTS123456"
        assert data["beneficiary_type"] == "mother_child"
        assert data["assigned_asha_id"] == test_worker.id
    
    def test_create_beneficiary_without_authentication(self, client):
        """Test creating a beneficiary without authentication token"""
        response = client.post(
            "/api/v1/beneficiaries",
            json={
                "first_name": "Test",
                "last_name": "Beneficiary",
                "mcts_id": "MCTS123456",
                "beneficiary_type": "mother_child"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_beneficiary_with_duplicate_mcts_id(self, client, test_worker, test_beneficiary):
        """Test creating a beneficiary with duplicate MCTS ID"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/beneficiaries",
            json={
                "first_name": "Duplicate",
                "last_name": "Beneficiary",
                "mcts_id": test_beneficiary.mcts_id,  # Duplicate MCTS ID
                "beneficiary_type": "mother_child"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.json()["detail"]
    
    def test_create_beneficiary_with_invalid_beneficiary_type(self, client, test_worker):
        """Test creating a beneficiary with invalid beneficiary_type"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/beneficiaries",
            json={
                "first_name": "Test",
                "last_name": "Beneficiary",
                "mcts_id": "MCTS999999",
                "beneficiary_type": "invalid_type"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_create_beneficiary_with_invalid_asha_worker(self, client, test_worker):
        """Test creating a beneficiary with non-existent ASHA worker"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/beneficiaries",
            json={
                "first_name": "Test",
                "last_name": "Beneficiary",
                "mcts_id": "MCTS999999",
                "beneficiary_type": "mother_child",
                "assigned_asha_id": 99999  # Non-existent worker
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "not found" in response.json()["detail"]
    
    def test_create_beneficiary_with_invalid_phone_number(self, client, test_worker):
        """Test creating a beneficiary with invalid phone number format"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/beneficiaries",
            json={
                "first_name": "Test",
                "last_name": "Beneficiary",
                "phone_number": "123",  # Invalid: not 10 digits
                "mcts_id": "MCTS999999",
                "beneficiary_type": "mother_child"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestListBeneficiaries:
    """Test GET /api/v1/beneficiaries endpoint"""
    
    def test_list_beneficiaries_default_pagination(self, client, test_worker, test_beneficiary):
        """Test listing beneficiaries with default pagination"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/v1/beneficiaries",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "beneficiaries" in data
        assert "total_count" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert data["page"] == 1
        assert data["page_size"] == 20
        assert len(data["beneficiaries"]) >= 1
    
    def test_list_beneficiaries_with_custom_pagination(self, client, test_worker):
        """Test listing beneficiaries with custom page size"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/v1/beneficiaries?page=1&page_size=5",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["page"] == 1
        assert data["page_size"] == 5
    
    def test_list_beneficiaries_search_by_name(self, client, test_worker, test_beneficiary):
        """Test searching beneficiaries by name"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            f"/api/v1/beneficiaries?search={test_beneficiary.first_name}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert len(data["beneficiaries"]) >= 1
        assert any(b["first_name"] == test_beneficiary.first_name for b in data["beneficiaries"])
    
    def test_list_beneficiaries_search_by_mcts_id(self, client, test_worker, test_beneficiary):
        """Test searching beneficiaries by MCTS ID"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            f"/api/v1/beneficiaries?search={test_beneficiary.mcts_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert len(data["beneficiaries"]) >= 1
        assert any(b["mcts_id"] == test_beneficiary.mcts_id for b in data["beneficiaries"])
    
    def test_list_beneficiaries_filter_by_type(self, client, test_worker, test_beneficiary):
        """Test filtering beneficiaries by beneficiary_type"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            f"/api/v1/beneficiaries?beneficiary_type={test_beneficiary.beneficiary_type}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert all(b["beneficiary_type"] == test_beneficiary.beneficiary_type for b in data["beneficiaries"])
    
    def test_list_beneficiaries_filter_by_invalid_type(self, client, test_worker):
        """Test filtering beneficiaries by invalid beneficiary_type"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/v1/beneficiaries?beneficiary_type=invalid_type",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_list_beneficiaries_without_authentication(self, client):
        """Test listing beneficiaries without authentication token"""
        response = client.get("/api/v1/beneficiaries")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestGetBeneficiary:
    """Test GET /api/v1/beneficiaries/{id} endpoint"""
    
    def test_get_beneficiary_by_id(self, client, test_worker, test_beneficiary):
        """Test getting a single beneficiary by ID"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            f"/api/v1/beneficiaries/{test_beneficiary.id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["id"] == test_beneficiary.id
        assert data["first_name"] == test_beneficiary.first_name
        assert data["last_name"] == test_beneficiary.last_name
        assert data["mcts_id"] == test_beneficiary.mcts_id
        assert data["beneficiary_type"] == test_beneficiary.beneficiary_type
    
    def test_get_nonexistent_beneficiary(self, client, test_worker):
        """Test getting a beneficiary that doesn't exist"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.get(
            "/api/v1/beneficiaries/99999",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_get_beneficiary_without_authentication(self, client, test_beneficiary):
        """Test getting a beneficiary without authentication token"""
        response = client.get(f"/api/v1/beneficiaries/{test_beneficiary.id}")
        
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestUpdateBeneficiary:
    """Test PUT /api/v1/beneficiaries/{id} endpoint"""
    
    def test_update_beneficiary_name(self, client, test_worker, test_beneficiary):
        """Test updating beneficiary name"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            f"/api/v1/beneficiaries/{test_beneficiary.id}",
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
        assert data["id"] == test_beneficiary.id
    
    def test_update_beneficiary_mcts_id(self, client, test_worker, test_beneficiary):
        """Test updating beneficiary MCTS ID"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            f"/api/v1/beneficiaries/{test_beneficiary.id}",
            json={
                "mcts_id": "NEWMCTS123"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["mcts_id"] == "NEWMCTS123"
    
    def test_update_beneficiary_with_duplicate_mcts_id(self, client, test_worker, test_beneficiary, db_session):
        """Test updating beneficiary with duplicate MCTS ID"""
        from app.models.beneficiary import Beneficiary
        
        # Create another beneficiary
        another_beneficiary = Beneficiary(
            first_name="Another",
            last_name="Beneficiary",
            mcts_id="ANOTHER123",
            beneficiary_type="child",
            assigned_asha_id=test_worker.id,
            meta_data={}
        )
        db_session.add(another_beneficiary)
        db_session.commit()
        
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Try to update test_beneficiary with another_beneficiary's MCTS ID
        response = client.put(
            f"/api/v1/beneficiaries/{test_beneficiary.id}",
            json={
                "mcts_id": another_beneficiary.mcts_id
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in response.json()["detail"]
    
    def test_update_beneficiary_partial_fields(self, client, test_worker, test_beneficiary):
        """Test updating only some fields"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        original_last_name = test_beneficiary.last_name
        
        response = client.put(
            f"/api/v1/beneficiaries/{test_beneficiary.id}",
            json={
                "first_name": "PartialUpdate"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["first_name"] == "PartialUpdate"
        assert data["last_name"] == original_last_name  # Should remain unchanged
    
    def test_update_nonexistent_beneficiary(self, client, test_worker):
        """Test updating a beneficiary that doesn't exist"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            "/api/v1/beneficiaries/99999",
            json={
                "first_name": "Updated"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_update_beneficiary_without_authentication(self, client, test_beneficiary):
        """Test updating a beneficiary without authentication token"""
        response = client.put(
            f"/api/v1/beneficiaries/{test_beneficiary.id}",
            json={
                "first_name": "Updated"
            }
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_update_beneficiary_with_invalid_phone_number(self, client, test_worker, test_beneficiary):
        """Test updating beneficiary with invalid phone number"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            f"/api/v1/beneficiaries/{test_beneficiary.id}",
            json={
                "phone_number": "123"  # Invalid: not 10 digits
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_update_beneficiary_assigned_asha(self, client, test_worker, test_beneficiary):
        """Test updating beneficiary's assigned ASHA worker"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.put(
            f"/api/v1/beneficiaries/{test_beneficiary.id}",
            json={
                "assigned_asha_id": test_worker.id
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["assigned_asha_id"] == test_worker.id
