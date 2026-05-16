import { Users } from "lucide-react-native";
import { Text, View } from "react-native";
import { Input } from "@/src/features/enrollment/components/form";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";


export function ParentInfoStepSection({
  parentFirstName,
  setParentFirstName,
  parentMiddleName,
  setParentMiddleName,
  parentLastName,
  setParentLastName,
  parentEmail,
  setParentEmail,
  parentPhone,
  setParentPhone,
}: {
  parentFirstName: string;
  setParentFirstName: (value: string) => void;
  parentMiddleName: string;
  setParentMiddleName: (value: string) => void;
  parentLastName: string;
  setParentLastName: (value: string) => void;
  parentEmail: string;
  setParentEmail: (value: string) => void;
  parentPhone: string;
  setParentPhone: (value: string) => void;
}) {
  return (
    <View
      className="rounded-3xl border border-gray-200 bg-white p-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="mb-2 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-sky-50">
          <Users size={20} color="#0284C7" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">
          Parent Information
        </Text>
      </View>
      <Text className="mt-2 text-lg leading-7 text-gray-600">
        Provide the parent or guardian details needed for account creation and
        follow-up updates.
      </Text>

      <View className="mt-4 flex-row gap-3">
        <Input
          containerStyle={enrollFieldStyles.inputHalf}
          label="First Name *"
          placeholder="e.g. Maria"
          value={parentFirstName}
          onChangeText={setParentFirstName}
        />
        <Input
          containerStyle={enrollFieldStyles.inputHalf}
          label="Last Name *"
          placeholder="e.g. Dela Cruz"
          value={parentLastName}
          onChangeText={setParentLastName}
        />
      </View>

      <Input
        label="Middle Name *"
        placeholder="e.g. Reyes"
        value={parentMiddleName}
        onChangeText={setParentMiddleName}
      />
      <Input
        label="Email Address *"
        placeholder="e.g. parent@email.com"
        value={parentEmail}
        onChangeText={setParentEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input
        label="Phone Number *"
        placeholder="e.g. 09171234567"
        value={parentPhone}
        onChangeText={setParentPhone}
        keyboardType="phone-pad"
      />
    </View>
  );
}

