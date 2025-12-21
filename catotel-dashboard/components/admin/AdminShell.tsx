"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutGrid,
  CalendarCheck2,
  Users2,
  Cat,
  Home,
  ClipboardList,
  BarChart3,
  Settings2,
  Bell,
  ChevronDown,
  Moon,
  Sun,
  PawPrint,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "catotel-admin-theme";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/admin", icon: LayoutGrid },
  { label: "Rezervasyonlar", href: "/dashboard/reservations", icon: CalendarCheck2 },
  { label: "Musteriler", href: "/dashboard/customers", icon: Users2 },
  { label: "Kediler", href: "/dashboard/cats", icon: Cat },
  { label: "Odalar", href: "/dashboard/rooms", icon: Home },
  { label: "Gunluk Operasyon", href: "/dashboard/tasks", icon: ClipboardList },
  { label: "Raporlar", href: "/dashboard/admin/reports", icon: BarChart3 },
  { label: "Ayarlar", href: "/dashboard/security", icon: Settings2 },
];

const staffNavItems: NavItem[] = [
  { label: "Personel Paneli", href: "/dashboard/staff", icon: LayoutGrid },
  { label: "Rezervasyonlar", href: "/dashboard/reservations", icon: CalendarCheck2 },
  { label: "Gorevler", href: "/dashboard/tasks", icon: ClipboardList },
];

const buildNavItems = (role?: string | null): NavItem[] => {
  if (role === "STAFF") return staffNavItems;
  return adminNavItems;
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role ?? "ADMIN";
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);
  const navItems = useMemo(() => buildNavItems(role), [role]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setMode("dark");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, mounted]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <div className={clsx("admin-shell flex min-h-screen text-base")} data-theme={mode}>
      <AdminSidebar
        mode={mode}
        onToggleTheme={toggleMode}
        pathname={pathname}
        navItems={navItems}
        role={role}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <AdminHeader mode={mode} onToggleTheme={toggleMode} role={role} />
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

function AdminHeader({ mode, onToggleTheme, role }: { mode: ThemeMode; onToggleTheme: () => void; role: string }) {
  const { logout, user } = useAuth();
  const nameCandidate = user?.name as unknown;
  const emailCandidate = user?.email;
  const resolvedName =
    typeof nameCandidate === "string" && nameCandidate.trim().length > 0 ? nameCandidate : "Yonetici";
  const resolvedEmail =
    typeof emailCandidate === "string" && emailCandidate.trim().length > 0 ? emailCandidate : "onur@miaow.app";
  const panelLabel = role === "STAFF" ? "Operasyon Paneli" : "Admin Paneli";
  return (
    <header className="flex h-20 items-center justify-between border-b bg-[var(--admin-surface-alt)] px-6 lg:px-10 admin-border">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-highlight)] text-peach-500">
          <Cat className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] admin-muted">Miaow Hotel</p>
          <p className="text-xl font-semibold">{panelLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 lg:gap-4">
        <button
          type="button"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border bg-[var(--admin-surface)] admin-border transition hover:shadow-lg"
          aria-label="Bildirimler"
        >
          <Bell className="h-5 w-5 text-[var(--admin-muted)]" aria-hidden />
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-peach-400 shadow-glow" />
        </button>
        <ThemeToggle mode={mode} onToggle={onToggleTheme} />
        <UserMenu name={resolvedName} email={resolvedEmail} onLogout={logout} />
      </div>
    </header>
  );
}

type SidebarProps = {
  mode: ThemeMode;
  onToggleTheme: () => void;
  pathname: string;
  navItems: NavItem[];
  role: string;
};

function AdminSidebar({ mode, onToggleTheme, pathname, navItems, role }: SidebarProps) {
  const brandTitle = role === "STAFF" ? "Miaow Ops" : "Miaow Admin";
  const brandSubtitle = role === "STAFF" ? "Crew" : "Control";
  return (
    <aside className="admin-sidebar hidden w-64 flex-col lg:flex" aria-label="Sol menu">
      <div className="flex items-center gap-3 border-b px-6 py-5 admin-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--admin-highlight)] text-peach-500">
          <Cat className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold">{brandTitle}</p>
          <p className="text-xs uppercase tracking-[0.3em] admin-muted">{brandSubtitle}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-[var(--admin-highlight)] text-peach-500 shadow-sm"
                  : "text-[var(--admin-muted)] hover:bg-[var(--admin-highlight)]/70 hover:text-peach-400",
              )}
            >
              {isActive && (
                <span className="absolute inset-y-2 left-2 w-1 rounded-full bg-peach-400" aria-hidden />
              )}
              <Icon
                className={clsx("h-4 w-4", isActive ? "text-peach-400" : "text-[var(--admin-muted)]")}
                aria-hidden
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 px-4 pb-6">
        <div className="admin-surface space-y-3 px-4 py-4" data-variant="flat">
          <p className="text-sm font-semibold">Tema</p>
          <p className="text-xs admin-muted">Gunduz / gece arasinda hizlica gecis yap.</p>
          <ThemeToggle mode={mode} onToggle={onToggleTheme} dense />
        </div>
        <div className="flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-medium admin-muted">
          <span>Panel surumu</span>
          <span className="flex items-center gap-2 font-semibold text-peach-400">
            <PawPrint className="h-4 w-4" aria-hidden />
            v1.0.0
          </span>
        </div>
      </div>
    </aside>
  );
}

function ThemeToggle({
  mode,
  onToggle,
  dense,
}: {
  mode: ThemeMode;
  onToggle: () => void;
  dense?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] font-semibold transition focus:outline-none focus:ring-2 focus:ring-peach-300 admin-border",
        dense ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
      )}
      aria-label="Tema degistir"
    >
      <Sun
        className={clsx(
          "h-4 w-4",
          mode === "light" ? "text-peach-400" : "text-[var(--admin-muted)]",
        )}
        aria-hidden
      />
      <span>{mode === "light" ? "Light" : "Dark"}</span>
      <Moon
        className={clsx(
          "h-4 w-4",
          mode === "dark" ? "text-peach-400" : "text-[var(--admin-muted)]",
        )}
        aria-hidden
      />
    </button>
  );
}

function UserMenu({ name, email, onLogout }: { name: string; email: string; onLogout: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-3 rounded-full border bg-[var(--admin-surface)] px-3 py-2 text-left text-sm font-semibold shadow-sm admin-border"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-peach-300 text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block">{name}</span>
          <span className="text-xs font-normal admin-muted">{email}</span>
        </span>
        <ChevronDown className={clsx("h-4 w-4 text-[var(--admin-muted)] transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border bg-[var(--admin-surface)] p-2 text-sm shadow-xl admin-border">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] admin-muted">Hesap</p>
            <p className="mt-1 font-semibold">{name}</p>
            <p className="text-xs admin-muted">{email}</p>
          </div>
          <div className="my-2 h-px bg-[var(--admin-border)]" />
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left font-medium transition hover:bg-[var(--admin-highlight-muted)] hover:text-peach-500"
          >
            Profilim
          </button>
          <button
            type="button"
            className="w-full rounded-xl px-3 py-2 text-left font-medium transition hover:bg-[var(--admin-highlight-muted)] hover:text-peach-500"
          >
            Hesap ayarlari
          </button>
          <div className="my-2 h-px bg-[var(--admin-border)]" />
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-red-500 transition hover:bg-red-50/50 dark:hover:bg-white/10"
            onClick={async () => {
              setOpen(false);
              await onLogout();
            }}
          >
            Cikis yap
          </button>
        </div>
      )}
    </div>
  );
}
