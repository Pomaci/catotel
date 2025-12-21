"use client";

import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleGate } from "@/components/auth/RoleGate";

export default function CatsLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate roles={["ADMIN", "MANAGER"]} redirectTo="/dashboard">
      <AdminShell>{children}</AdminShell>
    </RoleGate>
  );
}
