import { Suspense } from "react";
import { Stage } from "@/components/layout/Stage";
import { Glass } from "@/components/ui/Glass";
import { Logo } from "@/components/ui/Logo";
import { LoginForm } from "./LoginForm";

// The journey every report takes; the one real sequence in the product, shown as the login screen's signature.
const JOURNEY = [
  ["Alındı", "Fotoğraf ve konumla bildirirsin"],
  ["Yönlendirildi", "Yapay zeka doğru birime iletir"],
  ["İşlemde", "Teknisyen yola çıkar"],
  ["Çözüldü", "Çözüm fotoğrafı doğrulanır, haber alırsın"],
];

export default function LoginPage() {
  return (
    <div className="app relative min-h-screen w-full overflow-hidden">
      <Stage />
      <main
        id="icerik"
        className="relative z-[3] mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-4 py-10 md:grid-cols-[minmax(0,1fr)_400px] md:px-10"
      >
        <section className="flex flex-col gap-10">
          <Logo />
          <div className="flex max-w-xl flex-col gap-4">
            <h1 className="text-4xl leading-[1.1] font-semibold tracking-[-0.02em] text-ink md:text-[56px]">
              Kampüste gördüğün sorunu bildir, çözülene kadar takip et.
            </h1>
            <p className="max-w-md text-base leading-7 text-muted">
              Sakarya Üniversitesi öğrencileri, birim personeli ve yönetim aynı kaydı görür.
            </p>
          </div>
          <ol className="hidden max-w-xl md:grid md:grid-cols-4" aria-label="Bir bildirimin yolculuğu">
            {JOURNEY.map(([step, text], i) => (
              <li key={step} className="relative flex flex-col gap-2 pr-4">
                <span className="flex items-center">
                  <span
                    className={`h-3 w-3 flex-none rounded-full border-2 ${i === JOURNEY.length - 1 ? "border-[#166534] bg-[#166534]" : "border-ink bg-ink"}`}
                    aria-hidden
                  />
                  {i < JOURNEY.length - 1 && <span className="h-px flex-1 bg-ink/25" aria-hidden />}
                </span>
                <span className="text-sm font-semibold text-ink">{step}</span>
                <span className="text-xs leading-5 text-muted">{text}</span>
              </li>
            ))}
          </ol>
        </section>
        <Glass className="w-full p-8 md:p-10">
          <h2 className="text-2xl font-semibold tracking-[-0.01em]">Giriş yap</h2>
          <p className="mt-1 text-sm text-muted">Okul e-posta adresinle devam et.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </Glass>
      </main>
    </div>
  );
}
