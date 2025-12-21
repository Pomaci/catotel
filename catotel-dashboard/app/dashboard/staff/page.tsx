"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSameDay, format } from "date-fns";
import {
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Plus,
  UserPlus,
  PawPrint,
} from "lucide-react";
import clsx from "clsx";
import { ReservationWizard, type ReservationWizardValues } from "@/components/reservations/ReservationWizard";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { HotelApi } from "@/lib/api/hotel";
import { AdminApi } from "@/lib/api/admin";
import { useReservations, useStaffTasks, useUpdateTaskStatus } from "@/lib/hooks/useHotelData";
import { buildReservationTasks } from "@/lib/tasks/reservation-tasks";
import type { Reservation, CareTask } from "@/types/hotel";
import { CareTaskStatus, CareTaskType } from "@/types/enums";
import type { ReservationRequestPayload } from "@/lib/api/payloads";

type TodayOperation = {
  id: string;
  type: "CHECKIN" | "CHECKOUT";
  label: string;
  customer?: string | null;
  time?: string | null;
  code?: string | null;
};

export default function StaffDashboardPage() {
  const queryClient = useQueryClient();
  const { data: reservations, isLoading: reservationsLoading, error: reservationsError } = useReservations();
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useStaffTasks(true);
  const { data: roomTypes } = useQuery({ queryKey: ["room-types"], queryFn: () => HotelApi.listRooms() });
  const { data: cats } = useQuery({ queryKey: ["cats"], queryFn: () => HotelApi.listCats() });

  const [customerForm, setCustomerForm] = useState({ email: "", name: "", phone: "" });
  const [customerMessage, setCustomerMessage] = useState<string | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [catForm, setCatForm] = useState({ name: "", notes: "" });
  const [catMessage, setCatMessage] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);
  const [catSearchTerm, setCatSearchTerm] = useState("");
  const [catSearchResults, setCatSearchResults] = useState<Array<{ id: string; name?: string | null; email: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const [reservationMessage, setReservationMessage] = useState<string | null>(null);
  const [reservationError, setReservationError] = useState<string | null>(null);

  const createCustomer = useMutation({
    mutationFn: () =>
      AdminApi.createCustomer({
        email: customerForm.email.trim(),
        name: customerForm.name.trim() || undefined,
        phone: customerForm.phone.trim() || undefined,
      }),
    onSuccess: (created) => {
      setCustomerMessage("Yeni musteri olusturuldu.");
      setCustomerError(null);
      setCustomerForm({ email: "", name: "", phone: "" });
      setSelectedCustomerId(created.id);
      setSelectedCustomerLabel(created.name ?? created.email ?? "");
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: any) => {
      setCustomerMessage(null);
      setCustomerError(err?.message ?? "Musteri olusturulamadi.");
    },
  });

  const createCat = useMutation({
    mutationFn: () =>
      AdminApi.createCustomerCat(selectedCustomerId!, {
        name: catForm.name.trim(),
        medicalNotes: catForm.notes.trim() || undefined,
      }),
    onSuccess: () => {
      setCatMessage("Kedi kaydi olusturuldu.");
      setCatError(null);
      setCatForm({ name: "", notes: "" });
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: any) => {
      setCatMessage(null);
      setCatError(err?.message ?? "Kedi eklenemedi.");
    },
  });

  const createReservation = useMutation({
    mutationFn: (payload: ReservationRequestPayload) => HotelApi.createReservation(payload),
    onSuccess: () => {
      setReservationMessage("Rezervasyon kaydi olusturuldu.");
      setReservationError(null);
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (err: any) => {
      setReservationMessage(null);
      setReservationError(err?.message ?? "Rezervasyon olusturulamadi.");
    },
  });

  const updateTask = useUpdateTaskStatus();

  const todayOperations = useMemo(() => buildTodayOperations(reservations ?? []), [reservations]);
  const reservationTasks = useMemo(
    () => buildReservationTasks(reservations ?? []),
    [reservations],
  );
  const tasksBusy = tasksLoading || reservationsLoading;

  const handleTaskAdvance = (task: CareTask) => {
    const nextStatus =
      task.status === CareTaskStatus.OPEN
        ? CareTaskStatus.IN_PROGRESS
        : CareTaskStatus.DONE;
    updateTask.mutate({ id: task.id, payload: { status: nextStatus } });
  };

  const handleSearchCustomer = (value: string) => {
    setCatSearchTerm(value);
    setCatMessage(null);
    setCatError(null);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (value.trim().length < 2) {
      setCatSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await AdminApi.searchCustomers(value.trim());
        setCatSearchResults(results ?? []);
      } catch (error: any) {
        setCatError(error?.message ?? "Musteri arama basarisiz.");
      }
    }, 250);
  };

  const handleReservationSubmit = async (values: ReservationWizardValues) => {
    setReservationError(null);
    setReservationMessage(null);
    if (!values.roomTypeId || !values.catIds.length || !values.checkIn || !values.checkOut) {
      setReservationError("Oda, tarih ve kedi secimi zorunlu.");
      return;
    }
    const payload: ReservationRequestPayload = {
      roomTypeId: values.roomTypeId,
      catIds: values.catIds,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      specialRequests: values.specialRequests,
      customerId: values.customerId ?? undefined,
      allowRoomSharing: values.allowRoomSharing ?? true,
      addons:
        values.addons && values.addons.length
          ? values.addons.map((addon) => ({
              serviceId: addon.serviceId,
              quantity: Math.max(1, addon.quantity),
            }))
          : undefined,
    };
    await createReservation.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--admin-muted)]">Operasyon</p>
          <h1 className="text-2xl font-semibold text-[var(--admin-text-strong)]">Personel Paneli</h1>
          <p className="text-sm text-[var(--admin-muted)]">Hizli kayitlar, gunluk akis ve gorevler tek ekranda.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-highlight-muted)] px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)]">
            <PawPrint className="h-4 w-4 text-peach-400" aria-hidden />
            Canli vardiya
          </span>
        </div>
      </header>

      {reservationsError && <StatusBanner variant="error">{String(reservationsError)}</StatusBanner>}
      {tasksError && <StatusBanner variant="error">{String(tasksError)}</StatusBanner>}
      {reservationError && <StatusBanner variant="error">{reservationError}</StatusBanner>}
      {reservationMessage && <StatusBanner variant="success">{reservationMessage}</StatusBanner>}
      {customerError && <StatusBanner variant="error">{customerError}</StatusBanner>}
      {customerMessage && <StatusBanner variant="success">{customerMessage}</StatusBanner>}
      {catError && <StatusBanner variant="error">{catError}</StatusBanner>}
      {catMessage && <StatusBanner variant="success">{catMessage}</StatusBanner>}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card title="Bugunun akisi" icon={<CalendarCheck2 className="h-4 w-4" aria-hidden />}>
          <div className="space-y-3">
            {reservationsLoading && <p className="text-sm text-[var(--admin-muted)]">Rezervasyonlar yukleniyor...</p>}
            {!reservationsLoading && todayOperations.length === 0 && (
              <p className="text-sm text-[var(--admin-muted)]">Bugun icin planli check-in/out bulunmuyor.</p>
            )}
            {todayOperations.map((op) => (
              <div
                key={`${op.id}-${op.type}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 admin-border"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{op.label}</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {op.customer ? `${op.customer} - ` : ""}
                    {op.time ? op.time : "Plan bekleniyor"}
                  </p>
                </div>
                <Link
                  href={`/dashboard/reservations/${op.id}`}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                >
                  Detay
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Gorevler" icon={<ClipboardList className="h-4 w-4" aria-hidden />}>
          {tasksBusy && <p className="text-sm text-[var(--admin-muted)]">Gorevler yukleniyor...</p>}
          {!tasksBusy && reservationTasks.length === 0 && (!tasks || tasks.length === 0) && (
            <p className="text-sm text-[var(--admin-muted)]">Goruntulenecek gorev yok.</p>
          )}
          <div className="space-y-2">
            {(tasks ?? []).map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border bg-[var(--admin-surface)] px-3 py-2 admin-border"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{formatTaskLabel(task)}</p>
                  <p className="text-[11px] text-[var(--admin-muted)]">{task.notes ?? "Not yok"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--admin-highlight-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-strong)]">
                    {task.status}
                  </span>
                  {task.status !== CareTaskStatus.DONE && (
                    <button
                      type="button"
                      onClick={() => handleTaskAdvance(task)}
                      className="inline-flex items-center gap-1 rounded-full bg-peach-400 px-3 py-1 text-xs font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
                      disabled={updateTask.isPending}
                    >
                      {task.status === CareTaskStatus.OPEN ? "Baslat" : "Tamamla"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {reservationTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border bg-[var(--admin-surface)] px-3 py-2 admin-border"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{task.title}</p>
                  <p className="text-[11px] text-[var(--admin-muted)]">{task.detail || "Detay yok"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[var(--admin-highlight-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-text-strong)]">
                    PLANLI
                  </span>
                  <Link
                    href={`/dashboard/reservations/${task.reservationId}`}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                  >
                    Detay
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Yeni musteri" icon={<UserPlus className="h-4 w-4" aria-hidden />}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              label="E-posta"
              value={customerForm.email}
              onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
              type="email"
            />
            <Input
              label="Ad"
              value={customerForm.name}
              onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Telefon"
              value={customerForm.phone}
              onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <button
            type="button"
            onClick={() => createCustomer.mutate()}
            disabled={createCustomer.isPending || !customerForm.email.trim()}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {createCustomer.isPending ? "Kaydediliyor..." : "Musteri olustur"}
          </button>
        </Card>

        <Card title="Musteriye kedi ekle" icon={<PawPrint className="h-4 w-4" aria-hidden />}>
          <Input
            label="Musteri ara (isim/email)"
            value={catSearchTerm}
            onChange={(e) => handleSearchCustomer(e.target.value)}
          />
          <div className="space-y-2 rounded-2xl border bg-[var(--admin-surface-alt)] p-2 admin-border">
            {(catSearchResults ?? []).map((cust) => (
              <button
                key={cust.id}
                type="button"
                onClick={() => {
                  setSelectedCustomerId(cust.id);
                  setSelectedCustomerLabel(cust.name ?? cust.email);
                }}
                className={clsx(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                  selectedCustomerId === cust.id
                    ? "bg-[var(--admin-highlight-muted)] text-[var(--admin-text-strong)]"
                    : "text-[var(--admin-text-strong)] hover:bg-[var(--admin-highlight-muted)]/60",
                )}
              >
                <span className="font-semibold">{cust.name ?? "Isimsiz"}</span>
                <span className="text-xs text-[var(--admin-muted)]">{cust.email}</span>
              </button>
            ))}
            {selectedCustomerLabel && (
              <p className="text-xs text-[var(--admin-muted)]">Secili: {selectedCustomerLabel}</p>
            )}
          </div>
          <div className="mt-2 grid gap-2">
            <Input
              label="Kedi adi"
              value={catForm.name}
              onChange={(e) => setCatForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <textarea
              rows={2}
              value={catForm.notes}
              onChange={(e) => setCatForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Saglik notu (opsiyonel)"
              className="w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border"
            />
          </div>
          <button
            type="button"
            onClick={() => createCat.mutate()}
            disabled={!selectedCustomerId || !catForm.name.trim() || createCat.isPending}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {createCat.isPending ? "Kaydediliyor..." : "Kedi ekle"}
          </button>
        </Card>
      </section>

      <section className="space-y-3">
        <Card title="Rezervasyon asistani" icon={<Plus className="h-4 w-4" aria-hidden />}>
          <ReservationWizard
            mode="create"
            roomTypes={roomTypes}
            cats={cats}
            allowNewCustomer
            onSubmitAction={handleReservationSubmit}
            submitting={createReservation.isPending}
            customerCreatedCallbackAction={(label) => setReservationMessage(`Musteri olusturuldu: ${label}`)}
          />
        </Card>
      </section>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="admin-surface space-y-3 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[var(--admin-highlight-muted)] text-peach-500">
          {icon}
        </span>
        <h2 className="text-lg font-semibold text-[var(--admin-text-strong)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function formatTaskLabel(task: CareTask) {
  const base =
    task.type === CareTaskType.CHECKIN
      ? "Check-in"
      : task.type === CareTaskType.CHECKOUT
        ? "Check-out"
        : task.type;
  const catName = task.cat?.name ? ` - ${task.cat.name}` : "";
  const resCode = (task as any)?.reservation?.code ? ` - ${(task as any).reservation.code}` : "";
  return `${base}${catName}${resCode}`;
}

function buildTodayOperations(reservations: Reservation[]): TodayOperation[] {
  const today = new Date();
  const ops: TodayOperation[] = [];
  reservations.forEach((res) => {
    const checkInDate = new Date(res.checkIn);
    const checkOutDate = new Date(res.checkOut);
    if (isSameDay(checkInDate, today)) {
      ops.push({
        id: res.id,
        type: "CHECKIN",
        label: `Check-in - ${res.cats[0]?.cat.name ?? "Kedi"} (${res.roomType.name})`,
        customer: res.customer?.user.name ?? res.customer?.user.email ?? null,
        time: format(checkInDate, "HH:mm"),
        code: res.code,
      });
    }
    if (isSameDay(checkOutDate, today)) {
      ops.push({
        id: res.id,
        type: "CHECKOUT",
        label: `Check-out - ${res.cats[0]?.cat.name ?? "Kedi"} (${res.roomType.name})`,
        customer: res.customer?.user.name ?? res.customer?.user.email ?? null,
        time: format(checkOutDate, "HH:mm"),
        code: res.code,
      });
    }
  });
  return ops;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

function Input({ label, ...props }: InputProps) {
  return (
    <label className="space-y-1 text-sm font-semibold text-[var(--admin-text-strong)]">
      <span className="block text-[12px] uppercase tracking-[0.25em] text-[var(--admin-muted)]">{label}</span>
      <input
        {...props}
        className={clsx(
          "w-full rounded-xl border bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border",
          props.className,
        )}
      />
    </label>
  );
}
