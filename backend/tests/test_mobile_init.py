"""
Tests for mobile initialization endpoint
"""

import pytest
from app.models.worker import Worker
from app.models.beneficiary import Beneficiary
from app.models.visit_template import VisitTemplate
from app.services.auth_service import AuthService


def test_mobile_init_success(client, test_worker, db_session):
    """Test successful mobile initialization with beneficiaries and templates"""
    # Create test beneficiaries assigned to the worker
    beneficiary1 = Beneficiary(
        first_name="Test",
        last_name="Beneficiary1",
        phone_number="9876543210",
        mcts_id="MCTS001",
        beneficiary_type="child",
        assigned_asha_id=test_worker.id,
        age=1,
        meta_data={}
    )
    beneficiary2 = Beneficiary(
        first_name="Test",
        last_name="Beneficiary2",
        phone_number="9876543211",
        mcts_id="MCTS002",
        beneficiary_type="mother_child",
        assigned_asha_id=test_worker.id,
        age=25,
        meta_data={}
    )
    db_session.add(beneficiary1)
    db_session.add(beneficiary2)
    
    # Create test HBNC template
    template = VisitTemplate(
        template_type="hbnc",
        name="HBNC Visit Template",
        questions=[
            {
                "id": "hbnc_q1",
                "order": 1,
                "input_type": "yes_no",
                "question_en": "Is the baby breathing normally?",
                "question_hi": "क्या बच्चा सामान्य रूप से सांस ले रहा है?",
                "is_required": True
            }
        ],
        meta_data={}
    )
    db_session.add(template)
    db_session.commit()
    
    # Generate JWT token for authentication
    token = AuthService.create_access_token({"sub": str(test_worker.id)})
    
    # Make request to mobile init endpoint
    response = client.get(
        "/api/v1/mobile/init",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    
    # Verify worker data
    assert "worker" in data
    assert data["worker"]["id"] == test_worker.id
    assert data["worker"]["first_name"] == "Test"
    assert data["worker"]["last_name"] == "Worker"
    assert data["worker"]["worker_id"] == "12345678"
    assert data["worker"]["worker_type"] == "asha_worker"
    
    # Verify beneficiaries data
    assert "beneficiaries" in data
    assert len(data["beneficiaries"]) == 2
    mcts_ids = [b["mcts_id"] for b in data["beneficiaries"]]
    assert "MCTS001" in mcts_ids
    assert "MCTS002" in mcts_ids
    
    # Verify templates data
    assert "templates" in data
    assert len(data["templates"]) == 1
    assert data["templates"][0]["template_type"] == "hbnc"
    assert data["templates"][0]["name"] == "HBNC Visit Template"
    assert len(data["templates"][0]["questions"]) == 1


def test_mobile_init_no_beneficiaries(client, test_worker, db_session):
    """Test mobile initialization when worker has no assigned beneficiaries"""
    # Create HBNC template but no beneficiaries
    template = VisitTemplate(
        template_type="hbnc",
        name="HBNC Visit Template",
        questions=[],
        meta_data={}
    )
    db_session.add(template)
    db_session.commit()
    
    # Generate JWT token
    token = AuthService.create_access_token({"sub": str(test_worker.id)})
    
    # Make request
    response = client.get(
        "/api/v1/mobile/init",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert "worker" in data
    assert "beneficiaries" in data
    assert len(data["beneficiaries"]) == 0
    assert "templates" in data


def test_mobile_init_no_templates(client, test_worker, db_session):
    """Test mobile initialization when no HBNC templates exist"""
    # Create beneficiary but no templates
    beneficiary = Beneficiary(
        first_name="Test",
        last_name="Beneficiary",
        mcts_id="MCTS001",
        beneficiary_type="child",
        assigned_asha_id=test_worker.id,
        meta_data={}
    )
    db_session.add(beneficiary)
    db_session.commit()
    
    # Generate JWT token
    token = AuthService.create_access_token({"sub": str(test_worker.id)})
    
    # Make request
    response = client.get(
        "/api/v1/mobile/init",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify response
    assert response.status_code == 200
    data = response.json()
    assert "worker" in data
    assert "beneficiaries" in data
    assert len(data["beneficiaries"]) == 1
    assert "templates" in data
    assert len(data["templates"]) == 0


def test_mobile_init_unauthorized(client):
    """Test mobile initialization without authentication"""
    response = client.get("/api/v1/mobile/init")
    assert response.status_code == 403


def test_mobile_init_invalid_token(client):
    """Test mobile initialization with invalid token"""
    response = client.get(
        "/api/v1/mobile/init",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401


def test_mobile_init_non_asha_worker(client, db_session, test_collection_center):
    """Test mobile initialization with non-ASHA worker (medical officer)"""
    # Create medical officer
    medical_officer = Worker(
        first_name="Medical",
        last_name="Officer",
        phone_number="9876543212",
        aadhar_id="123456789014",
        email="mo@example.com",
        address="Test Address",
        worker_type="medical_officer",
        worker_id="11111111",
        password_hash=AuthService.hash_password("testpass123"),
        collection_center_id=test_collection_center.id,
        meta_data={}
    )
    db_session.add(medical_officer)
    db_session.commit()
    db_session.refresh(medical_officer)
    
    # Generate JWT token
    token = AuthService.create_access_token({"sub": str(medical_officer.id)})
    
    # Make request
    response = client.get(
        "/api/v1/mobile/init",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify forbidden response
    assert response.status_code == 403
    assert "Only ASHA workers" in response.json()["detail"]


def test_mobile_init_filters_other_workers_beneficiaries(client, db_session, test_worker, test_collection_center):
    """Test that mobile init only returns beneficiaries assigned to the authenticated worker"""
    # Create another ASHA worker
    other_worker = Worker(
        first_name="Other",
        last_name="Worker",
        phone_number="9876543213",
        aadhar_id="123456789015",
        email="other@example.com",
        address="Test Address",
        worker_type="asha_worker",
        worker_id="22222222",
        password_hash=AuthService.hash_password("testpass123"),
        collection_center_id=test_collection_center.id,
        meta_data={}
    )
    db_session.add(other_worker)
    db_session.commit()
    db_session.refresh(other_worker)
    
    # Create beneficiaries for both workers
    beneficiary1 = Beneficiary(
        first_name="Test",
        last_name="Beneficiary1",
        mcts_id="MCTS001",
        beneficiary_type="child",
        assigned_asha_id=test_worker.id,
        meta_data={}
    )
    beneficiary2 = Beneficiary(
        first_name="Other",
        last_name="Beneficiary2",
        mcts_id="MCTS002",
        beneficiary_type="child",
        assigned_asha_id=other_worker.id,
        meta_data={}
    )
    db_session.add(beneficiary1)
    db_session.add(beneficiary2)
    db_session.commit()
    
    # Generate JWT token for test_worker
    token = AuthService.create_access_token({"sub": str(test_worker.id)})
    
    # Make request
    response = client.get(
        "/api/v1/mobile/init",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Verify response only includes test_worker's beneficiaries
    assert response.status_code == 200
    data = response.json()
    assert len(data["beneficiaries"]) == 1
    assert data["beneficiaries"][0]["mcts_id"] == "MCTS001"
    assert data["beneficiaries"][0]["assigned_asha_id"] == test_worker.id
