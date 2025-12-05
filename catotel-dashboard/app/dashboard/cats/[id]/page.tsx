"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  Cat,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Edit3,
  Ellipsis,
  File,
  HeartPulse,
  Inbox,
  Loader2,
  Mail,
  Mars,
  Minus,
  NotebookPen,
  PawPrint,
  Phone,
  Pill,
  Plus,
  Shield,
  Sparkles,
  UploadCloud,
  Venus,
} from "lucide-react";
import { AdminApi, type AdminCatDetail } from "@/lib/api/admin";
import { Spinner } from "@/components/ui/Spinner";

type TabKey = "health" | "behavior" | "reservations" | "files";

const vaccineSchedule = [
  { name: "Karma Aşı", date: "12.01.2024", next: "12.01.2025", status: "güncel" as const },
  { name: "Kuduz", date: "12.01.2024", next: "12.01.2025", status: "yaklaşıyor" as const },
  { name: "Lösemi (FeLV)", date: "15.07.2023", next: "15.07.2024", status: "gecikmiş" as const },
];

const chronicConditions = [
  { name: "Böbrek hassasiyeti", note: "İdrar testi 6 ayda bir kontrol edilecek." },
  { name: "Deri alerjisi", note: "Tüy bakımı sırasında hassas bölgeler atlanmasın." },
];

const medicationPlan = [
  {
    name: "Renal Support",
    dosage: "1/2 tablet",
    freq: "Günde 1 defa",
    time: "09:00",
    last: "12.05.2024",
    owner: "Elif (veteriner)",
    status: "bugün" as const,
  },
  {
    name: "Probiyotik",
    dosage: "1 ölçek",
    freq: "Günde 2 defa",
    time: "09:00 / 21:00",
    last: "11.05.2024",
    owner: "Gizem",
    status: "gecikmiş" as const,
  },
  {
    name: "Vitamin Paste",
    dosage: "Bezelye tanesi",
    freq: "Günde 1 defa",
    time: "18:00",
    last: "10.05.2024",
    owner: "Onur",
    status: "tamamlandı" as const,
  },
];

const behaviorSummary = [
  { label: "Diğer kedilerle ilişkisi", value: "Sakin, uyumlu", icon: PawPrint },
  { label: "Agresyon", value: "Ziyaretçiye karşı çekingen", icon: Shield },
  { label: "Korkular", value: "Yüksek ses", icon: AlertTriangle },
  { label: "Özel not", value: "Yeni ortama alışması 1–2 gün sürebilir.", icon: NotebookPen },
];

const behaviorNotes = [
  {
    title: "Oyun sırasında ürkek davrandı",
    text: "Topla oynarken tırnak kesimi sonrası tedirgin oldu.",
    author: "Gizem",
    datetime: "12 Mayıs 2024 · 10:20",
  },
  {
    title: "Ziyaretçi tepkisi",
    text: "Yeni gelen müşterilere yaklaşırken önce koklamayı tercih ediyor.",
    author: "Onur",
    datetime: "08 Mayıs 2024 · 18:05",
  },
  {
    title: "Veteriner gözlemi",
    text: "Muayene sırasında sakin, taşıma çantasına alışık.",
    author: "Elif (veteriner)",
    datetime: "02 Mayıs 2024 · 09:45",
  },
];

const reservationHistory = [
  {
    id: "rz-2024-0141",
    dateRange: "12 Mayıs → 17 Mayıs",
    room: "Oda 204 (Deluxe)",
    customer: "Ayşe Yılmaz",
    status: "check-in" as const,
    total: "2.750 TL",
  },
  {
    id: "rz-2024-0108",
    dateRange: "02 Nisan → 06 Nisan",
    room: "Oda 108 (Comfort)",
    customer: "Ayşe Yılmaz",
    status: "onaylandı" as const,
    total: "1.980 TL",
  },
  {
    id: "rz-2024-0082",
    dateRange: "18 Şubat → 22 Şubat",
    room: "Oda 305 (Suite)",
    customer: "Ayşe Yılmaz",
    status: "check-out" as const,
    total: "2.240 TL",
  },
  {
    id: "rz-2023-1201",
    dateRange: "04 Aralık → 07 Aralık",
    room: "Oda 110 (Comfort)",
    customer: "Ayşe Yılmaz",
    status: "iptal" as const,
    total: "1.150 TL",
  },
];

const fileItems = [
  { name: "Aşı Kartı - 2024.jpg", date: "12 Mayıs 2024", type: "image" as const },
  { name: "Kan Tahlili.pdf", date: "02 Nisan 2024", type: "pdf" as const },
  { name: "Veteriner Raporu.docx", date: "18 Şubat 2024", type: "doc" as const },
  { name: "Röntgen - Bacak.png", date: "14 Ocak 2024", type: "image" as const },
  { name: "Mamaya dair notlar.txt", date: "10 Ocak 2024", type: "txt" as const },
];


export default function CatDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, isLoading, error, isFetching } = useQuery<AdminCatDetail>({
    queryKey: ["admin-cat", params.id],
    queryFn: () => AdminApi.getCat(params.id),
  });
  const [activeTab, setActiveTab] = useState<TabKey>("health");
  const [menuOpen, setMenuOpen] = useState(false);

  const ageInfo = useMemo(() => {
    if (!data?.birthDate) return { label: "Doğum tarihi yok", age: null };
    const birth = new Date(data.birthDate);
    const now = new Date();
    const ageYears = Math.max(0, now.getFullYear() - birth.getFullYear());
    const dateLabel = new Intl.DateTimeFormat("tr-TR").format(birth);
    return { label: `Doğum: ${dateLabel}`, age: ageYears };
  }, [data?.birthDate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Kedi profili yükleniyor..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-surface mx-auto max-w-3xl p-8">
        <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] admin-muted">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full border p-2 transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
            aria-label="Geri dön"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          Kedi Detay
        </div>
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-white/5 dark:text-red-200">
          Kedi bilgisi alınamadı: {(error as Error)?.message ?? "Bilinmeyen hata"}
        </p>
        <Link
          href="/dashboard/cats"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-peach-400 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] admin-muted">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border p-2 transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
          aria-label="Geri dön"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        Kedi Detay
      </div>

      <section className="relative overflow-hidden rounded-3xl border bg-[var(--admin-surface)] p-6 shadow-soft transition admin-border md:p-8">
        <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-peach-400/10 to-transparent blur-3xl" aria-hidden />
        <div className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-peach-500/5 blur-3xl" aria-hidden />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-3xl border bg-[var(--admin-surface-alt)] admin-border">
              {data.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.photoUrl} alt={data.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-peach-500/10 to-peach-400/20 text-peach-400">
                  <Cat className="h-10 w-10" aria-hidden />
                </div>
              )}
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white backdrop-blur">
                #{data.id}
              </span>
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] admin-border">
                Kedi Profili
                {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold leading-tight">{data.name}</h1>
                <span className="inline-flex items-center gap-2 rounded-full bg-peach-500/15 px-3 py-1 text-xs font-semibold text-peach-500 admin-border">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Premium Misafir
                </span>
              </div>
              <p className="text-sm text-[var(--admin-muted)]">
                {data.breed ?? "Cins bilgisi yok"} · {ageInfo.age !== null ? `${ageInfo.age} yaşında` : "Yaş bilinmiyor"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/cats/${data.id}/edit`}
              className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface-alt)] px-4 py-2 text-sm font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
            >
              <Edit3 className="h-4 w-4" aria-hidden />
              Düzenle
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-peach-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              <UploadCloud className="h-4 w-4" aria-hidden />
              Yeni Dosya Ekle
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-[var(--admin-surface-alt)] text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border"
                aria-label="Diğer işlemler"
              >
                <Ellipsis className="h-4 w-4" aria-hidden />
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border bg-[var(--admin-surface)] p-2 text-sm shadow-xl admin-border">
                  {[
                    "Sil",
                    "Kedi profilini arşivle",
                    "Sahip bilgisine git",
                    "Veteriner kartı oluştur",
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-semibold transition hover:bg-[var(--admin-surface-alt)]"
                    >
                      <ChevronRight className="h-4 w-4 text-[var(--admin-muted)]" aria-hidden />
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoPill label="Sahip" value={data.owner.name ?? data.owner.email} icon={<Sparkles className="h-4 w-4" aria-hidden />} />
          <InfoPill label="Cins" value={data.breed ?? "Belirtilmemiş"} icon={<Cat className="h-4 w-4" aria-hidden />} />
          <InfoPill
            label="Doğum / Yaş"
            value={ageInfo.label + (ageInfo.age !== null ? ` · ${ageInfo.age} yaş` : "")}
            icon={<CalendarClock className="h-4 w-4" aria-hidden />}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 admin-border">
            <Badge variant={data.gender === "MALE" ? "male" : data.gender === "FEMALE" ? "female" : "muted"}>
              {data.gender === "MALE" ? <Mars className="h-3.5 w-3.5" aria-hidden /> : data.gender === "FEMALE" ? <Venus className="h-3.5 w-3.5" aria-hidden /> : <Minus className="h-3.5 w-3.5" aria-hidden />}
              {genderLabel(data.gender)}
            </Badge>
            <Badge variant={data.isNeutered ? "positive" : "muted"}>
              {data.isNeutered ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <Minus className="h-3.5 w-3.5" aria-hidden />}
              {data.isNeutered ? "Kısır" : "Kısır değil"}
            </Badge>
            <Badge variant="highlight">
              <HeartPulse className="h-3.5 w-3.5" aria-hidden />
              {data.weightKg ? `${data.weightKg} kg` : "Kilo bilgisi yok"}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold admin-border">
            {data.owner.phone && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
                <Phone className="h-4 w-4 text-peach-400" aria-hidden />
                {data.owner.phone}
              </span>
            )}
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface-alt)] px-3 py-1 admin-border">
              <Mail className="h-4 w-4 text-peach-400" aria-hidden />
              {data.owner.email}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <NoteCard title="Diyet Notu" content={data.dietaryNotes} />
          <NoteCard title="Medikal Not" content={data.medicalNotes} />
        </div>
      </section>

      <div className="rounded-3xl border bg-[var(--admin-surface)] p-4 admin-border">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] px-1 pb-2">
          {[
            { key: "health", label: "Sağlık" },
            { key: "behavior", label: "Davranış" },
            { key: "reservations", label: "Rezervasyon Geçmişi" },
            { key: "files", label: "Dosyalar" },
          ].map((tab) => (
            <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key as TabKey)}>
              {tab.label}
            </TabButton>
          ))}
        </div>

        <div className="pt-4">
          {activeTab === "health" && <HealthTab />}
          {activeTab === "behavior" && <BehaviorTab />}
          {activeTab === "reservations" && <ReservationsTab />}
          {activeTab === "files" && <FilesTab />}
        </div>
      </div>
    </div>
  );
}

function HealthTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="lg:col-span-2 space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-5 admin-border">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Aşı Takvimi</p>
            <p className="text-sm text-[var(--admin-muted)]">Uygulanan ve yaklaşan aşılar</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border">
            <Plus className="h-4 w-4" aria-hidden />
            Aşı Ekle
          </button>
        </header>
        <div className="space-y-2">
          {vaccineSchedule.map((item) => (
            <div
              key={item.name}
              className="group flex items-center justify-between rounded-2xl border bg-[var(--admin-surface)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-peach-300 admin-border"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach-500/10 text-peach-500 admin-border">
                  <BadgeCheck className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Uygulama: {item.date} · Sonraki: {item.next}
                  </p>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-5 admin-border">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Kronik Sağlık Durumları</p>
            <p className="text-sm text-[var(--admin-muted)]">Doktor notları ile birlikte</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border">
            <Plus className="h-4 w-4" aria-hidden />
            Ekle
          </button>
        </header>
        {chronicConditions.length === 0 ? (
          <div className="flex items-center gap-2 rounded-2xl border border-dashed bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-muted)] admin-border">
            <Inbox className="h-4 w-4" aria-hidden />
            Herhangi bir kronik hastalık kaydı bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3">
            {chronicConditions.map((item) => (
              <div key={item.name} className="rounded-2xl border bg-[var(--admin-surface)] px-4 py-3 text-sm admin-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-[var(--admin-muted)]">{item.note}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-[var(--admin-muted)]">
                    <button className="rounded-full p-1 transition hover:text-peach-500" aria-label="Düzenle">
                      <Edit3 className="h-4 w-4" aria-hidden />
                    </button>
                    <button className="rounded-full p-1 transition hover:text-red-500" aria-label="Sil">
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="lg:col-span-3 space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-5 admin-border">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">İlaç Programı</p>
            <p className="text-sm text-[var(--admin-muted)]">Dozaj, sorumlu ve zaman planı</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border">
            <Plus className="h-4 w-4" aria-hidden />
            İlaç Ekle
          </button>
        </header>
        <div className="overflow-hidden rounded-2xl border admin-border">
          <div className="grid grid-cols-7 bg-[var(--admin-surface)] px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-[var(--admin-muted)]">
            <span>İlaç</span>
            <span>Dozaj</span>
            <span>Sıklık</span>
            <span>Saat</span>
            <span>Son uygulama</span>
            <span>Sorumlu</span>
            <span>Durum</span>
          </div>
          <div className="divide-y divide-[var(--admin-border)] bg-[var(--admin-surface-alt)]">
            {medicationPlan.map((item) => (
              <div key={item.name} className="grid grid-cols-7 items-center px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--admin-surface)] text-peach-500 admin-border">
                    <Pill className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-[var(--admin-muted)]">Takipte</p>
                  </div>
                </div>
                <span>{item.dosage}</span>
                <span>{item.freq}</span>
                <span>{item.time}</span>
                <span>{item.last}</span>
                <span>{item.owner}</span>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function BehaviorTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-5 admin-border">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Davranış Özeti</p>
            <p className="text-sm text-[var(--admin-muted)]">Hızlı okunan, ikonlu liste</p>
          </div>
        </header>
        <div className="space-y-2">
          {behaviorSummary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border bg-[var(--admin-surface)] px-4 py-3 text-sm admin-border">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-peach-500/10 text-peach-500 admin-border">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--admin-muted)]">{item.label}</p>
                  <p className="font-semibold text-[var(--admin-text-strong)]">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="lg:col-span-2 space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-5 admin-border">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Davranış Notları</p>
            <p className="text-sm text-[var(--admin-muted)]">Tarih sıralı mini kartlar</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border">
            <Plus className="h-4 w-4" aria-hidden />
            Yeni Not Ekle
          </button>
        </header>
        <div className="space-y-3">
          {behaviorNotes.map((note) => (
            <article
              key={note.title}
              className="group rounded-2xl border bg-[var(--admin-surface)] p-4 transition hover:-translate-y-0.5 hover:border-peach-300 admin-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{note.title}</p>
                  <p className="mt-1 text-sm text-[var(--admin-text-strong)]">{note.text}</p>
                  <p className="mt-1 text-xs text-[var(--admin-muted)]">
                    {note.author} · {note.datetime}
                  </p>
                </div>
                <div className="opacity-0 transition group-hover:opacity-100">
                  <button className="rounded-full p-1 text-[var(--admin-muted)] transition hover:text-peach-500" aria-label="Düzenle">
                    <Edit3 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReservationsTab() {
  return (
    <section className="space-y-3 rounded-2xl border bg-[var(--admin-surface-alt)] p-5 admin-border">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Rezervasyon Geçmişi</p>
          <p className="text-sm text-[var(--admin-muted)]">Tüm konaklamalar · tıklanabilir satırlar</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[var(--admin-surface)] px-3 py-1 text-xs font-semibold text-[var(--admin-muted)] admin-border">
          Toplam {reservationHistory.length} rezervasyon bulundu.
        </div>
      </header>
      <div className="overflow-hidden rounded-2xl border admin-border">
        <table className="w-full text-sm">
          <thead className="bg-[var(--admin-surface)] text-[11px] uppercase tracking-[0.3em] text-[var(--admin-muted)]">
            <tr>
              <th className="px-4 py-2 text-left">Tarihler</th>
              <th className="px-4 py-2 text-left">Oda</th>
              <th className="px-4 py-2 text-left">Müşteri</th>
              <th className="px-4 py-2 text-left">Durum</th>
              <th className="px-4 py-2 text-left">Ücret</th>
              <th className="px-4 py-2 text-left">Detay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--admin-border)] bg-[var(--admin-surface-alt)]">
            {reservationHistory.map((row) => (
              <tr
                key={row.id}
                className="cursor-pointer transition hover:bg-[var(--admin-surface)]"
                onClick={() => {}}
              >
                <td className="px-4 py-3 font-semibold">{row.dateRange}</td>
                <td className="px-4 py-3 text-[var(--admin-text-strong)]">{row.room}</td>
                <td className="px-4 py-3 text-peach-500 hover:underline">{row.customer}</td>
                <td className="px-4 py-3">
                  <ReservationStatus status={row.status} />
                </td>
                <td className="px-4 py-3 font-semibold">{row.total}</td>
                <td className="px-4 py-3 text-peach-500">Detay →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">Dosyalar</p>
          <p className="text-sm text-[var(--admin-muted)]">Aşı kartı, sağlık raporu, fotoğraflar</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-peach-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5">
          <UploadCloud className="h-4 w-4" aria-hidden />
          Dosya Ekle
        </button>
      </div>

      {fileItems.length === 0 ? (
        <div className="flex items-center justify-between rounded-2xl border border-dashed bg-[var(--admin-surface-alt)] px-4 py-6 text-sm text-[var(--admin-muted)] admin-border">
          <span>Henüz dosya eklenmemiş.</span>
          <button className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-500 admin-border">
            <Plus className="h-4 w-4" aria-hidden />
            Dosya Ekle
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fileItems.map((file) => (
            <article
              key={file.name}
              className="group flex flex-col gap-3 rounded-2xl border bg-[var(--admin-surface)] p-4 transition hover:-translate-y-0.5 hover:border-peach-300 admin-border"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--admin-surface-alt)] text-peach-500 admin-border">
                    {file.type === "image" ? <Cat className="h-5 w-5" aria-hidden /> : <File className="h-5 w-5" aria-hidden />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{file.name}</p>
                    <p className="text-xs text-[var(--admin-muted)]">{file.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[var(--admin-muted)]">
                  <button className="rounded-full p-1 transition hover:text-peach-500" aria-label="İndir">
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                  <button className="rounded-full p-1 transition hover:text-red-500" aria-label="Sil">
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative px-3 py-2 text-sm font-semibold text-[var(--admin-muted)] transition hover:text-[var(--admin-text-strong)]",
        active && "text-[var(--admin-text-strong)]",
      )}
    >
      {children}
      <span
        className={clsx(
          "absolute inset-x-2 -bottom-[2px] h-0.5 rounded-full bg-peach-400 transition-all",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

function InfoPill({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--admin-surface-alt)] px-4 py-3 text-sm font-semibold admin-border">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--admin-surface)] text-peach-400 admin-border">
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-muted)]">{label}</p>
        <p className="text-[var(--admin-text-strong)]">{value}</p>
      </div>
    </div>
  );
}

function Badge({
  variant,
  children,
}: {
  variant: "male" | "female" | "positive" | "muted" | "highlight";
  children: React.ReactNode;
}) {
  const styles: Record<"male" | "female" | "positive" | "muted" | "highlight", string> = {
    male: "bg-[rgba(59,130,246,0.15)] text-[#2563eb] border-[rgba(59,130,246,0.2)]",
    female: "bg-[rgba(236,72,153,0.15)] text-[#be185d] border-[rgba(236,72,153,0.25)]",
    positive: "bg-[rgba(34,197,94,0.16)] text-[#15803d] border-[rgba(34,197,94,0.25)]",
    muted: "bg-[rgba(148,163,184,0.18)] text-[#475569] border-[rgba(148,163,184,0.35)]",
    highlight: "bg-peach-500/15 text-peach-600 border-peach-500/25",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}

function NoteCard({ title, content }: { title: string; content?: string | null }) {
  return (
    <div className="rounded-2xl border bg-[var(--admin-surface-alt)] p-4 admin-border">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--admin-text-strong)]">
        {content?.trim() ? content : "Henüz bir not girilmemiş."}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: "güncel" | "yaklaşıyor" | "gecikmiş" | "bugün" | "tamamlandı" }) {
  const map = {
    güncel: "bg-[rgba(34,197,94,0.16)] text-[#16a34a] border-[rgba(34,197,94,0.25)]",
    yaklaşıyor: "bg-[rgba(251,191,36,0.16)] text-[#ca8a04] border-[rgba(251,191,36,0.25)]",
    gecikmiş: "bg-[rgba(248,113,113,0.16)] text-[#dc2626] border-[rgba(248,113,113,0.25)]",
    bugün: "bg-[rgba(251,146,60,0.16)] text-[#f97316] border-[rgba(251,146,60,0.25)]",
    tamamlandı: "bg-[rgba(59,130,246,0.16)] text-[#2563eb] border-[rgba(59,130,246,0.25)]",
  };
  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", map[status])}>
      <Check className="h-4 w-4" aria-hidden />
      {status}
    </span>
  );
}

function ReservationStatus({ status }: { status: "check-in" | "check-out" | "iptal" | "onaylandı" }) {
  const label = status === "check-in" ? "Check-in" : status === "check-out" ? "Check-out" : status === "iptal" ? "İptal" : "Onaylandı";
  const classes =
    status === "check-in"
      ? "bg-[rgba(34,197,94,0.16)] text-[#16a34a] border-[rgba(34,197,94,0.25)]"
      : status === "check-out"
      ? "bg-[rgba(59,130,246,0.16)] text-[#2563eb] border-[rgba(59,130,246,0.25)]"
      : status === "iptal"
      ? "bg-[rgba(248,113,113,0.16)] text-[#dc2626] border-[rgba(248,113,113,0.25)]"
      : "bg-[rgba(251,191,36,0.16)] text-[#ca8a04] border-[rgba(251,191,36,0.25)]";
  return <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", classes)}>{label}</span>;
}

function genderLabel(gender?: string | null) {
  if (gender === "MALE") return "Erkek";
  if (gender === "FEMALE") return "Dişi";
  return "Bilinmiyor";
}
