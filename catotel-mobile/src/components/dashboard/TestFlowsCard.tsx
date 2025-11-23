import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { colors, spacing, radii } from "@/theme";

const FLOWS = [
  {
    title: "Çoklu cihaz oturumu",
    description:
      "Başka bir cihazda giriş yap ve bu ekrandan /auth/sessions listesini gözlemle.",
  },
  {
    title: "Token yenile",
    description:
      "“Token yenile” butonuna basarak /auth/refresh akışının başarılı döndüğünü doğrula.",
    code: "/auth/refresh",
  },
  {
    title: "Tüm oturumları kapat",
    description:
      "Diğer cihazlarda 401 almak için “Tüm oturumları kapat” aksiyonunu çalıştır.",
  },
  {
    title: "Tek cihazdan çıkış",
    description:
      "Çıkış yap sadece bu cihazın oturumunu kapatır; diğer cihazlar aktif kalır.",
  },
];

export function TestFlowsCard() {
  return (
    <Card>
      <Text style={styles.title}>Test Akışları</Text>
      <View style={styles.list}>
        {FLOWS.map((flow) => (
          <Bullet key={flow.title}>
            <Text style={styles.bold}>{flow.title}:</Text>{" "}
            <Text style={styles.itemText}>{flow.description} </Text>
            {flow.code && <Text style={styles.code}>{flow.code}</Text>}
          </Bullet>
        ))}
      </View>
    </Card>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.dot} />
      <Text style={styles.item}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  bulletRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    marginTop: spacing.xs + 2,
  },
  item: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  itemText: {
    color: colors.textSecondary,
  },
  bold: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  code: {
    fontFamily: "Courier",
    color: colors.teal,
  },
});
