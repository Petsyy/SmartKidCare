import { z } from "zod";

export const addCenterSchema = z.object({
  name: z.string().min(1, "Center name is required"),
  barangay: z.string().min(1, "Barangay is required"),
  address: z.string().optional(),
});

export type AddCenterFormData = z.infer<typeof addCenterSchema>;

export const editCenterSchema = z.object({
  name: z.string().min(1, "Center name is required"),
  barangay: z.string().min(1, "Barangay is required"),
  address: z.string().optional(),
});

export type EditCenterFormData = z.infer<typeof editCenterSchema>;
