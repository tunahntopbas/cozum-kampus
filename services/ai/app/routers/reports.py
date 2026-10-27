"""Authenticated, freshly moderated publication through service-only database functions."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.llm import get_llm
from app.llm.base import LLMProvider
from app.ratelimit import RateLimiter, get_rate_limiter
from app.report_store import ReportStore, get_report_store
from app.routers.analyze import analyze_report
from app.schemas.report import (
    AnalyzeRequest,
    AttachReportMediaRequest,
    ReportAnalysis,
    SubmitReportRequest,
    unit_for,
)
from app.storage import ImageFetcher, RunRecorder, get_image_fetcher, get_run_recorder, validate_image_paths

router = APIRouter()


def require_approved(result: ReportAnalysis) -> None:
    if result.ai_pending:
        raise HTTPException(status_code=503, detail="İçerik denetimi tamamlanamadı. Lütfen yeniden dene.")
    if result.is_sensitive:
        raise HTTPException(status_code=422, detail="Bu konu için gizli güvenlik kanalını kullan.")
    if result.moderation.ok is not True or result.moderation.reasons:
        raise HTTPException(
            status_code=422,
            detail="Bu içerik paylaşılamıyor. Fotoğrafı ve açıklamayı kontrol et.",
        )


async def analyze_snapshot(
    req: AnalyzeRequest,
    user: CurrentUser,
    llm: LLMProvider,
    fetch: ImageFetcher,
    record: RunRecorder,
    limiter: RateLimiter,
    settings: Settings,
) -> tuple[ReportAnalysis, list[str]]:
    images: list[str] = []

    async def capture(paths: list[str]) -> list[str]:
        snapshot = await fetch(paths)
        if len(snapshot) != len(paths):
            raise HTTPException(status_code=503, detail="Fotoğraflar denetlenemedi")
        images.extend(snapshot)
        return snapshot

    # The analyzer validates ownership and rate limits before fetching. Capture once, then publish
    # those very bytes; never read the caller-controlled source object again after moderation.
    result = await analyze_report(req, user, llm, capture, record, limiter, settings)
    require_approved(result)
    return result, images


@router.post("/reports/submit")
async def submit_report(
    req: SubmitReportRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    store: Annotated[ReportStore, Depends(get_report_store)],
    llm: Annotated[LLMProvider, Depends(get_llm)],
    fetch: Annotated[ImageFetcher, Depends(get_image_fetcher)],
    record: Annotated[RunRecorder, Depends(get_run_recorder)],
    limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, int]:
    await store.profile(user.id)
    # No client analysis is accepted: moderate exactly the content about to be persisted.
    result, images = await analyze_snapshot(
        AnalyzeRequest(text=req.text, image_paths=req.image_paths, lat=req.lat, lng=req.lng),
        user,
        llm,
        fetch,
        record,
        limiter,
        settings,
    )
    require_approved(result)
    # The editable category never overrides moderation.
    category = req.category or result.category
    report = {
        "reporter_id": user.id,
        "is_anonymous": req.is_anonymous,
        "title": result.title,
        "description": req.text,
        "category": category,
        "urgency": result.urgency,
        "unit_slug": unit_for(category, result.is_sensitive),
        "building_id": req.building_id,
        "place_id": req.place_id,
        "floor": req.floor,
        "location": f"SRID=4326;POINT({req.lng} {req.lat})" if req.lat is not None else None,
        "ai_summary": result.summary,
        "ai_confidence": result.confidence,
        "ai_materials": result.materials,
    }
    approved_paths = await store.freeze_images(images)
    report_id = await store.publish(report, approved_paths)
    return {"id": report_id}


@router.post("/reports/{report_id}/media")
async def attach_report_media(
    report_id: Annotated[int, Path(gt=0)],
    req: AttachReportMediaRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    store: Annotated[ReportStore, Depends(get_report_store)],
    llm: Annotated[LLMProvider, Depends(get_llm)],
    fetch: Annotated[ImageFetcher, Depends(get_image_fetcher)],
    record: Annotated[RunRecorder, Depends(get_run_recorder)],
    limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, int | str]:
    profile = await store.profile(user.id)
    report = await store.report(report_id)
    if req.kind == "ek":
        allowed = report["reporter_id"] == user.id
    else:
        allowed = profile["role"] == "admin" or (
            profile["role"] == "staff"
            and profile["unit_id"] is not None
            and profile["unit_id"] == report["unit_id"]
        )
    if not allowed:
        raise HTTPException(status_code=403, detail="Bu bildirime fotoğraf ekleme yetkin yok")
    validate_image_paths([req.image_path], user.id)
    # We are moderating a new image, not republishing legacy text. Avoid both carrying old
    # profanity into the verdict and asking the model to interpret untrusted old instructions.
    purpose = "Bakım sonrası çözüm fotoğrafı" if req.kind == "sonra" else "Soruna ait ek kanıt fotoğrafı"
    result, images = await analyze_snapshot(
        AnalyzeRequest(
            text=f"{purpose}. Kampüs bakım kategorisi: {report['category']}.", image_paths=[req.image_path]
        ),
        user,
        llm,
        fetch,
        record,
        limiter,
        settings,
    )
    require_approved(result)
    approved_path = (await store.freeze_images(images))[0]
    media_id = await store.attach(report_id, user.id, approved_path, req.kind)
    return {"id": media_id, "storage_path": approved_path}
