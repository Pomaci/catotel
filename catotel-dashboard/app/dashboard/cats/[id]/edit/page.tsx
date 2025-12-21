"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Cat, ClipboardList, Loader2 } from "lucide-react";
import { CatForm } from "@/components/cats/CatForm";
import { AdminApi, type CreateAdminCatPayload } from "@/lib/api/admin";
import { Spinner } from "@/components/ui/Spinner";

export default function EditCatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const catQuery = useQuery({
    queryKey: ["admin-cat", params.id],
    queryFn: () => AdminApi.getCat(params.id),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateAdminCatPayload) => AdminApi.updateCat(params.id, payload),
    onSuccess: (cat) => {
      router.push(`/dashboard/cats/${cat.id}`);
    },
    onError: (err: any) => {
      setServerError(err?.message ?? "Kedi güncellenemedi");
    },
  });

  if (catQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Kedi bilgileri yükleniyor..." />
      </div>
    );
  }

  if (catQuery.error || !catQuery.data) {
    return (
      <div className="admin-surface mx-auto max-w-3xl p-8">
        <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] admin-muted">
          <Link
            href={`/dashboard/cats/${params.id}`}
            className="rounded-full border p-2 transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
            aria-label="Geri dön"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>
          Kedi Düzenle
        </div>
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-white/5 dark:text-red-200">
          Kedi bilgisi alınamadı: {(catQuery.error as Error)?.message ?? "Bilinmeyen hata"}
        </p>
        <Link
          href="/dashboard/cats"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
        >
          Listeye dön
        </Link>
      </div>
    );
  }

  const cat = catQuery.data;

  return (
    <div className="admin-surface mx-auto max-w-4xl p-8">
      <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] admin-muted">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border p-2 transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
          aria-label="Geri dön"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        Kedi Düzenle
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-highlight)] text-peach-400">
          <Cat className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{cat.name}</h1>
          <p className="text-sm admin-muted">Sahip: {cat.owner.name ?? cat.owner.email}</p>
        </div>
        {catQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-peach-400" aria-hidden />}
      </div>

      <div className="mt-6">
        <CatForm
          mode="edit"
          initialData={cat}
          onSubmit={(payload) => updateMutation.mutateAsync(payload)}
          submitting={updateMutation.isPending}
          serverError={serverError}
        />
      </div>
    </div>
  );
}
