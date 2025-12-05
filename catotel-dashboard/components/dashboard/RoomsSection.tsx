"use client";

import type { RoomType } from "@/types/hotel";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Home, Users } from "lucide-react";

export function RoomsSection({ rooms }: { rooms: RoomType[] | undefined }) {
  return (
    <section className="surface-card space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-cocoa-700">Oda envanteri</h2>
          <p className="text-sm text-slate-500">
            Kapasite ve gece tarifelerini tek bakışta görün.
          </p>
        </div>
        <Badge tone="default">{rooms?.length ?? 0} oda</Badge>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms?.map((room) => (
          <article
            key={room.id}
            className="rounded-3xl border border-sand-200 bg-white/90 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cocoa-700">
                <Home className="h-4 w-4 text-lagoon-500" />
                <h3 className="font-semibold">{room.name}</h3>
              </div>
              <Badge tone={room.isActive ? "success" : "warning"} dot>
                {room.isActive ? "Aktif" : "Pasif"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {room.description || "Detay belirtilmemiş."}
            </p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Users className="h-4 w-4 text-slate-400" />
                {room.capacity} kedi | {room.totalUnits ?? 0} oda
              </span>
              <span className="text-lg font-semibold text-lagoon-600">
                {formatCurrency(room.nightlyRate)}/gece
              </span>
            </div>
            {room.amenities && (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                {Object.keys(room.amenities).map((key) => (
                  <span
                    key={key}
                    className="rounded-full border border-sand-200 px-2 py-0.5"
                  >
                    {key}
                  </span>
                ))}
              </div>
            )}
          </article>
        ))}
        {!rooms?.length && (
          <p className="rounded-2xl border border-dashed border-sand-200 bg-white/80 p-6 text-sm text-slate-500">
            Aktif oda bulunamadı. Yönetim panelinden yeni oda ekleyebilirsiniz.
          </p>
        )}
      </div>
    </section>
  );
}
