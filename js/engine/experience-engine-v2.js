import { missionConfidence, rankProviderOptions } from "./trusted-journey.js";

export const ONE_PICK_LABEL = "⭐ ONE Pick";
export const ONE_READY_LABEL = "ONE Ready";

const FACTS = Object.freeze({
  lowestTotalPrice: ["Lowest total price", "최저 총액"],
  bestValue: ["Best overall value", "전체 조건 대비 가장 좋은 가치"],
  nearPreferredLocation: ["Near your preferred location", "선호 위치와 가까움"],
  freeCancellation: ["Free cancellation", "무료 취소"],
  refundFlexibility: ["Refund flexibility", "환불 조건이 유연함"],
  matchesPreferences: ["Matches your saved preferences", "저장된 선호 설정과 일치"],
  loyaltyPoints: ["Earns loyalty points", "로열티 포인트 적립"],
  highestVerifiedRating: ["Highest verified rating", "확인된 평점이 가장 높음"],
  lowestTravelTime: ["Lowest travel time", "이동 시간이 가장 짧음"],
  breakfastIncluded: ["Breakfast included", "조식 포함"],
  directFlight: ["Direct flight", "직항"],
  lowestHiddenFees: ["Lowest hidden fees", "추가 비용이 가장 적음"],
  bestReviewQuality: ["Best review quality", "리뷰 품질이 가장 좋음"]
});

export function verifiedPickReasons(option, language = "en") {
  const index = language === "ko" ? 1 : 0;
  return Object.keys(FACTS).filter(key => option.verifiedFacts?.[key] === true).slice(0, 3).map(key => FACTS[key][index]);
}

export function createOnePick(options, mode = "balanced", language = "en") {
  const ranked = rankProviderOptions(options, mode);
  if (!ranked.length) return { pick:null, alternatives:[] };
  const [pick, ...alternatives] = ranked;
  return { pick:{ ...pick, label:ONE_PICK_LABEL, reasons:verifiedPickReasons(pick, language) }, alternatives };
}

export function explainTradeoff(selected, alternative, language = "en") {
  if (!selected || !alternative) return "";
  const ko = language === "ko", selectedCost = Number(selected.totalCost), alternativeCost = Number(alternative.totalCost);
  if (Number.isFinite(selectedCost) && Number.isFinite(alternativeCost) && selectedCost > alternativeCost && selected.travelMinutes < alternative.travelMinutes) {
    const difference = selectedCost - alternativeCost, minutes = alternative.travelMinutes - selected.travelMinutes;
    return ko ? `이 옵션은 ${difference.toLocaleString()}원 더 비싸지만 ${minutes}분을 절약합니다.` : `This option costs ${difference.toLocaleString()} more but saves ${minutes} minutes.`;
  }
  if (selected.verifiedFacts?.freeCancellation && !alternative.verifiedFacts?.freeCancellation) return ko ? "조금 더 비싸더라도 무료 취소가 포함됩니다." : "It may cost more, but includes free cancellation.";
  if (selected.verifiedFacts?.matchesPreferences) return ko ? "저장된 선호 설정과 일치합니다." : "This option matches your saved preferences.";
  return "";
}

export function oneReady(readiness) {
  const result = missionConfidence(readiness);
  return { ...result, label:ONE_READY_LABEL };
}

const TRUST_FACTORS = ["reliability","refundQuality","priceAccuracy","reviewConfidence","supportQuality","availabilityFreshness"];
export function providerTrust(provider = {}) {
  return Object.fromEntries(TRUST_FACTORS.map(key => [key, Number.isFinite(Number(provider.verifiedTrust?.[key])) ? Number(provider.verifiedTrust[key]) : "Unknown"]));
}

const MEMORY_FIELDS = new Set(["selectedOption","onePick","budget","actualPrice","favoriteLocations","favoriteHotels","favoriteRestaurants","disliked","skipped","missionRating"]);
const SENSITIVE = /(passport|visa|health|medical|child|payment|card|cvv|password|token|full.?address|email|phone)/i;
export function sanitizeMissionMemory(input = {}) {
  return Object.fromEntries(Object.entries(input).filter(([key,value]) => MEMORY_FIELDS.has(key) && !SENSITIVE.test(key) && !SENSITIVE.test(String(value))).map(([key,value]) => [key, typeof value === "string" ? value.slice(0,240) : value]));
}

export function buildMissionReceiptV2({ receipt, onePick, selectedOption, duration, estimatedSavings, preferencesUsed = [] }) {
  return { ...receipt, onePick:onePick?.name || onePick || null, selectedOption:selectedOption?.name || selectedOption || null, selectionNote:(onePick?.name||onePick)===(selectedOption?.name||selectedOption)?null:"User selected another option.", missionCompleted:receipt.executionStatus === "Simulated only", missionDuration:duration || null, estimatedSavings:estimatedSavings ?? "Not verified", preferencesUsed, oneReadyScore:receipt.confidenceScore };
}
