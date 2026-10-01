import { useCallback, useState } from "react";
import {
  confirmEnrollmentDocument,
  verifyEnrollmentDocument,
} from "@/src/api/teacher.api";
import type { DocumentVerificationResponse } from "@/src/api/api.types";

export type MobileVerificationState =
  | "idle"
  | "checking"
  | "verified"
  | "confirmation_required"
  | "rejected"
  | "service_error";
export type VerificationView = {
  state: MobileVerificationState;
  result: DocumentVerificationResponse | null;
  message?: string;
  pendingAction?: "verify" | "retry" | "confirm";
};
const initial: VerificationView = { state: "idle", result: null };
const isServiceFailure = (codes: string[]) =>
  codes.some((code) => code.startsWith("AI_"));

export const getVerificationDisplay = (value: VerificationView) => {
  if (value.pendingAction === "confirm")
    return {
      label: "Saving Teacher Verification...",
      tone: "pending" as const,
      loading: true,
    };
  if (value.pendingAction === "retry")
    return {
      label: "Retrying Verification...",
      tone: "pending" as const,
      loading: true,
    };
  if (value.state === "checking")
    return {
      label: "Verifying Document...",
      tone: "pending" as const,
      loading: true,
    };
  if (value.result?.teacherConfirmed)
    return {
      label: "Verified by Teacher",
      tone: "success" as const,
      loading: false,
    };
  if (value.state === "verified")
    return {
      label: "Automatically Verified",
      tone: "success" as const,
      loading: false,
    };
  if (value.state === "rejected")
    return {
      label: "Document Not Accepted",
      tone: "error" as const,
      loading: false,
    };
  if (value.state === "service_error")
    return {
      label: "Verification Unavailable",
      tone: "warning" as const,
      loading: false,
    };
  if (value.state === "confirmation_required")
    return {
      label: "Teacher Verification Required",
      tone: "warning" as const,
      loading: false,
    };
  return {
    label: "Not Yet Verified",
    tone: "neutral" as const,
    loading: false,
  };
};

export const useDocumentVerification = () => {
  const [birthCertificate, setBirthCertificate] =
    useState<VerificationView>(initial);
  const [parentId, setParentId] = useState<VerificationView>(initial);
  const setter = (type: "birthCertificate" | "parentId") =>
    type === "birthCertificate" ? setBirthCertificate : setParentId;
  const verify = async (
    type: "birthCertificate" | "parentId",
    file: { uri: string; name: string },
    expected: Record<string, string>,
  ) => {
    const current = type === "birthCertificate" ? birthCertificate : parentId;
    const set = setter(type);
    set({
      state: "checking",
      result: null,
      pendingAction: current.state === "idle" ? "verify" : "retry",
    });
    try {
      const result = await verifyEnrollmentDocument(file, {
        documentType: type,
        ...expected,
      } as any);
      const state: MobileVerificationState =
        result.status === "verified"
          ? "verified"
          : result.status === "rejected"
            ? "rejected"
            : isServiceFailure(result.reasonCodes)
              ? "service_error"
              : "confirmation_required";
      set({ state, result, message: result.message });
      return result;
    } catch (error: any) {
      set({
        state: "service_error",
        result: null,
        message: error?.message || "Verification failed.",
      });
      return null;
    }
  };
  const confirm = async (type: "birthCertificate" | "parentId") => {
    const current = type === "birthCertificate" ? birthCertificate : parentId;
    if (!current.result) return;
    const set = setter(type);
    set({
      ...current,
      pendingAction: "confirm",
      message: "Saving teacher verification...",
    });
    try {
      const result = await confirmEnrollmentDocument(
        current.result.verificationId,
      );
      set({
        state: "confirmation_required",
        result,
        message: "Verified by teacher.",
      });
    } catch (error: any) {
      set({
        ...current,
        message:
          error?.message || "Teacher verification failed. Please try again.",
      });
    }
  };
  const clear = useCallback((type: "birthCertificate" | "parentId") => {
    (type === "birthCertificate" ? setBirthCertificate : setParentId)(initial);
  }, []);
  const isEligible = (value: VerificationView) =>
    value.result?.status === "verified" ||
    Boolean(value.result?.teacherConfirmed);
  return { birthCertificate, parentId, verify, confirm, clear, isEligible };
};
