import re

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_PHONE = re.compile(r"(?<![\d+])(?:\+90[\s-]?|0)?5\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)")
_TC = re.compile(r"(?<!\d)[1-9]\d{10}(?!\d)")


def mask_pii(text: str) -> str:
    """Masks e-mails, Turkish mobile numbers and national ID numbers before text reaches the model."""
    text = _EMAIL.sub("[e-posta]", text)
    text = _PHONE.sub("[telefon]", text)
    return _TC.sub("[tc]", text)
