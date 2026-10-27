import pytest

from app.fallback import rule_based_analysis


@pytest.mark.parametrize(
    ("text", "category"),
    [
        ("Koridorda lamba yanmıyor", "aydinlatma"),
        ("3. kat tuvaletinde musluk akıyor", "su_tesisat"),
        ("B blok asansörü çalışmıyor", "asansor_erisilebilirlik"),
        ("Kütüphanede Wi-Fi yok", "internet_ag"),
        ("Kantinin önü çöp dolu", "temizlik"),
        ("Sınıftaki SANDALYE kırık", "mobilya"),
        ("Amfide kalorifer yanmıyor, çok soğuk", "isitma_sogutma"),
        ("Bir şey oldu", "diger"),
    ],
)
def test_rule_based_category(text, category):
    assert rule_based_analysis(text).category == category


def test_rule_based_does_not_match_su_inside_words():
    assert rule_based_analysis("Sunucu odasında kusur var").category == "diger"


def test_rule_based_marks_dangerous_as_acil():
    a = rule_based_analysis("Elektrik kablosu açıkta duruyor")
    assert a.urgency == "acil"


def test_rule_based_marks_sensitive_and_routes_to_guvenlik():
    a = rule_based_analysis("Yurtta taciz yaşadım")
    assert a.is_sensitive is True
    assert a.unit == "guvenlik"


def test_rule_based_shape():
    a = rule_based_analysis("")
    assert a.ai_pending is True
    assert a.title == "Yeni bildirim"
    assert a.confidence == 0
    assert a.moderation.ok is True
