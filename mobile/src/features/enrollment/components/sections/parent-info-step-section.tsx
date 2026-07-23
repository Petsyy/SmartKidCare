import { Users } from "lucide-react-native";
import { Text, View } from "react-native";
import { Controller, type Control } from "react-hook-form";
import { Input } from "@/src/features/enrollment/components/form";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";

export function ParentInfoStepSection({
  control,
}: {
  control: Control<any>;
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
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
          <Users size={20} color="#0D9488" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">
          Parent Information
        </Text>
      </View>
      <Text className="mt-2 text-lg leading-7 text-gray-600">
        Enter the details of the primary contact or guardian.
      </Text>

      <View className="mt-4 flex-row gap-3">
        <Controller
          control={control}
          name="parentFirstName"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              containerStyle={enrollFieldStyles.inputHalf}
              label="First Name *"
              placeholder="e.g. Maria"
              value={value}
              onChangeText={onChange}
              error={error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="parentLastName"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <Input
              containerStyle={enrollFieldStyles.inputHalf}
              label="Last Name *"
              placeholder="e.g. Dela Cruz"
              value={value}
              onChangeText={onChange}
              error={error?.message}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="parentMiddleName"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            label="Middle Name *"
            placeholder="e.g. Santos"
            value={value}
            onChangeText={onChange}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="parentEmail"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            label="Email Address *"
            placeholder="maria@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
            error={error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="parentPhone"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Input
            label="Phone Number *"
            placeholder="0912 345 6789"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            error={error?.message}
          />
        )}
      />
    </View>
  );
}
