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
  return context.next();
}
