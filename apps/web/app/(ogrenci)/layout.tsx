import { TopNav } from "@/components/layout/TopNav";

export default function StudentLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
