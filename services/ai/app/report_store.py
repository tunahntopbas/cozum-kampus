"""Service-role persistence for moderated reports. Never return database error bodies to clients."""

import base64
from typing import Annotated
from uuid import uuid4

import httpx
from fastapi import Depends, HTTPException

from app.auth import get_http_client
from app.config import Settings, get_settings
from app.storage import _service_headers


class ReportStore:
    def __init__(self, settings: Settings, http: httpx.AsyncClient):
        self.settings = settings
        self.http = http

    async def _request(self, method: str, resource: str, **kwargs):
        try:
            response = await self.http.request(
                method,
                f"{self.settings.supabase_url}/rest/v1/{resource}",
                headers=_service_headers(self.settings),
                **kwargs,
            )
            if not response.is_success:
                raise HTTPException(status_code=503, detail="Bildirim işlemi tamamlanamadı")
            return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(status_code=503, detail="Bildirim servisine ulaşılamadı") from exc

    async def profile(self, user_id: str) -> dict:
        rows = await self._request(
            "GET",
            "profiles",
            params={"id": f"eq.{user_id}", "select": "role,unit_id"},
        )
        if not rows or rows[0]["role"] not in {"student", "staff", "admin", "security"}:
            raise HTTPException(status_code=403, detail="Bildirim yetkisi bulunamadı")
        return rows[0]

    async def report(self, report_id: int) -> dict:
        rows = await self._request(
            "GET",
            "reports",
            params={
                "id": f"eq.{report_id}",
                "select": "id,reporter_id,unit_id,title,description,category",
            },
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
        return rows[0]

    async def freeze_images(self, images: list[str]) -> list[str]:
        """Persist the exact moderated bytes under a server-only, immutable Storage namespace."""
        paths = []
        for image in images:
            path = f"moderated/{uuid4()}.jpg"
            try:
                response = await self.http.post(
                    f"{self.settings.supabase_url}/storage/v1/object/report-media/{path}",
                    headers={
                        **_service_headers(self.settings),
                        "Content-Type": "image/jpeg",
                        "x-upsert": "false",
                    },
                    content=base64.b64decode(image, validate=True),
                )
                if not response.is_success:
                    raise HTTPException(status_code=503, detail="Fotoğraf güvenle kaydedilemedi")
            except (httpx.HTTPError, ValueError) as exc:
                raise HTTPException(status_code=503, detail="Fotoğraf güvenle kaydedilemedi") from exc
            paths.append(path)
        return paths

    async def publish(self, report: dict, image_paths: list[str]) -> int:
        return await self._request(
            "POST",
            "rpc/publish_moderated_report",
            json={
                "p_report": report,
                "p_image_paths": image_paths,
            },
        )

    async def attach(self, report_id: int, actor_id: str, path: str, kind: str) -> int:
        return await self._request(
            "POST",
            "rpc/attach_moderated_report_media",
            json={
                "p_report_id": report_id,
                "p_actor_id": actor_id,
                "p_image_path": path,
                "p_kind": kind,
            },
        )


def get_report_store(
    settings: Annotated[Settings, Depends(get_settings)],
    http: Annotated[httpx.AsyncClient, Depends(get_http_client)],
) -> ReportStore:
    return ReportStore(settings, http)
