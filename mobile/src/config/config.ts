// API Configuration
export const API_BASE_URL = "http://192.168.100.15:5000";

/**
 * Constructs a full API endpoint URL
 * @param endpoint - The endpoint path (e.g., "/auth/login")
 * @returns Full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
