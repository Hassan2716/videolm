"""YouTube URL download and processing route."""
import uuid, os, subprocess, json
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from loguru import logger

from app.core.database import get_db, Project
from app.models.schemas import YouTubeRequest, ProjectOut
from app.services.pipeline_service import PipelineService

router = APIRouter()


def is_valid_youtube(url: str) -> bool:
    return any(d in url for d in ["youtube.com/watch", "youtu.be/", "youtube.com/shorts/"])


@router.post("/", response_model=ProjectOut)
async def submit_youtube(
    req: YouTubeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if not is_valid_youtube(req.url):
        raise HTTPException(400, "Invalid YouTube URL")

    project_id = str(uuid.uuid4())
    project = Project(
        id=project_id, source_type="youtube",
        source_url=req.url, status="pending",
        current_stage="Queued for download",
    )
    db.add(project); db.commit(); db.refresh(project)
    background_tasks.add_task(PipelineService.run_youtube, project_id, req.url)
    return project


@router.get("/info")
async def get_info(url: str):
    if not is_valid_youtube(url):
        raise HTTPException(400, "Invalid YouTube URL")
    try:
        cmd = ["yt-dlp", "--dump-json", "--no-playlist", url]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            raise HTTPException(400, "Could not fetch info — check URL or update yt-dlp")
        d = json.loads(r.stdout)
        return {
            "title": d.get("title"),
            "duration": d.get("duration"),
            "uploader": d.get("uploader"),
            "thumbnail": d.get("thumbnail"),
            "view_count": d.get("view_count"),
            "description": (d.get("description") or "")[:500],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))
