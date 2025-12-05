"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReservationStatus } from '@/types/enums';
import { HotelApi } from '@/lib/api/hotel';
import type { CareTask, Cat, CustomerProfile, Reservation, RoomType } from '@/types/hotel';

export function useCustomerProfile(enabled = true) {
  return useQuery<CustomerProfile>({
    queryKey: ['customer', 'profile'],
    queryFn: () => HotelApi.getProfile(),
    enabled,
  });
}

export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      HotelApi.updateProfile(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['customer', 'profile'],
      });
    },
  });
}

export function useCats(enabled = true) {
  return useQuery<Cat[]>({
    queryKey: ['customer', 'cats'],
    queryFn: () => HotelApi.listCats(),
    enabled,
  });
}

export function useCreateCat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      HotelApi.createCat(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cats'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

export function useUpdateCat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      HotelApi.updateCat(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer', 'cats'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

export function useRooms(includeInactive = false, enabled = true) {
  return useQuery<RoomType[]>({
    queryKey: ['room-types', includeInactive],
    queryFn: () => HotelApi.listRooms(includeInactive),
    enabled,
  });
}

export function useReservations(
  status?: ReservationStatus,
  enabled = true,
) {
  return useQuery<Reservation[]>({
    queryKey: ['reservations', status ?? 'all'],
    queryFn: () => HotelApi.listReservations(status),
    enabled,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      HotelApi.createReservation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reservations'] });
      void queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

export function useStaffTasks(enabled: boolean) {
  return useQuery<CareTask[]>({
    queryKey: ['staff', 'tasks'],
    queryFn: () => HotelApi.listStaffTasks(),
    enabled,
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => HotelApi.updateTaskStatus(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', 'tasks'] });
    },
  });
}
