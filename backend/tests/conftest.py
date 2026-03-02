"""
Pytest configuration and fixtures for authentication tests
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from app.database import get_db
from app.models.base import Base
from app.main import app
from app.models.worker import Worker
from app.models.collection_center import CollectionCenter
from app.services.auth_service import AuthService
from datetime import datetime


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with database override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_collection_center(db_session):
    """Create a test collection center"""
    center = CollectionCenter(
        name="Test Health Center",
        address="123 Test Street",
        meta_data={}
    )
    db_session.add(center)
    db_session.commit()
    db_session.refresh(center)
    return center


@pytest.fixture(scope="function")
def test_worker(db_session, test_collection_center):
    """Create a test worker with hashed password"""
    worker = Worker(
        first_name="Test",
        last_name="Worker",
        phone_number="9876543210",
        aadhar_id="123456789012",
        email="test@example.com",
        address="Test Address",
        worker_type="asha_worker",
        worker_id="12345678",
        password_hash=AuthService.hash_password("testpass123"),
        collection_center_id=test_collection_center.id,
        meta_data={},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db_session.add(worker)
    db_session.commit()
    db_session.refresh(worker)
    return worker


@pytest.fixture(scope="function")
def test_worker_with_mpin(db_session, test_collection_center):
    """Create a test worker with both password and MPIN"""
    worker = Worker(
        first_name="MPIN",
        last_name="Worker",
        phone_number="9876543211",
        aadhar_id="123456789013",
        email="mpin@example.com",
        address="Test Address",
        worker_type="asha_worker",
        worker_id="87654321",
        password_hash=AuthService.hash_password("testpass123"),
        mpin_hash=AuthService.hash_mpin("1234"),
        collection_center_id=test_collection_center.id,
        meta_data={},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db_session.add(worker)
    db_session.commit()
    db_session.refresh(worker)
    return worker
