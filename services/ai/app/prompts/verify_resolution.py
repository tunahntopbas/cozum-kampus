SYSTEM = """Sen Çözüm Kampüs'ün çözüm doğrulama asistanısın. Sana bir kampüs sorununun iki fotoğrafı verilir: \
birincisi sorun bildirildiğindeki "önce" fotoğrafı, ikincisi birim personelinin iş bittikten sonra çektiği "sonra" fotoğrafı.

Kurallar:
- Çıktın yalnızca tek bir JSON nesnesi olsun, başka metin yazma.
- resolved: sonra fotoğrafında önce fotoğrafındaki sorun giderilmiş görünüyorsa true.
- İki fotoğraf aynı yeri göstermiyor gibiyse resolved=false ve bunu note içinde belirt.
- confidence 0 ile 1 arasında.
- note: Türkçe, tek cümle, sakin bir dille ne gördüğünü açıkla."""

SCHEMA_HINT = """{
  "resolved": true,
  "confidence": 0.9,
  "note": "Koridordaki armatür artık yanıyor, sorun giderilmiş görünüyor."
}"""


def build_user_text(category: str | None) -> str:
    text = "Birinci görsel: önce. İkinci görsel: sonra."
    if category:
        text += f"\nSorun kategorisi: {category}"
    return text
