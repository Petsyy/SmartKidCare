import { Pressable, Text, View } from "react-native";

export type FilterOption<T extends string> = {
  key: T;
  label: string;
  count: number;
  activeColor: string;
  activeBg: string;
  inactiveBg: string;
  inactiveBorder: string;
  inactiveText: string;
};

export function FilterChips<T extends string>({
  options,
  activeFilter,
  onSelectFilter,
}: {
  options: FilterOption<T>[];
  activeFilter: T;
  onSelectFilter: (filter: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-[10px] px-[16px] pt-[14px] pb-[4px]">
      {options.map((item) => {
        const active = activeFilter === item.key;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSelectFilter(item.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              borderRadius: 100,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderWidth: 1.5,
              borderColor: active ? item.activeBg : item.inactiveBorder,
              backgroundColor: active ? item.activeBg : item.inactiveBg,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "900",
                color: active ? "#FFFFFF" : item.inactiveText,
              }}
            >
              {item.label}
            </Text>
            <View
              style={{
                borderRadius: 100,
                paddingHorizontal: 7,
                paddingVertical: 2,
                backgroundColor: active
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(0,0,0,0.08)",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "900",
                  color: active ? "#FFFFFF" : item.inactiveText,
                }}
              >
                {item.count}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
