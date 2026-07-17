import { ApiError, parseCookies } from "./http.js";

const changing = new Set(["POST", "PUT", "PATCH", "DELETE"]);
export function enforceOrigin(request, cfg) {
  const origin = request.headers.get("Origin");
  if (origin && !cfg.allowedOrigins.has(origin)) throw new ApiError(403, "origin_denied", "Request origin is not allowed.");
}
export function enforceCsrf(request, cfg) {
  if (!changing.has(request.method)) return;
  const cookies = parseCookies(request); const header = request.headers.get("X-CSRF-Token");
  if (!header || !cookies[cfg.csrfCookie] || header !== cookies[cfg.csrfCookie]) throw new ApiError(403, "csrf_failed", "Security verification failed. Refresh and try again.");
}
export async function rateLimit(context, bucket = "general", maximum = 60) {
  if (!context.env.RATE_LIMITER) return;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
  const result = await context.env.RATE_LIMITER.limit({ key: `${bucket}:${ip}` });
  if (!result.success) throw new ApiError(429, "rate_limited", "Too many requests. Try again shortly.");
}
export const securityHeaders = headers => ({
  ...headers, "Referrer-Policy": "strict-origin-when-cross-origin", "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY", "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
});
