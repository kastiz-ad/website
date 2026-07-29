export const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store", ...headers }
});

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export const requestId = request => request.headers.get("cf-ray") || crypto.randomUUID();
export const safeError = (error, id) => json({ error: { code: error.code || "internal_error", message: error.status ? error.message : "The request could not be completed.", requestId: id } }, error.status || 500);
export const parseCookies = request => Object.fromEntries((request.headers.get("Cookie") || "").split(";").map(v => v.trim()).filter(Boolean).map(v => { const i=v.indexOf("="); return [v.slice(0,i), decodeURIComponent(v.slice(i+1))]; }));
export const cookie = (name, value, { maxAge = 3600, httpOnly = true, secure = true } = {}) => `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${httpOnly ? "; HttpOnly" : ""}${secure ? "; Secure" : ""}`;
export const noBody = status => new Response(null, { status, headers: { "Cache-Control": "private, no-store" } });

export async function fetchWithTimeout(url, options = {}, { timeoutMs = 8000, errorCode = "upstream_timeout" } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") throw new ApiError(504, errorCode, "The upstream service timed out.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
