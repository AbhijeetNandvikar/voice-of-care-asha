"""
API routers for Voice of Care backend
"""

from app.routers.auth import router as auth_router
from app.routers.mobile import router as mobile_router
from app.routers.dashboard import router as dashboard_router

__all__ = ["auth_router", "mobile_router", "dashboard_router"]
