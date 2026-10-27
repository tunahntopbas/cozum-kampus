import pytest

from app.llm.base import LLMError
from app.main import app
from app.storage import get_role_lookup

BODY = {
    "title": "Kütüphane final haftasında sabaha kadar açık kalsın",
    "body": "Final haftasında çalışacak yer bulamıyoruz. Ali Yılmaz 0555 123 45 67",
    "category": "Kütüphane",
    "votes": 412,
    "status": "planlandi",
}


@pytest.fixture
def role(client):
    current = {"role": "admin"}

    async def lookup(user_id):
        return current["role"]

    app.dependency_overrides[get_role_lookup] = lambda: lookup
    return current


def test_draft_returns_model_text(client, fake_llm, role, recorded_runs):
    fake_llm.responses.append({"reply": "Önerinizi planlamaya aldık."})
    r = client.post("/ai/draft-reply", json=BODY)
    assert r.status_code == 200
    assert r.json() == {"reply": "Önerinizi planlamaya aldık.", "ai_pending": False}
    call = fake_llm.calls[0]
    assert call["image_b64"] is None
    assert "412" in call["user_text"] and "Planlandı" in call["user_text"]
    assert "0555" not in call["user_text"]
    assert recorded_runs[0]["kind"] == "draft_reply"


def test_draft_is_admin_only(client, fake_llm, role):
    role["role"] = "staff"
    assert client.post("/ai/draft-reply", json=BODY).status_code == 403
    assert fake_llm.calls == []


def test_draft_falls_back_on_llm_error(client, fake_llm, role):
    fake_llm.responses.append(LLMError("boom"))
    body = client.post("/ai/draft-reply", json=BODY).json()
    assert body["ai_pending"] is True
    assert body["reply"] == ""


def test_draft_rejects_overlong_reply(client, fake_llm, role):
    fake_llm.responses.append({"reply": "x" * 2001})
    assert client.post("/ai/draft-reply", json=BODY).json()["ai_pending"] is True
