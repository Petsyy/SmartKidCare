import { apiClient, apiFormDataClient } from "@/src/api/client";
import { File } from "expo-file-system";
import type {
  ChildEnrollmentRequestPayload,
  ChildEnrollmentRequestFiles,
  EnrollmentCenterOption,
  ChildEnrollmentSubmissionResponse,
  DocumentVerificationResponse,
} from "@/src/api/api.types";

export type {
  ChildEnrollmentRequestPayload,
  ChildEnrollmentRequestFiles,
  EnrollmentCenterOption,
  ChildEnrollmentSubmissionResponse,
};

export class EnrollmentService {
  async verifyEnrollmentDocument(
    file: { uri: string; name: string },
    fields:
      | {
          documentType: "birthCertificate";
          childFullName: string;
          dateOfBirth: string;
        }
      | {
          documentType: "parentId";
          parentFirstName: string;
          parentMiddleName?: string;
          parentLastName: string;
        }
      | {
          documentType: "guardianId";
          guardianFirstName: string;
          guardianLastName: string;
        },
  ): Promise<DocumentVerificationResponse> {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    formData.append("file", new File(file.uri), file.name);
    return apiFormDataClient<DocumentVerificationResponse>(
      "/api/enrollment/documents/verify",
      formData,
      "POST",
      { timeoutMs: 45_000 },
    );
  }

  async confirmEnrollmentDocument(
    verificationId: string,
  ): Promise<DocumentVerificationResponse> {
    return apiClient<DocumentVerificationResponse>(
      `/api/enrollment/documents/${verificationId}/confirm`,
      { method: "POST", body: { reviewAcknowledged: true } },
    );
  }

  async getEnrollmentCenters(): Promise<EnrollmentCenterOption[]> {
    const data = await apiClient<{ centers?: EnrollmentCenterOption[] }>(
      "/api/enrollment/centers",
    );
    return Array.isArray(data.centers) ? data.centers : [];
  }

  async submitChildEnrollment(
    payload: ChildEnrollmentRequestPayload,
    files?: ChildEnrollmentRequestFiles,
  ): Promise<ChildEnrollmentSubmissionResponse> {
    const formData = new FormData();

    (
      Object.entries(payload) as [keyof ChildEnrollmentRequestPayload, any][]
    ).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).length > 0) {
        formData.append(key, String(value));
      }
    });

    if (files?.birthCertificate?.uri) {
      formData.append(
        "birthCertificate",
        new File(files.birthCertificate.uri),
        files.birthCertificate.name,
      );
    }

    if (files?.parentId?.uri) {
      formData.append(
        "parentId",
        new File(files.parentId.uri),
        files.parentId.name,
      );
    }

    return apiFormDataClient<ChildEnrollmentSubmissionResponse>(
      "/api/enrollment",
      formData,
    );
  }
}

export const enrollmentService = new EnrollmentService();

// Backwards-compatible bound aliases
export const verifyEnrollmentDocument = (
  file: { uri: string; name: string },
  fields:
    | {
        documentType: "birthCertificate";
        childFullName: string;
        dateOfBirth: string;
      }
    | {
        documentType: "parentId";
        parentFirstName: string;
        parentMiddleName?: string;
        parentLastName: string;
      }
    | {
        documentType: "guardianId";
        guardianFirstName: string;
        guardianLastName: string;
      },
) => enrollmentService.verifyEnrollmentDocument(file, fields);

export const confirmEnrollmentDocument = (verificationId: string) =>
  enrollmentService.confirmEnrollmentDocument(verificationId);

export const getEnrollmentCenters = () =>
  enrollmentService.getEnrollmentCenters();

export const submitChildEnrollment = (
  payload: ChildEnrollmentRequestPayload,
  files?: ChildEnrollmentRequestFiles,
) => enrollmentService.submitChildEnrollment(payload, files);
