import { z } from "zod";
import { Request } from "express";

export interface PickupAuthUser {
  id: string;
  role: "admin" | "teacher" | "parent";
  firstName?: string;
  lastName?: string;
  daycareCenterId?: string | null;
}

export interface RequestPickupCodeInput {
  childId: string;
  intendedGuardianIndex: number | null;
}

export interface VerifyPickupCodeInput {
  childId: string;
  code: string;
  notes?: string;
}

export interface ManualReleaseInput {
  childId: string;
  pickedUpByType: "parent" | "guardian";
  guardianIndex?: number | null;
  notes: string;
}

export interface GuardianInput {
  firstName: string;
  lastName: string;
  relationship: "Mother" | "Father" | "Guardian" | "Grandparent" | "Other";
  phone: string;
  photoUrl?: string | null;
  photoPublicId?: string | null;
  isActive?: boolean;
}

export interface PickupPaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

