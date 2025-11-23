"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, bootstrapping } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (bootstrapping) {
      return;
    }
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [bootstrapping, isAuthenticated, isAdmin, router]);

  if (bootstrapping || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Yönetici ekranı yükleniyor..." />
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
