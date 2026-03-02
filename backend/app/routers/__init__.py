"""
API routers for Voice of Care backend
"""

from app.routers.auth import router as auth_router
from app.routers.mobile import router as mobile_router
from app.routers.workers import router as workers_router
from app.routers.beneficiaries import router as beneficiaries_router
from app.routers.templates import router as templates_router
from app.routers.sync import router as sync_router
from app.routers.sync_logs import router as sync_logs_router
from app.routers.reports import router as reports_router
from app.routers.dashboard import router as dashboard_router

from app.routers.dashboard import router as dashboard_router
from app.routers.visits import router as visits_router

__all__ = ["auth_router", "mobile_router", "workers_router", "beneficiaries_router", "templates_router", "sync_router", "sync_logs_router", "reports_router", "dashboard_router"]
