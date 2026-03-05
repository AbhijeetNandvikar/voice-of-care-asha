"""
Pydantic schemas for chat API
"""

from pydantic import BaseModel
from typing import List, Literal


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatMessageRequest(BaseModel):
    message: str
    conversation_history: List[ConversationMessage] = []


class ChatMessageResponse(BaseModel):
    response: str
    conversation_history: List[ConversationMessage]
