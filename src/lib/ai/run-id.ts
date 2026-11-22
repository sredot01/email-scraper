const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: ((id: string) => void) | undefined;
  const runIdPromise = new Promise<string>((resolve) => {
    resolveRunId = resolve;
  });

  const fetchWithRunId: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId) {
      headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
    }
    const res = await fetch(input, { ...init, headers });
    const headerRunId = res.headers.get(LOVABLE_AIG_RUN_ID_HEADER);
    if (headerRunId && !runId) {
      runId = headerRunId;
      resolveRunId?.(runId);
    }
    return res;
  };

  return Object.assign(fetchWithRunId, {
    runIdPromise,
    getRunId: () => runId,
  });
}
