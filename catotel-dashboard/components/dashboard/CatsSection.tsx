"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Cat } from "@/types/hotel";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";

const catSchema = z.object({
  name: z.string().min(2).max(50),
  breed: z.string().max(100).optional().or(z.literal("")),
  gender: z.enum(["FEMALE", "MALE", "UNKNOWN"]).optional(),
  birthDate: z.string().optional().or(z.literal("")),
  dietaryNotes: z.string().max(300).optional().or(z.literal("")),
  medicalNotes: z.string().max(300).optional().or(z.literal("")),
  weightKg: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? Number(value) : undefined)),
});

type CatFormValues = z.infer<typeof catSchema>;

export function CatsSection({
  cats,
  onCreate,
  onUpdate,
}: {
  cats: Cat[] | undefined;
  onCreate(values: CatFormValues): Promise<void>;
  onUpdate(id: string, values: Record<string, unknown>): Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CatFormValues>({
    resolver: zodResolver(catSchema),
    defaultValues: {
      name: "",
      breed: "",
      gender: "UNKNOWN",
      birthDate: "",
      dietaryNotes: "",
      medicalNotes: "",
      weightKg: undefined,
    },
  });

  const sortedCats = useMemo(() => {
    return (cats ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [cats]);

  return (
    <section className="surface-card space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-cocoa-700">
            Kedi profilleri
          </h2>
          <p className="text-sm text-slate-500">
            Sağlık ve bakım notlarını güncel tut.
          </p>
        </div>
        <Badge tone="default">{sortedCats.length} kedi</Badge>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.3fr,_0.7fr]">
        <div className="space-y-4">
          {sortedCats.length === 0 && (
            <p className="rounded-3xl border border-dashed border-sand-200 bg-white/80 p-6 text-sm text-slate-500">
              Henüz kayıtlı kedin yok. Sağdaki formdan hızlıca yeni bir misafir
              ekleyebilirsin.
            </p>
          )}
          {sortedCats.map((cat) => (
            <CatCard key={cat.id} cat={cat} onUpdate={onUpdate} />
          ))}
        </div>
        <div className="rounded-3xl border border-sand-200 bg-white/90 p-5 shadow-soft">
          <h3 className="text-lg font-semibold text-cocoa-700">Yeni kedi</h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={handleSubmit(async (values) => {
              await onCreate(values);
              reset();
            })}
          >
            <Input label="İsim" placeholder="Mila" {...register("name")} />
            <Input label="Irk" placeholder="Van kedisi" {...register("breed")} />
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Cinsiyet
            </label>
            <select
              className="w-full rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 outline-none focus:border-lagoon-400"
              {...register("gender")}
            >
              <option value="FEMALE">Dişi</option>
              <option value="MALE">Erkek</option>
              <option value="UNKNOWN">Belirsiz</option>
            </select>
            <Input label="Doğum tarihi" type="date" {...register("birthDate")} />
            <Input
              label="Kilo (kg)"
              type="number"
              step="0.1"
              min="0"
              {...register("weightKg")}
            />
            <Input
              label="Diyet notları"
              placeholder="Glütensiz mama"
              {...register("dietaryNotes")}
            />
            <Input
              label="Sağlık notları"
              placeholder="Alerjiler, ilaçlar..."
              {...register("medicalNotes")}
            />
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Kedi Ekle"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function CatCard({
  cat,
  onUpdate,
}: {
  cat: Cat;
  onUpdate(id: string, payload: Record<string, unknown>): Promise<void>;
}) {
  const [notes, setNotes] = useState(cat.medicalNotes ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(cat.id, { medicalNotes: notes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-sand-200 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-cocoa-700">{cat.name}</p>
          <p className="text-xs text-slate-500">
            {cat.breed || "Irk bilinmiyor"} · {cat.gender || "Bilinmiyor"}
          </p>
        </div>
        <Badge tone="info" dot>
          {cat.weightKg ? `${cat.weightKg} kg` : "Kilo bilgisi yok"}
        </Badge>
      </div>
      <div className="mt-3 grid gap-4 text-sm text-cocoa-600 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Doğum tarihi
          </p>
          <p>{formatDate(cat.birthDate, { dateStyle: "medium" })}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Diyet
          </p>
          <p>{cat.dietaryNotes || "-"}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Sağlık Notları
        </p>
        <textarea
          className="w-full rounded-2xl border border-sand-200 bg-white/80 p-3 text-sm text-cocoa-700 outline-none transition focus:border-lagoon-400"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Kaydediliyor..." : "Notu Güncelle"}
          </Button>
        </div>
      </div>
    </div>
  );
}

