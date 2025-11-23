import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "@/theme";

type AlertType = "info" | "error" | "success";

type Props = {
  type?: AlertType;
  children: ReactNode;
};

export function Alert({ type = "info", children }: Props) {
  const variant = alertVariants[type];
  return (
    <View style={[styles.base, { backgroundColor: variant.bg, borderColor: variant.border }]}>
      <Text style={[styles.text, { color: variant.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: "500",
  },
});

const alertVariants: Record<AlertType, { bg: string; border: string; text: string }> = {
  info: {
    bg: colors.tealSoft,
    border: colors.teal,
    text: colors.teal,
  },
  error: {
    bg: "rgba(236, 107, 98, 0.12)",
    border: colors.danger,
    text: colors.danger,
  },
  success: {
    bg: "rgba(69, 191, 145, 0.12)",
    border: colors.success,
    text: colors.success,
  },
};
