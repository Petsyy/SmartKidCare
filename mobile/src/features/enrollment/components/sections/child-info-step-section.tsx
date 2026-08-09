import { CheckCircle2, User } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Controller, type Control } from "react-hook-form";
import { FormDateField, FormInput, Input } from "@/src/features/enrollment/components/form";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";

export function ChildInfoStepSection({
  control,
  onPickDateOfBirth,
  computedChildAge,
}: {
  control: Control<any>;
  onPickDateOfBirth: () => void;
  computedChildAge: number;
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
          <User size={20} color="#0D9488" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">
          Child Information
        </Text>
      </View>
      <Text className="mt-2 text-lg leading-7 text-gray-600">
        Enter the child&apos;s basic information exactly as shown on the birth
        certificate.
      </Text>

      <View className="mt-4 flex-row gap-3">
        <FormInput
          control={control}
          name="firstName"
          containerStyle={enrollFieldStyles.inputHalf}
          label="First Name *"
          placeholder="e.g. Juan"
        />
        <FormInput
          control={control}
          name="lastName"
          containerStyle={enrollFieldStyles.inputHalf}
          label="Last Name *"
          placeholder="e.g. Dela Cruz"
        />
      </View>

      <FormInput
        control={control}
        name="middleName"
        label="Middle Name *"
        placeholder="e.g. Santos"
      />

      <FormDateField
        control={control}
        name="dateOfBirth"
        label="Date of Birth *"
        onPress={onPickDateOfBirth}
      />

      <FormInput
        control={control}
        name="homeAddress"
        label="Complete Home Address *"
        placeholder="House no., street, barangay, city"
        autoCapitalize="words"
      />

      <Input
        label="Age *"
        value={computedChildAge > 0 ? String(computedChildAge) : ""}
        onChangeText={() => undefined}
        placeholder="Set date of birth first"
        editable={false}
        computed
        labelHint="Updates when date of birth is set"
      />

      {/* Gender */}
      <Controller
        control={control}
        name="gender"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View className="mb-4">
            <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-[#374151] mb-[10px]">
              Gender <Text className="text-[#EF4444]">*</Text>
            </Text>
            <View className="flex-row gap-3">
              {(["male", "female"] as const).map((g) => {
                const isSelected = value === g;
                return (
                  <Pressable
                    key={g}
                    onPress={() => onChange(g)}
                    className="flex-1 flex-row items-center rounded-2xl border-2 px-4 py-3"
                    style={{
                      borderColor: isSelected
                        ? "#0D9488"
                        : error
                          ? "#EF4444"
                          : "#E5E7EB",
                      backgroundColor: isSelected
                        ? "#F0FDFA"
                        : error
                          ? "#FEF2F2"
                          : "#FFFFFF",
                    }}
                  >
                    <View
                      className="h-5 w-5 items-center justify-center rounded-full border-2"
                      style={{
                        borderColor: isSelected ? "#0D9488" : "#D1D5DB",
                      }}
                    >
                      {isSelected ? (
                        <View className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                      ) : null}
                    </View>
                    <Text
                      className="ml-2.5 flex-1 font-semibold capitalize"
                      style={{
                        color: isSelected ? "#0F766E" : "#374151",
                        fontSize: 15,
                      }}
                    >
                      {g}
                    </Text>
                    {isSelected ? (
                      <CheckCircle2 size={18} color="#0D9488" />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {error ? (
              <Text className="mt-1.5 text-xs text-red-500">
                {error.message}
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}
