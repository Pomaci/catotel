import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/theme";

export function Header() {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.paw}>{"\u{1F43E}"}</Text>
      </View>
      <Text style={styles.brand}>PatiOtel</Text>
      <Text style={styles.tagline}>Sevimli dostunuz guvenle konaklasin.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 6,
  },
  paw: {
    fontSize: 34,
  },
  brand: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
