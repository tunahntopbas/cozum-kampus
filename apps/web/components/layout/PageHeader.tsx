export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[30px] leading-9 font-semibold">{title}</h1>
      {description && <p className="text-base text-muted">{description}</p>}
    </div>
  );
}
