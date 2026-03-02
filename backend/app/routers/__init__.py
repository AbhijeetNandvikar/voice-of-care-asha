"""
API routers for Voice of Care backend
"""

from app.routers.auth import router as auth_router
from app.routers.mobile import router as mobile_router
from app.routers.workers import router as workers_router
from app.routers.beneficiaries import router as beneficiaries_router
from app.routers.templates import router as templates_router
from app.routers.sync import router as sync_router

__all__ = ["auth_router", "mobile_router", "workers_router", "beneficiaries_router", "templates_router", "sync_router"]
