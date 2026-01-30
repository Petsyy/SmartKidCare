const API_BASE_URL = 'http://192.168.100.15:5000';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "worker" | "parent";
  documents: string[];
  verificationStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export interface GetUsersParams {
  role?: "worker" | "parent";
  status?: "pending" | "approved" | "rejected";
}

export interface UpdateStatusParams {
  userId: string;
  verificationStatus: "pending" | "approved" | "rejected";
}

export const getUsers = async (params?: GetUsersParams): Promise<User[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.status) queryParams.append('status', params.status);

    const url = `${API_BASE_URL}/api/auth/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    const result = await response.json();
    return result.users;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

export const updateUserStatus = async ({ userId, verificationStatus }: UpdateStatusParams): Promise<User> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ verificationStatus }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user status');
    }

    const result = await response.json();
    return result.user;
  } catch (error: any) {
    throw new Error(error.message || 'Network error');
  }
};

export default API_BASE_URL;
