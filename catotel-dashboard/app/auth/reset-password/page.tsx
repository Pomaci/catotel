"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell slim>
      <div className="flex justify-center">
        <ResetPasswordForm />
      </div>
    </AuthShell>
  );
}

