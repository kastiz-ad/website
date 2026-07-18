import { ApiError } from "./http.js";

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "APP_ORIGIN"];
export function config(env) {
  const missing = required.filter(key => !env[key]);
  if (missing.length) throw new ApiError(503, "backend_not_configured", "Secure accounts are not configured on this environment.");
  return {
    supabaseUrl: env.SUPABASE_URL.replace(/\/$/, ""), anonKey: env.SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY || "", appOrigin: env.APP_ORIGIN,
    allowedOrigins: new Set((env.CORS_ALLOWED_ORIGINS || env.APP_ORIGIN).split(",").map(v => v.trim()).filter(Boolean)),
    sessionCookie: env.SESSION_COOKIE_NAME || "kastiz_session", refreshCookie: env.REFRESH_COOKIE_NAME || "kastiz_refresh",
    csrfCookie: env.CSRF_COOKIE_NAME || "kastiz_csrf", production: env.APP_ENV === "production",
    oneAgentEnv: env
  };
}
