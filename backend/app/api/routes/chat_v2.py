"""Chat route v2 — uses TF-IDF RAG."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db, ChatMessage, Project
from app.models.schemas import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest, db: Session=Depends(get_db)):
    p = db.query(Project).filter(Project.id==req.project_id).first()
    if not p: raise HTTPException(404,"Project not found")
    if p.status != "complete": raise HTTPException(400,"Video still processing")
    db.add(ChatMessage(id=str(uuid.uuid4()),project_id=req.project_id,
                       role="user",content=req.message))
    db.commit()
    try:
        from app.services.rag_v2 import generate_answer
        answer, citations = await generate_answer(req.project_id, req.message, req.include_citations)
    except Exception as e:
        from loguru import logger; logger.error(f"Chat failed: {e}")
        answer = "Error retrieving answer. Make sure the video is fully processed."; citations = []
    msg = ChatMessage(id=str(uuid.uuid4()),project_id=req.project_id,
                      role="assistant",content=answer,citations=citations)
    db.add(msg); db.commit(); db.refresh(msg)
    return msg

@router.get("/{project_id}/history", response_model=list[ChatResponse])
def history(project_id, db: Session=Depends(get_db)):
    return db.query(ChatMessage).filter(ChatMessage.project_id==project_id)\
             .order_by(ChatMessage.created_at).all()

@router.delete("/{project_id}/history")
def clear(project_id, db: Session=Depends(get_db)):
    db.query(ChatMessage).filter(ChatMessage.project_id==project_id).delete()
    db.commit(); return {"message":"Cleared"}
