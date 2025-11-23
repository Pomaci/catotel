"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionResponseDto } from "@catotel/api-client";
import { useAuth } from "@/context/AuthContext";
import { clientRequest } from "@/lib/http-client";
import { Spinner } from "@/components/ui/Spinner";

export function SessionList() {
  const { isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<SessionResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await clientRequest<SessionResponseDto[]>(
        "/api/auth/sessions",
      );
      setSessions(data);
    } catch (err: any) {
      setError(err?.message ?? "Session listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-cocoa-600">
        <span>Aktif oturumlar</span>
        <button
          onClick={load}
          className="rounded-full border border-sand-200 px-3 py-1 text-xs font-semibold text-lagoon-600 transition hover:border-lagoon-300"
        >
          Yenile
        </button>
      </div>
      {loading && <Spinner label="Yükleniyor..." />}
      {error && <AlertLike>{error}</AlertLike>}
      {!loading && !error && sessions.length === 0 && (
        <p className="rounded-2xl border border-dashed border-sand-200 bg-white/70 p-3 text-sm text-slate-500">
          Aktif oturum bulunamadı. Yeni bir cihazla giriş yaptığınızda burada
          görebilirsiniz.
        </p>
      )}
      <div className="grid gap-3">
        {sessions.map((s) => (
          <article
            key={s.id}
            className="rounded-2xl border border-sand-200 bg-white/80 p-4 text-xs text-cocoa-700 shadow-sm"
          >
            <div className="flex justify-between gap-2 text-slate-500">
              <span className="font-mono text-[11px]">
                #{s.id.slice(0, 10)}
              </span>
              <span>{new Date(s.lastUsedAt).toLocaleString("tr-TR")}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {s.userAgent || "-"}
            </p>
            <p className="text-[11px] text-slate-500">{s.ip || "-"}</p>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] text-slate-500">
              <span>
                Bitiş: {new Date(s.expiresAt).toLocaleString("tr-TR")}
              </span>
              <span>
                Oluşturma: {new Date(s.createdAt).toLocaleString("tr-TR")}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AlertLike({ children }: { children: string }) {
  return (
    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
      {children}
    </p>
  );
}

