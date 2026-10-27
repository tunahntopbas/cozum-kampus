from typing import Literal

from pydantic import BaseModel, Field, StrictBool, model_validator

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
    ok: StrictBool
    reasons: list[str] = []

    @model_validator(mode="after")
    def reject_contradictory_approval(self):
        if self.reasons:
            self.ok = False
        return self


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


class SubmitReportRequest(BaseModel):
    # Never accept client identity, role, visibility, model output or moderation claims.
    model_config = {"extra": "forbid"}

    text: str = Field("", max_length=2000)
    image_paths: list[str] = Field(default_factory=list, max_length=MAX_IMAGES)
    is_anonymous: StrictBool = False
    building_id: int | None = Field(None, gt=0)
    place_id: int | None = Field(None, gt=0)
    floor: int | None = None
    lat: float | None = Field(None, ge=-90, le=90)
    lng: float | None = Field(None, ge=-180, le=180)
    category: Category | None = None

    @model_validator(mode="after")
    def require_content_and_location(self):
        if not self.text.strip() and not self.image_paths:
            raise ValueError("Bir fotoğraf ya da açıklama gerekli")
        if (self.lat is None) != (self.lng is None):
            raise ValueError("Konum koordinatları eksik")
        if self.building_id is None and self.lat is None:
            raise ValueError("Konum gerekli")
        return self


class AttachReportMediaRequest(BaseModel):
    model_config = {"extra": "forbid"}

    image_path: str = Field(min_length=1, max_length=240)
    kind: Literal["ek", "sonra"]
