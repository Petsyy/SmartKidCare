import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  useEnrollmentForm,
  useEnrollmentCenters,
  useDatePicker,
  useDocumentPicker,
  useEnrollmentSubmit,
} from "@/src/features/enrollment/hooks";
import { useDocumentVerification } from "@/src/features/documents/hooks";
import type { Step } from "@/src/features/enrollment/types";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";

interface UseNewEnrollmentWorkflowParams {
  setHasStarted: (val: boolean) => void;
  onSubmissionSuccess: () => void;
}

export function useNewEnrollmentWorkflow({
  setHasStarted,
  onSubmissionSuccess,
}: UseNewEnrollmentWorkflowParams) {
  const form = useEnrollmentForm();
  const centers = useEnrollmentCenters();
  const currentCenterId = form.daycareCenterId;
  const setAssignedCenterId = form.setDaycareCenterId;

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
  const documentVerification = useDocumentVerification();
  const clearDocumentVerification = documentVerification.clear;
  const [step, setStep] = useState<Step>(1);
  const [credentialsModal, setCredentialsModal] = useState<{
    visible: boolean;
    email: string;
    tempPassword?: string | null;
  } | null>(null);

  const resetForm = () => {
    form.resetForm();
    clearDocumentVerification("birthCertificate");
    clearDocumentVerification("parentId");
    setHasStarted(false);
    setStep(1);
  };

  const { isSubmitting, submitEnrollment } = useEnrollmentSubmit(
    (credentials) => {
      setCredentialsModal({
        visible: true,
        email: credentials.email,
        tempPassword: credentials.tempPassword,
      });
    },
  );

  const handleModalClose = () => {
    setCredentialsModal(null);
    resetForm();
    onSubmissionSuccess();
  };

  // Enrollment is always scoped to the teacher's single assigned center.
  useEffect(() => {
    if (
      centers.assignedCenterId &&
      currentCenterId !== centers.assignedCenterId
    ) {
      setAssignedCenterId(centers.assignedCenterId);
    }
  }, [centers.assignedCenterId, currentCenterId, setAssignedCenterId]);

  useEffect(() => {
    clearDocumentVerification("birthCertificate");
  }, [form.childFullName, form.dateOfBirth, clearDocumentVerification]);

  useEffect(() => {
    clearDocumentVerification("parentId");
  }, [form.parentFullName, clearDocumentVerification]);

  const nextStep = async () => {
    if (step === 1 && !(await form.validateStepOne())) return;
    if (step === 2 && !(await form.validateStepTwo())) return;
    if (step === 3 && !(await form.validateStepThree())) return;
    if (
      step === 4 &&
      (!form.validateStepFour() ||
        !documentVerification.isEligible(
          documentVerification.birthCertificate,
        ) ||
        !documentVerification.isEligible(documentVerification.parentId))
    ) {
      Alert.alert(
        "Document Verification",
        "Verify both document images or inspect and confirm uncertain results before continuing.",
      );
      return;
    }
    setStep((prev) => (prev < 5 ? ((prev + 1) as Step) : prev));
  };

  const previousStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const handlePickBirthCertificate = async () => {
    const file = await pickDocument("birthCertificate", "gallery");
    if (file) {
      form.setBirthCertificateFile(file);
      documentVerification.clear("birthCertificate");
      await documentVerification.verify("birthCertificate", file, {
        childFullName: form.childFullName,
        dateOfBirth: form.dateOfBirth,
      });
    }
  };

  const handlePickParentId = async () => {
    const file = await pickDocument("parentId", "gallery");
    if (file) {
      form.setParentIdFile(file);
      documentVerification.clear("parentId");
      await documentVerification.verify("parentId", file, {
        parentFirstName: form.parentFirstName,
        ...(form.parentMiddleName
          ? { parentMiddleName: form.parentMiddleName }
          : {}),
        parentLastName: form.parentLastName,
      });
    }
  };

  const handleSubmitEnrollment = async () => {
    if (
      !(await form.validateStepOne()) ||
      !(await form.validateStepTwo()) ||
      !(await form.validateStepThree()) ||
      !form.validateStepFour() ||
      !documentVerification.isEligible(documentVerification.birthCertificate) ||
      !documentVerification.isEligible(documentVerification.parentId)
    )
      return;

    const submissionData = form.getSubmissionData() as any;
    submissionData.documentData.birthCertificateVerificationId =
      documentVerification.birthCertificate.result!.verificationId;
    submissionData.documentData.parentIdVerificationId =
      documentVerification.parentId.result!.verificationId;
    await submitEnrollment(submissionData);
  };

  const assignedCenterDisplayInfo = useMemo(
    () => getDaycareCenterDisplay(centers.assignedCenter),
    [centers.assignedCenter],
  );

  const assignedCenterReviewValue = useMemo(() => {
    const { primary, secondary } = assignedCenterDisplayInfo;
    return secondary ? `${primary} (${secondary})` : primary;
  }, [assignedCenterDisplayInfo]);

  const assignedCenterPrimary = centers.loadingCenters
    ? "Loading assigned center..."
    : centers.centerError
      ? "Unable to load assigned center"
      : assignedCenterDisplayInfo.primary;
  const assignedCenterSecondary = centers.loadingCenters
    ? ""
    : assignedCenterDisplayInfo.secondary;

  return {
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
  };
}

