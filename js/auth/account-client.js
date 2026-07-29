const JSON_HEADERS = Object.freeze({ "Content-Type": "application/json" });

const csrfToken = () => sessionStorage.getItem("kastiz-csrf") || localStorage.getItem("kastiz-csrf") || "";

export async function accountApi(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, {
    credentials: "include",
    ...options,
    headers: { ...JSON_HEADERS, ...(csrfToken() ? { "X-CSRF-Token": csrfToken() } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || data.message || "Account service is not available yet.");
    error.code = data.error?.code || "account_service_unavailable";
    error.status = response.status;
    throw error;
  }
  if (data.csrfToken) {
    sessionStorage.setItem("kastiz-csrf", data.csrfToken);
    localStorage.setItem("kastiz-csrf", data.csrfToken);
  }
  return data;
}

export const getSession = () => accountApi("/auth/session", { method: "GET" }).catch(error => ({ authenticated: false, setupRequired: error.code === "backend_not_configured", error }));
export const loginWithEmail = (email, password) => accountApi("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const registerWithEmail = (email, password, displayName, language = "en") => accountApi("/auth/register", { method: "POST", body: JSON.stringify({ email, password, displayName, language }) });
export const requestPasswordReset = email => accountApi("/auth/password-reset", { method: "POST", body: JSON.stringify({ email }) });
export const refreshAccountSession = () => accountApi("/auth/refresh", { method: "POST" });
export const logout = () => accountApi("/auth/logout", { method: "POST" }).finally(() => {
  sessionStorage.removeItem("kastiz-csrf");
  localStorage.removeItem("kastiz-csrf");
});
export const getOAuthUrl = provider => accountApi(`/auth/oauth/${encodeURIComponent(provider)}`, { method: "GET" });
export const getAccountProfile = () => accountApi("/me/profile", { method: "GET" });
export const updateAccountProfile = profile => accountApi("/me/profile", { method: "PATCH", body: JSON.stringify(profile) });
export const exportAccountData = () => accountApi("/me/export", { method: "GET" });
export const requestAccountDeletion = () => accountApi("/me/deletion-request", { method: "POST" });
export const listMemories = () => accountApi("/memory", { method: "GET" });
export const saveMemory = memory => accountApi("/memory", { method: "POST", body: JSON.stringify(memory) });
export const updateMemory = (id, patch) => accountApi(`/memory/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
export const deleteMemory = id => accountApi(`/memory/${encodeURIComponent(id)}`, { method: "DELETE" });
