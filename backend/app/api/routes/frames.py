"""Frames route."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db, Frame
from app.models.schemas import FrameOut

router = APIRouter()

@router.get("/{project_id}", response_model=list[FrameOut])
def get_frames(project_id: str, db: Session = Depends(get_db)):
    return db.query(Frame).filter(Frame.project_id == project_id).order_by(Frame.timestamp_seconds).all()
