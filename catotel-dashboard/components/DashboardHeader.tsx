"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { CustomerProfile, Reservation } from "@/types/hotel";
import { formatCurrency } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Shield, Cat, CalendarCheck, Clock } from "lucide-react";

type Props = {
  profile?: CustomerProfile;
  latestReservation?: Reservation | null;
};

export function DashboardHeader({ profile, latestReservation }: Props) {
  const { user } = useAuth();

  const stats = useMemo(() => {
    if (!profile) {
      return null;
    }
    const activeCats = profile.cats.length;
    const upcoming = profile.reservations.filter((r) =>
      ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(r.status),
    ).length;
    return { activeCats, upcoming };
  }, [profile]);

  return (
    <section className="rounded-[32px] border border-sand-200 bg-gradient-to-br from-white via-sand-50 to-lagoon-100/40 p-8 shadow-soft">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Merhaba
          </p>
          <h1 className="text-3xl font-semibold text-cocoa-700">
            {profile?.user.name || user?.name || "Catotel kullanıcısı"}
          </h1>
          <p className="text-sm text-slate-500">
            Aktif rolün{" "}
            <span className="font-semibold text-lagoon-600">
              {user?.role || "CUSTOMER"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-cocoa-600">
          <Badge dot tone="info">Güvenli oturumlar</Badge>
          <Badge tone="success">Cihaz yönetimi aktif</Badge>
          {profile?.user.email && <Badge tone="default">{profile.user.email}</Badge>}
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HeaderStat
          icon={<Cat className="h-5 w-5 text-lagoon-600" />}
          label="Kayıtlı kedi"
          value={stats ? stats.activeCats : "-"}
        />
        <HeaderStat
          icon={<CalendarCheck className="h-5 w-5 text-lagoon-600" />}
          label="Aktif rezervasyon"
          value={stats ? stats.upcoming : "-"}
        />
        <HeaderStat
          icon={<Shield className="h-5 w-5 text-lagoon-600" />}
          label="Rol"
          value={user?.role ?? "CUSTOMER"}
        />
        <HeaderStat
          icon={<Clock className="h-5 w-5 text-lagoon-600" />}
          label="Son rezervasyon"
          value={
            latestReservation
              ? formatCurrency(latestReservation.totalPrice)
              : "-"
          }
          helper={
            latestReservation
              ? `${new Date(latestReservation.checkIn).toLocaleDateString(
                  "tr-TR",
                )} · ${latestReservation.room.name}`
              : "Henüz rezervasyon yok"
          }
        />
      </div>
    </section>
  );
}

function HeaderStat({
  icon,
  label,
  value,
  helper,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white/90 px-4 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <div className="rounded-full bg-lagoon-100 p-2 text-lagoon-600">
          {icon}
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-cocoa-700">{value}</div>
      {helper && <p className="text-xs text-slate-500">{helper}</p>}
    </div>
  );
}

