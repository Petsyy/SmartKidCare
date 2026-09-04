import { z } from "zod";

export const validateRequestCode = z.object({
  childId: z.string().min(1, "Child ID is required"),
  intendedGuardianIndex: z.number().int().nonnegative().nullable().optional(),
});

export const validateVerifyCode = z.object({
  childId: z.string().min(1, "Child ID is required"),
  code: z.string().length(6, "Pickup code must be exactly 6 digits"),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export const validateManualRelease = z.object({
  childId: z.string().min(1, "Child ID is required"),
  pickedUpByType: z.enum(["parent", "guardian"], {
    error: "Type must be 'parent' or 'guardian'",
  }),
  guardianIndex: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().min(1, "Notes are required for manual release").max(500, "Notes cannot exceed 500 characters"),
});

export const validatePickupHistoryQuery = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  datePreset: z.string().optional(),
  childId: z.string().optional(),
  centerId: z.string().optional(),
});

export const validateGuardian = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  relationship: z.enum(["Mother", "Father", "Guardian", "Grandparent", "Other"], {
    error: "Invalid relationship type",
  }),
  customRelationship: z.string().trim().max(50, "Custom relationship cannot exceed 50 characters").nullable().optional(),
  phone: z.string().min(1, "Phone number is required"),
  photoUrl: z.string().nullable().optional(),
  photoPublicId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

