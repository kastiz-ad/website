import { ApiError, cookie, parseCookies } from "./http.js";

const authFetch = (cfg, path, init = {}) => fetch(`${cfg.supabaseUrl}/auth/v1/${path}`, { ...init, headers: { apikey: cfg.anonKey, "Content-Type": "application/json", ...(init.headers || {}) } });
export async function currentUser(request, cfg, required = true) {
  const token = parseCookies(request)[cfg.sessionCookie];
  if (!token) { if (required) throw new ApiError(401, "authentication_required", "Please sign in to continue."); return null; }
  const response = await authFetch(cfg, "user", { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) { if (required) throw new ApiError(401, "session_invalid", "Your session expired. Please sign in again."); return null; }
  return { ...(await response.json()), accessToken: token };
}
export async function signIn(cfg, email, password) {
  const response = await authFetch(cfg, "token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new ApiError(401, "invalid_credentials", "Email or password is incorrect.");
  return response.json();
}
export async function signUp(cfg, email, password, displayName, language) {
  const response = await authFetch(cfg, "signup", { method: "POST", body: JSON.stringify({ email, password, data: { display_name: displayName, preferred_language: language } }) });
  if (!response.ok) throw new ApiError(400, "registration_failed", "Registration could not be completed. Check the information and try again.");
  return response.json();
}
export async function resetPassword(cfg, email) {
  await authFetch(cfg, "recover", { method: "POST", body: JSON.stringify({ email, redirect_to: `${cfg.appOrigin}/login.html?reset=1` }) });
}
export function sessionHeaders(cfg, session, csrf) {
  const secure = cfg.production;
  return { "Set-Cookie": [cookie(cfg.sessionCookie, session.access_token, { maxAge: session.expires_in, secure }), cookie(cfg.refreshCookie, session.refresh_token, { maxAge: 2592000, secure }), cookie(cfg.csrfCookie, csrf, { maxAge: 2592000, httpOnly: false, secure })].join(", ") };
}
