import crypto from "crypto";
import mongoose from "mongoose";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../../shared/errors/app-error";
import type { AuthenticatedUser } from "../../../shared/types/auth.types";
import { offlineSyncRepository } from "../repositories/offline-sync.repository";
import {
  OFFLINE_RESOURCES,
  type OfflineResource,
  type SnapshotResourceManifest,
} from "../types/offline-sync.types";
import { getTeacherNotificationsFeed } from "../../notifications/services/teacher-notification.service";
import { getParentNotificationsFeed } from "../../notifications/services/parent-notification.service";

const PAGE_SIZE = 100;
const SNAPSHOT_TTL_MS = 30 * 60 * 1000;
const stableJson = (value: unknown) => JSON.stringify(value);
const checksum = (items: unknown[]) =>
  crypto.createHash("sha256").update(stableJson(items)).digest("hex");
const idString = (value: unknown) => String(value ?? "");
const manilaDateKey = (value: Date | string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(value));

class OfflineSyncService {
  private assertUser(user: AuthenticatedUser | undefined) {
    if (!user || (user.role !== "teacher" && user.role !== "parent")) {
      throw new ForbiddenError(
        "Offline record synchronization is available to teachers and parents only.",
      );
    }
    return user;
  }

  async createSnapshot(userInput: AuthenticatedUser | undefined) {
    const user = this.assertUser(userInput);
    const childFilter =
      user.role === "teacher"
        ? { teacher: user.id, ...(user.daycareCenterId ? { daycareCenter: user.daycareCenterId } : {}) }
        : { parent: user.id };
    const children = await offlineSyncRepository.findChildren(childFilter);
    const childIds = children.map((child) => child._id);
    const childIdSet = new Set(childIds.map(String));
    const [attendanceRaw, feedingRaw, nutrition, definitions, evaluations, profile, pickupHistory] =
      await Promise.all([
        offlineSyncRepository.findAttendance(
          user.role === "teacher"
            ? { teacher: user.id }
            : { "records.child": { $in: childIds } },
        ),
        offlineSyncRepository.findFeeding(
          user.role === "teacher"
            ? { teacher: user.id }
            : { "records.child": { $in: childIds } },
        ),
        offlineSyncRepository.findNutrition(childIds),
        offlineSyncRepository.findDefinitions(),
        offlineSyncRepository.findEvaluations(childIds),
        offlineSyncRepository.findProfile(user.id),
        offlineSyncRepository.findPickupHistory(childIds),
      ]);
    const attendance = attendanceRaw
      .map((record) => ({ ...record, records: record.records.filter((entry) => childIdSet.has(idString(entry.child))) }))
      .filter((record) => record.records.length > 0);
    const feeding = feedingRaw
      .map((record) => ({ ...record, records: record.records.filter((entry) => childIdSet.has(idString(entry.child))) }))
      .filter((record) => record.records.length > 0);
    const guardianSummaries = children.flatMap((child: any) =>
      (child.authorizedPickupPersons || []).map((guardian: any, index: number) => ({
        _id: `${idString(child._id)}:${index}`,
        childId: idString(child._id),
        guardianIndex: index,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        relationship: guardian.relationship,
        customRelationship: guardian.customRelationship ?? null,
        phone: guardian.phone,
        verificationStatus: guardian.verificationStatus,
        isActive: guardian.isActive !== false,
      })),
    );
    const latestPickupByChild = new Map<string, any>();
    for (const pickup of pickupHistory as any[]) {
      const childId = idString((pickup.child as any)?._id ?? pickup.child);
      if (!latestPickupByChild.has(childId)) latestPickupByChild.set(childId, pickup);
    }
    const todayKey = manilaDateKey(new Date());
    const attendanceToday = attendance.find((entry: any) => manilaDateKey(entry.date) === todayKey) as any;
    const presentChildIds = new Set(
      (attendanceToday?.records || [])
        .filter((entry: any) => entry.status === "present")
        .map((entry: any) => idString(entry.child?._id ?? entry.child)),
    );
    const pickupStatuses = children.map((child: any) => {
      const childId = idString(child._id);
      const latestPickup = latestPickupByChild.get(childId);
      const pickup = latestPickup && manilaDateKey(latestPickup.pickedUpAt) === todayKey ? latestPickup : null;
      return { _id: childId, childId, eligible: presentChildIds.has(childId),
        status: pickup ? "released" : "pending", pickup };
    });
    const notificationFeed = user.role === "teacher"
      ? await getTeacherNotificationsFeed({ teacherId: user.id })
      : await getParentNotificationsFeed({ parentId: user.id });
    const notifications = notificationFeed.notifications.map((item) => ({
      ...item,
      _id: item.id,
      feedDate: notificationFeed.date,
    }));
    const resources: Record<OfflineResource, unknown[]> = {
      children,
      attendance,
      feeding,
      nutrition,
      competencyDefinitions: definitions,
      competencyEvaluations: evaluations,
      profiles: profile ? [profile] : [],
      guardianSummaries,
      enrollmentReference: [{
        _id: user.id,
        childCount: children.length,
        daycareCenter: (profile as any)?.daycareCenter ?? null,
        generatedAt: new Date().toISOString(),
      }],
      pickupStatuses,
      pickupHistory,
      notifications,
    };
    const expiresAt = new Date(Date.now() + SNAPSHOT_TTL_MS);
    const manifests: SnapshotResourceManifest[] = OFFLINE_RESOURCES.map(
      (resource) => ({
        resource,
        required: true,
        itemCount: resources[resource].length,
        pageCount: Math.ceil(resources[resource].length / PAGE_SIZE),
        checksum: checksum(resources[resource]),
      }),
    );
    const snapshot = await offlineSyncRepository.createSnapshot({
      owner: user.id,
      role: user.role,
      resources: manifests,
      expiresAt,
    });
    const pages: Record<string, unknown>[] = [];
    for (const resource of OFFLINE_RESOURCES) {
      const items = resources[resource];
      for (
        let pageIndex = 0;
        pageIndex < Math.ceil(items.length / PAGE_SIZE);
        pageIndex += 1
      ) {
        pages.push({
          snapshot: snapshot._id,
          owner: user.id,
          resource,
          pageIndex,
          items: items.slice(
            pageIndex * PAGE_SIZE,
            (pageIndex + 1) * PAGE_SIZE,
          ),
          expiresAt,
        });
      }
    }
    if (pages.length) await offlineSyncRepository.createPages(pages);
    return {
      snapshotId: String(snapshot._id),
      generatedAt: snapshot.createdAt,
      expiresAt,
      resources: manifests,
    };
  }

  async getPage(
    userInput: AuthenticatedUser | undefined,
    snapshotId: string,
    resource: string,
    cursor: number,
  ) {
    const user = this.assertUser(userInput);
    if (!mongoose.isValidObjectId(snapshotId))
      throw new ValidationError("Invalid snapshot identifier.");
    if (!OFFLINE_RESOURCES.includes(resource as OfflineResource))
      throw new ValidationError("Invalid offline resource.");
    const snapshot = await offlineSyncRepository.findSnapshot(
      snapshotId,
      user.id,
    );
    if (!snapshot || snapshot.expiresAt.getTime() <= Date.now())
      throw new NotFoundError("Offline snapshot is unavailable or expired.");
    const manifest = snapshot.resources.find(
      (entry) => entry.resource === resource,
    );
    if (!manifest) throw new NotFoundError("Offline resource is unavailable.");
    if (cursor < 0 || cursor > manifest.pageCount)
      throw new ValidationError("Invalid snapshot cursor.");
    if (manifest.pageCount === 0 || cursor === manifest.pageCount) {
      return {
        snapshotId,
        resource,
        items: [],
        nextCursor: null,
        complete: true,
      };
    }
    const page = await offlineSyncRepository.findPage(
      snapshotId,
      user.id,
      resource,
      cursor,
    );
    if (!page) throw new NotFoundError("Offline snapshot page is unavailable.");
    const next = cursor + 1;
    return {
      snapshotId,
      resource,
      items: page.items,
      nextCursor: next < manifest.pageCount ? String(next) : null,
      complete: next >= manifest.pageCount,
    };
  }

  async deleteSnapshot(
    userInput: AuthenticatedUser | undefined,
    snapshotId: string,
  ) {
    const user = this.assertUser(userInput);
    if (!mongoose.isValidObjectId(snapshotId))
      throw new ValidationError("Invalid snapshot identifier.");
    await offlineSyncRepository.deleteSnapshot(snapshotId, user.id);
  }
}

export const offlineSyncService = new OfflineSyncService();
