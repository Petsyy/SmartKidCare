import { Text, View, TouchableOpacity } from "react-native";
import { User, ChevronRight } from "lucide-react-native";

type Props = {
  name: string;
  age: number;
  gender: string;
  onPress?: () => void;
};

export default function ChildCard({ name, age, gender, onPress }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      className="
        w-full bg-white rounded-3xl
        px-5 py-4
        border border-gray-100
        shadow-md
        flex-row items-center justify-between
      "
    >
      <View className="flex-row items-center flex-1">
        {/* Avatar */}
        <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center mr-4">
          <User size={22} color="#10B981" />
        </View>

        {/* Text */}
        <View className="flex-1">
          <Text
            className="text-lg font-semibold text-gray-900"
            numberOfLines={1}
          >
            {name}
          </Text>

          <View className="flex-row items-center mt-1">
            <Text className="text-base text-gray-500">
              {age} years old
            </Text>
            <Text className="text-base text-gray-400 mx-2">•</Text>
            <Text className="text-base text-gray-500">
              {gender.toLowerCase()}
            </Text>
          </View>
        </View>
      </View>

      <ChevronRight size={24} color="#9CA3AF" />
    </TouchableOpacity>
  );
}
