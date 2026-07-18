const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export const QUALITY_MODES = Object.freeze(["cheapest", "best_value", "fastest", "highest_quality", "balanced"]);

const WEIGHTS = Object.freeze({
  cheapest: { cost: .55, refundability: .12, reliability: .13, rating: .08, location: .05, preference: .07 },
  best_value: { cost: .28, refundability: .18, reliability: .16, rating: .16, location: .10, preference: .12 },
  fastest: { travelTime: .48, reliability: .20, cost: .12, refundability: .08, preference: .12 },
  highest_quality: { rating: .30, reliability: .22, refundability: .15, location: .13, preference: .20 },
  balanced: { cost: .20, refundability: .16, reliability: .18, rating: .16, location: .12, travelTime: .08, preference: .10 }
});

const factor = (option, key) => Number.isFinite(Number(option[key])) ? clamp(Number(option[key])) : null;

export function scoreProviderOption(option, mode = "balanced") {
  const weights = WEIGHTS[QUALITY_MODES.includes(mode) ? mode : "balanced"];
  let total = 0, availableWeight = 0;
  const inputs = [];
  for (const [key, weight] of Object.entries(weights)) {
    const value = factor(option, key);
    if (value === null) { inputs.push({ key, available: false, explanation: "Not available from this provider." }); continue; }
    total += value * weight; availableWeight += weight;
    inputs.push({ key, available: true, value, weight });
  }
  const score = availableWeight ? Math.round(total / availableWeight) : 0;
  const reasons = inputs.filter(item => item.available).sort((a,b) => b.value * b.weight - a.value * a.weight).slice(0,3).map(item => item.key);
  return { score, mode, reasons, inputs };
}

export function rankProviderOptions(options, mode = "balanced") {
  return options.map(option => ({ ...option, quality: scoreProviderOption(option, mode) })).sort((a,b) => b.quality.score - a.quality.score);
}

const CONFIDENCE_FACTORS = Object.freeze({
  requiredQuestions: 15, destination: 8, weather: 6, currency: 5, flightFreshness: 10,
  hotelFreshness: 10, budget: 8, entrySource: 6, passportConfirmedByUser: 4,
  transportation: 6, providerAvailability: 8, cancellationTerms: 6, approvalComplete: 8
});

export function missionConfidence(readiness = {}) {
  let earned = 0, possible = 0;
  const ready = [], attention = [];
  for (const [key, weight] of Object.entries(CONFIDENCE_FACTORS)) {
    possible += weight;
    const state = readiness[key];
    if (state === true || state === "verified") { earned += weight; ready.push(key); }
    else if (state === "simulated") { earned += weight * .35; attention.push(`${key}: simulated`); }
    else if (state === "stale") { earned += weight * .25; attention.push(`${key}: old`); }
    else if (state === "conflicting") attention.push(`${key}: conflicting`);
    else attention.push(`${key}: missing or unverified`);
  }
  return { score: Math.round(100 * earned / possible), ready, attention };
}

const canonical = value => JSON.stringify(value, Object.keys(value).sort());
const hex = buffer => [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2,"0")).join("");
export async function hashReleasePackage(value) {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical(value))));
}

export async function createDataReleasePreview(input, now = Date.now()) {
  const required = ["missionId","provider","action","purpose","sharedFields"];
  if (required.some(key => !input[key])) throw new Error("release_package_incomplete");
  const exact = {
    missionId: String(input.missionId), provider: String(input.provider), action: String(input.action),
    purpose: String(input.purpose), sharedFields: [...new Set(input.sharedFields)].sort(),
    excludedFields: [...new Set(input.excludedFields || [])].sort(), version: Number(input.version || 1),
    expiresAt: new Date(now + Math.min(Number(input.ttlMs || 600000), 900000)).toISOString(),
    nonce: input.nonce || crypto.randomUUID()
  };
  return Object.freeze({ ...exact, hash: await hashReleasePackage(exact), status: "awaiting_approval", singleUse: true });
}

export function assertReleaseApproval(pkg, { hash, now = Date.now(), consumed = false } = {}) {
  if (!pkg || pkg.status !== "approved") throw new Error("approval_required");
  if (pkg.hash !== hash) throw new Error("approval_invalidated");
  if (new Date(pkg.expiresAt).getTime() <= now) throw new Error("approval_expired");
  if (consumed) throw new Error("approval_reused");
  return true;
}

export async function simulateExecution({ approval, approvalHash, provider, failure = null, now = Date.now() }) {
  assertReleaseApproval(approval, { hash: approvalHash, now });
  if (!provider || provider.mode !== "demo") throw new Error("demo_provider_required");
  const timeline = ["preparing_request", "sending_approved_fields", "waiting_for_provider"];
  if (failure) return { executed: false, status: failure, timeline: [...timeline, failure], message: "Demonstration only — no reservation or payment was made." };
  const response = await provider.execute({ approved: true });
  if (!response || response.status !== "confirmed" || !response.confirmationReference) throw new Error("invalid_provider_response");
  return { executed: false, status: "demo_completed", confirmationReference: response.confirmationReference, timeline: [...timeline,"provider_response_received","confirmation_created"], message: "Demonstration only — no reservation or payment was made." };
}

export function createMissionReceipt({ mission, execution, confidence, approval }) {
  if (execution?.status !== "demo_completed") throw new Error("valid_confirmation_required");
  return Object.freeze({
    title: mission.title, missionId: mission.id, createdAt: new Date().toISOString(), provider: mission.provider,
    travelers: mission.travelers, dates: mission.dates, selectedOptions: mission.selectedOptions,
    totalEstimatedPrice: mission.totalEstimatedPrice, priceStatus: "Estimated demonstration price — recheck required",
    cancellationTerms: mission.cancellationTerms || "Not available from this provider.",
    informationShared: approval.sharedFields || [], approvalTime: approval.approvedAt,
    executionStatus: "Simulated only", confirmationReference: execution.confirmationReference,
    confidenceScore: confidence.score, warnings: ["No reservation or payment was made.", ...(confidence.attention || [])]
  });
}

export function missionTimeline(events = []) {
  const safeStatus = new Set(["created","preferences_applied","options_prepared","recommendation_selected","customized","approved","execution_attempted","completed","failed","archived"]);
  return events.filter(event => safeStatus.has(event.status)).map(event => ({ time: event.time, status: event.status, explanation: String(event.explanation || "").slice(0,240) }));
}
