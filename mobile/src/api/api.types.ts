export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface LoggedInUser {
  _id: string;
  email: string;
  role: "teacher" | "parent";
  firstName?: string;
  lastName?: string;
  mustChangePassword?: boolean;
  needsToConfirmLink?: boolean;
  daycareCenterId?: string | null;
  daycareCenter?: { _id: string; name: string } | string | null;
}

export interface AuthenticatedLoginResponse {
  requiresPasswordChange?: false;
  token: string;
  user: LoggedInUser;
}

export interface PasswordChangeChallengeResponse {
  requiresPasswordChange: true;
  email: string;
  requiresOtp?: boolean;
  passwordSetupToken?: string;
  message?: string;
}

export type LoginResponse =
  AuthenticatedLoginResponse | PasswordChangeChallengeResponse;

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
    status?: DocumentVerificationStatus;
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
    "Mother" | "Father" | "Guardian" | "Grandparent" | "Other";
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

export interface AttendanceRecord {
  child: string;
  status: "present" | "absent" | "excused";
  excuseReason?:
    | "sick"
    | "medical_appointment"
    | "family_emergency"
    | "other";
  notes?: string;
}

export interface FeedingRecord {
  child: string;
  status: "completed" | "missed";
  notes?: string;
}

export interface BlockchainResult {
  txHash: string;
  dateHash: string;
  attendanceHash: string;
  feedingHash: string;
  blockNumber: number;
  timestamp?: string;
  gasUsed?: string;
  gasPrice?: string;
  gasCostInEth?: string;
}

export interface BlockchainConfirmation {
  childId: string;
  result: BlockchainResult;
}

export interface OnChainData {
  successes: BlockchainConfirmation[];
  failures: Array<{ childId: string; error: string }>;
}

export interface SubmitResponse {
  message: string;
  replayed?: boolean;
  onChain?: OnChainData;
  attendance?: AttendanceDocument;
}

export interface AttendanceDocument {
  _id: string;
  date: string;
  version?: number;
  records: (AttendanceRecord & { child: string | { _id: string } })[];
}

export interface SubmitAttendanceData {
  clientOperationId?: string;
  date: string;
  records: AttendanceRecord[];
}

export interface UpdateAttendanceData {
  clientOperationId: string;
  expectedVersion: number;
  records: AttendanceRecord[];
}

export interface SubmitFeedingData {
  clientOperationId?: string;
  date: string;
  foodServed: string;
  records: FeedingRecord[];
}

export type AIResponseLanguage = "en" | "fil";
export type AILanguageMode = "auto" | "explicit";
export type AIRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type AIDataStatus =
  | "AVAILABLE"
  | "PARTIAL"
  | "NO_DATA"
  | "NOT_APPLICABLE";
export type AIContextStatus =
  | "active"
  | "superseded"
  | "expired"
  | "invalidated";

export interface AIChatPayload {
  message: string;
  childId: string;
  language?: AIResponseLanguage;
  languageMode?: AILanguageMode;
  resetContext?: boolean;
  contextId?: string;
  requestId?: string;
}

export interface AIChatResponse {
  reply: string;
  language: AIResponseLanguage;
  languageMode: AILanguageMode;
  contextId: string;
  contextExpiresAt: string;
  contextStatus: AIContextStatus;
  requestId: string;
  replayed: boolean;
  riskLevel?: AIRiskLevel;
  dataStatus: AIDataStatus;
  intent: string;
  followUp?: {
    type: "confirmation" | "domain_selection";
    action: "show_details" | "choose_domain";
    expiresAt: string;
  };
}

export type Platform = "ios" | "android" | "web" | "unknown";

export interface RegisterPushTokenPayload {
  pushToken: string;
  platform?: Platform;
  deviceName?: string | null;
  appOwnership?: string | null;
}

export interface RegisterPushTokenResponse {
  message: string;
  totalTokens: number;
}

export interface TeacherNotificationDispatchDetail {
  teacherId: string;
  teacherName: string;
  sent: Array<
    | "attendance_reminder"
    | "attendance_incomplete"
    | "attendance_submitted"
    | "feeding_reminder"
    | "feeding_incomplete"
    | "feeding_submitted"
  >;
  skipped?: string;
}

export interface TeacherNotificationDispatchResponse {
  message: string;
  date: string;
  totalTeachers: number;
  processedTeachers: number;
  notificationsSent: number;
  attendanceReminderCount: number;
  attendanceIncompleteCount: number;
  feedingReminderCount: number;
  feedingIncompleteCount: number;
  details: TeacherNotificationDispatchDetail[];
}

export interface TeacherNotificationFeedItem {
  id: string;
  type:
    | "attendance_reminder"
    | "attendance_incomplete"
    | "attendance_submitted"
    | "feeding_reminder"
    | "feeding_incomplete"
    | "feeding_submitted";
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export interface TeacherNotificationFeedResponse {
  message: string;
  date: string;
  teacherId: string;
  teacherName: string;
  hasPushToken: boolean;
  notifications: TeacherNotificationFeedItem[];
}

export interface ParentNotificationFeedItem {
  id: string;
  type:
    | "attendance_submitted"
    | "absence_alert"
    | "feeding_submitted"
    | "missed_meal_alert"
    | "pickup_code_generated"
    | "child_released";
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export interface PickupEligibleChild {
  _id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  parent?: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    hasIdDocument: boolean;
  };
  authorizedPickupPersons?: Guardian[];
}

export interface DocumentAccessResponse {
  token: string;
  expiresInSeconds: number;
  documentType: "birthCertificate" | "parentId";
  viewPath: string;
}

export interface RequestPickupCodeResponse {
  expiresAt: string;
  childId: string;
  code: string;
}

export interface PickupRecordResponse {
  _id: string;
  child: string | Partial<Child>;
  daycareCenter: string;
  pickedUpBy: {
    type: "parent" | "guardian";
    userId?: string;
    guardianIndex?: number;
    name: string;
    phone: string;
    relationship: string;
  };
  verificationMethod: "pickup_code" | "manual_override";
  verifiedByTeacher:
    string | { _id: string; firstName: string; lastName: string };
  pickedUpAt: string;
  notes?: string;
}

export interface PickupStatusResponse {
  status: "pending" | "released";
  pickup?: PickupRecordResponse;
}

export interface PaginatedPickupHistory {
  data: PickupRecordResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ParentNotificationFeedResponse {
  message: string;
  date: string;
  parentId: string;
  parentName: string;
  hasPushToken: boolean;
  notifications: ParentNotificationFeedItem[];
}
export type DocumentVerificationStatus =
  "verified" | "teacher_confirmation_required" | "rejected";
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
