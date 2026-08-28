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
  const service = context.env.RATE_LIMITER_SERVICE;
  if (!service) {
    const production = context.env.APP_ENV === "production" || context.env.CF_PAGES_BRANCH === "main";
    if (production) throw new ApiError(503, "rate_limiter_unavailable", "This service is temporarily unavailable.");
    return;
  }
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
  let response;
  try {
    response = await service.fetch("https://rate-limiter.internal/limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: `${bucket}:${ip}`, maximum })
    });
  } catch {
    throw new ApiError(503, "rate_limiter_unavailable", "This service is temporarily unavailable.");
  }
  if (!response.ok) throw new ApiError(503, "rate_limiter_unavailable", "This service is temporarily unavailable.");
  const result = await response.json().catch(() => null);
  if (!result || result.success !== true) throw new ApiError(429, "rate_limited", "Too many requests. Try again shortly.");
}
export const securityHeaders = headers => ({
  ...headers, "Referrer-Policy": "strict-origin-when-cross-origin", "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY", "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
});
