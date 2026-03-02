"""
Integration tests for authentication endpoints
Tests login, MPIN setup, and MPIN verification endpoints
"""

import pytest
from fastapi import status
from app.services.auth_service import AuthService


class TestLoginEndpoint:
    """Test POST /api/v1/auth/login endpoint"""
    
    def test_login_with_valid_credentials(self, client, test_worker):
        """Test login with valid worker_id and password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "worker" in data
        assert data["worker"]["worker_id"] == test_worker.worker_id
        assert data["worker"]["first_name"] == test_worker.first_name
        assert data["worker"]["last_name"] == test_worker.last_name
    
    def test_login_with_invalid_worker_id(self, client):
        """Test login with non-existent worker_id"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": "99999999",
                "password": "anypassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid worker_id or password" in response.json()["detail"]
    
    def test_login_with_invalid_password(self, client, test_worker):
        """Test login with incorrect password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid worker_id or password" in response.json()["detail"]
    
    def test_login_with_missing_worker_id(self, client):
        """Test login with missing worker_id field"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "password": "testpass123"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_login_with_missing_password(self, client, test_worker):
        """Test login with missing password field"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_login_with_short_password(self, client, test_worker):
        """Test login with password shorter than 8 characters"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "short"
            }
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_login_token_is_valid_jwt(self, client, test_worker):
        """Test that login returns a valid JWT token"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        token = response.json()["access_token"]
        
        # Verify token can be decoded
        payload = AuthService.verify_token(token)
        assert payload is not None
        assert payload["sub"] == str(test_worker.id)


class TestMPINSetupEndpoint:
    """Test POST /api/v1/auth/mpin/setup endpoint"""
    
    def test_mpin_setup_with_valid_token(self, client, test_worker):
        """Test MPIN setup with valid authentication token"""
        # First login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        # Setup MPIN
        response = client.post(
            "/api/v1/auth/mpin/setup",
            json={"mpin": "1234"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "MPIN setup successful"
        assert data["worker_id"] == test_worker.worker_id
    
    def test_mpin_setup_without_token(self, client):
        """Test MPIN setup without authentication token"""
        response = client.post(
            "/api/v1/auth/mpin/setup",
            json={"mpin": "1234"}
        )
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_mpin_setup_with_invalid_token(self, client):
        """Test MPIN setup with invalid authentication token"""
        response = client.post(
            "/api/v1/auth/mpin/setup",
            json={"mpin": "1234"},
            headers={"Authorization": "Bearer invalid.token.here"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_mpin_setup_with_non_numeric_mpin(self, client, test_worker):
        """Test MPIN setup with non-numeric MPIN"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/auth/mpin/setup",
            json={"mpin": "abcd"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_mpin_setup_with_short_mpin(self, client, test_worker):
        """Test MPIN setup with MPIN shorter than 4 digits"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/auth/mpin/setup",
            json={"mpin": "123"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    
    def test_mpin_setup_with_long_mpin(self, client, test_worker):
        """Test MPIN setup with MPIN longer than 4 digits"""
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        token = login_response.json()["access_token"]
        
        response = client.post(
            "/api/v1/auth/mpin/setup",
            json={"mpin": "12345"},
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestMPINVerifyEndpoint:
    """Test POST /api/v1/auth/mpin/verify endpoint"""
    
    def test_mpin_verify_with_valid_credentials(self, client, test_worker_with_mpin):
        """Test MPIN verification with valid worker_id and MPIN"""
        response = client.post(
            "/api/v1/auth/mpin/verify",
            json={
                "worker_id": test_worker_with_mpin.worker_id,
                "mpin": "1234"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "worker" in data
        assert data["worker"]["worker_id"] == test_worker_with_mpin.worker_id
    
    def test_mpin_verify_with_invalid_worker_id(self, client):
        """Test MPIN verification with non-existent worker_id"""
        response = client.post(
            "/api/v1/auth/mpin/verify",
            json={
                "worker_id": "99999999",
                "mpin": "1234"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid worker_id or MPIN" in response.json()["detail"]
    
    def test_mpin_verify_with_invalid_mpin(self, client, test_worker_with_mpin):
        """Test MPIN verification with incorrect MPIN"""
        response = client.post(
            "/api/v1/auth/mpin/verify",
            json={
                "worker_id": test_worker_with_mpin.worker_id,
                "mpin": "9999"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid worker_id or MPIN" in response.json()["detail"]
    
    def test_mpin_verify_without_mpin_setup(self, client, test_worker):
        """Test MPIN verification for worker without MPIN setup"""
        response = client.post(
            "/api/v1/auth/mpin/verify",
            json={
                "worker_id": test_worker.worker_id,
                "mpin": "1234"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_mpin_verify_token_is_valid_jwt(self, client, test_worker_with_mpin):
        """Test that MPIN verify returns a valid JWT token"""
        response = client.post(
            "/api/v1/auth/mpin/verify",
            json={
                "worker_id": test_worker_with_mpin.worker_id,
                "mpin": "1234"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        token = response.json()["access_token"]
        
        # Verify token can be decoded
        payload = AuthService.verify_token(token)
        assert payload is not None
        assert payload["sub"] == str(test_worker_with_mpin.id)


class TestTokenExpiration:
    """Test JWT token expiration behavior"""
    
    def test_token_expiration_claim_is_set(self, client, test_worker):
        """Test that generated tokens have expiration claim"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "worker_id": test_worker.worker_id,
                "password": "testpass123"
            }
        )
        
        token = response.json()["access_token"]
        payload = AuthService.verify_token(token)
        
        assert "exp" in payload
        assert isinstance(payload["exp"], int)
    
    def test_expired_token_is_rejected(self, client, test_worker):
        """Test that expired tokens are rejected"""
        from datetime import timedelta
        
        # Create a token that expires immediately
        expired_token = AuthService.create_access_token(
            data={"sub": str(test_worker.id)},
            expires_delta=timedelta(seconds=-1)
        )
        
        # Try to use expired token
        response = client.post(
            "/api/v1/auth/mpin/setup",
            json={"mpin": "1234"},
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
