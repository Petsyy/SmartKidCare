import { API_BASE } from "../components/config/config.api";

type ApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: HeadersInit;
};

const toErrorMessage = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) return value;
  return fallback;
};

export const parseApiError = async (
  response: Response,
  fallback: string,
): Promise<string> => {
  try {
    const payload = (await response.json()) as {
      error?: unknown;
      message?: unknown;
    };
    return (
      toErrorMessage(payload.error, "") ||
      toErrorMessage(payload.message, "") ||
      `${fallback} (${response.status})`
    );
  } catch {
    return `${fallback} (${response.status})`;
  }
};

export const apiRequest = async <T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { method = "GET", body, headers } = options;
  const hasJsonBody = body !== undefined;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(hasJsonBody ? { body: JSON.stringify(body) } : {}),
  });

  const raw = await response.text();
  if (!raw) return undefined as T;
  return JSON.parse(raw) as T;
};

export const apiRequestOrThrow = async <T>(
  path: string,
  fallbackError: string,
  options: RequestOptions = {},
): Promise<T> => {
  const { method = "GET", body, headers } = options;
  const hasJsonBody = body !== undefined;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(hasJsonBody ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, fallbackError));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) {
    return undefined as T;
  }

  return JSON.parse(raw) as T;
};
