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
    }
  }, [bootstrapping, isAuthenticated, user, router]);

  if (!isAuthenticated || bootstrapping || user?.role === "ADMIN") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Panel yükleniyor..." />
      </div>
    );
  }

  return <UnderConstruction />;
}
