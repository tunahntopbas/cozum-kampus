from typing import Protocol


class LLMError(RuntimeError):
    """The model did not return usable JSON."""


class LLMProvider(Protocol):
    async def complete_json(
        self,
        *,
        system: str,
        user_text: str,
        image_b64: list[str] | None = None,
        schema_hint: str,
    ) -> dict: ...
