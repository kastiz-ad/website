import { ApiError, json, noBody, requestId, safeError } from "./_lib/http.js";
import { config } from "./_lib/config.js";
import { enforceCsrf, enforceOrigin, rateLimit, securityHeaders } from "./_lib/security.js";
import { currentUser, resetPassword, sessionHeaders, signIn, signUp } from "./_lib/auth.js";
import { audit, db, trustedDb } from "./_lib/database.js";
import { approvalDecision, approvalRequest, body, consent, emailPassword, missionCreate, preference, profileUpdate, registration, ValidationError } from "./_lib/schemas.js";
import { assertExecutable, payloadHash } from "./_lib/approval.js";

const parts = request => new URL(request.url).pathname.replace(/^\/api\/v1\/?/, "").split("/").filter(Boolean);
const one = rows => Array.isArray(rows) ? rows[0] || null : rows;
const userFilter = user => `user_id=eq.${encodeURIComponent(user.id)}`;

async function route(context, cfg) {
  const { request } = context; const [group, id, action] = parts(request);
  if (group === "health" && request.method === "GET") return json({ status: "ok", service: "kastiz-one-api", version: "v1" });
  if (group === "readiness" && request.method === "GET") return json({ status: "ready", database: "configured", authentication: "configured" });

  if (group === "auth") {
    await rateLimit(context, "auth", 10);
    if (id === "register" && request.method === "POST") { const data=await body(request,registration); const result=await signUp(cfg,data.email,data.password,data.displayName,data.language); return json({ user: result.user ? { id: result.user.id, email: result.user.email, emailVerified: Boolean(result.user.email_confirmed_at) } : null, verificationRequired: !result.session }, 201); }
    if (id === "login" && request.method === "POST") { const data=await body(request,emailPassword); const session=await signIn(cfg,data.email,data.password); const csrf=crypto.randomUUID(); return json({ user:{ id:session.user.id,email:session.user.email,emailVerified:Boolean(session.user.email_confirmed_at) },csrfToken:csrf },200,sessionHeaders(cfg,session,csrf)); }
    if (id === "password-reset" && request.method === "POST") { const data=await body(request,emailPassword.pick({email:true})); await resetPassword(cfg,data.email); return json({ message:"If the account exists, password reset instructions were sent." },202); }
    if (id === "session" && request.method === "GET") { const user=await currentUser(request,cfg,false); return json({ authenticated:Boolean(user), user:user?{id:user.id,email:user.email,emailVerified:Boolean(user.email_confirmed_at)}:null }); }
    if (id === "logout" && request.method === "POST") return json({ authenticated:false },200,{"Set-Cookie":`${cfg.sessionCookie}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax, ${cfg.refreshCookie}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`});
  }

  const user = await currentUser(request, cfg);
  if (group === "me") {
    if (!id && request.method === "GET") return json({ id:user.id,email:user.email,emailVerified:Boolean(user.email_confirmed_at) });
    if (id === "profile" && request.method === "GET") return json({ profile:one(await db(cfg,user,"profiles",{query:`id=eq.${user.id}&select=id,display_name,preferred_language,timezone,created_at,updated_at`})) });
    if (id === "profile" && request.method === "PATCH") { const data=await body(request,profileUpdate); return json({ profile:one(await db(cfg,user,"profiles",{method:"PATCH",query:`id=eq.${user.id}`,body:data})) }); }
    if (id === "export" && request.method === "GET") { const [profile,preferences,missions,consents]=await Promise.all([db(cfg,user,"profiles",{query:`id=eq.${user.id}&select=*`}),db(cfg,user,"user_preferences",{query:`${userFilter(user)}&select=*`}),db(cfg,user,"missions",{query:`${userFilter(user)}&select=*`}),db(cfg,user,"consent_records",{query:`${userFilter(user)}&select=*`})]); return json({exportedAt:new Date().toISOString(),profile,preferences,missions,consents}); }
    if (id === "deletion-request" && request.method === "POST") { const rows=await db(cfg,user,"account_deletion_requests",{method:"POST",body:{user_id:user.id,status:"pending_confirmation"}}); return json({request:one(rows),message:"Deletion request recorded. Recent authentication and confirmation are required before processing."},202); }
  }
  if (group === "preferences") {
    if (request.method === "GET") return json({preferences:await db(cfg,user,"user_preferences",{query:`${userFilter(user)}&select=id,category,preference_key,preference_value,created_at,updated_at&order=category,preference_key`})});
    if (request.method === "POST") { const data=await body(request,preference); return json({preference:one(await db(cfg,user,"user_preferences",{method:"POST",body:{...data,user_id:user.id},prefer:"resolution=merge-duplicates,return=representation"}))},201); }
    if (id && request.method === "DELETE") { await db(cfg,user,"user_preferences",{method:"DELETE",query:`id=eq.${id}&${userFilter(user)}`}); return noBody(204); }
  }
  if (group === "missions") {
    if (!id && request.method === "GET") return json({missions:await db(cfg,user,"missions",{query:`${userFilter(user)}&deleted_at=is.null&select=id,mission_type,title,status,risk_level,created_at,updated_at,completed_at&order=created_at.desc&limit=50`})});
    if (!id && request.method === "POST") { const data=await body(request,missionCreate); const rows=await db(cfg,user,"missions",{method:"POST",body:{...data,user_id:user.id,status:"draft",risk_level:"low"}}); return json({mission:one(rows)},201); }
    if (id && !action && request.method === "GET") { const mission=one(await db(cfg,user,"missions",{query:`id=eq.${id}&${userFilter(user)}&deleted_at=is.null&select=*,mission_steps(*),mission_results(*)`})); if(!mission)throw new ApiError(404,"not_found","Mission not found."); return json({mission}); }
    if (id && !action && request.method === "DELETE") { await db(cfg,user,"missions",{method:"PATCH",query:`id=eq.${id}&${userFilter(user)}`,body:{deleted_at:new Date().toISOString(),status:"cancelled"}}); return noBody(204); }
  }
  if (group === "approvals") {
    if (!id && request.method === "GET") return json({approvals:await db(cfg,user,"approval_requests",{query:`${userFilter(user)}&select=id,mission_id,action_type,action_description,provider,amount,currency,risk_level,status,requested_at,expires_at,decided_at&order=requested_at.desc&limit=50`})});
    if (!id && request.method === "POST") { const data=await body(request,approvalRequest); const mission=one(await db(cfg,user,"missions",{query:`id=eq.${data.mission_id}&${userFilter(user)}&select=id`})); if(!mission)throw new ApiError(404,"not_found","Mission not found."); const hash=await payloadHash(data.exact_action_payload); const {exact_action_payload,...stored}=data; const rows=await trustedDb(cfg,"approval_requests",{body:{...stored,user_id:user.id,payload_hash:hash,status:"awaiting_approval",requested_at:new Date().toISOString(),expires_at:new Date(Date.now()+15*60*1000).toISOString()}}); const created=one(rows); await audit(cfg,user,"approval_requested","approval_request",created.id,requestId(request),{action_type:data.action_type,risk_level:data.risk_level}); return json({approval:created},201); }
    if (id && action === "decision" && request.method === "POST") { const data=await body(request,approvalDecision); const approval=one(await db(cfg,user,"approval_requests",{query:`id=eq.${id}&${userFilter(user)}&select=*`})); if(!approval)throw new ApiError(404,"not_found","Approval request not found."); if(approval.status!=="awaiting_approval"||new Date(approval.expires_at)<=new Date())throw new ApiError(409,"approval_unavailable","This approval can no longer be decided."); if(data.expected_payload_hash!==approval.payload_hash)throw new ApiError(409,"approval_invalidated","Action details changed. Review again."); await trustedDb(cfg,"approval_requests",{method:"PATCH",query:`id=eq.${id}&user_id=eq.${user.id}&status=eq.awaiting_approval`,body:{status:data.decision,decided_at:new Date().toISOString()}}); const decision=one(await trustedDb(cfg,"approval_decisions",{body:{approval_request_id:id,user_id:user.id,...data,decision_context:{request_id:requestId(request)}}})); await audit(cfg,user,"approval_decided","approval_request",id,requestId(request),{decision:data.decision}); return json({decision}); }
    if (id && action === "execute" && request.method === "POST") { const approval=one(await db(cfg,user,"approval_requests",{query:`id=eq.${id}&${userFilter(user)}&select=*`})); assertExecutable(approval,approval?.payload_hash); await audit(cfg,user,"execution_blocked_provider_unconfigured","approval_request",id,requestId(request),{}); return json({status:"provider_not_configured",executed:false,message:"No authorized live provider is configured. Nothing was booked, paid, sent, or committed."},409); }
  }
  if (group === "consents") {
    if (request.method === "GET") return json({consents:await db(cfg,user,"consent_records",{query:`${userFilter(user)}&select=consent_type,policy_version,granted,granted_at,revoked_at&order=created_at.desc`})});
    if (request.method === "POST") { const data=await body(request,consent); const record={...data,user_id:user.id,granted_at:data.granted?new Date().toISOString():null,revoked_at:data.granted?null:new Date().toISOString()}; return json({consent:one(await db(cfg,user,"consent_records",{method:"POST",body:record}))},201); }
  }
  if (group === "provider-connections" && request.method === "DELETE" && id) { await db(cfg,user,"provider_connections",{method:"PATCH",query:`id=eq.${id}&${userFilter(user)}`,body:{status:"revoked",revoked_at:new Date().toISOString()}}); return noBody(204); }
  throw new ApiError(404,"not_found","Endpoint not found.");
}

export async function onRequest(context) {
  const id=requestId(context.request);
  try { const cfg=config(context.env); enforceOrigin(context.request,cfg); const pathname=new URL(context.request.url).pathname; const length=Number(context.request.headers.get("Content-Length")||0); if(length>1048576)throw new ApiError(413,"body_too_large","Request body is too large."); const csrfExempt=/\/auth\/(login|register|password-reset)$/.test(pathname)||pathname.endsWith("/health")||pathname.endsWith("/readiness"); if(!csrfExempt)enforceCsrf(context.request,cfg); const response=await route(context,cfg); const headers=new Headers(response.headers); Object.entries(securityHeaders({"X-Request-ID":id})).forEach(([k,v])=>headers.set(k,v)); return new Response(response.body,{status:response.status,headers}); }
  catch(error){ if(error instanceof ValidationError)return json({error:{code:"validation_failed",message:"Check the submitted information.",fields:error.fields,requestId:id}},400); console.error(JSON.stringify({level:"error",requestId:id,code:error.code||"internal_error"})); return safeError(error,id); }
}
