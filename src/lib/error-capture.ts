// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current != null; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      if (current.stack) parts.push(current.stack);
      current = (current as any).cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join("\n\n");
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
