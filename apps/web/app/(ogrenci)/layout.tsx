import { Stage } from "@/components/layout/Stage";
import { TopNav } from "@/components/layout/TopNav";

export default function StudentLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="app relative min-h-screen w-full overflow-x-hidden bg-map-bg">
      <a className="skip" href="#icerik">
        Ana içeriğe geç
      </a>
      <Stage />
      <TopNav />
      {children}
    </div>
  );
}
