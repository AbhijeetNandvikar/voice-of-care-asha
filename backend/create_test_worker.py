"""
Script to create a test worker for manual testing
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.worker import Worker
from app.models.collection_center import CollectionCenter
from app.services.auth_service import AuthService
from datetime import datetime

def create_test_worker():
    db = SessionLocal()
    
    try:
        # Create collection center if it doesn't exist
        collection_center = db.query(CollectionCenter).first()
        if not collection_center:
            collection_center = CollectionCenter(
                name="Test Collection Center",
                address="123 Test Street",
                created_at=datetime.utcnow()
            )
            db.add(collection_center)
            db.commit()
            db.refresh(collection_center)
            print(f"Created collection center: {collection_center.name}")
        
        # Check if test worker already exists
        existing_worker = db.query(Worker).filter(Worker.worker_id == "12345678").first()
        if existing_worker:
            print(f"Test worker already exists: {existing_worker.worker_id}")
            return
        
        # Create test ASHA worker
        password_hash = AuthService.hash_password("testpass123")
        
        worker = Worker(
            first_name="Test",
            last_name="Worker",
            phone_number="9876543210",
            aadhar_id="123456789012",
            email="test@example.com",
            address="Test Address",
            worker_type="asha_worker",
            worker_id="12345678",
            password_hash=password_hash,
            collection_center_id=collection_center.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(worker)
        db.commit()
        db.refresh(worker)
        
        print(f"Created test worker:")
        print(f"  Worker ID: {worker.worker_id}")
        print(f"  Name: {worker.first_name} {worker.last_name}")
        print(f"  Password: testpass123")
        print(f"  Type: {worker.worker_type}")
        
    except Exception as e:
        print(f"Error creating test worker: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_worker()
