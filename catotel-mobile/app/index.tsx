import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Redirect, useRouter } from "expo-router";
import { Screen } from "@/components/layout/Screen";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { colors, spacing, radii } from "@/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { SplashScreen } from "@/components/splash/SplashScreen";

type Mode = "welcome" | "login" | "register";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
const COUNTRY_CODES = [
  { code: "+90", label: "Türkiye (+90)" },
  { code: "+49", label: "Almanya (+49)" },
  { code: "+44", label: "Birleşik Krallık (+44)" },
];

export default function IndexScreen() {
  const { accessToken, bootstrapping, login, register, loading: authLoading, error: authError } =
    useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("welcome");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    accepted: false,
  });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [showRegisterErrors, setShowRegisterErrors] = useState(false);
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [pickerVisible, setPickerVisible] = useState(false);

  const loading = submitting || authLoading;
  const helperError = localError ?? authError;

  const canLogin = useMemo(
    () => EMAIL_REGEX.test(email.trim()) && password.trim().length >= 4,
    [email, password],
  );

  const digitsOnly = registerForm.phone.replace(/\D/g, "");
  const registerValidations = useMemo(() => {
    return {
      name: registerForm.name.trim().length >= 2,
      email: EMAIL_REGEX.test(registerForm.email.trim()),
      phone: digitsOnly.length === 0 || digitsOnly.length >= 10,
      password: registerForm.password.trim().length >= 8,
      confirm:
        registerForm.password.length > 0 &&
        registerForm.password === registerForm.confirm,
      terms: registerForm.accepted,
    };
  }, [digitsOnly.length, registerForm]);

  const canRegister = Object.values(registerValidations).every(Boolean);

  const handleLogin = async () => {
    setLocalError(null);
    if (!canLogin || loading) return;
    try {
      setSubmitting(true);
      await login(email.trim(), password);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Giriş yapılırken hata oluştu.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      setLocalError("Lütfen önce e-posta adresini gir.");
      return;
    }
    try {
      await api.forgotPassword(email.trim());
      Alert.alert(
        "E-posta gönderildi",
        "Şifreni sıfırlamak için e-postanı kontrol et.",
      );
    } catch (err) {
      setLocalError(
        err instanceof Error
          ? err.message
          : "Şifre sıfırlama isteği gönderilemedi.",
      );
    }
  };

  const handleRegister = async () => {
    setRegisterError(null);
    setShowRegisterErrors(true);
    if (!canRegister || regSubmitting) {
      setRegisterError("Lütfen formu eksiksiz ve doğru doldur.");
      return;
    }
    try {
      setRegSubmitting(true);
      const payload = {
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      };
      await register(payload);
      await login(registerForm.email.trim(), registerForm.password);
    } catch (err) {
      setRegisterError(
        err instanceof Error
          ? err.message
          : "Kayıt olurken bir hata oluştu.",
      );
    } finally {
      setRegSubmitting(false);
    }
  };

  if (bootstrapping) {
    return <SplashScreen />;
  }

  if (accessToken) {
    return <Redirect href="/dashboard" />;
  }

  if (mode === "welcome") {
    return (
      <Screen scrollable={false}>
        <View style={[styles.content, { alignItems: "center" }]}>
          <View style={styles.hero}>
            <View style={styles.illustrationShell}>
              <Image
                source={require("../assets/illustrations/Login.png")}
                style={styles.illustration}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.wTitle}>PatiOtel'e Hoş Geldin!</Text>
            <Text style={styles.wSubtitle}>
              Kedin için konforlu ve güvenli konaklama, bir tık uzağında.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button onPress={() => setMode("login")}>Giriş Yap</Button>
            <Button
              variant="ghost"
              onPress={() => {
                setShowRegisterErrors(false);
                setRegisterError(null);
                setMode("register");
              }}
            >
              Hesap Oluştur
            </Button>
          </View>

          <Pressable onPress={() => Alert.alert("Konuk", "Konuk modu yakında.")}>
            <Text style={styles.guest}>Konuk olarak devam et</Text>
          </Pressable>

          <Text style={styles.paw}>🐾</Text>
        </View>
      </Screen>
    );
  }

  if (mode === "login") {
    return (
      <Screen scrollable={false}>
        <View style={styles.content}>
          <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setMode("welcome");
              setLocalError(null);
              setShowRegisterErrors(false);
              setRegisterError(null);
            }}
          >
            <Feather name="chevron-left" size={22} color={colors.textPrimary} />
          </Pressable>
            <View style={styles.topTitles}>
              <Text style={styles.title}>Giriş Yap</Text>
              <Text style={styles.subtitle}>
                Kedin seni bekliyor, hemen rezervasyonlarını yönet.
              </Text>
            </View>
            <Pressable onPress={() => Alert.alert("Yardım", "support@catotel.com")}>
              <Text style={styles.help}>Yardım?</Text>
            </Pressable>
          </View>

          <Card padding={spacing.xl}>
            {helperError && (
              <View style={styles.banner}>
                <Feather name="alert-triangle" size={18} color="#B42318" />
                <Text style={styles.bannerText}>{helperError}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>E-posta</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={18} color={colors.textSecondary} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@mail.com"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Şifre</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={colors.textSecondary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                />
                <Pressable
                  style={styles.eye}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.optionsRow}>
              <Pressable
                style={styles.checkboxRow}
                onPress={() => setRememberMe((prev) => !prev)}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Feather name="check" size={14} color="#FFFFFF" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>Beni hatırla</Text>
              </Pressable>
              <Pressable onPress={() => router.push("/forgot-password")}>
                <Text style={styles.link}>Şifremi unuttum</Text>
              </Pressable>
            </View>

            <Button onPress={handleLogin} disabled={!canLogin || loading} loading={loading}>
              Giriş Yap
            </Button>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>veya şununla devam et</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable style={styles.socialButton}>
                <View style={styles.socialIcon}>
                  <FontAwesome name="google" size={18} color="#DB4437" />
                </View>
                <Text style={styles.socialLabel}>Google ile devam et</Text>
              </Pressable>
              <Pressable style={styles.socialButton}>
                <View style={styles.socialIcon}>
                  <FontAwesome name="apple" size={18} color={colors.textPrimary} />
                </View>
                <Text style={styles.socialLabel}>Apple ile devam et</Text>
              </Pressable>
            </View>

            <View style={styles.accountRow}>
              <Text style={styles.accountText}>Henüz hesabın yok mu?</Text>
            <Pressable
              onPress={() => {
                setShowRegisterErrors(false);
                setRegisterError(null);
                setMode("register");
              }}
            >
              <Text style={styles.accountLink}>Hesap Oluştur</Text>
            </Pressable>
            </View>
          </Card>

          <Text style={styles.paw}>🐾</Text>
        </View>
      </Screen>
    );
  }

  // Register screen
  return (
    <Screen scrollable={false}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setMode("welcome");
              setRegisterError(null);
            }}
          >
            <Feather name="chevron-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.topTitles}>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>
              Kedin için rezervasyonlarını kolayca yönet.
            </Text>
          </View>
          <Pressable onPress={() => Alert.alert("Yardım", "support@catotel.com")}>
            <Text style={styles.help}>Yardım?</Text>
          </Pressable>
        </View>

        <Card padding={spacing.xl}>
          {registerError && (
            <View style={styles.banner}>
              <Feather name="alert-triangle" size={18} color="#B42318" />
              <Text style={styles.bannerText}>{registerError}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Ad Soyad</Text>
            <View
              style={[
                styles.inputWrapper,
                showRegisterErrors && !registerValidations.name && styles.inputError,
              ]}
            >
              <Feather name="user" size={18} color={colors.textSecondary} />
              <TextInput
                value={registerForm.name}
                onChangeText={(v) => setRegisterForm((s) => ({ ...s, name: v }))}
                placeholder="Örn: Ayşe Yılmaz"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
            {showRegisterErrors && !registerValidations.name && (
              <Text style={styles.errorText}>Lütfen adını ve soyadını gir.</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>E-posta</Text>
            <View
              style={[
                styles.inputWrapper,
                showRegisterErrors && !registerValidations.email && styles.inputError,
              ]}
            >
              <Feather name="mail" size={18} color={colors.textSecondary} />
              <TextInput
                value={registerForm.email}
                onChangeText={(v) => setRegisterForm((s) => ({ ...s, email: v }))}
                placeholder="ornek@mail.com"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
            {showRegisterErrors && !registerValidations.email && (
              <Text style={styles.errorText}>Geçerli bir e-posta gir.</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefon</Text>
            <View
              style={[
                styles.inputWrapper,
                showRegisterErrors &&
                  digitsOnly.length > 0 &&
                  !registerValidations.phone &&
                  styles.inputError,
              ]}
            >
              <Pressable
                style={styles.countrySelector}
                onPress={() => setPickerVisible(true)}
              >
                <Text style={styles.countryCode}>{countryCode.code}</Text>
                <Feather name="chevron-down" size={16} color={colors.textSecondary} />
              </Pressable>
              <TextInput
                value={registerForm.phone}
                onChangeText={(v) => setRegisterForm((s) => ({ ...s, phone: v }))}
                placeholder="5XX XXX XX XX"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>
            {showRegisterErrors && digitsOnly.length > 0 && !registerValidations.phone && (
              <Text style={styles.errorText}>Telefon numaran en az 10 haneli olmalı.</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Şifre</Text>
            <View
              style={[
                styles.inputWrapper,
                showRegisterErrors && !registerValidations.password && styles.inputError,
              ]}
            >
              <Feather name="lock" size={18} color={colors.textSecondary} />
              <TextInput
                value={registerForm.password}
                onChangeText={(v) => setRegisterForm((s) => ({ ...s, password: v }))}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
              />
            </View>
            <Text style={styles.helperText}>
              En az 8 karakter olmal??.
            </Text>
            {showRegisterErrors && !registerValidations.password && (
              <Text style={styles.errorText}>??ifren en az 8 karakter olmal??.</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Şifreyi Onayla</Text>
            <View
              style={[
                styles.inputWrapper,
                showRegisterErrors && !registerValidations.confirm && styles.inputError,
              ]}
            >
              <Feather name="shield" size={18} color={colors.textSecondary} />
              <TextInput
                value={registerForm.confirm}
                onChangeText={(v) => setRegisterForm((s) => ({ ...s, confirm: v }))}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
              />
            </View>
            {showRegisterErrors && !registerValidations.confirm && (
              <Text style={styles.errorText}>Şifreler eşleşmiyor.</Text>
            )}
          </View>

          <Pressable
            style={styles.termsRow}
            onPress={() =>
              setRegisterForm((s) => ({ ...s, accepted: !s.accepted }))
            }
          >
            <View
              style={[
                styles.checkboxBox,
                registerForm.accepted && styles.checkboxChecked,
              ]}
            >
              {registerForm.accepted && (
                <Feather name="check" size={14} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.termsText}>
              Kullanım koşullarını ve KVKK metnini okudum, kabul ediyorum.
            </Text>
          </Pressable>
          {showRegisterErrors && !registerValidations.terms && (
            <Text style={styles.errorText}>
              Devam etmek için koşulları kabul etmelisin.
            </Text>
          )}

          <Button
            onPress={handleRegister}
            disabled={regSubmitting}
            loading={regSubmitting}
          >
            Hesap Oluştur
          </Button>

          <View style={styles.accountRow}>
            <Text style={styles.accountText}>Zaten hesabın var mı?</Text>
            <Pressable onPress={() => setMode("login")}>
              <Text style={styles.accountLink}>Giriş Yap</Text>
            </Pressable>
          </View>
        </Card>

        <Text style={styles.paw}>🐾</Text>
      </View>

      <Modal transparent visible={pickerVisible} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ülke Kodu</Text>
            {COUNTRY_CODES.map((code) => (
              <Pressable
                key={code.code}
                style={[
                  styles.modalOption,
                  code.code === countryCode.code && styles.modalOptionActive,
                ]}
                onPress={() => {
                  setCountryCode(code);
                  setPickerVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    code.code === countryCode.code && styles.modalOptionTextActive,
                  ]}
                >
                  {code.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    width: "100%",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  illustrationShell: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  wTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  wSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  guest: {
    marginTop: spacing.sm,
    color: colors.teal,
    fontWeight: "700",
    fontSize: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
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
  topTitles: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  help: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingTop: spacing.xs,
  },
  banner: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "#FEE4E2",
    backgroundColor: "#FEF3F2",
    marginBottom: spacing.md,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    color: "#B42318",
  },
  field: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  inputError: {
    borderColor: "#F97066",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  eye: {
    padding: spacing.xs,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  link: {
    fontSize: 13,
    color: colors.teal,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  socialRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  socialLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  accountText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  accountLink: {
    fontSize: 14,
    color: colors.teal,
    fontWeight: "700",
  },
  paw: {
    alignSelf: "center",
    marginTop: spacing.lg,
    fontSize: 28,
    opacity: 0.5,
  },
  countrySelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  countryCode: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: "#B42318",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  modalOptionActive: {
    backgroundColor: colors.accentMuted,
  },
  modalOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalOptionTextActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
});



