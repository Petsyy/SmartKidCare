import { API_BASE_URL } from "../config/config";

export interface AttendanceRecord {
  child: string;
  status: "present" | "absent";
}

export interface FeedingRecord {
  child: string;
  status: "completed" | "missed";
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

export const submitAttendance = async (
  token: string,
  data: SubmitAttendanceData,
): Promise<SubmitResponse> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/api/records/attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to submit attendance");
  }

  return result;
};

export const submitFeeding = async (
  token: string,
  data: SubmitFeedingData,
): Promise<SubmitResponse> => {
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}/api/records/feeding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to submit feeding");
  }

  return result;
};

export const getAttendanceHistory = async (
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<any[]> => {
  if (!token) throw new Error("No authentication token");

  let url = `${API_BASE_URL}/api/records/attendance`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch attendance history");
  }

  return Array.isArray(data) ? data : [];
};

export const getFeedingHistory = async (
  token: string,
  startDate?: string,
  endDate?: string,
): Promise<any[]> => {
  if (!token) throw new Error("No authentication token");

  let url = `${API_BASE_URL}/api/records/feeding`;
  if (startDate && endDate) {
    url += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch feeding history");
  }

  return Array.isArray(data) ? data : [];
};

// Get today's attendance record
export const getTodayAttendance = async (
  token: string,
): Promise<any | null> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const records = await getAttendanceHistory(
    token,
    today.toISOString(),
    tomorrow.toISOString(),
  );

  return records.length > 0 ? records[0] : null;
};

// Get today's feeding record
export const getTodayFeeding = async (token: string): Promise<any | null> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const records = await getFeedingHistory(
    token,
    today.toISOString(),
    tomorrow.toISOString(),
  );

  return records.length > 0 ? records[0] : null;
};
