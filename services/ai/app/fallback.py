import re

from app.schemas.report import Moderation, ReportAnalysis, unit_for

# Ordered: the first category whose pattern matches wins.
# Patterns match word starts so "su" does not hit "sunucu".
_CATEGORY_PATTERNS: list[tuple[str, str]] = [
    ("aydinlatma", r"\b(lamba|ampul|ışık|aydınlat|floresan|armatür)"),
    ("su_tesisat", r"\b(su|suyu|sular)\b|\b(musluk|sızıntı|sızdır|tuvalet|lavabo|tıkan|kanalizasyon|boru)"),
    ("asansor_erisilebilirlik", r"\b(asansör|rampa|engelli|otomatik kapı)"),
    ("internet_ag", r"\b(wi-?fi|internet|eduroam|kablosuz)|\bağ\b"),
    ("temizlik", r"\b(çöp|kirli|pislik|temiz|koku)"),
    ("mobilya", r"\b(sıra|masa|sandalye|dolap|kapı kolu|tahta)"),
    ("isitma_sogutma", r"\b(kalorifer|klima|ısıtma|ısınma|petek|soğuk|sıcak)"),
    ("guvenlik", r"\b(güvenlik|hırsız|karanlık yol|kamera)"),
]
_URGENT = re.compile(r"\b(kablo|yangın|duman|mahsur|kıvılcım|elektrik çarp|yaralan|gaz kokusu)")
_SENSITIVE = re.compile(r"\b(taciz|şiddet|intihar|kendime zarar|tehdit|saldırı)")


def tr_lower(text: str) -> str:
    return text.replace("İ", "i").replace("I", "ı").lower()


def rule_based_analysis(text: str) -> ReportAnalysis:
    """Used when the model is unavailable: the report is still filed and marked as awaiting AI analysis."""
    low = tr_lower(text)
    category = next((c for c, p in _CATEGORY_PATTERNS if re.search(p, low)), "diger")
    sensitive = bool(_SENSITIVE.search(low))
    if sensitive:
        category = "guvenlik"
    stripped = text.strip()
    return ReportAnalysis(
        title=stripped[:60] or "Yeni bildirim",
        category=category,
        urgency="acil" if _URGENT.search(low) else "orta",
        unit=unit_for(category, sensitive),
        summary=stripped[:280],
        materials=[],
        is_sensitive=sensitive,
        moderation=Moderation(ok=True, reasons=[]),
        confidence=0,
        ai_pending=True,
    )
