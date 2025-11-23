"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "./Card";
import { Input } from "./Input";
import { Button } from "./Button";
import { Alert } from "./Alert";

export function AuthForm() {
  const { login, register, error, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const redirectToDashboard = (role?: string) => {
      router.replace(role === "ADMIN" ? "/dashboard/admin" : "/dashboard");
    };
    if (mode === "login") {
      const profile = await login(email, password);
      if (profile) {
        redirectToDashboard(profile.role);
      }
    } else {
      const profile = await register(email, password, name || undefined);
      if (profile) {
        redirectToDashboard(profile.role);
      }
    }
  }

  return (
    <Card className="w-full max-w-md">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {mode === "login" ? "Tekrar hoş geldin" : "Yeni hesap"}
          </p>
          <h2 className="text-2xl font-semibold text-cocoa-700">
            {mode === "login"
              ? "Kedin için konaklama rezervasyonlarını buradan yönet."
              : "Catotel’e kayıt ol ve rezervasyonlarını buradan yönet."}
          </h2>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <Input
              label="Ad soyad"
              placeholder="Luna Kedi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <Input
            label="E-posta"
            placeholder="ornek@mail.com"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Şifre"
            placeholder="••••••••"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>En az 8 karakter olmalı</span>
            {mode === "login" && (
              <button
                type="button"
                className="font-semibold text-lagoon-600"
              >
                Şifremi unuttum
              </button>
            )}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "İşleniyor..."
              : mode === "login"
              ? "Giriş Yap"
              : "Kayıt Ol ve Giriş Yap"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-sand-200" />
          veya
          <span className="h-px flex-1 bg-sand-200" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="rounded-2xl border border-sand-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cocoa-600 transition hover:border-lagoon-300"
          >
            Google ile devam et
          </button>
          <button
            type="button"
            className="rounded-2xl border border-sand-200 bg-white/80 px-4 py-2 text-sm font-semibold text-cocoa-600 transition hover:border-lagoon-300"
          >
            Apple ile devam et
          </button>
        </div>

        <p className="text-xs text-slate-500">
          {mode === "login" ? (
            <>
              Hesabın yok mu?{" "}
              <button
                type="button"
                className="font-semibold text-lagoon-600"
                onClick={() => setMode("register")}
              >
                Kayıt ol
              </button>
            </>
          ) : (
            <>
              Zaten hesabın var mı?{" "}
              <button
                type="button"
                className="font-semibold text-lagoon-600"
                onClick={() => setMode("login")}
              >
                Giriş yap
              </button>
            </>
          )}
        </p>
      </div>
    </Card>
  );
}
