"""
Manual test script for mobile initialization endpoint
Run this after starting the backend server to verify the endpoint works
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
WORKER_ID = "12345678"  # Replace with actual worker_id from database
PASSWORD = "testpass123"  # Replace with actual password

def test_mobile_init():
    """Test the mobile initialization endpoint"""
    
    print("=" * 60)
    print("Testing Mobile Initialization Endpoint")
    print("=" * 60)
    
    # Step 1: Login to get JWT token
    print("\n1. Logging in to get JWT token...")
    login_response = requests.post(
        f"{BASE_URL}/api/v1/auth/login",
        json={
            "worker_id": WORKER_ID,
            "password": PASSWORD
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        return
    
    login_data = login_response.json()
    token = login_data.get("access_token")
    print(f"✅ Login successful! Token: {token[:20]}...")
    
    # Step 2: Call mobile init endpoint
    print("\n2. Calling mobile initialization endpoint...")
    init_response = requests.get(
        f"{BASE_URL}/api/v1/mobile/init",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )
    
    if init_response.status_code != 200:
        print(f"❌ Mobile init failed: {init_response.status_code}")
        print(f"Response: {init_response.text}")
        return
    
    init_data = init_response.json()
    print("✅ Mobile init successful!")
    
    # Step 3: Display results
    print("\n3. Results:")
    print("-" * 60)
    
    # Worker info
    worker = init_data.get("worker", {})
    print(f"\nWorker Profile:")
    print(f"  Name: {worker.get('first_name')} {worker.get('last_name')}")
    print(f"  Worker ID: {worker.get('worker_id')}")
    print(f"  Type: {worker.get('worker_type')}")
    print(f"  Phone: {worker.get('phone_number')}")
    
    # Beneficiaries
    beneficiaries = init_data.get("beneficiaries", [])
    print(f"\nAssigned Beneficiaries: {len(beneficiaries)}")
    for i, b in enumerate(beneficiaries[:5], 1):  # Show first 5
        print(f"  {i}. {b.get('first_name')} {b.get('last_name')} (MCTS: {b.get('mcts_id')})")
    if len(beneficiaries) > 5:
        print(f"  ... and {len(beneficiaries) - 5} more")
    
    # Templates
    templates = init_data.get("templates", [])
    print(f"\nVisit Templates: {len(templates)}")
    for i, t in enumerate(templates, 1):
        questions_count = len(t.get("questions", []))
        print(f"  {i}. {t.get('name')} ({t.get('template_type')}) - {questions_count} questions")
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_mobile_init()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend server")
        print("Make sure the backend is running at http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
