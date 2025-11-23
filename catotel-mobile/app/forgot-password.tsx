import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { colors, spacing, radii } from "@/theme";
import { api } from "@/lib/api";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const DECOR = require("../assets/illustrations/ForgotPassword.png");

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailValid = EMAIL_REGEX.test(email.trim());

  const handleSubmit = async () => {
    setTouched(true);
    if (!emailValid || loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await api.forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "İstek gönderilirken bir hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <View style={styles.wrapper}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="chevron-left" size={26} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.heading}>
          <Text style={styles.title}>Şifreni mi unuttun?</Text>
          <Text style={styles.subtitle}>
            Kayıtlı e-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim.
          </Text>
        </View>

        <View style={styles.card}>
          <Image source={DECOR} style={styles.decor} resizeMode="contain" />

          {success && (
            <View style={[styles.banner, styles.bannerSuccess]}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <Text style={[styles.bannerText, styles.bannerTextSuccess]}>
                E-posta adresine bir doğrulama bağlantısı gönderdik. Lütfen gelen
                kutunu kontrol et.
              </Text>
            </View>
          )}

          {error && (
            <View style={[styles.banner, styles.bannerError]}>
              <Feather name="alert-triangle" size={18} color="#B42318" />
              <Text style={styles.bannerText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>E-posta</Text>
            <View
              style={[
                styles.inputWrapper,
                touched && !emailValid && styles.inputError,
              ]}
            >
              <Feather
                name="mail"
                size={18}
                color={touched && !emailValid ? "#B42318" : colors.textMuted}
              />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (success) setSuccess(false);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholder="ornek@mail.com"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
            <Text style={styles.helper}>
              Güvenliğin için yalnızca kayıtlı e-posta adresine mail gönderiyoruz.
            </Text>
            {touched && !emailValid && (
              <Text style={styles.errorText}>Geçerli bir e-posta gir.</Text>
            )}
          </View>

          <Button
            onPress={handleSubmit}
            disabled={!emailValid || loading}
            loading={loading}
          >
            Gönder
          </Button>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  heading: {
    gap: spacing.xs,
    paddingRight: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    padding: spacing.xl,
    width: "100%",
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 6,
    gap: spacing.lg,
    overflow: "hidden",
  },
  decor: {
    position: "absolute",
    width: 140,
    height: 140,
    top: -20,
    right: -20,
    opacity: 0.9,
  },
  banner: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: "flex-start",
  },
  bannerError: {
    backgroundColor: "#FEF3F2",
    borderColor: "#FEE4E2",
  },
  bannerSuccess: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  bannerTextSuccess: {
    color: colors.teal,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  inputError: {
    borderColor: "#B42318",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  helper: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: "#B42318",
  },
});
