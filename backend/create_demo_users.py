"""
Script to create demo users for testing
Creates multiple workers with different roles
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models.worker import Worker
from app.models.collection_center import CollectionCenter
from app.services.auth_service import AuthService
from datetime import datetime, UTC

def create_demo_users():
    db = SessionLocal()
    
    try:
        # Create collection center if it doesn't exist
        collection_center = db.query(CollectionCenter).first()
        if not collection_center:
            collection_center = CollectionCenter(
                name="Primary Health Center - Demo",
                address="123 Main Street, Demo City",
                created_at=datetime.now(UTC)
            )
            db.add(collection_center)
            db.commit()
            db.refresh(collection_center)
            print(f"✓ Created collection center: {collection_center.name}")
        else:
            print(f"✓ Using existing collection center: {collection_center.name}")
        
        # Demo users to create
        demo_users = [
            {
                "worker_id": "10000001",
                "password": "asha123",
                "first_name": "Priya",
                "last_name": "Sharma",
                "worker_type": "asha_worker",
                "phone": "9876543210",
                "email": "priya.sharma@example.com"
            },
            {
                "worker_id": "10000002",
                "password": "asha123",
                "first_name": "Sunita",
                "last_name": "Devi",
                "worker_type": "asha_worker",
                "phone": "9876543211",
                "email": "sunita.devi@example.com"
            },
            {
                "worker_id": "20000001",
                "password": "medical123",
                "first_name": "Dr. Rajesh",
                "last_name": "Kumar",
                "worker_type": "medical_officer",
                "phone": "9876543212",
                "email": "rajesh.kumar@example.com"
            }
        ]
        
        print("\n" + "="*60)
        print("DEMO USER CREDENTIALS")
        print("="*60)
        
        for user_data in demo_users:
            # Check if worker already exists
            existing = db.query(Worker).filter(
                Worker.worker_id == user_data["worker_id"]
            ).first()
            
            if existing:
                print(f"\n⚠ Worker {user_data['worker_id']} already exists - skipping")
                continue
            
            # Create worker
            password_hash = AuthService.hash_password(user_data["password"])
            
            worker = Worker(
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                phone_number=user_data["phone"],
                aadhar_id=f"{''.join([str(i) for i in range(12)])}",  # Dummy Aadhar
                email=user_data["email"],
                address="Demo Address",
                worker_type=user_data["worker_type"],
                worker_id=user_data["worker_id"],
                password_hash=password_hash,
                collection_center_id=collection_center.id,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC)
            )
            
            db.add(worker)
            db.commit()
            db.refresh(worker)
            
            print(f"\n✓ Created: {user_data['first_name']} {user_data['last_name']}")
            print(f"  Worker ID: {user_data['worker_id']}")
            print(f"  Password:  {user_data['password']}")
            print(f"  Type:      {user_data['worker_type']}")
            print(f"  Email:     {user_data['email']}")
        
        print("\n" + "="*60)
        print("Use these credentials to login at:")
        print("  API Docs: http://localhost:8000/docs")
        print("  Endpoint: POST /api/v1/auth/login")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error creating demo users: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_users()
