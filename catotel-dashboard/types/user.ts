import type { UserRole } from '@/types/enums';

export type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  hasCustomerProfile: boolean;
  hasStaffProfile: boolean;
  createdAt: string;
};

export type CreateManagedUserInput = {
  email: string;
  password: string;
  name?: string;
  role: Exclude<UserRole, 'CUSTOMER'>;
};
