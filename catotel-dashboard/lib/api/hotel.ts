import {
  ReservationStatus,
  type ReservationStatus as ReservationStatusValue,
} from '@/types/enums';
import { clientRequest } from '@/lib/http-client';
import type {
  AddonService,
  CareTask,
  Cat,
  CustomerProfile,
  Reservation,
  Room,
  RoomType,
} from '@/types/hotel';
import type {
  CreateCatPayload,
  CustomerProfileUpdatePayload,
  ReservationRequestPayload,
  ReservationUpdatePayload,
  TaskStatusUpdatePayload,
  CreatePaymentPayload,
  UpdateCatPayload,
} from '@/lib/api/payloads';

export const HotelApi = {
  getProfile: () => clientRequest<CustomerProfile>('/api/customer/me'),
  updateProfile: (payload: CustomerProfileUpdatePayload) =>
    clientRequest<CustomerProfile>(
      '/api/customer/me',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  listCats: () => clientRequest<Cat[]>('/api/customer/cats'),
  createCat: (payload: CreateCatPayload) =>
    clientRequest<Cat>(
      '/api/customer/cats',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  updateCat: (id: string, payload: UpdateCatPayload) =>
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
  listRoomUnits: (includeInactive = false) =>
    clientRequest<Room[]>(
      `/api/rooms${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  listReservations: (status?: ReservationStatusValue) =>
    clientRequest<Reservation[]>(
      `/api/reservations${status ? `?status=${status}` : ''}`,
    ),
  getReservation: (id: string) =>
    clientRequest<Reservation>(`/api/reservations/${id}`),
  createReservation: (payload: ReservationRequestPayload) =>
    clientRequest<Reservation>(
      '/api/reservations',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  updateReservation: (id: string, payload: ReservationUpdatePayload) =>
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
  updateTaskStatus: (id: string, payload: TaskStatusUpdatePayload) =>
    clientRequest<CareTask>(
      `/api/staff/tasks/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  listAddonServices: () => clientRequest<AddonService[]>('/api/addon-services'),
  addReservationPayment: (id: string, payload: CreatePaymentPayload) =>
    clientRequest<Reservation>(
      `/api/reservations/${id}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
};
