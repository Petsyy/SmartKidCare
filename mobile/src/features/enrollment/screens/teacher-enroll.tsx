import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  ChildInfoStepSection,
  DocumentsStepSection,
  EnrollmentStartState,
  EnrollmentTabSwitcher,
  ParentInfoStepSection,
  ReviewSubmitStepSection,
  SubmittedRequestsPanel,
} from "@/src/features/enrollment/components/sections";
import { StepProgress } from "@/src/features/enrollment/components/ui";
import { displayDate, formatYmd } from "@/src/features/enrollment/utils";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";
import {
  useEnrollmentForm,
  useEnrollmentCenters,
  useSubmittedRequests,
  useDatePicker,
  useDocumentPicker,
  useEnrollmentSubmit,
} from "@/src/features/enrollment/hooks";
import type { Step } from "@/src/features/enrollment/types";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";
import { ChevronLeft } from "lucide-react-native";
import { useNavigation } from "expo-router";

export default function EnrollChildScreen() {

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const contentMaxWidth = isWide ? 860 : undefined;
  const contentPadding = isWide ? 28 : 16;

  const form = useEnrollmentForm();
  const centers = useEnrollmentCenters();
  const submitted = useSubmittedRequests();
  const datePicker = useDatePicker(
    form.dateOfBirth,
    form.enrollmentDate,
    form.minDateOfBirth,
    form.maxDateOfBirth,
    handleDateChange,
  );
  const { pickDocument } = useDocumentPicker();
  const {
    isSubmitting,
    submitEnrollment,
    viewParentPassword,
    resetParentPassword,
  } = useEnrollmentSubmit(handleSubmitSuccess);

  const [activeTab, setActiveTab] = useState<"new" | "submitted">("new");
  const [hasStarted, setHasStarted] = useState(false);
  const [step, setStep] = useState<Step>(1);

  function handleDateChange(
    field: "dateOfBirth" | "enrollmentDate",
    date: string,
  ) {
    if (field === "dateOfBirth") {
      form.setDateOfBirth(date);
    } else {
      form.setEnrollmentDate(date);
    }
  }

  useEffect(() => {
    if (activeTab === "submitted") {
      void submitted.refreshSubmitted();
    }
  }, [activeTab, submitted.refreshSubmitted]);

  useEffect(() => {
    if (form.enrollmentDate) {
      const year = parseInt(form.enrollmentDate.split("-")[0], 10);
      const month = parseInt(form.enrollmentDate.split("-")[1], 10);
      const schoolYear =
        month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      form.setSchoolYear(schoolYear);
    }
  }, [form.enrollmentDate]);

  useEffect(() => {
    (navigation as any).setParams({ hideTabBar: hasStarted });
  }, [hasStarted, navigation]);

  useEffect(() => {
    if (centers.enrollmentCenters.length > 0 && !form.daycareCenterId) {
      const defaultId = centers.getDefaultCenterId("");
      form.setDaycareCenterId(defaultId);
    }
  }, [centers.enrollmentCenters, form.daycareCenterId]);

  const nextStep = () => {
    if (step === 1 && !form.validateStepOne()) return;
    if (step === 2 && !form.validateStepTwo()) return;
    if (step === 3 && !form.validateStepThree()) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  };

  const previousStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const resetForm = () => {
    form.resetForm();
    setHasStarted(false);
    setStep(1);
  };

  const handlePickBirthCertificate = async () => {
    const file = await pickDocument("birthCertificate", "file");
    if (file) form.setBirthCertificateFile(file);
  };

  const handlePickParentId = async () => {
    const file = await pickDocument("parentId", "file");
    if (file) form.setParentIdFile(file);
  };

  const handleSubmitEnrollment = async () => {
    if (
      !form.validateStepOne() ||
      !form.validateStepTwo() ||
      !form.validateStepThree()
    )
      return;

    const submissionData = form.getSubmissionData();
    await submitEnrollment(submissionData, form.parentEmail, form.parentPhone);
  };

  function handleSubmitSuccess() {
    resetForm();
    setActiveTab("submitted");
    void submitted.refreshSubmitted();
  }

  const assignedCenterSource = useMemo(() => {
    const selectedCenter = centers.enrollmentCenters.find(
      (center) => center._id === form.daycareCenterId,
    );
    return selectedCenter || centers.assignedTeacherCenter;
  }, [
    centers.enrollmentCenters,
    form.daycareCenterId,
    centers.assignedTeacherCenter,
  ]);

  const assignedCenterDisplayInfo = useMemo(
    () => getDaycareCenterDisplay(assignedCenterSource),
    [assignedCenterSource],
  );

  const assignedCenterReviewValue = useMemo(() => {
    const { primary, secondary } = assignedCenterDisplayInfo;
    return secondary ? `${primary} (${secondary})` : primary;
  }, [assignedCenterDisplayInfo]);

  const assignedCenterPrimary = centers.loadingCenters
    ? "Loading assigned center..."
    : assignedCenterDisplayInfo.primary;
  const assignedCenterSecondary = centers.loadingCenters
    ? ""
    : assignedCenterDisplayInfo.secondary;

  const primaryLabel =
    step < 4 ? "Next" : isSubmitting ? "Submitting..." : "Submit Request";

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-5"
        >
          <View className="flex-row items-center">
            {hasStarted && (
              <Pressable
                onPress={() => (step > 1 ? previousStep() : resetForm())}
                className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
              >
                <ChevronLeft size={24} color="white" />
              </Pressable>
            )}
            <View className="flex-1">
              <Text className="text-3xl font-extrabold text-white">
                Child Enrollment
              </Text>
              <Text className="mt-1 text-lg text-teal-100">
                Submit and track enrollment requests
              </Text>
            </View>
          </View>
        </View>

        {!hasStarted ? (
          <EnrollmentTabSwitcher
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        ) : null}

        {activeTab === "new" ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: contentPadding,
              paddingTop: 16,
              paddingBottom: 36,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              className="w-full self-center"
              style={{ maxWidth: contentMaxWidth }}
            >
              {!hasStarted ? (
                <EnrollmentStartState
                  onStart={() => {
                    setHasStarted(true);
                    setStep(1);
                  }}
                />
              ) : (
                <>
                  <View
                    className="mb-2 rounded-2xl border border-gray-200 bg-white px-3 py-3"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <StepProgress step={step} />
                  </View>

                  {step === 1 && (
                    <ChildInfoStepSection
                      firstName={form.firstName}
                      setFirstName={form.setFirstName}
                      middleName={form.middleName}
                      setMiddleName={form.setMiddleName}
                      lastName={form.lastName}
                      setLastName={form.setLastName}
                      dateOfBirth={form.dateOfBirth}
                      onPickDateOfBirth={() =>
                        datePicker.openDatePicker("dateOfBirth")
                      }
                      computedChildAge={form.computedChildAge}
                      gender={form.gender}
                      setGender={form.setGender}
                      enrollmentDate={form.enrollmentDate}
                      onPickEnrollmentDate={() =>
                        datePicker.openDatePicker("enrollmentDate")
                      }
                      assignedCenterPrimary={assignedCenterPrimary}
                      assignedCenterSecondary={assignedCenterSecondary}
                      programType={form.programType}
                      setProgramType={form.setProgramType}
                      schoolYear={form.schoolYear}
                    />
                  )}

                  {step === 2 && (
                    <ParentInfoStepSection
                      parentFirstName={form.parentFirstName}
                      setParentFirstName={form.setParentFirstName}
                      parentMiddleName={form.parentMiddleName}
                      setParentMiddleName={form.setParentMiddleName}
                      parentLastName={form.parentLastName}
                      setParentLastName={form.setParentLastName}
                      parentEmail={form.parentEmail}
                      setParentEmail={form.setParentEmail}
                      parentPhone={form.parentPhone}
                      setParentPhone={form.setParentPhone}
                    />
                  )}

                  {step === 3 && (
                    <DocumentsStepSection
                      isWide={isWide}
                      birthCertificateFile={form.birthCertificateFile}
                      parentIdFile={form.parentIdFile}
                      onPickBirthCertificate={handlePickBirthCertificate}
                      onPickParentId={handlePickParentId}
                      onClearBirthCertificate={() =>
                        form.setBirthCertificateFile(null)
                      }
                      onClearParentId={() => form.setParentIdFile(null)}
                    />
                  )}

                  {step === 4 && (
                    <ReviewSubmitStepSection
                      childFullName={form.childFullName}
                      dateOfBirth={form.dateOfBirth}
                      computedChildAge={form.computedChildAge}
                      gender={form.gender}
                      enrollmentDate={form.enrollmentDate}
                      assignedCenterReviewValue={assignedCenterReviewValue}
                      programType={form.programType}
                      schoolYear={form.schoolYear}
                      parentFullName={form.parentFullName}
                      parentEmail={form.parentEmail}
                      parentPhone={form.parentPhone}
                      hasBirthCertificate={Boolean(form.birthCertificateFile)}
                      hasParentId={Boolean(form.parentIdFile)}
                    />
                  )}

                  <View className="mt-5 flex-row gap-3">
                    <Pressable
                      onPress={step === 1 ? resetForm : previousStep}
                      className="active:scale-95"
                      style={[
                        enrollFieldStyles.footerBtn,
                        enrollFieldStyles.footerBtnSecondary,
                      ]}
                    >
                      <Text className="text-center text-lg font-semibold text-gray-900">
                        {step === 1 ? "Cancel" : "Back"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={step < 4 ? nextStep : handleSubmitEnrollment}
                      disabled={isSubmitting}
                      className="active:scale-95"
                      style={[
                        enrollFieldStyles.footerBtn,
                        isSubmitting
                          ? enrollFieldStyles.footerBtnPrimaryDisabled
                          : enrollFieldStyles.footerBtnPrimaryIdle,
                        !isSubmitting && {
                          shadowColor: "#0D9488",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 4,
                        },
                      ]}
                    >
                      <Text className="text-center text-lg font-bold text-white">
                        {primaryLabel}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={submitted.loadingSubmitted}
                onRefresh={() => void submitted.refreshSubmitted()}
                tintColor="#0D9488"
              />
            }
            contentContainerStyle={{
              paddingHorizontal: contentPadding,
              paddingTop: 16,
              paddingBottom: 36,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              className="w-full self-center"
              style={{ maxWidth: contentMaxWidth }}
            >
              <SubmittedRequestsPanel
                submittedSummary={submitted.submittedSummary}
                submittedStatusFilter={submitted.submittedStatusFilter}
                setSubmittedStatusFilter={submitted.setSubmittedStatusFilter}
                submittedSearchQuery={submitted.submittedSearchQuery}
                setSubmittedSearchQuery={submitted.setSubmittedSearchQuery}
                loadingSubmitted={submitted.loadingSubmitted}
                submittedRequests={submitted.submittedRequests}
                filteredSubmittedRequests={submitted.filteredSubmittedRequests}
                onViewParentPassword={viewParentPassword}
                onResetParentPassword={(request) =>
                  resetParentPassword(
                    request,
                    () => void submitted.refreshSubmitted(),
                  )
                }
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

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
                  {datePicker.pickerField === "dateOfBirth"
                    ? "Select Date of Birth"
                    : "Select Enrollment Date"}
                </Text>
                <Pressable onPress={datePicker.confirmPicker}>
                  <Text className="text-lg font-bold text-teal-600">Done</Text>
                </Pressable>
              </View>

              {datePicker.pickerMode === "native" &&
              Platform.OS === "ios" &&
              datePicker.NativeDateTimePicker ? (
                <datePicker.NativeDateTimePicker
                  value={datePicker.pickerDate}
                  mode="date"
                  display="spinner"
                  minimumDate={
                    datePicker.pickerField === "dateOfBirth"
                      ? datePicker.minDateOfBirth
                      : undefined
                  }
                  maximumDate={
                    datePicker.pickerField === "dateOfBirth"
                      ? datePicker.maxDateOfBirth
                      : undefined
                  }
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
                  {datePicker.pickerField === "dateOfBirth" ? (
                    <Text className="mt-2 text-xs text-gray-500">
                      Allowed range:{" "}
                      {displayDate(formatYmd(datePicker.minDateOfBirth))} to{" "}
                      {displayDate(formatYmd(datePicker.maxDateOfBirth))}
                    </Text>
                  ) : (
                    <Text className="mt-2 text-xs text-gray-500">
                      Example: {formatYmd(new Date())}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}
