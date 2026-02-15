export interface AIChatRequest {
  role: "parent" | "teacher" | "admin";
  message: string;

  child?: {
    id: string;
    name: string;
  };

  record?: {
    date: string;
    attendanceStatus?: string;
    feedingStatus?: string;
    verified?: boolean;
  };
}
