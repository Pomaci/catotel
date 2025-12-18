import { useMemo, useState } from "react";
import { Redirect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Screen } from "@/components/layout/Screen";
import { useAuth } from "@/context/AuthContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { colors, radii, spacing } from "@/theme";
import { Button } from "@/components/ui/Button";

type CheckinRow = {
  id: string;
  cat: string;
  timeLabel: string;
  type: "IN" | "OUT";
  status: string;
};

export default function DashboardScreen() {
  const { accessToken, bootstrapping, user, logout } = useAuth();
  const { profile, reservations, rooms, tasks, loading, canManageTasks } =
    useDashboardData();
  const router = useRouter();

  const isAdmin = useMemo(
    () => (user?.role ?? "").toUpperCase() === "ADMIN",
    [user?.role],
  );

  const occupancy = useMemo(() => {
    if (!rooms.length) return 0;
    const today = new Date();
    const active = reservations.filter((res) => isActiveDuringDay(res, today));
    const cats = active.reduce(
      (sum, res) => sum + (res.cats?.length ?? 1),
      0,
    );
    return Math.min(100, Math.round((cats / rooms.length) * 100));
  }, [reservations, rooms]);

  const catsInside = useMemo(() => {
    const today = new Date();
    return reservations
      .filter((res) => isActiveDuringDay(res, today))
      .reduce((sum, res) => sum + (res.cats?.length ?? 1), 0);
  }, [reservations]);

  if (bootstrapping) {
    return (
      <Screen scrollable={false}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  if (!accessToken) {
    return <Redirect href="/" />;
  }

  if (!isAdmin) {
    return (
      <Screen scrollable={false}>
        <View style={styles.loader}>
          <Text style={styles.restrictedTitle}>Bu alan sadece adminler icin</Text>
          <Text style={styles.restrictedText}>
            Musteri dashboard'u yapim asamasinda. Web panelini kullanabilir veya admin
            hesapla giris yapabilirsiniz.
          </Text>
          <Button variant="ghost" onPress={logout}>
            Cikis yap
          </Button>
        </View>
      </Screen>
    );
  }

  const userNameValue = user?.name as unknown;
  const resolvedUserName =
    typeof userNameValue === "string" && userNameValue.trim().length > 0
      ? userNameValue
      : null;
  const resolvedProfileName =
    typeof profile?.user?.name === "string" && profile.user.name.trim().length > 0
      ? profile.user.name
      : null;
  const displayName =
    resolvedUserName ?? resolvedProfileName ?? user?.email ?? "Yonetici";

  return (
    <Screen>
      <View style={styles.page}>
        <Header
          name={displayName}
          notifications={tasks.length}
          onLogout={logout}
          onNavigate={(href) => router.push(href)}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <MiniStats
            occupancy={occupancy}
            cats={catsInside}
            capacity={rooms.length}
          />

          <CheckinsCard
            rows={mapCheckins(reservations)}
            loading={loading}
            hasData={reservations.length > 0}
          />

          <OverdueCard tasks={canManageTasks ? tasks.slice(0, 3) : []} />

          <AnalyticsSection
            occupancyTrend={buildTrend(reservations, rooms.length, 7)}
            upcomingLoad={buildTrend(reservations, rooms.length, 14)}
          />

          <View style={{ height: spacing.xl * 2 }} />
        </ScrollView>

        <Pressable
          style={styles.floatingButton}
          onPress={() =>
            Alert.alert(
              "Yakinda",
              "Rezervasyon olusturma akisi mobil uygulamaya yakinda eklenecek.",
            )
          }
        >
          <Text style={styles.floatingLabel}>Yeni Rezervasyon Olustur</Text>
          <Feather name="arrow-right" size={18} color="#FFF" />
        </Pressable>
      </View>
    </Screen>
  );
}

function Header({
  name,
  notifications,
  onLogout,
  onNavigate,
}: {
  name: string;
  notifications: number;
  onLogout(): void;
  onNavigate(href: string): void;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <View style={headerStyles.container}>
      <Pressable
        style={headerStyles.menuButton}
        onPress={() => {
          setNavOpen((prev) => !prev);
          setProfileOpen(false);
        }}
        testID="nav-menu-button"
      >
        <Feather name="menu" size={22} color={colors.textPrimary} />
      </Pressable>
      <View style={headerStyles.center}>
        <Text style={headerStyles.title}>Hos geldin, {name}!</Text>
        <Text style={headerStyles.subtitle}>Bugunun ozetini kontrol et.</Text>
      </View>
      <View style={headerStyles.right}>
        <View style={headerStyles.bellWrapper}>
          <Feather name="bell" size={22} color={colors.textPrimary} />
          {notifications > 0 && (
            <View style={headerStyles.badge}>
              <Text style={headerStyles.badgeLabel}>
                {Math.min(notifications, 9)}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          style={headerStyles.avatar}
          onPress={() => {
            setProfileOpen((prev) => !prev);
            setNavOpen(false);
          }}
          testID="avatar-menu-button"
        >
          <Text style={headerStyles.avatarText}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </Pressable>
      </View>
      {(navOpen || profileOpen) && (
        <Pressable
          style={headerStyles.backdrop}
          onPress={() => {
            setNavOpen(false);
            setProfileOpen(false);
          }}
          testID="menu-backdrop"
        />
      )}
      {navOpen && (
        <View style={[headerStyles.menu, { top: spacing.xl + spacing.md, left: spacing.lg }]}>
          <Text style={headerStyles.menuTitle}>Menü</Text>
          <View style={headerStyles.menuNav}>
            <Pressable
              style={headerStyles.navItem}
              onPress={() => {
                setNavOpen(false);
                onNavigate("/dashboard");
              }}
            >
              <Feather name="grid" size={16} color={colors.textPrimary} />
              <Text style={headerStyles.navLabel}>Dashboard</Text>
            </Pressable>
            <Pressable
              style={headerStyles.navItem}
              onPress={() => {
                setNavOpen(false);
                onNavigate("/dashboard/reservations");
              }}
            >
              <Feather name="calendar" size={16} color={colors.textPrimary} />
              <Text style={headerStyles.navLabel}>Rezervasyonlar</Text>
            </Pressable>
          </View>
        </View>
      )}
      {profileOpen && (
        <View style={[headerStyles.menu, { top: spacing.xl + spacing.md, right: spacing.lg }]}>
          <Text style={headerStyles.menuTitle}>Hesap</Text>
          <Pressable
            style={headerStyles.menuItem}
            onPress={() => {
              setProfileOpen(false);
              onLogout();
            }}
            testID="logout-button"
          >
            <Feather name="log-out" size={16} color={colors.textPrimary} />
            <Text style={headerStyles.logoutLabel}>Cikis yap</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function MiniStats({
  occupancy,
  cats,
  capacity,
}: {
  occupancy: number;
  cats: number;
  capacity: number;
}) {
  return (
    <View style={statsStyles.grid}>
      <View style={statsStyles.card}>
        <View style={statsStyles.icon}>
          <Feather name="home" size={18} color={colors.accent} />
        </View>
        <View style={statsStyles.info}>
          <Text style={statsStyles.value}>{occupancy}%</Text>
          <Text style={statsStyles.label}>Bugunun doluluk orani</Text>
        </View>
      </View>
      <View style={statsStyles.card}>
        <View style={[statsStyles.icon, statsStyles.iconTurquoise]}>
          <Feather name="feather" size={18} color={colors.teal} />
        </View>
        <View style={statsStyles.info}>
          <Text style={statsStyles.value}>{cats} Kedi</Text>
          <Text style={statsStyles.label}>Toplam kapasite: {capacity}</Text>
        </View>
      </View>
    </View>
  );
}

function CheckinsCard({
  rows,
  loading,
  hasData,
}: {
  rows: CheckinRow[];
  loading: boolean;
  hasData: boolean;
}) {
  return (
    <View style={checkStyles.card}>
      <View style={checkStyles.header}>
        <Text style={checkStyles.title}>Bugun Check-in / Check-out</Text>
        <Text style={checkStyles.link}>Tumu →</Text>
      </View>
      {loading && <Text style={checkStyles.empty}>Veriler yukleniyor...</Text>}
      {!loading && rows.length === 0 && (
        <View style={checkStyles.emptyState}>
          <Text style={checkStyles.empty}>Bugun hic check-in yok.</Text>
        </View>
      )}
      {!loading &&
        rows.map((row) => (
          <View key={row.id} style={checkStyles.row}>
            <View style={checkStyles.avatar}>
              <Text style={checkStyles.avatarLabel}>
                {row.cat.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={checkStyles.rowInfo}>
              <Text style={checkStyles.rowTitle}>{row.cat}</Text>
              <Text style={checkStyles.rowMeta}>{row.timeLabel}</Text>
            </View>
            <View
              style={[
                checkStyles.badge,
                row.type === "IN"
                  ? checkStyles.badgeOrange
                  : checkStyles.badgeTurquoise,
              ]}
            >
              <Text style={checkStyles.badgeText}>{row.status}</Text>
            </View>
          </View>
        ))}
      {!loading && hasData && <Text style={checkStyles.more}>Devamini gor</Text>}
    </View>
  );
}

function OverdueCard({ tasks }: { tasks: any[] }) {
  const hasTasks = tasks.length > 0;
  return (
    <View style={overdueStyles.card}>
      <View style={overdueStyles.header}>
        <View style={overdueStyles.icon}>
          <Feather name="alert-triangle" size={18} color={colors.accent} />
        </View>
        <Text style={overdueStyles.title}>Geciken Gorevler</Text>
        <Text style={overdueStyles.link}>Gorev Listesi →</Text>
      </View>
      {hasTasks ? (
        <View style={overdueStyles.body}>
          {tasks.map((task, index) => (
            <View key={task.id ?? index} style={overdueStyles.item}>
              <Text style={overdueStyles.itemBullet}>•</Text>
              <Text style={overdueStyles.itemText}>
                {task.cat?.name ?? "Bilgi yok"} – {task.title ?? "Gorev gecikti"}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={overdueStyles.empty}>Geciken gorev bulunmuyor.</Text>
      )}
    </View>
  );
}

function AnalyticsSection({
  occupancyTrend,
  upcomingLoad,
}: {
  occupancyTrend: Array<{ label: string; value: number }>;
  upcomingLoad: Array<{ label: string; value: number }>;
}) {
  const maxUpcoming = Math.max(...upcomingLoad.map((d) => d.value), 1);
  return (
    <View style={analyticsStyles.container}>
      <View style={analyticsStyles.card}>
        <View style={analyticsStyles.cardHeader}>
          <Text style={analyticsStyles.cardTitle}>Son 7 Gun Doluluk Orani</Text>
          <View style={analyticsStyles.filter}>
            <Text style={analyticsStyles.filterText}>7 gun</Text>
            <Feather name="chevron-down" size={14} color={colors.textSecondary} />
          </View>
        </View>
        <View style={analyticsStyles.lineChart}>
          {occupancyTrend.map((point, idx) => (
            <View key={`${point.label}-${idx}`} style={analyticsStyles.lineColumn}>
              <View
                style={[
                  analyticsStyles.line,
                  { height: Math.max(12, (point.value / 100) * 110) },
                ]}
              />
              <Text style={analyticsStyles.lineLabel}>
                {point.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={analyticsStyles.card}>
        <View style={analyticsStyles.cardHeader}>
          <Text style={analyticsStyles.cardTitle}>Yaklasan Yogun Donem</Text>
        </View>
        <View style={analyticsStyles.notice}>
          <Feather name="info" size={14} color={colors.teal} />
          <Text style={analyticsStyles.noticeText}>
            Oneri: Erken rezervasyon olusturun
          </Text>
        </View>
        <Text style={analyticsStyles.subtitle}>Onumuzdeki 14 gun</Text>
        <View style={analyticsStyles.barChart}>
          {upcomingLoad.map((point, idx) => (
            <View key={`${point.label}-${idx}`} style={analyticsStyles.barRow}>
              <Text style={analyticsStyles.barLabel}>{point.label.toUpperCase()}</Text>
              <View style={analyticsStyles.barTrack}>
                <View
                  style={[
                    analyticsStyles.barFill,
                    {
                      width: `${(point.value / maxUpcoming) * 100}%`,
                      backgroundColor:
                        point.value > 80
                          ? "#FF7A40"
                          : point.value > 60
                            ? colors.accent
                            : colors.teal,
                    },
                  ]}
                />
              </View>
              <Text style={analyticsStyles.barValue}>{point.value}%</Text>
            </View>
          ))}
        </View>
        <Text style={analyticsStyles.highlight}>
          En yogun gun: {findPeakDay(upcomingLoad)} (%{Math.max(
            ...upcomingLoad.map((d) => d.value),
            0,
          )})
        </Text>
      </View>
    </View>
  );
}

function isActiveDuringDay(reservation: any, day: Date) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  const checkIn = new Date(reservation.checkIn);
  const checkOut = new Date(reservation.checkOut);
  return checkIn <= dayEnd && checkOut >= dayStart;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mapCheckins(reservations: any[]): CheckinRow[] {
  const today = new Date();
  return reservations
    .filter((res) => {
      const checkIn = new Date(res.checkIn);
      const checkOut = new Date(res.checkOut);
      return (
        isActiveDuringDay(res, today) ||
        isSameDay(checkIn, today) ||
        isSameDay(checkOut, today)
      );
    })
    .sort(
      (a, b) =>
        new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
    )
    .slice(0, 3)
    .map((res, idx) => {
      const checkIn = new Date(res.checkIn);
      const checkOut = new Date(res.checkOut);
      const showsCheckout = isSameDay(checkOut, today) && !isSameDay(checkIn, today);
      const type: "IN" | "OUT" = showsCheckout ? "OUT" : "IN";
      const timeLabel = `${type === "IN" ? "Check-in" : "Check-out"} ${
        type === "IN" ? formatTime(checkIn) : formatTime(checkOut)
      }`;

      return {
        id: res.id ?? `row-${idx}`,
        cat: res.cats?.[0]?.cat?.name ?? "Misafir",
        timeLabel,
        type,
        status: statusLabel(res.status, type),
      };
    });
}

function statusLabel(status: string | null | undefined, type: "IN" | "OUT") {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "CHECKED_OUT") return "Cikis Yapildi";
  if (normalized === "CHECKED_IN") return "Giris Yapildi";
  if (type === "OUT") return "Cikis Bekleniyor";
  return "Giris Bekleniyor";
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildTrend(reservations: any[], roomCount: number, daysBack: number) {
  const today = new Date();
  const days: Array<{ label: string; value: number }> = [];
  for (let i = daysBack - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const value = calculateOccupancyForDay(day, reservations, roomCount);
    days.push({
      label: day.toLocaleDateString("tr-TR", { weekday: "short" }),
      value,
    });
  }
  return days;
}

function calculateOccupancyForDay(
  day: Date,
  reservations: any[],
  roomCount: number,
) {
  if (!roomCount) return 0;
  const active = reservations.filter((reservation) =>
    isActiveDuringDay(reservation, day),
  );
  const cats = active.reduce(
    (sum, reservation) => sum + (reservation.cats?.length ?? 1),
    0,
  );
  return Math.min(100, Math.round((cats / roomCount) * 100));
}

function findPeakDay(data: Array<{ label: string; value: number }>) {
  if (!data.length) return "-";
  const peak = data.reduce(
    (prev, curr) => (curr.value > prev.value ? curr : prev),
    data[0],
  );
  return peak.label;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  restrictedText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  floatingButton: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
  floatingLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    position: "relative",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  menu: {
    position: "absolute",
    width: 180,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
    padding: spacing.md,
    gap: spacing.sm,
    zIndex: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  menuNav: {
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  navLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  center: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  bellWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#FF5A4E",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeLabel: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "700",
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  logoutLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});

const statsStyles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  card: {
    flex: 1,
    height: 120,
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  iconTurquoise: {
    backgroundColor: colors.tealSoft,
  },
  info: {
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.accent,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

const checkStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  link: {
    fontSize: 13,
    color: colors.teal,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  badgeOrange: {
    backgroundColor: "#FFE3D2",
  },
  badgeTurquoise: {
    backgroundColor: "#DFF3F2",
  },
  empty: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  more: {
    textAlign: "right",
    color: colors.teal,
    fontWeight: "600",
  },
});

const overdueStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF1E9",
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 138, 92, 0.4)",
    gap: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFE5D4",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  link: {
    fontSize: 13,
    color: colors.teal,
    fontWeight: "600",
  },
  body: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  item: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  itemBullet: {
    fontSize: 18,
    color: colors.accent,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

const analyticsStyles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 3,
    gap: spacing.md,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 999,
    backgroundColor: colors.border,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  lineChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    height: 140,
    position: "relative",
  },
  lineColumn: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
  },
  line: {
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  lineLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs / 2,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: radii.md,
  },
  noticeText: {
    fontSize: 12,
    color: colors.teal,
    flex: 1,
    flexWrap: "wrap",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  barChart: {
    gap: spacing.xs,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  barLabel: {
    width: 36,
    fontSize: 12,
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  barValue: {
    width: 32,
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: "right",
  },
  highlight: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
  },
});
