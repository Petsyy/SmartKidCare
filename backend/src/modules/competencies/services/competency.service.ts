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

    const prerequisitePeriod =
      input.period === "midyear"
        ? "initial"
        : input.period === "final"
          ? "midyear"
          : null;

    if (prerequisitePeriod) {
      const prerequisite =
        await this.evaluationRepository.findByChildSchoolYearAndPeriod(
          input.childId,
          schoolYear,
          prerequisitePeriod,
        );
      if (prerequisite?.status !== "submitted") {
        const prerequisiteLabel =
          prerequisitePeriod === "initial" ? "Initial" : "Mid-Year";
        const periodLabel = input.period === "midyear" ? "Mid-Year" : "Final";
        throw new ConflictError(
          `${periodLabel} evaluation is locked until the ${prerequisiteLabel} evaluation is submitted.`,
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
    filters: { period?: string; schoolYear?: string },
  ) {
    const validUser = this.assertReader(user);
    if (validUser.role !== "admin")
      throw new ForbiddenError("Administrators only");

    const [definitions, evaluations, schoolYears] = await Promise.all([
      this.definitionRepository.findActive(),
      this.evaluationRepository.aggregateLatestSubmitted(filters),
      this.evaluationRepository.findSubmittedSchoolYears(),
    ]);

    const levels = [
      "not_demonstrated",
      "emerging",
      "developing",
      "achieved",
    ] as const;
    type Level = (typeof levels)[number];
    const counts = new Map<string, Record<Level, number>>();

    definitions.forEach((definition: any) => {
      counts.set(String(definition._id), {
        not_demonstrated: 0,
        emerging: 0,
        developing: 0,
        achieved: 0,
      });
    });

    evaluations.forEach((evaluation: any) => {
      evaluation.entries?.forEach((entry: any) => {
        const competencyCounts = counts.get(String(entry.competency || ""));
        const level = entry.level as Level;
        if (competencyCounts && levels.includes(level))
          competencyCounts[level] += 1;
      });
    });

    const competencies = definitions.map((definition: any) => {
      const distribution = counts.get(String(definition._id))!;
      const totalEvaluated = levels.reduce(
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

    return {
      filters: {
        period: filters.period || "all",
        schoolYear: filters.schoolYear || "all",
      },
      totalStudents: evaluations.length,
      schoolYears,
      competencies,
    };
  }

  private assertReader(
    user?: CompetencyAuthUser,
  ): Required<CompetencyAuthUser> {
    if (!user?.id) throw new UnauthorizedError();
    if (user.role !== "teacher" && user.role !== "admin")
      throw new ForbiddenError();
    return user as Required<CompetencyAuthUser>;
  }

  private async getAccessibleChild(
    user: Required<CompetencyAuthUser>,
    childId: string,
  ): Promise<any> {
    const child = await this.childRepository.findByIdWithDetails(childId);
    if (!child) throw new NotFoundError("Child");
    if (
      user.role === "teacher" &&
      String(child.teacher?._id || child.teacher || "") !== user.id
    ) {
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
