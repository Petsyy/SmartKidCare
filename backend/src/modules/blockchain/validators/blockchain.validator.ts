import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";

export const blockchainProofParamsSchema = z.object({
  id: z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid child ID"),
});

export const validateBlockchainProofParams = validate(
  blockchainProofParamsSchema,
  "params",
);
