"""
Chat router — POST /api/v1/chat/message
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services import chat_service

router = APIRouter(
    prefix="/api/v1/chat",
    tags=["chat"]
)


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_worker: Worker = Depends(get_current_worker),
):
    """Send a message to the AI assistant and get a response."""
    response_text, updated_history = chat_service.process_message(
        message=request.message,
        conversation_history=request.conversation_history,
        db=db,
    )

    return ChatMessageResponse(
        response=response_text,
        conversation_history=updated_history,
    )
