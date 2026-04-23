import { apiClient } from "./client";
import {
  getManilaDateKey,
  getManilaIsoRangeForDateKey,
  toManilaDateKey,
} from "@/src/utils/manila-date";

export type {
  AttendanceRecord,
  FeedingRecord,
  BlockchainResult,
  BlockchainConfirmation,
  OnChainData,
  SubmitResponse,
  SubmitAttendanceData,
  SubmitFeedingData,
} from "./api.types";

import type {
  SubmitResponse,
  SubmitAttendanceData,
  SubmitFeedingData,
} from "./api.types";

export const submitAttendance = async (
  data: SubmitAttendanceData,
): Promise<SubmitResponse> => {
  return apiClient<SubmitResponse>("/api/records/attendance", {
    method: "POST",
    body: data,
  });
};

export const submitFeeding = async (
  data: SubmitFeedingData,
): Promise<SubmitResponse> => {
  return apiClient<SubmitResponse>("/api/records/feeding", {
    method: "POST",
    body: data,
  });
};

export const getAttendanceHistory = async (
  startDate?: string,
  endDate?: string,
): Promise<any[]> => {
  let path = "/api/records/attendance";
  if (startDate && endDate) {
    path += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const data = await apiClient<any[]>(path);
  return Array.isArray(data) ? data : [];
};

export const getFeedingHistory = async (
  startDate?: string,
  endDate?: string,
): Promise<any[]> => {
  let path = "/api/records/feeding";
  if (startDate && endDate) {
    path += `?startDate=${startDate}&endDate=${endDate}`;
  }

  const data = await apiClient<any[]>(path);
  return Array.isArray(data) ? data : [];
};

// Get today's attendance record
export const getTodayAttendance = async (): Promise<any | null> => {
  const todayDateKey = getManilaDateKey();
  const todayRange = getManilaIsoRangeForDateKey(todayDateKey);
  if (!todayRange) return null;

  const records = await getAttendanceHistory(
    todayRange.startIso,
    todayRange.endIso,
  );

  return (
    records.find((record) => toManilaDateKey(record?.date) === todayDateKey) ||
    records[0] ||
    null
  );
};

// Get today's feeding record
export const getTodayFeeding = async (): Promise<any | null> => {
  const todayDateKey = getManilaDateKey();
  const todayRange = getManilaIsoRangeForDateKey(todayDateKey);
  if (!todayRange) return null;

  const records = await getFeedingHistory(
    todayRange.startIso,
    todayRange.endIso,
  );

  return (
    records.find((record) => toManilaDateKey(record?.date) === todayDateKey) ||
    records[0] ||
    null
  );
};
