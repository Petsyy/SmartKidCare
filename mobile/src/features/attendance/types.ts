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

export type AttendanceStatus = AttendanceRecord["status"];
export type ExcuseReason = NonNullable<AttendanceRecord["excuseReason"]>;
export type AttendanceFilter = "all" | "unmarked" | AttendanceStatus;
export type AttendanceSelection = Omit<AttendanceRecord, "child">;

export type TeacherAttendanceStats = {
  present: number;
  absent: number;
  excused: number;
  unmarked: number;
  total: number;
};

export type ExcuseEditorState = {
  childId: string;
  reason: ExcuseReason | null;
  notes: string;
};

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
  failures: { childId: string; error: string }[];
}

export interface SubmitResponse {
  message: string;
  replayed?: boolean;
  onChain?: OnChainData;
  attendance?: AttendanceDocument;
}
