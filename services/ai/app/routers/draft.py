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
from app.privacy import mask_pii
from app.prompts.draft_reply import SCHEMA_HINT, SYSTEM, build_user_text
from app.ratelimit import RateLimiter, get_rate_limiter
from app.schemas.draft import PENDING_DRAFT, DraftRequest, DraftResult
from app.storage import RoleLookup, RunRecorder, elapsed_ms, get_role_lookup, get_run_recorder

router = APIRouter()


@router.post("/ai/draft-reply", response_model=DraftResult)
async def draft_reply(
    req: DraftRequest,
    user: Annotated[CurrentUser, Depends(get_current_user)],
    llm: Annotated[LLMProvider, Depends(get_llm)],
    role_of: Annotated[RoleLookup, Depends(get_role_lookup)],
    record: Annotated[RunRecorder, Depends(get_run_recorder)],
    limiter: Annotated[RateLimiter, Depends(get_rate_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> DraftResult:
    limiter.check(user.id)
    if await role_of(user.id) != "admin":
        raise HTTPException(status_code=403, detail="Bu işlem yalnızca yönetim içindir")

    user_text = build_user_text(mask_pii(req.title), mask_pii(req.body), req.category, req.votes, req.status)
    start = time.monotonic()
    try:
        raw = await asyncio.wait_for(
            llm.complete_json(system=SYSTEM, user_text=user_text, image_b64=None, schema_hint=SCHEMA_HINT),
            timeout=settings.llm_timeout_s,
        )
        result = DraftResult.model_validate({**raw, "ai_pending": False})
        if not result.reply.strip():
            result = PENDING_DRAFT
    except (LLMError, ValidationError, TimeoutError):
        result = PENDING_DRAFT

    await record(
        kind="draft_reply",
        model=settings.llm_model,
        input_hash=hashlib.sha256(user_text.encode()).hexdigest(),
        output=result.model_dump(),
        latency_ms=elapsed_ms(start),
    )
    return result
