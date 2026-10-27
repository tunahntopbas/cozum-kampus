import { Glass } from "@/components/ui/Glass";
import { PageContent } from "./PageContent";
import { PageHeader } from "./PageHeader";

export function ComingSoon({ title }: { title: string }) {
  return (
    <PageContent>
      <PageHeader title={title} />
      <Glass className="p-6">
        <p className="text-sm text-muted">Bu ekran yakında.</p>
      </Glass>
    </PageContent>
  );
}
