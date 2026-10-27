from typing import Literal

from pydantic import BaseModel, Field

Category = Literal[
    "aydinlatma",
    "su_tesisat",
    "asansor_erisilebilirlik",
    "internet_ag",
    "temizlik",
    "mobilya",
    "isitma_sogutma",
    "guvenlik",
    "diger",
]
Urgency = Literal["dusuk", "orta", "acil"]
UnitSlug = Literal["yapi_isleri", "bilgi_islem", "temizlik", "yemekhane", "guvenlik"]

CATEGORY_TO_UNIT: dict[str, UnitSlug] = {
    "internet_ag": "bilgi_islem",
    "temizlik": "temizlik",
    "guvenlik": "guvenlik",
}
DEFAULT_UNIT: UnitSlug = "yapi_isleri"
MAX_IMAGES = 3


def unit_for(category: str, is_sensitive: bool) -> UnitSlug:
    if is_sensitive:
        return "guvenlik"
    return CATEGORY_TO_UNIT.get(category, DEFAULT_UNIT)


class Moderation(BaseModel):
    ok: bool
    reasons: list[str] = []


class AnalyzeRequest(BaseModel):
    text: str = Field("", max_length=2000)
    image_paths: list[str] = Field(default_factory=list)
    lat: float | None = None
    lng: float | None = None
    building_name: str | None = Field(None, max_length=120)


class ReportAnalysis(BaseModel):
    title: str = Field(max_length=80)
    category: Category
    urgency: Urgency
    unit: UnitSlug
    summary: str
    materials: list[str] = []
    is_sensitive: bool = False
    moderation: Moderation
    confidence: float = Field(ge=0, le=1)
    ai_pending: bool = False
