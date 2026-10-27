import pytest

from app.llm.base import LLMError
from app.main import app
from app.storage import get_role_lookup

BODY = {"before_path": "ogrenci-1/once.jpg", "after_path": "u-1/sonra.jpg", "category": "aydinlatma"}


@pytest.fixture
def role(client):
    current = {"role": "staff"}

    async def lookup(user_id):
        return current["role"]

    app.dependency_overrides[get_role_lookup] = lambda: lookup
    return current


def test_verify_returns_model_result(client, fake_llm, role):
    fake_llm.responses.append({"resolved": True, "confidence": 0.9, "note": "Lamba yanıyor"})
    r = client.post("/ai/verify-resolution", json=BODY)
    assert r.status_code == 200
    assert r.json() == {"resolved": True, "confidence": 0.9, "note": "Lamba yanıyor", "ai_pending": False}
    assert fake_llm.calls[0]["image_b64"] == ["QUJD", "QUJD"]


def test_verify_forbidden_for_student(client, fake_llm, role):
    role["role"] = "student"
    assert client.post("/ai/verify-resolution", json=BODY).status_code == 403
    assert fake_llm.calls == []


def test_verify_allowed_for_admin(client, fake_llm, role):
    role["role"] = "admin"
    fake_llm.responses.append({"resolved": False, "confidence": 0.7, "note": "Hâlâ karanlık"})
    assert client.post("/ai/verify-resolution", json=BODY).json()["resolved"] is False


def test_verify_after_photo_must_be_own(client, fake_llm, role):
    r = client.post("/ai/verify-resolution", json={**BODY, "after_path": "baskasi/sonra.jpg"})
    assert r.status_code == 403


def test_verify_rejects_malformed_before_path(client, fake_llm, role):
    r = client.post("/ai/verify-resolution", json={**BODY, "before_path": "../gizli.jpg"})
    assert r.status_code == 403


def test_verify_falls_back_on_llm_error(client, fake_llm, role):
    fake_llm.responses.append(LLMError("boom"))
    body = client.post("/ai/verify-resolution", json=BODY).json()
    assert body["ai_pending"] is True
    assert body["resolved"] is False


def test_verify_falls_back_on_invalid_output(client, fake_llm, role):
    fake_llm.responses.append({"resolved": "belki"})
    assert client.post("/ai/verify-resolution", json=BODY).json()["ai_pending"] is True


def test_verify_prompt_puts_category_on_its_own_line():
    from app.prompts.verify_resolution import build_user_text

    assert build_user_text("aydinlatma").splitlines()[-1] == "Sorun kategorisi: aydinlatma"
