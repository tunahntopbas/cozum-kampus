from functools import lru_cache

from openai import AsyncOpenAI

from app.config import get_settings
from app.llm.base import LLMProvider
from app.llm.deepseek import DeepSeekProvider


@lru_cache
def get_llm() -> LLMProvider:
    s = get_settings()
    client = AsyncOpenAI(api_key=s.deepseek_api_key, base_url=s.deepseek_base_url, max_retries=0)
    return DeepSeekProvider(client, model=s.llm_model, use_json_mode=s.llm_json_mode)
