export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="relative z-10 mx-auto my-24 w-[calc(100%-32px)] max-w-lg">
      <div className="glass flex items-center gap-3 p-6 text-sm text-muted">
        <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
        Ekran hazırlanıyor…
      </div>
    </div>
  );
}
