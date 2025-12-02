"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

type Props = {
  roles: Array<string>;
  redirectTo?: string;
  children: React.ReactNode;
};

export function RoleGate({ roles, redirectTo = "/dashboard", children }: Props) {
  const { user, isAuthenticated, bootstrapping } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (bootstrapping) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
    if (user && !roles.includes(user.role)) {
      router.replace(redirectTo);
    }
  }, [bootstrapping, isAuthenticated, roles, user, redirectTo, router]);

  if (bootstrapping || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Erişim doğrulanıyor..." />
      </div>
    );
  }

  if (user && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Yönlendiriliyor..." />
      </div>
    );
  }

  return <>{children}</>;
}
