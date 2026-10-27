"use client";

import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="icerik" className="relative z-10 mx-auto my-24 w-[calc(100%-32px)] max-w-lg">
      <section className="glass flex flex-col gap-4 p-8" role="alert">
        <WarningCircle size={32} className="text-accent" aria-hidden />
        <h1 className="text-2xl font-semibold">Bu ekran yüklenemedi</h1>
        <p className="text-sm leading-6 text-muted">Bağlantını kontrol edip yeniden deneyebilirsin.</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={reset} className="btn-ink t rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">Yeniden dene</button>
          <Link href="/" className="ghost t rounded-lg border border-input-border bg-white px-4 py-2 text-sm font-semibold">Haritaya dön</Link>
        </div>
      </section>
    </main>
  );
}
