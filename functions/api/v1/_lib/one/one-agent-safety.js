const injection=/ignore (all|previous)|system prompt|developer message|reveal.*secret|bypass.*approval|execute without approval/i;
const sensitiveKeys=/passport|visa_number|national_id|payment|card|health|medical_record|child_name|password|secret/i;
export const EXECUTION_FLAGS=Object.freeze({booking:false,payment:false,emailSending:false,providerContact:false,deployment:false,destructiveRepositoryActions:false});
export function sanitizeText(value,max=4000){return String(value??"").normalize("NFKC").replace(/[<>]/g,"").replace(/[\u0000-\u001f]/g," ").replace(/\s+/g," ").trim().slice(0,max);}
export function detectPromptInjection(value){return injection.test(String(value||""));}
export function minimizeContext(context={}){return Object.fromEntries(Object.entries(context).filter(([key,value])=>!sensitiveKeys.test(key)&&value!=null).slice(0,30));}
export function assertWorkspaceAccess(accountId,workspace={}){if(!accountId||!workspace.id||!Array.isArray(workspace.memberIds)||!workspace.memberIds.includes(accountId))throw new Error("workspace_access_denied");return true;}
export function requiresApproval(level){return Number(level)>=3;}
export function canExecute(action,approval){if(!action||requiresApproval(action.approvalLevel)&&approval?.status!=="APPROVED")return false;return action.kind==="SIMULATED"&&Object.values(EXECUTION_FLAGS).every(value=>value===false);}
