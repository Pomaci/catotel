"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { clientRequest } from "@/lib/http-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSubmitted(false);

    try {
      await clientRequest(
        "/api/auth/forgot-password",
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
        { csrf: true },
      );
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "İşlem sırasında beklenmedik bir hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-soft">
      <div className="mb-6 space-y-3 text-center">
        <div className="relative mx-auto h-28 w-40">
          <Image
            src="/auth-forgot.svg"
            alt="Şifre unutma illüstrasyonu"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-2xl font-semibold text-cocoa-700">
          Şifreni mi unuttun?
        </h2>
        <p className="text-sm text-slate-500">
          E-posta adresini yaz, sana şifre yenileme bağlantısı gönderelim.
        </p>
      </div>
      {submitted && (
        <StatusBanner variant="success">
          Şifre yenileme bağlantısı {email} adresine gönderildi (adres kayıtlıysa).
        </StatusBanner>
      )}
      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          label="E-posta"
          placeholder="ornek@mail.com"
          type="email"
          leadingIcon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Gönderiliyor..." : "Şifre Yenileme Bağlantısı Gönder"}
        </Button>
        <p className="text-center text-xs text-slate-500">
          E-posta gelmediyse spam klasörünü kontrol etmeyi unutma.
        </p>
        <Link
          href="/auth/login"
          className="block text-center text-sm font-semibold text-peach-400 transition hover:underline"
        >
          ← Geri dön
        </Link>
      </form>
    </div>
  );
}

