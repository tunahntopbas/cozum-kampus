from app.config import Settings


def test_llm_defaults_point_to_gemini(monkeypatch):
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    s = Settings(_env_file=None)
    assert s.llm_base_url == "https://generativelanguage.googleapis.com/v1beta/openai/"
    assert s.llm_model == "gemini-3.8-flash"
    assert s.llm_api_key == "llm-test"
