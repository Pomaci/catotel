"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Bell,
  CalendarDays,
  Cat,
  ChevronDown,
  Home,
  Hotel,
  PawPrint,
  Phone,
  Plus,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ConfirmDialog } from "@/components/guest/ConfirmDialog";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
  { label: "Genel Bakış", href: "/dashboard/guest", icon: Home },
  { label: "Rezervasyonlar", href: "/dashboard/guest/reservations", icon: CalendarDays },
  { label: "Kedilerim", href: "/dashboard/guest/cats", icon: Cat },
  { label: "Oda Tipleri", href: "/dashboard/guest/rooms", icon: Hotel },
  { label: "Hesap", href: "/dashboard/guest/account", icon: User },
];

export function GuestShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = useMemo(() => resolveTitle(pathname), [pathname]);

  return (
    <div className="relative min-h-screen bg-sand-50 text-cocoa-700">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(75,177,161,0.12),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(255,182,115,0.18),_transparent_50%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1280px] gap-6 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
        <GuestSidebar pathname={pathname} />
        <div className="flex min-w-0 flex-1 flex-col">
          <GuestTopbar pageTitle={pageTitle} />
          <main className="mt-6 flex-1 space-y-6">{children}</main>
        </div>
      </div>
      <GuestTabBar pathname={pathname} />
      <GuestFab />
    </div>
  );
}

function resolveTitle(pathname: string | null) {
  if (!pathname) return "Misafir Paneli";
  const match = navItems.find((item) => isNavActive(pathname, item.href));
  return match?.label ?? "Misafir Paneli";
}

function isNavActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/dashboard/guest") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + "/");
}

function GuestTopbar({ pageTitle }: { pageTitle: string }) {
  const { user, logout } = useAuth();
  const nameCandidate = user?.name as unknown;
  const emailCandidate = user?.email;
  const resolvedName =
    typeof nameCandidate === "string" && nameCandidate.trim().length > 0 ? nameCandidate : "Misafir";
  const resolvedEmail =
    typeof emailCandidate === "string" && emailCandidate.trim().length > 0
      ? emailCandidate
      : "misafir@miaow.app";

  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-sand-200 bg-white/80 px-4 py-4 shadow-soft backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lagoon-100 text-lagoon-600">
          <PawPrint className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Miaow Cat Hotel</p>
          <p className="text-lg font-semibold text-cocoa-700 lg:text-xl">Misafir Paneli</p>
          <p className="text-sm text-slate-500 lg:hidden">{pageTitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/guest/reservations/new"
          className="inline-flex items-center gap-2 rounded-full bg-lagoon-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-500"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Yeni rezervasyon
        </Link>
        <button
          type="button"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-sand-200 bg-white/90 text-cocoa-600 shadow-sm transition hover:border-lagoon-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lagoon-500"
          aria-label="Bildirimler"
        >
          <Bell className="h-5 w-5" aria-hidden />
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-peach-400 shadow-glow" />
        </button>
        <GuestUserMenu name={resolvedName} email={resolvedEmail} onLogout={logout} />
      </div>
    </header>
  );
}

function GuestSidebar({ pathname }: { pathname: string | null }) {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-6 lg:flex" aria-label="Misafir menüsü">
      <div className="rounded-[28px] border border-sand-200 bg-white/80 p-4 shadow-soft backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-peach-100 text-peach-500">
            <Cat className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-cocoa-700">Butik Otel</p>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Guest</p>
          </div>
        </div>
      </div>
      <nav className="space-y-2 rounded-[28px] border border-sand-200 bg-white/85 p-3 shadow-soft backdrop-blur">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-lagoon-100 text-lagoon-600 shadow-sm"
                  : "text-cocoa-600 hover:bg-sand-100 hover:text-lagoon-600",
              )}
            >
              <Icon className={clsx("h-4 w-4", isActive ? "text-lagoon-600" : "text-slate-400")} aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="rounded-[28px] border border-sand-200 bg-gradient-to-br from-white via-sand-50 to-peach-50/40 p-4 text-sm text-cocoa-700 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Hızlı iletişim</p>
        <p className="mt-2 text-sm font-semibold">7/24 destek</p>
        <p className="text-xs text-slate-500">Sorularınız için bize yazın.</p>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-lagoon-600">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lagoon-100">
            <Phone className="h-4 w-4" aria-hidden />
          </span>
          +90 212 555 66 77
        </div>
      </div>
    </aside>
  );
}

function GuestTabBar({ pathname }: { pathname: string | null }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sand-200 bg-white/90 px-4 py-2 shadow-soft backdrop-blur lg:hidden" aria-label="Alt menü">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium transition",
                isActive ? "text-lagoon-600" : "text-slate-500 hover:text-lagoon-600",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function GuestFab() {
  return (
    <Link
      href="/dashboard/guest/reservations/new"
      className="fixed bottom-16 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-peach-500 text-white shadow-glow transition hover:bg-peach-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-400 lg:hidden"
      aria-label="Yeni rezervasyon oluştur"
    >
      <Plus className="h-6 w-6" aria-hidden />
    </Link>
  );
}

function GuestUserMenu({ name, email, onLogout }: { name: string; email: string; onLogout: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
        className="flex items-center gap-3 rounded-full border border-sand-200 bg-white/90 px-3 py-2 text-left text-sm font-semibold text-cocoa-700 shadow-sm transition hover:border-lagoon-300"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-peach-300 text-white">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block">{name}</span>
          <span className="text-xs font-normal text-slate-400">{email}</span>
        </span>
        <ChevronDown className={clsx("h-4 w-4 text-slate-400 transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-sand-200 bg-white/95 p-2 text-sm shadow-xl">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Hesap</p>
            <p className="mt-1 font-semibold">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
          <div className="my-2 h-px bg-sand-200" />
          <Link
            href="/dashboard/guest/account"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium transition hover:bg-sand-100 hover:text-lagoon-600"
          >
            <User className="h-4 w-4" aria-hidden />
            Profilim
          </Link>
          <Link
            href="/dashboard/guest/reservations"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-medium transition hover:bg-sand-100 hover:text-lagoon-600"
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
            Rezervasyonlarım
          </Link>
          <div className="my-2 h-px bg-sand-200" />
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold text-red-500 transition hover:bg-red-50"
            onClick={async () => {
              setOpen(false);
              setConfirmOpen(true);
            }}
          >
            Çıkış yap
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Çıkış yapmak istiyor musun?"
        description="Oturumunu kapattığında tekrar giriş yapman gerekir."
        confirmLabel="Çıkış yap"
        tone="danger"
        onConfirm={() => void onLogout()}
      />
    </div>
  );
}
