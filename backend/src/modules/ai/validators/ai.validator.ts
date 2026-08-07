import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

const aiChatSchema = z.object({
  role: z.string().optional(),
  message: z.string().trim().min(1, "Message is required.").max(5000, "Message is too long."),
  childId: z.string().optional(),
});

export const validateAiChat = validate(aiChatSchema);
