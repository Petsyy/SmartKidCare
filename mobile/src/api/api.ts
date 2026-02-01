const API_BASE_URL = "http://192.168.100.15:5000";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    verificationStatus?: string;
  };
}

interface WorkerRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  documents?: string[];
}

interface RegistrationResponse {
  message: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    verificationStatus: string;
  };
  error?: string;
}

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Login failed");
  }

  return data;
};

/** Get current user (protected route – send token in Authorization header). */
export const getMe = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user");
  }

  return data.user;
};

export default API_BASE_URL;
