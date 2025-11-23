import {
  ReservationStatus,
  type ReservationStatus as ReservationStatusValue,
} from '@/types/enums';
import { clientRequest } from '@/lib/http-client';
import type { CareTask, Cat, CustomerProfile, Reservation, Room } from '@/types/hotel';

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
  listRooms: (includeInactive = false) =>
    clientRequest<Room[]>(
      `/api/rooms${includeInactive ? '?includeInactive=true' : ''}`,
    ),
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
