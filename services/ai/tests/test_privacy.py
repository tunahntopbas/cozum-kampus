from app.privacy import mask_pii


def test_mask_pii():
    s = mask_pii("Ara 0532 123 45 67, mail a.b@x.com, TC 12345678901")
    assert "[telefon]" in s and "[e-posta]" in s and "[tc]" in s
    assert "0532" not in s and "a.b@x.com" not in s and "12345678901" not in s


def test_mask_pii_phone_formats():
    for phone in ["+90 532 123 45 67", "05321234567", "532-123-45-67", "+905321234567"]:
        assert mask_pii(f"No: {phone}.") == "No: [telefon]."


def test_mask_pii_keeps_ordinary_text_and_numbers():
    text = "B blok 3. kat 214 numaralı sınıfta lamba yanmıyor, 2 gündür böyle."
    assert mask_pii(text) == text
