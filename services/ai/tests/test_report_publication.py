import httpx
import pytest
from fastapi.testclient import TestClient

from app.auth import get_http_client
from app.llm.base import LLMError
from app.main import app
from tests.test_analyze import VALID


@pytest.fixture
def publication_http(client):
    class State(list):
        profile = {"id": "u-1", "role": "student", "unit_id": None}
        report = {
            "id": 42,
            "reporter_id": "u-1",
            "unit_id": 1,
            "title": "Lamba",
            "description": "Lamba yanmıyor",
            "category": "aydinlatma",
        }
        fail_write = False
        snapshots = None

    writes = State()
    writes.snapshots = []

    def handle(req):
        if req.url.path.startswith("/storage/v1/object/"):
            writes.snapshots.append(req)
            return httpx.Response(200, json={"Key": "snapshot"})
        if req.url.path.endswith("/profiles"):
            return httpx.Response(200, json=[writes.profile] if writes.profile else [])
        if req.url.path.endswith("/reports"):
            return httpx.Response(200, json=[writes.report] if writes.report else [])
        writes.append(req)
        return (
            httpx.Response(503, json={"error": "private database detail"})
            if writes.fail_write
            else httpx.Response(200, json=42)
        )

    app.dependency_overrides[get_http_client] = lambda: httpx.AsyncClient(
        transport=httpx.MockTransport(handle)
    )
    return writes


def submit(client, **overrides):
    return client.post(
        "/reports/submit",
        json={
            "text": "Lamba yanmıyor",
            "image_paths": ["u-1/synthetic.jpg"],
            "building_id": 1,
            "is_anonymous": False,
            **overrides,
        },
    )


def test_publication_reanalyzes_exact_inputs_and_writes_as_service(client, fake_llm, publication_http):
    import json

    fake_llm.responses.append(VALID)
    response = submit(client, text="Yeni açıklama")
    assert response.status_code == 200
    assert response.json() == {"id": 42}
    assert "Yeni açıklama" in fake_llm.calls[0]["user_text"]
    assert fake_llm.calls[0]["image_b64"] == ["QUJD"]
    assert len(publication_http) == 1
    req = publication_http[0]
    assert req.url.path.endswith("/rpc/publish_moderated_report")
    assert req.headers["authorization"] == "Bearer service-test"
    payload = json.loads(req.content)
    assert payload["p_report"]["reporter_id"] == "u-1"
    assert payload["p_report"]["description"] == "Yeni açıklama"
    assert payload["p_report"]["title"] == VALID["title"]
    assert len(payload["p_image_paths"]) == 1
    assert payload["p_image_paths"][0].startswith("moderated/")
    assert publication_http.snapshots[0].content == b"ABC"
    assert publication_http.snapshots[0].headers["x-upsert"] == "false"


@pytest.mark.parametrize(
    "claims",
    [
        {"reporter_id": "u-2"},
        {"role": "admin"},
        {"is_hidden": False},
        {"analysis": VALID},
        {"moderation": {"ok": True}},
        {"unit_id": 5},
    ],
)
def test_publication_rejects_forged_claims(client, fake_llm, publication_http, claims):
    assert submit(client, **claims).status_code == 422
    assert not publication_http
    assert not fake_llm.calls


@pytest.mark.parametrize(
    "result,status",
    [
        ({**VALID, "moderation": {"ok": False, "reasons": ["portrait"]}}, 422),
        (LLMError("unavailable"), 503),
        ({**VALID, "category": "invalid"}, 503),
    ],
)
def test_unapproved_content_never_reaches_database(client, fake_llm, publication_http, result, status):
    fake_llm.responses.append(result)
    assert submit(client).status_code == status
    assert not publication_http


def test_publication_rejects_foreign_photo_before_model(client, fake_llm, publication_http):
    assert submit(client, image_paths=["u-2/synthetic.jpg"]).status_code == 403
    assert not publication_http
    assert not fake_llm.calls


def test_publication_requires_auth():
    with TestClient(app) as client:
        assert client.post("/reports/submit", json={"text": "Lamba", "building_id": 1}).status_code in (
            401,
            422,
        )


def test_extra_photo_reanalyzes_before_attachment(client, fake_llm, publication_http):
    fake_llm.responses.append(VALID)
    response = client.post("/reports/42/media", json={"image_path": "u-1/new.jpg", "kind": "ek"})
    assert response.status_code == 200
    assert len(fake_llm.calls) == 1
    assert publication_http[0].url.path.endswith("/rpc/attach_moderated_report_media")


def test_extra_photo_denial_does_not_attach(client, fake_llm, publication_http):
    fake_llm.responses.append({**VALID, "moderation": {"ok": False, "reasons": ["portrait"]}})
    assert (
        client.post("/reports/42/media", json={"image_path": "u-1/new.jpg", "kind": "ek"}).status_code == 422
    )
    assert not publication_http


def test_student_cannot_attach_solution_photo(client, fake_llm, publication_http):
    assert (
        client.post("/reports/42/media", json={"image_path": "u-1/new.jpg", "kind": "sonra"}).status_code
        == 403
    )
    assert not fake_llm.calls
    assert not publication_http


@pytest.mark.parametrize("profile", [None, {"role": "unknown", "unit_id": None}])
def test_profile_is_required_despite_valid_auth(client, fake_llm, publication_http, profile):
    publication_http.profile = profile
    assert submit(client).status_code == 403
    assert not publication_http
    assert not fake_llm.calls


def test_nonowner_cannot_attach_even_to_public_report(client, fake_llm, publication_http):
    publication_http.report = {**publication_http.report, "reporter_id": "u-2"}
    assert (
        client.post("/reports/42/media", json={"image_path": "u-1/new.jpg", "kind": "ek"}).status_code == 403
    )
    assert not publication_http
    assert not fake_llm.calls


@pytest.mark.parametrize("unit,expected", [(1, 200), (2, 403), (None, 403)])
def test_solution_photo_requires_server_verified_staff_unit(
    client, fake_llm, publication_http, unit, expected
):
    publication_http.profile = {"role": "staff", "unit_id": unit}
    fake_llm.responses.append(VALID)
    assert (
        client.post("/reports/42/media", json={"image_path": "u-1/new.jpg", "kind": "sonra"}).status_code
        == expected
    )
    assert len(publication_http) == (1 if expected == 200 else 0)


def test_persistence_failure_is_not_a_publication_success(client, fake_llm, publication_http):
    publication_http.fail_write = True
    fake_llm.responses.append(VALID)
    response = submit(client)
    assert response.status_code == 503
    assert "private database detail" not in response.text


def test_source_mutation_during_moderation_cannot_change_published_bytes(client, publication_http):
    from app.llm import get_llm
    from app.storage import get_image_fetcher

    source = ["QUJD"]
    fetches = []

    async def fetch(paths):
        fetches.append(list(paths))
        return list(source)

    class MutatingModel:
        async def complete_json(self, **kwargs):
            assert kwargs["image_b64"] == ["QUJD"]
            source[0] = "REVG"  # Source deleted/reuploaded during moderation: DEF instead of ABC.
            return VALID

    app.dependency_overrides[get_image_fetcher] = lambda: fetch
    app.dependency_overrides[get_llm] = lambda: MutatingModel()
    assert submit(client).status_code == 200
    assert len(fetches) == 1
    assert publication_http.snapshots[0].content == b"ABC"


def test_sensitive_content_is_never_published(client, fake_llm, publication_http):
    fake_llm.responses.append({**VALID, "is_sensitive": True})
    assert submit(client).status_code == 422
    assert not publication_http
    assert not publication_http.snapshots


def test_clean_solution_is_not_rejected_for_legacy_profane_description(client, fake_llm, publication_http):
    publication_http.profile = {"role": "staff", "unit_id": 1}
    publication_http.report = {**publication_http.report, "description": "Lamba yanmıyor amk"}
    fake_llm.responses.append(VALID)
    response = client.post("/reports/42/media", json={"image_path": "u-1/new.jpg", "kind": "sonra"})
    assert response.status_code == 200
    assert "amk" not in fake_llm.calls[0]["user_text"]
