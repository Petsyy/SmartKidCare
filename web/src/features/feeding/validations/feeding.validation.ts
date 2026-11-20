import { z } from "zod";

export const feedingStatusSchema = z.enum(["pending", "served", "absent"], {
  message: "Invalid feeding status. Must be pending, served, or absent.",
});

export const updateFeedingRecordSchema = z.object({
  id: z.string().min(1, "Record ID is required."),
  status: feedingStatusSchema,
});

export type FeedingStatusFormValues = z.infer<typeof updateFeedingRecordSchema>;
