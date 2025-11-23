import { apiRequest } from '@/lib/api-client';
import type {
  CareTask,
  Cat,
  CustomerProfile,
  Reservation,
  Room,
} from '@/types/hotel';
import type { CareTaskStatus } from '@/types/enums';

export const HotelApi = {
  getProfile: () =>
    apiRequest<CustomerProfile>('/customers/me'),

  updateProfile: (payload: Partial<CustomerProfile>) =>
    apiRequest<CustomerProfile>('/customers/me', {
      method: 'PATCH',
      body: payload,
    }),

  listCats: () => apiRequest<Cat[]>('/customers/cats'),

  createCat: (payload: Record<string, unknown>) =>
    apiRequest<Cat>('/customers/cats', {
      method: 'POST',
      body: payload,
    }),

  updateCat: (id: string, payload: Record<string, unknown>) =>
    apiRequest<Cat>(`/customers/cats/${id}`, {
      method: 'PATCH',
      body: payload,
    }),

  listRooms: (includeInactive = false) =>
    apiRequest<Room[]>(
      `/rooms${includeInactive ? '?includeInactive=true' : ''}`,
      { auth: false },
    ),

  listReservations: () =>
    apiRequest<Reservation[]>('/reservations'),

  createReservation: (payload: Record<string, unknown>) =>
    apiRequest<Reservation>('/reservations', {
      method: 'POST',
      body: payload,
    }),

  listStaffTasks: () =>
    apiRequest<CareTask[]>('/staff/tasks'),

  updateTaskStatus: (
    id: string,
    payload: { status: CareTaskStatus; notes?: string },
  ) =>
    apiRequest<CareTask>(`/staff/tasks/${id}/status`, {
      method: 'PATCH',
      body: payload,
    }),
};
