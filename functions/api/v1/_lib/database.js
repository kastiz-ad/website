import { ApiError } from "./http.js";

export async function db(cfg, user, table, { method = "GET", query = "", body, prefer = "return=representation" } = {}) {
  const response = await fetch(`${cfg.supabaseUrl}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method, headers: { apikey: cfg.anonKey, Authorization: `Bearer ${user.accessToken}`, "Content-Type": "application/json", Prefer: prefer },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) throw new ApiError(response.status === 404 ? 404 : 400, "database_request_failed", "The requested data operation could not be completed.");
  if (response.status === 204) return null;
  return response.json();
}
export async function trustedDb(cfg, table, { method="POST",query="",body,prefer="return=representation" }={}) {
  if(!cfg.serviceKey)throw new ApiError(503,"trusted_backend_not_configured","Trusted backend credentials are not configured.");
  const response=await fetch(`${cfg.supabaseUrl}/rest/v1/${table}${query?`?${query}`:""}`,{method,headers:{apikey:cfg.serviceKey,Authorization:`Bearer ${cfg.serviceKey}`,"Content-Type":"application/json",Prefer:prefer},body:body===undefined?undefined:JSON.stringify(body)});
  if(!response.ok)throw new ApiError(500,"trusted_database_failed","The protected operation could not be completed.");
  return response.status===204?null:response.json();
}
export const audit = (cfg,user,eventType,entityType,entityId,correlationId,metadata={}) => trustedDb(cfg,"audit_events",{body:{user_id:user?.id||null,actor_type:user?"user":"system",event_type:eventType,entity_type:entityType,entity_id:entityId,correlation_id:correlationId,privacy_safe_metadata:metadata},prefer:"return=minimal"});
