import Attendance from "../../attendance/models/attendance.model";
import Child from "../../../shared/models/child.model";
import CompetencyDefinition from "../../competencies/models/competency-definition.model";
import CompetencyEvaluation from "../../competencies/models/competency-evaluation.model";
import Feeding from "../../feeding/models/feeding.model";
import NutritionRecord from "../../nutrition/models/nutrition-record.model";
import OfflineSyncSnapshot from "../models/offline-sync-snapshot.model";
import OfflineSyncSnapshotPage from "../models/offline-sync-snapshot-page.model";
import PickupRecord from "../../pickup/models/pickup-record.model";
import User from "../../../shared/models/users.model";
import type mongoose from "mongoose";

export const offlineSyncRepository = {
  findChildren: (filter: Record<string, unknown>) =>
    Child.find({ ...filter, status: "Active" })
      .select(
        "firstName middleName lastName studentId dateOfBirth age gender homeAddress parentRelationship programType enrollmentDate schoolYear weight height bmi nutritionalStatus status teacher parent daycareCenter authorizedPickupPersons.firstName authorizedPickupPersons.middleName authorizedPickupPersons.lastName authorizedPickupPersons.relationship authorizedPickupPersons.customRelationship authorizedPickupPersons.phone authorizedPickupPersons.verificationStatus authorizedPickupPersons.isActive updatedAt",
      )
      .populate("parent", "firstName middleName lastName email phone")
      .populate("teacher", "firstName middleName lastName employeeId")
      .populate("daycareCenter", "name barangay code isActive")
      .lean(),
  findProfile: (userId: string) =>
    User.findById(userId)
      .select(
        "firstName middleName lastName email role phone employeeId isActive daycareCenter updatedAt",
      )
      .populate("daycareCenter", "name barangay code isActive")
      .lean(),
  findPickupHistory: (childIds: mongoose.Types.ObjectId[]) =>
    PickupRecord.find({ child: { $in: childIds } })
      .select(
        "child daycareCenter pickedUpBy.type pickedUpBy.name pickedUpBy.relationship verificationMethod verifiedByTeacher pickedUpAt notes createdAt updatedAt",
      )
      .populate("child", "firstName middleName lastName studentId")
      .populate("verifiedByTeacher", "firstName middleName lastName")
      .sort({ pickedUpAt: -1 })
      .limit(500)
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
