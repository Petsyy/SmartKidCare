import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const nonEmptyString = z.string().trim().min(1, "Field is required.");

const feedingRecordItemSchema = z.object({
  child: nonEmptyString,
  status: z.enum(["completed", "missed"], {
    message: "Status must be either 'completed' or 'missed'.",
  }),
  notes: z.string().trim().max(500, "Notes must be 500 characters or less.").optional(),
});

const submitFeedingSchema = z.object({
  date: nonEmptyString,
  foodServed: nonEmptyString,
  records: z
    .array(feedingRecordItemSchema)
    .min(1, "At least one record is required."),
});

const updateFeedingSchema = z.object({
  status: z.enum(["completed", "missed"], {
    message: "Status must be either 'completed' or 'missed'.",
  }),
  notes: z.string().trim().max(500, "Notes must be 500 characters or less.").optional(),
});

const feedingHistoryQuerySchema = z.object({
  childId: z.string().trim().optional(),
  date: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  teacherId: z.string().trim().optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
});

export const validateSubmitFeeding = validate(submitFeedingSchema);
export const validateUpdateFeeding = validate(updateFeedingSchema);
export const validateFeedingHistoryQuery = validate(
  feedingHistoryQuerySchema,
  "query",
);

