from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .config import settings

# Import routers directly to avoid circular imports
from .api.upload import router as upload_router
from .api.analysis import router as analysis_router
from .api.certification import router as certification_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="EquiTwin - Causal Fairness Gymnasium & Verifiable Auditor"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)

# Include routers
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(analysis_router, prefix="/api", tags=["analysis"])
app.include_router(certification_router, prefix="/api", tags=["certification"])

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "project": settings.PROJECT_NAME
    }