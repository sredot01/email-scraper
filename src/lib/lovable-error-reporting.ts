type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  captureException: (error: Error, options?: LovableErrorOptions) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
  }
}

export function reportLovableError(error: unknown, options: LovableErrorOptions = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  if (typeof window !== "undefined" && window.__lovableEvents?.captureException) {
    window.__lovableEvents.captureException(err, options);
  } else {
    console.error("[lovable-error]", err, options);
  }
}
