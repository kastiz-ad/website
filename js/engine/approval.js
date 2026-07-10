export const IRREVERSIBLE_ACTIONS = Object.freeze([
  "book", "buy", "reserve", "sign", "submit", "pay", "legally_commit"
]);

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


