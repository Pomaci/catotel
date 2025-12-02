"use client";

import { ReservationWizard } from "@/components/reservations/ReservationWizard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HotelApi } from "@/lib/api/hotel";
import { useState } from "react";

export default function ReservationCreatePage() {
  const queryClient = useQueryClient();
  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: () => HotelApi.listRooms() });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => HotelApi.listCats() });
  const { data: profile } = useQuery({ queryKey: ["customer-profile"], queryFn: () => HotelApi.getProfile() });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: any) => HotelApi.createReservation(payload),
    onSuccess: () => {
      setSuccess("Rezervasyon başarıyla oluşturuldu.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: any) => {
      setSuccess(null);
      setError(err?.message ?? "Rezervasyon oluşturulamadı.");
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
    setError(null);
    setSuccess(null);
    if (!values.roomId || !values.catIds.length || !values.checkIn || !values.checkOut) {
      setError("Oda, tarih ve kedi seçmek zorunludur.");
      return;
    }
    await createMutation.mutateAsync({
      roomId: values.roomId,
      catIds: values.catIds,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      specialRequests: values.specialRequests,
      customerId: values.customerId ?? undefined,
    });
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      {success && <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p>}
      <ReservationWizard
        mode="create"
        rooms={rooms}
        cats={cats}
        customerName={profile?.user.name ?? profile?.user.email ?? null}
        onSubmitAction={handleSubmit}
        submitting={createMutation.isLoading}
        allowNewCustomer
      />
    </div>
  );
}
