import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import type { Child } from "@/src/api/api.types";
import type { AttendanceSelection, AttendanceStatus } from "@/src/features/attendance/types";
import { formatChildRosterName } from "@/src/utils/child-name";

const STATUS_STYLE = {
  present: {
    letter: "P",
    label: "Present",
    selected: "bg-emerald-600 border-emerald-600",
  },
  absent: {
    letter: "A",
    label: "Absent",
    selected: "bg-red-600 border-red-600",
  },
  excused: {
    letter: "E",
    label: "Excused",
    selected: "bg-amber-500 border-amber-500",
  },
} as const;

interface AttendanceChildRowProps {
  child: Child;
  selection?: AttendanceSelection;
  editable: boolean;
  onSetStatus: (childId: string, status: AttendanceStatus) => void;
}

export const AttendanceChildRow = memo(function AttendanceChildRow({
  child,
  selection,
  editable,
  onSetStatus,
}: AttendanceChildRowProps) {
  return (
    <View
      className={`mx-6 mb-3 rounded-2xl border bg-white p-3 shadow-sm ${
        selection?.status === "present"
          ? "border-emerald-300"
          : selection?.status === "absent"
            ? "border-red-300"
            : selection?.status === "excused"
              ? "border-amber-300"
              : "border-gray-200"
      }`}
    >
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
          <Text className="font-bold text-slate-700">
            {child.firstName[0]}
            {child.lastName[0]}
          </Text>
        </View>
        <View className="ml-3 min-w-0 flex-1 pr-2">
          <Text className="text-base font-bold text-gray-900" numberOfLines={2}>
            {formatChildRosterName(child)}
          </Text>
        </View>
        <View className="flex-row gap-1">
          {(Object.keys(STATUS_STYLE) as AttendanceStatus[]).map((status) => {
            const style = STATUS_STYLE[status];
            const selected = selection?.status === status;
            return (
              <Pressable
                key={status}
                onPress={() => onSetStatus(child._id, status)}
                disabled={!editable}
                accessibilityRole="button"
                accessibilityLabel={`Mark ${formatChildRosterName(child)} ${style.label.toLowerCase()}`}
                accessibilityState={{ selected, disabled: !editable }}
                className={`h-11 w-11 items-center justify-center rounded-xl border ${
                  selected ? style.selected : "border-gray-300 bg-white"
                } ${!editable ? "opacity-60" : ""}`}
              >
                <Text
                  className={`text-base font-extrabold ${
                    selected ? "text-white" : "text-gray-700"
                  }`}
                >
                  {style.letter}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
});

