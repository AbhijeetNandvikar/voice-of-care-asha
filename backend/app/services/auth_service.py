"""
Authentication service for worker authentication, MPIN management, and JWT token handling
"""

from datetime import datetime, timedelta, UTC
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.worker import Worker
from app.config import settings


# Bcrypt context for password hashing (cost factor 12)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# Bcrypt context for MPIN hashing (cost factor 10)
mpin_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=10)


class AuthService:
    """Service for handling authentication operations"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt with cost factor 12"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def hash_mpin(mpin: str) -> str:
        """Hash an MPIN using bcrypt with cost factor 10"""
        return mpin_context.hash(mpin)
    
    @staticmethod
    def verify_mpin(plain_mpin: str, hashed_mpin: str) -> bool:
        """Verify an MPIN against its hash"""
        return mpin_context.verify(plain_mpin, hashed_mpin)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token
        
        Args:
            data: Dictionary containing claims to encode in the token
            expires_delta: Optional expiration time delta (defaults to 24 hours)
            
        Returns:
            Encoded JWT token string
        """
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(UTC) + expires_delta
        else:
            expire = datetime.now(UTC) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[dict]:
        """
        Verify and decode a JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def authenticate_worker(db: Session, worker_id: str, password: str) -> Optional[Worker]:
        """
        Authenticate a worker using worker_id and password
        
        Args:
            db: Database session
            worker_id: 8-digit worker ID
            password: Plain text password
            
        Returns:
            Worker object if authentication succeeds, None otherwise
        """
        worker = db.query(Worker).filter(Worker.worker_id == worker_id).first()
        
        if not worker:
            return None
        
        if not AuthService.verify_password(password, worker.password_hash):
            return None
        
        return worker
    
    @staticmethod
    def setup_mpin(db: Session, worker_id: int, mpin: str) -> bool:
        """
        Set up MPIN for a worker
        
        Args:
            db: Database session
            worker_id: Worker's database ID
            mpin: 4-digit MPIN
            
        Returns:
            True if setup succeeds, False otherwise
        """
        worker = db.query(Worker).filter(Worker.id == worker_id).first()
        
        if not worker:
            return False
        
        worker.mpin_hash = AuthService.hash_mpin(mpin)
        worker.updated_at = datetime.now(UTC)
        db.commit()
        
        return True
    
    @staticmethod
    def verify_mpin_auth(db: Session, worker_id: str, mpin: str) -> Optional[Worker]:
        """
        Authenticate a worker using worker_id and MPIN
        
        Args:
            db: Database session
            worker_id: 8-digit worker ID
            mpin: 4-digit MPIN
            
        Returns:
            Worker object if authentication succeeds, None otherwise
        """
        worker = db.query(Worker).filter(Worker.worker_id == worker_id).first()
        
        if not worker:
            return None
        
        if not worker.mpin_hash:
            return None
        
        if not AuthService.verify_mpin(mpin, worker.mpin_hash):
            return None
        
        return worker
