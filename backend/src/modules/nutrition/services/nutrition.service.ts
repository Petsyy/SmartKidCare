import mongoose from "mongoose";
import NutritionRecord from "../../../models/NutritionRecord";
import Child from "../../../models/Child";
import { NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import {
  calculateAgeInMonths,
  calculateBmi,
  classifyNutritionalStatus,
} from "../../../shared/utils/nutrition.utils";
import type { AuthenticatedUser } from "../../../shared/types/auth.types";
import {
  assertCaptainCenter,
  assertCanAccessChild,
  assertTeacherCenter,
} from "../../../shared/services/child-access.service";
import { getSingleCenterId } from "../../../shared/services/single-center.service";

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

export const summarizeLatestNutritionStatuses = (
  records: Array<{ childId: unknown; nutritionalStatus: string; measurementDate?: Date }>,
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

export class NutritionService {
  public async getMyClassNutrition(
    user: AuthenticatedUser,
    schoolYear: string,
    period?: "initial" | "quarterly" | "final",
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
    period?: "initial" | "quarterly" | "final";
    measurementDate?: string;
    weight: number;
    height: number;
    action: "draft" | "submit";
  }) {
    const { childId, schoolYear, period, measurementDate, weight, height, action } = payload;
    const daycareCenterId = assertTeacherCenter(user);

    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child not found");
    assertCanAccessChild(user, child);

    const normalizedMeasurementDate = measurementDate
      ? new Date(measurementDate)
      : new Date();
    if (Number.isNaN(normalizedMeasurementDate.getTime())) {
      throw new ValidationError("Measurement date is invalid.");
    }
    const measurementDayStart = new Date(normalizedMeasurementDate);
    measurementDayStart.setHours(0, 0, 0, 0);
    const measurementDayEnd = new Date(measurementDayStart);
    measurementDayEnd.setDate(measurementDayEnd.getDate() + 1);

    const existingRecord = period
      ? await NutritionRecord.findOne({ childId, schoolYear, period })
      : await NutritionRecord.findOne({
          childId,
          measurementDate: {
            $gte: measurementDayStart,
            $lt: measurementDayEnd,
          },
        });

    if (existingRecord?.status === "submitted") {
      throw new ValidationError(
        `A submitted ${period} nutrition record already exists for this school year.`,
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
      existingRecord.recordedBy = new mongoose.Types.ObjectId(
        user.id,
      ) as never;
      existingRecord.daycareCenter = new mongoose.Types.ObjectId(
        daycareCenterId,
      ) as never;
      existingRecord.measurementDate = normalizedMeasurementDate;
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
      ageInMonths,
      sex: child.gender,
      measurementDate: normalizedMeasurementDate,
      submittedAt,
    });

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
      selectedSchoolYear === "all"
        ? {}
        : { schoolYear: selectedSchoolYear };

    const [initialRecords, finalRecords, submittedRecords] = await Promise.all([
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
      NutritionRecord.find({
        ...schoolYearFilter,
        status: "submitted",
        ...centerFilter,
      })
        .select("childId nutritionalStatus measurementDate")
        .lean(),
    ]);
    const summary = summarizeNutritionAnalytics(
      initialRecords as NutritionAnalyticsRecord[],
      finalRecords as NutritionAnalyticsRecord[],
    );
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
      ...summary,
      ...latestStatuses,
    };
  }
}

export const nutritionService = new NutritionService();
