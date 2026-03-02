"""
Unit tests for authentication service
Tests password hashing, MPIN hashing, JWT token generation and validation
"""

import pytest
from datetime import timedelta, datetime
from app.services.auth_service import AuthService
from app.models.worker import Worker


class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_hash_password_creates_valid_hash(self):
        """Test that password hashing creates a valid bcrypt hash"""
        password = "testpassword123"
        hashed = AuthService.hash_password(password)
        
        assert hashed is not None
        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt hash prefix
    
    def test_verify_password_with_correct_password(self):
        """Test password verification with correct password"""
        password = "correctpassword"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password(password, hashed) is True
    
    def test_verify_password_with_incorrect_password(self):
        """Test password verification with incorrect password"""
        password = "correctpassword"
        hashed = AuthService.hash_password(password)
        
        assert AuthService.verify_password("wrongpassword", hashed) is False
    
    def test_different_passwords_produce_different_hashes(self):
        """Test that same password produces different hashes (salt)"""
        password = "samepassword"
        hash1 = AuthService.hash_password(password)
        hash2 = AuthService.hash_password(password)
        
        assert hash1 != hash2
        assert AuthService.verify_password(password, hash1) is True
        assert AuthService.verify_password(password, hash2) is True


class TestMPINHashing:
    """Test MPIN hashing and verification"""
    
    def test_hash_mpin_creates_valid_hash(self):
        """Test that MPIN hashing creates a valid bcrypt hash"""
        mpin = "1234"
        hashed = AuthService.hash_mpin(mpin)
        
        assert hashed is not None
        assert hashed != mpin
        assert hashed.startswith("$2b$")  # bcrypt hash prefix
    
    def test_verify_mpin_with_correct_mpin(self):
        """Test MPIN verification with correct MPIN"""
        mpin = "5678"
        hashed = AuthService.hash_mpin(mpin)
        
        assert AuthService.verify_mpin(mpin, hashed) is True
    
    def test_verify_mpin_with_incorrect_mpin(self):
        """Test MPIN verification with incorrect MPIN"""
        mpin = "1234"
        hashed = AuthService.hash_mpin(mpin)
        
        assert AuthService.verify_mpin("5678", hashed) is False
    
    def test_different_mpins_produce_different_hashes(self):
        """Test that same MPIN produces different hashes (salt)"""
        mpin = "9999"
        hash1 = AuthService.hash_mpin(mpin)
        hash2 = AuthService.hash_mpin(mpin)
        
        assert hash1 != hash2
        assert AuthService.verify_mpin(mpin, hash1) is True
        assert AuthService.verify_mpin(mpin, hash2) is True


class TestJWTTokenGeneration:
    """Test JWT token creation and validation"""
    
    def test_create_access_token_with_default_expiration(self):
        """Test JWT token creation with default 24-hour expiration"""
        data = {"sub": "12345", "worker_type": "asha_worker"}
        token = AuthService.create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_custom_expiration(self):
        """Test JWT token creation with custom expiration"""
        data = {"sub": "12345"}
        expires_delta = timedelta(hours=1)
        token = AuthService.create_access_token(data, expires_delta)
        
        assert token is not None
        assert isinstance(token, str)
    
    def test_verify_token_with_valid_token(self):
        """Test token verification with valid token"""
        data = {"sub": "12345", "worker_type": "asha_worker"}
        token = AuthService.create_access_token(data)
        
        payload = AuthService.verify_token(token)
        
        assert payload is not None
        assert payload["sub"] == "12345"
        assert payload["worker_type"] == "asha_worker"
        assert "exp" in payload
    
    def test_verify_token_with_invalid_token(self):
        """Test token verification with invalid token"""
        invalid_token = "invalid.token.string"
        
        payload = AuthService.verify_token(invalid_token)
        
        assert payload is None
    
    def test_verify_token_with_malformed_token(self):
        """Test token verification with malformed token"""
        malformed_token = "not-a-jwt-token"
        
        payload = AuthService.verify_token(malformed_token)
        
        assert payload is None
    
    def test_token_contains_expiration(self):
        """Test that generated token contains expiration claim"""
        data = {"sub": "12345"}
        token = AuthService.create_access_token(data)
        payload = AuthService.verify_token(token)
        
        assert "exp" in payload
        assert isinstance(payload["exp"], int)
        assert payload["exp"] > datetime.utcnow().timestamp()


class TestWorkerAuthentication:
    """Test worker authentication with password"""
    
    def test_authenticate_worker_with_valid_credentials(self, db_session, test_worker):
        """Test authentication with valid worker_id and password"""
        worker = AuthService.authenticate_worker(
            db_session,
            test_worker.worker_id,
            "testpass123"
        )
        
        assert worker is not None
        assert worker.id == test_worker.id
        assert worker.worker_id == test_worker.worker_id
    
    def test_authenticate_worker_with_invalid_worker_id(self, db_session):
        """Test authentication with non-existent worker_id"""
        worker = AuthService.authenticate_worker(
            db_session,
            "99999999",
            "anypassword"
        )
        
        assert worker is None
    
    def test_authenticate_worker_with_invalid_password(self, db_session, test_worker):
        """Test authentication with incorrect password"""
        worker = AuthService.authenticate_worker(
            db_session,
            test_worker.worker_id,
            "wrongpassword"
        )
        
        assert worker is None
    
    def test_authenticate_worker_with_empty_password(self, db_session, test_worker):
        """Test authentication with empty password"""
        worker = AuthService.authenticate_worker(
            db_session,
            test_worker.worker_id,
            ""
        )
        
        assert worker is None


class TestMPINSetup:
    """Test MPIN setup functionality"""
    
    def test_setup_mpin_for_valid_worker(self, db_session, test_worker):
        """Test MPIN setup for existing worker"""
        success = AuthService.setup_mpin(db_session, test_worker.id, "1234")
        
        assert success is True
        
        # Verify MPIN was stored
        db_session.refresh(test_worker)
        assert test_worker.mpin_hash is not None
        assert AuthService.verify_mpin("1234", test_worker.mpin_hash) is True
    
    def test_setup_mpin_for_invalid_worker(self, db_session):
        """Test MPIN setup for non-existent worker"""
        success = AuthService.setup_mpin(db_session, 99999, "1234")
        
        assert success is False
    
    def test_setup_mpin_updates_existing_mpin(self, db_session, test_worker_with_mpin):
        """Test that MPIN setup updates existing MPIN"""
        old_mpin_hash = test_worker_with_mpin.mpin_hash
        
        success = AuthService.setup_mpin(db_session, test_worker_with_mpin.id, "5678")
        
        assert success is True
        db_session.refresh(test_worker_with_mpin)
        assert test_worker_with_mpin.mpin_hash != old_mpin_hash
        assert AuthService.verify_mpin("5678", test_worker_with_mpin.mpin_hash) is True
        assert AuthService.verify_mpin("1234", test_worker_with_mpin.mpin_hash) is False


class TestMPINAuthentication:
    """Test worker authentication with MPIN"""
    
    def test_verify_mpin_auth_with_valid_credentials(self, db_session, test_worker_with_mpin):
        """Test MPIN authentication with valid worker_id and MPIN"""
        worker = AuthService.verify_mpin_auth(
            db_session,
            test_worker_with_mpin.worker_id,
            "1234"
        )
        
        assert worker is not None
        assert worker.id == test_worker_with_mpin.id
        assert worker.worker_id == test_worker_with_mpin.worker_id
    
    def test_verify_mpin_auth_with_invalid_worker_id(self, db_session):
        """Test MPIN authentication with non-existent worker_id"""
        worker = AuthService.verify_mpin_auth(
            db_session,
            "99999999",
            "1234"
        )
        
        assert worker is None
    
    def test_verify_mpin_auth_with_invalid_mpin(self, db_session, test_worker_with_mpin):
        """Test MPIN authentication with incorrect MPIN"""
        worker = AuthService.verify_mpin_auth(
            db_session,
            test_worker_with_mpin.worker_id,
            "9999"
        )
        
        assert worker is None
    
    def test_verify_mpin_auth_without_mpin_setup(self, db_session, test_worker):
        """Test MPIN authentication for worker without MPIN setup"""
        worker = AuthService.verify_mpin_auth(
            db_session,
            test_worker.worker_id,
            "1234"
        )
        
        assert worker is None
