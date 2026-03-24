export type ChildDocumentType = "birth-certificate" | "parent-id";

export type Child = {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  age: string | number;
  studentId: string;
  schoolYear: string;
  status: string;
  enrollmentDate: string;
  dateOfBirth?: string | Date;
  parent?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone?: string;
  } | null;
  teacher?: {
    _id: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    email?: string;
  } | null;
  daycareCenter?: {
    _id: string;
    name: string;
    barangay: string;
    code?: string;
    isActive?: boolean;
  } | null;
  documents?: {
    birthCertificate?: {
      publicId?: string;
      resourceType?: string;
      format?: string;
    };
    parentId?: {
      publicId?: string;
      resourceType?: string;
      format?: string;
    };
  };
  documentIntegrity?: {
    childIdHash?: string | null;
    documentsHash?: string | null;
    txHash?: string | null;
    blockNumber?: number | null;
    blockchainVerified?: boolean;
    anchoredAt?: string | Date | null;
  };
};

export type ChildBlockchainProof = {
  network: string;
  txHash: string | null;
  etherscanUrl: string | null;
  blockNumber: number | null;
  anchoredAt: string | null;
  childIdHash: string;
  localDocumentsHash: string;
  onChainDocumentsHash: string | null;
  verifiedOnChain: boolean;
  documents: {
    birthCertificate: {
      hasDocument: boolean;
      hash: string | null;
      blockchainVerified: boolean;
    };
    parentId: {
      hasDocument: boolean;
      hash: string | null;
      blockchainVerified: boolean;
    };
  };
};
