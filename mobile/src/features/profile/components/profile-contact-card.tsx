import { Text, View } from "react-native";
import { Contact, Mail, MapPin, Phone } from "lucide-react-native";

interface ProfileContactCardProps {
  email?: string;
  phone?: string;
  showAssignedCenter?: boolean;
  assignedCenterPrimary?: string;
  assignedCenterSecondary?: string;
}

export function ProfileContactCard({
  email,
  phone,
  showAssignedCenter = false,
  assignedCenterPrimary,
  assignedCenterSecondary,
}: ProfileContactCardProps) {
  return (
    <View className="mx-5 mb-5 mt-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <View className="mb-5 flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
          <Contact size={20} color="#0F766E" />
        </View>
        <View className="ml-3">
          <Text className="text-lg font-bold text-gray-900">
            Contact Information
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            How we can reach you
          </Text>
        </View>
      </View>

      <View>
        <View className="mb-6 flex-row items-center">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
            <Mail size={20} color="#0F766E" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="mb-1 text-sm font-semibold text-gray-500">
              Email
            </Text>
            <Text className="text-base font-medium text-gray-900">
              {email}
            </Text>
          </View>
        </View>

        <View
          className={`flex-row items-center ${showAssignedCenter ? "mb-6" : ""}`}
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
            <Phone size={20} color="#0F766E" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="mb-1 text-sm font-semibold text-gray-500">
              Phone Number
            </Text>
            <Text className="text-base font-medium text-gray-900">
              {phone || "Not provided"}
            </Text>
          </View>
        </View>

        {showAssignedCenter && assignedCenterPrimary ? (
          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-50">
              <MapPin size={20} color="#0F766E" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="mb-1 text-sm font-semibold text-gray-500">
                Assigned Center
              </Text>
              <Text className="text-base font-medium text-gray-900">
                {assignedCenterPrimary}
              </Text>
              {assignedCenterSecondary ? (
                <Text className="mt-0.5 text-sm text-gray-600">
                  {assignedCenterSecondary}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

