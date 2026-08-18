import { Users } from "lucide-react-native";
import { Text, View } from "react-native";
import { type Control } from "react-hook-form";
import { FormInput, FormSelectField } from "@/src/features/enrollment/components/form";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";

export function ParentInfoStepSection({ control }: { control: Control<any> }) {
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
        <FormInput
          control={control}
          name="parentFirstName"
          containerStyle={enrollFieldStyles.inputHalf}
          label="First Name *"
          placeholder="e.g. Maria"
        />
        <FormInput
          control={control}
          name="parentLastName"
          containerStyle={enrollFieldStyles.inputHalf}
          label="Last Name *"
          placeholder="e.g. Dela Cruz"
        />
      </View>

      <FormInput
        control={control}
        name="parentMiddleName"
        label="Middle Name *"
        placeholder="e.g. Santos"
      />

      <FormInput
        control={control}
        name="parentPhone"
        label="Phone Number *"
        placeholder="0912 345 6789"
        keyboardType="phone-pad"
      />

      <Text className="mb-4 text-sm leading-5 text-teal-700">
        A unique SmartKidCare login email will be generated automatically from
        the parent&apos;s first and last name.
      </Text>

      <FormSelectField
        control={control}
        name="parentRelationship"
        label="Relationship to Child *"
        options={[
          { label: "Mother", value: "Mother" },
          { label: "Father", value: "Father" },
          { label: "Guardian", value: "Guardian" },
          { label: "Grandparent", value: "Grandparent" },
          { label: "Other", value: "Other" },
        ]}
      />
    </View>
  );
}
