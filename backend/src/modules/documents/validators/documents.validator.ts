import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const accessParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid child ID"),
  documentType: z.enum(["birth-certificate", "parent-id"]),
});

const viewQuerySchema = z.object({
  token: z.string().uuid("Invalid document token"),
});

export const validateDocumentAccessParams = validate(accessParamsSchema, "params");
export const validateDocumentViewQuery = validate(viewQuerySchema, "query");
