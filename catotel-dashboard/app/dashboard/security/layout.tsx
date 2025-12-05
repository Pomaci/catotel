"use client";

import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleGate } from "@/components/auth/RoleGate";

export default function SecurityLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate roles={["ADMIN"]} redirectTo="/dashboard">
      <AdminShell>{children}</AdminShell>
    </RoleGate>
  );
}
