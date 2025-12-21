"use client";

import type { ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { GuestShell } from "@/components/guest/GuestShell";

export default function GuestLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGate roles={["CUSTOMER"]} redirectTo="/dashboard">
      <GuestShell>{children}</GuestShell>
    </RoleGate>
  );
}
