import { useCallback, useRef, useState } from "react";
import {
  confirmEnrollmentDocument,
  verifyEnrollmentDocument,
} from "@/src/api/teacher.api";
import type { DocumentVerificationResponse } from "@/src/api/api.types";
import { ApiError } from "@/src/api/client";

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
  progressStage?: "uploading" | "retrying" | "analyzing";
};
const initial: VerificationView = { state: "idle", result: null };
const RETRY_DELAYS_MS = [1_000, 2_000];
const ANALYZING_MESSAGE_DELAY_MS = 8_000;
const isServiceFailure = (codes: string[]) =>
  codes.some((code) => code.startsWith("AI_"));
const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const isTransientUploadError = (error: unknown) =>
  error instanceof ApiError &&
  (error.status === 0 ||
    error.status === 408 ||
    error.status === 502 ||
    error.status === 503 ||
    error.status === 504);

export const getVerificationDisplay = (value: VerificationView) => {
  if (value.pendingAction === "confirm")
    return {
      label: "Saving Teacher Verification...",
      tone: "pending" as const,
      loading: true,
    };
  if (value.pendingAction === "retry")
    return {
      label:
        value.progressStage === "retrying"
          ? "Retrying Upload..."
          : value.progressStage === "analyzing"
            ? "Analyzing Document..."
            : "Uploading Document...",
      tone: "pending" as const,
      loading: true,
    };
  if (value.state === "checking")
    return {
      label:
        value.progressStage === "retrying"
          ? "Retrying Upload..."
          : value.progressStage === "analyzing"
            ? "Analyzing Document..."
            : "Uploading Document...",
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
  const inFlight = useRef<Record<"birthCertificate" | "parentId", boolean>>({
    birthCertificate: false,
    parentId: false,
  });
  const setter = (type: "birthCertificate" | "parentId") =>
    type === "birthCertificate" ? setBirthCertificate : setParentId;
  const verify = async (
    type: "birthCertificate" | "parentId",
    file: { uri: string; name: string },
    expected: Record<string, string>,
  ) => {
    if (inFlight.current[type]) return null;
    inFlight.current[type] = true;
    const current = type === "birthCertificate" ? birthCertificate : parentId;
    const set = setter(type);
    set({
      state: "checking",
      result: null,
      pendingAction: current.state === "idle" ? "verify" : "retry",
      progressStage: "uploading",
    });
    const analyzingTimer = setTimeout(() => {
      set({
        state: "checking",
        result: null,
        pendingAction: current.state === "idle" ? "verify" : "retry",
        progressStage: "analyzing",
      });
    }, ANALYZING_MESSAGE_DELAY_MS);
    try {
      let result: DocumentVerificationResponse | null = null;
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          result = await verifyEnrollmentDocument(file, {
            documentType: type,
            ...expected,
          } as any);
          break;
        } catch (error) {
          const retryDelay = RETRY_DELAYS_MS[attempt];
          if (!isTransientUploadError(error) || retryDelay === undefined)
            throw error;
          clearTimeout(analyzingTimer);
          set({
            state: "checking",
            result: null,
            pendingAction: "retry",
            progressStage: "retrying",
            message: `Connection interrupted. Retrying upload (${attempt + 2}/3)...`,
          });
          await wait(retryDelay);
        }
      }
      if (!result) throw new Error("Verification failed.");
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
        message:
          error?.message ||
          "The upload could not be completed. Check your connection and retry.",
      });
      return null;
    } finally {
      clearTimeout(analyzingTimer);
      inFlight.current[type] = false;
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
