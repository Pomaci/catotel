import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator } from "react-native";
import { colors, spacing, radii } from "@/theme";

const PRIMARY = "#FF8A5C";
const SECONDARY = "#4EC6C0";
const BACKGROUND_TOP = "#FFF9F2";
const BACKGROUND_BOTTOM = "#FFE5D4";

export function SplashScreen() {
  return (
    <LinearGradient
      colors={[BACKGROUND_TOP, BACKGROUND_BOTTOM]}
      style={styles.container}
    >
      <View style={styles.statusSpace} />
      <View style={styles.decorLeft} />
      <View style={styles.decorRight} />
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🐾</Text>
        </View>
        <Text style={styles.brand}>PatiOtel</Text>
        <Text style={styles.tagline}>
          Sevimli dostunuz güvenle konaklasın.
        </Text>
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={PRIMARY} />
          <Text style={styles.loaderLabel}>Yükleniyor...</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  statusSpace: {
    height: 20,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 4,
  },
  logoIcon: {
    fontSize: 48,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginHorizontal: spacing.xl,
  },
  loader: {
    marginTop: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  loaderLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  decorLeft: {
    position: "absolute",
    left: spacing.lg,
    top: spacing.xl * 2,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFECE0",
    opacity: 0.6,
  },
  decorRight: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl * 1.5,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: SECONDARY,
    opacity: 0.15,
  },
});
