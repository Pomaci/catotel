import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { HotelApi } from "@/lib/hotel";
import type {
  CareTask,
  Cat,
  CustomerProfile,
  Reservation,
  Room,
} from "@/types/hotel";

type DashboardState = {
  profile?: CustomerProfile;
  cats: Cat[];
  rooms: Room[];
  reservations: Reservation[];
  tasks: CareTask[];
};

const emptyState: DashboardState = {
  profile: undefined,
  cats: [],
  rooms: [],
  reservations: [],
  tasks: [],
};

const toMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message || "Beklenmedik bir hata oluştu.";
  }
  return "Beklenmedik bir hata oluştu.";
};

export function useDashboardData() {
  const { accessToken, user } = useAuth();
  const [state, setState] = useState<DashboardState>(emptyState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageTasks = useMemo(
    () => (user?.role ?? "CUSTOMER") !== "CUSTOMER",
    [user?.role],
  );

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setState(emptyState);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tasksPromise = canManageTasks
        ? HotelApi.listStaffTasks().catch((err: unknown) => {
            if (err instanceof Error) {
              if (err.message.includes("401") || err.message.includes("403")) {
                return [];
              }
            }
            throw err;
          })
        : Promise.resolve([]);

      const [profile, cats, rooms, reservations, tasks] = await Promise.all([
        HotelApi.getProfile(),
        HotelApi.listCats(),
        HotelApi.listRooms(false),
        HotelApi.listReservations(),
        tasksPromise,
      ]);

      setState({
        profile,
        cats,
        rooms,
        reservations,
        tasks,
      });
    } catch (err) {
      setError(toMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, canManageTasks]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    ...state,
    loading,
    error,
    refetch: fetchData,
    canManageTasks,
  };
}
