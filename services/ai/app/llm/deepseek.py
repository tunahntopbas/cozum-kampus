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


class DeepSeekProvider:
    def __init__(self, client, model: str, use_json_mode: bool = True, max_tokens: int = 800):
        self.client = client
        self.model = model
        self.use_json_mode = use_json_mode
        self.max_tokens = max_tokens

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
            "model": self.model,
            "max_tokens": self.max_tokens,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": content}],
        }
        if self.use_json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        for _ in range(ATTEMPTS):
            try:
                r = await self.client.chat.completions.create(**kwargs)
            except openai.OpenAIError:
                continue
            parsed = _parse(r.choices[0].message.content or "", extract=not self.use_json_mode)
            if parsed is not None:
                return parsed
        raise LLMError("Model geçerli JSON döndürmedi")
