"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck2,
  ClipboardList,
  DoorOpen,
  LineChart,
  PawPrint,
  Users2,
} from "lucide-react";
import { format } from "date-fns";

const stats = [
  { label: "Doluluk", value: "82%", helper: "Bugun 42 oda dolu", icon: DoorOpen },
  { label: "Bugun check-in", value: "12", helper: "Sonraki 3 saat: 4", icon: CalendarCheck2 },
  { label: "Bugun check-out", value: "9", helper: "Ortalama cikis: 14:00", icon: PawPrint },
  { label: "Geciken gorev", value: "3", helper: "SLA uyarisi", icon: ClipboardList },
];

const occupancy = [
  { day: "Pzt", value: 68 },
  { day: "Sal", value: 74 },
  { day: "Car", value: 81 },
  { day: "Per", value: 86 },
  { day: "Cum", value: 78 },
  { day: "Cmt", value: 92 },
  { day: "Paz", value: 88 },
];

const risks = [
  { title: "Lagoon Suite kapasitesi dusuyor", detail: "3 gun sonra 1 bos slot", level: "warning" },
  { title: "Odeme bekleyen rezervasyonlar", detail: "6 rezervasyon, toplam ₺12.450", level: "warning" },
  { title: "Check-in yogunlugu artis", detail: "Yarin +18 check-in bekleniyor", level: "info" },
];

const actions = [
  {
    label: "Yeni rezervasyon",
    description: "Musteri icin hizli rezervasyon olustur.",
    href: "/dashboard/reservations/new",
  },
  {
    label: "Oda atamalarini incele",
    description: "Kilitli atamalar ve bosluklar.",
    href: "/dashboard/rooms",
  },
  {
    label: "Gorev atamasi yap",
    description: "Vardiya yukunu dengele.",
    href: "/dashboard/tasks",
  },
];

const upcoming = [
  { label: "MIW-4821", detail: "2 kedi, Lagoon Suite", time: "13:30", type: "Check-in" },
  { label: "MIW-4904", detail: "1 kedi, Peach Deluxe", time: "15:10", type: "Check-in" },
  { label: "MIW-4752", detail: "2 kedi, Clay Family", time: "16:00", type: "Check-out" },
];

export default function ManagerDashboardPage() {
  const today = format(new Date(), "d MMMM yyyy");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--admin-muted)]">
            Operasyon Dashboard
          </p>
          <h1 className="text-2xl font-semibold text-[var(--admin-text-strong)]">
            Bugun operasyon kontrolu
          </h1>
          <p className="text-sm text-[var(--admin-muted)]">{today} · Gunluk plan ve risk gorunumu</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-highlight-muted)] px-4 py-2 text-xs font-semibold text-[var(--admin-text-strong)]">
          <LineChart className="h-4 w-4 text-peach-400" aria-hidden />
          Operasyon modu aktif
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-surface space-y-2 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--admin-highlight-muted)] text-peach-500">
                <stat.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-muted)]">{stat.label}</p>
                <p className="text-2xl font-semibold text-[var(--admin-text-strong)]">{stat.value}</p>
              </div>
            </div>
            <p className="text-xs text-[var(--admin-muted)]">{stat.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="admin-surface space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--admin-text-strong)]">7 gun doluluk</p>
              <p className="text-xs text-[var(--admin-muted)]">Oda tipi bazli planlama</p>
            </div>
            <span className="rounded-full bg-[var(--admin-highlight-muted)] px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)]">
              Ortalama %81
            </span>
          </div>
          <div className="grid gap-3">
            {occupancy.map((item) => (
              <div key={item.day} className="flex items-center gap-3">
                <span className="w-10 text-xs font-semibold text-[var(--admin-muted)]">{item.day}</span>
                <div className="h-2 flex-1 rounded-full bg-[var(--admin-surface-alt)]">
                  <div
                    className="h-2 rounded-full bg-lagoon-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-[var(--admin-text-strong)]">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-surface space-y-4 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-peach-400" aria-hidden />
            <p className="text-sm font-semibold text-[var(--admin-text-strong)]">Risk & mudahale</p>
          </div>
          <div className="space-y-3">
            {risks.map((risk) => (
              <div key={risk.title} className="rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 admin-border">
                <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{risk.title}</p>
                <p className="text-xs text-[var(--admin-muted)]">{risk.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="admin-surface space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Users2 className="h-4 w-4 text-peach-400" aria-hidden />
            <p className="text-sm font-semibold text-[var(--admin-text-strong)]">Hizli aksiyonlar</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-sm transition hover:border-peach-300 hover:text-peach-500 admin-border"
              >
                <p className="font-semibold text-[var(--admin-text-strong)]">{action.label}</p>
                <p className="text-xs text-[var(--admin-muted)]">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-surface space-y-4 p-4">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-peach-400" aria-hidden />
            <p className="text-sm font-semibold text-[var(--admin-text-strong)]">Siradaki islemler</p>
          </div>
          <div className="space-y-2">
            {upcoming.map((item) => (
              <div key={item.label} className="rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border">
                <div className="flex items-center justify-between text-sm text-[var(--admin-text-strong)]">
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-xs text-[var(--admin-muted)]">{item.time}</span>
                </div>
                <p className="text-xs text-[var(--admin-muted)]">
                  {item.type} · {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
