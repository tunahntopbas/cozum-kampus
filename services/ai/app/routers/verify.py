import asyncio
import hashlib
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError

from app.auth import CurrentUser, get_current_user
from app.config import Settings, get_settings
from app.llm import get_llm
from app.llm.base import LLMError, LLMProvider
from app.prompts.verify_resolution import SCHEMA_HINT, SYSTEM, build_user_text
from app.ratelimit import RateLimiter, get_rate_limiter
from app.schemas.resolution import PENDING_RESULT, VerifyRequest, VerifyResult
from app.storage import (
    ImageFetcher,
    RoleLookup,
    RunRecorder,
    elapsed_ms,
    get_image_fetcher,
    get_role_lookup,
    get_run_recorder,
    validate_image_paths,
    validate_path_format,
)

router = APIRouter()

STAFF_ROLES = {"staff", "admin"}


@router.post("/ai/verify-resolution", response_model=VerifyResult)
async def verify_resolution(
    req: VerifyRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    llm: Annotated[LLMProvider, Depends(get_llm)],
    fetch: Annotated[ImageFetcher, Depends(get_image_fetcher)],
    role_of: Annotated[RoleLookup, Depends(get_role_lookup)],
    record: Annotated[RunRecorder, Depends(get_run_recorder)],
    limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> VerifyResult:
    limiter.check(user.id)
    # The "before" photo lives in the reporting student's folder, so ownership is checked by role instead.
    if await role_of(user.id) not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Bu işlem yalnızca birim personeli içindir")
    validate_path_format(req.before_path)
    validate_image_paths([req.after_path], user.id)

    images = await fetch([req.before_path, req.after_path])
    start = time.monotonic()
    try:
        raw = await asyncio.wait_for(
            llm.complete_json(
                system=SYSTEM,
                user_text=build_user_text(req.category),
                image_b64=images,
                schema_hint=SCHEMA_HINT,
            ),
            timeout=settings.llm_timeout_s,
        )
        result = VerifyResult.model_validate({**raw, "ai_pending": False})
    except (LLMError, ValidationError, TimeoutError):
        result = PENDING_RESULT

    await record(
        kind="verify_resolution",
        model=settings.llm_model,
        input_hash=hashlib.sha256(f"{req.before_path}|{req.after_path}".encode()).hexdigest(),
        output=result.model_dump(),
        latency_ms=elapsed_ms(start),
    )
    return result
