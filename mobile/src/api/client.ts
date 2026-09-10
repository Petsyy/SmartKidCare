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

const getApiErrorMessage = (
  data: unknown,
  raw: string,
  fallback: string,
): string => {
  if (typeof data === "object" && data !== null) {
    const errorData = data as {
      message?: unknown;
      error?: unknown;
    };

    if (typeof errorData.message === "string") return errorData.message;
    if (typeof errorData.error === "string") return errorData.error;
    if (
      typeof errorData.error === "object" &&
      errorData.error !== null &&
      typeof (errorData.error as { message?: unknown }).message === "string"
    ) {
      return (errorData.error as { message: string }).message;
    }
  }

  return raw && !raw.trim().startsWith("{") ? raw : fallback;
};

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
      getApiErrorMessage(data, raw, `Request failed: ${method} ${path}`),
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
    throw new Error(getApiErrorMessage(data, raw, `Upload failed: ${path}`));
  }

  return data as T;
}
