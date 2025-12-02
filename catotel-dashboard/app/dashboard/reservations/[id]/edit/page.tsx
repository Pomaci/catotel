"use client";

import { ReservationWizard } from "@/components/reservations/ReservationWizard";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HotelApi } from "@/lib/api/hotel";
import { useState } from "react";

export default function ReservationEditPage() {
  const params = useParams<{ id: string }>();
  const reservationId = params?.id;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: reservation, isLoading: reservationLoading } = useQuery({
    queryKey: ["reservation", reservationId],
    enabled: Boolean(reservationId),
    queryFn: () => HotelApi.getReservation(reservationId!),
  });
  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: () => HotelApi.listRooms() });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => HotelApi.listCats() });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => HotelApi.updateReservation(reservationId!, payload),
    onSuccess: () => {
      setSuccess("Rezervasyon güncellendi.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["reservation", reservationId] });
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: any) => {
      setSuccess(null);
      setError(err?.message ?? "Rezervasyon güncellenemedi.");
    },
  });

  async function handleSubmit(values: {
    roomId: string | null;
    catIds: string[];
    checkIn: string;
    checkOut: string;
    specialRequests?: string;
    customerId?: string | null;
  }) {
    if (!reservationId) return;
    setError(null);
    setSuccess(null);
    await updateMutation.mutateAsync({
      roomId: values.roomId ?? reservation?.room.id,
      catIds: values.catIds,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      specialRequests: values.specialRequests,
    });
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      {success && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p>}
      <ReservationWizard
        mode="edit"
        rooms={rooms}
        cats={cats}
        initialReservation={reservation}
        customerName={reservation?.customer?.user.name ?? reservation?.customer?.user.email ?? null}
        submitting={reservationLoading || updateMutation.isLoading}
        onSubmitAction={handleSubmit}
      />
    </div>
  );
}
