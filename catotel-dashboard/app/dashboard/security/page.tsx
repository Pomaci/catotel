"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import clsx from "clsx";
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  FileText,
  Mail,
  MessageSquare,
  Shield,
  UploadCloud,
  Users2,
  X,
} from "lucide-react";

type SettingsTab = "general" | "pricing" | "notifications" | "roles";

const tabItems: { id: SettingsTab; label: string; description: string; comingSoon?: boolean }[] = [
  { id: "general", label: "Genel", description: "Otel kimliği ve iletişim" },
  { id: "pricing", label: "Fiyatlandırma", description: "Oda tipi fiyatları" },
  { id: "notifications", label: "Bildirimler", description: "Email & SMS şablonları" },
  { id: "roles", label: "Kullanıcı & Roller", description: "Yakında", comingSoon: true },
];

type GeneralFormValues = {
  hotelName: string;
  phone: string;
  email: string;
  address: string;
  contactEmail: string;
};

type PricingRow = { id: string; label: string; price: string; currency: string };

type TemplateChannel = "email" | "sms";

type Template = {
  id: string;
  name: string;
  subject?: string;
  body: string;
};

const initialGeneral: GeneralFormValues = {
  hotelName: "Miaow Cat Hotel",
  phone: "+90 555 123 45 67",
  email: "info@miaowhotel.com",
  address: "Güneş Sok. No: 12, Moda / Kadıköy / İstanbul",
  contactEmail: "reservations@miaowhotel.com",
};

const initialPricing: PricingRow[] = [
  { id: "standard", label: "Standart", price: "350", currency: "₺" },
  { id: "deluxe", label: "Deluxe", price: "500", currency: "₺" },
  { id: "suite", label: "Suit", price: "750", currency: "₺" },
  { id: "grand", label: "Büyük Oda", price: "600", currency: "₺" },
];

const initialEmailTemplates: Template[] = [
  {
    id: "reservation-confirmation",
    name: "Rezervasyon Onayı",
    subject: "Miaow Hotel rezervasyonunuz hazır!",
    body: "Merhaba {musteri_adi}, {giris_tarihi} - {cikis_tarihi} tarihleri arasında {oda_adi} odanız onaylandı.",
  },
  {
    id: "checkin-reminder",
    name: "Check-in Hatırlatma",
    subject: "Yarın görüşüyoruz!",
    body: "Kediniz {kedi_adi} için {giris_tarihi} tarihinde check-in bekliyoruz.",
  },
  {
    id: "checkout-info",
    name: "Check-out Bilgilendirme",
    subject: "Check-out için minik bir hatırlatma",
    body: "{cikis_tarihi} tarihinde çıkış işlemlerinizi 12:00’ye kadar tamamlamanızı rica ederiz.",
  },
  {
    id: "cancellation",
    name: "İptal Bildirimi",
    subject: "Rezervasyon iptal edildi",
    body: "Üzgünüz! Rezervasyonunuz talebiniz doğrultusunda iptal edildi.",
  },
];

const initialSmsTemplates: Template[] = [
  {
    id: "sms-confirmation",
    name: "Rezervasyon Onayı",
    body: "Miaow Hotel: {kedi_adi} için {giris_tarihi} - {cikis_tarihi} rezervasyonunuz onaylandı.",
  },
  {
    id: "sms-reminder",
    name: "Check-in Hatırlatma",
    body: "Hatırlatma: {kedi_adi} yarın {giris_saati}’nda bekleniyor. Görüşmek üzere!",
  },
];

const inputClasses =
  "w-full rounded-2xl border bg-[var(--admin-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--admin-text-strong)] placeholder:text-[var(--admin-muted)] focus:outline-none focus:ring-2 focus:ring-peach-100 focus:border-peach-300 admin-border";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [generalValues, setGeneralValues] = useState<GeneralFormValues>(initialGeneral);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [pricingRows, setPricingRows] = useState<PricingRow[]>(initialPricing);
  const [emailTemplates, setEmailTemplates] = useState(initialEmailTemplates);
  const [smsTemplates, setSmsTemplates] = useState(initialSmsTemplates);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<{ channel: TemplateChannel; template: Template } | null>(null);

  const hasChanges = dirty && !saving;

  const handleGeneralChange = (field: keyof GeneralFormValues, value: string) => {
    setGeneralValues((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleLogoUpload = (fileName: string) => {
    setLogoName(fileName);
    setDirty(true);
  };

  const handlePricingChange = (id: string, value: string) => {
    setPricingRows((prev) => prev.map((row) => (row.id === id ? { ...row, price: value } : row)));
    setDirty(true);
  };

  const handleSave = () => {
    if (!hasChanges) return;
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setDirty(false);
      setSaveBanner("Ayarlar başarıyla kaydedildi");
      window.setTimeout(() => setSaveBanner(null), 3200);
    }, 1200);
  };

  const openTemplateModal = (channel: TemplateChannel, id: string) => {
    const source = channel === "email" ? emailTemplates : smsTemplates;
    const template = source.find((tpl) => tpl.id === id);
    if (!template) return;
    setModalPayload({ channel, template });
  };

  const handleTemplateSave = (channel: TemplateChannel, templateId: string, updated: Template) => {
    if (channel === "email") {
      setEmailTemplates((prev) => prev.map((tpl) => (tpl.id === templateId ? { ...tpl, ...updated } : tpl)));
    } else {
      setSmsTemplates((prev) => prev.map((tpl) => (tpl.id === templateId ? { ...tpl, ...updated } : tpl)));
    }
    setDirty(true);
    setModalPayload(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--admin-muted)]">Kontrol Paneli</p>
          <h1 className="mt-1 text-3xl font-semibold text-[var(--admin-text-strong)]">Ayarlar</h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">Otel bilgilerini ve sistem ayarlarını yönetin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {saveBanner && (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-500/10 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {saveBanner}
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={clsx(
              "inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition",
              hasChanges ? "hover:-translate-y-0.5" : "opacity-60",
            )}
          >
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-64">
          <nav className="rounded-3xl border bg-[var(--admin-surface)] p-2 admin-border">
            {tabItems.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "relative flex w-full flex-col rounded-2xl px-4 py-3 text-left transition",
                    active
                      ? "bg-[var(--admin-highlight-muted)] text-[var(--admin-text-strong)]"
                      : "text-[var(--admin-muted)] hover:bg-[var(--admin-highlight-muted)]/60",
                  )}
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <span>{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="rounded-full bg-[var(--admin-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]">
                        yakında
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-[var(--admin-muted)]">{tab.description}</span>
                  <span
                    className={clsx(
                      "absolute inset-y-3 left-2 w-1 rounded-full",
                      active ? "bg-peach-400" : "bg-transparent",
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 space-y-6">
          {activeTab === "general" && (
            <GeneralSettingsCard values={generalValues} logoName={logoName} onChange={handleGeneralChange} onLogoUpload={handleLogoUpload} />
          )}
          {activeTab === "pricing" && <PricingSettingsCard rows={pricingRows} onChange={handlePricingChange} />}
          {activeTab === "notifications" && (
            <NotificationSettingsCard emailTemplates={emailTemplates} smsTemplates={smsTemplates} onEdit={openTemplateModal} />
          )}
          {activeTab === "roles" && <RolesPlaceholderCard />}
        </div>
      </div>

      {modalPayload && (
        <TemplateModal
          channel={modalPayload.channel}
          template={modalPayload.template}
          onClose={() => setModalPayload(null)}
          onSave={(payload) => handleTemplateSave(modalPayload.channel, modalPayload.template.id, payload)}
        />
      )}
    </div>
  );
}

function GeneralSettingsCard({
  values,
  logoName,
  onChange,
  onLogoUpload,
}: {
  values: GeneralFormValues;
  logoName: string | null;
  onChange: (field: keyof GeneralFormValues, value: string) => void;
  onLogoUpload: (fileName: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SettingsCard title="Otel Bilgileri" description="Otelin temel kimlik bilgilerini güncelleyin. Logo alanı tüm uygulamada paylaşılır.">
        <div className="grid gap-5 lg:grid-cols-2">
          <FormField label="Otel Adı">
            <input
              value={values.hotelName}
              onChange={(event) => onChange("hotelName", event.target.value)}
              placeholder="Otel adı"
              className={inputClasses}
            />
          </FormField>
          <FormField label="Telefon Numarası">
            <input
              value={values.phone}
              onChange={(event) => onChange("phone", event.target.value)}
              placeholder="+90 ..."
              className={inputClasses}
            />
          </FormField>
          <FormField label="E-posta">
            <input
              type="email"
              value={values.email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="info@miaowhotel.com"
              className={inputClasses}
            />
          </FormField>
          <FormField label="Adres">
            <textarea
              rows={3}
              value={values.address}
              onChange={(event) => onChange("address", event.target.value)}
              placeholder="Adres"
              className={`${inputClasses} rounded-3xl resize-none`}
            />
          </FormField>
        </div>

        <div className="grid gap-4 md:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center rounded-2xl border bg-[var(--admin-surface-alt)] p-6 text-center admin-border">
            <div className="flex flex-col items-center gap-3">
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--admin-highlight-muted)] text-xl font-semibold text-peach-500">
                {logoName ? logoName.slice(0, 2).toUpperCase() : "MH"}
              </span>
              <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{logoName ?? "Logo yüklenmedi"}</p>
              <p className="text-xs text-[var(--admin-muted)]">Kare veya dairesel logolar desteklenir.</p>
            </div>
          </div>
          <div className="flex flex-col space-y-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
            <p className="text-sm font-semibold">Logo Yükle</p>
            <p className="text-xs text-[var(--admin-muted)]">PNG, SVG veya JPG. Önerilen boyut 512x512 px.</p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-8 text-center transition hover:border-peach-300">
              <UploadCloud className="h-8 w-8 text-peach-400" aria-hidden />
              <span className="text-sm font-semibold text-[var(--admin-text-strong)]">Dosya yükle</span>
              <input
                type="file"
                className="sr-only"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onLogoUpload(file.name);
                }}
              />
              <span className="text-xs text-[var(--admin-muted)]">Sürükleyip bırakabilirsiniz.</span>
            </label>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="İletişim Tercihleri" description="İletişim e-postası rezervasyon onaylarında kullanılacaktır.">
        <FormField label="İletişim E-postası">
          <input
            type="email"
            value={values.contactEmail}
            onChange={(event) => onChange("contactEmail", event.target.value)}
            placeholder="reservations@miaowhotel.com"
            className={inputClasses}
          />
        </FormField>
      </SettingsCard>
    </div>
  );
}

function PricingSettingsCard({ rows, onChange }: { rows: PricingRow[]; onChange: (id: string, value: string) => void }) {
  return (
    <SettingsCard
      title="Oda Tipi Fiyatları"
      description="Oda tipine göre günlük fiyatları yönetin. Girdi değişiklikleri taslak olarak kaydedilir."
      action={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
        >
          <FileText className="h-4 w-4" aria-hidden />
          Toplu Düzenle
        </button>
      }
    >
      <div className="overflow-hidden rounded-2xl border admin-border">
        <div className="hidden grid-cols-[2fr_1fr] bg-[var(--admin-surface-alt)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)] sm:grid">
          <span>Oda Tipi</span>
          <span>Günlük Fiyat</span>
        </div>
        <div className="divide-y admin-border">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-1 gap-4 px-4 py-4 text-sm font-semibold text-[var(--admin-text-strong)] sm:grid-cols-[2fr_1fr] sm:items-center">
              <span>{row.label}</span>
              <div className="flex items-center gap-2 rounded-2xl border bg-[var(--admin-surface)] px-3 py-2 admin-border">
                <input
                  type="number"
                  min={0}
                  value={row.price}
                  onChange={(event) => onChange(row.id, event.target.value)}
                  className="w-full bg-transparent text-sm font-semibold focus:outline-none"
                />
                <span className="text-xs text-[var(--admin-muted)]">{row.currency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SettingsCard>
  );
}

function NotificationSettingsCard({
  emailTemplates,
  smsTemplates,
  onEdit,
}: {
  emailTemplates: Template[];
  smsTemplates: Template[];
  onEdit: (channel: TemplateChannel, id: string) => void;
}) {
  const placeholderList = useMemo(() => ["{kedi_adı}", "{musteri_adi}", "{giris_tarihi}", "{cikis_tarihi}", "{oda_adi}"], []);

  return (
    <SettingsCard title="Bildirim Şablonları" description="Email ve SMS otomasyon şablonlarını özelleştirin.">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-peach-400" aria-hidden />
          <h4 className="text-sm font-semibold text-[var(--admin-text-strong)]">Email Şablonları</h4>
        </div>
        <div className="divide-y rounded-2xl border admin-border">
          {emailTemplates.map((template) => (
            <div key={template.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{template.name}</p>
                <p className="text-xs text-[var(--admin-muted)]">{template.subject}</p>
              </div>
              <button
                type="button"
                onClick={() => onEdit("email", template.id)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
              >
                <Edit3 className="h-4 w-4" aria-hidden />
                Düzenle
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-peach-400" aria-hidden />
          <h4 className="text-sm font-semibold text-[var(--admin-text-strong)]">SMS Şablonları</h4>
        </div>
        <div className="divide-y rounded-2xl border admin-border">
          {smsTemplates.map((template) => (
            <div key={template.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--admin-text-strong)]">{template.name}</p>
                <p className="text-xs text-[var(--admin-muted)]">{template.body.length > 72 ? `${template.body.slice(0, 72)}...` : template.body}</p>
              </div>
              <button
                type="button"
                onClick={() => onEdit("sms", template.id)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
              >
                <Edit3 className="h-4 w-4" aria-hidden />
                Düzenle
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-4 py-3 text-xs text-[var(--admin-muted)]">
        <AlertCircle className="h-4 w-4 text-peach-400" aria-hidden />
        <div>
          <p className="font-semibold text-[var(--admin-text-strong)]">Otomatik gönderimler</p>
          <p>Bu şablonlar müşterilere otomatik gönderilen mesajlarda kullanılacaktır.</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
            {placeholderList.map((item) => (
              <span key={item} className="rounded-full bg-[var(--admin-surface)] px-2 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}

function RolesPlaceholderCard() {
  return (
    <SettingsCard title="Kullanıcı & Rol Yönetimi" description="Güvenlik, yetki ve ekip yönetimi için kapsamlı araçlar yakında ekleniyor.">
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--admin-highlight-muted)] text-peach-500">
          <Users2 className="h-7 w-7" aria-hidden />
        </div>
        <div>
          <p className="text-lg font-semibold text-[var(--admin-text-strong)]">Kullanıcı & Rol Yönetimi Yakında</p>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">Bu özellik ilerleyen sürümlerde aktif olacaktır. Ekibinizi rollerle özelleştirebileceksiniz.</p>
        </div>
      </div>
    </SettingsCard>
  );
}

function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-sm admin-border">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">Ayar bloğu</p>
          <h3 className="text-xl font-semibold text-[var(--admin-text-strong)]">{title}</h3>
          {description && <p className="mt-1 text-sm text-[var(--admin-muted)]">{description}</p>}
        </div>
        {action}
      </header>
      <div className="mt-6 space-y-5">{children}</div>
    </section>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-[var(--admin-text-strong)]">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">{label}</span>
      {children}
    </label>
  );
}

type TemplateModalProps = {
  channel: TemplateChannel;
  template: Template;
  onClose: () => void;
  onSave: (template: Template) => void;
};

function TemplateModal({ channel, template, onClose, onSave }: TemplateModalProps) {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject ?? "");
  const [body, setBody] = useState(template.body);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({ ...template, name, subject: channel === "email" ? subject : undefined, body });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-2xl admin-border">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">{channel === "email" ? "Email Şablonu" : "SMS Şablonu"}</p>
            <h3 className="mt-1 text-2xl font-semibold text-[var(--admin-text-strong)]">{template.name}</h3>
            <p className="mt-1 text-sm text-[var(--admin-muted)]">Dinamik alanlar: {"{kedi_adı}, {musteri_adi}, {giris_tarihi}, {cikis_tarihi}, {oda_adi}"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--admin-muted)] transition hover:bg-[var(--admin-surface-alt)] hover:text-peach-500"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <FormField label="Şablon Adı">
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClasses} />
          </FormField>
          {channel === "email" && (
            <FormField label="Konu">
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className={inputClasses} />
            </FormField>
          )}
          <FormField label="Mesaj Gövdesi">
            <textarea
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className={`${inputClasses} rounded-3xl`}
            />
          </FormField>
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-4 py-3 text-xs text-[var(--admin-muted)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-peach-400" aria-hidden />
              <span>Şablonlar otomatik olarak yedeklenir.</span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.3em]">Light & Dark mode hazır</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:text-peach-500">
              Vazgeç
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
