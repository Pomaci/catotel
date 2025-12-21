"use client";

import type { ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { AdminShell } from "@/components/admin/AdminShell";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate roles={["STAFF", "MANAGER", "ADMIN"]} redirectTo="/dashboard">
      <AdminShell>{children}</AdminShell>
    </RoleGate>
  );
}