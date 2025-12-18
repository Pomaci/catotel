import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/context/AuthContext";
import type { CustomerProfile, Reservation } from "@/types/hotel";
import { colors, spacing, radii } from "@/theme";
import { formatCurrency } from "@/lib/format";

type Props = {
  profile?: CustomerProfile;
  latestReservation?: Reservation | null;
  onRefreshData: () => void;
};

export function DashboardHeader({
  profile,
  latestReservation,
  onRefreshData,
}: Props) {
  const { user, logout, error } = useAuth();
  const rawUserName = user?.name as unknown;
  const resolvedUserName =
    typeof rawUserName === "string" && rawUserName.trim().length > 0
      ? rawUserName
      : undefined;
  const displayName =
    resolvedUserName ?? user?.email ?? "Miaow yoneticisi";

  const stats = useMemo(() => {
    const catCount = profile?.cats?.length ?? 0;
    const reservationCount = profile?.reservations?.length ?? 0;
    const latestTotal = latestReservation
      ? formatCurrency(latestReservation.totalPrice)
      : "-";
    return [
      { label: "Kedi profili", value: `${catCount}`, emoji: "🐱" },
      { label: "Rezervasyon", value: `${reservationCount}`, emoji: "📅" },
      { label: "Son odeme", value: latestTotal, emoji: "💳" },
    ];
  }, [latestReservation, profile?.cats?.length, profile?.reservations?.length]);

  return (
    <Card padding={spacing.xl}>
      <View style={styles.hero}>
        <Text style={styles.badge}>Yonetici kontrol alani</Text>
        <Text style={styles.title} testID="admin-hero-title">
          Hos geldin {displayName}
        </Text>
        <Text style={styles.subtitle}>
          Rezervasyon akislari ve operasyonel guncellemeleri tek ekranda takip et.
        </Text>
      </View>

      {!!error && <Alert type="error">{error}</Alert>}

      <View style={styles.actions}>
        <Button label="Verileri yenile" onPress={onRefreshData} />
        <Button
          variant="ghost"
          label="Cikis yap"
          onPress={logout}
          testID="logout-button"
        />
      </View>

      <View style={styles.statsRow}>
        {stats.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Text style={styles.statEmoji}>{item.emoji}</Text>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.accentMuted,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.accentMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statEmoji: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
