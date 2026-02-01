import { View, Text } from "react-native";

export const StatRow = ({ color, label, value }: { color: string; label: string; value: string }) => (
    <View className="flex-row items-center justify-between mt-3">
        <View className="flex-row items-center">
            <View style={{ backgroundColor: color }} className="w-3 h-3 rounded-full mr-2" />
            <Text className="text-sm text-gray-700">{label}</Text>
        </View>
        <Text className="text-sm font-semibold text-gray-800">{value}</Text>
    </View>
);

export const ProgressBar = ({ percent }: { percent: number }) => (
    <View className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <View style={{ width: `${percent}%` }} className="h-full bg-teal-500" />
    </View>
);
