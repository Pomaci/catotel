"use client";

import { ReservationWizard } from "@/components/reservations/ReservationWizard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HotelApi } from "@/lib/api/hotel";
import { useState } from "react";
import { USER_ROLES } from "@/types/enums";
import { StatusBanner } from "@/components/ui/StatusBanner";

export default function ReservationCreatePage() {
  const queryClient = useQueryClient();
  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: () => HotelApi.listRooms() });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => HotelApi.listCats() });
  const { data: profile } = useQuery({ queryKey: ["customer-profile"], queryFn: () => HotelApi.getProfile() });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customerCreated, setCustomerCreated] = useState<string | null>(null);
  const staffRoles = USER_ROLES.filter((r) => r !== "CUSTOMER");
  const allowNewCustomer = profile?.user?.role
    ? staffRoles.includes(profile.user.role)
    : false;

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
      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {success && <StatusBanner variant="success">{success}</StatusBanner>}
      {customerCreated && (
        <StatusBanner variant="success">
          Yeni müşteri oluşturuldu: {customerCreated}
        </StatusBanner>
      )}
      <ReservationWizard
        mode="create"
        rooms={rooms}
        cats={cats}
        customerName={profile?.user.name ?? profile?.user.email ?? null}
        onSubmitAction={handleSubmit}
        submitting={createMutation.isLoading}
        allowNewCustomer={Boolean(allowNewCustomer)}
        customerCreatedCallbackAction={(label) => setCustomerCreated(label)}
      />
    </div>
  );
}
