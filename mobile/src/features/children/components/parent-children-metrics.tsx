import { Text, View, Pressable } from "react-native";
import * as Icons from "lucide-react-native";

export function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "danger" | "neutral";
}) {
  const colors =
    tone === "success"
      ? { wrap: "bg-emerald-100", text: "text-emerald-700" }
      : tone === "danger"
        ? { wrap: "bg-rose-100", text: "text-rose-700" }
        : { wrap: "bg-slate-200", text: "text-slate-600" };

  return (
    <View className="flex-row items-center justify-between rounded-xl bg-white px-3 py-2.5">
      <Text className="text-lg font-bold text-gray-700">{label}</Text>
      <View className={`rounded-full px-3 py-1 ${colors.wrap}`}>
        <Text className={`text-sm font-bold ${colors.text}`}>{value}</Text>
      </View>
    </View>
  );
}

export function ProgressMetric({
  label,
  value,
  done,
  total,
  barColor,
}: {
  label: string;
  value: number;
  done: number;
  total: number;
  barColor: string;
}) {
  const progressWidth = total > 0 ? Math.max(4, value) : 0;

  return (
    <View className="mb-4 last:mb-0">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-gray-700">{label}</Text>
        <Text className="text-xl font-black text-gray-900">{value}%</Text>
      </View>

      <View className="mt-2 h-4 overflow-hidden rounded-full bg-gray-200">
        <View
          className="h-full rounded-full"
          style={{
            width: `${progressWidth}%`,
            backgroundColor: barColor,
          }}
        />
      </View>

      <Text className="mt-2 text-base font-bold text-gray-500">
        {total > 0
          ? `${done}/${total} recorded days`
          : "No records for this month yet"}
      </Text>
    </View>
  );
}

export function QuickActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 active:opacity-80"
    >
      <View className="flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-white">
          {icon}
        </View>

        <View className="ml-4 flex-1">
          <Text className="text-lg font-black text-gray-900">{title}</Text>
          <Text className="mt-1 text-base font-bold text-gray-500">
            {subtitle}
          </Text>
        </View>

        <Icons.ChevronRight size={24} color="#64748B" />
      </View>
    </Pressable>
  );
}
