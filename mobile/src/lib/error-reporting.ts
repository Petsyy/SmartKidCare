interface ErrorDetails {
  name: string;
  message: string;
  stack?: string;
  status?: number;
  code?: string;
  componentStack?: string;
}

export type ProductionErrorReporter = (
  error: ErrorDetails,
  context: string,
) => void;

let productionErrorReporter: ProductionErrorReporter | null = null;

const toErrorDetails = (error: unknown): ErrorDetails => {
  if (error instanceof Error) {
    const apiError = error as Error & { status?: unknown; code?: unknown };

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      status:
        typeof apiError.status === "number" ? apiError.status : undefined,
      code: typeof apiError.code === "string" ? apiError.code : undefined,
    };
  }

  return {
    name: "UnknownError",
    message: "A non-Error value was thrown.",
  };
};

/**
 * Registers the production monitoring adapter (for example, Sentry or EAS
 * Observe) without coupling feature code to a specific provider.
 */
export function configureProductionErrorReporter(
  reporter: ProductionErrorReporter | null,
) {
  productionErrorReporter = reporter;
}

/**
 * Reports an error that the caller has already caught and recovered from.
 * Context must describe the operation only and must never contain user data.
 */
export function reportHandledError(
  context: string,
  error: unknown,
  diagnostics: { componentStack?: string } = {},
) {
  const details = { ...toErrorDetails(error), ...diagnostics };

  if (__DEV__) {
    // Use a normal log for handled failures so Expo LogBox does not cover the
    // app's friendly feedback with a development error overlay.
    console.log(`[HandledError:${context}]`, details);
    return;
  }

  productionErrorReporter?.(details, context);
}

/**
 * Converts technical failures into safe, actionable copy for users.
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const details = toErrorDetails(error);

  if (
    details.code === "NETWORK_ERROR" ||
    details.code === "UPLOAD_TIMEOUT" ||
    details.status === 0 ||
    details.name === "AbortError"
  ) {
    return "Check your internet connection and try again.";
  }

  switch (details.status) {
    case 401:
      return fallback;
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested information could not be found.";
    case 409:
      return "This information has changed. Refresh and try again.";
    case 413:
      return "The selected file is too large. Choose a smaller file.";
    case 422:
      return "Some information is invalid. Review your entries and try again.";
    default:
      if (typeof details.status === "number" && details.status >= 500) {
        return "The service is temporarily unavailable. Please try again later.";
      }
      return fallback;
  }
}
