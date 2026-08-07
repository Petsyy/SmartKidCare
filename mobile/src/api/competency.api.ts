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
) =>
  apiClient<CompetencyEvaluation | null>(
    `/api/competencies/children/${childId}/evaluations/${period}`,
  );
export const getCompetencyHistory = (childId: string) =>
  apiClient<CompetencyHistory>(
    `/api/competencies/children/${childId}/evaluations?page=1&limit=10`,
  );
export const submitCompetencyEvaluation = (payload: {
  childId: string;
  evaluationDate: string;
  period: "initial" | "midyear" | "final";
  status: "draft" | "submitted";
  entries: Array<{
    competencyId: string;
    level: CompetencyLevel;
    remarks?: string;
  }>;
  generalNotes?: string;
}) =>
  apiClient<{ message: string; evaluation: CompetencyEvaluation }>(
    "/api/competencies/evaluations",
    { method: "POST", body: payload },
  );
