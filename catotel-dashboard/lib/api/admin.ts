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
  updateUserRole: (id: string, role: UserRole) =>
    clientRequest<AdminUser>(
      `/api/users/${id}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
      { csrf: true },
    ),
};
