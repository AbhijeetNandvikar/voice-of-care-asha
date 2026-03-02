"""
Pydantic schemas for visit templates
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
from datetime import datetime


class TemplateQuestion(BaseModel):
    """Schema for a single question in a template"""
    id: str = Field(..., description="Unique question identifier")
    order: int = Field(..., ge=1, description="Question order in template")
    input_type: str = Field(..., description="Type of input: yes_no, number, voice")
    question_en: str = Field(..., min_length=1, description="Question text in English")
    question_hi: str = Field(..., min_length=1, description="Question text in Hindi")
    action_en: Optional[str] = Field(None, description="Action/suggestion in English")
    action_hi: Optional[str] = Field(None, description="Action/suggestion in Hindi")
    is_required: bool = Field(True, description="Whether question is required")
    
    @field_validator('input_type')
    @classmethod
    def validate_input_type(cls, v: str) -> str:
        """Validate input_type is one of allowed values"""
        allowed_types = ['yes_no', 'number', 'voice']
        if v not in allowed_types:
            raise ValueError(f"input_type must be one of: {', '.join(allowed_types)}")
        return v


class TemplateCreate(BaseModel):
    """Schema for creating a new template"""
    template_type: str = Field(..., description="Type of template: hbnc, anc, pnc")
    name: str = Field(..., min_length=1, description="Template name")
    questions: List[TemplateQuestion] = Field(..., min_length=1, description="List of questions")
    meta_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    
    @field_validator('template_type')
    @classmethod
    def validate_template_type(cls, v: str) -> str:
        """Validate template_type is one of allowed values"""
        allowed_types = ['hbnc', 'anc', 'pnc']
        if v not in allowed_types:
            raise ValueError(f"template_type must be one of: {', '.join(allowed_types)}")
        return v
    
    @field_validator('questions')
    @classmethod
    def validate_questions(cls, v: List[TemplateQuestion]) -> List[TemplateQuestion]:
        """Validate questions array structure"""
        if not v:
            raise ValueError("questions array must not be empty")
        
        # Check for unique question IDs
        question_ids = [q.id for q in v]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError("All question IDs must be unique within template")
        
        # Check for sequential order starting from 1
        orders = sorted([q.order for q in v])
        expected_orders = list(range(1, len(v) + 1))
        if orders != expected_orders:
            raise ValueError("Question orders must be sequential starting from 1")
        
        return v


class TemplateResponse(BaseModel):
    """Schema for template response"""
    id: int
    template_type: str
    name: str
    questions: List[Dict[str, Any]]
    meta_data: Dict[str, Any]
    created_at: datetime
    
    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    """Schema for paginated template list response"""
    templates: List[TemplateResponse]
    total: int
    page: int
    page_size: int
