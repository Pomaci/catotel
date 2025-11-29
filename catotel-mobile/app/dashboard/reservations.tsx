import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { Screen } from "@/components/layout/Screen";
import { colors, radii, spacing, typography } from "@/theme";

type StatusKey = "created" | "confirmed" | "checkin" | "checkout" | "cancelled";

type ReservationItem = {
  id: string;
  cat: string;
  owner: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  room: string;
  roomType: string;
  status: StatusKey;
  window: "today" | "week" | "month";
};

const reservationsSeed: ReservationItem[] = [
  {
    id: "RSV-2104",
    cat: "Misket",
    owner: "Duru Aksoy",
    checkIn: "12 Mart",
    checkOut: "15 Mart",
    nights: 3,
    room: "104",
    roomType: "Mini Suite",
    status: "confirmed",
    window: "week",
  },
  {
    id: "RSV-2105",
    cat: "Pofuduk",
    owner: "Selin Kara",
    checkIn: "13 Mart",
    checkOut: "17 Mart",
    nights: 4,
    room: "112",
    roomType: "Standart",
    status: "checkin",
    window: "today",
  },
  {
    id: "RSV-2106",
    cat: "Luna",
    owner: "Melis Karaca",
    checkIn: "10 Mart",
    checkOut: "12 Mart",
    nights: 2,
    room: "107",
    roomType: "Standart",
    status: "checkout",
    window: "today",
  },
  {
    id: "RSV-2107",
    cat: "Atlas",
    owner: "Efe Yalçın",
    checkIn: "18 Mart",
    checkOut: "22 Mart",
    nights: 4,
    room: "115",
    roomType: "VIP",
    status: "created",
    window: "month",
  },
  {
    id: "RSV-2108",
    cat: "Zuzu",
    owner: "Mert Aydın",
    checkIn: "09 Mart",
    checkOut: "11 Mart",
    nights: 2,
    room: "103",
    roomType: "Standart",
    status: "cancelled",
    window: "week",
  },
  {
    id: "RSV-2109",
    cat: "Karamel",
    owner: "Tolga Sezen",
    checkIn: "14 Mart",
    checkOut: "18 Mart",
    nights: 4,
    room: "109",
    roomType: "Mini Suite",
    status: "confirmed",
    window: "week",
  },
];

const dateOptions = ["Bugün", "Bu Hafta", "Bu Ay", "Özel Aralık"] as const;
const statusOptions = ["Tümü", "Oluşturuldu", "Onaylandı", "Check-in", "Check-out", "İptal"] as const;
const roomOptions = ["Tüm Odalar", "101", "103", "104", "107", "109", "112", "115"] as const;

export default function ReservationsMobileScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<(typeof dateOptions)[number]>("Bu Hafta");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("Tümü");
  const [roomFilter, setRoomFilter] = useState<(typeof roomOptions)[number]>("Tüm Odalar");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const filteredReservations = useMemo(() => {
    return reservationsSeed.filter((res) => {
      const matchesSearch =
        search.trim().length === 0 ||
        res.cat.toLowerCase().includes(search.trim().toLowerCase()) ||
        res.owner.toLowerCase().includes(search.trim().toLowerCase());

      const matchesDate =
        dateFilter === "Bugün"
          ? res.window === "today"
          : dateFilter === "Bu Hafta"
            ? res.window === "week" || res.window === "today"
            : dateFilter === "Bu Ay"
              ? res.window === "month" || res.window === "week" || res.window === "today"
              : true;

      const matchesStatus =
        statusFilter === "Tümü" || statusLabel(res.status) === statusFilter;

      const matchesRoom = roomFilter === "Tüm Odalar" || res.room === roomFilter;

      return matchesSearch && matchesDate && matchesStatus && matchesRoom;
    });
  }, [dateFilter, roomFilter, search, statusFilter]);

  const showEmpty = !loading && filteredReservations.length === 0;

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.page}
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
      >
        <TopBar
          onBack={() => router.back()}
          onCreate={() =>
            Alert.alert("Yeni Rezervasyon", "Rezervasyon oluşturma akışı yakında.")
          }
        />

        <View style={styles.stickyHeader} collapsable={false}>
          <FilterBar
            search={search}
            onSearch={setSearch}
            onClearSearch={() => setSearch("")}
            dateFilter={dateFilter}
            statusFilter={statusFilter}
            roomFilter={roomFilter}
            onChangeDate={setDateFilter}
            onChangeStatus={setStatusFilter}
            onChangeRoom={setRoomFilter}
            onReset={() => {
              setSearch("");
              setDateFilter("Bu Hafta");
              setStatusFilter("Tümü");
              setRoomFilter("Tüm Odalar");
            }}
          />
        </View>

        <View style={styles.listContainer}>
          {loading && <SkeletonList />}
          {!loading && (
            <FlatList
              data={filteredReservations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ReservationCard
                  reservation={item}
                  onPress={() =>
                    Alert.alert("Detay", "Rezervasyon detay ekranı yakında.")
                  }
                />
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
              ListEmptyComponent={showEmpty ? <EmptyState onReset={() => setSearch("")} /> : null}
            />
          )}
          <View style={{ height: spacing.xl * 1.5 }} />
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push("/dashboard")}>
        <Feather name="plus" size={22} color="#FFFFFF" />
      </Pressable>
    </Screen>
  );
}

function TopBar({ onBack, onCreate }: { onBack(): void; onCreate(): void }) {
  return (
    <View style={topStyles.container}>
      <Pressable style={topStyles.iconButton} onPress={onBack}>
        <Feather name="chevron-left" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={topStyles.title}>Rezervasyonlar</Text>
      <Pressable style={[topStyles.iconButton, topStyles.plusButton]} onPress={onCreate}>
        <Feather name="plus" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function FilterBar({
  search,
  onSearch,
  onClearSearch,
  dateFilter,
  statusFilter,
  roomFilter,
  onChangeDate,
  onChangeStatus,
  onChangeRoom,
  onReset,
}: {
  search: string;
  onSearch(text: string): void;
  onClearSearch(): void;
  dateFilter: (typeof dateOptions)[number];
  statusFilter: (typeof statusOptions)[number];
  roomFilter: (typeof roomOptions)[number];
  onChangeDate(value: (typeof dateOptions)[number]): void;
  onChangeStatus(value: (typeof statusOptions)[number]): void;
  onChangeRoom(value: (typeof roomOptions)[number]): void;
  onReset(): void;
}) {
  return (
    <View style={filterStyles.card}>
      <View style={filterStyles.searchRow}>
        <Feather name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={search}
          onChangeText={onSearch}
          placeholder="Müşteri adı veya kedi adı ile ara"
          placeholderTextColor={colors.textMuted}
          style={filterStyles.searchInput}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={onClearSearch}>
            <Feather name="x" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filterStyles.filtersRow}
      >
        <FilterPill
          label="Tarih Aralığı"
          value={dateFilter}
          icon="calendar"
          onPress={() => cycleValue(dateFilter, dateOptions, onChangeDate)}
        />
        <FilterPill
          label="Durum"
          value={statusFilter}
          icon="tag"
          color={statusColor(statusFilter)}
          onPress={() => cycleValue(statusFilter, statusOptions, onChangeStatus)}
        />
        <FilterPill
          label="Oda"
          value={roomFilter === "Tüm Odalar" ? "Tüm Odalar" : `Oda ${roomFilter}`}
          icon="home"
          onPress={() => cycleValue(roomFilter, roomOptions, onChangeRoom)}
        />
        <Pressable style={filterStyles.reset} onPress={onReset}>
          <Feather name="rotate-ccw" size={16} color={colors.accent} />
          <Text style={filterStyles.resetLabel}>Temizle</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FilterPill({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  onPress(): void;
}) {
  return (
    <Pressable style={filterStyles.pill} onPress={onPress}>
      <View style={filterStyles.pillLabelRow}>
        <Feather name={icon} size={14} color={color ?? colors.textSecondary} />
        <Text style={filterStyles.pillLabel}>{label}</Text>
      </View>
      <View style={filterStyles.pillValue}>
        <Text style={[filterStyles.pillValueText, color ? { color } : null]}>
          {value}
        </Text>
        <Feather name="chevron-down" size={14} color={color ?? colors.textSecondary} />
      </View>
    </Pressable>
  );
}

function ReservationCard({
  reservation,
  onPress,
}: {
  reservation: ReservationItem;
  onPress(): void;
}) {
  return (
    <Pressable style={cardStyles.card} onPress={onPress}>
      <View style={cardStyles.rowTop}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarLabel}>{reservation.cat.slice(0, 1)}</Text>
        </View>
        <View style={cardStyles.identity}>
          <Text style={cardStyles.catName}>{reservation.cat}</Text>
          <Text style={cardStyles.owner}>{reservation.owner}</Text>
        </View>
        <StatusBadge status={reservation.status} />
      </View>

      <View style={cardStyles.rowMiddle}>
        <View style={cardStyles.dateBlock}>
          <Feather name="calendar" size={16} color={colors.textSecondary} />
          <View>
            <Text style={cardStyles.dateText}>
              {reservation.checkIn} — {reservation.checkOut}
            </Text>
            <Text style={cardStyles.dateMeta}>{reservation.nights} gece</Text>
          </View>
        </View>
        <View style={cardStyles.roomBlock}>
          <Feather name="home" size={16} color={colors.teal} />
          <View>
            <Text style={cardStyles.roomText}>Oda {reservation.room}</Text>
            <Text style={cardStyles.roomMeta}>{reservation.roomType}</Text>
          </View>
        </View>
      </View>

      <View style={cardStyles.rowBottom}>
        <View style={cardStyles.roomTag}>
          <Text style={cardStyles.roomTagText}>{reservation.room}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: StatusKey }) {
  const meta = badgeMeta[status];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[badgeStyles.label, { color: meta.text }]}>{statusLabel(status)}</Text>
    </View>
  );
}

function EmptyState({ onReset }: { onReset(): void }) {
  return (
    <View style={emptyStyles.container}>
      <View style={emptyStyles.illustration}>
        <Text style={emptyStyles.catFace}>=^.^=</Text>
      </View>
      <Text style={emptyStyles.title}>Gösterilecek rezervasyon bulunmuyor.</Text>
      <Text style={emptyStyles.subtitle}>
        Filtreleri değiştirerek yeniden deneyebilirsin.
      </Text>
      <Pressable style={emptyStyles.button} onPress={onReset}>
        <Text style={emptyStyles.buttonLabel}>Tümünü Gör</Text>
      </Pressable>
    </View>
  );
}

function SkeletonList() {
  return (
    <View style={{ gap: spacing.md }}>
      {[0, 1, 2].map((key) => (
        <View key={key} style={skeletonStyles.card}>
          <View style={skeletonStyles.row}>
            <View style={skeletonStyles.avatar} />
            <View style={skeletonStyles.lines}>
              <View style={skeletonStyles.lineWide} />
              <View style={skeletonStyles.lineMid} />
            </View>
          </View>
          <View style={[skeletonStyles.lineWide, { marginTop: spacing.sm }]} />
          <View style={[skeletonStyles.lineShort, { marginTop: spacing.xs }]} />
        </View>
      ))}
    </View>
  );
}

const badgeMeta: Record<StatusKey, { bg: string; text: string }> = {
  created: { bg: "#FFE3D8", text: "#FF8A5C" },
  confirmed: { bg: "#D8F5F4", text: colors.teal },
  checkin: { bg: colors.accent, text: "#FFFFFF" },
  checkout: { bg: "#CBD5E1", text: colors.textPrimary },
  cancelled: { bg: "#FFD7D7", text: "#D14343" },
};

function statusLabel(status: StatusKey) {
  if (status === "created") return "Oluşturuldu";
  if (status === "confirmed") return "Onaylandı";
  if (status === "checkin") return "Check-in";
  if (status === "checkout") return "Check-out";
  return "İptal";
}

function statusColor(status: (typeof statusOptions)[number]) {
  if (status === "Onaylandı") return colors.teal;
  if (status === "Check-in") return colors.accent;
  if (status === "İptal") return "#E15D5D";
  if (status === "Oluşturuldu") return "#FF8A5C";
  return colors.textSecondary;
}

function cycleValue<T extends string>(
  current: T,
  options: readonly T[],
  onChange: (next: T) => void,
) {
  const idx = options.indexOf(current);
  const next = options[(idx + 1) % options.length];
  onChange(next);
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: spacing.xxl,
  },
  stickyHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
});

const topStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 16,
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
});

const filterStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  filtersRow: {
    gap: spacing.sm,
    alignItems: "center",
  },
  pill: {
    minWidth: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  pillLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pillLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  pillValue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pillValueText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  reset: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  resetLabel: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 4,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  identity: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  catName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  owner: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowMiddle: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  dateBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dateMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  roomBlock: {
    flex: 0.9,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    justifyContent: "flex-end",
  },
  roomText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  roomMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "right",
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomTag: {
    backgroundColor: colors.tealSoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.teal,
  },
  roomTagText: {
    color: colors.teal,
    fontWeight: "700",
  },
});

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});

const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.accentMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  catFace: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  button: {
    marginTop: spacing.xs,
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});

const skeletonStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.borderMuted,
  },
  lines: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  lineWide: {
    height: 12,
    borderRadius: 8,
    backgroundColor: colors.borderMuted,
  },
  lineMid: {
    width: "60%",
    height: 10,
    borderRadius: 8,
    backgroundColor: colors.borderMuted,
  },
  lineShort: {
    width: "40%",
    height: 10,
    borderRadius: 8,
    backgroundColor: colors.borderMuted,
  },
});
