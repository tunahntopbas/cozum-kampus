import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin-demo/AdminShell";

export default function ManagementLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
