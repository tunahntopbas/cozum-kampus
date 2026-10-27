import httpx
import pytest
from fastapi import HTTPException

from app.config import get_settings
from app.storage import MAX_IMAGE_BYTES, fetch_images, validate_image_paths


def test_validate_accepts_own_paths():
    validate_image_paths(["u-1/a.jpg", "u-1/b.jpg"], "u-1")


@pytest.mark.parametrize("path", ["u-2/a.jpg", "u-1/../u-2/a.jpg", "u-1", "/u-1/a.jpg", "u-10/a.jpg"])
def test_validate_rejects_foreign_or_odd_paths(path):
    with pytest.raises(HTTPException) as e:
        validate_image_paths([path], "u-1")
    assert e.value.status_code == 403


async def test_fetch_images_uses_service_key_and_returns_base64():
    seen = {}

    def handler(req):
        seen["url"] = str(req.url)
        seen["auth"] = req.headers["authorization"]
        return httpx.Response(200, content=b"ABC")

    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    assert await fetch_images(["u-1/a.jpg"], get_settings(), http) == ["QUJD"]
    assert seen == {
        "url": "https://test.supabase.co/storage/v1/object/report-media/u-1/a.jpg",
        "auth": "Bearer service-test",
    }


async def test_fetch_images_rejects_oversized():
    http = httpx.AsyncClient(
        transport=httpx.MockTransport(lambda r: httpx.Response(200, content=b"0" * (MAX_IMAGE_BYTES + 1)))
    )
    with pytest.raises(HTTPException) as e:
        await fetch_images(["u-1/a.jpg"], get_settings(), http)
    assert e.value.status_code == 413


async def test_fetch_images_missing_file_is_400():
    http = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(404)))
    with pytest.raises(HTTPException) as e:
        await fetch_images(["u-1/a.jpg"], get_settings(), http)
    assert e.value.status_code == 400


@pytest.mark.parametrize("path", ["u-1/%2e%2e%2fu-2.jpg", "u-1/a.jpg?x=1", "u-1/a.jpg#x", "u-1/a\\b.jpg"])
def test_photo_owner_cannot_be_bypassed_with_url_metacharacters(path):
    with pytest.raises(HTTPException):
        validate_image_paths([path], "u-1")
