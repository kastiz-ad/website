import { ApiError } from "./http.js";
export const consequentialActions = new Set(["payment", "purchase", "booking", "reservation", "transfer", "external_message", "legal_submission", "government_submission", "contract_acceptance", "account_change", "external_delete", "sensitive_data_share"]);
export async function payloadHash(payload) { const bytes = new TextEncoder().encode(JSON.stringify(payload)); return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(v => v.toString(16).padStart(2,"0")).join(""); }
export function assertExecutable(approval, expectedHash, now = Date.now()) {
  if (!approval || approval.status !== "approved") throw new ApiError(409, "approval_required", "This action requires explicit approval.");
  if (new Date(approval.expires_at).getTime() <= now) throw new ApiError(409, "approval_expired", "Approval expired. Review the action again.");
  if (approval.payload_hash !== expectedHash) throw new ApiError(409, "approval_invalidated", "Action details changed. Review and approve again.");
  if (approval.consumed_at) throw new ApiError(409, "approval_already_used", "This approval has already been used.");
}
