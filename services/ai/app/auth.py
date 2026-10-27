import hashlib
import time
from typing import Annotated

import httpx
from fastapi import Depends, Header, HTTPException
from pydantic import BaseModel

from app.config import Settings, get_settings

CACHE_TTL_S = 60


class CurrentUser(BaseModel):
    id: str
    email: str | None = None


_http_client: httpx.AsyncClient | None = None
_user_cache: dict[str, tuple[float, CurrentUser]] = {}


def get_http_client() -> httpx.AsyncClient:
    global _http_client
    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=10)
    return _http_client


def clear_user_cache() -> None:
    _user_cache.clear()


async def get_current_user(
    authorization: Annotated[str, Header()],
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> CurrentUser:
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Oturum bulunamadı")

    key = hashlib.sha256(token.encode()).hexdigest()
    cached = _user_cache.get(key)
    if cached and time.monotonic() - cached[0] < CACHE_TTL_S:
        return cached[1]

    try:
        r = await http.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"},
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail="Kimlik doğrulama servisine ulaşılamadı") from e
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Oturum geçersiz")

    data = r.json()
    user = CurrentUser(id=data["id"], email=data.get("email"))
    _user_cache[key] = (time.monotonic(), user)
    return user
