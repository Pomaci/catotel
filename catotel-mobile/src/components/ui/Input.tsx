import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { colors, radii, spacing } from "@/theme";

type Props = TextInputProps & {
  label?: string;
  hint?: string;
};

export const Input = forwardRef<TextInput, Props>(
  (
    {
      label,
      hint,
      style,
      autoComplete = "off",
      autoCapitalize = "none",
      autoCorrect = false,
      importantForAutofill = "no",
      textContentType = "none",
      ...rest
    },
    ref,
  ) => {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          importantForAutofill={importantForAutofill}
          textContentType={textContentType}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
          {...rest}
        />
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    );
  },
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
  },
  input: {
    width: "100%",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 3,
  },
});
