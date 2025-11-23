import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { colors, spacing, radii } from "@/theme";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Session } from "@/types/auth";

export function SessionList() {
  const { accessToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.sessions();
      setSessions(data);
    } catch (err: any) {
      setError(err?.message ?? "Session listesi alınamadı.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  return (
    <Card>
      <SectionHeading
        title="Aktif Oturumlar"
        subtitle="/auth/sessions"
        action={
          <Text style={styles.refresh} onPress={loadSessions}>
            Yenile
          </Text>
        }
      />

      {loading && <Text style={styles.info}>Yükleniyor...</Text>}
      {error && <Text style={[styles.info, styles.error]}>{error}</Text>}
      {!loading && !error && sessions.length === 0 && (
        <Text style={styles.info}>Aktif session bulunamadı.</Text>
      )}

      <View style={styles.list}>
        {sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <Row label="ID" value={session.id} />
            <Row label="User-Agent" value={session.userAgent || "-"} />
            <Row label="IP" value={session.ip || "-"} />
            <Row
              label="Oluşturulma"
              value={new Date(session.createdAt).toLocaleString()}
            />
            <Row
              label="Bitiş"
              value={new Date(session.expiresAt).toLocaleString()}
            />
          </View>
        ))}
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  refresh: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: "600",
  },
  info: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  error: {
    color: colors.danger,
  },
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  sessionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.xs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  rowLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  rowValue: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "right",
  },
});
