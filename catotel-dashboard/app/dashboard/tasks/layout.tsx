"use client";

import type { ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { AdminShell } from "@/components/admin/AdminShell";

export default function TasksLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate roles={["ADMIN", "MANAGER", "STAFF"]} redirectTo="/dashboard">
      <AdminShell>{children}</AdminShell>
    </RoleGate>
  );
}