import { CheckCircle2, User } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Controller, type Control } from "react-hook-form";
import {FormDateField,FormInput,FormSelectField,Input} from "@/src/features/enrollment/components/form";
import { PROGRAM_TYPES } from "@/src/features/enrollment/constants";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";
import type { EnrollmentFormValues } from "@/src/features/enrollment/hooks/useEnrollmentForm";

export function ChildInfoStepSection({
  control,
  onPickDateOfBirth,
  computedChildAge,
  onPickEnrollmentDate,
  assignedCenterPrimary,
  assignedCenterSecondary,
  computedBmi,
  computedNutritionalStatus,
}: {
  control: Control<any>;
  onPickDateOfBirth: () => void;
  computedChildAge: number;
  onPickEnrollmentDate: () => void;
  assignedCenterPrimary: string;
  assignedCenterSecondary: string;
  computedBmi: number | null;
  computedNutritionalStatus: string | null;
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

      {/* Weight & Height */}
      <View className="mb-4 flex-row gap-3">
        <FormInput
          control={control}
          name="weight"
          containerStyle={enrollFieldStyles.inputHalf}
          label="Weight (kg) *"
          placeholder="e.g. 15.5"
          keyboardType="decimal-pad"
        />
        <FormInput
          control={control}
          name="height"
          containerStyle={enrollFieldStyles.inputHalf}
          label="Height (cm) *"
          placeholder="e.g. 105"
          keyboardType="decimal-pad"
        />
      </View>

      <View className="mb-4 flex-row gap-3">
        <Input
          containerStyle={enrollFieldStyles.inputHalf}
          label="BMI"
          value={computedBmi !== null ? String(computedBmi) : ""}
          onChangeText={() => undefined}
          placeholder="Auto-computed"
          editable={false}
          computed
        />
        <Input
          containerStyle={enrollFieldStyles.inputHalf}
          label="Status"
          value={computedNutritionalStatus || ""}
          onChangeText={() => undefined}
          placeholder="Auto-classified"
          editable={false}
          computed
        />
      </View>

      <FormDateField
        control={control}
        name="enrollmentDate"
        label="Enrollment Date *"
        onPress={onPickEnrollmentDate}
      />

      <View style={enrollFieldStyles.inputContainer}>
        <View className="mb-2.5 flex-row flex-wrap items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-[#374151]">
              Assigned Center <Text className="text-[#EF4444]">*</Text>
            </Text>
          </View>
          <View className="rounded-full bg-teal-100 px-2 py-0.5">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Auto
            </Text>
          </View>
        </View>
        <Controller
          control={control}
          name="daycareCenterId"
          render={({ fieldState: { error } }) => (
            <>
              <View
                style={[
                  enrollFieldStyles.textInput,
                  enrollFieldStyles.textInputReadOnly,
                  enrollFieldStyles.assignedCenterContainer,
                  error && enrollFieldStyles.textInputError,
                ]}
              >
                <Text className="text-base font-semibold text-teal-900">
                  {assignedCenterPrimary}
                </Text>
                {assignedCenterSecondary ? (
                  <Text className="mt-0.5 text-sm text-teal-800">
                    {assignedCenterSecondary}
                  </Text>
                ) : null}
              </View>
              {error ? (
                <Text className="mt-1.5 mb-2 text-xs text-red-500">
                  {error.message}
                </Text>
              ) : null}
            </>
          )}
        />
      </View>
      <Text className="-mt-2 mb-5 text-sm leading-5 text-gray-500">
        This is based on your account center assignment.
      </Text>

      {/* Program Type */}
      <Controller
        control={control}
        name="programType"
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <View className="mb-4">
            <Text className="text-[13px] font-bold tracking-[0.6px] uppercase text-[#374151] mb-[10px]">
              Program Type <Text className="text-[#EF4444]">*</Text>
            </Text>
            <View className="gap-2">
              {PROGRAM_TYPES.map((option) => {
                const isSelected = value === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => onChange(option)}
                    style={[
                      enrollFieldStyles.programOptionCard,
                      isSelected
                        ? enrollFieldStyles.programOptionCardSelected
                        : error
                          ? enrollFieldStyles.programOptionCardError
                          : enrollFieldStyles.programOptionCardUnselected,
                    ]}
                  >
                    <View className="flex-row items-center">
                      <View
                        style={[
                          enrollFieldStyles.programOptionRadio,
                          isSelected
                            ? enrollFieldStyles.programOptionRadioSelected
                            : enrollFieldStyles.programOptionRadioUnselected,
                        ]}
                      >
                        {isSelected ? (
                          <View className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                        ) : null}
                      </View>
                      <Text
                        className="ml-3 flex-1"
                        style={[
                          enrollFieldStyles.programOptionText,
                          isSelected
                            ? enrollFieldStyles.programOptionTextSelected
                            : enrollFieldStyles.programOptionTextUnselected,
                        ]}
                      >
                        {option}
                      </Text>
                      {isSelected ? (
                        <CheckCircle2 size={18} color="#0D9488" />
                      ) : null}
                    </View>
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

      <Input
        label="School Year *"
        value={control._formValues?.schoolYear || ""}
        onChangeText={() => undefined}
        placeholder="2026-2027"
        editable={false}
        computed
        labelHint="Derived from enrollment date"
      />
    </View>
  );
}
