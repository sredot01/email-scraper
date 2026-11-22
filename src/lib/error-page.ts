export function errorPage(message: string) {
  return new Response(
    `<!DOCTYPE html><html><body><h1>Error</h1><p>${message}</p></body></html>`,
    { status: 500, headers: { "content-type": "text/html" } },
  );
}
