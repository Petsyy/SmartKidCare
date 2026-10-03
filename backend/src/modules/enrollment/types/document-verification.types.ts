export type DocumentType = "birthCertificate" | "parentId";
export type VerificationStatus =
  | "verified"
  | "teacher_confirmation_required"
  | "rejected";
export type DetectedType =
  | "birth_certificate"
  | "government_id"
  | "other_document"
  | "person_photo"
  | "unrelated_image"
  | "unknown";

export type GeminiDocumentObservations = {
  documentVisible: boolean;
  detectedType: DetectedType;
  readable: boolean;
  cropped: boolean;
  glare: boolean;
  blurred: boolean;
  rotated: boolean;
  confidence: number;
  extractedFields: {
    childFullName?: string | null;
    dateOfBirth?: string | null;
    parentFullName?: string | null;
    parentFirstName?: string | null;
    parentMiddleName?: string | null;
    parentLastName?: string | null;
  };
  reasonCodes: string[];
};
