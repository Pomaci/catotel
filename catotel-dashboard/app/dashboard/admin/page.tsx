import clsx from "clsx";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck2,
  Cat,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Ellipsis,
  Filter,
  LineChart,
  Pill,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

const summaryCards = [
  {
    label: "Bugünün doluluğu",
    value: "%87",
    meta: "32 odanın 28'i dolu",
    trend: "+5%",
    trendDirection: "up" as const,
    icon: DoorOpen,
  },
  {
    label: "Oteldeki kedi sayısı",
    value: "24",
    meta: "Konaklayan toplam kedi",
    trend: "+3 giriş",
    trendDirection: "up" as const,
    icon: Cat,
  },
  {
    label: "Check-in / Check-out",
    value: "7 / 5",
    meta: "Bugünün planı",
    trend: "Detaylara git",
    trendDirection: "link" as const,
    icon: CalendarCheck2,
  },
  {
    label: "Geciken görevler",
    value: "4",
    meta: "İlaç (2), mama (1), temizlik (1)",
    trend: "Uyarı",
    trendDirection: "alert" as const,
    icon: AlertTriangle,
  },
];

type ReservationRow = {
  cat: string;
  owner: string;
  room: string;
  type: "Check-in" | "Check-out";
  time: string;
};

const todayReservations: ReservationRow[] = [
  { cat: "Misket", owner: "Duru Aksoy", room: "Suit-03", type: "Check-in", time: "09:30" },
  { cat: "Atlas", owner: "Efe Yalın", room: "Deluxe-02", type: "Check-in", time: "10:15" },
  { cat: "Luna", owner: "Melis Karaca", room: "Sky-01", type: "Check-out", time: "11:00" },
  { cat: "Karamel", owner: "Tolga Sezen", room: "Garden-05", type: "Check-in", time: "13:45" },
  { cat: "Pofuduk", owner: "Selin Kara", room: "Loft-02", type: "Check-out", time: "16:20" },
];

const overdueTasks = [
  {
    type: "İlaç",
    title: "Minnoş için antibiyotik",
    detail: "10:00'da verilmeliydi",
    icon: Pill,
    color: "text-rose-500",
  },
  {
    type: "Mama",
    title: "Atlas hassas mama",
    detail: "12:15 planı gecikti",
    icon: UtensilsCrossed,
    color: "text-peach-400",
  },
  {
    type: "Temizlik",
    title: "Suit-02 günlük temizlik",
    detail: "11:30 vardiyası kaçtı",
    icon: BroomIcon,
    color: "text-lagoon-500",
  },
  {
    type: "İlaç",
    title: "Pofuduk vitamin kontrolü",
    detail: "14:00 hatırlatıcısı beklendi",
    icon: Pill,
    color: "text-rose-500",
  },
];

const occupancySparkline = [78, 85, 82, 88, 90, 84, 87];
const monthlyBookings = [
  { month: "Ağu", value: 62 },
  { month: "Eyl", value: 71 },
  { month: "Eki", value: 68 },
  { month: "Kas", value: 80 },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Kontrol Paneli</p>
          <h1 className="mt-2 text-3xl font-semibold">Tekrar hoş geldin, Onur</h1>
          <p className="mt-1 text-sm admin-muted">
            Kedilerin rezervasyonları, oda dolulukları ve operasyon durumları burada birleşiyor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border bg-[var(--admin-surface)] px-5 py-2 text-sm font-semibold text-[var(--admin-text-strong)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg admin-border"
          >
            <TrendingUp className="h-4 w-4 text-peach-400" aria-hidden />
            Raporu indir
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-peach-400 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
          >
            Yeni rezervasyon ekle
          </button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className={clsx(
              "admin-surface relative p-6",
              card.label === "Geciken görevler" && "admin-warning-card",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[var(--admin-highlight-muted)] p-3 text-peach-400">
                <card.icon className="h-4 w-4" aria-hidden />
              </div>
              <button type="button" aria-label="Kart menüsü">
                <Ellipsis className="h-5 w-5 text-[var(--admin-muted)]" />
              </button>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.4em] admin-muted">
              {card.label}
            </p>
            <div className="mt-3 flex items-end justify-between">
              <h2 className="text-3xl font-semibold">{card.value}</h2>
              {card.trendDirection === "up" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--admin-highlight-muted)] px-3 py-1 text-xs font-semibold text-peach-500">
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  {card.trend}
                </span>
              )}
              {card.trendDirection === "link" && (
                <button type="button" className="text-xs font-semibold text-peach-500 hover:underline">
                  {card.trend} →
                </button>
              )}
              {card.trendDirection === "alert" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100/50 px-3 py-1 text-xs font-semibold text-red-500 dark:bg-white/10 dark:text-red-200">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  {card.trend}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm admin-muted">{card.meta}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <article className="admin-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Bugünün akışı</p>
              <h2 className="mt-1 text-2xl font-semibold">Check-in / Check-out</h2>
              <p className="text-xs admin-muted">19 Kasım 2025 Çarşamba</p>
            </div>
            <button type="button" className="text-sm font-semibold text-peach-400 hover:underline">
              Tüm rezervasyonlar →
            </button>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-[0.4em] admin-muted admin-border">
                  <th className="pb-3 font-semibold">Kedi</th>
                  <th className="pb-3 font-semibold">Sahip</th>
                  <th className="pb-3 font-semibold">Oda</th>
                  <th className="pb-3 font-semibold">Tür</th>
                  <th className="pb-3 font-semibold">Saat</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {todayReservations.map((row) => (
                  <tr key={`${row.cat}-${row.time}`} className="border-b last:border-none admin-border">
                    <td className="py-3">
                      <div className="flex items-center gap-3 font-semibold">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--admin-highlight-muted)] text-peach-500">
                          <Cat className="h-4 w-4" aria-hidden />
                        </span>
                        {row.cat}
                      </div>
                    </td>
                    <td className="py-3 text-sm admin-muted">{row.owner}</td>
                    <td className="py-3 text-sm admin-muted">{row.room}</td>
                    <td className="py-3">
                      <span
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      row.type === "Check-in" ? "admin-badge-checkin" : "admin-badge-checkout",
                    )}
                  >
                    {row.type}
                  </span>
                    </td>
                    <td className="py-3 text-sm admin-muted">{row.time}</td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-muted)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                      >
                        Detay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs font-semibold text-peach-500">
            7 check-in, 5 check-out planlandı • Kapasite eşleşmeleri tamamlandı
          </p>
        </article>

        <article className="admin-surface flex h-full flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Acil liste</p>
              <h2 className="mt-1 text-xl font-semibold">Geciken görevler</h2>
            </div>
            <button type="button" className="rounded-full border px-3 py-1 text-xs font-semibold admin-border">
              <Filter className="mr-1 inline h-4 w-4" aria-hidden />
              Filtre
            </button>
          </div>
          <div className="space-y-4">
            {overdueTasks.map((task) => {
              const Icon = task.icon;
              return (
                <div
                  key={task.title}
                  className="flex items-center justify-between rounded-2xl px-4 py-3 admin-soft-surface"
                >
                  <div className="flex items-center gap-3">
                    <span className={clsx("flex h-10 w-10 items-center justify-center rounded-2xl text-lg", task.color, "admin-soft-surface")}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{task.title}</p>
                      <p className="text-xs admin-muted">{task.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="admin-warning-pill rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em]">
                      Gecikti
                    </span>
                    <button
                      type="button"
                      className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--admin-text-strong)] transition hover:-translate-y-0.5 hover:border-peach-300 hover:text-peach-400 admin-border"
                    >
                      Tamamlandı
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="mt-auto inline-flex items-center text-sm font-semibold text-peach-400 hover:underline"
          >
            Tüm görevleri görüntüle →
          </button>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="admin-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Doluluk oranı</p>
              <h3 className="mt-1 text-xl font-semibold">Son 7 gün</h3>
            </div>
            <LineChart className="h-5 w-5 text-peach-400" aria-hidden />
          </div>
          <div className="mt-6">
            <div className="flex items-baseline gap-2 text-3xl font-semibold">
              %82 <span className="text-sm font-medium admin-muted">ortalama</span>
            </div>
            <div className="mt-4 flex items-end gap-2">
              {occupancySparkline.map((value, index) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className="h-24 flex-1 rounded-full bg-gradient-to-t from-peach-100 to-peach-300 dark:from-peach-500/20 dark:to-peach-400/60"
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs admin-muted">Doluluk %78’den %90’a kadar seyretti.</p>
          </div>
        </article>

        <article className="admin-surface admin-heat-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[var(--admin-text-strong)]/70">
            Yaklaşan yoğunluk
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--admin-text-strong)]">
            Bayram haftası yaklaşırken rezervasyonlar artıyor
          </h3>
          <p className="mt-3 text-sm text-[var(--admin-text-strong)]/80">
            20–24 Aralık tarihleri arasında %95 üzeri doluluk bekleniyor. Oda temizliği ve ekip vardiyalarını şimdiden
            planlayın.
          </p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/60 p-3 text-sm font-semibold text-peach-500 admin-soft-surface">
            <TrendingUp className="h-5 w-5" aria-hidden />
            Rezervasyon trendlerini görüntüle →
          </div>
        </article>

        <article className="admin-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] admin-muted">Aylık karşılaştırma</p>
              <h3 className="mt-1 text-xl font-semibold">Rezervasyonlar</h3>
            </div>
            <CalendarCheck2 className="h-5 w-5 text-peach-400" aria-hidden />
          </div>
          <div className="mt-6 space-y-4">
            {monthlyBookings.map((item) => (
              <div key={item.month}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{item.month}</span>
                  <span className="admin-muted">{item.value} rezervasyon</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[var(--admin-surface-alt)]">
                  <span
                    className="block h-2 rounded-full bg-gradient-to-r from-peach-400 to-lagoon-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function BroomIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 22h20" />
      <path d="M5 21v-5l7-7 7 7v5" />
      <path d="M9 11l6 6" />
      <path d="M12 8l5-5" />
    </svg>
  );
}
