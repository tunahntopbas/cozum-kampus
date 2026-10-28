from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


def env_files(config_path: Path) -> tuple[Path, ...]:
    """Up to three parent folders of app/ (repo root first, so closer files win). Shallow in Docker."""
    return tuple(p / ".env" for p in reversed(config_path.parents[1:4]))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=env_files(Path(__file__).resolve()),
        extra="ignore",
    )

    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    llm_api_key: str
    llm_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"
    llm_model: str = "gemini-3.5-flash"
    # Comma-separated models tried in order when the current one hits its quota (HTTP 429).
    llm_fallback_models: str = ""
    llm_reasoning_effort: str | None = "low"
    llm_json_mode: bool = True
    llm_timeout_s: float = 12
    # Per-model budget before a call moves to the next fallback model.
    llm_attempt_timeout_s: float = 8
    allowed_origin: str = "http://localhost:3100"
    ai_rate_limit_per_min: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
