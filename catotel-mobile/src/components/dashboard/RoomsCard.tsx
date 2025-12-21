import { StyleSheet, Text, View } from "react-native";
import type { Room } from "@/types/hotel";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { colors, spacing, radii } from "@/theme";
import { formatCurrency } from "@/lib/format";

type Props = {
  rooms: Room[];
  loading: boolean;
  onRefresh: () => void;
};

export function RoomsCard({ rooms, loading, onRefresh }: Props) {
  const visibleRooms = rooms.slice(0, 4);

  return (
    <Card>
      <SectionHeading
        title={`Oda Envanteri (${rooms.length})`}
        action={
          <Text style={styles.action} onPress={onRefresh}>
            Yenile
          </Text>
        }
      />

      {loading && <Text style={styles.info}>Odalar yukleniyor...</Text>}
      {!loading && rooms.length === 0 && (
        <Text style={styles.info}>
          Aktif oda bilgisi bulunamadi. Yonetici panelinden olusturabilirsin.
        </Text>
      )}

      <View style={styles.list}>
        {visibleRooms.map((room) => {
          const roomType = room.roomType;
          const capacity =
            typeof roomType?.capacity === "number"
              ? roomType.capacity
              : Number(roomType?.capacity) || 0;
          const nightlyRate =
            typeof roomType?.nightlyRate === "number"
              ? roomType.nightlyRate
              : Number(roomType?.nightlyRate) || 0;
          const amenities =
            roomType?.amenities && Object.keys(roomType.amenities).length > 0
              ? roomType.amenities
              : null;
          const description =
            room.description || roomType?.description || "Aciklama eklenmedi.";

          return (
            <View key={room.id} style={styles.roomCard}>
              <View style={styles.row}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text
                  style={[
                    styles.status,
                    room.isActive ? styles.active : styles.inactive,
                  ]}
                >
                  {room.isActive ? "Aktif" : "Pasif"}
                </Text>
              </View>
              <Text style={styles.meta}>
                Kapasite {capacity} kedi - {formatCurrency(nightlyRate)} / gece
              </Text>
              <Text style={styles.description}>{description}</Text>
              {amenities && (
                <View style={styles.amenities}>
                  {Object.keys(amenities).map((key) => (
                    <Text key={key} style={styles.amenity}>
                      {key}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}
        {rooms.length > visibleRooms.length && (
          <Text style={styles.more}>
            {rooms.length - visibleRooms.length} oda daha var...
          </Text>
        )}
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
  list: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
  roomCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  status: {
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  active: {
    backgroundColor: "rgba(69,191,145,0.15)",
    color: colors.success,
  },
  inactive: {
    backgroundColor: "rgba(236,107,98,0.12)",
    color: colors.danger,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  description: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 2,
  },
  amenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  amenity: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 11,
    color: colors.textSecondary,
  },
  more: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
