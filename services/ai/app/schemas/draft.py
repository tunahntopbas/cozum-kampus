from typing import Literal

from pydantic import BaseModel, Field


class DraftRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field("", max_length=2000)
    category: str = Field("", max_length=40)
    votes: int = Field(0, ge=0)
    status: Literal["yeni", "degerlendiriliyor", "planlandi", "uygulandi", "reddedildi"]


class DraftResult(BaseModel):
    reply: str = Field(max_length=2000)
    ai_pending: bool = False


PENDING_DRAFT = DraftResult(reply="", ai_pending=True)
