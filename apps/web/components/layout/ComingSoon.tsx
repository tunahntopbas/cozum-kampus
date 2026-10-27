import { Glass } from "@/components/ui/Glass";

export function ComingSoon({ title }: { title: string }) {
  return (
    <main className="flex flex-1 items-start justify-center p-8">
      <Glass className="w-full max-w-xl p-8">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted">Bu ekran yakında.</p>
      </Glass>
    </main>
  );
}
