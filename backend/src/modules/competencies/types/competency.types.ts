export type CompetencyAuthUser = {
  id?: string;
  role?: string;
  daycareCenterId?: string | null;
};

export type CompetencyEvaluationInput = {
  childId: string;
  evaluationId?: string;
  evaluationDate: string;
  period: "quarterly" | "final";
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
  findById(id: string): Promise<any | null>;
  findByChildAndDate(
    childId: string,
    startOfDay: Date,
    endOfDay: Date,
    period?: string,
  ): Promise<any | null>;
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
    centerId?: string;
  }): Promise<any[]>;
  findSubmittedSchoolYears(centerId?: string): Promise<string[]>;
}

export type CompetencyNotificationStatus =
  | "created"
  | "duplicate"
  | "skipped"
  | "push_failed";

export interface CompetencyNotificationResult {
  status: CompetencyNotificationStatus;
  reason?: string;
}

export interface CompetencyNotificationInput {
  evaluationId: string;
  childId: string;
  childName: string;
  parentId?: string | null;
  teacherId: string;
  centerId: string;
  status: "draft" | "submitted";
  entries: Array<{
    name: string;
    level: string;
    remarks?: string;
  }>;
}

export interface CompetencyNotificationParent {
  _id: unknown;
  role?: string;
  isActive?: boolean;
  pushToken?: string | null;
  pushTokens?: Array<{ token?: string | null }>;
}

export interface CompetencyNotificationRepositoryContract {
  findActiveParent(id: string): Promise<CompetencyNotificationParent | null>;
  createAlert(input: {
    recipientId: string;
    childId: string;
    evaluationId: string;
    senderId: string;
    centerId: string;
    title: string;
    message: string;
    uniqueKey: string;
  }): Promise<void>;
}

export interface CompetencyNotificationServiceContract {
  notify(input: CompetencyNotificationInput): Promise<CompetencyNotificationResult>;
}

export interface CompetencyNotificationServiceDependencies {
  repository: CompetencyNotificationRepositoryContract;
  extractTokens(parent: CompetencyNotificationParent): string[];
  sendPush(input: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<{ accepted: number; rejected: number }>;
}

