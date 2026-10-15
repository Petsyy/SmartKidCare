import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Controller } from "react-hook-form";
import { useLocalSearchParams } from "expo-router";
import { useNavigation, usePreventRemove } from "expo-router/react-navigation";
import { IdCard } from "lucide-react-native";
import { GradientButton, ScreenHeader, ScreenShell } from "@/src/components/ui";
import { GovernmentIdUploadVerificationField } from "@/src/features/documents/components";
import { useGuardianForm } from "../hooks/use-guardian-form";
import { useSafeBack } from "@/src/hooks/use-safe-back";

const relationships = [
  "Mother",
  "Father",
  "Guardian",
  "Grandparent",
  "Other",
] as const;

export default function GuardianFormScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{
    childId?: string | string[];
    guardianIndex?: string | string[];
  }>();
  const childId = typeof params.childId === "string" ? params.childId : null;
  const indexValue =
    typeof params.guardianIndex === "string" ? params.guardianIndex : null;
  const parsedIndex = indexValue === null ? null : Number(indexValue);
  const guardianIndex =
    parsedIndex === null || (Number.isInteger(parsedIndex) && parsedIndex >= 0)
      ? parsedIndex
      : undefined;
  const invalidParams = !childId || guardianIndex === undefined;
  const handleBack = useSafeBack(
    childId
      ? { pathname: "/(teacher)/child-details/[id]", params: { id: childId } }
      : "/(teacher)/children",
  );

  const handleSaved = useCallback(() => {
    Alert.alert(
      guardianIndex === null ? "Guardian Added" : "Guardian Updated",
      "The guardian information was saved successfully.",
      [{ text: "Done", onPress: handleBack }],
    );
  }, [guardianIndex, handleBack]);

  const guardianForm = useGuardianForm(
    invalidParams ? null : childId,
    guardianIndex === undefined ? null : guardianIndex,
    handleSaved,
  );

  usePreventRemove(guardianForm.hasUnsavedChanges, ({ data }) => {
    Alert.alert(
      "Discard Changes?",
      "Your unsaved guardian information will be lost.",
      [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.dispatch(data.action),
        },
      ],
    );
  });

  if (invalidParams) {
    return (
      <ScreenShell edges={[]} withKeyboardAvoiding={false}>
        <ScreenHeader
          title="Guardian"
          subtitle="Unable to open this form"
          backgroundVariant="teacherGradient"
          onBack={handleBack}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-lg font-bold text-gray-900">
            Invalid guardian link
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Return to the child record and open the guardian form again.
          </Text>
        </View>
      </ScreenShell>
    );
  }

  const {
    form,
    firstName,
    lastName,
    relationship,
    guardianIdFile,
    guardianVerification,
    selectedGuardian,
    isEditMode,
    childName,
    childQuery,
    guardiansState,
    requiresVerification,
    saveDisabled,
  } = guardianForm;

  if (childQuery.isLoading || guardiansState.isLoading) {
    return (
      <ScreenShell edges={[]} withKeyboardAvoiding={false}>
        <ScreenHeader
          title={isEditMode ? "Edit Guardian" : "Add Guardian"}
          subtitle="Loading child information"
          backgroundVariant="teacherGradient"
          onBack={handleBack}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0D9488" />
        </View>
      </ScreenShell>
    );
  }

  if (
    childQuery.error ||
    guardiansState.error ||
    (isEditMode && !selectedGuardian)
  ) {
    return (
      <ScreenShell edges={[]} withKeyboardAvoiding={false}>
        <ScreenHeader
          title={isEditMode ? "Edit Guardian" : "Add Guardian"}
          subtitle="Guardian form unavailable"
          backgroundVariant="teacherGradient"
          onBack={handleBack}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-lg font-bold text-gray-900">
            We could not load this guardian.
          </Text>
          <Pressable
            onPress={() => {
              void childQuery.refetch();
              void guardiansState.refetch();
            }}
            className="mt-5 rounded-xl bg-teal-700 px-6 py-3"
          >
            <Text className="font-bold text-white">Try Again</Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }

  const fieldClass =
    "min-h-14 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900";
  const renderError = (message?: string) =>
    message ? (
      <Text className="mt-1 text-sm text-red-600">{message}</Text>
    ) : null;

  return (
    <ScreenShell edges={["bottom"]}>
      <ScreenHeader
        title={isEditMode ? "Edit Guardian" : "Add Guardian"}
        subtitle={childName || "Child guardian information"}
        backgroundVariant="teacherGradient"
        onBack={handleBack}
      />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
      >
        <View className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <Text className="mb-5 text-xl font-black text-gray-900">
            Guardian Information
          </Text>

          <Text className="mb-2 text-[15px] font-bold leading-[22px] text-gray-700">
            FIRST NAME <Text className="text-red-500">*</Text>
          </Text>
          <Controller
            control={form.control}
            name="firstName"
            render={({ field, fieldState }) => (
              <View className="mb-4">
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Jane"
                  placeholderTextColor="#9CA3AF"
                  className={fieldClass}
                  autoCapitalize="words"
                  autoComplete="given-name"
                  returnKeyType="next"
                  accessibilityLabel="Guardian first name"
                />
                {renderError(fieldState.error?.message)}
              </View>
            )}
          />

          <Text className="mb-2 text-[15px] font-bold leading-[22px] text-gray-700">
            MIDDLE NAME{" "}
            <Text className="font-normal text-gray-400">(OPTIONAL)</Text>
          </Text>
          <Controller
            control={form.control}
            name="middleName"
            render={({ field, fieldState }) => (
              <View className="mb-4">
                <TextInput
                  value={field.value || ""}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Santos"
                  placeholderTextColor="#9CA3AF"
                  className={fieldClass}
                  autoCapitalize="words"
                  autoComplete="additional-name"
                  returnKeyType="next"
                  accessibilityLabel="Guardian middle name, optional"
                />
                {renderError(fieldState.error?.message)}
              </View>
            )}
          />

          <Text className="mb-2 text-[15px] font-bold leading-[22px] text-gray-700">
            LAST NAME <Text className="text-red-500">*</Text>
          </Text>
          <Controller
            control={form.control}
            name="lastName"
            render={({ field, fieldState }) => (
              <View className="mb-4">
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                  className={fieldClass}
                  autoCapitalize="words"
                  autoComplete="family-name"
                  returnKeyType="next"
                  accessibilityLabel="Guardian last name"
                />
                {renderError(fieldState.error?.message)}
              </View>
            )}
          />

          <Text className="mb-3 text-[15px] font-bold leading-[22px] text-gray-700">
            Relationship to Child <Text className="text-red-500">*</Text>
          </Text>
          <View className="mb-5 flex-row flex-wrap gap-2">
            {relationships.map((value) => (
              <Pressable
                key={value}
                onPress={() =>
                  form.setValue("relationship", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                accessibilityRole="radio"
                accessibilityLabel={`${value} relationship`}
                accessibilityState={{ selected: relationship === value }}
                className={`min-h-11 rounded-xl border px-4 py-3 ${relationship === value ? "border-teal-600 bg-teal-600" : "border-gray-200 bg-gray-50"}`}
              >
                <Text
                  className={`font-bold ${relationship === value ? "text-white" : "text-gray-700"}`}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>

          {relationship === "Other" ? (
            <Controller
              control={form.control}
              name="customRelationship"
              render={({ field, fieldState }) => (
                <View className="mb-4">
                  <Text className="mb-2 text-[15px] font-bold leading-[22px] text-gray-700">
                    Specify Relationship <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    value={field.value || ""}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="e.g. Uncle or family friend"
                    placeholderTextColor="#9CA3AF"
                    className={fieldClass}
                    returnKeyType="next"
                    accessibilityLabel="Custom guardian relationship"
                  />
                  {renderError(fieldState.error?.message)}
                </View>
              )}
            />
          ) : null}

          <Text className="mb-2 text-[15px] font-bold leading-[22px] text-gray-700">
            Contact Phone Number <Text className="text-red-500">*</Text>
          </Text>
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <View className="mb-6">
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="09123456789"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  returnKeyType="done"
                  maxLength={11}
                  className={fieldClass}
                  accessibilityLabel="Guardian contact phone number"
                />
                {renderError(fieldState.error?.message)}
              </View>
            )}
          />

          {isEditMode &&
          selectedGuardian?.idUrl &&
          !guardianIdFile &&
          !requiresVerification ? (
            <View className="mb-4 flex-row rounded-xl bg-teal-50 p-3">
              <IdCard size={20} color="#0F766E" />
              <Text className="ml-3 flex-1 text-sm leading-5 text-teal-900">
                The existing verified ID will remain on file. Upload a
                replacement only when needed.
              </Text>
            </View>
          ) : null}

          {isEditMode && requiresVerification && !guardianIdFile ? (
            <View className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <Text className="text-sm leading-5 text-amber-900">
                The guardian&apos;s name changed. Upload the ID again so it can
                be verified against the updated name.
              </Text>
            </View>
          ) : null}

          <GovernmentIdUploadVerificationField
            holder="guardian"
            label={
              isEditMode && selectedGuardian?.idUrl && !requiresVerification
                ? "Replace Guardian Government-Issued Photo ID (Optional)"
                : "Guardian Government-Issued Photo ID *"
            }
            file={guardianIdFile}
            verification={guardianVerification}
            expectedFirstName={firstName}
            expectedLastName={lastName}
            onPick={guardianForm.pickGuardianId}
            onClear={guardianForm.clearGuardianId}
            onRetry={guardianForm.verifyGuardianId}
            onConfirm={guardianForm.confirmGuardianId}
            allowManualConfirmationOnServiceError
          />
        </View>
      </ScrollView>

      <View className="flex-row gap-3 border-t border-gray-200 bg-white px-5 py-4">
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Cancel guardian form"
          className="flex-1 items-center justify-center rounded-xl border border-gray-300 py-4"
        >
          <Text className="text-lg font-bold text-gray-700">Cancel</Text>
        </Pressable>
        <GradientButton
          label="Save Guardian"
          loading={guardiansState.isMutating}
          loadingLabel="Saving..."
          disabled={saveDisabled}
          onPress={() => void guardianForm.save()}
          className="flex-1"
        />
      </View>
    </ScreenShell>
  );
}
