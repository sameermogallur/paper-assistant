import importlib.metadata
import sys
from datetime import datetime

from fastapi import APIRouter

from app.schemas.models import HealthResponse, VersionResponse

router = APIRouter()


@router.get("/healthz", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="healthy", timestamp=datetime.utcnow().isoformat())


@router.get("/version", response_model=VersionResponse)
async def version_info():
    deps = {}
    for pkg in ["fastapi", "httpx", "pypdf", "streamlit"]:
        try:
            deps[pkg] = importlib.metadata.version(pkg)
        except Exception:
            deps[pkg] = "unknown"
    return VersionResponse(
        app_version="1.0.0",
        python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
        dependencies=deps,
    )
