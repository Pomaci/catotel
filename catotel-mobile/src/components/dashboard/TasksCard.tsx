import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { CareTask } from "@/types/hotel";
import { CareTaskStatus } from "@/types/enums";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { colors, spacing, radii } from "@/theme";
import { formatDate, formatEnum } from "@/lib/format";

type Props = {
  tasks: CareTask[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (id: string, status: CareTaskStatus) => Promise<void>;
};

const STATUS_ORDER: CareTaskStatus[] = [
  CareTaskStatus.OPEN,
  CareTaskStatus.IN_PROGRESS,
  CareTaskStatus.DONE,
  CareTaskStatus.CANCELLED,
];

export function TasksCard({
  tasks,
  loading,
  onRefresh,
  onUpdateStatus,
}: Props) {
  const [pending, setPending] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      items: tasks.filter((task) => task.status === status),
    }));
  }, [tasks]);

  const handleUpdate = async (id: string, status: CareTaskStatus) => {
    setPending(`${id}-${status}`);
    try {
      await onUpdateStatus(id, status);
    } finally {
      setPending(null);
    }
  };

  return (
    <Card>
      <SectionHeading
        title="Bakim Gorevleri"
        action={
          <Text style={styles.action} onPress={onRefresh}>
            Yenile
          </Text>
        }
      />
      {loading && <Text style={styles.info}>Gorevler yukleniyor...</Text>}
      {!loading && tasks.length === 0 && (
        <Text style={styles.info}>
          Aktif personel gorevi bulunamadi veya bu rol icin erisim yok.
        </Text>
      )}

      <View style={styles.columns}>
        {grouped.map(({ status, items }) => (
          <View key={status} style={styles.column}>
            <Text style={styles.columnTitle}>{formatEnum(status)}</Text>
            <View style={styles.columnList}>
              {items.map((task) => {
                const roomLabel =
                  task.reservation?.roomAssignments?.[0]?.room?.name ??
                  task.reservation?.roomType?.name ??
                  "Oda yok";
                return (
                  <View key={task.id} style={styles.taskCard}>
                    <Text style={styles.taskTitle}>{formatEnum(task.type)}</Text>
                    <Text style={styles.meta}>
                      {task.cat?.name ?? "Belirsiz"} - {roomLabel}
                    </Text>
                    <Text style={styles.meta}>
                      Planlanan: {formatDate(task.scheduledAt)}
                    </Text>
                    {task.notes && (
                      <Text style={styles.notes}>Not: {task.notes}</Text>
                    )}
                    <View style={styles.taskActions}>
                      {[CareTaskStatus.IN_PROGRESS, CareTaskStatus.DONE].map(
                        (next) => (
                          <Button
                            key={next}
                            variant="ghost"
                            label={formatEnum(next)}
                            style={styles.taskButton}
                            loading={pending === `${task.id}-${next}`}
                            onPress={() => handleUpdate(task.id, next)}
                          />
                        ),
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  action: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: "600",
  },
  info: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  columns: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  column: {
    flex: 1,
    minWidth: 150,
    gap: spacing.sm,
  },
  columnTitle: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  columnList: {
    gap: spacing.sm,
  },
  taskCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notes: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  taskActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  taskButton: {
    flex: 1,
  },
});
