"use client";

import { ReservationWizard, type ReservationWizardValues } from "@/components/reservations/ReservationWizard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HotelApi } from "@/lib/api/hotel";
import { useState } from "react";
import { StatusBanner } from "@/components/ui/StatusBanner";
import type { ReservationRequestPayload } from "@/lib/api/payloads";

export default function ReservationCreatePage() {
  const queryClient = useQueryClient();
  const { data: roomTypes } = useQuery({ queryKey: ["room-types"], queryFn: () => HotelApi.listRooms() });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => HotelApi.listCats() });
  const { data: profile } = useQuery({ queryKey: ["customer-profile"], queryFn: () => HotelApi.getProfile() });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customerCreated, setCustomerCreated] = useState<string | null>(null);
  const allowNewCustomer = profile?.user?.role ? profile.user.role !== "CUSTOMER" : false;

  const createMutation = useMutation({
    mutationFn: (payload: ReservationRequestPayload) => HotelApi.createReservation(payload),
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

  async function handleSubmit(values: ReservationWizardValues) {
    setError(null);
    setSuccess(null);
    if (!values.roomTypeId || !values.catIds.length || !values.checkIn || !values.checkOut) {
      setError("Oda tipi, tarih ve kedi seçmek zorunludur.");
      return;
    }
    const payload: ReservationRequestPayload = {
      roomTypeId: values.roomTypeId,
      catIds: values.catIds,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      specialRequests: values.specialRequests,
      customerId: values.customerId ?? undefined,
      allowRoomSharing: values.allowRoomSharing ?? true,
      addons:
        values.addons && values.addons.length
          ? values.addons.map((addon) => ({
              serviceId: addon.serviceId,
              quantity: Math.max(1, addon.quantity),
            }))
          : undefined,
    };
    await createMutation.mutateAsync(payload);
  }

  return (
    <div className="space-y-6">
      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {success && <StatusBanner variant="success">{success}</StatusBanner>}
      {customerCreated && (
        <StatusBanner variant="success">
          Yeni müşteri oluşturuldu: {customerCreated}
        </StatusBanner>
      )}
      <ReservationWizard
        mode="create"
        roomTypes={roomTypes}
        cats={cats}
        customerName={profile?.user.name ?? profile?.user.email ?? null}
        onSubmitAction={handleSubmit}
        submitting={createMutation.isPending}
        allowNewCustomer={Boolean(allowNewCustomer)}
        customerCreatedCallbackAction={(label) => setCustomerCreated(label)}
      />
    </div>
  );
}
