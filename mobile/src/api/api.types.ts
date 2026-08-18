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
  | AuthenticatedLoginResponse
  | PasswordChangeChallengeResponse;

export interface ChildDocumentIntegrity {
  childIdHash?: string | null;
  documentsHash?: string | null;
  txHash?: string | null;
  blockNumber?: number | null;
  blockchainVerified?: boolean;
  anchoredAt?: string | null;
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
  parentRelationship: "Mother" | "Father" | "Guardian" | "Grandparent" | "Other";
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
  status: "present" | "absent";
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
  onChain?: OnChainData;
}

export interface SubmitAttendanceData {
  date: string;
  records: AttendanceRecord[];
}

export interface SubmitFeedingData {
  date: string;
  foodServed: string;
  records: FeedingRecord[];
}

export type AIRole = "parent";

export interface AIChatPayload {
  role: AIRole;
  message: string;
  childId: string;
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
    | "feeding_reminder"
    | "feeding_incomplete"
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
    | "feeding_reminder"
    | "feeding_incomplete";
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
    | "missed_meal_alert";
  title: string;
  message: string;
  timeLabel: string;
  actionLabel: string;
}

export interface ParentNotificationFeedResponse {
  message: string;
  date: string;
  parentId: string;
  parentName: string;
  hasPushToken: boolean;
  notifications: ParentNotificationFeedItem[];
}
