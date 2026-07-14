export const IRREVERSIBLE_ACTIONS = Object.freeze([
  "book", "buy", "reserve", "sign", "submit", "pay", "legally_commit",
  "share_personal_data", "accept_provider_terms", "start_regulated_service"
]);

export function buildApprovalDisclosure({ action, provider, estimatedCost, taxesAndFees, cancellationTerms, personalDataShared=[], materialRisks=[] }={}) {
  return Object.freeze({
    action: action || "Not selected",
    provider: provider || "Not selected",
    estimatedCost: estimatedCost || "Estimate unavailable",
    taxesAndFees: taxesAndFees || "Confirm with provider",
    cancellationTerms: cancellationTerms || "Review provider terms before approval",
    personalDataShared,
    materialRisks,
    confirmationRequired: true,
    executionMode: "simulation_until_authorized_integration"
  });
}

const MESSAGES = Object.freeze({
  en: "Nothing will be booked, purchased, reserved, signed, submitted, paid for, or legally committed until you approve.",
  ko: "사용자가 승인하기 전에는 예약, 결제, 구매, 서명, 제출 또는 법적 약속이 진행되지 않습니다."
});

export function approvalPolicy(language = "en") {
  return { required: true, approved: false, message: MESSAGES[language === "ko" ? "ko" : "en"] };
}

export function isApproved(approval) {
  return approval?.required === true && approval?.approved === true;
}

export function requireApproval(action, approval) {
  if (IRREVERSIBLE_ACTIONS.includes(action) && !isApproved(approval)) {
    throw new Error(`Approval required before action: ${action}`);
  }
}


