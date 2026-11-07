import { Pressable, Text, View } from "react-native";
import type { Control } from "react-hook-form";
import { UserRound } from "lucide-react-native";
import type { EditChildFormValues } from "../../validations/edit-child-validation";
import {
  FormInput,
  FormDateField,
} from "@/src/features/enrollment/components/form";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";

interface EditChildPersonalSectionProps {
  control: Control<EditChildFormValues>;
  watchGender: "male" | "female";
  onSelectGender: (gender: "male" | "female") => void;
  onOpenDatePicker: () => void;
}

export function EditChildPersonalSection({
  control,
  watchGender,
  onSelectGender,
  onOpenDatePicker,
}: EditChildPersonalSectionProps) {
  return (
    <View className="rounded-3xl border border-gray-200 bg-white p-5">
      <View className="mb-5 flex-row items-center">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-teal-50">
          <UserRound size={21} color="#0D9488" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-black text-gray-900">
            Personal Information
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">
            Identity and basic details
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        <FormInput
          control={control as any}
          name="firstName"
          containerStyle={enrollFieldStyles.inputHalf}
          label="First Name *"
          placeholder="e.g. Juan"
          maxLength={30}
        />
        <FormInput
          control={control as any}
          name="lastName"
          containerStyle={enrollFieldStyles.inputHalf}
          label="Last Name *"
          placeholder="e.g. Dela Cruz"
          maxLength={30}
        />
      </View>
      <View className="mt-3">
        <FormInput
          control={control as any}
          name="middleName"
          label="Middle Name"
          placeholder="e.g. Santos (Optional)"
          maxLength={30}
        />
      </View>
      <View className="mt-3">
        <FormDateField
          control={control as any}
          name="dateOfBirth"
          label="Date of Birth *"
          onPress={onOpenDatePicker}
        />
      </View>

      <View className="mt-3">
        <Text className="mb-2 text-sm font-semibold text-gray-700">
          Gender *
        </Text>
        <View className="flex-row gap-3">
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Male"
            accessibilityState={{ checked: watchGender === "male" }}
            onPress={() => onSelectGender("male")}
            className={`min-h-12 flex-1 items-center justify-center rounded-xl border-[1.5px] py-3 active:opacity-90 ${
              watchGender === "male"
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <Text
              className={`font-semibold text-base ${
                watchGender === "male" ? "text-teal-700" : "text-gray-600"
              }`}
            >
              Male
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="radio"
            accessibilityLabel="Female"
            accessibilityState={{ checked: watchGender === "female" }}
            onPress={() => onSelectGender("female")}
            className={`min-h-12 flex-1 items-center justify-center rounded-xl border-[1.5px] py-3 active:opacity-90 ${
              watchGender === "female"
                ? "border-teal-600 bg-teal-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <Text
              className={`font-semibold text-base ${
                watchGender === "female" ? "text-teal-700" : "text-gray-600"
              }`}
            >
              Female
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4">
        <FormInput
          control={control as any}
          name="homeAddress"
          label="Complete Home Address *"
          placeholder="House No., Street, Barangay, City"
          maxLength={200}
        />
      </View>
    </View>
  );
}

