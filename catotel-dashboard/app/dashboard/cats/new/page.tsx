"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Cat, ClipboardList } from "lucide-react";
import { CatForm } from "@/components/cats/CatForm";
import { AdminApi, type CreateAdminCatPayload } from "@/lib/api/admin";

export default function NewCatPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const createMutation = useMutation({
    mutationFn: (payload: CreateAdminCatPayload) => AdminApi.createCat(payload),
    onSuccess: (cat) => {
      router.push(`/dashboard/cats/${cat.id}`);
    },
    onError: (err: any) => {
      setServerError(err?.message ?? "Kayıt oluşturulamadı");
    },
  });

  return (
    <div className="admin-surface mx-auto max-w-4xl p-8">
      <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] admin-muted">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border p-2 transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
          aria-label="Geri dön"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
        </button>
        Yeni Kedi
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-highlight)] text-peach-400">
          <Cat className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Yeni kedi kaydı</h1>
          <p className="text-sm admin-muted">Sahibini seçin, temel bilgileri doldurun ve kaydedin.</p>
        </div>
      </div>

      <div className="mt-6">
        <CatForm
          mode="create"
          onSubmit={(payload) => createMutation.mutateAsync(payload)}
          submitting={createMutation.isPending}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
