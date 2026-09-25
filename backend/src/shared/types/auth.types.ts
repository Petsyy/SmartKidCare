export type AppUserRole = "system_admin" | "barangay_captain" | "teacher" | "parent";

export interface AuthenticatedUser {
  id: string;
  role: AppUserRole | string;
  daycareCenterId: string | null;
}
