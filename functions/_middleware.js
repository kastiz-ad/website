const BLOCKED_FOUNDER_PATHS = [
  "/founder-analytics.html",
  "/founder-weekly-report.html",
  "/tools/founder-os"
];

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);
  if (BLOCKED_FOUNDER_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, noarchive"
      }
    });
  }
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self)");
  headers.set("X-Frame-Options", "DENY");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
