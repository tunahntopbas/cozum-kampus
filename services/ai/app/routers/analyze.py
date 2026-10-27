import asyncio
import hashlib
import json
import re
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.fallback import rule_based_analysis, tr_lower
from app.llm import get_llm
from app.llm.base import LLMError, LLMProvider
from app.privacy import mask_pii
from app.prompts.analyze_report import SCHEMA_HINT, SYSTEM, build_user_text
from app.ratelimit import RateLimiter, get_rate_limiter
from app.schemas.report import MAX_IMAGES, AnalyzeRequest, ReportAnalysis, unit_for
from app.storage import (
    ImageFetcher,
    RunRecorder,
    elapsed_ms,
    get_image_fetcher,
    get_run_recorder,
    validate_image_paths,
)

router = APIRouter()


def normalize_model_output(raw: dict) -> ReportAnalysis:
    """Unit is derived from category, never trusted from the model; long titles are trimmed."""
    data = dict(raw)
    data["unit"] = unit_for(str(data.get("category")), bool(data.get("is_sensitive")))
    if isinstance(data.get("title"), str):
        data["title"] = data["title"].strip()[:80]
    data["ai_pending"] = False
    return ReportAnalysis.model_validate(data)


@router.post("/ai/analyze-report", response_model=ReportAnalysis)
async def analyze_report(
    req: AnalyzeRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    llm: Annotated[LLMProvider, Depends(get_llm)],
    fetch: Annotated[ImageFetcher, Depends(get_image_fetcher)],
    record: Annotated[RunRecorder, Depends(get_run_recorder)],
    limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ReportAnalysis:
    limiter.check(user.id)
    if len(req.image_paths) > MAX_IMAGES:
        raise HTTPException(status_code=413, detail=f"En fazla {MAX_IMAGES} fotoğraf gönderilebilir")
    if not req.text.strip() and not req.image_paths:
        raise HTTPException(status_code=400, detail="Bir fotoğraf ya da kısa bir açıklama gerekli")
    validate_image_paths(req.image_paths, user.id)

    images = await fetch(req.image_paths)
    text = mask_pii(req.text)
    user_text = build_user_text(text, req.building_name, req.lat, req.lng)

    start = time.monotonic()
    try:
        raw = await asyncio.wait_for(
            llm.complete_json(system=SYSTEM, user_text=user_text, image_b64=images, schema_hint=SCHEMA_HINT),
            timeout=settings.llm_timeout_s,
        )
        result = normalize_model_output(raw)
    except (LLMError, ValidationError, TimeoutError):
        result = rule_based_analysis(text)

    # A small high-confidence deny rule supplements model moderation; it is not a complete profanity detector.
    if re.search(r"\b(amk|aq|siktir|orospu|yarrak)\b", tr_lower(req.text)):
        result.moderation.ok = False
        result.moderation.reasons.append("Metin küfür içeriyor.")

    input_hash = hashlib.sha256(json.dumps([user_text, req.image_paths]).encode()).hexdigest()
    await record(
        kind="analyze_report",
        model=settings.llm_model,
        input_hash=input_hash,
        output=result.model_dump(),
        latency_ms=elapsed_ms(start),
    )
    return result
