import type { ChildDocumentIntegrity } from "@/src/features/children/types";

export type Step = 1 | 2 | 3 | 4 | 5;

export type DateFieldKey = "dateOfBirth" | "enrollmentDate";

export type ProgramType =
  | "4Ps Beneficiary"
  | "Regular Enrollee (Non-beneficiary)";

export type EnrollmentStatusColors = {
  badgeBackgroundColor: string;
  textColor: string;
  label: string;
};

export type DocumentVerificationStatus =
  | "verified"
  | "teacher_confirmation_required"
  | "rejected";

export type DetectedDocumentType =
  | "birth_certificate"
  | "government_id"
  | "other_document"
  | "person_photo"
  | "unrelated_image"
  | "unknown";

export interface DocumentVerificationResponse {
  verificationId: string;
  status: DocumentVerificationStatus;
  detectedType: DetectedDocumentType;
  confidence: number | null;
  reasonCodes: string[];
  fieldMatches: {
    childName?: boolean;
    birthDate?: boolean;
    parentName?: boolean;
    parentFirstName?: boolean;
    parentMiddleName?: boolean;
    parentLastName?: boolean;
    guardianName?: boolean;
    guardianFirstName?: boolean;
    guardianLastName?: boolean;
  };
  extractedFields: {
    childFullName?: string | null;
    dateOfBirth?: string | null;
    parentFullName?: string | null;
    parentFirstName?: string | null;
    parentMiddleName?: string | null;
    parentLastName?: string | null;
  };
  teacherConfirmed: boolean;
  message: string;
  expiresAt: string;
}

export interface ChildEnrollmentRequestPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: "male" | "female";
  homeAddress: string;
  programType: "4Ps Beneficiary" | "Regular Enrollee (Non-beneficiary)";
  weight: number;
  height: number;
  daycareCenterId: string;
  enrollmentDate: string;
  schoolYear: string;
  parentFirstName: string;
  parentMiddleName?: string;
  parentLastName: string;
  parentPhone: string;
  parentRelationship:
    | "Mother"
    | "Father"
    | "Guardian"
    | "Grandparent"
    | "Other";
  parentCustomRelationship?: string;
}

export interface ChildEnrollmentRequestFiles {
  birthCertificate?: {
    uri: string;
    name: string;
    mimeType?: string | null;
  } | null;
  parentId?: {
    uri: string;
    name: string;
    mimeType?: string | null;
  } | null;
}

export interface EnrollmentCenterOption {
  _id: string;
  name: string;
  barangay: string;
  code: string;
  isActive?: boolean;
}

export interface TeacherEnrollmentRequest {
  _id: string;
  status: "pending" | "approved" | "rejected";
  child: {
    fullName: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
    gender: "male" | "female";
    homeAddress: string;
    programType: "4Ps Beneficiary" | "Regular Enrollee (Non-beneficiary)";
    enrollmentDate: string;
    schoolYear: string;
    weight?: number;
    height?: number;
    bmi?: number;
    nutritionalStatus?: string;
  };
  parent: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    relationship: string;
  };
  review?: {
    reviewedAt?: string | null;
    reason?: string;
  };
  createdChild?: {
    _id: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    studentId?: string;
    documentIntegrity?: ChildDocumentIntegrity | null;
  } | null;

  createdAt: string;
  updatedAt: string;
}

export interface ChildEnrollmentSubmissionResponse {
  message: string;
  request: TeacherEnrollmentRequest;
  parentCredentials?: {
    email: string;
    phone: string;
    tempPassword: string | null;
  };
}

export interface DocumentAccessResponse {
  token: string;
  expiresInSeconds: number;
  documentType: "birthCertificate" | "parentId";
  viewPath: string;
}
