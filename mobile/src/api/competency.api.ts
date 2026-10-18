import { apiClient } from "./client";
import type {
  CompetencyDefinition,
  CompetencyEvaluation,
  CompetencyHistory,
  CompetencyLevel,
} from "../features/competencies/types";

export const getCompetencyDefinitions = () =>
  apiClient<CompetencyDefinition[]>("/api/competencies/definitions");
export const getCompetencyEvaluationByPeriod = (
  childId: string,
  period: string,
  dateKey?: string,
) =>
  apiClient<CompetencyEvaluation | null>(
    `/api/competencies/children/${childId}/evaluations/${period}${dateKey ? `?date=${encodeURIComponent(dateKey)}` : ""}`,
  );
export const getCompetencyHistory = (childId: string) =>
  apiClient<CompetencyHistory>(
    `/api/competencies/children/${childId}/evaluations?page=1&limit=50`,
  );
export const submitCompetencyEvaluation = (payload: {
  childId: string;
  evaluationId?: string;
  evaluationDate: string;
  period: "quarterly" | "final";
  status: "draft" | "submitted";
  entries: Array<{
    competencyId: string;
    level: CompetencyLevel;
    remarks?: string;
  }>;
  generalNotes?: string;
}) =>
  apiClient<{
    message: string;
    evaluation: CompetencyEvaluation;
    notification?: {
      status: "created" | "duplicate" | "skipped" | "push_failed";
      reason?: string;
    };
  }>(
    "/api/competencies/evaluations",
    { method: "POST", body: payload },
  );
