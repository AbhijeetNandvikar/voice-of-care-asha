"""
Pydantic schemas for request/response validation
"""

from app.schemas.auth import (
    LoginRequest,
    MPINSetupRequest,
    MPINVerifyRequest,
    TokenResponse,
    WorkerProfile
)
from app.schemas.beneficiaries import (
    BeneficiaryCreate,
    BeneficiaryUpdate,
    BeneficiaryResponse,
    BeneficiaryListResponse
)
from app.schemas.templates import (
    TemplateQuestion,
    TemplateCreate,
    TemplateResponse,
    TemplateListResponse
)

__all__ = [
    "LoginRequest",
    "MPINSetupRequest",
    "MPINVerifyRequest",
    "TokenResponse",
    "WorkerProfile",
    "BeneficiaryCreate",
    "BeneficiaryUpdate",
    "BeneficiaryResponse",
    "BeneficiaryListResponse",
    "TemplateQuestion",
    "TemplateCreate",
    "TemplateResponse",
    "TemplateListResponse"
]
