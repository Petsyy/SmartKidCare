import { Types, type Model } from "mongoose";
import CompetencyDefinition from "../../../models/CompetencyDefinition";
import CompetencyEvaluation from "../../../models/CompetencyEvaluation";
import { BaseRepository } from "../../../shared/repositories/base.repository";

export type CompetencySeed = {
  code: string;
  name: string;
  description: string;
  category: "Fine Motor" | "Creative Expression";
  displayOrder: number;
};

const EVALUATION_POPULATE = [
  {
    path: "entries.competency",
    select: "code name description category displayOrder",
  },
  { path: "teacher", select: "firstName middleName lastName" },
];

export class CompetencyDefinitionRepository extends BaseRepository<any> {
  constructor(model: Model<any> = CompetencyDefinition) {
    super(model);
  }

  async ensureDefaults(
    definitions: ReadonlyArray<CompetencySeed>,
  ): Promise<void> {
    await Promise.all(
      definitions.map((definition) =>
        this.model.updateOne(
          { code: definition.code },
          { $setOnInsert: definition },
          { upsert: true },
        ),
      ),
    );
  }

  async findActive(): Promise<any[]> {
    return this.model
      .find({ isActive: true })
      .sort({ category: 1, displayOrder: 1 })
      .lean();
  }

  async findActiveByIds(ids: string[]): Promise<any[]> {
    return this.model
      .find({ _id: { $in: ids }, isActive: true })
      .select("_id")
      .lean();
  }
}

export class CompetencyEvaluationRepository extends BaseRepository<any> {
  constructor(model: Model<any> = CompetencyEvaluation) {
    super(model);
  }

  async removeLegacyIndexes(): Promise<void> {
    const legacyIndexName = "child_1_teacher_1_evaluationDate_1";
    const indexes = await this.model.collection.indexes();

    if (indexes.some((index) => index.name === legacyIndexName)) {
      await this.model.collection.dropIndex(legacyIndexName);
    }
  }

  async findByChildSchoolYearAndPeriod(
    childId: string,
    schoolYear: string,
    period: string,
  ): Promise<any | null> {
    return this.model.findOne({
      child: childId,
      schoolYear,
      period,
    });
  }

  async findViewByChildSchoolYearAndPeriod(
    childId: string,
    schoolYear: string,
    period: string,
  ): Promise<any | null> {
    return this.model
      .findOne({ child: childId, schoolYear, period })
      .populate(EVALUATION_POPULATE)
      .lean();
  }

  async findByChildAndPeriod(
    childId: string,
    period: string,
  ): Promise<any | null> {
    return this.model
      .findOne({ child: childId, period })
      .sort({ updatedAt: -1 })
      .populate(EVALUATION_POPULATE)
      .lean();
  }

  async findHistoryByChild(
    childId: string,
    skip: number,
    limit: number,
  ): Promise<any[]> {
    return this.model
      .find({ child: childId, status: "submitted" })
      .sort({ evaluationDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate(EVALUATION_POPULATE)
      .lean();
  }

  async countHistoryByChild(childId: string): Promise<number> {
    return this.model.countDocuments({ child: childId, status: "submitted" });
  }

  async aggregateLatestSubmitted(filters: {
    period?: string;
    schoolYear?: string;
    centerId?: string;
  }): Promise<any[]> {
    const match: Record<string, unknown> = { status: "submitted" };
    if (filters.period) match.period = filters.period;
    if (filters.schoolYear) match.schoolYear = filters.schoolYear;
    if (filters.centerId) {
      match.daycareCenter = new Types.ObjectId(filters.centerId);
    }

    return this.model.aggregate([
      { $match: match },
      { $sort: { evaluationDate: -1, updatedAt: -1 } },
      { $group: { _id: "$child", evaluation: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$evaluation" } },
      { $project: { child: 1, entries: 1 } },
    ]);
  }

  async findSubmittedSchoolYears(centerId?: string): Promise<string[]> {
    const values = await this.model.distinct("schoolYear", {
      status: "submitted",
      ...(centerId ? { daycareCenter: centerId } : {}),
    });
    return values
      .map((value: unknown) => String(value || "").trim())
      .filter(Boolean)
      .sort((a: string, b: string) => b.localeCompare(a));
  }
}

export const competencyDefinitionRepository =
  new CompetencyDefinitionRepository();
export const competencyEvaluationRepository =
  new CompetencyEvaluationRepository();
