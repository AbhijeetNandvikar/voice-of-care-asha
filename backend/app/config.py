"""
Configuration management for Voice of Care backend
Loads environment variables and provides application settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database Configuration
    DATABASE_URL: str

    # JWT Configuration
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # AWS Configuration
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET_AUDIO: str
    AWS_S3_BUCKET_REPORTS: str
    # Bedrock model ID - for ap-south-1, use the direct model ID
    # Cross-region inference profiles are only available in us-east-1, us-west-2, eu-central-1
    AWS_BEDROCK_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    
    # Application Configuration
    APP_ENV: str = "development"
    DEBUG: bool = True

    # CORS — comma-separated list of allowed origins
    # Local dev default covers Vite dev server; override in production .env
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields from .env file
    )


# Global settings instance
settings = Settings()
