import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { HotelApi } from "@/lib/hotel";
import type {
  CareTask,
  Cat,
  CustomerProfile,
  Reservation,
  Room,
} from "@/types/hotel";
import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const queryKeys = {
  profile: ["dashboard", "profile"] as const,
  cats: ["dashboard", "cats"] as const,
  rooms: (includeInactive: boolean) =>
    ["dashboard", "rooms", { includeInactive }] as const,
  reservations: ["dashboard", "reservations"] as const,
  tasks: ["dashboard", "tasks"] as const,
};

export function useDashboardData() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const canManageTasks = useMemo(
    () => (user?.role ?? "CUSTOMER") !== "CUSTOMER",
    [user?.role],
  );
  const enabled = Boolean(accessToken);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: HotelApi.getProfile,
    enabled,
  });

  const catsQuery = useQuery({
    queryKey: queryKeys.cats,
    queryFn: HotelApi.listCats,
    enabled,
  });

  const roomsQuery = useQuery({
    queryKey: queryKeys.rooms(false),
    queryFn: () => HotelApi.listRooms(false),
    enabled,
  });

  const reservationsQuery = useQuery({
    queryKey: queryKeys.reservations,
    queryFn: HotelApi.listReservations,
    enabled,
  });

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: HotelApi.listStaffTasks,
    enabled: enabled && canManageTasks,
    staleTime: 30 * 1000,
  });

  const loading =
    enabled &&
    (profileQuery.isPending ||
      catsQuery.isPending ||
      roomsQuery.isPending ||
      reservationsQuery.isPending ||
      (canManageTasks && tasksQuery.isPending));

  const errorSource =
    profileQuery.error ||
    catsQuery.error ||
    roomsQuery.error ||
    reservationsQuery.error ||
    tasksQuery.error;

  const errorMessage =
    errorSource instanceof Error
      ? errorSource.message
      : errorSource
        ? String(errorSource)
        : null;

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const invalidations: Array<Promise<unknown>> = [
      queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
      queryClient.invalidateQueries({ queryKey: queryKeys.cats }),
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms(false) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations }),
    ];
    if (canManageTasks) {
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
      );
    }
    await Promise.all(invalidations);
  }, [canManageTasks, enabled, queryClient]);

  const profile = profileQuery.data as CustomerProfile | undefined;
  const cats = (catsQuery.data ?? []) as Cat[];
  const rooms = (roomsQuery.data ?? []) as Room[];
  const reservations = (reservationsQuery.data ?? []) as Reservation[];
  const tasks = (tasksQuery.data ?? []) as CareTask[];

  return {
    profile,
    cats,
    rooms,
    reservations,
    tasks,
    loading,
    error: errorMessage,
    refetch,
    canManageTasks,
  };
}
