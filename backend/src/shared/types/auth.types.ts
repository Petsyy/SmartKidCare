export type AppUserRole = "barangay_captain" | "teacher" | "parent";

export interface AuthenticatedUser {
  id: string;
  role: AppUserRole | string;
  daycareCenterId: string | null;
}
