export interface ChildDocumentIntegrity {
  childIdHash?: string | null;
  documentsHash?: string | null;
  txHash?: string | null;
  blockNumber?: number | null;
  status?: "pending" | "processing" | "confirmed" | "failed" | null;
  chainId?: number | null;
  contractAddress?: string | null;
  attemptCount?: number;
  nextAttemptAt?: string | null;
  lastAttemptAt?: string | null;
  lastErrorCode?: string | null;
  blockchainVerified?: boolean;
  anchoredAt?: string | null;
}

export interface BlockchainProofResponse {
  network: "Sepolia";
  networkAvailable: boolean;
  anchorStatus: "pending" | "processing" | "confirmed" | "failed";
  verifiedOnChain: boolean;
  txHash: string | null;
  etherscanUrl: string | null;
  blockNumber: number | null;
  anchoredAt: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  nextAttemptAt: string | null;
  errorCode: string | null;
  childIdHash: string;
  localDocumentsHash: string;
  onChainDocumentsHash: string;
}

export interface Guardian {
  _id?: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  relationship: "Mother" | "Father" | "Guardian" | "Grandparent" | "Other";
  customRelationship?: string | null;
  phone: string;
  idUrl?: string | null;
  idPublicId?: string | null;
  verificationStatus?: "pending" | "verified";
  documentVerificationId?: string;
  idVerification?: {
    status?: "verified" | "teacher_confirmation_required" | "rejected";
    teacherConfirmed?: boolean;
    reasonCodes?: string[];
    modelVersion?: string;
    policyVersion?: string;
    confirmedBy?: string | null;
    confirmedAt?: string | null;
  };
  isActive?: boolean;
}

export interface Child {
  programType: string;
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  age: number;
  gender: string;
  homeAddress?: string;
  parentRelationship?: string;
  studentId: string;
  schoolYear: string;
  status: string;
  archivedAt?: string | null;
  archivedBy?: string | null;
  archiveReason?: string | null;
  archiveNote?: string | null;
  updatedAt?: string;
  enrollmentDate: string;
  dateOfBirth?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  nutritionalStatus?: string;
  documentIntegrity?: ChildDocumentIntegrity | null;

  parent?: {
    phone: any;
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };

  teacher?: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  authorizedPickupPersons?: Guardian[];
}
