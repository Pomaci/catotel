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
    apiRequest<CustomerProfile>({
      method: 'GET',
      url: '/customers/me',
    }),

  updateProfile: (payload: Partial<CustomerProfile>) =>
    apiRequest<CustomerProfile>({
      method: 'PATCH',
      url: '/customers/me',
      body: payload,
      mediaType: 'application/json',
    }),

  listCats: () =>
    apiRequest<Cat[]>({
      method: 'GET',
      url: '/customers/cats',
    }),

  createCat: (payload: Record<string, unknown>) =>
    apiRequest<Cat>({
      method: 'POST',
      url: '/customers/cats',
      body: payload,
      mediaType: 'application/json',
    }),

  updateCat: (id: string, payload: Record<string, unknown>) =>
    apiRequest<Cat>({
      method: 'PATCH',
      url: `/customers/cats/${id}`,
      body: payload,
      mediaType: 'application/json',
    }),

  listRooms: (includeInactive = false) =>
    apiRequest<Room[]>(
      {
        method: 'GET',
        url: '/rooms',
        query: includeInactive ? { includeInactive: true } : undefined,
      },
      { auth: false },
    ),

  listReservations: () =>
    apiRequest<Reservation[]>({
      method: 'GET',
      url: '/reservations',
    }),

  createReservation: (payload: Record<string, unknown>) =>
    apiRequest<Reservation>({
      method: 'POST',
      url: '/reservations',
      body: payload,
      mediaType: 'application/json',
    }),

  listStaffTasks: () =>
    apiRequest<CareTask[]>({
      method: 'GET',
      url: '/staff/tasks',
    }),

  updateTaskStatus: (
    id: string,
    payload: { status: CareTaskStatus; notes?: string },
  ) =>
    apiRequest<CareTask>({
      method: 'PATCH',
      url: `/staff/tasks/${id}/status`,
      body: payload,
      mediaType: 'application/json',
    }),
};
