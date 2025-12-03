"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User2, Phone, Lock, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { StatusBanner } from "@/components/ui/StatusBanner";

export function RegisterForm() {
  const { register: registerUser, error, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    catName: "",
    neutered: "Evet",
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    marketing: false,
  });
  const [helper, setHelper] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHelper(null);
    if (form.password !== form.confirm) {
      setHelper("Şifreler eşleşmiyor.");
      return;
    }
    if (!agreements.terms) {
      setHelper("Kullanım koşullarını kabul etmelisin.");
      return;
    }
    const profile = await registerUser(form.email, form.password, form.name);
    if (profile) {
      setSuccess("Hesap oluÅŸturuldu! YÃ¶nlendiriliyorsun...");
      setHelper(null);
      setTimeout(() => router.replace("/dashboard"), 300);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 space-y-2">
        <h2 className="text-3xl font-semibold text-cocoa-700">Yeni hesap oluştur</h2>
        <p className="text-sm text-slate-500">
          Kedin için rezervasyon yapabilmek için birkaç bilgiye ihtiyacımız var.
        </p>
      </div>
      {error && <StatusBanner variant="error">{error}</StatusBanner>}
      {helper && <StatusBanner variant="error">{helper}</StatusBanner>}
      {success && <StatusBanner variant="success">{success}</StatusBanner>}
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Ad Soyad"
          placeholder="Luna Kedi"
          leadingIcon={<User2 className="h-4 w-4" />}
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        <Input
          label="E-posta"
          placeholder="ornek@mail.com"
          type="email"
          leadingIcon={<Mail className="h-4 w-4" />}
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          required
        />
        <Input
          label="Telefon Numarası"
          placeholder="+90 555 555 55 55"
          type="tel"
          leadingIcon={<Phone className="h-4 w-4" />}
          value={form.phone}
          onChange={(e) => updateField("phone", e.target.value)}
        />
        <Input
          label="Şifre"
          placeholder="••••••••"
          type="password"
          leadingIcon={<Lock className="h-4 w-4" />}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          helperText="En az 8 karakter olmalı."
          required
        />
        <Input
          label="Şifre Tekrar"
          placeholder="••••••••"
          type="password"
          leadingIcon={<Lock className="h-4 w-4" />}
          value={form.confirm}
          onChange={(e) => updateField("confirm", e.target.value)}
          required
        />

        <div className="rounded-3xl border border-sand-200 bg-white/80 p-4">
          <p className="text-sm font-semibold text-cocoa-700">
            Kedin hakkında (opsiyonel)
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label="Kedi adı"
              placeholder="Misket"
              value={form.catName}
              onChange={(e) => updateField("catName", e.target.value)}
            />
            <label className="flex flex-col gap-2 text-xs font-medium text-cocoa-600">
              <span className="uppercase tracking-[0.2em] text-slate-400">
                Kısır mı?
              </span>
              <select
                className="rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 outline-none focus:border-lagoon-400 focus:ring-2 focus:ring-lagoon-100"
                value={form.neutered}
                onChange={(e) => updateField("neutered", e.target.value)}
              >
                <option>Evet</option>
                <option>Hayır</option>
              </select>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <Checkbox
            label={
              <>
                <span>
                  Kullanım koşullarını ve{" "}
                  <Link href="#" className="font-semibold text-peach-400 hover:underline">
                    gizlilik politikasını
                  </Link>{" "}
                  kabul ediyorum.
                </span>
              </>
            }
            checked={agreements.terms}
            onChange={(e) =>
              setAgreements((prev) => ({ ...prev, terms: e.target.checked }))
            }
          />
          <Checkbox
            label="Kampanya ve duyuruları e-posta ile almak istiyorum."
            checked={agreements.marketing}
            onChange={(e) =>
              setAgreements((prev) => ({
                ...prev,
                marketing: e.target.checked,
              }))
            }
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
        </Button>

        <p className="text-center text-sm text-slate-500">
          Zaten hesabın var mı?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-peach-400 transition hover:underline"
          >
            Giriş yap
          </Link>
        </p>
      </form>
    </div>
  );
}
