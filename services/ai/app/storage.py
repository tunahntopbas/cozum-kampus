import base64
import re
import time
from collections.abc import Awaitable, Callable
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException

from app.auth import get_http_client
from app.config import Settings, get_settings

BUCKET = "report-media"
MAX_IMAGE_BYTES = 5 * 1024 * 1024

ImageFetcher = Callable[[list[str]], Awaitable[list[str]]]
RunRecorder = Callable[..., Awaitable[None]]


def _service_headers(settings: Settings) -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {"apikey": key, "Authorization": f"Bearer {key}"}


def _path_owner(path: str) -> str | None:
    """Returns the owner folder of a '<user_id>/<file>' path, or None if the path has any other shape."""
    # Paths are identifiers, never URLs. Encoded separators, query strings and backslashes
    # would make the HTTP fetch resolve a different object than the ownership check saw.
    if not re.fullmatch(r"[A-Za-z0-9_-]+/[A-Za-z0-9_.-]+", path):
        return None
    parts = path.split("/")
    if len(parts) != 2 or not parts[0] or not parts[1] or {".", ".."} & set(parts):
        return None
    return parts[0]


def validate_path_format(path: str) -> None:
    if _path_owner(path) is None:
        raise HTTPException(status_code=403, detail="Bu fotoğrafa erişim izni yok")


def validate_image_paths(paths: list[str], user_id: str) -> None:
    """Users may only send photos from their own Storage folder."""
    for path in paths:
        if _path_owner(path) != user_id:
            raise HTTPException(status_code=403, detail="Bu fotoğrafa erişim izni yok")


async def fetch_images(paths: list[str], settings: Settings, http: httpx.AsyncClient) -> list[str]:
    out = []
    for path in paths:
        r = await http.get(
            f"{settings.supabase_url}/storage/v1/object/{BUCKET}/{path}", headers=_service_headers(settings)
        )
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail="Fotoğraf bulunamadı")
        if len(r.content) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Fotoğraf çok büyük")
        out.append(base64.b64encode(r.content).decode())
    return out


def get_image_fetcher(
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> ImageFetcher:
    return lambda paths: fetch_images(paths, settings, http)


async def get_user_role(user_id: str, settings: Settings, http: httpx.AsyncClient) -> str | None:
    r = await http.get(
        f"{settings.supabase_url}/rest/v1/profiles",
        params={"id": f"eq.{user_id}", "select": "role"},
        headers=_service_headers(settings),
    )
    rows = r.json() if r.status_code == 200 else []
    return rows[0]["role"] if rows else None


RoleLookup = Callable[[str], Awaitable[str | None]]


def get_role_lookup(
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> RoleLookup:
    return lambda user_id: get_user_role(user_id, settings, http)


def get_run_recorder(
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> RunRecorder:
    async def record(*, kind: str, model: str, input_hash: str, output: dict, latency_ms: int) -> None:
        # Logging must never break the user-facing response.
        try:
            await http.post(
                f"{settings.supabase_url}/rest/v1/ai_runs",
                json={
                    "kind": kind,
                    "model": model,
                    "input_hash": input_hash,
                    "output": output,
                    "latency_ms": latency_ms,
                },
                headers={**_service_headers(settings), "Prefer": "return=minimal"},
            )
        except httpx.HTTPError:
            pass

    return record


def elapsed_ms(start: float) -> int:
    return int((time.monotonic() - start) * 1000)
