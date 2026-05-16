import { Pressable, Text, View } from "react-native";


export function EnrollmentTabSwitcher({
  activeTab,
  onChange,
}: {
  activeTab: "new" | "submitted";
  onChange: (tab: "new" | "submitted") => void;
}) {
  return (
    <View className="bg-gray-50 px-5 pb-2 pt-4">
      <View
        className="flex-row gap-2 rounded-2xl bg-white p-1.5"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Pressable
          onPress={() => onChange("new")}
          className="flex-1 rounded-xl px-3 py-3"
          style={{
            backgroundColor: activeTab === "new" ? "#0D9488" : "transparent",
          }}
        >
          <Text
            className="text-center text-base font-semibold"
            style={{ color: activeTab === "new" ? "#FFFFFF" : "#374151" }}
          >
            New Request
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange("submitted")}
          className="flex-1 rounded-xl px-3 py-3"
          style={{
            backgroundColor:
              activeTab === "submitted" ? "#0D9488" : "transparent",
          }}
        >
          <Text
            className="text-center text-base font-semibold"
            style={{
              color: activeTab === "submitted" ? "#FFFFFF" : "#374151",
            }}
          >
            Submitted
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

