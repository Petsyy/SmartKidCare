import { z } from "zod";
import { validate } from "../../../shared/middleware/validate.middleware";
import { OFFLINE_RESOURCES } from "../types/offline-sync.types";

export const validateSnapshotPage = [
  validate(
    z.object({
      snapshotId: z.string().trim().min(1),
      resource: z.enum(OFFLINE_RESOURCES),
    }),
    "params",
  ),
  validate(
    z.object({ cursor: z.coerce.number().int().min(0).default(0) }),
    "query",
  ),
];

export const validateSnapshotId = validate(
  z.object({ snapshotId: z.string().trim().min(1) }),
  "params",
);
