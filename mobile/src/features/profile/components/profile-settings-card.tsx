import { Text, TouchableOpacity, View } from "react-native";
import { ChevronRight, CircleHelp, LockKeyhole, ShieldCheck } from "lucide-react-native";

interface ProfileSettingsCardProps {
  isOffline: boolean;
  onChangePassword: () => void;
  onOpenHelp: () => void;
}

export function ProfileSettingsCard({
  isOffline,
  onChangePassword,
  onOpenHelp,
}: ProfileSettingsCardProps) {
  return (
    <View className="mx-5 mb-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <View className="mb-4 flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
          <ShieldCheck size={20} color="#047857" />
        </View>
        <View className="ml-3">
          <Text className="text-lg font-bold text-gray-900">
            Account & Settings
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            Security and support
          </Text>
        </View>
      </View>

      <View>
        <TouchableOpacity
          onPress={() => {
            if (isOffline) return;
            onChangePassword();
          }}
          disabled={isOffline}
          accessibilityRole="button"
          accessibilityLabel="Change password"
          className="flex-row items-center justify-between border-b border-gray-100 py-4"
        >
          <View className="flex-1 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
              <LockKeyhole size={19} color="#0F766E" />
            </View>
            <View className="ml-3">
              <Text className="text-base font-semibold text-gray-800">
                Change Password
              </Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                {isOffline
                  ? "Connect to the internet to change your password"
                  : "Keep your account secure"}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenHelp}
          accessibilityRole="button"
          accessibilityLabel="Open help and user guide"
          className="flex-row items-center justify-between py-4"
        >
          <View className="flex-1 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
              <CircleHelp size={19} color="#0F766E" />
            </View>
            <View className="ml-3">
              <Text className="text-base font-semibold text-gray-800">
                Help & User Guide
              </Text>
              <Text className="mt-0.5 text-xs text-gray-500">
                Find answers and walkthroughs
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

