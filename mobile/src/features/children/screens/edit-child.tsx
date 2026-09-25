import { useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, UserRound, UsersRound } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import {
  editChildSchema,
  type EditChildFormValues,
} from "../validations/edit-child-validation";
import {
  FormInput,
  FormDateField,
} from "@/src/features/enrollment/components/form";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";
import {
  displayDate,
  formatYmd,
} from "@/src/features/enrollment/utils/enrollment-utils";
import { useDatePicker } from "@/src/features/enrollment/hooks/useDatePicker";
import { useEditChild } from "../hooks/useEditChild";
import { getChildById } from "@/src/api/parent.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import {
  GradientButton,
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
} from "@/src/components/ui";

export default function EditChildScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const childId = typeof id === "string" ? id : null;

  const {
    data: child,
    isLoading,
    error,
  } = useQuery({
    queryKey: mobileQueryKeys.teacherChildEdit(childId),
    enabled: Boolean(childId),
    queryFn: async () => {
      if (!childId) throw new Error("Missing child ID");
      return getChildById(childId);
    },
  });

  const { mutate: updateChild, isPending } = useEditChild(childId);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<EditChildFormValues>({
    resolver: zodResolver(editChildSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "male",
      homeAddress: "",
      parentRelationship: "Mother",
    },
  });

  const watchDateOfBirth = watch("dateOfBirth");
  const watchGender = watch("gender");
  const watchParentRelationship = watch("parentRelationship");

  useEffect(() => {
    if (child) {
      reset({
        firstName: child.firstName,
        middleName: child.middleName || "",
        lastName: child.lastName,
        dateOfBirth: child.dateOfBirth
          ? new Date(child.dateOfBirth).toISOString().slice(0, 10)
          : "",
        gender: (child.gender as "male" | "female") || "male",
        homeAddress: child.homeAddress || "",
        parentRelationship: (child.parentRelationship as any) || "Mother",
      });
    }
  }, [child, reset]);

  const today = new Date();
  const minDateOfBirth = new Date(
    today.getFullYear() - 6,
    today.getMonth(),
    today.getDate() + 1,
  );
  const maxDateOfBirth = new Date(
    today.getFullYear() - 3,
    today.getMonth(),
    today.getDate(),
  );

  const datePicker = useDatePicker(
    watchDateOfBirth,
    "",
    minDateOfBirth,
    maxDateOfBirth,
    (field, date) => {
      if (field === "dateOfBirth") {
        setValue("dateOfBirth", date, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
  );

  const onSubmit = (data: EditChildFormValues) => {
    updateChild(data, {
      onSuccess: () => {
        router.back();
      },
    });
  };

  if (isLoading) {
    return (
      <ScreenShell withKeyboardAvoiding={false} edges={[]}>
        <ScreenHeader
          title="Edit Child"
          subtitle="Update profile information"
          backgroundVariant="teacherGradient"
          onBack={() => router.back()}
        />
        <ScreenLoadingState title="Loading profile" message="Please wait..." />
      </ScreenShell>
    );
  }

  if (error || !child) {
    return (
      <ScreenShell withKeyboardAvoiding={false} edges={[]}>
        <ScreenHeader
          title="Edit Child"
          subtitle="Update profile information"
          backgroundVariant="teacherGradient"
          onBack={() => router.back()}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl font-bold text-gray-900 text-center mb-2">
            Failed to load child data.
          </Text>
          <Text className="text-gray-500 text-center">
            {error instanceof Error ? error.message : "Unknown error"}
          </Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell withKeyboardAvoiding={false} edges={[]}>
      <ScreenHeader
        title="Edit Child"
        subtitle="Update profile information"
        backgroundVariant="teacherGradient"
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-gray-50"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 120,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
                onPress={() => datePicker.openDatePicker("dateOfBirth")}
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
                  onPress={() =>
                    setValue("gender", "male", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className={`min-h-12 flex-1 items-center justify-center rounded-xl border-[1.5px] py-3 ${
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
                  onPress={() =>
                    setValue("gender", "female", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className={`min-h-12 flex-1 items-center justify-center rounded-xl border-[1.5px] py-3 ${
                    watchGender === "female"
                      ? "border-teal-600 bg-teal-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <Text
                    className={`font-semibold text-base ${
                      watchGender === "female"
                        ? "text-teal-700"
                        : "text-gray-600"
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

          <View className="mt-5 rounded-3xl border border-gray-200 bg-white p-5">
            <View className="mb-5 flex-row items-center">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-sky-50">
                <UsersRound size={21} color="#0284C7" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-black text-gray-900">
                  Parent Information
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  Primary relationship to the child
                </Text>
              </View>
            </View>

            <View className="mt-3">
              <Text className="mb-2 text-sm font-semibold text-gray-700">
                Parent Relationship *
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {["Mother", "Father", "Guardian", "Grandparent", "Other"].map(
                  (rel) => (
                    <Pressable
                      key={rel}
                      accessibilityRole="radio"
                      accessibilityLabel={rel}
                      accessibilityState={{
                        checked: watchParentRelationship === rel,
                      }}
                      onPress={() =>
                        setValue("parentRelationship", rel as any, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      className={`min-h-11 justify-center rounded-xl border px-4 py-2.5 ${
                        watchParentRelationship === rel
                          ? "border-teal-600 bg-teal-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Text
                        className={`font-semibold text-sm ${
                          watchParentRelationship === rel
                            ? "text-teal-700"
                            : "text-gray-600"
                        }`}
                      >
                        {rel}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>
            </View>
          </View>

          <View className="mt-5 flex-row items-start rounded-2xl bg-amber-50 p-4">
            <MapPin size={18} color="#B45309" />
            <Text className="ml-3 flex-1 text-xs leading-5 text-amber-800">
              Review each detail carefully before saving. Nutrition measurements
              and authorized guardians are managed in their dedicated sections.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Fixed */}
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-5 py-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <GradientButton
            label="Save Changes"
            loadingLabel="Saving Changes..."
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={!isDirty}
            className="rounded-2xl"
          />
        </View>

        {/* Date Picker Overlay */}
        {datePicker.pickerVisible && datePicker.pickerField ? (
          <Modal
            transparent
            animationType="slide"
            visible={datePicker.pickerVisible}
          >
            <View className="flex-1 justify-end bg-black/30">
              <View className="rounded-t-3xl bg-white px-4 pb-6 pt-4">
                <View className="mb-3 flex-row items-center justify-between">
                  <Pressable onPress={datePicker.closePicker}>
                    <Text className="text-lg font-semibold text-gray-600">
                      Cancel
                    </Text>
                  </Pressable>
                  <Text className="text-base font-semibold text-gray-700">
                    Select Date of Birth
                  </Text>
                  <Pressable onPress={datePicker.confirmPicker}>
                    <Text className="text-lg font-bold text-teal-600">
                      Done
                    </Text>
                  </Pressable>
                </View>

                {datePicker.pickerMode === "native" &&
                Platform.OS === "ios" &&
                datePicker.NativeDateTimePicker ? (
                  <datePicker.NativeDateTimePicker
                    value={datePicker.pickerDate}
                    mode="date"
                    display="spinner"
                    minimumDate={datePicker.minDateOfBirth}
                    maximumDate={datePicker.maxDateOfBirth}
                    onChange={(_: any, selectedDate?: Date) => {
                      if (selectedDate) datePicker.setPickerDate(selectedDate);
                    }}
                  />
                ) : (
                  <View>
                    <Text className="mb-2 text-sm font-semibold text-gray-500">
                      Enter date as YYYY-MM-DD
                    </Text>
                    <TextInput
                      value={datePicker.pickerInput}
                      onChangeText={(value) => {
                        datePicker.setPickerInput(
                          value.replace(/[^0-9-]/g, "").slice(0, 10),
                        );
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                    />
                    <Text className="mt-2 text-xs text-gray-500">
                      Allowed range:{" "}
                      {displayDate(formatYmd(datePicker.minDateOfBirth))} to{" "}
                      {displayDate(formatYmd(datePicker.maxDateOfBirth))}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}
