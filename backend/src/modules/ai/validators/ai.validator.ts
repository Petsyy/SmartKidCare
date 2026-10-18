import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

export const aiChatSchema = z.object({
  role: z.unknown().optional(),
  message: z
    .string()
    .max(500, "Message is too long.")
    .refine((value) => value.trim().length > 0, "Message is required."),
  childId: z.string().optional(),
  language: z.enum(["en", "fil"]).optional(),
  languageMode: z.enum(["auto", "explicit"]).optional(),
  resetContext: z.boolean().optional().default(false),
  contextId: z.string().uuid("Invalid contextId.").optional(),
  requestId: z.string().uuid("Invalid requestId.").optional(),
});

export const aiContextParamsSchema = z.object({
  contextId: z.string().uuid("Invalid contextId."),
});

export const validateAiChat = validate(aiChatSchema);
export const validateAiContextParams = validate(aiContextParamsSchema, "params");
