import asyncio

from app.config import get_settings
from app.llm import get_llm
from app.llm.base import LLMError
from app.main import app

VALID = {
    "title": "Koridor lambası yanmıyor",
    "category": "aydinlatma",
    "urgency": "orta",
    "unit": "yapi_isleri",
    "summary": "Tavandaki floresan armatür yanmıyor.",
    "materials": ["LED tüp 18 W"],
    "is_sensitive": False,
    "moderation": {"ok": True, "reasons": []},
    "confidence": 0.94,
}


def post(client, **body):
    body.setdefault("text", "Koridorda lamba yanmıyor")
    return client.post("/ai/analyze-report", json=body)


def test_analyze_returns_model_output(client, fake_llm):
    fake_llm.responses.append(VALID)
    r = post(client, image_paths=["u-1/a.jpg"])
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "aydinlatma"
    assert body["ai_pending"] is False
    assert fake_llm.calls[0]["image_b64"] == ["QUJD"]


def test_analyze_falls_back_on_invalid_category(client, fake_llm):
    fake_llm.responses.append({**VALID, "category": "elektrik"})
    r = post(client)
    assert r.status_code == 200
    assert r.json()["ai_pending"] is True


def test_analyze_falls_back_on_llm_error(client, fake_llm):
    fake_llm.responses.append(LLMError("boom"))
    r = post(client, text="3. kat tuvaletinde musluk akıyor")
    assert r.status_code == 200
    body = r.json()
    assert body["category"] == "su_tesisat"
    assert body["ai_pending"] is True


def test_analyze_falls_back_when_llm_too_slow(client):
    class Slow:
        async def complete_json(self, **kw):
            await asyncio.sleep(1)
            return VALID

    settings = get_settings().model_copy(update={"llm_timeout_s": 0.05})
    app.dependency_overrides[get_llm] = lambda: Slow()
    app.dependency_overrides[get_settings] = lambda: settings
    r = post(client)
    assert r.status_code == 200
    assert r.json()["ai_pending"] is True


def test_analyze_sensitive_routes_to_guvenlik(client, fake_llm):
    fake_llm.responses.append({**VALID, "is_sensitive": True})
    assert post(client).json()["unit"] == "guvenlik"


def test_analyze_overrides_model_unit(client, fake_llm):
    fake_llm.responses.append({**VALID, "category": "internet_ag", "unit": "yapi_isleri"})
    assert post(client).json()["unit"] == "bilgi_islem"


def test_analyze_tolerates_unknown_unit_and_long_title(client, fake_llm):
    fake_llm.responses.append({**VALID, "unit": "elektrik_birimi", "title": "x" * 200})
    body = post(client).json()
    assert body["ai_pending"] is False
    assert body["unit"] == "yapi_isleri"
    assert len(body["title"]) <= 80


def test_analyze_masks_pii_before_llm(client, fake_llm):
    fake_llm.responses.append(VALID)
    post(client, text="Lamba yanmıyor, beni 0532 123 45 67 numarasından arayın")
    assert "0532" not in fake_llm.calls[-1]["user_text"]


def test_analyze_rejects_foreign_image_path(client, fake_llm):
    r = post(client, image_paths=["baska-kullanici/x.jpg"])
    assert r.status_code == 403
    assert fake_llm.calls == []


def test_analyze_rejects_too_many_images(client, fake_llm):
    r = post(client, image_paths=[f"u-1/{i}.jpg" for i in range(4)])
    assert r.status_code == 413


def test_analyze_requires_text_or_image(client, fake_llm):
    r = post(client, text="   ")
    assert r.status_code == 400


def test_analyze_records_run(client, fake_llm, recorded_runs):
    fake_llm.responses.append(VALID)
    post(client)
    assert recorded_runs[0]["kind"] == "analyze_report"
    assert "u-1" not in str(recorded_runs[0])


def test_analyze_requires_auth():
    from fastapi.testclient import TestClient

    with TestClient(app) as c:
        r = c.post("/ai/analyze-report", json={"text": "lamba"})
    assert r.status_code in (401, 422)
