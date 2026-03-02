"""
Main FastAPI application entry point
Configures routes, middleware, and application lifecycle
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth_router, mobile_router, dashboard_router, visits_router

# Create FastAPI application instance
app = FastAPI(
    title="Voice of Care (ASHA) API",
    description="Backend API for ASHA worker visit management system",
    version="1.0.0",
    debug=settings.DEBUG
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(mobile_router)
app.include_router(dashboard_router)
app.include_router(visits_router)


@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "message": "Voice of Care (ASHA) API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "environment": settings.APP_ENV
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
