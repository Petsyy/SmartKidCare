import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID.");
const entry = z.object({
  competencyId: objectId,
  level: z.enum(["not_demonstrated", "emerging", "developing", "achieved"]),
  remarks: z.string().trim().max(500).optional(),
});

export const competencyEvaluationSchema = z.object({
  childId: objectId,
  evaluationDate: z.string().trim().min(1),
  period: z.enum(["initial", "midyear", "final"]),
  status: z.enum(["draft", "submitted"]).default("submitted"),
  entries: z
    .array(entry)
    .superRefine((entries, context) => {
      const ids = entries.map((item) => item.competencyId);
      if (new Set(ids).size !== ids.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each competency may only appear once.",
        });
      }
    }),
  generalNotes: z.string().trim().max(1000).optional(),
}).superRefine((data, context) => {
  if (data.status !== "submitted") return;

  data.entries.forEach((item, index) => {
    if (
      (item.level === "not_demonstrated" || item.level === "emerging") &&
      !item.remarks?.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remarks are required for Not Yet and Emerging ratings.",
        path: ["entries", index, "remarks"],
      });
    }
  });
});

const childParams = z.object({ childId: objectId });
const childAndPeriodParams = z.object({ childId: objectId, period: z.enum(["initial", "midyear", "final"]) });
const historyQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
const analyticsQuery = z.object({
  period: z.enum(["initial", "midyear", "final"]).optional(),
  schoolYear: z.string().trim().min(1).max(20).optional(),
  centerId: objectId.optional(),
});

export const validateEvaluation = validate(competencyEvaluationSchema);
export const validateChildParams = validate(childParams, "params");
export const validateChildAndPeriodParams = validate(childAndPeriodParams, "params");
export const validateHistoryQuery = validate(historyQuery, "query");
export const validateAnalyticsQuery = validate(analyticsQuery, "query");
