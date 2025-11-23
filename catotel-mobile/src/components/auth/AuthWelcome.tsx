import { Image, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { colors, spacing, radii } from "@/theme";

const HERO_IMAGE = require("../../../assets/illustrations/Login.png");

type Props = {
  onLogin(): void;
  onRegister(): void;
  onGuest(): void;
};

export function AuthWelcome({ onLogin, onRegister, onGuest }: Props) {
  return (
    <LinearGradient
      colors={["#FFF9F2", "#FFE7DA"]}
      locations={[0, 1]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <View style={styles.illustrationShell}>
              <View style={[styles.blur, styles.blurLeft]} />
              <View style={[styles.blur, styles.blurRight]} />
              <Image
                source={HERO_IMAGE}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>PatiOtel'e Hos Geldin!</Text>
            <Text style={styles.subtitle}>
              Kedin icin konforlu ve guvenli konaklama, bir tik uzaginda.
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.buttons}>
              <Button onPress={onLogin}>Giris Yap</Button>
              <Button variant="ghost" onPress={onRegister}>
                Hesap Olustur
              </Button>
            </View>
            <Text style={styles.guestLink} onPress={onGuest}>
              Konuk olarak devam et
            </Text>
            <View style={styles.pawBadge}>
              <Text style={styles.paw}>{"\u{1F43E}"}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    justifyContent: "space-between",
  },
  heroSection: {
    alignItems: "center",
    gap: spacing.md,
  },
  illustrationShell: {
    width: "100%",
    height: 280,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  blur: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.35,
  },
  blurLeft: {
    backgroundColor: colors.accent,
    left: -40,
    top: 40,
  },
  blurRight: {
    backgroundColor: colors.teal,
    right: -30,
    bottom: 20,
  },
  illustration: {
    width: "90%",
    height: "90%",
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginHorizontal: spacing.xl,
  },
  footer: {
    alignItems: "center",
    gap: spacing.md,
  },
  buttons: {
    width: "100%",
    gap: spacing.sm,
  },
  guestLink: {
    fontSize: 14,
    color: colors.teal,
    fontWeight: "600",
  },
  pawBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  paw: {
    fontSize: 28,
  },
});
