import { API_BASE } from "../components/config/config.api";

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

// Create a new teacher
export const createTeacher = async (data: TeacherData): Promise<CreateTeacherResponse> => {
  try {
    const response = await fetch(`${API_BASE}/admin/teachers`, {
      method: 'POST',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create teacher';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

// Get all teachers
export const getTeachers = async (params?: ListTeachersParams): Promise<Teacher[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_BASE}/admin/teachers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch teachers');
    }

    const result = await response.json();
    return result.teachers || [];
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

// Get a single teacher by ID
export const getTeacher = async (teacherId: string): Promise<Teacher> => {
  try {
    const response = await fetch(`${API_BASE}/admin/teachers/${teacherId}`, {
      method: 'GET',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch teacher');
    }

    const result = await response.json();
    return result.teacher;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

// Update teacher information
export const updateTeacher = async (teacherId: string, data: Partial<TeacherData>): Promise<Teacher> => {
  try {
    const response = await fetch(`${API_BASE}/admin/teachers/${teacherId}`, {
      method: 'PATCH',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update teacher');
    }

    const result = await response.json();
    return result.teacher;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

// Delete a teacher
export const deleteTeacher = async (teacherId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/admin/teachers/${teacherId}`, {
      method: 'DELETE',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete teacher');
    }
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

// Update teacher verification status
export const updateTeacherStatus = async (
  teacherId: string,
  verificationStatus: 'approved' | 'rejected'
): Promise<Teacher> => {
  try {
    const response = await fetch(`${API_BASE}/admin/teachers/${teacherId}/status`, {
      method: 'PATCH',
      credentials: "include",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verificationStatus }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update teacher status');
    }

    const result = await response.json();
    return result.teacher;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};
