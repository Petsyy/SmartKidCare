export type AppUserRole = "admin" | "teacher" | "parent";

export interface AuthenticatedUser {
  id: string;
  role: AppUserRole | string;
}
