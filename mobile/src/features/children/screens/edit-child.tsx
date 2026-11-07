import {
  Platform,
  ScrollView,
  Text,
  View,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import {
  GradientButton,
  ScreenHeader,
  ScreenLoadingState,
  ScreenShell,
} from "@/src/components/ui";
import { useSafeBack } from "@/src/hooks/use-safe-back";
import { useEditChildForm } from "../hooks";
import {
  EditChildPersonalSection,
  EditChildParentSection,
  EditChildDatePickerModal,
  EditChildOfflineState,
} from "../components/edit";

export default function EditChildScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const childId = typeof id === "string" ? id : null;
  const handleBack = useSafeBack(
    childId
      ? { pathname: "/(teacher)/child-details/[id]", params: { id: childId } }
      : "/(teacher)/children",
  );

  const {
    isOffline,
    child,
    isLoading,
    error,
    control,
    handleSubmit,
    watchGender,
    watchParentRelationship,
    setValue,
    isDirty,
    isPending,
    datePicker,
    onSubmit,
  } = useEditChildForm({
    childId,
    onSuccess: handleBack,
  });

  if (isOffline) {
    return <EditChildOfflineState onBack={handleBack} />;
  }

  if (isLoading) {
    return (
      <ScreenShell withKeyboardAvoiding={false} edges={[]}>
        <ScreenHeader
          title="Edit Child"
          subtitle="Update profile information"
          backgroundVariant="teacherGradient"
          onBack={handleBack}
        />
        <ScreenLoadingState
          variant="form"
          title="Loading profile"
          message="Please wait..."
        />
      </ScreenShell>
    );
  }

  if (!child) {
    return (
      <ScreenShell withKeyboardAvoiding={false} edges={[]}>
        <ScreenHeader
          title="Edit Child"
          subtitle="Update profile information"
          backgroundVariant="teacherGradient"
          onBack={handleBack}
        />
        <View className="flex-1 items-center justify-center p-6">
          <Text className="mb-2 text-center text-xl font-bold text-gray-900">
            Failed to load child data.
          </Text>
          <Text className="text-center text-gray-500">
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
        onBack={handleBack}
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
          {/* Personal Information Card */}
          <EditChildPersonalSection
            control={control}
            watchGender={watchGender}
            onSelectGender={(gender) =>
              setValue("gender", gender, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onOpenDatePicker={() => datePicker.openDatePicker("dateOfBirth")}
          />

          {/* Parent Information Card */}
          <EditChildParentSection
            watchParentRelationship={watchParentRelationship}
            onSelectRelationship={(rel) =>
              setValue("parentRelationship", rel, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />

          {/* Information Advisory */}
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
        <EditChildDatePickerModal datePicker={datePicker} />
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}
