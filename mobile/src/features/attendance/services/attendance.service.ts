import { apiClient } from "@/src/api/client";
import {
  getManilaDateKey,
  getManilaIsoRangeForDateKey,
  toManilaDateKey,
} from "@/src/utils/manila-date";
import type {
  SubmitResponse,
  SubmitAttendanceData,
  UpdateAttendanceData,
  AttendanceRecord,
} from "@/src/api/api.types";

export type {
  AttendanceRecord,
  SubmitResponse,
  SubmitAttendanceData,
  UpdateAttendanceData,
};

export class AttendanceService {
  async submitAttendance(
    data: SubmitAttendanceData,
  ): Promise<SubmitResponse> {
    return apiClient<SubmitResponse>("/api/records/attendance", {
      method: "POST",
      body: data,
    });
  }

  async updateAttendance(
    attendanceId: string,
    data: UpdateAttendanceData,
  ): Promise<SubmitResponse> {
    return apiClient<SubmitResponse>(`/api/records/attendance/${attendanceId}`, {
      method: "PATCH",
      body: data,
    });
  }

  async getAttendanceHistory(
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    let path = "/api/records/attendance";
    if (startDate && endDate) {
      path += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const data = await apiClient<any[]>(path);
    return Array.isArray(data) ? data : [];
  }

  async getTodayAttendance(): Promise<any | null> {
    return this.getAttendanceForDate(getManilaDateKey());
  }

  async getAttendanceForDate(
    dateKey: string,
  ): Promise<any | null> {
    const dateRange = getManilaIsoRangeForDateKey(dateKey);
    if (!dateRange) return null;

    const records = await this.getAttendanceHistory(
      dateRange.startIso,
      dateRange.endIso,
    );

    return records.find((record) => toManilaDateKey(record?.date) === dateKey) || null;
  }
}

export const attendanceService = new AttendanceService();

// Backwards-compatible bound aliases
export const submitAttendance = (data: SubmitAttendanceData) =>
  attendanceService.submitAttendance(data);

export const updateAttendance = (
  attendanceId: string,
  data: UpdateAttendanceData,
) => attendanceService.updateAttendance(attendanceId, data);

export const getAttendanceHistory = (startDate?: string, endDate?: string) =>
  attendanceService.getAttendanceHistory(startDate, endDate);

export const getTodayAttendance = () => attendanceService.getTodayAttendance();

export const getAttendanceForDate = (dateKey: string) =>
  attendanceService.getAttendanceForDate(dateKey);
