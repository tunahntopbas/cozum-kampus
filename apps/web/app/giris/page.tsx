import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

// The path every report takes: the one real sequence in the product, used as the login screen's signature.
const JOURNEY = [
  ["Alındı", "Fotoğraf ve konumla bildirirsin."],
  ["Yönlendirildi", "Yapay zeka doğru birime iletir."],
  ["İşlemde", "Birim personeli işe başlar."],
  ["Çözüldü", "Çözüm fotoğrafı doğrulanır, haber alırsın."],
];

export default function LoginPage() {
  return (
    <div className="app grid min-h-screen w-full bg-white lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="relative hidden flex-col justify-between bg-ink px-14 py-12 text-white lg:flex">
        <span className="inline-flex items-center gap-2.5 text-[15px] font-semibold">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md bg-white text-[13px] text-ink">
            ÇK
          </span>
          Çözüm Kampüs
        </span>
        <div className="flex max-w-lg flex-col gap-12">
          <h1 className="text-[52px] leading-[1.05] font-semibold tracking-[-0.03em] text-white">
            Gördüğün sorunu bildir. Çözülene kadar takip et.
          </h1>
          <ol aria-label="Bir bildirimin yolu" className="flex flex-col">
            {JOURNEY.map(([step, text], i) => (
              <li key={step} className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-4">
                <span className="flex flex-col items-center" aria-hidden>
                  <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${i === JOURNEY.length - 1 ? "bg-[#4ade80]" : "bg-white"}`} />
                  {i < JOURNEY.length - 1 && <span className="w-px flex-1 bg-white/25" />}
                </span>
                <span className="flex flex-col gap-0.5 pb-6">
                  <span className="text-[15px] font-semibold">{step}</span>
                  <span className="text-sm text-white/65">{text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-sm text-white/55">Sakarya Üniversitesi, Esentepe Kampüsü</p>
      </section>
      <main id="icerik" className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <span className="mb-10 inline-flex items-center gap-2 font-semibold text-ink lg:hidden">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md bg-ink text-[13px] text-white">
              ÇK
            </span>
            Çözüm Kampüs
          </span>
          <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.02em] text-ink">Giriş yap</h2>
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
