import { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ScrollViewProps,
  ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

type Props = {
  scrollable?: boolean;
  children: ReactNode;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  style?: ViewProps["style"];
};

export function Screen({
  scrollable = false,
  children,
  contentContainerStyle,
  style,
}: Props) {
  const Container = scrollable ? ScrollView : View;

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundAlt]}
      locations={[0, 1]}
      style={styles.gradient}
    >
      <View
        style={styles.autofillShield}
        {...(Platform.OS === "android"
          ? { importantForAutofill: "noExcludeDescendants" as const }
          : {})}
      >
        <SafeAreaView style={styles.safeArea}>
          {scrollable ? (
            <ScrollView
              style={[styles.container, style]}
              contentContainerStyle={contentContainerStyle}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="interactive"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.container, style]}>{children}</View>
          )}
        </SafeAreaView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  autofillShield: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
