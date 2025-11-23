"use client";

import { useState } from "react";
import { SessionList } from "@/components/SessionList";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { useAuth } from "@/context/AuthContext";

type SecurityAction = "refresh" | "logout" | "logoutAll";

export function SecuritySection() {
  const { refresh, logout, logoutAll } = useAuth();
  const [pending, setPending] = useState<SecurityAction | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: SecurityAction) {
    setPending(action);
    setMessage(null);
    setError(null);
    try {
      if (action === "refresh") {
        await refresh();
        setMessage("Token yenilendi.");
      } else if (action === "logout") {
        await logout();
        setMessage("Mevcut oturum sonlandırıldı.");
      } else {
        await logoutAll();
        setMessage("Tüm cihazlardaki oturumlar kapatıldı.");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "İşlem sırasında hata oluştu.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="surface-card space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-cocoa-700">Güvenlik merkezi</h2>
        <p className="text-sm text-slate-500">
          HttpOnly cookie oturumunu yenile, cihazlardan çıkış yap ve aktif
          oturumlarını incele.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.55fr,_1.45fr]">
        <div className="rounded-3xl border border-sand-200 bg-white/90 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-cocoa-700">
            Oturum kontrolleri
          </h3>
          <p className="text-xs text-slate-500">
            CSRF korumalı proxy üzerinden backend oturumlarını tetikler.
          </p>
          {message && <Alert type="success">{message}</Alert>}
          {error && <Alert type="error">{error}</Alert>}
          <div className="mt-4 flex flex-col gap-3">
            <Button
              type="button"
              variant="ghost"
              disabled={pending === "refresh"}
              onClick={() => void runAction("refresh")}
            >
              {pending === "refresh" ? "Yenileniyor..." : "Token Yenile"}
            </Button>
            <Button
              type="button"
              disabled={pending === "logout"}
              onClick={() => void runAction("logout")}
            >
              {pending === "logout" ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={pending === "logoutAll"}
              onClick={() => void runAction("logoutAll")}
            >
              {pending === "logoutAll"
                ? "Oturumlar kapatılıyor..."
                : "Tüm Oturumları Kapat"}
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-sand-200 bg-white/90 p-5 shadow-sm">
          <SessionList />
        </div>
      </div>
    </section>
  );
}

