// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

export function describeError(error: unknown): string {
  return String(error);
}

export function captureError(error: unknown) {
  record(error);
}

export function getLastCapturedError() {
  if (lastCapturedError && Date.now() - lastCapturedError.at < TTL_MS) {
    return lastCapturedError.error;
  }
  return undefined;
}
