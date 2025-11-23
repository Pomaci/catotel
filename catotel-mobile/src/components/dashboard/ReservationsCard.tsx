import { StyleSheet, Text, View } from "react-native";
import type { Reservation } from "@/types/hotel";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { colors, spacing, radii } from "@/theme";
import { formatCurrency, formatDate, formatEnum } from "@/lib/format";

type Props = {
  reservations: Reservation[];
  loading: boolean;
  onRefresh: () => void;
};

export function ReservationsCard({ reservations, loading, onRefresh }: Props) {
  const sorted = [...reservations].sort(
    (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime(),
  );

  return (
    <Card>
      <SectionHeading
        title={`Rezervasyonlar (${reservations.length})`}
        action={
          <Text style={styles.action} onPress={onRefresh}>
            Yenile
          </Text>
        }
      />

      {loading && <Text style={styles.info}>Rezervasyonlar yükleniyor...</Text>}
      {!loading && reservations.length === 0 && (
        <Text style={styles.info}>
          Henüz rezervasyon oluşturmadın. Dashboard üzerinden kolayca yapabilirsin.
        </Text>
      )}

      <View style={styles.list}>
        {sorted.map((reservation) => (
          <View key={reservation.id} style={styles.reservationCard}>
            <View style={styles.row}>
              <Text style={styles.code}>{reservation.code}</Text>
              <Text
                style={[
                  styles.status,
                  statusStyles[reservation.status] ?? styles.statusDefault,
                ]}
              >
                {formatEnum(reservation.status)}
              </Text>
            </View>
            <Text style={styles.meta}>
              {reservation.room.name} · {formatDate(reservation.checkIn)} –{" "}
              {formatDate(reservation.checkOut)}
            </Text>
            <Text style={styles.total}>{formatCurrency(reservation.totalPrice)}</Text>
            <View style={styles.cats}>
              {reservation.cats.map((entry) => (
                <Text key={entry.cat.id} style={styles.catChip}>
                  {entry.cat.name}
                </Text>
              ))}
            </View>
            {reservation.specialRequests && (
              <Text style={styles.notes}>Not: {reservation.specialRequests}</Text>
            )}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  action: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: "600",
  },
  info: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  reservationCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  code: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  status: {
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  statusDefault: {
    backgroundColor: "rgba(160, 140, 128, 0.15)",
    color: colors.textSecondary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  total: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  cats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  catChip: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 11,
    color: colors.textSecondary,
  },
  notes: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
});

const statusStyles: Record<string, any> = {
  CONFIRMED: { backgroundColor: "rgba(69,191,145,0.15)", color: colors.success },
  PENDING: { backgroundColor: colors.tealSoft, color: colors.teal },
  CHECKED_IN: { backgroundColor: "rgba(255,182,115,0.2)", color: colors.accent },
  CHECKED_OUT: { backgroundColor: "rgba(160,140,128,0.15)", color: colors.textSecondary },
  CANCELLED: { backgroundColor: "rgba(236,107,98,0.18)", color: colors.danger },
};
