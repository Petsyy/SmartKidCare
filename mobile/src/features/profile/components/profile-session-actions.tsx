import { Text, TouchableOpacity, View } from "react-native";
import { LockKeyhole, LogOut } from "lucide-react-native";

interface ProfileSessionActionsProps {
  onLockApp: () => void;
  onLogout: () => void;
}

export function ProfileSessionActions({
  onLockApp,
  onLogout,
}: ProfileSessionActionsProps) {
  return (
    <View className="mx-5">
      <TouchableOpacity
        onPress={onLockApp}
        accessibilityRole="button"
        accessibilityLabel="Lock SmartKidCare"
        accessibilityHint="Keeps encrypted local data and requires device verification to reopen the app"
        className="mb-3 flex-row items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 py-4"
      >
        <LockKeyhole size={20} color="#0F766E" />
        <Text className="ml-2 text-base font-semibold text-teal-700">
          Lock App
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        className="flex-row items-center justify-center rounded-2xl border border-red-200 bg-red-50 py-4"
      >
        <LogOut size={20} color="#DC2626" />
        <Text className="ml-2 text-base font-semibold text-red-600">
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

