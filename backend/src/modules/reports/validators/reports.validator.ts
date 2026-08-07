import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD.");

export const reportQuerySchema = z.object({
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  datePreset: z.string().trim().optional(),
});

export const adminReportQuerySchema = z
  .object({
    startDate: dateKey.optional(),
    endDate: dateKey.optional(),
    datePreset: z.enum(["7d", "30d", "90d", "all"]).default("30d"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .superRefine((value, context) => {
    const hasStart = Boolean(value.startDate);
    const hasEnd = Boolean(value.endDate);
    if (hasStart !== hasEnd) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both startDate and endDate are required for a custom range.",
      });
      return;
    }
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "startDate must be on or before endDate.",
      });
    }
  });

export const validateReportQuery = validate(reportQuerySchema, "query");
export const validateAdminReportQuery = validate(adminReportQuerySchema, "query");
