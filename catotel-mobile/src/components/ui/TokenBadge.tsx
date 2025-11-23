import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme";

type Props = {
  label: string;
  value?: string | null;
};

export function TokenBadge({ label, value }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={3} style={styles.value}>
        {value || "-"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.accentMuted,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: "Courier",
  },
});
