"""
Reports API endpoints for generating Excel reports
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.dependencies import get_current_worker
from app.models.worker import Worker
from app.schemas.reports import ReportGenerateRequest, ReportGenerateResponse
from app.services.report_service import report_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.post("/generate", response_model=ReportGenerateResponse)
async def generate_report(
    request: ReportGenerateRequest,
    current_worker: Worker = Depends(get_current_worker),
    db: Session = Depends(get_db)
) -> ReportGenerateResponse:
    """
    Generate Excel report for visits
    
    Generates an AI-powered Excel report using AWS Bedrock (Claude) for the specified
    visit type and date range. The report is uploaded to S3 and a presigned download
    URL is returned with 15-minute expiration.
    
    Requirements: 25, 32
    
    Args:
        request: Report generation request with filters
        current_worker: Authenticated worker from JWT token
        db: Database session
        
    Returns:
        ReportGenerateResponse with report_id, download_url, and expires_at
        
    Raises:
        HTTPException 400: If no visits found for criteria
        HTTPException 403: If worker is not authorized
        HTTPException 500: If report generation fails
    """
    try:
        # Verify worker is a medical officer (only they can generate reports)
        if current_worker.worker_type != "medical_officer":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only medical officers can generate reports"
            )
        
        logger.info(
            f"Report generation requested by worker {current_worker.id}: "
            f"{request.visit_type} from {request.start_date} to {request.end_date}"
        )
        
        # Generate report
        result = report_service.generate_report(
            visit_type=request.visit_type,
            start_date=request.start_date,
            end_date=request.end_date,
            worker_id=request.worker_id,
            db=db
        )
        
        logger.info(f"Report generated successfully: {result['report_id']}")
        
        return ReportGenerateResponse(
            report_id=result['report_id'],
            download_url=result['download_url'],
            expires_at=result['expires_at'],
            message="Report generated successfully"
        )
        
    except ValueError as e:
        # Handle validation errors (e.g., no visits found)
        logger.warning(f"Report generation validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Report generation failed: {str(e)}", exc_info=True)
        
        # Check if it's a Bedrock rate limit error
        if "temporarily busy" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Report generation service is temporarily busy. Please try again in a few minutes."
            )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )
