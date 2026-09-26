import type { Request } from "express";
import {
  ValidationError,
  ForbiddenError,
  NotFoundError,
} from "../../../shared/errors/app-error";
import {
  childRepository,
  feedingRepository,
  findChildIdsByParent,
  findFeedingHistory,
  findFeedingById,
} from "../repositories/feeding.repository";
import { notifyFeedingSubmitted } from "../../notifications/services/record-event-notification.service";
import {
  parsePositiveInt,
  shouldPaginate,
  formatChildName,
  getDateRangeFromPreset,
} from "../../../shared/utils/records.utils";
import {
  RecordServiceSupport,
  recordServiceSupport,
} from "../../../shared/services/record-service-support";
import type { FeedingAuthUser, AuthUser, SubmitFeedingInput, FeedingResult, PaginatedResult, FeedingServiceDependencies } from "../types/feeding.types";
import { assertTeacherCenter } from "../../../shared/services/child-access.service";

const submitFeedingOperation = async (
  user: AuthUser,
  input: SubmitFeedingInput,
  dependencies: FeedingServiceDependencies,
): Promise<FeedingResult> => {
  const { date, foodServed, records } = input;
  const daycareCenterId = assertTeacherCenter(user as any);

  const normalizedRecords = (records as any[]).map((record: any) => ({
    ...record,
    child: dependencies.support.resolveChildId(record?.child),
    notes: String(record?.notes ?? "").trim(),
  }));

  const hasMissingChildId = normalizedRecords.some(
    (record: any) => !String(record.child || "").trim(),
  );
  if (hasMissingChildId) {
    throw new ForbiddenError(
      "One or more children are not assigned to this teacher. Submission rejected.",
    );
  }

  const childIds = Array.from(
    new Set(
      normalizedRecords
        .map((record: any) => String(record.child || "").trim())
        .filter(Boolean),
    ),
  );
  if (!childIds.length) {
    throw new ForbiddenError(
      "One or more children are not assigned to this teacher. Submission rejected.",
    );
  }

  const dayRange = dependencies.support.parseDayRange(date);
  if (!dayRange) {
    throw new ValidationError(
      "Invalid date format. Use ISO date or YYYY-MM-DD.",
    );
  }

  const manilaNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const todayStartMs =
    Date.UTC(
      manilaNow.getUTCFullYear(),
      manilaNow.getUTCMonth(),
      manilaNow.getUTCDate(),
    ) -
    8 * 60 * 60 * 1000;
  const earliestAllowedStart = new Date(
    todayStartMs - 6 * 24 * 60 * 60 * 1000,
  );
  if (dayRange.start < earliestAllowedStart || dayRange.start > new Date(todayStartMs + 24 * 60 * 60 * 1000 - 1)) {
    throw new ValidationError(
      "Feeding records can only be submitted within the last 7 days.",
    );
  }

  const assignedIds = await dependencies.childRepository.findAssignedChildIds(
    childIds,
    user.id,
    daycareCenterId,
  );
  const assignedChildIdSet = new Set(assignedIds);
  const hasUnauthorizedChild = childIds.some(
    (childId) => !assignedChildIdSet.has(childId),
  );

  if (hasUnauthorizedChild) {
    throw new ForbiddenError(
      "One or more children are not assigned to this teacher. Submission rejected.",
    );
  }

  const feedingDate = dayRange.start;
  const existing = await dependencies.feedingRepository.findByTeacherAndDay(
    user.id,
    dayRange,
    daycareCenterId,
  );

  if (existing) {
    existing.foodServed = String(foodServed);
    existing.records = normalizedRecords as any;
    existing.daycareCenter = daycareCenterId as any;
    await existing.save();

    void dependencies
      .notifySubmitted({
        date: existing.date || feedingDate,
        foodServed: String(foodServed),
        records: normalizedRecords as Array<{
          child: unknown;
          status: "completed" | "missed";
          notes?: string;
        }>,
      })
      .catch((error) =>
        console.error("Feeding notification dispatch failed:", error),
      );

    return { isUpdate: true, feeding: existing };
  }

  const feeding = await dependencies.feedingRepository.create({
    date: feedingDate,
    teacher: user.id,
    daycareCenter: daycareCenterId,
    foodServed: String(foodServed),
    records: normalizedRecords,
  });

  void dependencies
    .notifySubmitted({
      date: feedingDate,
      foodServed: String(foodServed),
      records: normalizedRecords as Array<{
        child: unknown;
        status: "completed" | "missed";
        notes?: string;
      }>,
    })
    .catch((error) =>
      console.error("Feeding notification dispatch failed:", error),
    );

  return { isUpdate: false, feeding };
};

const getFeedingHistoryOperation = async (
  user: AuthUser | undefined,
  queryInput: Request["query"],
  dependencies: FeedingServiceDependencies,
): Promise<any[] | PaginatedResult<any>> => {
  const validUser = dependencies.support.assertAuthenticated(user);
  const { startDate, endDate, datePreset, teacherId } = queryInput;
  const query: Record<string, unknown> = {};
  let parentChildIds: string[] = [];
  const teacherFilter = dependencies.support.parseTeacherIdQuery(teacherId);

  if (validUser.role === "teacher") {
    const daycareCenterId = assertTeacherCenter(validUser as any);
    query.teacher = validUser.id;
    query.daycareCenter = daycareCenterId;
  } else if (validUser.role === "barangay_captain") {
    if (!validUser.daycareCenterId) {
      throw new ForbiddenError("Barangay Captain has no center assignment.");
    }
    query.daycareCenter = validUser.daycareCenterId;
    if (teacherFilter) query.teacher = teacherFilter;
  } else if (validUser.role === "parent") {
    parentChildIds = await dependencies.findChildIdsByParent(validUser.id);
    if (parentChildIds.length) {
      query["records.child"] = { $in: parentChildIds };
    }
  }

  const baseQuery = { ...query };

  if (startDate && endDate) {
    const startRange = dependencies.support.parseDayRange(startDate);
    const endRange = dependencies.support.parseDayRange(endDate);
    if (!startRange || !endRange) {
      throw new ValidationError("Invalid date range.");
    }
    query.date = {
      $gte: startRange.start,
      $lte: endRange.end,
    };
  } else if (datePreset) {
    const range = getDateRangeFromPreset(String(datePreset));
    if (range) {
      query.date = { $gte: range.start, $lte: range.end };
    }
  }

  if (validUser.role === "parent" && !parentChildIds.length) {
    if (shouldPaginate(queryInput)) {
      return {
        data: [],
        pagination: {
          page: parsePositiveInt(queryInput.page, 1),
          limit: parsePositiveInt(queryInput.limit, 25),
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
    return [];
  }

  const [feeding, rawFoodOptions] = await Promise.all([
    dependencies.findHistory(query),
    dependencies.feedingRepository.distinct("foodServed", baseQuery),
  ]);
  let scoped = feeding;
  if (validUser.role === "parent") {
    const allowedChildIds = new Set(parentChildIds);
    scoped = feeding
      .map((entry: any) => {
        const records = Array.isArray(entry.records)
          ? entry.records.filter((record: any) => {
              const childValue = record?.child;
              const childId =
                childValue && typeof childValue === "object"
                  ? String(childValue._id ?? "")
                  : String(childValue ?? "");
              return allowedChildIds.has(childId);
            })
          : [];
        return { ...entry, records };
      })
      .filter((entry: any) => entry.records.length > 0);
  }

  if (!shouldPaginate(queryInput)) return scoped;

  const { page, limit, search, status, foodServed } = queryInput;
  const currentPage = parsePositiveInt(page, 1);
  const currentLimit = parsePositiveInt(limit, 25);
  const normalizedSearch = String(search || "")
    .trim()
    .toLowerCase();
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();
  const normalizedFoodServed = String(foodServed || "")
    .trim()
    .toLowerCase();

  const flatRows = scoped.flatMap((entry: any, entryIndex: number) =>
    (Array.isArray(entry.records) ? entry.records : []).map(
      (record: any, recordIndex: number) => {
        const child =
          record?.child && typeof record.child === "object"
            ? record.child
            : null;
        const childId = String(
          child?._id ?? record?.child ?? `${entryIndex}-${recordIndex}`,
        );
        return {
          id: `${entry._id}-${childId}`,
          date: entry.date,
          studentId: child?.studentId ?? "--",
          childName: formatChildName(child),
          foodServed: entry.foodServed || "",
          status: record.status,
          notes: String(record?.notes ?? "").trim(),
          teacherName: entry.teacher
            ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
            : "--",
          submittedAt: entry.updatedAt || entry.createdAt || entry.date,
        };
      },
    ),
  );

  const filteredRows = normalizedSearch
    ? flatRows.filter((row: any) => {
        const searchableDateKeys = dependencies.support.buildSearchDateKeys(
          row.date,
        );
        return (
          String(row.childName).toLowerCase().includes(normalizedSearch) ||
          String(row.studentId).toLowerCase().includes(normalizedSearch) ||
          String(row.foodServed).toLowerCase().includes(normalizedSearch) ||
          String(row.status).toLowerCase().includes(normalizedSearch) ||
          String(row.teacherName).toLowerCase().includes(normalizedSearch) ||
          searchableDateKeys.some((dateKey) =>
            dateKey.includes(normalizedSearch),
          )
        );
      })
    : flatRows;

  const foodOptions = Array.from(
    new Set(
      rawFoodOptions
        .map((f: any) => String(f || "").trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  const foodFilteredRows = normalizedFoodServed
    ? filteredRows.filter(
        (row: any) =>
          String(row.foodServed || "").trim().toLowerCase() ===
          normalizedFoodServed,
      )
    : filteredRows;

  const statusFilteredRows =
    normalizedStatus === "completed" || normalizedStatus === "missed"
      ? foodFilteredRows.filter((row: any) => row.status === normalizedStatus)
      : foodFilteredRows;

  const total = statusFilteredRows.length;
  const totalPages = total > 0 ? Math.ceil(total / currentLimit) : 0;
  const safePage =
    totalPages > 0 ? Math.min(currentPage, totalPages) : currentPage;
  const start = (safePage - 1) * currentLimit;
  const data = statusFilteredRows.slice(start, start + currentLimit);

  return {
    data,
    foodOptions,
    pagination: {
      page: safePage,
      limit: currentLimit,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1 && totalPages > 0,
    },
  };
};

const updateFeedingRecordOperation = async (
  user: AuthUser | undefined,
  id: unknown,
  body: Record<string, unknown>,
  dependencies: FeedingServiceDependencies,
): Promise<{ message: string }> => {
  const status = body.status as "completed" | "missed";
  const notes = body.notes;
  const validUser = dependencies.support.assertPrivileged(user);
  const parsedId = dependencies.support.parseCompositeId(id);

  const feeding = await dependencies.findById(parsedId.parentId);
  if (!feeding) throw new NotFoundError("Feeding");
  if (!dependencies.support.canMutateTeacherRecord(validUser, feeding.teacher))
    throw new ForbiddenError("Forbidden");

  const record = feeding.records.find(
    (row: any) =>
      String(row.child) === parsedId.childId ||
      String(row.child?._id) === parsedId.childId,
  );
  if (!record) throw new NotFoundError("Child record");

  const nextNotes = typeof notes === "string" ? notes.trim() : undefined;

  if (record.status !== status || nextNotes !== undefined) {
    record.status = status;
    if (nextNotes !== undefined) {
      record.notes = nextNotes;
    }
    feeding.markModified("records");
    await feeding.save();
  }

  return { message: "Feeding record updated" };
};

const deleteFeedingRecordOperation = async (
  user: AuthUser | undefined,
  id: unknown,
  dependencies: FeedingServiceDependencies,
): Promise<{ message: string }> => {
  const validUser = dependencies.support.assertPrivileged(user);
  const parsedId = dependencies.support.parseCompositeId(id);

  const feeding = await dependencies.findById(parsedId.parentId);
  if (!feeding) throw new NotFoundError("Feeding");
  if (!dependencies.support.canMutateTeacherRecord(validUser, feeding.teacher))
    throw new ForbiddenError("Forbidden");

  const initialLength = feeding.records.length;
  feeding.records.pull({ child: parsedId.childId });

  if (feeding.records.length === initialLength)
    throw new NotFoundError("Child record");

  feeding.markModified("records");
  await feeding.save();

  return { message: "Feeding record deleted" };
};
const defaultFeedingDependencies: FeedingServiceDependencies = {
  support: recordServiceSupport,
  childRepository,
  feedingRepository,
  findChildIdsByParent,
  findHistory: findFeedingHistory,
  findById: findFeedingById,
  notifySubmitted: notifyFeedingSubmitted,
};

export class FeedingService {
  constructor(private readonly dependencies: FeedingServiceDependencies) {}

  submit(user: AuthUser, input: SubmitFeedingInput): Promise<FeedingResult> {
    return submitFeedingOperation(user, input, this.dependencies);
  }

  getHistory(
    user: AuthUser | undefined,
    query: Request["query"],
  ): Promise<any[] | PaginatedResult<any>> {
    return getFeedingHistoryOperation(user, query, this.dependencies);
  }

  updateRecord(
    user: AuthUser | undefined,
    id: unknown,
    body: Record<string, unknown>,
  ): Promise<{ message: string }> {
    return updateFeedingRecordOperation(user, id, body, this.dependencies);
  }

  deleteRecord(
    user: AuthUser | undefined,
    id: unknown,
  ): Promise<{ message: string }> {
    return deleteFeedingRecordOperation(user, id, this.dependencies);
  }
}

export const feedingService = new FeedingService(defaultFeedingDependencies);
export const submitFeeding = feedingService.submit.bind(feedingService);
export const getFeedingHistory = feedingService.getHistory.bind(feedingService);
export const updateFeedingRecord =
  feedingService.updateRecord.bind(feedingService);
export const deleteFeedingRecord =
  feedingService.deleteRecord.bind(feedingService);

export type { FeedingAuthUser, SubmitFeedingInput, FeedingResult, PaginatedResult, FeedingServiceDependencies } from "../types/feeding.types";
