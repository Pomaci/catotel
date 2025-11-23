import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { CustomerProfile } from "@/types/hotel";
import { colors, spacing, radii } from "@/theme";

type Props = {
  profile?: CustomerProfile;
  loading: boolean;
  onRefresh: () => void;
};

export function OverviewCard({ profile, loading, onRefresh }: Props) {
  return (
    <Card>
      <SectionHeading
        title="Müşteri Profili"
        action={
          <Text style={styles.action} onPress={onRefresh}>
            Yenile
          </Text>
        }
      />
      {loading && <Text style={styles.info}>Profil verileri yükleniyor...</Text>}
      {!loading && !profile && (
        <Text style={styles.info}>Profil bilgisi alınamadı.</Text>
      )}

      {profile && (
        <View style={styles.grid}>
          <InfoRow label="E-posta" value={profile.user.email} />
          <InfoRow label="Telefon" value={profile.phone ?? "-"} />
          <InfoRow label="Adres" value={profile.address ?? "-"} />
          <InfoRow label="Tercih edilen veteriner" value={profile.preferredVet ?? "-"} />
          <InfoRow
            label="Acil durum kişi"
            value={`${profile.emergencyContactName ?? "-"} / ${
              profile.emergencyContactPhone ?? "-"
            }`}
          />
          <InfoRow label="Notlar" value={profile.notes ?? "-"} multi />

          <View style={styles.stats}>
            <StatCard label="Kedi sayısı" value={`${profile.cats.length}`} />
            <StatCard label="Rezervasyon" value={`${profile.reservations.length}`} />
          </View>
        </View>
      )}
    </Card>
  );
}

function InfoRow({
  label,
  value,
  multi,
}: {
  label: string;
  value: string;
  multi?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, multi && styles.rowValueMulti]}
        numberOfLines={multi ? undefined : 1}
      >
        {value.trim().length ? value : "-"}
      </Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
    marginTop: spacing.sm,
  },
  grid: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  row: {
    gap: 6,
  },
  rowLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  rowValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  rowValueMulti: {
    lineHeight: 18,
  },
  stats: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.accentMuted,
    alignItems: "flex-start",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
