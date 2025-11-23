"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminUser } from "@/types/user";
import { USER_ROLES } from "@/types/enums";
import type { UserRole } from "@/types/enums";
import { Card } from "@/components/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";

const MANAGED_ROLE_VALUES = ["ADMIN", "MANAGER", "STAFF"] as const;

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().max(120).optional().or(z.literal("")),
  role: z.enum(MANAGED_ROLE_VALUES),
});

type CreateFormValues = z.infer<typeof createSchema>;

const managedRoles: UserRole[] = MANAGED_ROLE_VALUES;

export function AdminUsersSection({
  users,
  loading,
  error,
  onRefresh,
  onCreate,
  onUpdateRole,
}: {
  users: AdminUser[];
  loading: boolean;
  error?: string | null;
  onRefresh(): void;
  onCreate(values: CreateFormValues): Promise<void>;
  onUpdateRole(id: string, role: UserRole): Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "MANAGER",
    },
  });

  return (
    <Card className="space-y-6">
      <SectionHeading
        title="Kullanıcı yönetimi"
        action={
          <button
            type="button"
            className="text-xs font-semibold text-lagoon-600"
            onClick={onRefresh}
          >
            Yenile
          </button>
        }
      />
      {error && <Alert type="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[1.2fr,_0.8fr]">
        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-slate-500">Kullanıcılar yükleniyor...</p>
          )}
          {!loading && users.length === 0 && (
            <p className="text-sm text-slate-500">
              Henüz başka kullanıcı bulunmuyor.
            </p>
          )}
          {users.map((user) => (
            <UserRow key={user.id} user={user} onUpdateRole={onUpdateRole} />
          ))}
        </div>

        <form
          className="space-y-3 rounded-3xl border border-sand-200 bg-white/90 p-5 shadow-sm"
          onSubmit={handleSubmit(async (values) => {
            await onCreate(values);
            reset();
          })}
        >
          <h3 className="text-lg font-semibold text-cocoa-700">
            Yeni personel/Admin
          </h3>
          <Input label="Email" placeholder="personel@mail.com" {...register("email")} />
          {errors.email && <ErrorText message={errors.email.message} />}

          <Input
            label="Şifre"
            type="password"
            placeholder="Minimum 6 karakter"
            {...register("password")}
          />
          {errors.password && <ErrorText message={errors.password.message} />}

          <Input label="Ad (opsiyonel)" placeholder="İsim" {...register("name")} />
          {errors.name && <ErrorText message={errors.name.message} />}

          <label className="text-xs text-slate-500">
            Rol
            <select
              className="mt-1 w-full rounded-2xl border border-sand-200 bg-white/80 px-3 py-2 text-sm text-cocoa-700 outline-none focus:border-lagoon-400"
              {...register("role")}
            >
              {managedRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          {errors.role && <ErrorText message={errors.role.message} />}

          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
          </Button>
        </form>
      </div>
    </Card>
  );
}

function UserRow({
  user,
  onUpdateRole,
}: {
  user: AdminUser;
  onUpdateRole(id: string, role: UserRole): Promise<void>;
}) {
  return (
    <div className="rounded-3xl border border-sand-200 bg-white/90 p-4 text-sm text-cocoa-700 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-cocoa-800">{user.email}</p>
          <p className="text-xs text-slate-500">
            {user.name || "İsim belirtilmemiş"} ·{" "}
            {new Date(user.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>
        <select
          className="rounded-lg border border-sand-200 bg-white px-3 py-1 text-sm text-cocoa-700 outline-none focus:border-lagoon-400"
          value={user.role}
          onChange={(e) => onUpdateRole(user.id, e.target.value as UserRole)}
        >
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        <Tag label={user.role} tone="accent" />
        <Tag
          label={user.hasCustomerProfile ? "Müşteri Profili" : "Müşteri yok"}
          tone={user.hasCustomerProfile ? "accent" : "muted"}
        />
        <Tag
          label={user.hasStaffProfile ? "Personel Profili" : "Personel yok"}
          tone={user.hasStaffProfile ? "success" : "muted"}
        />
      </div>
    </div>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-red-500">{message}</p>;
}

function Tag({
  label,
  tone,
}: {
  label: string;
  tone: "accent" | "success" | "muted";
}) {
  const color =
    tone === "accent"
      ? "border-lagoon-200 text-lagoon-600"
      : tone === "success"
      ? "border-emerald-200 text-emerald-600"
      : "border-sand-200 text-slate-400";
  return (
    <span
      className={`rounded-full border px-3 py-0.5 text-xs font-medium ${color}`}
    >
      {label}
    </span>
  );
}

