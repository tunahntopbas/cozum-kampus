import Link from "next/link";
import { MapTrifold } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <main id="icerik" className="relative z-10 mx-auto my-24 w-[calc(100%-32px)] max-w-lg">
      <section className="glass flex flex-col gap-4 p-8">
        <MapTrifold size={32} className="text-accent" aria-hidden />
        <h1 className="text-2xl font-semibold">Bu sayfa bulunamadı</h1>
        <p className="text-sm leading-6 text-muted">Bağlantı değişmiş olabilir. Kampüs haritasından devam edebilirsin.</p>
        <Link href="/" className="btn-ink t self-start rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white">Haritaya dön</Link>
      </section>
    </main>
  );
}
