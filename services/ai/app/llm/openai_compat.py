import json

import openai

from app.llm.base import LLMError

ATTEMPTS = 3
JSON_INSTRUCTION = "\n\nYanıtı yalnızca geçerli JSON olarak ver. Örnek biçim:\n"


def _parse(text: str, extract: bool) -> dict | None:
    text = text.strip()
    if extract:
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end <= start:
            return None
        text = text[start : end + 1]
    try:
        value = json.loads(text)
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


class OpenAICompatProvider:
    """Any OpenAI-compatible chat API (Gemini, DeepSeek, self-hosted). Switch provider via .env."""

    def __init__(
        self,
        client,
        model: str,
        use_json_mode: bool = True,
        max_tokens: int = 2048,
        reasoning_effort: str | None = None,
        fallback_models: list[str] | None = None,
    ):
        self.client = client
        self.model = model
        # Free-tier quotas are per model; when one is used up, later calls go straight to the next.
        self.models = [model, *(fallback_models or [])]
        self._current = 0
        self.use_json_mode = use_json_mode
        self.max_tokens = max_tokens
        self.reasoning_effort = reasoning_effort

    async def complete_json(
        self,
        *,
        system: str,
        user_text: str,
        image_b64: list[str] | None = None,
        schema_hint: str,
    ) -> dict:
        content: list[dict] = [{"type": "text", "text": user_text + JSON_INSTRUCTION + schema_hint}]
        for b64 in image_b64 or []:
            content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})
        kwargs: dict = {
            "max_tokens": self.max_tokens,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": content}],
        }
        if self.use_json_mode:
            kwargs["response_format"] = {"type": "json_object"}
        if self.reasoning_effort:
            kwargs["reasoning_effort"] = self.reasoning_effort

        attempts = 0
        while attempts < ATTEMPTS:
            try:
                r = await self.client.chat.completions.create(**kwargs, model=self.models[self._current])
            except openai.RateLimitError:
                if self._current + 1 < len(self.models):
                    self._current += 1
                    continue
                attempts += 1
                continue
            except openai.OpenAIError:
                attempts += 1
                continue
            attempts += 1
            parsed = _parse(r.choices[0].message.content or "", extract=not self.use_json_mode)
            if parsed is not None:
                return parsed
        raise LLMError("Model geçerli JSON döndürmedi")
