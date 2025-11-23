"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CustomerProfile } from "@/types/hotel";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/ui/Badge";

const schema = z.object({
  phone: z.string().min(6).max(30).optional().or(z.literal("")),
  preferredVet: z.string().max(120).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  emergencyContactName: z.string().max(120).optional().or(z.literal("")),
  emergencyContactPhone: z.string().max(60).optional().or(z.literal("")),
  notes: z.string().max(400).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function OverviewSection({
  profile,
  loading,
  onSubmit,
}: {
  profile?: CustomerProfile;
  loading: boolean;
  onSubmit(values: FormValues): Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
      preferredVet: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        phone: profile.phone ?? "",
        preferredVet: profile.preferredVet ?? "",
        address: profile.address ?? "",
        emergencyContactName: profile.emergencyContactName ?? "",
        emergencyContactPhone: profile.emergencyContactPhone ?? "",
        notes: profile.notes ?? "",
      });
    }
  }, [profile, reset]);

  return (
    <section className="surface-card space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-cocoa-700">
            Misafir profili
          </h2>
          <p className="text-sm text-slate-500">
            İletişim ve acil durum bilgilerini güncel tut.
          </p>
        </div>
        <Badge tone="info" dot>
          {profile?.user.email ?? "-"}
        </Badge>
      </header>

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <Input label="Telefon" placeholder="+90..." {...register("phone")} />
        <Input
          label="Tercih edilen veteriner"
          placeholder="Klinik adı"
          {...register("preferredVet")}
        />
        <Input
          label="Adres"
          placeholder="Mahalle, şehir"
          {...register("address")}
        />
        <Input
          label="Acil durum kişisi"
          placeholder="Ad Soyad"
          {...register("emergencyContactName")}
        />
        <Input
          label="Acil durum telefon"
          placeholder="+90..."
          {...register("emergencyContactPhone")}
        />
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Notlar
          </label>
          <textarea
            className="w-full rounded-2xl border border-sand-200 bg-white/80 p-3 text-sm text-cocoa-700 outline-none transition placeholder:text-slate-400 focus:border-lagoon-400 focus:ring-2 focus:ring-lagoon-50"
            rows={3}
            placeholder="Beslenme, ulaşım, vb."
            {...register("notes")}
          />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button disabled={loading || isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Profili Güncelle"}
          </Button>
        </div>
      </form>
    </section>
  );
}

