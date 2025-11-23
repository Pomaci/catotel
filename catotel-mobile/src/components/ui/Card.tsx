import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii, spacing } from "@/theme";

type Props = {
  children: ReactNode;
  padding?: number;
};

export function Card({ children, padding = spacing.lg }: Props) {
  return <View style={[styles.card, { padding }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 6,
  },
});
