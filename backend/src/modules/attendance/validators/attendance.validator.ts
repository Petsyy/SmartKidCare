import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const nonEmptyString = z.string().trim().min(1, "Field is required.");

const attendanceRecordItemSchema = z.object({
  child: nonEmptyString,
  status: z.enum(["present", "absent"], {
    message: "Status must be either 'present' or 'absent'.",
  }),
  notes: z.string().trim().optional(),
});

const submitAttendanceSchema = z.object({
  date: nonEmptyString,
  records: z
    .array(attendanceRecordItemSchema)
    .min(1, "At least one record is required."),
});

const attendanceHistoryQuerySchema = z.object({
  childId: z.string().trim().optional(),
  date: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  teacherId: z.string().trim().optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
});

export const validateSubmitAttendance = validate(submitAttendanceSchema);
export const validateAttendanceHistoryQuery = validate(
  attendanceHistoryQuerySchema,
  "query",
);
