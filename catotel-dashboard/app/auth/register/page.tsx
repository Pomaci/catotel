"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterHero } from "@/components/auth/RegisterHero";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthShell hero={<RegisterHero />}>
      <RegisterForm />
    </AuthShell>
  );
}

