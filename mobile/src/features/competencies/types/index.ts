export type CompetencyLevel =
  | "not_demonstrated"
  | "emerging"
  | "developing"
  | "achieved";

export type CompetencyDefinition = {
  _id: string;
  code: string;
  name: string;
  description: string;
  category: "Fine Motor" | "Creative Expression";
  displayOrder: number;
};

export type CompetencyEvaluation = {
  _id: string;
  evaluationDate: string;
  period: "initial" | "midyear" | "final";
  status: "draft" | "submitted";
  entries: Array<{
    competency: CompetencyDefinition;
    level: CompetencyLevel;
    remarks?: string;
  }>;
  generalNotes?: string;
  teacher?: { firstName: string; middleName?: string; lastName: string };
};

export type CompetencyHistory = {
  data: CompetencyEvaluation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
