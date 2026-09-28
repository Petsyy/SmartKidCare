import Attendance from "../../../models/Attendance";
import Child from "../../../models/Child";
import CompetencyDefinition from "../../../models/CompetencyDefinition";
import CompetencyEvaluation from "../../../models/CompetencyEvaluation";
import Feeding from "../../../models/Feeding";
import NutritionRecord from "../../../models/NutritionRecord";
import OfflineSyncSnapshot from "../../../models/OfflineSyncSnapshot";
import OfflineSyncSnapshotPage from "../../../models/OfflineSyncSnapshotPage";
import type mongoose from "mongoose";

export const offlineSyncRepository = {
  findChildren: (filter: Record<string, unknown>) =>
    Child.find(filter)
      .select(
        "firstName middleName lastName dateOfBirth age gender enrollmentDate schoolYear weight height bmi nutritionalStatus status teacher parent updatedAt",
      )
      .lean(),
  findAttendance: (filter: Record<string, unknown>) =>
    Attendance.find(filter)
      .populate("teacher", "firstName lastName")
      .sort({ date: 1 })
      .lean(),
  findFeeding: (filter: Record<string, unknown>) =>
    Feeding.find(filter)
      .populate("teacher", "firstName lastName")
      .sort({ date: 1 })
      .lean(),
  findNutrition: (childIds: mongoose.Types.ObjectId[]) =>
    NutritionRecord.find({ childId: { $in: childIds } })
      .sort({ measurementDate: 1 })
      .lean(),
  findDefinitions: () =>
    CompetencyDefinition.find({ isActive: true })
      .sort({ category: 1, displayOrder: 1 })
      .lean(),
  findEvaluations: (childIds: mongoose.Types.ObjectId[]) =>
    CompetencyEvaluation.find({ child: { $in: childIds }, status: "submitted" })
      .populate("teacher", "firstName middleName lastName")
      .sort({ evaluationDate: 1 })
      .lean(),
  createSnapshot: (value: Record<string, unknown>) =>
    OfflineSyncSnapshot.create(value),
  createPages: (values: Record<string, unknown>[]) =>
    OfflineSyncSnapshotPage.insertMany(values),
  findSnapshot: (snapshotId: string, ownerId: string) =>
    OfflineSyncSnapshot.findOne({ _id: snapshotId, owner: ownerId }).lean(),
  findPage: (
    snapshotId: string,
    ownerId: string,
    resource: string,
    pageIndex: number,
  ) =>
    OfflineSyncSnapshotPage.findOne({
      snapshot: snapshotId,
      owner: ownerId,
      resource,
      pageIndex,
    }).lean(),
  deleteSnapshot: async (snapshotId: string, ownerId: string) => {
    const snapshot = await OfflineSyncSnapshot.findOneAndDelete({
      _id: snapshotId,
      owner: ownerId,
    });
    if (snapshot)
      await OfflineSyncSnapshotPage.deleteMany({
        snapshot: snapshot._id,
        owner: ownerId,
      });
    return Boolean(snapshot);
  },
};
