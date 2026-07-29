export class ValidationError extends Error { constructor(fields){super("Validation failed");this.fields=fields;} }
const text=(value,min,max)=>typeof value==="string"&&value.trim().length>=min&&value.length<=max;
const exact=(object,keys)=>Object.keys(object).every(key=>keys.includes(key));
const schema=(keys,validate)=>({parse(value){const fields=validate(value);if(!value||typeof value!=="object"||Array.isArray(value)||!exact(value,keys)||fields.length)throw new ValidationError(fields.length?fields:[{path:"request",code:"invalid_object"}]);return value;}});
const safeString=(value,max=240)=>value===null||value===undefined||typeof value==="string"&&value.length<=max;
const safeArray=(value,max=20)=>value===null||value===undefined||Array.isArray(value)&&value.length<=max&&value.every(item=>typeof item==="string"&&item.length<=120);
const sensitiveKey=/(password|passport|visa|national.?id|resident|card|cvv|bank|token|secret|otp|biometric|medical|health|document|provider.?password)/i;
const safeJson=(value,depth=0)=> {
  if (depth>4) return false;
  if (value===null || ["string","number","boolean"].includes(typeof value)) return typeof value!=="string" || value.length<=500;
  if (Array.isArray(value)) return value.length<=50 && value.every(item=>safeJson(item,depth+1));
  if (typeof value==="object") return Object.entries(value).length<=50 && Object.entries(value).every(([key,item])=>key.length<=80&&!sensitiveKey.test(key)&&safeJson(item,depth+1));
  return false;
};
export const emailPassword=schema(["email","password"],v=>{const e=[];if(!text(v?.email,3,254)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))e.push({path:"email",code:"invalid_email"});if(!text(v?.password,8,128)||!/[A-Za-z]/.test(v.password)||!/[0-9]/.test(v.password))e.push({path:"password",code:"weak_password"});return e;});
emailPassword.pick=()=>schema(["email"],v=>text(v?.email,3,254)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)?[]:[{path:"email",code:"invalid_email"}]);
export const registration=schema(["email","password","displayName","language"],v=>[...(()=>{try{emailPassword.parse({email:v?.email,password:v?.password});return[]}catch(e){return e.fields}})(),...(!text(v?.displayName,2,80)?[{path:"displayName",code:"invalid_length"}]:[]),...(!["en","ko","es"].includes(v?.language)?[{path:"language",code:"invalid_enum"}]:[])]);
export const profileUpdate=schema(["display_name","preferred_language","timezone","country","city","preferred_airport","preferred_airlines","preferred_hotel_types","seat_preference","travel_style","dietary_preferences","accessibility_preferences","favorite_cuisines","disliked_foods","budget_preference","time_format","currency_preference","emergency_contact","memory_enabled"],v=>[
  ...(v?.display_name!==undefined&&!safeString(v.display_name,80)?[{path:"display_name",code:"invalid_length"}]:[]),
  ...(v?.preferred_language!==undefined&&!["en","ko","es"].includes(v.preferred_language)?[{path:"preferred_language",code:"invalid_enum"}]:[]),
  ...(v?.timezone!==undefined&&!safeString(v.timezone,64)?[{path:"timezone",code:"invalid_length"}]:[]),
  ...(["country","city","preferred_airport","seat_preference","travel_style","budget_preference","time_format","currency_preference"].flatMap(key=>v?.[key]!==undefined&&!safeString(v[key],120)?[{path:key,code:"invalid_length"}]:[])),
  ...(["preferred_airlines","preferred_hotel_types","dietary_preferences","accessibility_preferences","favorite_cuisines","disliked_foods"].flatMap(key=>v?.[key]!==undefined&&!safeArray(v[key])?[{path:key,code:"invalid_array"}]:[])),
  ...(v?.emergency_contact!==undefined&&!safeJson(v.emergency_contact)?[{path:"emergency_contact",code:"invalid_safe_object"}]:[]),
  ...(v?.memory_enabled!==undefined&&typeof v.memory_enabled!=="boolean"?[{path:"memory_enabled",code:"invalid_type"}]:[])
]);
export const preference=schema(["category","preference_key","preference_value","memory_scope","source_mission_id","user_confirmed","expires_at"],v=>[...(!text(v?.category,1,40)||sensitiveKey.test(v.category)?[{path:"category",code:"invalid_length"}]:[]),...(!text(v?.preference_key,1,80)||!/^[a-z0-9_.-]+$/i.test(v.preference_key)||sensitiveKey.test(v.preference_key)?[{path:"preference_key",code:"invalid_format"}]:[]),...(!safeJson(v?.preference_value)?[{path:"preference_value",code:"invalid_type"}]:[]),...(v?.memory_scope!==undefined&&!["permanent_profile","mission_specific"].includes(v.memory_scope)?[{path:"memory_scope",code:"invalid_enum"}]:[]),...(v?.user_confirmed!==undefined&&typeof v.user_confirmed!=="boolean"?[{path:"user_confirmed",code:"invalid_type"}]:[])]);
export const memoryRecord=schema(["domain","memory_key","memory_value","memory_type","source_mission_id","explanation","user_confirmed","expires_at"],v=>[
  ...(!text(v?.domain,1,40)||sensitiveKey.test(v.domain)?[{path:"domain",code:"invalid_domain"}]:[]),
  ...(!text(v?.memory_key,1,80)||!/^[a-z0-9_.-]+$/i.test(v.memory_key)||sensitiveKey.test(v.memory_key)?[{path:"memory_key",code:"invalid_key"}]:[]),
  ...(!safeJson(v?.memory_value)?[{path:"memory_value",code:"invalid_value"}]:[]),
  ...(!["permanent_profile","mission_specific"].includes(v?.memory_type)?[{path:"memory_type",code:"invalid_enum"}]:[]),
  ...(v?.memory_type==="permanent_profile"&&v?.user_confirmed!==true?[{path:"user_confirmed",code:"explicit_approval_required"}]:[]),
  ...(v?.explanation!==undefined&&!safeString(v.explanation,500)?[{path:"explanation",code:"invalid_length"}]:[])
]);
export const memoryUpdate=schema(["memory_value","disabled","explanation"],v=>[
  ...(v?.memory_value!==undefined&&!safeJson(v.memory_value)?[{path:"memory_value",code:"invalid_value"}]:[]),
  ...(v?.disabled!==undefined&&typeof v.disabled!=="boolean"?[{path:"disabled",code:"invalid_type"}]:[]),
  ...(v?.explanation!==undefined&&!safeString(v.explanation,500)?[{path:"explanation",code:"invalid_length"}]:[])
]);
export const missionCreate=schema(["mission_type","title","original_request","normalized_request","metadata"],v=>[...(!["travel","shopping","tutor","business","general"].includes(v?.mission_type)?[{path:"mission_type",code:"invalid_enum"}]:[]),...(!text(v?.title,1,160)?[{path:"title",code:"invalid_length"}]:[]),...(!text(v?.original_request,1,4000)?[{path:"original_request",code:"invalid_length"}]:[])]);
export const approvalDecision=schema(["decision","confirmation_method","expected_payload_hash"],v=>[...(!["approved","rejected"].includes(v?.decision)?[{path:"decision",code:"invalid_enum"}]:[]),...(!["explicit_button","reauthenticated"].includes(v?.confirmation_method)?[{path:"confirmation_method",code:"invalid_enum"}]:[]),...(!/^[a-f0-9]{64}$/.test(v?.expected_payload_hash||"")?[{path:"expected_payload_hash",code:"invalid_hash"}]:[])]);
export const approvalRequest=schema(["mission_id","mission_step_id","action_type","action_description","protected_action_reference","provider","amount","currency","cancellation_terms","risk_level","exact_action_payload"],v=>[...(!/^[0-9a-f-]{36}$/i.test(v?.mission_id||"")?[{path:"mission_id",code:"invalid_uuid"}]:[]),...(!["payment","purchase","booking","reservation","transfer","external_message","legal_submission","government_submission","contract_acceptance","account_change","external_delete","sensitive_data_share"].includes(v?.action_type)?[{path:"action_type",code:"invalid_enum"}]:[]),...(!text(v?.action_description,1,2000)?[{path:"action_description",code:"invalid_length"}]:[]),...(!text(v?.protected_action_reference,1,500)?[{path:"protected_action_reference",code:"invalid_length"}]:[]),...(typeof v?.exact_action_payload!=="object"||!v.exact_action_payload?[{path:"exact_action_payload",code:"invalid_object"}]:[]),...(!["low","medium","high","critical"].includes(v?.risk_level)?[{path:"risk_level",code:"invalid_enum"}]:[])]);
export const consent=schema(["consent_type","policy_version","granted"],v=>[...(!["analytics","preferences","marketing","profile_memory","provider_sharing"].includes(v?.consent_type)?[{path:"consent_type",code:"invalid_enum"}]:[]),...(!text(v?.policy_version,1,40)?[{path:"policy_version",code:"invalid_length"}]:[]),...(typeof v?.granted!=="boolean"?[{path:"granted",code:"invalid_type"}]:[])]);
export async function body(request,validator){let value;try{value=await request.json()}catch{throw new ValidationError([{path:"request",code:"invalid_json"}]);}return validator.parse(value);}
