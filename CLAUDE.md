# Çözüm Kampüs: Claude için çalışma kuralları

Bu depo 3 kişilik bir ekip tarafından, farklı Claude oturumlarında paralel olarak geliştiriliyor. Oturumlar arasında hafıza yok; süreklilik yalnızca bu dosyalarla sağlanır.

## Oturum başında (her zaman, ilk iş)

1. `docs/durum/README.md` dosyasını oku: hatlar, kim hangi hatta, genel durum.
2. Kullanıcıya hangi hatta çalıştığını sor (biliniyorsa sorma), sonra o hattın dosyasını oku: `docs/durum/<hat>.md`.
3. Aktif planı oku: `docs/superpowers/plans/` altındaki en güncel plan. Yalnızca kendi hattının task'larını uygula.
4. Ürün kararları için kaynak: `docs/PROJE_REHBERI.md`. Plan ile rehber çelişirse plan geçerlidir (plan rehberden bilinçli sapmaları yazar).
5. `git pull` yap, `git log --oneline -10` ile son değişikliklere bak.

## Çalışırken

- Her hat kendi dalında çalışır: `hat/db`, `hat/ai`, `hat/web`. `main`e doğrudan commit yok; hat bitince PR açılır.
- Planın adımlarını sırayla uygula, test önce (TDD). Bir adım bitince plandaki kutuyu `- [x]` yap.
- Yalnızca kendi hattının dosyalarına dokun. Başka hattın arayüzüne (ör. AI yanıt şeması) ihtiyaç varsa plandaki **Interfaces** bloğuna göre yaz; değiştirmen gerekirse hat dosyasındaki "Diğer hatlara notlar" bölümüne yaz.
- Gizli anahtarlar yalnızca `.env` / `.env.local` içinde; asla commit edilmez.

## Her task bitince (atlanmaz)

1. Hat dosyanı güncelle: "Son durum", "Yapılanlar" (tarih + kısa not + commit), "Sıradaki adım", varsa "Engeller" ve "Alınan kararlar".
2. Commit + push. Böylece limit bittiğinde başka bir oturum `git pull` ile kaldığı yerden devam edebilir.

## Limit bitmeden önce

Kullanıcı "limit bitiyor" ya da "devret" derse: yarım kalan işi commit et (gerekirse `wip:` önekiyle), hat dosyasının "Sıradaki adım" bölümüne bir sonraki oturumun tam olarak ne yapacağını yaz (dosya, adım numarası, yarım kalan şey), push et.
