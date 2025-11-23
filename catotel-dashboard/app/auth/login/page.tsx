"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginHero } from "@/components/auth/LoginHero";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell hero={<LoginHero />}>
      <LoginForm />
    </AuthShell>
  );
}

