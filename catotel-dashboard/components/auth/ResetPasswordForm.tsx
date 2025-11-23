"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { clientRequest } from "@/lib/http-client";

const MIN_PASSWORD_LENGTH = 8;

function getStrengthMeta(password: string) {
  if (!password) {
    return { label: "Şifre gücü", color: "bg-sand-200", width: "0%" };
  }
  const hasUpper = /[A-ZÇĞİÖŞÜ]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(password);

  if (password.length >= 12 && hasUpper && hasNumber && hasSymbol) {
    return { label: "Güçlü", color: "bg-emerald-400", width: "100%" };
  }
  if (password.length >= MIN_PASSWORD_LENGTH) {
    return { label: "Orta", color: "bg-peach-300", width: "65%" };
  }
  return { label: "Zayıf", color: "bg-red-300", width: "35%" };
}

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const tokenMissing = token.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (tokenMissing) {
      setError(
        "Bu sayfada şifre yenileme anahtarı bulunamadı. Lütfen e-postandaki bağlantıyı yeniden aç.",
      );
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      await clientRequest(
        "/api/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({ token, password }),
        },
        { csrf: true },
      );
      setSuccess(true);
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Şifreyi güncellerken beklenmedik bir hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  }

  const strength = getStrengthMeta(password);

  return (
    <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-soft">
      <div className="mb-6 space-y-3 text-center">
        <div className="relative mx-auto h-32 w-44">
          <Image
            src={success ? "/auth-success.svg" : "/auth-reset.svg"}
            alt="Şifre sıfırlama illüstrasyonu"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-2xl font-semibold text-cocoa-700">
          {success ? "Şifre güncellendi" : "Yeni şifre belirle"}
        </h2>
        <p className="text-sm text-slate-500">
          {success
            ? "Artık yeni şifrenle giriş yapabilirsin."
            : "Hesabını güvene almak için güçlü bir şifre oluştur."}
        </p>
      </div>

      {tokenMissing && !success && (
        <StatusBanner variant="error">
          Bu sayfada geçerli bir şifre yenileme jetonu yok. Lütfen e-postandaki linke yeniden tıkla
          veya yeni bir bağlantı iste.
        </StatusBanner>
      )}

      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      {success ? (
        <div className="space-y-4 text-center">
          <StatusBanner variant="success">
            Şifren başarıyla güncellendi!
          </StatusBanner>
          <p className="text-sm text-slate-500">
            Artık yeni şifrenle giriş yapabilirsin.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center rounded-full bg-peach-300 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-peach-400"
          >
            Giriş sayfasına dön
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Yeni şifre"
            placeholder="••••••••"
            type="password"
            leadingIcon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="En az 8 karakter, rakam ve sembol içermesi önerilir."
            required
          />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="relative h-1.5 flex-1 rounded-full bg-sand-200">
              {password && (
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${strength.color}`}
                  style={{ width: strength.width }}
                />
              )}
            </div>
            <span>{strength.label}</span>
          </div>
          <Input
            label="Yeni şifre tekrar"
            placeholder="••••••••"
            type="password"
            leadingIcon={<Lock className="h-4 w-4" />}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button
            type="submit"
            className="w-full"
            disabled={loading || tokenMissing}
          >
            {loading ? "Güncelleniyor..." : "Şifremi Güncelle"}
          </Button>
          <Link
            href="/auth/login"
            className="block text-center text-sm font-semibold text-peach-400 transition hover:underline"
          >
            ← Giriş sayfasına dön
          </Link>
        </form>
      )}
    </div>
  );
}
