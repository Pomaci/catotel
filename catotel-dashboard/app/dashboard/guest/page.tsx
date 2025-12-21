"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Lock,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { GuestEmptyState } from "@/components/guest/EmptyState";
import { GuestStatusBadge } from "@/components/guest/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { sampleProfile, sampleReservations } from "./data";

const viewState: "loaded" | "loading" | "error" = "loaded";

export default function GuestOverviewPage() {
  const { user } = useAuth();
  const nameCandidate = user?.name as unknown;
  const resolvedName =
    typeof nameCandidate === "string" && nameCandidate.trim().length > 0
      ? nameCandidate
      : sampleProfile.user.name ?? "Misafir";

  if (viewState === "loading") {
    return <OverviewSkeleton />;
  }

  if (viewState === "error") {
    return (
      <StatusBanner variant="error">
        Genel bakış yüklenemedi. Lütfen tekrar deneyin.
      </StatusBanner>
    );
  }

  const upcomingReservation = sampleReservations.find((reservation) =>
    ["PENDING", "CONFIRMED", "CHECKED_IN"].includes(reservation.status),
  );
  const lastStay = sampleReservations.find(
    (reservation) => reservation.status === "CHECKED_OUT",
  );
  const pendingPayments = sampleReservations.flatMap((reservation) =>
    reservation.payments?.filter((payment) => payment.status === "PENDING") ?? [],
  ).length;

  const tasks = [
    {
      id: "profile",
      label: "Profilini tamamla",
      done: Boolean(sampleProfile.phone && sampleProfile.emergencyContactPhone),
    },
    {
      id: "cats",
      label: "Kedini ekle",
      done: sampleProfile.cats.length > 0,
    },
    {
      id: "payment",
      label: "Ödemeni tamamla",
      done: pendingPayments === 0,
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-white via-sand-50 to-lagoon-100/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Miaow Cat Hotel
            </p>
            <h1 className="text-3xl font-semibold text-cocoa-700">
              Merhaba {resolvedName}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Bugün kedin için en iyi konaklamayı birlikte planlayalım.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/guest/reservations/new"
              className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-lagoon-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-500"
            >
              Yeni rezervasyon
            </Link>
            <Link
              href="/dashboard/guest/account"
              className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white/90 px-5 py-2.5 text-sm font-semibold text-cocoa-700 shadow-sm transition hover:border-lagoon-300"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Profilini tamamla
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard
          title="Yaklaşan rezervasyon"
          value={upcomingReservation ? formatDate(upcomingReservation.checkIn, { dateStyle: "medium" }) : "Yok"}
          icon={<CalendarDays className="h-5 w-5" aria-hidden />}
          helper={
            upcomingReservation
              ? `${upcomingReservation.roomType.name} · ${upcomingReservation.cats.length} kedi`
              : "İlk rezervasyonunu oluştur"
          }
        />
        <StatCard
          title="Kayıtlı kediler"
          value={sampleProfile.cats.length}
          icon={<CatIcon />}
          helper="Profildeki aktif kediler"
        />
        <StatCard
          title="Ödeme bekleyen"
          value={pendingPayments}
          icon={<Bell className="h-5 w-5" aria-hidden />}
          helper={pendingPayments ? "Ödemeni tamamla" : "Tüm ödemeler tamamlandı"}
        />
        <StatCard
          title="Son konaklama"
          value={lastStay ? formatCurrency(lastStay.totalPrice) : "Henüz yok"}
          icon={<ClipboardList className="h-5 w-5" aria-hidden />}
          helper={
            lastStay
              ? `${formatDate(lastStay.checkIn, { dateStyle: "medium" })} · ${lastStay.roomType.name}`
              : "İlk konaklama için plan yap"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <SectionHeading title="Yaklaşan rezervasyon" />
          <div className="mt-4">
            {!upcomingReservation ? (
              <GuestEmptyState
                title="Henüz rezervasyon yok"
                description="Kedin için ilk konaklamayı şimdi planlayabilirsin."
                actionLabel="Yeni rezervasyon"
                actionHref="/dashboard/guest/reservations/new"
                icon={CalendarDays}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-cocoa-700">
                      {upcomingReservation.roomType.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(upcomingReservation.checkIn, { dateStyle: "medium" })} -{" "}
                      {formatDate(upcomingReservation.checkOut, { dateStyle: "medium" })}
                    </p>
                  </div>
                  <GuestStatusBadge kind="reservation" status={upcomingReservation.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {upcomingReservation.cats.map((item) => (
                    <span
                      key={item.cat.id}
                      className="inline-flex items-center rounded-full border border-sand-200 bg-sand-100 px-3 py-1 text-xs font-medium text-cocoa-600"
                    >
                      {item.cat.name}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sand-100/60 px-4 py-3 text-sm text-cocoa-700">
                  <span>Toplam tutar</span>
                  <span className="font-semibold">{formatCurrency(upcomingReservation.totalPrice)}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/guest/reservations/${upcomingReservation.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
                  >
                    Detaylar
                  </Link>
                  <Link
                    href="/dashboard/guest/reservations/new"
                    className="inline-flex items-center justify-center rounded-full bg-lagoon-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
                  >
                    Yeni rezervasyon
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionHeading title="Yapılacaklar" />
            <ul className="mt-4 space-y-3 text-sm text-cocoa-700">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between rounded-2xl border border-sand-200 bg-white/90 px-4 py-3"
                >
                  <span>{task.label}</span>
                  <span
                    className={
                      task.done
                        ? "inline-flex items-center gap-1 text-xs font-semibold text-lagoon-600"
                        : "text-xs text-slate-400"
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {task.done ? "Tamam" : "Bekliyor"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeading title="Otel ile iletişim" />
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
                <Phone className="h-4 w-4 text-lagoon-600" aria-hidden />
                +90 212 555 66 77
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
                <Mail className="h-4 w-4 text-lagoon-600" aria-hidden />
                hello@miaowhotel.com
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
                <Bell className="h-4 w-4 text-peach-400" aria-hidden />
                WhatsApp ile hızlı destek
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-white via-sand-50 to-peach-50/50">
            <SectionHeading title="Yakında" />
            <div className="mt-4 flex items-start gap-3 text-sm text-slate-500">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-peach-100 text-peach-500">
                <Lock className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="font-semibold text-cocoa-700">Canlı kamera & günlük rapor</p>
                <p className="text-xs text-slate-500">
                  Oda içi kamera ve günlük sağlık raporları çok yakında burada.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CatIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-lagoon-100 text-lagoon-600">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path
          d="M5 14c0-3 2-6 7-6s7 3 7 6-2 6-7 6-7-3-7-6z"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M7 11c0-2.5 2-4.5 5-4.5S17 8.5 17 11"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
        />
      </svg>
    </span>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 text-slate-500">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sand-100 text-lagoon-600">
          {icon}
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{title}</p>
          <p className="text-2xl font-semibold text-cocoa-700">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">{helper}</p>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-sand-100" />
      <div className="grid gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-3xl bg-sand-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-72 animate-pulse rounded-3xl bg-sand-100" />
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-3xl bg-sand-100" />
          <div className="h-40 animate-pulse rounded-3xl bg-sand-100" />
          <div className="h-32 animate-pulse rounded-3xl bg-sand-100" />
        </div>
      </div>
    </div>
  );
}
