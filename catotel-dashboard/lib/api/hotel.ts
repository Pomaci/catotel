import {
  ReservationStatus,
  type ReservationStatus as ReservationStatusValue,
} from '@/types/enums';
import { clientRequest } from '@/lib/http-client';
import type { CareTask, Cat, CustomerProfile, Reservation, RoomType } from '@/types/hotel';

export const HotelApi = {
  getProfile: () => clientRequest<CustomerProfile>('/api/customer/me'),
  updateProfile: (payload: Record<string, unknown>) =>
    clientRequest<CustomerProfile>(
      '/api/customer/me',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  listCats: () => clientRequest<Cat[]>('/api/customer/cats'),
  createCat: (payload: Record<string, unknown>) =>
    clientRequest<Cat>(
      '/api/customer/cats',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  updateCat: (id: string, payload: Record<string, unknown>) =>
    clientRequest<Cat>(
      `/api/customer/cats/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  listRooms: (includeInactive = false, checkIn?: string, checkOut?: string, partySize?: number) => {
    const params = new URLSearchParams();
    if (includeInactive) params.set('includeInactive', 'true');
    if (checkIn && checkOut) {
      params.set('checkIn', checkIn);
      params.set('checkOut', checkOut);
    }
    if (partySize) {
      params.set('partySize', String(partySize));
    }
    const qs = params.toString();
    return clientRequest<RoomType[]>(`/api/room-types${qs ? `?${qs}` : ''}`);
  },
  listReservations: (status?: ReservationStatusValue) =>
    clientRequest<Reservation[]>(
      `/api/reservations${status ? `?status=${status}` : ''}`,
    ),
  getReservation: (id: string) =>
    clientRequest<Reservation>(`/api/reservations/${id}`),
  createReservation: (payload: Record<string, unknown>) =>
    clientRequest<Reservation>(
      '/api/reservations',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  updateReservation: (id: string, payload: Record<string, unknown>) =>
    clientRequest<Reservation>(
      `/api/reservations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  deleteReservation: (id: string) =>
    clientRequest<Reservation>(
      `/api/reservations/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: ReservationStatus.CANCELLED }),
      },
      { csrf: true },
    ),
  listStaffTasks: () => clientRequest<CareTask[]>('/api/staff/tasks'),
  updateTaskStatus: (id: string, payload: Record<string, unknown>) =>
    clientRequest<CareTask>(
      `/api/staff/tasks/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
};
