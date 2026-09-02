import mongoose from "mongoose";
import NutritionRecord from "../../../models/NutritionRecord";
import Child from "../../../models/Child";
import { NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { calculateBmi, classifyNutritionalStatus } from "../../../shared/utils/nutrition.utils";
import type { AuthenticatedUser } from "../../../shared/types/auth.types";
import {
  assertCanAccessChild,
  assertTeacherCenter,
} from "../../../shared/services/child-access.service";

type NutritionAnalyticsRecord = {
  childId: unknown;
  schoolYear: string;
  nutritionalStatus: string;
};

export type NutritionAnalyticsSummary = {
  totalEvaluated: number;
  initiallyMalnourished: number;
  improvedToNormal: number;
  remainedMalnourished: number;
  improvementRate: number;
};

const nutritionPairKey = (record: NutritionAnalyticsRecord) =>
  `${String(record.childId)}|${String(record.schoolYear)}`;

export const summarizeNutritionAnalytics = (
  initialRecords: NutritionAnalyticsRecord[],
  finalRecords: NutritionAnalyticsRecord[],
): NutritionAnalyticsSummary => {
  const finalRecordMap = new Map(
    finalRecords.map((record) => [nutritionPairKey(record), record]),
  );

  let totalEvaluated = 0;
  let initiallyMalnourished = 0;
  let improvedToNormal = 0;
  let remainedMalnourished = 0;

  const isMalnourished = (status: string) =>
    ["Underweight", "Severely Underweight"].includes(status);

  for (const initial of initialRecords) {
    const final = finalRecordMap.get(nutritionPairKey(initial));
    if (!final) continue;

    totalEvaluated += 1;

    if (isMalnourished(initial.nutritionalStatus)) {
      initiallyMalnourished += 1;
      if (final.nutritionalStatus === "Normal") {
        improvedToNormal += 1;
      } else {
        remainedMalnourished += 1;
      }
    }
  }

  return {
    totalEvaluated,
    initiallyMalnourished,
    improvedToNormal,
    remainedMalnourished,
    improvementRate:
      initiallyMalnourished > 0
        ? (improvedToNormal / initiallyMalnourished) * 100
        : 0,
  };
};

export class NutritionService {
  public async getMyClassNutrition(
    user: AuthenticatedUser,
    schoolYear: string,
    period: "initial" | "final",
  ) {
    const daycareCenterId = assertTeacherCenter(user);
    const children = await Child.find({
      teacher: user.id,
      daycareCenter: daycareCenterId,
      status: "Active",
    })
      .select("_id firstName middleName lastName age gender")
      .lean();

    if (!children.length) return [];

    const childIds = children.map((c) => c._id);

    const records = await NutritionRecord.find({
      childId: { $in: childIds },
      schoolYear,
      period,
    }).lean();

    let initialRecords: any[] = [];
    if (period === "final") {
      initialRecords = await NutritionRecord.find({
        childId: { $in: childIds },
        schoolYear,
        period: "initial",
      }).lean();
    }

    return children.map((child) => {
      const targetRecord = records.find(
        (r) => String(r.childId) === String(child._id),
      );
      const initialRecord = initialRecords.find(
        (r) => String(r.childId) === String(child._id),
      );

      return {
        child,
        record: targetRecord || null,
        initialRecord: initialRecord || null,
      };
    });
  }

  public async evaluateNutrition(user: AuthenticatedUser, payload: {
    childId: string;
    schoolYear: string;
    period: "initial" | "final";
    weight: number;
    height: number;
    action: "draft" | "submit";
  }) {
    const { childId, schoolYear, period, weight, height, action } =
      payload;
    const daycareCenterId = assertTeacherCenter(user);

    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child not found");
    assertCanAccessChild(user, child);

    const existingRecord = await NutritionRecord.findOne({
      childId,
      schoolYear,
      period,
    });

    if (existingRecord?.status === "submitted") {
      throw new ValidationError(
        `A submitted ${period} nutrition record already exists for this school year.`,
      );
    }

    const bmi = calculateBmi(weight, height);
    const nutritionalStatus =
      classifyNutritionalStatus(bmi, child.age) || "Normal";
    const status = action === "submit" ? "submitted" : "draft";
    const measurementDate = new Date();
    const submittedAt = action === "submit" ? new Date() : null;

    if (existingRecord) {
      existingRecord.weight = weight;
      existingRecord.height = height;
      existingRecord.bmi = bmi;
      existingRecord.nutritionalStatus = nutritionalStatus;
      existingRecord.status = status;
      existingRecord.recordedBy = new mongoose.Types.ObjectId(
        user.id,
      ) as never;
      existingRecord.daycareCenter = new mongoose.Types.ObjectId(
        daycareCenterId,
      ) as never;
      existingRecord.measurementDate = measurementDate;
      if (submittedAt) existingRecord.submittedAt = submittedAt;

      await existingRecord.save();
      return existingRecord;
    }

    const newRecord = await NutritionRecord.create({
      childId,
      schoolYear,
      period,
      recordedBy: user.id,
      daycareCenter: daycareCenterId,
      status,
      weight,
      height,
      bmi,
      nutritionalStatus,
      measurementDate,
      submittedAt,
    });

    return newRecord;
  }

  public async getChildNutritionHistory(
    user: AuthenticatedUser,
    childId: string,
  ) {
    const child = await Child.findById(childId)
      .select("teacher parent daycareCenter")
      .lean();
    assertCanAccessChild(user, child);
    return NutritionRecord.find({
      childId,
      ...(user.role === "teacher"
        ? { recordedBy: user.id, daycareCenter: user.daycareCenterId }
        : {}),
    })
      .sort({ schoolYear: -1, period: 1 })
      .lean();
  }

  public async getNutritionAnalytics(schoolYear?: string, centerId?: string) {
    const centerFilter = centerId ? { daycareCenter: centerId } : {};
    const schoolYears = (
      await NutritionRecord.distinct("schoolYear", {
        status: "submitted",
        ...centerFilter,
      })
    )
      .map((value: unknown) => String(value || "").trim())
      .filter(Boolean)
      .sort((left: string, right: string) => right.localeCompare(left));
    const selectedSchoolYear = schoolYear || schoolYears[0] || "all";
    const schoolYearFilter =
      selectedSchoolYear === "all"
        ? {}
        : { schoolYear: selectedSchoolYear };

    const [initialRecords, finalRecords] = await Promise.all([
      NutritionRecord.find({
        ...schoolYearFilter,
        period: "initial",
        status: "submitted",
        ...centerFilter,
      }).lean(),
      NutritionRecord.find({
        ...schoolYearFilter,
        period: "final",
        status: "submitted",
        ...centerFilter,
      }).lean(),
    ]);
    const summary = summarizeNutritionAnalytics(
      initialRecords as NutritionAnalyticsRecord[],
      finalRecords as NutritionAnalyticsRecord[],
    );

    return {
      filters: {
        schoolYear: selectedSchoolYear,
        centerId: centerId || null,
      },
      schoolYears,
      ...summary,
    };
  }
}

export const nutritionService = new NutritionService();
