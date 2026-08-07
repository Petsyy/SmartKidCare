import { API_BASE } from "@/api/config";

const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let interceptorInstalled = false;

const getCookieValue = (name: string): string | null => {
  const target = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(target));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(target.length));
};

const isApiRequest = (url: string): boolean => {
  try {
    const requestUrl = new URL(url, window.location.origin);
    const apiUrl = new URL(API_BASE, window.location.origin);

    return (
      requestUrl.origin === apiUrl.origin &&
      requestUrl.pathname.startsWith(apiUrl.pathname)
    );
  } catch {
    return false;
  }
};

export const installCsrfFetchInterceptor = () => {
  if (interceptorInstalled) {
    return;
  }

  interceptorInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    const method = request.method.toUpperCase();

    if (!UNSAFE_METHODS.has(method) || !isApiRequest(request.url)) {
      return originalFetch(request);
    }

    const csrfToken = getCookieValue(CSRF_COOKIE_NAME);
    if (!csrfToken) {
      return originalFetch(request);
    }

    const headers = new Headers(request.headers);
    if (!headers.has(CSRF_HEADER_NAME)) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }

    return originalFetch(new Request(request, { headers }));
  };
};
