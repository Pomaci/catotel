"use client";

import { useState } from "react";
import {
  Bell,
  HelpCircle,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { ConfirmDialog } from "@/components/guest/ConfirmDialog";
import { SessionList } from "@/components/SessionList";
import { sampleProfile } from "../data";

const viewState: "loaded" | "loading" | "error" = "loaded";

const tabs = [
  { id: "profile", label: "Profil", icon: User },
  { id: "security", label: "Güvenlik", icon: Lock },
  { id: "notifications", label: "Bildirimler", icon: Bell },
  { id: "help", label: "Yardım", icon: HelpCircle },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function GuestAccountPage() {
  const { user, logout, logoutAll, refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [confirmAction, setConfirmAction] = useState<"logout" | "logoutAll" | null>(null);

  if (viewState === "loading") {
    return <AccountSkeleton />;
  }

  if (viewState === "error") {
    return (
      <StatusBanner variant="error">
        Hesap bilgileri yüklenemedi. Lütfen tekrar deneyin.
      </StatusBanner>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Hesap</p>
          <h1 className="text-2xl font-semibold text-cocoa-700">Profil ve ayarlar</h1>
          <p className="text-sm text-slate-500">Hesap bilgilerini güvenle yönet.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  isActive
                    ? "inline-flex items-center gap-2 rounded-full bg-lagoon-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
                    : "inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-xs font-semibold text-cocoa-600 transition hover:border-lagoon-300"
                }
              >
                <Icon className="h-4 w-4" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>

      {activeTab === "profile" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionHeading title="Profil bilgileri" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Ad soyad" defaultValue={user?.name ?? sampleProfile.user.name ?? ""} />
              <Input label="E-posta" defaultValue={user?.email ?? sampleProfile.user.email} />
              <Input label="Telefon" defaultValue={sampleProfile.phone ?? ""} />
              <Input label="Acil durum telefonu" defaultValue={sampleProfile.emergencyContactPhone ?? ""} />
              <Input label="Acil durum kişi" defaultValue={sampleProfile.emergencyContactName ?? ""} />
              <Input label="Veteriner" defaultValue={sampleProfile.preferredVet ?? ""} />
            </div>
            <div className="mt-4 space-y-3">
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Adres
              </label>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 placeholder:text-slate-400 focus:border-lagoon-400 focus:outline-none focus:ring-2 focus:ring-lagoon-100"
                defaultValue={sampleProfile.address ?? ""}
              />
            </div>
            <div className="mt-4 space-y-3">
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Notlar
              </label>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 placeholder:text-slate-400 focus:border-lagoon-400 focus:outline-none focus:ring-2 focus:ring-lagoon-100"
                defaultValue={sampleProfile.notes ?? ""}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-lagoon-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
              >
                Kaydet
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
              >
                Değişiklikleri sıfırla
              </button>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-white via-sand-50 to-lagoon-100/40">
            <SectionHeading title="Hızlı ipuçları" />
            <ul className="mt-4 space-y-3 text-sm text-slate-500">
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-lagoon-600" aria-hidden />
                Acil durum bilgisini güncel tut.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-lagoon-600" aria-hidden />
                Veteriner bilgisi check-in sürecini hızlandırır.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-lagoon-600" aria-hidden />
                Notlar, özel istekleri görünür kılar.
              </li>
            </ul>
          </Card>
        </div>
      )}

      {activeTab === "security" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionHeading title="Güvenlik" />
            <p className="mt-2 text-sm text-slate-500">
              Aktif oturumlarını kontrol et ve güvenliğini artır.
            </p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex w-full items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
              >
                Token yenile
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction("logout")}
                className="inline-flex w-full items-center justify-center rounded-full border border-sand-200 bg-white/90 px-4 py-2 text-sm font-semibold text-cocoa-700 transition hover:border-lagoon-300"
              >
                Çıkış yap
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction("logoutAll")}
                className="inline-flex w-full items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-100"
              >
                Tüm oturumları kapat
              </button>
            </div>
          </Card>
          <Card>
            <SectionHeading title="Aktif oturumlar" />
            <div className="mt-4">
              <SessionList />
            </div>
          </Card>
        </div>
      )}

      {activeTab === "notifications" && (
        <Card>
          <SectionHeading title="Bildirim tercihleri" />
          <p className="mt-2 text-sm text-slate-500">
            Haber ve hatırlatmalar için tercihlerini seçebilirsin.
          </p>
          <div className="mt-4 space-y-3">
            <Checkbox label="E-posta bildirimleri" />
            <Checkbox label="SMS bildirimleri (yakında)" />
            <Checkbox label="WhatsApp bildirimleri (yakında)" />
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-lagoon-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
            >
              Kaydet
            </button>
          </div>
        </Card>
      )}

      {activeTab === "help" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <SectionHeading title="Yardım merkezi" />
            <p className="mt-2 text-sm text-slate-500">
              Rezervasyon kodunla hızlı destek talebi oluşturabilirsin.
            </p>
            <div className="mt-4 space-y-3">
              <Input label="Rezervasyon kodu" placeholder="MIW-4821" />
              <Input label="Konu" placeholder="Ödeme hakkında" />
              <label className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Mesaj
              </label>
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-sand-200 bg-white/80 px-4 py-3 text-sm text-cocoa-700 placeholder:text-slate-400 focus:border-lagoon-400 focus:outline-none focus:ring-2 focus:ring-lagoon-100"
                placeholder="Kısa bir açıklama yazın..."
              />
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-full bg-lagoon-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-lagoon-600"
              >
                Talep oluştur
              </button>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-white via-sand-50 to-peach-50/50">
            <SectionHeading title="İletişim" />
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
                <Phone className="h-4 w-4 text-lagoon-600" aria-hidden />
                +90 212 555 66 77
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-white/90 px-4 py-3">
                <Mail className="h-4 w-4 text-lagoon-600" aria-hidden />
                support@miaowhotel.com
              </div>
              <div className="rounded-2xl border border-sand-200 bg-white/90 px-4 py-3 text-xs text-slate-500">
                Mesai saatleri: 09:00 - 19:00
              </div>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction === "logout"}
        onOpenChange={(open) => setConfirmAction(open ? "logout" : null)}
        title="Çıkış yapmak istiyor musun?"
        description="Oturumunu kapattığında tekrar giriş yapman gerekir."
        confirmLabel="Çıkış yap"
        tone="danger"
        onConfirm={() => void logout()}
      />
      <ConfirmDialog
        open={confirmAction === "logoutAll"}
        onOpenChange={(open) => setConfirmAction(open ? "logoutAll" : null)}
        title="Tüm oturumlar kapatılsın mı?"
        description="Tüm cihazlardan çıkış yapılacak."
        confirmLabel="Tümünü kapat"
        tone="danger"
        onConfirm={() => void logoutAll()}
      />
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-3xl bg-sand-100" />
      <div className="h-96 animate-pulse rounded-3xl bg-sand-100" />
    </div>
  );
}
