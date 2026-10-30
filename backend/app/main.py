import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.v1 import (
    auth, projects, tasks, milestones, reports, analytics, 
    documents, notifications, communication, reminders, certificates, system, academic
)
from app.services.deadline_service import scan_deadline_reminders

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

async def daily_reminder_scheduler():
    """
    Lightweight, local in-process scheduled check for tasks and milestones approaching deadlines.
    Runs once daily, separate from normal API request handling.
    """
    while True:
        try:
            db = SessionLocal()
            try:
                scan_deadline_reminders(db=db)
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            import logging
            logging.getLogger("ppms.scheduler").error(f"Error in background reminder worker: {exc}")
        # Sleep for 24 hours (86400 seconds)
        try:
            await asyncio.sleep(86400)
        except asyncio.CancelledError:
            break

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch daily scheduler in background
    scheduler_task = asyncio.create_task(daily_reminder_scheduler())
    yield
    # Shutdown: Cleanly cancel background scheduler
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass

is_production = settings.APP_ENV.lower() == "production"

# Production environment safety validation
if is_production:
    placeholder_keys = (
        "super-secret-ppms-jwt-key-2026-cse-secure-auth-token",
        "super-secret-ppms-jwt-key-2026-cse-secure-auth-token-placeholder"
    )
    if settings.SECRET_KEY in placeholder_keys or len(settings.SECRET_KEY) < 32:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: A strong, cryptographically random SECRET_KEY "
            "(at least 32 characters) must be configured in production environment."
        )

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Professional Academic Project Progress Monitoring System (PPMS) for CSE Department",
    version="1.0.0",
    docs_url=None if is_production else f"{settings.API_V1_STR}/docs",
    openapi_url=None if is_production else f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS configuration: accept ONLY the deployed frontend origin in production, flexible in development
if is_production:
    raw_origins = [o.strip().rstrip("/") for o in settings.FRONTEND_ORIGIN.split(",") if o.strip()]
    allowed_origins = [o for o in raw_origins if o]
    if not allowed_origins:
        allowed_origins = [settings.FRONTEND_ORIGIN.strip().rstrip("/")]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(projects.router, prefix=f"{settings.API_V1_STR}/projects", tags=["Projects"])
app.include_router(tasks.router, prefix=settings.API_V1_STR, tags=["Tasks"])
app.include_router(milestones.router, prefix=settings.API_V1_STR, tags=["Milestones"])
app.include_router(reports.router, prefix=settings.API_V1_STR, tags=["Reports"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(documents.router, prefix=settings.API_V1_STR, tags=["Documents"])
app.include_router(notifications.router, prefix=settings.API_V1_STR, tags=["Notifications"])
app.include_router(communication.router, prefix=settings.API_V1_STR, tags=["Discussions & Communication"])
app.include_router(reminders.router, prefix=settings.API_V1_STR, tags=["Deadline Reminders"])
app.include_router(certificates.router, prefix=settings.API_V1_STR, tags=["Academic Certificates"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["System Status"])
app.include_router(academic.router, prefix=f"{settings.API_V1_STR}/academic", tags=["Academic Hierarchy"])


@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "department": "Computer Science and Engineering (CSE)",
        "status": "online",
        "api_docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)
