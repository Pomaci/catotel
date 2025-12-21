"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  PencilLine,
  Slash,
  Ticket,
} from "lucide-react";
import { Card } from "@/components/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { ConfirmDialog } from "@/components/guest/ConfirmDialog";
import { GuestEmptyState } from "@/components/guest/EmptyState";
import { GuestStatusBadge } from "@/components/guest/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { sampleReservations } from "../data";

const viewState: "loaded" | "loading" | "error" = "loaded";

const filterOptions = [
  { id: "ALL", label: "Hepsi" },
  { id: "PENDING", label: "Onay bekleyen" },
  { id: "CONFIRMED", label: "Onaylandı" },
  { id: "CHECKED_IN", label: "Check-in" },
  { id: "CHECKED_OUT", label: "Check-out" },
  { id: "CANCELLED", label: "İptal" },
] as const;

type FilterId = (typeof filterOptions)[number]["id"];

export default function GuestReservationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("ALL");

  const filteredReservations = useMemo(() => {
    if (activeFilter === "ALL") return sampleReservations;
    return sampleReservations.filter((reservation) => reservation.status === activeFilter);
  }, [activeFilter]);

  if (viewState === "loading") {
    return <ReservationsSkeleton />;
  }

  if (viewState === "error") {
    return (
      <StatusBanner variant="error">
        Rezervasyonlar yüklenemedi. Lütfen tekrar deneyin.
      </StatusBanner>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <SectionHeading title="Rezervasyonlar" />
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => {
            const isActive = filter.id === activeFilter;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={
                  isActive
                    ? "rounded-full bg-lagoon-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
                    : "rounded-full border border-sand-200 bg-white/80 px-4 py-2 text-xs font-semibold text-cocoa-600 transition hover:border-lagoon-300"
                }
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </Card>

      {filteredReservations.length === 0 ? (
        <GuestEmptyState
          title="Henüz rezervasyonun yok"
          description="İlk rezervasyonunu oluştur ve kedin için planı başlat."
          actionLabel="İlk rezervasyonunu oluştur"
          actionHref="/dashboard/guest/reservations/new"
          icon={CalendarDays}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredReservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({
  reservation,
}: {
  reservation: (typeof sampleReservations)[number];
}) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const hasPendingPayment =
    reservation.payments?.some((payment) => payment.status === "PENDING") ?? false;
  const canCancel = ["PENDING", "CONFIRMED"].includes(reservation.status);

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-cocoa-700">
            {reservation.roomType.name}
          </p>
          <p className="text-xs text-slate-500">
            {formatDate(reservation.checkIn, { dateStyle: "medium" })} -{" "}
            {formatDate(reservation.checkOut, { dateStyle: "medium" })}
          </p>
        </div>
        <GuestStatusBadge kind="reservation" status={reservation.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        {reservation.cats.map((item) => (
          <span
            key={item.cat.id}
            className="inline-flex items-center rounded-full border border-sand-200 bg-sand-100 px-3 py-1 text-xs font-medium text-cocoa-600"
          >
            {item.cat.name}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-sand-200 bg-white/90 px-4 py-3 text-sm text-cocoa-700">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-slate-500">
            <Ticket className="h-4 w-4" aria-hidden />
            Kod
          </span>
          <span className="font-semibold">{reservation.code}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-slate-500">Toplam</span>
          <span className="font-semibold">{formatCurrency(reservation.totalPrice)}</span>
        </div>
      </div>

      {reservation.payments?.length ? (
        <div className="flex flex-wrap items-center gap-2">
          {reservation.payments.map((payment) => (
            <GuestStatusBadge key={payment.id} kind="payment" status={payment.status} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Ödeme kaydı bulunamadı.</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={`/dashboard/guest/reservations/${reservation.id}`}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
        >
          Detay
        </Link>
        {hasPendingPayment ? (
          <button
            type="button"
            onClick={() => setPaymentOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-lagoon-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            Ödeme yap
          </button>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100"
          >
            <Slash className="h-4 w-4" aria-hidden />
            İptal
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-sand-200 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-400"
            title="Yakında"
          >
            <PencilLine className="h-4 w-4" aria-hidden />
            Tarih değiştir
          </button>
        )}
      </div>

      <ConfirmDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        title="Ödemeyi onayla"
        description="Ödeme işlemi başlatılacak. Devam etmek istiyor musun?"
        confirmLabel="Ödemeye devam et"
        onConfirm={() => undefined}
      />
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Rezervasyonu iptal et"
        description="Rezervasyon iptal edilecek ve işlem geri alınamaz."
        confirmLabel="İptal et"
        tone="danger"
        onConfirm={() => undefined}
      />
    </Card>
  );
}

function ReservationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-20 animate-pulse rounded-3xl bg-sand-100" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-3xl bg-sand-100" />
        ))}
      </div>
    </div>
  );
}
