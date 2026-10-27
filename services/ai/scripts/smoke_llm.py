"""Checks whether the configured LLM accepts an image together with JSON mode (open item in the guide, 2.1).

Usage: uv run python -m scripts.smoke_llm path/to/photo.jpg ["optional report text"]
"""

import asyncio
import base64
import sys
import time

from openai import AsyncOpenAI
from pydantic import ValidationError

from app.config import get_settings
from app.llm.base import LLMError
from app.llm.openai_compat import OpenAICompatProvider
from app.prompts.analyze_report import SCHEMA_HINT, SYSTEM, build_user_text
from app.routers.analyze import normalize_model_output


async def main(image_path: str, text: str) -> None:
    s = get_settings()
    client = AsyncOpenAI(api_key=s.llm_api_key, base_url=s.llm_base_url, max_retries=0)
    with open(image_path, "rb") as f:
        image = base64.b64encode(f.read()).decode()

    for json_mode in (True, False):
        provider = OpenAICompatProvider(
            client, model=s.llm_model, use_json_mode=json_mode, reasoning_effort=s.llm_reasoning_effort
        )
        start = time.monotonic()
        try:
            raw = await provider.complete_json(
                system=SYSTEM,
                user_text=build_user_text(text, None, None, None),
                image_b64=[image],
                schema_hint=SCHEMA_HINT,
            )
            result = normalize_model_output(raw)
            print(f"{s.llm_model} json_mode={json_mode}: OK in {time.monotonic() - start:.1f}s")
            print(result.model_dump_json(indent=2))
        except (LLMError, ValidationError) as e:
            print(f"{s.llm_model} json_mode={json_mode}: FAILED in {time.monotonic() - start:.1f}s: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else ""))
