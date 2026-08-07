export type AttendanceStatus = "present" | "absent";

export type FeedingStatus = "completed" | "missed";

export interface RecordInput {
  child: unknown;
  status: string;
}

export interface ParentRecord {
  childId: string;
  childName: string;
  status: string;
}

export interface ParentTarget {
  parentId: string;
  parentName: string;
  tokens: string[];
  records: ParentRecord[];
}
