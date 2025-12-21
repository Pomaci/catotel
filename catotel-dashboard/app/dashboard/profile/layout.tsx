"use client";

import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { RoleGate } from "@/components/auth/RoleGate";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate roles={["ADMIN", "MANAGER", "STAFF"]} redirectTo="/dashboard">
      <AdminShell>{children}</AdminShell>
    </RoleGate>
  );
}
