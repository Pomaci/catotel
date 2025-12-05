"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, ArrowUpDown, CheckCircle2, DoorOpen, Edit2, Home, MoreHorizontal, PawPrint, X } from "lucide-react";
import { AdminApi, type AdminRoomListResponse, type AdminRoomTypeListResponse } from "@/lib/api/admin";
import type { Room as HotelRoom, RoomType as RoomTypeModel } from "@/types/hotel";

type RoomStatus = "ACTIVE" | "INACTIVE";
type SortKey = "name" | "capacity" | "status" | "rate" | "units";

type RoomTypeFormValues = {
  name: string;
  capacity: number;
  status: RoomStatus;
  description?: string;
  nightlyRate: number;
  overbookingLimit: number;
};

type RoomFormValues = {
  name: string;
  roomTypeId: string;
  status: RoomStatus;
  description?: string;
};

type RoomTypeListNormalized = {
  items: RoomTypeModel[];
  total: number;
  page: number;
  pageSize: number;
  clientPaginate: boolean;
};

type ToastState = { type: "success" | "error"; message: string } | null;

export default function RoomsPage() {
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "name", direction: "asc" });
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [roomMenuId, setRoomMenuId] = useState<string | null>(null);
  const [roomTypeModal, setRoomTypeModal] = useState<{ mode: "create" | "edit"; roomType?: RoomTypeModel | null } | null>(null);
  const [roomModal, setRoomModal] = useState<{ mode: "create" | "edit"; room?: HotelRoom | null } | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-room-actions]")) {
        setOpenMenuId(null);
        setRoomMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const roomTypeQuery = useQuery<RoomTypeModel[] | AdminRoomTypeListResponse>({
    queryKey: ["admin-room-types"],
    queryFn: () => AdminApi.listRoomTypes({ includeInactive: true }),
    staleTime: 30_000,
  });

  const roomQuery = useQuery<HotelRoom[] | AdminRoomListResponse>({
    queryKey: ["admin-rooms"],
    queryFn: () => AdminApi.listRooms({ includeInactive: true }),
    staleTime: 30_000,
  });

  const normalizedTypes = normalizeRoomTypeList(roomTypeQuery.data, page, perPage);
  const sortedRoomTypes = useMemo(() => sortRoomTypes(normalizedTypes.items, sort), [normalizedTypes.items, sort]);
  const paginatedRoomTypes = normalizedTypes.clientPaginate
    ? sortedRoomTypes.slice((normalizedTypes.page - 1) * normalizedTypes.pageSize, normalizedTypes.page * normalizedTypes.pageSize)
    : sortedRoomTypes;
  const pageCount = Math.max(1, Math.ceil((normalizedTypes.total || paginatedRoomTypes.length || 1) / normalizedTypes.pageSize));
  const roomInventory = useMemo(() => {
    if (!roomQuery.data) return [];
    if (Array.isArray(roomQuery.data)) return roomQuery.data;
    return roomQuery.data.items ?? [];
  }, [roomQuery.data]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil((normalizedTypes.total || 1) / perPage));
    setPage((current) => Math.min(current, maxPage));
  }, [normalizedTypes.total, perPage]);

  const createRoomType = useMutation({
    mutationFn: (payload: Record<string, unknown>) => AdminApi.createRoomType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-room-types"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      setToast({ type: "success", message: "Oda kaydedildi." });
      setRoomTypeModal(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Oda olusturulamadi.";
      setToast({ type: "error", message });
    },
  });

  const updateRoomType = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => AdminApi.updateRoomType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-room-types"] });
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      setToast({ type: "success", message: "Oda guncellendi." });
      setRoomTypeModal(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Oda guncellenemedi.";
      setToast({ type: "error", message });
    },
  });

  const createRoom = useMutation({
    mutationFn: (payload: Record<string, unknown>) => AdminApi.createRoom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-room-types"] });
      setToast({ type: "success", message: "Oda kaydedildi." });
      setRoomModal(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Oda olusturulamadi.";
      setToast({ type: "error", message });
    },
  });

  const updateRoom = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => AdminApi.updateRoom(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["admin-room-types"] });
      setToast({ type: "success", message: "Oda guncellendi." });
      setRoomModal(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Oda guncellenemedi.";
      setToast({ type: "error", message });
    },
  });

  const handleSaveRoomType = async (values: RoomTypeFormValues, existing?: RoomTypeModel | null) => {
    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      capacity: values.capacity,
      nightlyRate: values.nightlyRate,
      overbookingLimit: values.overbookingLimit,
      isActive: values.status === "ACTIVE",
    };
    if (existing?.amenities) payload.amenities = existing.amenities;
    if (existing?.id) await updateRoomType.mutateAsync({ id: existing.id, payload });
    else await createRoomType.mutateAsync(payload);
  };

  const handleSaveRoom = async (values: RoomFormValues, existing?: HotelRoom | null) => {
    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      roomTypeId: values.roomTypeId,
      description: values.description?.trim() || undefined,
      isActive: values.status === "ACTIVE",
    };
    if (existing?.id) await updateRoom.mutateAsync({ id: existing.id, payload });
    else await createRoom.mutateAsync(payload);
  };

  const handleToggleStatus = async (room: RoomTypeModel) => {
    await updateRoomType.mutateAsync({ id: room.id, payload: { isActive: !room.isActive } });
    setOpenMenuId(null);
  };

  const handleToggleRoomStatus = async (room: HotelRoom) => {
    await updateRoom.mutateAsync({ id: room.id, payload: { isActive: !room.isActive } });
    setRoomMenuId(null);
  };

  const isSubmitting = createRoomType.isPending || updateRoomType.isPending;
  const mutationError = (createRoomType.error ?? updateRoomType.error) as unknown;
  const modalError = mutationError ? getErrorMessage(mutationError) : null;
  const roomSubmitting = createRoom.isPending || updateRoom.isPending;
  const roomMutationError = (createRoom.error ?? updateRoom.error) as unknown;
  const roomModalError = roomMutationError ? getErrorMessage(roomMutationError) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Oda Tipi Yonetimi</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--admin-text-strong)]">Oda Tipleri</h1>
          <p className="mt-1 text-sm admin-muted">Stok, kapasite ve fiyatlari oda tipi seviyesinde yonetin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRoomTypeModal({ mode: "create" })}
            className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
          >
            <Home className="h-4 w-4" aria-hidden />
            Oda Tipi Ekle
          </button>
          <button
            type="button"
            onClick={() => setRoomModal({ mode: "create" })}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          >
            <DoorOpen className="h-4 w-4" aria-hidden />
            Oda Ekle
          </button>
        </div>
      </header>

      <section className="admin-surface space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Oda tipi tablosu</p>
            <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">Oda Tipi Listesi</h2>
            <p className="text-xs admin-muted">Stok, kapasite ve durum bilgileri listelenir.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[var(--admin-muted)]">
            <PerPageSelector value={perPage} onChange={(v) => setPerPage(v)} />
            <Pagination currentPage={page} pageCount={pageCount} onChange={setPage} />
            {roomTypeQuery.isFetching && <span className="text-[var(--admin-muted)]">Guncelleniyor...</span>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-[0.3em] admin-muted admin-border">
                <SortableHeader label="Oda Tipi" sortKey="name" currentSort={sort} onSort={(key) => setSort(toggleSort(sort, key))} />
                <SortableHeader label="Kapasite" sortKey="capacity" currentSort={sort} onSort={(key) => setSort(toggleSort(sort, key))} />
                <SortableHeader label="Gece Ucreti" sortKey="rate" currentSort={sort} onSort={(key) => setSort(toggleSort(sort, key))} />
                <SortableHeader label="Oda Adedi" sortKey="units" currentSort={sort} onSort={(key) => setSort(toggleSort(sort, key))} />
                <SortableHeader label="Durum" sortKey="status" currentSort={sort} onSort={(key) => setSort(toggleSort(sort, key))} />
                <th className="py-3 pr-3 text-right font-semibold">Islem</th>
              </tr>
            </thead>
            <tbody>
              {roomTypeQuery.isLoading &&
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b admin-border">
                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="h-11 w-11 rounded-2xl bg-[var(--admin-surface-alt)] animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-3 w-32 rounded-full bg-[var(--admin-surface-alt)] animate-pulse" />
                          <div className="h-3 w-48 rounded-full bg-[var(--admin-surface-alt)] animate-pulse" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-3">
                      <span className="h-6 w-20 rounded-full bg-[var(--admin-surface-alt)] animate-pulse inline-block" />
                    </td>
                    <td className="py-4 pr-3">
                      <span className="h-6 w-16 rounded-full bg-[var(--admin-surface-alt)] animate-pulse inline-block" />
                    </td>
                    <td className="py-4 pr-3">
                      <span className="h-6 w-16 rounded-full bg-[var(--admin-surface-alt)] animate-pulse inline-block" />
                    </td>
                    <td className="py-4 pr-3">
                      <span className="h-6 w-16 rounded-full bg-[var(--admin-surface-alt)] animate-pulse inline-block" />
                    </td>
                    <td />
                  </tr>
                ))}

              {!roomTypeQuery.isLoading &&
                paginatedRoomTypes.map((room) => {
                return (
                    <tr key={room.id} className="group border-b last:border-none transition hover:bg-[var(--admin-surface-alt)] admin-border">
                      <td className="py-4 pr-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--admin-surface-alt)] text-peach-500">
                            <DoorOpen className="h-5 w-5" aria-hidden />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-base font-semibold text-[var(--admin-text-strong)]">
                              <span>{room.name}</span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-highlight-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-peach-500">
                                Oda Tipi
                              </span>
                            </div>
                            <p className="mt-1 max-w-[360px] text-xs leading-relaxed text-[var(--admin-muted)]">{room.description ?? "Aciklama eklenmemis."}</p>
                            <p className="mt-1 text-xs font-semibold text-[var(--admin-muted)]">Gece ucreti: {formatPrice(room.nightlyRate)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 font-semibold admin-border">
                          <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
                          {room.capacity} kedi
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        <div className="text-sm font-semibold text-[var(--admin-text-strong)]">{formatPrice(room.nightlyRate)}</div>
                      </td>
                      <td className="py-4 pr-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 font-semibold admin-border">
                          <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
                          {room.totalUnits ?? 0} oda{room.overbookingLimit ? ` +${room.overbookingLimit} ovb` : ""}
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        <RoomStatus status={room.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="py-4 pr-3 text-right">
                        <div className="flex items-center justify-end gap-2" data-room-actions>
                          <button
                            type="button"
                            onClick={() => setRoomTypeModal({ mode: "edit", roomType: room })}
                            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                          >
                            Duzenle
                          </button>
                          <div className="relative">
                            <button
                              type="button"
                              aria-label="Daha fazla"
                              aria-expanded={openMenuId === room.id}
                              onClick={() => setOpenMenuId((current) => (current === room.id ? null : room.id))}
                              className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                            >
                              <MoreHorizontal className="h-4 w-4" aria-hidden />
                            </button>
                            {openMenuId === room.id && (
                              <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border bg-[var(--admin-surface)] p-2 text-left shadow-lg admin-border">
                                <button
                                  type="button"
                                  onClick={() => setRoomTypeModal({ mode: "edit", roomType: room })}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
                                >
                                  <Edit2 className="h-4 w-4" aria-hidden />
                                  Duzenle
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(room)}
                                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
                                >
                                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                                  {room.isActive ? "Pasiflestir" : "Aktiflestir"}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!roomTypeQuery.isLoading && paginatedRoomTypes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-[var(--admin-muted)]">
                    Henuz oda eklenmedi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {roomTypeQuery.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {roomTypeQuery.error instanceof Error ? roomTypeQuery.error.message : "Oda listesi alinmadi."}
          </div>
        )}

        <div className="flex flex-col gap-2 text-sm font-semibold text-[var(--admin-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>Toplam {normalizedTypes.total} oda tipi bulundu.</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
            <span className="h-2 w-2 rounded-full bg-peach-400" aria-hidden />
            Satir hover ile vurgulanir, islemler sagdaki menude.
          </span>
        </div>
      </section>

      <section className="admin-surface space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">Oda envanteri</p>
            <h2 className="text-xl font-semibold text-[var(--admin-text-strong)]">Oda Listesi</h2>
            <p className="text-xs admin-muted">Fiziksel odalari ekleyip oda tiplerine baglayin.</p>
          </div>
          <button
            type="button"
            onClick={() => setRoomModal({ mode: "create" })}
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
          >
            <DoorOpen className="h-4 w-4" aria-hidden />
            Yeni Oda
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b text-[11px] uppercase tracking-[0.3em] admin-muted admin-border">
                <th className="py-3 pr-3 font-semibold">Oda</th>
                <th className="py-3 pr-3 font-semibold">Tip</th>
                <th className="py-3 pr-3 font-semibold">Durum</th>
                <th className="py-3 pr-3 text-right font-semibold">Islem</th>
              </tr>
            </thead>
            <tbody>
              {roomQuery.isLoading &&
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index} className="border-b admin-border">
                    <td className="py-3 pr-3">
                      <span className="inline-block h-4 w-48 rounded-full bg-[var(--admin-surface-alt)] animate-pulse" />
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-block h-4 w-40 rounded-full bg-[var(--admin-surface-alt)] animate-pulse" />
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-block h-4 w-24 rounded-full bg-[var(--admin-surface-alt)] animate-pulse" />
                    </td>
                    <td />
                  </tr>
                ))}

              {!roomQuery.isLoading &&
                roomInventory.map((room) => (
                  <tr key={room.id} className="border-b last:border-none admin-border">
                    <td className="py-3 pr-3 font-semibold text-[var(--admin-text-strong)]">
                      {room.name}
                      <p className="text-xs font-medium text-[var(--admin-muted)]">{room.description ?? "Aciklama eklenmemis."}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
                        <Home className="h-4 w-4 text-peach-400" aria-hidden />
                        {room.roomType?.name ?? "Oda tipi yok"}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <RoomStatus status={room.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="py-3 pr-3 text-right">
                      <div className="flex items-center justify-end gap-2" data-room-actions>
                        <button
                          type="button"
                          onClick={() => setRoomModal({ mode: "edit", room })}
                          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                        >
                          Duzenle
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            aria-label="Daha fazla"
                            aria-expanded={roomMenuId === room.id}
                            onClick={() => setRoomMenuId((current) => (current === room.id ? null : room.id))}
                            className="rounded-full border bg-[var(--admin-surface-alt)] p-2 text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                          </button>
                          {roomMenuId === room.id && (
                            <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border bg-[var(--admin-surface)] p-2 text-left shadow-lg admin-border">
                              <button
                                type="button"
                                onClick={() => setRoomModal({ mode: "edit", room })}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
                              >
                                <Edit2 className="h-4 w-4" aria-hidden />
                                Duzenle
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleRoomStatus(room)}
                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
                              >
                                <CheckCircle2 className="h-4 w-4" aria-hidden />
                                {room.isActive ? "Pasiflestir" : "Aktiflestir"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

              {!roomQuery.isLoading && roomInventory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm text-[var(--admin-muted)]">
                    Henuz oda eklenmedi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {roomQuery.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {roomQuery.error instanceof Error ? roomQuery.error.message : "Oda listesi alinmadi."}
          </div>
        )}
      </section>

      {roomTypeModal && (
        <RoomTypeModal
          mode={roomTypeModal.mode}
          roomType={roomTypeModal.roomType ?? undefined}
          onClose={() => setRoomTypeModal(null)}
          onSubmit={handleSaveRoomType}
          loading={isSubmitting}
          error={modalError}
        />
      )}

      {roomModal && (
        <RoomInventoryModal
          mode={roomModal.mode}
          room={roomModal.room ?? undefined}
          roomTypes={sortedRoomTypes}
          onClose={() => setRoomModal(null)}
          onSubmit={handleSaveRoom}
          loading={roomSubmitting}
          error={roomModalError}
        />
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

function RoomStatus({ status }: { status: RoomStatus }) {
  return (
    <span className="room-status-pill" data-status={status === "ACTIVE" ? "active" : "inactive"}>
      <span className={clsx("h-2.5 w-2.5 rounded-full", status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" : "bg-slate-400")} aria-hidden />
      {status === "ACTIVE" ? "Aktif" : "Pasif"}
    </span>
  );
}

function SortableHeader({ label, sortKey, currentSort, onSort }: { label: string; sortKey: SortKey; currentSort: { key: SortKey; direction: "asc" | "desc" }; onSort: (key: SortKey) => void }) {
  const active = currentSort.key === sortKey;
  return (
    <th className="py-3 pr-3 font-semibold">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={clsx(
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-left text-[var(--admin-muted)] transition",
          active && "bg-[var(--admin-surface-alt)] text-[var(--admin-text-strong)]",
        )}
      >
        {label}
        <ArrowUpDown className={clsx("h-3.5 w-3.5 text-[var(--admin-muted)] transition", active && "text-[var(--admin-text-strong)]", active && currentSort.direction === "desc" && "rotate-180") } aria-hidden />
      </button>
    </th>
  );
}

function Pagination({ currentPage, pageCount, onChange }: { currentPage: number; pageCount: number; onChange: (page: number) => void }) {
  const pages = Array.from({ length: Math.min(pageCount, 4) }, (_, index) => index + 1);
  return (
    <div className="flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
      <button type="button" className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400 disabled:opacity-50" onClick={() => onChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Onceki sayfa">
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onChange(page)}
          className={clsx(
            "h-8 w-8 rounded-full text-center transition",
            page === currentPage ? "bg-peach-400 text-white shadow-glow" : "text-[var(--admin-muted)] hover:text-peach-400",
          )}
        >
          {page}
        </button>
      ))}
      <button type="button" className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-400 disabled:opacity-50" onClick={() => onChange(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount} aria-label="Sonraki sayfa">
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function PerPageSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-3 py-1 text-xs font-semibold admin-border">
      <span className="text-[var(--admin-muted)]">Sayfa basina</span>
      {[10, 25, 50].map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={clsx(
            "rounded-full px-2 py-1 transition",
            option === value ? "bg-peach-400 text-white shadow-glow" : "text-[var(--admin-muted)] hover:text-peach-400",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

type RoomTypeModalProps = {
  mode: "create" | "edit";
  roomType?: RoomTypeModel;
  onSubmit: (values: RoomTypeFormValues, existing?: RoomTypeModel | null) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
};

function RoomTypeModal({ mode, roomType, onSubmit, onClose, loading, error }: RoomTypeModalProps) {
  const [name, setName] = useState(roomType?.name ?? "");
  const [capacity, setCapacity] = useState<number>(roomType?.capacity ?? 1);
  const [status, setStatus] = useState<RoomStatus>(roomType?.isActive ? "ACTIVE" : "INACTIVE");
  const [description, setDescription] = useState(roomType?.description ?? "");
  const [nightlyRate, setNightlyRate] = useState<number>(Number(roomType?.nightlyRate) || 0);
  const [overbookingLimit, setOverbookingLimit] = useState<number>(roomType?.overbookingLimit ?? 0);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName(roomType?.name ?? "");
    setCapacity(roomType?.capacity ?? 1);
    setStatus(roomType?.isActive ? "ACTIVE" : "INACTIVE");
    setDescription(roomType?.description ?? "");
    setNightlyRate(Number(roomType?.nightlyRate) || 0);
    setOverbookingLimit(roomType?.overbookingLimit ?? 0);
    setFormError(null);
  }, [roomType, mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return setFormError("Oda adi gerekli.");
    if (capacity < 1) return setFormError("Kapasite en az 1 olmali.");
    if (overbookingLimit < 0) return setFormError("Overbooking 0 veya daha fazla olmali.");
    if (!nightlyRate || nightlyRate <= 0) return setFormError("Gece ucreti gerekli.");
    setFormError(null);
    await onSubmit(
      {
        name: name.trim(),
        capacity,
        status,
        overbookingLimit,
        description: description.trim() || undefined,
        nightlyRate: Number(nightlyRate),
      },
      roomType,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-2xl admin-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">{mode === "create" ? "Yeni Oda Tipi" : "Oda Tipi Duzenleme"}</p>
            <h3 className="mt-1 text-2xl font-semibold text-[var(--admin-text-strong)]">{mode === "create" ? "Yeni Oda Tipi Ekle" : "Oda Tipini Duzenle"}</h3>
            <p className="mt-1 text-sm admin-muted">Oda tipi adi, kapasite, durum ve gece ucreti bilgilerini guncelleyin.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500" aria-label="Kapat">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField label="Oda Adi" required>
            <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 admin-border focus-within:border-peach-300 focus-within:ring-2 focus-within:ring-peach-100">
              <Home className="h-4 w-4 text-peach-400" aria-hidden />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Oda 101" className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none" />
            </div>
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Kapasite">
              <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border">
                <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
                <select value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] outline-none">
                  {[1, 2, 3, 4].map((option) => (
                    <option key={option} value={option}>
                      {option} kedi
                    </option>
                  ))}
                </select>
              </div>
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Overbooking toleransi">
              <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border">
                <input
                  type="number"
                  min={0}
                  value={overbookingLimit}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setOverbookingLimit(Number.isNaN(next) ? 0 : Math.max(0, next));
                  }}
                  placeholder="0"
                  className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] outline-none"
                />
                <span className="text-xs font-semibold text-[var(--admin-muted)]">opsiyonel</span>
              </div>
              <p className="mt-1 text-[11px] font-semibold text-[var(--admin-muted)]">
                Opsiyonel: güvenli olduğunda kaç ekstra satışa izin verileceği.
              </p>
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Durum">
              <div className="flex items-center justify-between rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold admin-border">
                <span className="text-[var(--admin-text-strong)]">{status === "ACTIVE" ? "Aktif" : "Pasif"}</span>
                <StatusToggle status={status} onToggle={() => setStatus(status === "ACTIVE" ? "INACTIVE" : "ACTIVE")} />
              </div>
            </FormField>

            <FormField label="Gece Ucreti">
              <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border">
                <input type="number" min={0} step="0.01" value={nightlyRate} onChange={(e) => setNightlyRate(Number(e.target.value))} placeholder="1500" className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] outline-none" />
                <span className="text-xs font-semibold text-[var(--admin-muted)]">TRY</span>
              </div>
            </FormField>
          </div>

          <FormField label="Aciklama (opsiyonel)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Oda aciklamasi, fiziksel ozellikler veya ozel not..." rows={3} className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-sm font-medium text-[var(--admin-text-strong)] shadow-inner transition focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100 admin-border" />
          </FormField>

          {(formError || error) && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              <AlertCircle className="h-4 w-4" aria-hidden />
              <span>{formError || error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:text-peach-500" disabled={loading}>
              Iptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition",
                loading ? "opacity-70" : "hover:-translate-y-0.5",
              )}
            >
              {loading ? "Kaydediliyor..." : mode === "create" ? "Kaydet" : "Guncelle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type RoomInventoryModalProps = {
  mode: "create" | "edit";
  room?: HotelRoom;
  roomTypes: RoomTypeModel[];
  onSubmit: (values: RoomFormValues, existing?: HotelRoom | null) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
};

function RoomInventoryModal({ mode, room, roomTypes, onSubmit, onClose, loading, error }: RoomInventoryModalProps) {
  const [name, setName] = useState(room?.name ?? "");
  const [roomTypeId, setRoomTypeId] = useState<string>(room?.roomTypeId ?? room?.roomType?.id ?? roomTypes[0]?.id ?? "");
  const [status, setStatus] = useState<RoomStatus>(room?.isActive ? "ACTIVE" : "INACTIVE");
  const [description, setDescription] = useState(room?.description ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setName(room?.name ?? "");
    setRoomTypeId(room?.roomTypeId ?? room?.roomType?.id ?? roomTypes[0]?.id ?? "");
    setStatus(room?.isActive ? "ACTIVE" : "INACTIVE");
    setDescription(room?.description ?? "");
    setFormError(null);
  }, [room, mode, roomTypes]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return setFormError("Oda adi gerekli.");
    if (!roomTypeId) return setFormError("Oda tipi secilmeli.");
    setFormError(null);
    await onSubmit(
      {
        name: name.trim(),
        roomTypeId,
        status,
        description: description.trim() || undefined,
      },
      room,
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-2xl admin-border">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] admin-muted">{mode === "create" ? "Yeni Oda" : "Oda Duzenleme"}</p>
            <h3 className="mt-1 text-2xl font-semibold text-[var(--admin-text-strong)]">{mode === "create" ? "Yeni Oda Ekle" : "Odayi Duzenle"}</h3>
            <p className="mt-1 text-sm admin-muted">Oda adi, bagli tipi ve durumunu guncelleyin.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500" aria-label="Kapat">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <FormField label="Oda Adi" required>
            <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 admin-border focus-within:border-peach-300 focus-within:ring-2 focus-within:ring-peach-100">
              <Home className="h-4 w-4 text-peach-400" aria-hidden />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Oda 101" className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none" />
            </div>
          </FormField>

          <FormField label="Oda Tipi" required>
            <div className="rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-2 admin-border">
              <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-[var(--admin-text-strong)] outline-none">
                <option value="">Secin</option>
                {roomTypes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            {!roomTypes.length && <p className="mt-1 text-[11px] font-semibold text-[var(--admin-muted)]">Önce bir oda tipi olusturun.</p>}
          </FormField>

          <FormField label="Durum">
            <div className="flex items-center justify-between rounded-2xl border bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold admin-border">
              <span className="text-[var(--admin-text-strong)]">{status === "ACTIVE" ? "Aktif" : "Pasif"}</span>
              <StatusToggle status={status} onToggle={() => setStatus(status === "ACTIVE" ? "INACTIVE" : "ACTIVE")} />
            </div>
          </FormField>

          <FormField label="Aciklama (opsiyonel)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Oda aciklamasi veya konum bilgisi..." rows={3} className="w-full rounded-2xl border bg-[var(--admin-surface-alt)] px-3 py-3 text-sm font-medium text-[var(--admin-text-strong)] shadow-inner transition focus:border-peach-300 focus:outline-none focus:ring-2 focus:ring-peach-100 admin-border" />
          </FormField>

          {(formError || error) && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
              <AlertCircle className="h-4 w-4" aria-hidden />
              <span>{formError || error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:text-peach-500" disabled={loading}>
              Iptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition",
                loading ? "opacity-70" : "hover:-translate-y-0.5",
              )}
            >
              {loading ? "Kaydediliyor..." : mode === "create" ? "Kaydet" : "Guncelle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--admin-text-strong)]">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] admin-muted">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function StatusToggle({ status, onToggle }: { status: RoomStatus; onToggle: () => void }) {
  const active = status === "ACTIVE";
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx("relative h-9 w-16 rounded-full border px-1 transition admin-border", active ? "bg-peach-400/80" : "bg-[var(--admin-surface)]")}
      aria-pressed={active}
    >
      <span className={clsx("absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[var(--admin-muted)] shadow-sm transition", active ? "translate-x-7 text-peach-500" : "translate-x-0")}>
        {active ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <X className="h-4 w-4" aria-hidden />}
      </span>
    </button>
  );
}

function Toast({ type, message, onClose }: { type: "success" | "error"; message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={clsx("flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg", type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600")}>
        <span>{message}</span>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-500">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Beklenmeyen bir hata olustu.";
}

function normalizeRoomTypeList(data: AdminRoomTypeListResponse | RoomTypeModel[] | undefined, fallbackPage: number, fallbackPageSize: number): RoomTypeListNormalized {
  if (!data) return { items: [], total: 0, page: fallbackPage, pageSize: fallbackPageSize, clientPaginate: true };
  if (Array.isArray(data)) return { items: data, total: data.length, page: fallbackPage, pageSize: fallbackPageSize, clientPaginate: true };
  return {
    items: data.items ?? [],
    total: data.total ?? data.items.length,
    page: data.page ?? fallbackPage,
    pageSize: data.pageSize ?? fallbackPageSize,
    clientPaginate: false,
  };
}

function sortRoomTypes(rooms: RoomTypeModel[], sort: { key: SortKey; direction: "asc" | "desc" }) {
  const copy = [...rooms];
  copy.sort((a, b) => {
    const direction = sort.direction === "asc" ? 1 : -1;
    if (sort.key === "capacity") return (a.capacity - b.capacity) * direction;
    if (sort.key === "status") return (statusOrder(a.isActive ? "ACTIVE" : "INACTIVE") - statusOrder(b.isActive ? "ACTIVE" : "INACTIVE")) * direction;
    if (sort.key === "rate") return (Number(a.nightlyRate) - Number(b.nightlyRate)) * direction;
    if (sort.key === "units") return ((a.totalUnits ?? 0) - (b.totalUnits ?? 0)) * direction;
    return a.name.localeCompare(b.name, "tr") * direction;
  });
  return copy;
}
function toggleSort(current: { key: SortKey; direction: "asc" | "desc" }, key: SortKey): { key: SortKey; direction: "asc" | "desc" } {
  if (current.key === key) {
    const nextDirection: "asc" | "desc" = current.direction === "asc" ? "desc" : "asc";
    return { key, direction: nextDirection };
  }
  return { key, direction: "asc" };
}

function statusOrder(status: RoomStatus) {
  return status === "ACTIVE" ? 0 : 1;
}

function formatPrice(value: number | string) {
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "--";
  return num.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}


