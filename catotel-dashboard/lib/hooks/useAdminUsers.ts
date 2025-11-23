"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminApi } from '@/lib/api/admin';
import type { AdminUser, CreateManagedUserInput } from '@/types/user';
import type { UserRole } from '@/types/enums';

export function useAdminUsers(enabled: boolean) {
  return useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => AdminApi.listUsers(),
    enabled,
  });
}

export function useCreateManagedUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateManagedUserInput) =>
      AdminApi.createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      AdminApi.updateUserRole(id, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
