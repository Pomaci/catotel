"use client";

import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell slim>
      <div className="flex justify-center">
        <Suspense fallback={<p className="text-sm text-slate-500">Şifre sıfırlama yükleniyor…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </AuthShell>
  );
}
