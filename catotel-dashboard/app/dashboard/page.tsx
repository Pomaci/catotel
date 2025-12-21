"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UnderConstruction } from "@/components/UnderConstruction";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const { isAuthenticated, bootstrapping, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (bootstrapping) {
      return;
    }
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (user?.role === "ADMIN") {
      router.replace("/dashboard/admin");
      return;
    }
    if (user?.role === "STAFF") {
      router.replace("/dashboard/staff");
      return;
    }
    if (user?.role === "MANAGER") {
      router.replace("/dashboard/manager");
      return;
    }
    if (user?.role === "CUSTOMER") {
      router.replace("/dashboard/guest");
      return;
    }
  }, [bootstrapping, isAuthenticated, user, router]);

  if (
    !isAuthenticated ||
    bootstrapping ||
    user?.role === "ADMIN" ||
    user?.role === "STAFF" ||
    user?.role === "MANAGER" ||
    user?.role === "CUSTOMER"
  ) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Panel yukleniyor..." />
      </div>
    );
  }

  return <UnderConstruction />;
}
