import { useEffect, useMemo, useState } from "react";
import {Modal,Platform,Pressable,ScrollView,Text,TextInput,View,
} from "react-native";
import { ChildInfoStepSection } from "./child-info-step-section";
import { ChildHealthEnrollmentStepSection } from "./child-health-enrollment-step-section";
import { DocumentsStepSection } from "./documents-step-section";
import { EnrollmentStartState } from "./enrollment-start-state";
import { ParentInfoStepSection } from "./parent-info-step-section";
import { ReviewSubmitStepSection } from "./review-submit-step-section";
import { StepProgress } from "@/src/features/enrollment/components/ui";
import {displayDate,formatYmd} from "@/src/features/enrollment/utils/enrollment-utils";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";
import {useEnrollmentForm,useEnrollmentCenters,useDatePicker,useDocumentPicker,
  useEnrollmentSubmit,
} from "@/src/features/enrollment/hooks";
import type { Step } from "@/src/features/enrollment/types";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";

export function NewEnrollmentForm({
  hasStarted,
  setHasStarted,
  onSubmissionSuccess,
  contentPadding,
  contentMaxWidth,
  isWide,
}: {
  hasStarted: boolean;
  setHasStarted: (val: boolean) => void;
  onSubmissionSuccess: () => void;
  contentPadding?: number;
  contentMaxWidth?: number;
  isWide?: boolean;
}) {
  const form = useEnrollmentForm();
  const centers = useEnrollmentCenters();
  const datePicker = useDatePicker(
    form.dateOfBirth,
    form.enrollmentDate,
    form.minDateOfBirth,
    form.maxDateOfBirth,
    (field, date) => {
      if (field === "dateOfBirth") {
        form.setDateOfBirth(date);
      } else {
        form.setEnrollmentDate(date);
      }
    },
  );
  const { pickDocument } = useDocumentPicker();
  const {
    isSubmitting,
    submitEnrollment,
  } = useEnrollmentSubmit(onSubmissionSuccess);

  const [step, setStep] = useState<Step>(1);

  // Auto-select center if only one available
  useEffect(() => {
    if (centers.enrollmentCenters.length > 0 && !form.daycareCenterId) {
      const defaultId = centers.getDefaultCenterId("");
      form.setDaycareCenterId(defaultId);
    }
  }, [centers.enrollmentCenters, form.daycareCenterId, centers]);

  const nextStep = async () => {
    if (step === 1 && !(await form.validateStepOne())) return;
    if (step === 2 && !(await form.validateStepTwo())) return;
    if (step === 3 && !(await form.validateStepThree())) return;
    if (step === 4 && !form.validateStepFour()) return;
    setStep((prev) => (prev < 5 ? ((prev + 1) as Step) : prev));
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
      !(await form.validateStepOne()) ||
      !(await form.validateStepTwo()) ||
      !(await form.validateStepThree()) ||
      !form.validateStepFour()
    )
      return;

    const submissionData = form.getSubmissionData();
    await submitEnrollment(submissionData, form.parentEmail, form.parentPhone);
  };

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
    step < 5 ? "Next" : isSubmitting ? "Submitting..." : "Submit Request";

  return (
    <>
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
                  control={form.control as any}
                  onPickDateOfBirth={() =>
                    datePicker.openDatePicker("dateOfBirth")
                  }
                  computedChildAge={form.computedChildAge}
                />
              )}

              {step === 2 && (
                <ChildHealthEnrollmentStepSection
                  control={form.control as any}
                  onPickEnrollmentDate={() =>
                    datePicker.openDatePicker("enrollmentDate")
                  }
                  assignedCenterPrimary={assignedCenterPrimary}
                  assignedCenterSecondary={assignedCenterSecondary}
                  computedBmi={form.computedBmi}
                  computedNutritionalStatus={form.computedNutritionalStatus}
                  schoolYear={form.schoolYear}
                />
              )}

              {step === 3 && (
                <ParentInfoStepSection control={form.control as any} />
              )}

              {step === 4 && (
                <DocumentsStepSection
                  isWide={Boolean(isWide)}
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

              {step === 5 && (
                <ReviewSubmitStepSection
                  childFullName={form.childFullName}
                  dateOfBirth={form.dateOfBirth}
                  computedChildAge={form.computedChildAge}
                  gender={form.gender}
                  homeAddress={form.homeAddress}
                  enrollmentDate={form.enrollmentDate}
                  assignedCenterReviewValue={assignedCenterReviewValue}
                  programType={form.programType}
                  schoolYear={form.schoolYear}
                  parentFullName={form.parentFullName}
                  parentEmail={form.parentEmail}
                  parentPhone={form.parentPhone}
                  parentRelationship={form.parentRelationship}
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
                  onPress={step < 5 ? nextStep : handleSubmitEnrollment}
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
    </>
  );
}
