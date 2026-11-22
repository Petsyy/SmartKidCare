import { apiClient } from "@/src/api/client";
import {
  getManilaDateKey,
  getManilaIsoRangeForDateKey,
  toManilaDateKey,
} from "@/src/utils/manila-date";
import type { SubmitFeedingData } from "../types";
import type { SubmitResponse } from "@/src/features/attendance";

export class FeedingService {
  async submitFeeding(
    data: SubmitFeedingData,
  ): Promise<SubmitResponse> {
    return apiClient<SubmitResponse>("/api/records/feeding", {
      method: "POST",
      body: data,
    });
  }

  async getFeedingHistory(
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    let path = "/api/records/feeding";
    if (startDate && endDate) {
      path += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const data = await apiClient<any[]>(path);
    return Array.isArray(data) ? data : [];
  }

  async getTodayFeeding(): Promise<any | null> {
    return this.getFeedingForDate(getManilaDateKey());
  }

  async getFeedingForDate(
    dateKey: string,
  ): Promise<any | null> {
    const dateRange = getManilaIsoRangeForDateKey(dateKey);
    if (!dateRange) return null;

    const records = await this.getFeedingHistory(
      dateRange.startIso,
      dateRange.endIso,
    );

    return records.find((record) => toManilaDateKey(record?.date) === dateKey) || null;
  }
}

export const feedingService = new FeedingService();

// Backwards-compatible bound aliases
export const submitFeeding = (data: SubmitFeedingData) =>
  feedingService.submitFeeding(data);

export const getFeedingHistory = (startDate?: string, endDate?: string) =>
  feedingService.getFeedingHistory(startDate, endDate);

export const getTodayFeeding = () => feedingService.getTodayFeeding();

export const getFeedingForDate = (dateKey: string) =>
  feedingService.getFeedingForDate(dateKey);
