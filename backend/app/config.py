import os
from typing import List

# Try to import from pydantic_settings, fallback to pydantic
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "EquiTwin API"
    VERSION: str = "1.0.0"
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 4001
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:4001", "http://127.0.0.1:4001"]
    
    # Redis & Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # File upload
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    UPLOAD_DIR: str = "uploads"
    
    # Model storage
    MODEL_DIR: str = "models"
    
    # DID Configuration
    DID_METHOD: str = "web"
    DID_DOMAIN: str = "equitwin.dev"
    
    class Config:
        env_file = ".env"

settings = Settings()