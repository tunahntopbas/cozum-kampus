export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="page-title text-[34px] leading-[1.05] font-semibold tracking-[-0.025em] sm:text-[44px]">{title}</h1>
      {description && <p className="max-w-[60ch] text-base text-muted">{description}</p>}
    </div>
  );
}
