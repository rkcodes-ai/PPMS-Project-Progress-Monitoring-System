import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Project Progress Monitoring System (PPMS)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Seed Passwords (Environment-only settings, no hardcoded defaults)
    SEED_HOD_PASSWORD: str | None = os.getenv("SEED_HOD_PASSWORD", None)
    SEED_ADVISOR_PASSWORD: str | None = os.getenv("SEED_ADVISOR_PASSWORD", None)
    SEED_MENTOR_PASSWORD: str | None = os.getenv("SEED_MENTOR_PASSWORD", None)
    SEED_STUDENT_PASSWORD: str | None = os.getenv("SEED_STUDENT_PASSWORD", None)
    
    # Defaults to SQLite for local zero-config execution; can be overridden by PostgreSQL URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./ppms.db"
    )
    
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(15 * 1024 * 1024)))
    
    # Environment & Origins
    APP_ENV: str = os.getenv("APP_ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:5173")

    # CORS Origins
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Optional Modular SMTP Settings (Zero mandatory cost - defaults to disabled/local logging)
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "false").lower() in ("true", "1", "yes")
    SMTP_HOST: str | None = os.getenv("SMTP_HOST", None)
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str | None = os.getenv("SMTP_USER", None)
    SMTP_PASSWORD: str | None = os.getenv("SMTP_PASSWORD", None)
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply-ppms@college.edu")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "PPMS Academic Notification")
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "true").lower() in ("true", "1", "yes")
    SMTP_SSL: bool = os.getenv("SMTP_SSL", "false").lower() in ("true", "1", "yes")
    SMTP_TIMEOUT_SECONDS: int = int(os.getenv("SMTP_TIMEOUT_SECONDS", "10"))

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore"
    }

settings = Settings()
