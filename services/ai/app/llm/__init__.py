from functools import lru_cache

from openai import AsyncOpenAI

from app.config import get_settings
from app.llm.base import LLMProvider
from app.llm.openai_compat import OpenAICompatProvider


@lru_cache
def get_llm() -> LLMProvider:
    s = get_settings()
    client = AsyncOpenAI(api_key=s.llm_api_key, base_url=s.llm_base_url, max_retries=0)
    return OpenAICompatProvider(
        client,
        model=s.llm_model,
        use_json_mode=s.llm_json_mode,
        reasoning_effort=s.llm_reasoning_effort or None,
    )
