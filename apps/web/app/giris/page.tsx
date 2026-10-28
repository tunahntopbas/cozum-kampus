import Link from "next/link";
import { Suspense } from "react";
import { RouteMark } from "@/components/layout/Dock";
import { LoginForm } from "./LoginForm";
import s from "./giris.module.css";

// The path every report takes: the one real sequence in the product, drawn as the login screen's signature.
const JOURNEY = [
  ["Alındı", "Fotoğrafla bildirirsin.", 2.1, 96],
  ["Yönlendirildi", "Doğru birime gider.", 32.1, 34],
  ["İşlemde", "Personel sahaya çıkar.", 60.7, 86],
  ["Çözüldü", "Haber sana gelir.", 83.9, 24],
] as const;

export default function LoginPage() {
  return (
    <div className={`app ${s.page}`}>
      <section className={s.hero}>
        <span className={s.brand}>
          <RouteMark size={32} />
          Çözüm Kampüs
        </span>
        <h1 className={s.title}>Gördüğün sorunu bildir. Çözülene kadar takip et.</h1>
        <div className={s.route}>
          <svg className={s.path} viewBox="0 0 560 120" preserveAspectRatio="none" aria-hidden>
            <path d="M12 96 C 90 96, 110 34, 180 34 S 280 86, 340 86 S 420 24, 470 24" />
          </svg>
          <ol aria-label="Bir bildirimin yolu" className={s.steps}>
            {JOURNEY.map(([step, text, x, y], i) => (
              <li
                key={step}
                className={s.step}
                style={{ left: `${x}%`, top: `${(y / 120) * 100}%`, animationDelay: `${600 + i * 480}ms` }}
              >
                <span className={`${s.node} ${i === JOURNEY.length - 1 ? s.nodeDone : ""}`} aria-hidden />
                <span className={s.stepName}>{step}</span>
                <span className={s.stepText}>{text}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className={s.foot}>Sakarya Üniversitesi, Esentepe Kampüsü</p>
      </section>
      <main id="icerik" className={s.main}>
        <div className={s.card}>
          <h2 className="text-[30px] leading-tight font-semibold text-ink">Giriş yap</h2>
          <p className="mt-2 text-[15px] text-muted">@sakarya.edu.tr e-posta adresinle devam et.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
          <p className="mt-8 text-xs leading-5 text-muted">
            Kişisel verilerinin nasıl işlendiğini{" "}
            <Link href="/kvkk" className="text-accent underline-offset-2 hover:underline focus-ring">
              KVKK aydınlatma metninde
            </Link>{" "}
            okuyabilirsin.
          </p>
        </div>
      </main>
    </div>
  );
}
