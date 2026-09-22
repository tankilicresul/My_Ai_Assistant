import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, validator

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "NexusAI Super-Platform"
    SECRET_KEY: str = "nexus_super_secret_jwt_key_change_in_production_32_bytes_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000"]

    DATABASE_URL: str = "sqlite+aiosqlite:///./nexusai.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    # Qdrant Vector DB
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION_MEMORIES: str = "user_memories"
    QDRANT_COLLECTION_DOCUMENTS: str = "document_chunks"
    QDRANT_COLLECTION_RESEARCH: str = "research_knowledge"

    # AI Provider Keys
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    DEEPSEEK_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    TOGETHER_API_KEY: str = ""

    # Media Generation Keys
    FAL_KEY: str = ""
    REPLICATE_API_TOKEN: str = ""
    KLING_API_KEY: str = ""
    VEO_API_KEY: str = ""

    # Voice & Audio APIs
    ELEVENLABS_API_KEY: str = ""

    # Search APIs
    TAVILY_API_KEY: str = ""
    SERPER_API_KEY: str = ""

    # GitHub OAuth
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # Storage Paths
    SANDBOX_STORAGE_DIR: str = "./sandbox_workspaces"
    MEDIA_STORAGE_DIR: str = "./media_storage"
    DOCUMENT_STORAGE_DIR: str = "./document_storage"

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()

# Ensure storage directories exist
for path in [
    settings.SANDBOX_STORAGE_DIR,
    settings.MEDIA_STORAGE_DIR,
    os.path.join(settings.MEDIA_STORAGE_DIR, "podcasts"),
    settings.DOCUMENT_STORAGE_DIR
]:
    os.makedirs(path, exist_ok=True)
