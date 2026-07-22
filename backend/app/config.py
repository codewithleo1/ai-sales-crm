"""
Application configuration — loads all settings from the .env file.
Uses pydantic-settings so every variable is type-checked on startup.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All environment variables the app needs to run."""

    # Supabase
    supabase_url: str
    supabase_key: str
    database_url: str

    # Groq
    groq_api_key: str

    # Resend
    resend_api_key: str = ""

    # App
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"
    secret_key: str = "change-me-in-production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Single instance imported everywhere else in the app
settings = Settings()