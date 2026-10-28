from types import SimpleNamespace

import httpx
import openai
import pytest

from app.llm.base import LLMError
from app.llm.openai_compat import OpenAICompatProvider


class FakeCompletions:
    def __init__(self, outputs):
        self.outputs = list(outputs)
        self.calls = []

    async def create(self, **kwargs):
        self.calls.append(kwargs)
        out = self.outputs.pop(0)
        if isinstance(out, Exception):
            raise out
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=out))])


def make(outputs, **kw):
    completions = FakeCompletions(outputs)
    client = SimpleNamespace(chat=SimpleNamespace(completions=completions))
    return OpenAICompatProvider(client, model="gemini-test", **kw), completions


async def call(p, images=None):
    return await p.complete_json(system="sys", user_text="metin", image_b64=images, schema_hint="{}")


async def test_retries_on_empty_then_parses():
    p, c = make(["", '{"a": 1}'])
    assert await call(p) == {"a": 1}
    assert len(c.calls) == 2


async def test_raises_after_three_invalid():
    p, _ = make(["x", "y", "z"])
    with pytest.raises(LLMError):
        await call(p)


async def test_retries_on_api_error():
    timeout = openai.APITimeoutError(request=httpx.Request("POST", "https://llm.example"))
    p, _ = make([timeout, '{"a": 1}'])
    assert await call(p) == {"a": 1}


async def test_extracts_json_when_json_mode_off():
    p, c = make(['Sonuç: {"a": 1} bitti'], use_json_mode=False)
    assert await call(p) == {"a": 1}
    assert "response_format" not in c.calls[0]


async def test_json_mode_sets_response_format_and_mentions_json():
    p, c = make(['{"a": 1}'])
    await call(p)
    kw = c.calls[0]
    assert kw["response_format"] == {"type": "json_object"}
    assert kw["model"] == "gemini-test"
    user_text = kw["messages"][1]["content"][0]["text"]
    assert "JSON" in user_text


async def test_images_go_only_in_user_message():
    p, c = make(['{"a": 1}'])
    await call(p, images=["QUJD"])
    system_msg, user_msg = c.calls[0]["messages"]
    assert system_msg == {"role": "system", "content": "sys"}
    assert user_msg["content"][1] == {
        "type": "image_url",
        "image_url": {"url": "data:image/jpeg;base64,QUJD"},
    }


async def test_reasoning_effort_sent_only_when_set():
    p, c = make(['{"a": 1}'], reasoning_effort="low")
    await call(p)
    assert c.calls[0]["reasoning_effort"] == "low"

    p, c = make(['{"a": 1}'])
    await call(p)
    assert "reasoning_effort" not in c.calls[0]


def _rate_limited():
    req = httpx.Request("POST", "https://llm.example")
    return openai.RateLimitError("quota", response=httpx.Response(429, request=req), body=None)


async def test_moves_to_fallback_model_when_quota_is_exhausted():
    p, c = make([_rate_limited(), '{"a": 1}'], fallback_models=["gemini-lite"])
    assert await call(p) == {"a": 1}
    assert [k["model"] for k in c.calls] == ["gemini-test", "gemini-lite"]


async def test_remembers_exhausted_model():
    p, c = make([_rate_limited(), '{"a": 1}', '{"b": 2}'], fallback_models=["gemini-lite"])
    await call(p)
    await call(p)
    assert [k["model"] for k in c.calls] == ["gemini-test", "gemini-lite", "gemini-lite"]
