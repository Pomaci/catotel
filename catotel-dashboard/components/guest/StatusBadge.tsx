"use client";

import { Badge } from "@/components/ui/Badge";
import type { ReservationStatus, PaymentStatus } from "@catotel/contracts/enums";

type Props =
  | { kind: "reservation"; status: ReservationStatus | string; className?: string }
  | { kind: "payment"; status: PaymentStatus | string; className?: string };

const reservationMap: Record<string, { label: string; tone: "default" | "success" | "warning" | "danger" | "info" }> =
  {
    PENDING: { label: "Onay bekliyor", tone: "warning" },
    CONFIRMED: { label: "Onaylandı", tone: "success" },
    CHECKED_IN: { label: "Check-in", tone: "info" },
    CHECKED_OUT: { label: "Check-out", tone: "default" },
    CANCELLED: { label: "İptal edildi", tone: "danger" },
  };

const paymentMap: Record<string, { label: string; tone: "default" | "success" | "warning" | "danger" | "info" }> = {
  PENDING: { label: "Ödeme bekliyor", tone: "warning" },
  PAID: { label: "Ödendi", tone: "success" },
  FAILED: { label: "Başarısız", tone: "danger" },
  REFUNDED: { label: "İade edildi", tone: "info" },
};

export function GuestStatusBadge(props: Props) {
  const { className } = props;
  if (props.kind === "reservation") {
    const meta = reservationMap[props.status] ?? { label: props.status, tone: "default" };
    return (
      <Badge tone={meta.tone} className={className}>
        {meta.label}
      </Badge>
    );
  }
  const meta = paymentMap[props.status] ?? { label: props.status, tone: "default" };
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}
