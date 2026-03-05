# FastAPI Best Practices

## Project Structure
- Organize by feature/resource (routers, schemas, services per domain)
- Keep business logic in service layer, not route handlers
- Use dependency injection for database sessions, auth, and shared logic
- Separate models (SQLAlchemy), schemas (Pydantic), and routers

## Route Handlers
- Keep handlers thin - delegate to service layer
- Use appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Return proper status codes (200, 201, 204, 400, 401, 403, 404, 500)
- Use response_model for automatic validation and documentation
- Group related endpoints with APIRouter and tags

```python
@router.get("/workers/{worker_id}", response_model=WorkerResponse)
async def get_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_user: Worker = Depends(get_current_user)
):
    return await worker_service.get_by_id(db, worker_id)
```

## Dependency Injection
- Use `Depends()` for reusable dependencies
- Create dependencies for: database sessions, authentication, pagination, filters
- Chain dependencies when needed (auth depends on db session)

```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Worker:
    # Validate token and return user
    pass
```

## Pydantic Schemas
- Create separate schemas for Create, Update, and Response operations
- Use `Config.from_attributes = True` for ORM compatibility
- Leverage Field() for validation, defaults, and documentation
- Use Optional[] for nullable fields, exclude_unset for partial updates

```python
class WorkerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., pattern=r'^\d{10}$')
    
class WorkerResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
```

## Error Handling
- Use HTTPException for expected errors
- Create custom exception handlers for domain-specific errors
- Return consistent error response format
- Log unexpected errors with proper context

```python
from fastapi import HTTPException, status

if not worker:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Worker not found"
    )
```

## Database Operations
- Use async database operations where possible
- Always use dependency injection for sessions
- Handle transactions explicitly for multi-step operations
- Use select() with options() for eager loading relationships
- Index foreign keys and frequently queried columns

```python
async def create_visit(db: Session, visit_data: VisitCreate):
    db_visit = Visit(**visit_data.model_dump())
    db.add(db_visit)
    try:
        db.commit()
        db.refresh(db_visit)
        return db_visit
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid data")
```

## Authentication & Security
- Use JWT tokens with proper expiration
- Hash passwords with bcrypt (12+ rounds)
- Validate tokens in dependencies, not route handlers
- Use OAuth2PasswordBearer for token extraction
- Never log or expose sensitive data (passwords, tokens)

## Background Tasks
- Use BackgroundTasks for non-blocking operations (emails, file processing)
- For long-running tasks, consider Celery or similar
- Don't block request/response cycle

```python
@router.post("/visits/{visit_id}/process")
async def process_visit(
    visit_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    background_tasks.add_task(transcribe_audio, visit_id)
    return {"status": "processing"}
```

## API Documentation
- Use docstrings for route descriptions
- Provide examples in schema Field() definitions
- Tag routes logically for grouped documentation
- Set proper response_model and status_code

## Testing
- Use pytest with pytest-asyncio
- Create fixtures for database, client, and test data
- Use TestClient from fastapi.testclient
- Test authentication flows separately
- Mock external services (AWS, third-party APIs)

## Performance
- Use async/await for I/O operations
- Implement pagination for list endpoints
- Use select() with limit/offset for database queries
- Cache frequently accessed, rarely changing data
- Use JSONB for flexible nested data instead of multiple tables

## Configuration
- Use pydantic-settings for environment variables
- Never commit secrets to version control
- Provide .env.example with dummy values
- Validate required config on startup

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    aws_access_key_id: str
    
    model_config = SettingsConfigDict(env_file=".env")
```

## CORS
- Configure CORS properly for frontend origins
- Don't use allow_origins=["*"] in production
- Specify allowed methods and headers explicitly

## Logging
- Use Python's logging module, not print()
- Log at appropriate levels (DEBUG, INFO, WARNING, ERROR)
- Include request IDs for tracing
- Log errors with full context but sanitize sensitive data
