import { StyleSheet, Text, View } from "react-native";
import type { Cat } from "@/types/hotel";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { colors, spacing, radii } from "@/theme";
import { formatDate } from "@/lib/format";

type Props = {
  cats: Cat[];
  loading: boolean;
  onRefresh: () => void;
};

export function CatsCard({ cats, loading, onRefresh }: Props) {
  return (
    <Card>
      <SectionHeading
        title={`Kedi Profilleri (${cats.length})`}
        action={
          <Text style={styles.action} onPress={onRefresh}>
            Yenile
          </Text>
        }
      />

      {loading && <Text style={styles.info}>Kedi bilgileri yükleniyor...</Text>}
      {!loading && cats.length === 0 && (
        <Text style={styles.info}>
          Henüz tanımlı kedi yok. Dashboard üzerinden kolayca ekleyebilirsin.
        </Text>
      )}

      <View style={styles.list}>
        {cats.map((cat) => (
          <View key={cat.id} style={styles.catCard}>
            <View style={styles.row}>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.chip}>{cat.gender ?? "Bilinmiyor"}</Text>
            </View>
            <Text style={styles.meta}>
              {cat.breed || "Irk bilinmiyor"} · Doğum {formatDate(cat.birthDate)}
            </Text>
            <View style={styles.metaRow}>
              <Info label="Kilo" value={cat.weightKg ? `${cat.weightKg} kg` : "-"} />
              <Info label="Diyet" value={cat.dietaryNotes ?? "-"} />
              <Info label="Sağlık" value={cat.medicalNotes ?? "-"} />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value}
      </Text>
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
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  catCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  catName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    color: colors.textSecondary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 13,
    color: colors.textPrimary,
  },
});
