import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const nonEmptyString = z.string().trim().min(1, "Field is required.");
const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid ID.");

export const attendanceRecordItemSchema = z
  .object({
    child: objectId,
    status: z.enum(["present", "absent", "excused"], {
      message: "Status must be present, absent, or excused.",
    }),
    excuseReason: z
      .enum(["sick", "medical_appointment", "family_emergency", "other"])
      .optional(),
    notes: z.string().trim().max(250).optional(),
  })
  .superRefine((record, context) => {
    if (record.status === "excused" && !record.excuseReason) {
      context.addIssue({
        code: "custom",
        path: ["excuseReason"],
        message: "An excuse reason is required for excused attendance.",
      });
    }
    if (
      record.status === "excused" &&
      record.excuseReason === "other" &&
      !record.notes
    ) {
      context.addIssue({
        code: "custom",
        path: ["notes"],
        message: "A note is required when the excuse reason is Other.",
      });
    }
    if (record.status !== "excused" && (record.excuseReason || record.notes)) {
      context.addIssue({
        code: "custom",
        path: ["excuseReason"],
        message: "Excuse details are allowed only for excused attendance.",
      });
    }
  });

const submitAttendanceSchema = z.object({
  clientOperationId: z.string().uuid("Invalid operation ID."),
  date: nonEmptyString,
  records: z
    .array(attendanceRecordItemSchema)
    .min(1, "At least one record is required."),
});

export const updateAttendanceSchema = z.object({
  clientOperationId: z.string().uuid("Invalid operation ID."),
  expectedVersion: z.number().int().min(0),
  records: z
    .array(attendanceRecordItemSchema)
    .min(1, "At least one record is required."),
});

const attendanceIdParamsSchema = z.object({ attendanceId: objectId });

const attendanceHistoryQuerySchema = z.object({
  childId: z.string().trim().optional(),
  date: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  datePreset: z.enum(["today", "thisWeek", "thisMonth"]).optional(),
  teacherId: objectId.optional(),
  centerId: objectId.optional(),
  search: z.string().trim().max(100).optional(),
  status: z.enum(["present", "absent", "excused"]).optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
});

export const validateSubmitAttendance = validate(submitAttendanceSchema);
export const validateUpdateAttendance = validate(updateAttendanceSchema);
export const validateAttendanceIdParams = validate(
  attendanceIdParamsSchema,
  "params",
);
export const validateAttendanceHistoryQuery = validate(
  attendanceHistoryQuerySchema,
  "query",
);
