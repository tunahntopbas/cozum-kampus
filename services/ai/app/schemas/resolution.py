from pydantic import BaseModel, Field


class VerifyRequest(BaseModel):
    before_path: str
    after_path: str
    category: str | None = Field(None, max_length=40)


class VerifyResult(BaseModel):
    resolved: bool
    confidence: float = Field(ge=0, le=1)
    note: str
    ai_pending: bool = False


PENDING_RESULT = VerifyResult(
    resolved=False,
    confidence=0,
    note="Doğrulama şu an yapılamadı, kayıt elle incelenecek.",
    ai_pending=True,
)
