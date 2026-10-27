from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(REPO_ROOT / ".env", Path(__file__).resolve().parents[1] / ".env"),
        extra="ignore",
    )

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    llm_api_key: str
    llm_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    llm_model: str = "gemini-3.8-flash"
    llm_reasoning_effort: str | None = "low"
    llm_json_mode: bool = True
    llm_timeout_s: float = 12
    allowed_origin: str = "http://localhost:3100"
    ai_rate_limit_per_min: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
