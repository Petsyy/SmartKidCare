import { TextInput, View } from "react-native";
import { Search } from "lucide-react-native";

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search...",
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <View className="mx-[16px] mt-[14px] mb-[16px] flex-row items-center rounded-[16px] border-[1.5px] border-[#E2E8F0] bg-[#F8FAFC] px-[16px] py-[13px]">
      <Search size={20} color="#0D9488" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        className="flex-1 ml-[10px] text-[16px] font-bold text-[#1E293B]"
      />
    </View>
  );
}
