"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { StatusBanner } from "@/components/ui/StatusBanner";

export function LoginForm() {
  const { login, error, loading, isAuthenticated, bootstrapping, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!bootstrapping && isAuthenticated && user) {
      router.replace(user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard");
    }
  }, [bootstrapping, isAuthenticated, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const loggedInUser = await login(email, password);
    if (loggedInUser) {
      router.replace(loggedInUser.role === "ADMIN" ? "/dashboard/admin" : "/dashboard");
    }
    if (remember) {
      localStorage.setItem("catotel-remember-email", email);
    } else {
      localStorage.removeItem("catotel-remember-email");
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-semibold text-cocoa-700">Tekrar hoş geldin!</h2>
        <p className="text-sm text-slate-500">
          Kedin için konaklama rezervasyonlarını buradan yönet.
        </p>
      </div>
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
        <Input
          label="Şifre"
          placeholder="••••••••"
          type={showPassword ? "text" : "password"}
          leadingIcon={<Lock className="h-4 w-4" />}
          trailingIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label="Şifreyi göster veya gizle"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          helperText="En az 8 karakter olmalı."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex items-center justify-between text-sm text-slate-600">
          <Checkbox
            label="Beni hatırla"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <Link
            href="/auth/forgot-password"
            className="font-semibold text-peach-400 transition hover:underline"
          >
            Şifremi unuttum
          </Link>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-sand-200" />
          veya
          <span className="h-px flex-1 bg-sand-200" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" className="w-full" disabled title="Yakında!">
            Google ile devam et
          </Button>
          <Button type="button" variant="outline" className="w-full" disabled title="Yakında!">
            Apple ile devam et
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400">Sosyal girişler çok yakında eklenecek.</p>

        <p className="text-center text-sm text-slate-500">
          Hesabın yok mu?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-peach-400 transition hover:underline"
          >
            Kayıt ol
          </Link>
        </p>
      </form>
    </div>
  );
}
