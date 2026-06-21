"""On-demand summarization service."""
import uuid
from loguru import logger
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Summary, Transcript
from app.pipeline.nlp.summarizer import Summarizer
from app.core.config import settings


class SummarizationService:
    @staticmethod
    def generate(project_id: str, summary_type: str, model_key: str):
        db = SessionLocal()
        try:
            transcript = db.query(Transcript).filter(Transcript.project_id == project_id).first()
            if not transcript:
                return
            content = Summarizer(device=settings.device).summarize(
                transcript.full_text, summary_type=summary_type, model_key=model_key
            )
            db.add(Summary(
                id=str(uuid.uuid4()), project_id=project_id,
                summary_type=summary_type, model_used=model_key,
                content=content, word_count=len(content.split()),
            ))
            db.commit()
            logger.info(f"Summary generated: {summary_type}/{model_key} for {project_id}")
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
        finally:
            db.close()
