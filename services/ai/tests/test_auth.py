import httpx
import pytest
from fastapi import HTTPException

from app.auth import clear_user_cache, get_current_user
from app.config import get_settings


def _http(handler) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


@pytest.fixture(autouse=True)
def _fresh_cache():
    clear_user_cache()


async def test_get_current_user_returns_user_on_200():
    seen = {}

    def handler(req: httpx.Request) -> httpx.Response:
        seen["url"] = str(req.url)
        seen["auth"] = req.headers["authorization"]
        seen["apikey"] = req.headers["apikey"]
        return httpx.Response(200, json={"id": "u-1", "email": "a@ogr.sakarya.edu.tr"})

    user = await get_current_user("Bearer tok", get_settings(), _http(handler))
    assert user.id == "u-1"
    assert seen == {
        "url": "https://test.supabase.co/auth/v1/user",
        "auth": "Bearer tok",
        "apikey": "anon-test",
    }


async def test_get_current_user_raises_401_on_bad_token():
    http = _http(lambda req: httpx.Response(401, json={"msg": "invalid"}))
    with pytest.raises(HTTPException) as e:
        await get_current_user("Bearer bad", get_settings(), http)
    assert e.value.status_code == 401


async def test_get_current_user_rejects_non_bearer_header():
    http = _http(lambda req: httpx.Response(200, json={"id": "u-1"}))
    with pytest.raises(HTTPException) as e:
        await get_current_user("tok", get_settings(), http)
    assert e.value.status_code == 401


async def test_get_current_user_caches_valid_token():
    calls = []

    def handler(req):
        calls.append(1)
        return httpx.Response(200, json={"id": "u-1", "email": None})

    http = _http(handler)
    await get_current_user("Bearer tok", get_settings(), http)
    await get_current_user("Bearer tok", get_settings(), http)
    assert len(calls) == 1


async def test_get_current_user_returns_503_when_supabase_unreachable():
    def handler(req):
        raise httpx.ConnectError("down")

    with pytest.raises(HTTPException) as e:
        await get_current_user("Bearer tok", get_settings(), _http(handler))
    assert e.value.status_code == 503
