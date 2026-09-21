import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    print(f"🚀 Initializing {settings.PROJECT_NAME} in {settings.ENVIRONMENT} mode...")
    await init_db()
    yield
    # Shutdown
    print("🛑 Shutting down NexusAI Platform...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise AI Super-Platform combining ChatGPT, Claude Code, Gemini Deep Research, Higgsfield Media Studio, Qdrant Vector Memory, Document Intelligence, Agent Marketplace and Admin Observability.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router)

# Mount media static files directory
app.mount("/static/media", StaticFiles(directory=settings.MEDIA_STORAGE_DIR), name="media_static")

@app.get("/")
async def root_health():
    return {
        "status": "online",
        "platform": settings.PROJECT_NAME,
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "api_v1": "/api/v1"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "NexusAI Backend Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
