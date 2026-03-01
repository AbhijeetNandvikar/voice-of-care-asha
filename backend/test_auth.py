"""
Simple test script to verify authentication service functionality
"""

from app.services.auth_service import AuthService
from datetime import timedelta


def test_password_hashing():
    """Test password hashing and verification"""
    print("Testing password hashing...")
    password = "testpassword123"
    hashed = AuthService.hash_password(password)
    print(f"  Original: {password}")
    print(f"  Hashed: {hashed[:50]}...")
    
    # Verify correct password
    assert AuthService.verify_password(password, hashed), "Password verification failed!"
    print("  ✓ Correct password verified")
    
    # Verify incorrect password
    assert not AuthService.verify_password("wrongpassword", hashed), "Wrong password should not verify!"
    print("  ✓ Incorrect password rejected")
    print()


def test_mpin_hashing():
    """Test MPIN hashing and verification"""
    print("Testing MPIN hashing...")
    mpin = "1234"
    hashed = AuthService.hash_mpin(mpin)
    print(f"  Original: {mpin}")
    print(f"  Hashed: {hashed[:50]}...")
    
    # Verify correct MPIN
    assert AuthService.verify_mpin(mpin, hashed), "MPIN verification failed!"
    print("  ✓ Correct MPIN verified")
    
    # Verify incorrect MPIN
    assert not AuthService.verify_mpin("5678", hashed), "Wrong MPIN should not verify!"
    print("  ✓ Incorrect MPIN rejected")
    print()


def test_jwt_token():
    """Test JWT token creation and verification"""
    print("Testing JWT token generation...")
    data = {"sub": "12345", "worker_type": "asha_worker"}
    
    # Create token
    token = AuthService.create_access_token(data, expires_delta=timedelta(hours=1))
    print(f"  Token: {token[:50]}...")
    
    # Verify token
    payload = AuthService.verify_token(token)
    assert payload is not None, "Token verification failed!"
    assert payload["sub"] == "12345", "Token payload mismatch!"
    print(f"  ✓ Token verified: {payload}")
    
    # Verify invalid token
    invalid_payload = AuthService.verify_token("invalid.token.here")
    assert invalid_payload is None, "Invalid token should not verify!"
    print("  ✓ Invalid token rejected")
    print()


if __name__ == "__main__":
    print("=" * 60)
    print("Authentication Service Tests")
    print("=" * 60)
    print()
    
    try:
        test_password_hashing()
        test_mpin_hashing()
        test_jwt_token()
        
        print("=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
    except Exception as e:
        print(f"\n✗ Error: {e}")
