import { z } from "zod";
import { CONCERN_CATEGORIES, CONCERN_STATUSES } from "../../../models/ParentConcern";
import { validate } from "../../../shared/middleware/validate.middleware";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier.");
const message = z.string().trim().min(1, "Message is required.").max(2000, "Message cannot exceed 2,000 characters.");

export const createConcernSchema = z.object({
  childId: objectId,
  category: z.enum(CONCERN_CATEGORIES),
  subject: z.string().trim().min(5, "Subject must be at least 5 characters.").max(120, "Subject cannot exceed 120 characters."),
  message,
});

export const concernListQuerySchema = z.object({
  status: z.enum(CONCERN_STATUSES).optional(),
  category: z.enum(CONCERN_CATEGORIES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const concernIdParamsSchema = z.object({ id: objectId });
export const concernMessageSchema = z.object({ message });
export const concernStatusSchema = z.object({
  status: z.enum(CONCERN_STATUSES),
  note: z.string().trim().max(1000, "Note cannot exceed 1,000 characters.").optional(),
});

export const validateCreateConcern = validate(createConcernSchema);
export const validateConcernListQuery = validate(concernListQuerySchema, "query");
export const validateConcernIdParams = validate(concernIdParamsSchema, "params");
export const validateConcernMessage = validate(concernMessageSchema);
export const validateConcernStatus = validate(concernStatusSchema);
