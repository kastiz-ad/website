import { INVESTOR_VISIBILITY } from "../js/config/investor-visibility.js";

const BLOCKED_FOUNDER_PATHS = [
  "/founder-analytics.html",
  "/founder-weekly-report.html",
  "/tools/founder-os"
];

export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const { pathname } = requestUrl;
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

  const isInvestorRoute = INVESTOR_VISIBILITY.routeEnabled && pathname.replace(/\/+$/, "") === INVESTOR_VISIBILITY.routePath;
  let response;
  if (isInvestorRoute && context.env?.ASSETS) {
    const assetUrl = new URL(context.request.url);
    assetUrl.pathname = "/";
    response = await context.env.ASSETS.fetch(new Request(assetUrl, context.request));
  } else {
    response = await context.next();
  }

  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self)");
  headers.set("X-Frame-Options", "DENY");
  if (isInvestorRoute) {
    headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    headers.set("Cache-Control", "private, no-store");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
