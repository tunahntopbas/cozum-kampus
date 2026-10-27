# Tüm Web Arayüzü Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans or subagent-driven-development to implement task-by-task.

**Goal:** Tasarımlardaki 13 web ekranını etkileşimli olarak tamamlamak.
**Architecture:** Mevcut Next.js ve ortak UI korunur; eksik ekranlar kendi alanında yerel demo durumu kullanır, gerçek `/bildir` ve `/hesap` değişmez. Ayrık alanlar paralel hazırlanır.
**Tech Stack:** Next.js 16, React, TypeScript, Tailwind v4, Phosphor, Vitest.
**Spec:** `docs/superpowers/specs/2026-10-27-frontend-design.md`

## Global Constraints
- Görsel kaynak `docs/tasarim/*.dc.html`; eski mobil taslaklar geçersiz.
- Demo verisi açık işaretli, demo değişiklikleri Supabase'e yazılmaz.
- Giriş, `/bildir`, `/hesap` gerçek entegrasyonları korunur.
- Dar ekran, klavye erişimi, boş filtre sonucu ve durum mesajları kapsanır.

## Review Focus
- Demo oylarının tekrarlı tıklamada tutarlılığı.
- Arama sonucunda seçili kayıt yoksa detay paneli.
- Formlarda boş metin ve boş sonuçlar.
- Personel/yönetim gezinmesinde rol koruması.
- Gerçek ve demo veri sınırının kullanıcıya açık olması.

### Task 1: Öğrenci demo ekranları
**Files:** `components/student-demo/*`, `(ogrenci)/{page,bildirimlerim,oneriler,bildirimler}/page.tsx`.
- [x] Tasarım dosyalarını oku ve mevcut bileşenleri kullan.
- [x] Harita+detay, bildirimlerim, öneriler, bildirim merkezi; anlamlı etkileşim testleri.
- [x] Testleri çalıştır ve sonuçları raporla.

### Task 2: Personel ekranları
**Files:** `components/staff-demo/*`, `app/personel/**`.
- [x] Personel tasarımlarını oku; üç sekmeli ortak iskelet.
- [x] İşler, geçmiş, malzeme ve demo iş akışları; davranış testleri.
- [x] Testleri çalıştır ve sonuçları raporla.

### Task 3: Yönetim ekranları
**Files:** `components/admin-demo/*`, `app/yonetim/**`.
- [x] Yönetim tasarımlarını oku; dört sekmeli ortak iskelet.
- [x] Genel bakış, bildirimler, birimler, kampüs sesi; davranış testleri.
- [x] Testleri çalıştır ve sonuçları raporla.

### Task 4: Birleştirme ve doğrulama
**Files:** ortak gezinme/oturum, `docs/durum/frontend.md`.
- [x] Üç alanı birleştir; gerçek ekranların regresyonunu kontrol et.
- [x] `pnpm --filter web test`, `lint`, `typecheck`, `build`.
- [x] Tarayıcıda öğrenci/personel/yönetim ve dar ekran kontrolü; bulunan hataları düzelt.
- [x] Durum dosyaları, commit, push ve PR. Canlı yayın bu UI tesliminden ayrı onaylanır.
