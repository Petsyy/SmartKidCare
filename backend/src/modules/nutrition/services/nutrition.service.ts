import mongoose from "mongoose";
import NutritionRecord from "../../../models/NutritionRecord";
import Child from "../../../models/Child";
import { NotFoundError, ValidationError } from "../../../shared/errors/app-error";
import { calculateBmi, classifyNutritionalStatus } from "../../../shared/utils/nutrition.utils";

export class NutritionService {
  public async getMyClassNutrition(
    teacherId: string,
    schoolYear: string,
    period: "initial" | "final",
  ) {
    const children = await Child.find({ teacher: teacherId, status: "Active" })
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

  public async evaluateNutrition(payload: {
    childId: string;
    schoolYear: string;
    period: "initial" | "final";
    teacherId: string;
    weight: number;
    height: number;
    action: "draft" | "submit";
  }) {
    const { childId, schoolYear, period, teacherId, weight, height, action } =
      payload;

    const child = await Child.findById(childId);
    if (!child) throw new NotFoundError("Child not found");

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
        teacherId,
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
      recordedBy: teacherId,
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

  public async getChildNutritionHistory(childId: string) {
    return NutritionRecord.find({ childId })
      .sort({ schoolYear: -1, period: 1 })
      .lean();
  }

  public async getNutritionAnalytics(schoolYear: string) {
    const initialRecords = await NutritionRecord.find({
      schoolYear,
      period: "initial",
      status: "submitted",
    }).lean();
    const finalRecords = await NutritionRecord.find({
      schoolYear,
      period: "final",
      status: "submitted",
    }).lean();

    const finalRecordMap = new Map(
      finalRecords.map((r) => [String(r.childId), r]),
    );

    let totalStudents = 0;
    let initiallyMalnourished = 0;
    let improvedToNormal = 0;
    let remainedMalnourished = 0;

    for (const initial of initialRecords) {
      const final = finalRecordMap.get(String(initial.childId));
      if (!final) continue;

      totalStudents++;

      const isMalnourished = (status: string) =>
        ["Underweight", "Severely Underweight"].includes(status);

      if (isMalnourished(initial.nutritionalStatus)) {
        initiallyMalnourished++;
        if (final.nutritionalStatus === "Normal") {
          improvedToNormal++;
        } else {
          remainedMalnourished++;
        }
      }
    }

    return {
      totalEvaluated: totalStudents,
      initiallyMalnourished,
      improvedToNormal,
      remainedMalnourished,
      improvementRate:
        initiallyMalnourished > 0
          ? (improvedToNormal / initiallyMalnourished) * 100
          : 0,
    };
  }
}

export const nutritionService = new NutritionService();
