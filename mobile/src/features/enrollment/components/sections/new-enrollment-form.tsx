import { ScrollView, View } from "react-native";
import { ChildInfoStepSection } from "./child-info-step-section";
import { ChildHealthEnrollmentStepSection } from "./child-health-enrollment-step-section";
import { DocumentsStepSection } from "./documents-step-section";
import { EnrollmentStartState } from "./enrollment-start-state";
import { ParentInfoStepSection } from "./parent-info-step-section";
import { ReviewSubmitStepSection } from "./review-submit-step-section";
import {
  EnrollmentDatePickerModal,
  EnrollmentStepFooter,
  ParentCredentialsModal,
  StepProgress,
} from "@/src/features/enrollment/components/ui";
import { useNewEnrollmentWorkflow } from "@/src/features/enrollment/hooks";
import { getVerificationDisplay } from "@/src/features/documents/hooks";

interface NewEnrollmentFormProps {
  hasStarted: boolean;
  setHasStarted: (val: boolean) => void;
  onSubmissionSuccess: () => void;
  contentPadding?: number;
  contentMaxWidth?: number;
  isWide?: boolean;
}

export function NewEnrollmentForm({
  hasStarted,
  setHasStarted,
  onSubmissionSuccess,
  contentPadding,
  contentMaxWidth,
  isWide,
}: NewEnrollmentFormProps) {
  const {
    form,
    datePicker,
    documentVerification,
    step,
    setStep,
    isSubmitting,
    credentialsModal,
    assignedCenterPrimary,
    assignedCenterSecondary,
    assignedCenterReviewValue,
    resetForm,
    nextStep,
    previousStep,
    handlePickBirthCertificate,
    handlePickParentId,
    handleSubmitEnrollment,
    handleModalClose,
  } = useNewEnrollmentWorkflow({
    setHasStarted,
    onSubmissionSuccess,
  });

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

              {step === 1 ? (
                <ChildInfoStepSection
                  control={form.control as any}
                  onPickDateOfBirth={() =>
                    datePicker.openDatePicker("dateOfBirth")
                  }
                  computedChildAge={form.computedChildAge}
                />
              ) : null}

              {step === 2 ? (
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
              ) : null}

              {step === 3 ? (
                <ParentInfoStepSection control={form.control as any} />
              ) : null}

              {step === 4 ? (
                <DocumentsStepSection
                  isWide={Boolean(isWide)}
                  parentFirstName={form.parentFirstName}
                  parentLastName={form.parentLastName}
                  birthCertificateFile={form.birthCertificateFile}
                  parentIdFile={form.parentIdFile}
                  onPickBirthCertificate={handlePickBirthCertificate}
                  onPickParentId={handlePickParentId}
                  onClearBirthCertificate={() => {
                    form.setBirthCertificateFile(null);
                    documentVerification.clear("birthCertificate");
                  }}
                  onClearParentId={() => {
                    form.setParentIdFile(null);
                    documentVerification.clear("parentId");
                  }}
                  birthVerification={documentVerification.birthCertificate}
                  parentVerification={documentVerification.parentId}
                  onConfirmBirth={() =>
                    documentVerification.confirm("birthCertificate")
                  }
                  onConfirmParent={() =>
                    documentVerification.confirm("parentId")
                  }
                  onRetryBirth={() =>
                    form.birthCertificateFile &&
                    documentVerification.verify(
                      "birthCertificate",
                      form.birthCertificateFile,
                      {
                        childFullName: form.childFullName,
                        dateOfBirth: form.dateOfBirth,
                      },
                    )
                  }
                  onRetryParent={() =>
                    form.parentIdFile &&
                    documentVerification.verify("parentId", form.parentIdFile, {
                      parentFirstName: form.parentFirstName,
                      ...(form.parentMiddleName
                        ? { parentMiddleName: form.parentMiddleName }
                        : {}),
                      parentLastName: form.parentLastName,
                    })
                  }
                />
              ) : null}

              {step === 5 ? (
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
                  parentPhone={form.parentPhone}
                  parentRelationship={form.parentRelationship}
                  parentCustomRelationship={form.parentCustomRelationship}
                  hasBirthCertificate={Boolean(form.birthCertificateFile)}
                  hasParentId={Boolean(form.parentIdFile)}
                  birthCertificateVerification={
                    getVerificationDisplay(
                      documentVerification.birthCertificate,
                      "birthCertificate",
                    ).label
                  }
                  parentIdVerification={
                    getVerificationDisplay(
                      documentVerification.parentId,
                      "parentId",
                    ).label
                  }
                />
              ) : null}

              <EnrollmentStepFooter
                step={step}
                isSubmitting={isSubmitting}
                onCancelOrBack={step === 1 ? resetForm : previousStep}
                onNextOrSubmit={step < 5 ? nextStep : handleSubmitEnrollment}
              />
            </>
          )}
        </View>
      </ScrollView>

      <EnrollmentDatePickerModal datePicker={datePicker} />

      {credentialsModal ? (
        <ParentCredentialsModal
          visible={credentialsModal.visible}
          email={credentialsModal.email}
          tempPassword={credentialsModal.tempPassword}
          onClose={handleModalClose}
        />
      ) : null}
    </>
  );
}
