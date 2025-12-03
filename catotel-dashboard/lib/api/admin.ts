import { clientRequest } from '@/lib/http-client';
import type { AdminUser, CreateManagedUserInput } from '@/types/user';
import type { UserRole } from '@/types/enums';

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
};
