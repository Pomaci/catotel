import { clientRequest } from '@/lib/http-client';
import type { AdminUser, CreateManagedUserInput } from '@/types/user';
import type { UserRole } from '@/types/enums';
import type { Cat, Room, RoomType } from '@/types/hotel';

export type AdminCatOwner = {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
};

export type AdminCatListItem = {
  id: string;
  name: string;
  breed?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  isNeutered: boolean;
  createdAt: string;
  owner: AdminCatOwner;
};

export type AdminCatDetail = AdminCatListItem &
  Pick<Cat, 'dietaryNotes' | 'medicalNotes' | 'weightKg' | 'photoUrl'>;

export type AdminCatListResponse = {
  items: AdminCatListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminRoomListResponse = {
  items: Room[];
  total: number;
  page: number;
  pageSize: number;
};

export type AdminRoomTypeListResponse = {
  items: RoomType[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateAdminCatPayload = {
  customerId: string;
  name: string;
  breed?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  isNeutered?: boolean;
  weightKg?: number | string | null;
  dietaryNotes?: string | null;
  medicalNotes?: string | null;
  photoUrl?: string | null;
};

export const AdminApi = {
  listUsers: () => clientRequest<AdminUser[]>('/api/users'),
  createUser: (payload: CreateManagedUserInput) =>
    clientRequest<AdminUser>(
      '/api/users/management',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  createCustomer: (payload: { email: string; password?: string; name?: string; phone?: string }) =>
    clientRequest<AdminUser>(
      '/api/users/customers',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  updateUserRole: (id: string, role: UserRole) =>
    clientRequest<AdminUser>(
      `/api/users/${id}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
      { csrf: true },
    ),
  searchCustomers: (query: string) =>
    clientRequest('/api/users/customers/search?q=' + encodeURIComponent(query)),
  createRoom: (payload: Record<string, unknown>) =>
    clientRequest(
      '/api/rooms',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  updateRoom: (id: string, payload: Record<string, unknown>) =>
    clientRequest(
      `/api/rooms/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  listRooms: (params?: { page?: number; pageSize?: number; includeInactive?: boolean }) =>
    clientRequest<AdminRoomListResponse | Room[]>(
      '/api/rooms',
      {
        method: 'GET',
        query: {
          includeInactive: params?.includeInactive ? 'true' : undefined,
          page: params?.page,
          pageSize: params?.pageSize,
        },
      },
    ),
  listRoomTypes: (params?: { includeInactive?: boolean; checkIn?: string; checkOut?: string; partySize?: number }) =>
    clientRequest<AdminRoomTypeListResponse | RoomType[]>(
      '/api/room-types',
      {
        method: 'GET',
        query: {
          includeInactive: params?.includeInactive ? 'true' : undefined,
          checkIn: params?.checkIn,
          checkOut: params?.checkOut,
          partySize: params?.partySize,
        },
      },
    ),
  createRoomType: (payload: Record<string, unknown>) =>
    clientRequest(
      '/api/room-types',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  updateRoomType: (id: string, payload: Record<string, unknown>) =>
    clientRequest(
      `/api/room-types/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  listCustomerCats: (customerId: string) =>
    clientRequest(`/api/admin/customers/${customerId}/cats`),
  createCustomerCat: (customerId: string, payload: Record<string, unknown>) =>
    clientRequest(
      `/api/admin/customers/${customerId}/cats`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  listCustomers: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: 'ACTIVE' | 'INACTIVE';
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) =>
    clientRequest(
      '/api/admin/customers',
      {
        method: 'GET',
        query: params,
      },
    ),
  deleteCustomer: (id: string) =>
    clientRequest(
      `/api/admin/customers/${id}`,
      {
        method: 'DELETE',
      },
      { csrf: true },
    ),
  listCats: (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    gender?: string;
    neutered?: boolean;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) =>
    clientRequest<AdminCatListResponse>(
      '/api/admin/cats',
      {
        method: 'GET',
        query: {
          ...params,
          neutered: typeof params.neutered === 'boolean' ? String(params.neutered) : undefined,
        },
      },
    ),
  getCat: (id: string) =>
    clientRequest<AdminCatDetail>(`/api/admin/cats/${id}`),
  createCat: (payload: CreateAdminCatPayload) =>
    clientRequest<AdminCatDetail>(
      '/api/admin/cats',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
  updateCat: (id: string, payload: Partial<CreateAdminCatPayload>) =>
    clientRequest<AdminCatDetail>(
      `/api/admin/cats/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      { csrf: true },
    ),
};
