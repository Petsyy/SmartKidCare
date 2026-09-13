import { apiClient } from "./client";
import {
  getManilaDateKey,
  getManilaIsoRangeForDateKey,
  toManilaDateKey,
} from "@/src/utils/manila-date";
import type {
  SubmitResponse,
  SubmitAttendanceData,
  SubmitFeedingData,
} from "./api.types";

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
  return getAttendanceForDate(getManilaDateKey());
};

export const getTodayFeeding = async (): Promise<any | null> => {
  return getFeedingForDate(getManilaDateKey());
};

export const getAttendanceForDate = async (
  dateKey: string,
): Promise<any | null> => {
  const dateRange = getManilaIsoRangeForDateKey(dateKey);
  if (!dateRange) return null;

  const records = await getAttendanceHistory(
    dateRange.startIso,
    dateRange.endIso,
  );

  return records.find((record) => toManilaDateKey(record?.date) === dateKey) || null;
};

export const getFeedingForDate = async (
  dateKey: string,
): Promise<any | null> => {
  const dateRange = getManilaIsoRangeForDateKey(dateKey);
  if (!dateRange) return null;

  const records = await getFeedingHistory(
    dateRange.startIso,
    dateRange.endIso,
  );

  return records.find((record) => toManilaDateKey(record?.date) === dateKey) || null;
};
