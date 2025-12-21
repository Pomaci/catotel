"use client";

import { ReservationWizard, type ReservationWizardValues } from "@/components/reservations/ReservationWizard";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HotelApi } from "@/lib/api/hotel";
import { useState } from "react";
import type { ReservationUpdatePayload } from "@/lib/api/payloads";

export default function ReservationEditPage() {
  const params = useParams<{ id: string }>();
  const reservationId = params?.id;
  const searchParams = useSearchParams();
  const router = useRouter();
  const stepParam = searchParams?.get("step");
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: reservation, isLoading: reservationLoading } = useQuery({
    queryKey: ["reservation", reservationId],
    enabled: Boolean(reservationId),
    queryFn: () => HotelApi.getReservation(reservationId!),
  });
  const { data: roomTypes } = useQuery({ queryKey: ["room-types"], queryFn: () => HotelApi.listRooms() });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => HotelApi.listCats() });

  const updateMutation = useMutation({
    mutationFn: (payload: ReservationUpdatePayload) => HotelApi.updateReservation(reservationId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      router.push(`/dashboard/reservations/${reservationId}`);
    },
    onError: (err: any) => {
      setError(err?.message ?? "Rezervasyon güncellenemedi.");
    },
  });

  async function handleSubmit(values: ReservationWizardValues) {
    if (!reservationId) return;
    setError(null);
    setSuccess(null);
    const payload: ReservationUpdatePayload = {
      roomTypeId: values.roomTypeId ?? reservation?.roomType.id,
      catIds: values.catIds,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      specialRequests: values.specialRequests,
      allowRoomSharing:
        values.allowRoomSharing ??
        reservation?.allowRoomSharing ??
        true,
      addons:
        values.addons && values.addons.length
          ? values.addons.map((addon) => ({
              serviceId: addon.serviceId,
              quantity: Math.max(1, addon.quantity),
            }))
          : undefined,
    };
    await updateMutation.mutateAsync(payload);
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      <ReservationWizard
        mode="edit"
        roomTypes={roomTypes}
        cats={cats}
        initialReservation={reservation}
        customerName={reservation?.customer?.user.name ?? reservation?.customer?.user.email ?? null}
        submitting={reservationLoading || updateMutation.isPending}
        onSubmitAction={handleSubmit}
        initialStep={
          stepParam === "dates" || stepParam === "cats" || stepParam === "pricing"
            ? stepParam
            : "cats"
        }
      />
    </div>
  );
}
