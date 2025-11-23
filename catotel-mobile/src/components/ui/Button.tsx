import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors, radii, spacing } from "@/theme";

type ButtonVariant = "primary" | "ghost" | "danger";

type Props = Omit<PressableProps, "children"> & {
  variant?: ButtonVariant;
  label?: string;
  loading?: boolean;
  children?: ReactNode;
};

export function Button({
  children,
  variant = "primary",
  label,
  loading,
  onPress,
  disabled,
  style,
  ...rest
}: Props) {
  const handlePress: PressableProps["onPress"] = async (event) => {
    if (disabled) {
      return;
    }
    await Haptics.selectionAsync();
    onPress?.(event);
  };

  const buttonStyle = StyleSheet.flatten([
    baseStyles.button,
    variantStyles[variant],
    (disabled || loading) && baseStyles.disabled,
    style,
  ]);

  const labelStyle = StyleSheet.flatten([
    baseStyles.label,
    labelVariants[variant],
  ]);

  return (
    <Pressable
      {...rest}
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <View style={baseStyles.content}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={labelStyle.color ?? "#ffffff"}
            style={baseStyles.spinner}
          />
        )}
        <Text style={[labelStyle, loading && baseStyles.loadingText]}>
          {children ?? label ?? ""}
        </Text>
      </View>
    </Pressable>
  );
}

const baseStyles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.55,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  spinner: {
    marginRight: spacing.xs / 2,
  },
  loadingText: {
    opacity: 0.9,
  },
});

const variantStyles: Record<ButtonVariant, any> = {
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  ghost: {
    backgroundColor: colors.card,
    borderColor: colors.accent,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
};

const labelVariants: Record<ButtonVariant, any> = {
  primary: {
    color: "#3b2419",
  },
  ghost: {
    color: colors.accent,
  },
  danger: {
    color: "#fffefd",
  },
};
