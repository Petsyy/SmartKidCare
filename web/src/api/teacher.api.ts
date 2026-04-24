import { apiRequestOrThrow } from "./api-client";

export interface TeacherData {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  daycareCenterId: string;
  status?: "Active" | "Inactive";
}

export interface DaycareCenterSummary {
  _id: string;
  name: string;
  barangay: string;
  code: string;
  isActive?: boolean;
}

export interface Teacher {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  daycareCenterId?: string;
  role: 'teacher';
  daycareCenter?: DaycareCenterSummary | null;
  status?: "Active" | "Inactive";
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherResponse {
  teacher: Teacher;
  credentials: {
    email: string;
    tempPassword: string;
  };
  emailDelivery?: {
    sent: boolean;
    to: string;
    message?: string;
  };
}

export interface ListTeachersParams {
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}

export const createTeacher = async (data: TeacherData): Promise<CreateTeacherResponse> => {
  return apiRequestOrThrow<CreateTeacherResponse>(
    "/admin/teachers",
    "Failed to create teacher",
    {
      method: "POST",
      body: data,
    },
  );
};

export const getTeachers = async (params?: ListTeachersParams): Promise<Teacher[]> => {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append("status", params.status);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());

  const result = await apiRequestOrThrow<{ teachers?: Teacher[] }>(
    `/admin/teachers${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
    "Failed to fetch teachers",
  );

  return Array.isArray(result.teachers) ? result.teachers : [];
};

export const getTeacher = async (teacherId: string): Promise<Teacher> => {
  const result = await apiRequestOrThrow<{ teacher: Teacher }>(
    `/admin/teachers/${teacherId}`,
    "Failed to fetch teacher",
  );
  return result.teacher;
};

export const updateTeacher = async (teacherId: string, data: Partial<TeacherData>): Promise<Teacher> => {
  const result = await apiRequestOrThrow<{ teacher: Teacher }>(
    `/admin/teachers/${teacherId}`,
    "Failed to update teacher",
    {
      method: "PATCH",
      body: data,
    },
  );
  return result.teacher;
};

export const deleteTeacher = async (teacherId: string): Promise<void> => {
  await apiRequestOrThrow<void>(
    `/admin/teachers/${teacherId}`,
    "Failed to delete teacher",
    { method: "DELETE" },
  );
};

export const updateTeacherStatus = async (
  teacherId: string,
  verificationStatus: 'approved' | 'rejected'
): Promise<Teacher> => {
  const result = await apiRequestOrThrow<{ teacher: Teacher }>(
    `/admin/teachers/${teacherId}/status`,
    "Failed to update teacher status",
    {
      method: "PATCH",
      body: { verificationStatus },
    },
  );
  return result.teacher;
};
