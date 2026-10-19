import mongoose from "mongoose";
import NutritionRecord from "../../../models/NutritionRecord";
import Child from "../../../models/Child";
import {
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import {
  calculateAgeInMonths,
  calculateBmi,
  classifyNutritionalStatus,
  getManilaMeasurementDateKey,
} from "../../../shared/utils/nutrition.utils";
import type { AuthenticatedUser } from "../../../shared/types/auth.types";
import {
  assertCaptainCenter,
  assertCanAccessChild,
  assertTeacherCenter,
} from "../../../shared/services/child-access.service";
import { getSingleCenterId } from "../../../shared/services/single-center.service";
import {
  isDateKeyWithinPastDays,
  toLocalDateKey,
} from "../../../shared/utils/date.utils";

type NutritionAnalyticsRecord = {
  childId: unknown;
  schoolYear: string;
  nutritionalStatus: string;
  measurementDate?: Date;
};

export type NutritionAnalyticsSummary = {
  totalEvaluated: number;
  initiallyMalnourished: number;
  improvedToNormal: number;
  remainedMalnourished: number;
  improvementRate: number;
};

export type NutritionStatusDistribution = {
  underweightCount: number;
  severelyUnderweightCount: number;
  normalCount: number;
  overweightCount: number;
  obeseCount: number;
};

export type NutritionPeriodAnalytics = NutritionStatusDistribution & {
  submittedCount: number;
};

const nutritionPairKey = (record: NutritionAnalyticsRecord) =>
  `${String(record.childId)}|${String(record.schoolYear)}`;

const getManilaDayRange = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, day) - 8 * 60 * 60 * 1000);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
};

const MANILA_OFFSET_MINUTES = 8 * 60;
const MAX_BACKDATE_DAYS = 7;

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === 11000;

export const selectLatestNutritionRecords = <
  T extends NutritionAnalyticsRecord,
>(
  records: T[],
): T[] => {
  const latestByChildAndYear = new Map<string, T>();
  records.forEach((record) => {
    const key = nutritionPairKey(record);
    const current = latestByChildAndYear.get(key);
    if (
      !current ||
      new Date(record.measurementDate || 0).getTime() >
        new Date(current.measurementDate || 0).getTime()
    ) {
      latestByChildAndYear.set(key, record);
    }
  });
  return Array.from(latestByChildAndYear.values());
};

const selectLatestRecordsBeforeFinal = <T extends NutritionAnalyticsRecord>(
  records: T[],
  finalRecords: NutritionAnalyticsRecord[],
): T[] => {
  const finalByPair = new Map(
    selectLatestNutritionRecords(finalRecords).map((record) => [
      nutritionPairKey(record),
      record,
    ]),
  );
  return selectLatestNutritionRecords(
    records.filter((record) => {
      const final = finalByPair.get(nutritionPairKey(record));
      if (!final?.measurementDate || !record.measurementDate)
        return Boolean(final);
      return (
        new Date(record.measurementDate).getTime() <=
        new Date(final.measurementDate).getTime()
      );
    }),
  );
};

export const summarizeNutritionAnalytics = (
  initialRecords: NutritionAnalyticsRecord[],
  finalRecords: NutritionAnalyticsRecord[],
): NutritionAnalyticsSummary => {
  const finalRecordMap = new Map(
    selectLatestNutritionRecords(finalRecords).map((record) => [
      nutritionPairKey(record),
      record,
    ]),
  );

  let totalEvaluated = 0;
  let initiallyMalnourished = 0;
  let improvedToNormal = 0;
  let remainedMalnourished = 0;

  const isMalnourished = (status: string) =>
    ["Underweight", "Severely Underweight"].includes(status);

  for (const initial of selectLatestNutritionRecords(initialRecords)) {
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

export const summarizeLatestNutritionStatuses = (
  records: Array<{
    childId: unknown;
    nutritionalStatus: string;
    measurementDate?: Date;
  }>,
) => {
  const latestByChild = new Map<string, (typeof records)[number]>();
  records.forEach((record) => {
    const key = String(record.childId);
    const current = latestByChild.get(key);
    if (
      !current ||
      new Date(record.measurementDate || 0).getTime() >
        new Date(current.measurementDate || 0).getTime()
    ) {
      latestByChild.set(key, record);
    }
  });

  return Array.from(latestByChild.values()).reduce(
    (counts, record) => {
      switch (record.nutritionalStatus) {
        case "Underweight":
          counts.underweightCount += 1;
          break;
        case "Severely Underweight":
          counts.severelyUnderweightCount += 1;
          break;
        case "Normal":
          counts.normalCount += 1;
          break;
        case "Overweight":
          counts.overweightCount += 1;
          break;
        case "Obese":
          counts.obeseCount += 1;
          break;
      }
      return counts;
    },
    {
      underweightCount: 0,
      severelyUnderweightCount: 0,
      normalCount: 0,
      overweightCount: 0,
      obeseCount: 0,
    },
  );
};

const summarizePeriod = (
  records: Array<{
    childId: unknown;
    nutritionalStatus: string;
    measurementDate?: Date;
  }>,
): NutritionPeriodAnalytics => ({
  submittedCount: new Set(records.map((record) => String(record.childId))).size,
  ...summarizeLatestNutritionStatuses(records),
});

export class NutritionService {
  public async getMyClassNutrition(
    user: AuthenticatedUser,
    schoolYear: string,
    period?: "initial" | "quarterly" | "final",
    measurementDateKey?: string,
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
      ...(period ? { period } : {}),
      status: { $in: ["draft", "submitted"] },
    })
      .sort({ measurementDate: -1 })
      .lean();

    let initialRecords: any[] = [];
    if (period === "final") {
      initialRecords = await NutritionRecord.find({
        childId: { $in: childIds },
        schoolYear,
        period: "initial",
      }).lean();
    }

    return children.map((child) => {
      const childRecords = records.filter(
        (record) => String(record.childId) === String(child._id),
      );
      const targetRecord =
        childRecords.find((record) => record.status === "submitted") ||
        childRecords[0];
      const initialRecord = initialRecords.find(
        (r) => String(r.childId) === String(child._id),
      );

      return {
        child,
        record: targetRecord || null,
        selectedRecord:
          period === "quarterly" && measurementDateKey
            ? records.find(
                (record) =>
                  String(record.childId) === String(child._id) &&
                  (record.measurementDateKey === measurementDateKey ||
                    (!record.measurementDateKey &&
                      getManilaMeasurementDateKey(record.measurementDate) ===
                        measurementDateKey)),
              ) || null
            : targetRecord || null,
        initialRecord: initialRecord || null,
      };
    });
  }

  public async evaluateNutrition(
    user: AuthenticatedUser,
    payload: {
      childId: string;
      schoolYear: string;
      period?: "initial" | "quarterly" | "final";
      measurementDate?: string;
      weight: number;
      height: number;
      action: "draft" | "submit";
    },
  ) {
    const {
      childId,
      schoolYear,
      period,
      measurementDate,
      weight,
      height,
      action,
    } = payload;
    const daycareCenterId = assertTeacherCenter(user);

    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child not found");
    assertCanAccessChild(user, child);
    if (child.status !== "Active") {
      throw new ValidationError(
        "This child is archived and cannot receive new records.",
      );
    }

    const normalizedMeasurementDate = measurementDate
      ? new Date(measurementDate)
      : new Date();
    if (Number.isNaN(normalizedMeasurementDate.getTime())) {
      throw new ValidationError("Measurement date is invalid.");
    }
    const measurementDateKey = getManilaMeasurementDateKey(
      normalizedMeasurementDate,
    );
    const todayKey = toLocalDateKey(new Date(), MANILA_OFFSET_MINUTES);
    if (
      !isDateKeyWithinPastDays(
        measurementDateKey,
        todayKey,
        MAX_BACKDATE_DAYS,
      )
    ) {
      throw new ValidationError(
        "Measurement date must be today or within the previous 7 days.",
      );
    }
    const measurementDayRange = getManilaDayRange(measurementDateKey);

    const existingRecord = await NutritionRecord.findOne(
      period === "quarterly" || !period
        ? {
            childId,
            schoolYear,
            ...(period ? { period } : {}),
            $or: [
              { measurementDateKey },
              {
                measurementDateKey: { $exists: false },
                measurementDate: {
                  $gte: measurementDayRange.start,
                  $lt: measurementDayRange.end,
                },
              },
            ],
          }
        : { childId, schoolYear, period },
    );

    if (existingRecord?.status === "submitted") {
      throw new ValidationError(
        period === "quarterly"
          ? "A submitted quarterly nutrition record already exists for this measurement date."
          : `A submitted ${period} nutrition record already exists for this school year.`,
      );
    }

    const bmi = calculateBmi(weight, height);
    const ageInMonths = calculateAgeInMonths(
      new Date(child.dateOfBirth),
      normalizedMeasurementDate,
    );
    const nutritionalStatus =
      classifyNutritionalStatus(bmi, ageInMonths, child.gender) || "Normal";
    const status = action === "submit" ? "submitted" : "draft";
    const submittedAt = action === "submit" ? new Date() : null;

    if (existingRecord) {
      existingRecord.weight = weight;
      existingRecord.height = height;
      existingRecord.bmi = bmi;
      existingRecord.nutritionalStatus = nutritionalStatus;
      existingRecord.ageInMonths = ageInMonths;
      existingRecord.sex = child.gender;
      existingRecord.status = status;
      existingRecord.recordedBy = new mongoose.Types.ObjectId(user.id) as never;
      existingRecord.daycareCenter = new mongoose.Types.ObjectId(
        daycareCenterId,
      ) as never;
      existingRecord.measurementDate = normalizedMeasurementDate;
      existingRecord.measurementDateKey = measurementDateKey;
      if (submittedAt) existingRecord.submittedAt = submittedAt;

      await existingRecord.save();
      if (status === "submitted") {
        child.weight = weight;
        child.height = height;
        child.bmi = bmi;
        child.nutritionalStatus = nutritionalStatus;
        await child.save();
      }
      return existingRecord;
    }

    let newRecord;
    try {
      newRecord = await NutritionRecord.create({
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
        ageInMonths,
        sex: child.gender,
        measurementDate: normalizedMeasurementDate,
        measurementDateKey,
        submittedAt,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ValidationError(
          period === "quarterly"
            ? "A quarterly nutrition record already exists for this measurement date."
            : `A ${period} nutrition record already exists for this school year.`,
        );
      }
      throw error;
    }

    if (status === "submitted") {
      child.weight = weight;
      child.height = height;
      child.bmi = bmi;
      child.nutritionalStatus = nutritionalStatus;
      await child.save();
    }

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
      status: "submitted",
      ...(user.role === "teacher"
        ? { recordedBy: user.id, daycareCenter: user.daycareCenterId }
        : {}),
    })
      .sort({ measurementDate: -1, schoolYear: -1 })
      .lean();
  }

  public async getNutritionAnalytics(
    user: AuthenticatedUser,
    schoolYear?: string,
  ) {
    const centerId = await getSingleCenterId();
    assertCaptainCenter(user, centerId);
    const centerFilter = { daycareCenter: centerId };
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
      selectedSchoolYear === "all" ? {} : { schoolYear: selectedSchoolYear };

    const [initialRecords, quarterlyRecords, finalRecords, submittedRecords] =
      await Promise.all([
        NutritionRecord.find({
          ...schoolYearFilter,
          period: "initial",
          status: "submitted",
          ...centerFilter,
        }).lean(),
        NutritionRecord.find({
          ...schoolYearFilter,
          period: "quarterly",
          status: "submitted",
          ...centerFilter,
        }).lean(),
        NutritionRecord.find({
          ...schoolYearFilter,
          period: "final",
          status: "submitted",
          ...centerFilter,
        }).lean(),
        NutritionRecord.find({
          ...schoolYearFilter,
          status: "submitted",
          ...centerFilter,
        })
          .select("childId schoolYear period nutritionalStatus measurementDate")
          .lean(),
      ]);
    const latestQuarterlyRecords = selectLatestNutritionRecords(
      quarterlyRecords as NutritionAnalyticsRecord[],
    );
    const quarterlyRecordsBeforeFinal = selectLatestRecordsBeforeFinal(
      quarterlyRecords as NutritionAnalyticsRecord[],
      finalRecords as NutritionAnalyticsRecord[],
    );
    const summary = summarizeNutritionAnalytics(
      initialRecords as NutritionAnalyticsRecord[],
      finalRecords as NutritionAnalyticsRecord[],
    );
    const comparisons = {
      initialToQuarterly: summarizeNutritionAnalytics(
        initialRecords as NutritionAnalyticsRecord[],
        latestQuarterlyRecords,
      ),
      quarterlyToFinal: summarizeNutritionAnalytics(
        quarterlyRecordsBeforeFinal,
        finalRecords as NutritionAnalyticsRecord[],
      ),
      initialToFinal: summary,
    };
    const periods = {
      initial: summarizePeriod(initialRecords),
      quarterly: summarizePeriod(quarterlyRecords),
      final: summarizePeriod(finalRecords),
    };
    const latestStatuses = summarizeLatestNutritionStatuses(
      submittedRecords as Array<{
        childId: unknown;
        nutritionalStatus: string;
        measurementDate?: Date;
      }>,
    );

    return {
      filters: {
        schoolYear: selectedSchoolYear,
        centerId,
      },
      schoolYears,
      totalSubmitted: new Set(
        submittedRecords.map(
          (record) =>
            `${String(record.childId)}|${String(record.schoolYear)}|${String(record.period)}`,
        ),
      ).size,
      assessedStudents: new Set(
        submittedRecords.map((record) => String(record.childId)),
      ).size,
      periods,
      comparisons,
      ...summary,
      ...latestStatuses,
    };
  }
}

export const nutritionService = new NutritionService();
