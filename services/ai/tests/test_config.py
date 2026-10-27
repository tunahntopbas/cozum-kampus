from app.config import Settings


def test_llm_defaults_point_to_gemini(monkeypatch):
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    s = Settings(_env_file=None)
    assert s.llm_base_url == "https://generativelanguage.googleapis.com/v1beta/openai/"
    assert s.llm_model == "gemini-3.5-flash"
    assert s.llm_api_key == "llm-test"


def test_env_files_tolerate_shallow_install_path():
    from pathlib import Path

    from app.config import env_files

    assert env_files(Path("/app/app/config.py")) == (Path("/.env"), Path("/app/.env"))
    repo = env_files(Path("/repo/services/ai/app/config.py"))
    assert repo == (Path("/repo/.env"), Path("/repo/services/.env"), Path("/repo/services/ai/.env"))
