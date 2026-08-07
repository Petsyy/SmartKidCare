export type CompetencyAuthUser = { id?: string; role?: string };

export type CompetencyEvaluationInput = {
  childId: string;
  evaluationDate: string;
  period: "initial" | "midyear" | "final";
  status: "draft" | "submitted";
  entries: Array<{ competencyId: string; level: string; remarks?: string }>;
  generalNotes?: string;
};

export interface CompetencyChildRepository {
  findByIdWithDetails(id: string): Promise<any | null>;
}

export interface CompetencyDefinitionRepositoryContract {
  ensureDefaults(definitions: ReadonlyArray<any>): Promise<void>;
  findActive(): Promise<any[]>;
  findActiveByIds(ids: string[]): Promise<any[]>;
}

export interface CompetencyEvaluationRepositoryContract {
  removeLegacyIndexes(): Promise<void>;
  create(data: Record<string, unknown>): Promise<any>;
  findByChildSchoolYearAndPeriod(
    childId: string,
    schoolYear: string,
    period: string,
  ): Promise<any | null>;
  findByChildAndPeriod(childId: string, period: string): Promise<any | null>;
  findViewByChildSchoolYearAndPeriod(
    childId: string,
    schoolYear: string,
    period: string,
  ): Promise<any | null>;
  findHistoryByChild(
    childId: string,
    skip: number,
    limit: number,
  ): Promise<any[]>;
  countHistoryByChild(childId: string): Promise<number>;
  aggregateLatestSubmitted(filters: {
    period?: string;
    schoolYear?: string;
  }): Promise<any[]>;
  findSubmittedSchoolYears(): Promise<string[]>;
}

