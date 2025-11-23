"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Cat, Reservation, Room } from "@/types/hotel";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatEnum } from "@/lib/utils/format";
import {
  ReservationStatus,
  type ReservationStatus as ReservationStatusValue,
} from "@/types/enums";

const reservationSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  catIds: z.array(z.string()).min(1),
  specialRequests: z.string().max(400).optional().or(z.literal("")),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

export function ReservationsSection({
  cats,
  rooms,
  reservations,
  onCreate,
}: {
  cats: Cat[] | undefined;
  rooms: Room[] | undefined;
  reservations: Reservation[] | undefined;
  onCreate(values: ReservationFormValues): Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<
    ReservationStatusValue | "ALL"
  >("ALL");

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      roomId: "",
      checkIn: "",
      checkOut: "",
      catIds: [],
      specialRequests: "",
    },
  });

  const filteredReservations = useMemo(() => {
    if (!reservations) return [];
    return reservations.filter((reservation) =>
      statusFilter === "ALL" ? true : reservation.status === statusFilter,
    );
  }, [reservations, statusFilter]);

  return (
    <section className="surface-card space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-cocoa-700">Rezervasyonlar</h2>
          <p className="text-sm text-slate-500">
            Tarih, oda ve kedi seçerek hızlıca yeni rezervasyon oluştur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {(["ALL", ...Object.values(ReservationStatus)] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                className={`rounded-full border px-4 py-1.5 font-semibold transition ${
                  statusFilter === status
                    ? "border-lagoon-400 bg-lagoon-100/70 text-lagoon-700"
                    : "border-sand-200 text-slate-400 hover:border-lagoon-200"
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {status === "ALL" ? "Hepsi" : formatEnum(status)}
              </button>
            ),
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr,_0.7fr]">
        <div className="space-y-3">
          {filteredReservations.length === 0 && (
            <p className="rounded-3xl border border-dashed border-sand-200 bg-white/80 p-6 text-sm text-slate-500">
              Seçili filtre için rezervasyon bulunamadı.
            </p>
          )}
          {filteredReservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
        <div className="rounded-3xl border border-sand-200 bg-white/90 p-5 shadow-soft">
          <h3 className="text-lg font-semibold text-cocoa-700">
            Yeni rezervasyon
          </h3>
          <form
            className="mt-4 space-y-3"
            onSubmit={handleSubmit(async (values) => {
              await onCreate(values);
              reset();
            })}
          >
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Oda
            </label>
            <select
              className="w-full rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 outline-none focus:border-lagoon-400"
              {...register("roomId")}
            >
              <option value="">Oda seçin</option>
              {rooms?.map((room) => (
                <option value={room.id} key={room.id}>
                  {room.name} · {formatCurrency(room.nightlyRate)}/gece
                </option>
              ))}
            </select>
            <Input label="Giriş tarihi" type="date" {...register("checkIn")} />
            <Input label="Çıkış tarihi" type="date" {...register("checkOut")} />
            <fieldset className="space-y-2">
              <legend className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Kediler
              </legend>
              <div className="flex flex-wrap gap-2">
                {cats?.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex items-center gap-2 rounded-full border border-sand-200 bg-white/70 px-3 py-1 text-xs text-cocoa-700"
                  >
                    <input
                      type="checkbox"
                      value={cat.id}
                      className="accent-lagoon-500"
                      {...register("catIds")}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Notlar
            </label>
            <textarea
              className="w-full rounded-2xl border border-sand-200 bg-white/80 p-3 text-sm text-cocoa-700 outline-none focus:border-lagoon-400"
              rows={3}
              placeholder="Özel istekler"
              {...register("specialRequests")}
            />
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Kaydediliyor..." : "Rezervasyon Oluştur"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  return (
    <div className="rounded-3xl border border-sand-200 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-cocoa-700">
            {reservation.room.name}
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(reservation.checkIn, { dateStyle: "medium" })} ·{" "}
            {formatDate(reservation.checkOut, { dateStyle: "medium" })}
          </p>
        </div>
        <Badge tone="default">{reservation.code}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-cocoa-600">
        {reservation.cats.map((cat) => (
          <Badge key={cat.cat.id} tone="info">
            {cat.cat.name}
          </Badge>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-500">{formatEnum(reservation.status)}</span>
        <span className="text-lg font-semibold text-lagoon-600">
          {formatCurrency(reservation.totalPrice)}
        </span>
      </div>
    </div>
  );
}

