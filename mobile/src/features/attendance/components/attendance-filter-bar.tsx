import { Pressable, ScrollView, Text } from "react-native";
import { SearchBar } from "@/src/components/ui";
import type { AttendanceFilter } from "@/src/features/attendance/types";

interface AttendanceFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: AttendanceFilter;
  onSelectFilter: (filter: AttendanceFilter) => void;
  unmarkedCount: number;
}

export function AttendanceFilterBar({
  searchQuery,
  onSearchChange,
  filter,
  onSelectFilter,
  unmarkedCount,
}: AttendanceFilterBarProps) {
  const filters: { value: AttendanceFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unmarked", label: `Unmarked ${unmarkedCount}` },
    { value: "present", label: "Present" },
    { value: "absent", label: "Absent" },
    { value: "excused", label: "Excused" },
  ];

  return (
    <>
      <SearchBar
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder="Search by child name"
        containerClassName="mx-6 mb-2 mt-4"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-6"
        accessibilityRole="tablist"
      >
        {filters.map((item) => {
          const selected = filter === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => onSelectFilter(item.value)}
              accessibilityRole="tab"
              accessibilityLabel={`Filter attendance by ${item.label}`}
              accessibilityState={{ selected }}
              className={`min-h-11 justify-center rounded-full border px-4 ${
                selected
                  ? "border-teal-700 bg-teal-700"
                  : item.value === "unmarked" && unmarkedCount > 0
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-300 bg-white"
              }`}
            >
              <Text
                className={`font-semibold ${
                  selected ? "text-white" : "text-gray-700"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

