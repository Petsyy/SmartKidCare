import { apiClient } from "@/src/api/client";
import type {
  CompetencyDefinition,
  CompetencyEvaluation,
  CompetencyHistory,
  CompetencyLevel,
} from "../types";

export type CompetencyClassStatus = {
  childId: string;
  status: "not_started" | "submitted" | "locked";
  evaluationId?: string;
  evaluationDate?: string;
};

export class CompetencyService {
  async getCompetencyDefinitions(): Promise<CompetencyDefinition[]> {
    return apiClient<CompetencyDefinition[]>("/api/competencies/definitions");
  }

  async getCompetencyEvaluationByPeriod(
    childId: string,
    period: string,
    dateKey?: string,
  ): Promise<CompetencyEvaluation | null> {
    return apiClient<CompetencyEvaluation | null>(
      `/api/competencies/children/${childId}/evaluations/${period}${dateKey ? `?date=${encodeURIComponent(dateKey)}` : ""}`,
    );
  }

  async getCompetencyHistory(childId: string): Promise<CompetencyHistory> {
    return apiClient<CompetencyHistory>(
      `/api/competencies/children/${childId}/evaluations?page=1&limit=50`,
    );
  }

  async getMyClassCompetencyStatus(
    period: "quarterly" | "final",
    date: string,
  ): Promise<{
    period: "quarterly" | "final";
    date: string;
    statuses: CompetencyClassStatus[];
  }> {
    return apiClient<{
      period: "quarterly" | "final";
      date: string;
      statuses: CompetencyClassStatus[];
    }>(
      `/api/competencies/my-class/status?period=${period}&date=${encodeURIComponent(date)}`,
    );
  }

  async submitCompetencyEvaluation(payload: {
    childId: string;
    evaluationId?: string;
    evaluationDate: string;
    period: "quarterly" | "final";
    status: "draft" | "submitted";
    entries: {
      competencyId: string;
      level: CompetencyLevel;
      remarks?: string;
    }[];
    generalNotes?: string;
  }): Promise<{
    message: string;
    evaluation: CompetencyEvaluation;
    notification?: {
      status: "created" | "duplicate" | "skipped" | "push_failed";
      reason?: string;
    };
  }> {
    return apiClient<{
      message: string;
      evaluation: CompetencyEvaluation;
      notification?: {
        status: "created" | "duplicate" | "skipped" | "push_failed";
        reason?: string;
      };
    }>("/api/competencies/evaluations", { method: "POST", body: payload });
  }
}

export const competencyService = new CompetencyService();

// Backwards-compatible bound aliases
export const getCompetencyDefinitions = () =>
  competencyService.getCompetencyDefinitions();

export const getCompetencyEvaluationByPeriod = (
  childId: string,
  period: string,
  dateKey?: string,
) => competencyService.getCompetencyEvaluationByPeriod(childId, period, dateKey);

export const getCompetencyHistory = (childId: string) =>
  competencyService.getCompetencyHistory(childId);

export const getMyClassCompetencyStatus = (
  period: "quarterly" | "final",
  date: string,
) => competencyService.getMyClassCompetencyStatus(period, date);

export const submitCompetencyEvaluation = (payload: {
  childId: string;
  evaluationId?: string;
  evaluationDate: string;
  period: "quarterly" | "final";
  status: "draft" | "submitted";
  entries: {
    competencyId: string;
    level: CompetencyLevel;
    remarks?: string;
  }[];
  generalNotes?: string;
}) => competencyService.submitCompetencyEvaluation(payload);
