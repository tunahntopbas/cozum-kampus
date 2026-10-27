import type { ReactNode } from "react";
import { StaffShell } from "@/components/staff-demo/StaffShell";
export default function Layout({ children }: { children: ReactNode }) { return <StaffShell>{children}</StaffShell>; }
