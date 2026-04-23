import { API_BASE_URL } from "../config/config.api";

let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

export function getAuthToken(): string | null {
  return _authToken;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  authenticated?: boolean;
}

export async function apiClient<T>(
  path: string,
  {
    method = "GET",
    body,
    headers = {},
    authenticated = true,
  }: RequestOptions = {},
): Promise<T> {
  const allHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (authenticated) {
    const token = getAuthToken();
    if (!token) {
      throw new Error("No authentication token");
    }
    allHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: allHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });


  let data: any;
  const raw = await response.text();
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ||
        raw ||
        `Request failed: ${method} ${path}`,
    );
  }

  return data as T;
}


export async function apiFormDataClient<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  let data: any;
  const raw = await response.text();
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      (data as { message?: string }).message ||
        raw ||
        `Upload failed: ${path}`,
    );
  }

  return data as T;
}
