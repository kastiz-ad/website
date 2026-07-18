import { exportProfileSummary, readProfile, clearProfile } from "./profile-memory-engine.js";

const api = async (path, options = {}) => {
  const response = await fetch(`/api/v1${path}`, { credentials:"include", headers:{"Content-Type":"application/json","X-CSRF-Token":sessionStorage.getItem("kastiz-csrf")||""}, ...options });
  if (!response.ok) throw new Error((await response.json().catch(()=>null))?.error?.code || "backend_unavailable");
  return response.json();
};

export async function profileStorageState() {
  const local = readProfile();
  try {
    const session = await api("/auth/session");
    if (!session.authenticated) return { mode:"guest", label:"Saved on this device", local, account:null };
    const [profile, preferences] = await Promise.all([api("/me/profile"), api("/preferences")]);
    return { mode:"account", label:"Synced to your ONE account", local, account:{ profile:profile.profile, preferences:preferences.preferences || [] } };
  } catch { return { mode:"guest", label:"Saved on this device", local, account:null, backendUnavailable:true }; }
}

export function findPreferenceConflicts(localRows, accountRows) {
  const account = new Map(accountRows.map(row => [`${row.category}:${row.preference_key}`, String(row.preference_value)]));
  return localRows.flatMap(row => {
    const key = `${row.category}:${row.field}`, remote = account.get(key);
    return remote !== undefined && remote !== String(row.value) ? [{ key, category:row.category, field:row.field, local:row.value, account:remote }] : [];
  });
}

export async function importLocalPreferences(decisions = {}) {
  const state = await profileStorageState();
  if (state.mode !== "account") throw new Error("sign_in_required");
  const rows = exportProfileSummary(), conflicts = findPreferenceConflicts(rows, state.account.preferences);
  if (conflicts.some(item => !decisions[item.key])) return { imported:false, conflicts };
  for (const row of rows) {
    const key = `${row.category}:${row.field}`, conflict = conflicts.find(item => item.key === key);
    if (conflict && decisions[key] !== "local") continue;
    await api("/preferences", { method:"POST", body:JSON.stringify({ category:row.category, preference_key:row.field, preference_value:row.value }) });
  }
  return { imported:true, conflicts:[], clearLocal:() => clearProfile() };
}
