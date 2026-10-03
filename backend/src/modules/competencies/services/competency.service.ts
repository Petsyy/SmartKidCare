import mongoose from "mongoose";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../shared/errors/app-error";
import { childRepository as defaultChildRepository } from "../../child/repositories/child.repository";
import { DEFAULT_COMPETENCIES } from "../constants";
import {
  competencyDefinitionRepository,
  competencyEvaluationRepository,
} from "../repositories/competency.repository";
import type {
  CompetencyAuthUser,
  CompetencyEvaluationInput,
  CompetencyChildRepository,
  CompetencyDefinitionRepositoryContract,
  CompetencyEvaluationRepositoryContract,
} from "../types/competency.types";
import { canAccessChild } from "../../../shared/services/child-access.service";
import { getSingleCenterId } from "../../../shared/services/single-center.service";

const COMPETENCY_LEVELS = [
  "not_demonstrated",
  "emerging",
  "developing",
  "achieved",
] as const;
type CompetencyLevel = (typeof COMPETENCY_LEVELS)[number];

type AnalyticsEvaluation = {
  child: unknown;
  schoolYear: string;
  entries?: Array<{ competency: unknown; level: CompetencyLevel }>;
};

export const summarizeCompetencyRatings = (
  definitions: any[],
  evaluations: AnalyticsEvaluation[],
) => {
  const counts = new Map<string, Record<CompetencyLevel, number>>();
  definitions.forEach((definition) => {
    counts.set(String(definition._id), {
      not_demonstrated: 0,
      emerging: 0,
      developing: 0,
      achieved: 0,
    });
  });
  evaluations.forEach((evaluation) => {
    evaluation.entries?.forEach((entry) => {
      const distribution = counts.get(String(entry.competency || ""));
      if (distribution && COMPETENCY_LEVELS.includes(entry.level)) {
        distribution[entry.level] += 1;
      }
    });
  });
  return definitions.map((definition) => {
    const distribution = counts.get(String(definition._id))!;
    const totalEvaluated = COMPETENCY_LEVELS.reduce(
      (total, level) => total + distribution[level],
      0,
    );
    return {
      competencyId: String(definition._id),
      code: definition.code,
      name: definition.name,
      category: definition.category,
      distribution,
      totalEvaluated,
      achievedRate: totalEvaluated
        ? Math.round((distribution.achieved / totalEvaluated) * 100)
        : 0,
    };
  });
};

export const compareCompetencyPeriods = (
  quarterlyEvaluations: AnalyticsEvaluation[],
  finalEvaluations: AnalyticsEvaluation[],
) => {
  const pairKey = (evaluation: AnalyticsEvaluation) =>
    `${String(evaluation.child)}|${evaluation.schoolYear}`;
  const finalByChild = new Map(
    finalEvaluations.map((evaluation) => [pairKey(evaluation), evaluation]),
  );
  const levelRank = new Map(COMPETENCY_LEVELS.map((level, index) => [level, index]));
  let matchedStudents = 0;
  let improvedRatings = 0;
  let unchangedRatings = 0;
  let declinedRatings = 0;

  quarterlyEvaluations.forEach((quarterly) => {
    const final = finalByChild.get(pairKey(quarterly));
    if (!final) return;
    matchedStudents += 1;
    const finalEntries = new Map(
      (final.entries || []).map((entry) => [String(entry.competency), entry.level]),
    );
    quarterly.entries?.forEach((entry) => {
      const finalLevel = finalEntries.get(String(entry.competency));
      if (!finalLevel) return;
      const change = (levelRank.get(finalLevel) ?? 0) - (levelRank.get(entry.level) ?? 0);
      if (change > 0) improvedRatings += 1;
      else if (change < 0) declinedRatings += 1;
      else unchangedRatings += 1;
    });
  });
  const totalComparedRatings = improvedRatings + unchangedRatings + declinedRatings;
  return {
    matchedStudents,
    totalComparedRatings,
    improvedRatings,
    unchangedRatings,
    declinedRatings,
    improvementRate: totalComparedRatings
      ? (improvedRatings / totalComparedRatings) * 100
      : 0,
  };
};

export class CompetencyService {
  constructor(
    private readonly definitionRepository: CompetencyDefinitionRepositoryContract,
    private readonly evaluationRepository: CompetencyEvaluationRepositoryContract,
    private readonly childRepository: CompetencyChildRepository,
  ) {}

  async initializeCatalog(): Promise<void> {
    await this.definitionRepository.ensureDefaults(DEFAULT_COMPETENCIES);
    await this.evaluationRepository.removeLegacyIndexes();
  }

  async getDefinitions(user?: CompetencyAuthUser): Promise<any[]> {
    this.assertReader(user);
    return this.definitionRepository.findActive();
  }

  async saveEvaluation(
    user: CompetencyAuthUser | undefined,
    input: CompetencyEvaluationInput,
  ): Promise<any> {
    const validUser = this.assertReader(user);
    if (validUser.role !== "teacher") throw new ForbiddenError("Teachers only");

    const child = await this.getAccessibleChild(validUser, input.childId);
    const parsedDay = this.parseEvaluationDay(input.evaluationDate);
    const activeDefinitions = await this.definitionRepository.findActive();
    const activeIds = new Set(
      activeDefinitions.map((d: any) => d._id.toString()),
    );

    for (const entry of input.entries) {
      if (!activeIds.has(entry.competencyId)) {
        throw new ValidationError(
          `Competency ${entry.competencyId} is invalid or inactive.`,
        );
      }
    }

    if (
      input.status === "submitted" &&
      input.entries.length !== activeDefinitions.length
    ) {
      throw new ValidationError(
        "All competencies must be evaluated before submitting.",
      );
    }

    const schoolYear = String(child.schoolYear || "Not set");
    const existing =
      await this.evaluationRepository.findByChildSchoolYearAndPeriod(
        input.childId,
        schoolYear,
        input.period,
      );

    if (existing?.status === "submitted") {
      throw new ConflictError(
        `A submitted evaluation already exists for this child in the ${input.period} period.`,
      );
    }

    const prerequisitePeriod = input.period === "final" ? "quarterly" : null;

    if (prerequisitePeriod) {
      const prerequisite =
        await this.evaluationRepository.findByChildSchoolYearAndPeriod(
          input.childId,
          schoolYear,
          prerequisitePeriod,
        );
      if (prerequisite?.status !== "submitted") {
        throw new ConflictError(
          "Final evaluation is locked until the Quarterly evaluation is submitted.",
        );
      }
    }

    const values = {
      child: new mongoose.Types.ObjectId(input.childId),
      teacher: new mongoose.Types.ObjectId(validUser.id),
      daycareCenter: child.daycareCenter?._id || child.daycareCenter || null,
      evaluationDate: parsedDay.date,
      schoolYear,
      period: input.period,
      status: input.status,
      entries: input.entries.map((entry) => ({
        competency: entry.competencyId,
        level: entry.level,
        remarks: entry.remarks || "",
      })),
      generalNotes: input.generalNotes || "",
    };

    if (existing) {
      existing.set(values);
      await existing.save();
      return existing;
    }
    return this.evaluationRepository.create(values);
  }

  async getEvaluationByPeriod(
    user: CompetencyAuthUser | undefined,
    childId: string,
    period: string,
  ): Promise<any | null> {
    const validUser = this.assertReader(user);
    const child = await this.getAccessibleChild(validUser, childId);
    const schoolYear = String(child.schoolYear || "Not set");
    return this.evaluationRepository.findViewByChildSchoolYearAndPeriod(
      childId,
      schoolYear,
      period,
    );
  }

  async getEvaluationHistory(
    user: CompetencyAuthUser | undefined,
    childId: string,
    page: number,
    limit: number,
  ) {
    const validUser = this.assertReader(user);
    await this.getAccessibleChild(validUser, childId);
    const [data, total] = await Promise.all([
      this.evaluationRepository.findHistoryByChild(
        childId,
        (page - 1) * limit,
        limit,
      ),
      this.evaluationRepository.countHistoryByChild(childId),
    ]);
    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAnalytics(
    user: CompetencyAuthUser | undefined,
    filters: { period?: string; schoolYear?: string; centerId?: string },
  ) {
    const validUser = this.assertReader(user);
    if (validUser.role !== "barangay_captain")
      throw new ForbiddenError("Barangay Captains only");

    const centerId = await getSingleCenterId();
    const [definitions, schoolYears] = await Promise.all([
      this.definitionRepository.findActive(),
      this.evaluationRepository.findSubmittedSchoolYears(centerId),
    ]);
    const selectedSchoolYear =
      filters.schoolYear && filters.schoolYear !== "all"
        ? filters.schoolYear
        : schoolYears[0] || "all";
    const schoolYearFilter = selectedSchoolYear === "all" ? undefined : selectedSchoolYear;
    const baseFilters = { centerId, schoolYear: schoolYearFilter };
    const [evaluations, quarterlyEvaluations, finalEvaluations] = await Promise.all([
      this.evaluationRepository.aggregateLatestSubmitted({
        ...baseFilters,
        period: filters.period && filters.period !== "all" ? filters.period : undefined,
      }),
      this.evaluationRepository.aggregateLatestSubmitted({ ...baseFilters, period: "quarterly" }),
      this.evaluationRepository.aggregateLatestSubmitted({ ...baseFilters, period: "final" }),
    ]);
    const competencies = summarizeCompetencyRatings(definitions, evaluations);

    return {
      filters: {
        period: filters.period || "all",
        schoolYear: selectedSchoolYear,
        centerId,
      },
      totalStudents: evaluations.length,
      schoolYears,
      competencies,
      periods: {
        quarterly: {
          totalStudents: quarterlyEvaluations.length,
          competencies: summarizeCompetencyRatings(definitions, quarterlyEvaluations),
        },
        final: {
          totalStudents: finalEvaluations.length,
          competencies: summarizeCompetencyRatings(definitions, finalEvaluations),
        },
      },
      comparison: compareCompetencyPeriods(quarterlyEvaluations, finalEvaluations),
    };
  }

  private assertReader(
    user?: CompetencyAuthUser,
  ): Required<CompetencyAuthUser> {
    if (!user?.id) throw new UnauthorizedError();
    if (user.role !== "teacher" && user.role !== "barangay_captain" && user.role !== "parent")
      throw new ForbiddenError();
    return user as Required<CompetencyAuthUser>;
  }

  private async getAccessibleChild(
    user: Required<CompetencyAuthUser>,
    childId: string,
  ): Promise<any> {
    const child = await this.childRepository.findByIdWithDetails(childId);
    if (!child) throw new NotFoundError("Child");
    if (!canAccessChild(user as any, child)) {
      throw new ForbiddenError("This child is not assigned to you.");
    }
    return child;
  }

  private parseEvaluationDay(value: string) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
      throw new ValidationError("Evaluation date must use YYYY-MM-DD.");
    const date = new Date(
      Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    );
    if (
      date.getUTCFullYear() !== Number(match[1]) ||
      date.getUTCMonth() !== Number(match[2]) - 1 ||
      date.getUTCDate() !== Number(match[3])
    ) {
      throw new ValidationError("Invalid evaluation date.");
    }
    if (date.getTime() > Date.now())
      throw new ValidationError("Evaluation date cannot be in the future.");
    return {
      date,
      start: date,
      end: new Date(date.getTime() + 86_400_000 - 1),
    };
  }
}

export const competencyService = new CompetencyService(
  competencyDefinitionRepository,
  competencyEvaluationRepository,
  defaultChildRepository,
);

export type {
  CompetencyAuthUser,
  CompetencyEvaluationInput,
  CompetencyChildRepository,
  CompetencyDefinitionRepositoryContract,
  CompetencyEvaluationRepositoryContract,
} from "../types/competency.types";
