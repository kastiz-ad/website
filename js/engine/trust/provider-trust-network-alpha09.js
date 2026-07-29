export const ALPHA09_PROVIDER_TRUST_NETWORK_VERSION = "ALPHA-09";

export const TRUST_BADGES = Object.freeze({
  HIGHLY_TRUSTED: "highly_trusted",
  RECOMMENDED: "recommended",
  GOOD_MATCH: "good_match",
  RECENTLY_CHANGED: "recently_changed",
  LIVE_VERIFICATION_RECOMMENDED: "live_verification_recommended"
});

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

const normalizeText = (value = "") => String(value || "")
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9가-힣\s.-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const compactId = (value = "") => normalizeText(value).replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");

const sourceWeight = (sourceState = "") => ({
  verified_live: 0.18,
  cached_public: 0.1,
  estimated: -0.04,
  placeholder: -0.16,
  unavailable: -0.22,
  mock: -0.1,
  future: -0.12
}[sourceState] ?? -0.06);

const sourceEvidence = (sourceState = "") => ({
  verified_live: 0.9,
  cached_public: 0.7,
  estimated: 0.42,
  placeholder: 0.24,
  unavailable: 0.12,
  mock: 0.3,
  future: 0.2
}[sourceState] ?? 0.35);

const defaultSignalsByCategory = (category = "") => {
  const key = normalizeText(category);
  if (/health|hospital|clinic|dent|pharmacy|medical|병원|치과|약국/.test(key)) {
    return {
      reliability: 0.68,
      cancellationHistory: 0.58,
      complaintFrequency: 0.54,
      refundExperience: 0.45,
      responseQuality: 0.66,
      safetyRecord: 0.74,
      officialCertifications: 0.72,
      verifiedPublicReputation: 0.62,
      consistencyOverTime: 0.6,
      missionSuitability: 0.64,
      recentPerformance: 0.58,
      providerStability: 0.66
    };
  }
  if (/insurance|bank|finance|legal|law|tax|gov|government|visa|immigration|보험|은행|법률|세무|정부|비자/.test(key)) {
    return {
      reliability: 0.66,
      cancellationHistory: 0.52,
      complaintFrequency: 0.5,
      refundExperience: 0.5,
      responseQuality: 0.62,
      safetyRecord: 0.7,
      officialCertifications: 0.72,
      verifiedPublicReputation: 0.6,
      consistencyOverTime: 0.64,
      missionSuitability: 0.62,
      recentPerformance: 0.56,
      providerStability: 0.7
    };
  }
  if (/flight|airline|hotel|restaurant|transport|travel|항공|호텔|식당|교통/.test(key)) {
    return {
      reliability: 0.64,
      cancellationHistory: 0.58,
      complaintFrequency: 0.56,
      refundExperience: 0.55,
      responseQuality: 0.6,
      safetyRecord: 0.65,
      officialCertifications: 0.52,
      verifiedPublicReputation: 0.64,
      consistencyOverTime: 0.62,
      missionSuitability: 0.64,
      recentPerformance: 0.58,
      providerStability: 0.62
    };
  }
  return {
    reliability: 0.58,
    cancellationHistory: 0.52,
    complaintFrequency: 0.5,
    refundExperience: 0.48,
    responseQuality: 0.56,
    safetyRecord: 0.56,
    officialCertifications: 0.46,
    verifiedPublicReputation: 0.55,
    consistencyOverTime: 0.54,
    missionSuitability: 0.56,
    recentPerformance: 0.5,
    providerStability: 0.54
  };
};

const signalWeights = Object.freeze({
  reliability: 0.13,
  cancellationHistory: 0.08,
  complaintFrequency: 0.09,
  refundExperience: 0.07,
  responseQuality: 0.09,
  safetyRecord: 0.11,
  officialCertifications: 0.09,
  verifiedPublicReputation: 0.09,
  consistencyOverTime: 0.08,
  missionSuitability: 0.11,
  userPreferenceMatch: 0.03,
  recentPerformance: 0.08,
  providerStability: 0.05
});

const extractProviderName = (provider = {}) => provider.name
  || provider.provider
  || provider.providerName
  || provider.venueName
  || provider.type
  || provider.label
  || provider.id
  || "Provider";

const inferCategory = (provider = {}, fallback = "") => provider.trustCategory
  || provider.categoryType
  || provider.providerType
  || provider.kind
  || provider.category
  || fallback
  || "provider";

const mergeSignals = (provider = {}, category = "") => {
  const base = defaultSignalsByCategory(category);
  const explicit = provider.trustSignals || provider.trustEvidence || {};
  const merged = { ...base };
  for (const key of Object.keys(signalWeights)) {
    if (Number.isFinite(Number(explicit[key]))) merged[key] = clamp(Number(explicit[key]));
  }
  if (Number.isFinite(Number(provider.rating))) {
    merged.verifiedPublicReputation = clamp((Number(provider.rating) - 1) / 4);
  }
  if (provider.sourceState === "verified_live") {
    merged.recentPerformance = Math.max(merged.recentPerformance, 0.72);
  }
  return merged;
};

const contextNeed = (context = {}) => normalizeText([
  context.missionType,
  context.providerType,
  context.intent,
  context.userGoal,
  context.relationship,
  context.priority,
  context.budgetTier,
  context.destination?.city,
  context.destination?.country,
  context.rawInput
].filter(Boolean).join(" "));

const contextualAdjustment = (provider = {}, category = "", context = {}) => {
  const need = contextNeed(context);
  const text = normalizeText([
    extractProviderName(provider),
    category,
    provider.cuisine,
    provider.tags?.join?.(" "),
    provider.reason,
    provider.reasonKo,
    provider.recommendation
  ].filter(Boolean).join(" "));
  let adjustment = 0;
  if (/budget|cheap|low cost|가성비|저렴|알뜰/.test(need)) {
    adjustment += /budget|value|low cost|가성비|저렴|알뜰|economy/.test(text) ? 0.05 : -0.01;
  }
  if (/luxury|premium|romantic|girlfriend|boyfriend|date|고급|럭셔리|연인|여친|남친|데이트/.test(need)) {
    adjustment += /luxury|premium|romantic|view|fine|boutique|고급|전망|분위기|데이트|커플/.test(text) ? 0.05 : 0;
  }
  if (/family|kids|parent|child|가족|아이|부모/.test(need)) {
    adjustment += /family|kid|accessible|safe|quiet|가족|아이|안전|편한/.test(text) ? 0.05 : 0;
  }
  if (/business|work|출장|업무/.test(need)) {
    adjustment += /central|reliable|business|station|airport|중심|역|공항|비즈니스/.test(text) ? 0.05 : 0;
  }
  if (/urgent|emergency|today|tonight|응급|긴급|오늘|야간/.test(need)) {
    adjustment += /24|emergency|urgent|open|today|응급|야간|오늘|운영/.test(text) ? 0.06 : -0.04;
  }
  return adjustment;
};

const preferenceAdjustment = (provider = {}, memory = {}) => {
  const text = normalizeText([
    extractProviderName(provider),
    provider.category,
    provider.cuisine,
    provider.tags?.join?.(" ")
  ].filter(Boolean).join(" "));
  const memories = [
    ...(Array.isArray(memory.appliedMemories) ? memory.appliedMemories : []),
    ...(Array.isArray(memory.memoryExplanations) ? memory.memoryExplanations : []),
    ...(Array.isArray(memory.preferences) ? memory.preferences : [])
  ].map((item) => normalizeText(item.value || item.preference || item.key || item.reason || item));
  const matches = memories.filter((value) => value && text.includes(value));
  return Math.min(0.06, matches.length * 0.025);
};

const hasWorldRisk = (provider = {}, worldIntelligence = {}) => {
  const providerText = normalizeText(extractProviderName(provider));
  const failures = Array.isArray(worldIntelligence.failures) ? worldIntelligence.failures : [];
  return failures.some((failure) => {
    const combined = normalizeText(`${failure.providerType || ""} ${failure.message || ""}`);
    return /disruption|warning|failure|unavailable|advisory|restriction|지연|중단|주의|경보|제한/.test(combined)
      && (!providerText || combined.includes(providerText) || combined.includes(normalizeText(inferCategory(provider))));
  });
};

const providerHistoryState = (provider = {}, evidenceLevel = 0) => {
  const history = provider.trustHistory || provider.providerHistory || {};
  if (evidenceLevel < 0.38) return "insufficient_evidence";
  const recent = Number(history.recentPerformance);
  const previous = Number(history.previousPerformance);
  if (Number.isFinite(recent) && Number.isFinite(previous)) {
    if (recent + 0.08 < previous) return "recently_declining";
    if (recent > previous + 0.08) return "improving";
  }
  if (provider.recentlyChanged || provider.serviceDisruption) return "recently_declining";
  return "consistently_reliable";
};

const badgeFor = ({ score, evidenceLevel, changed, warning }) => {
  if (warning || changed) return TRUST_BADGES.RECENTLY_CHANGED;
  if (evidenceLevel < 0.38) return TRUST_BADGES.LIVE_VERIFICATION_RECOMMENDED;
  if (score >= 0.82) return TRUST_BADGES.HIGHLY_TRUSTED;
  if (score >= 0.7) return TRUST_BADGES.RECOMMENDED;
  return TRUST_BADGES.GOOD_MATCH;
};

const badgeLabels = {
  en: {
    [TRUST_BADGES.HIGHLY_TRUSTED]: "Highly Trusted",
    [TRUST_BADGES.RECOMMENDED]: "Recommended",
    [TRUST_BADGES.GOOD_MATCH]: "Good Match",
    [TRUST_BADGES.RECENTLY_CHANGED]: "Recently Changed",
    [TRUST_BADGES.LIVE_VERIFICATION_RECOMMENDED]: "Live Verification Recommended"
  },
  ko: {
    [TRUST_BADGES.HIGHLY_TRUSTED]: "높은 신뢰",
    [TRUST_BADGES.RECOMMENDED]: "추천",
    [TRUST_BADGES.GOOD_MATCH]: "잘 맞음",
    [TRUST_BADGES.RECENTLY_CHANGED]: "최근 변동",
    [TRUST_BADGES.LIVE_VERIFICATION_RECOMMENDED]: "실시간 확인 권장"
  },
  es: {
    [TRUST_BADGES.HIGHLY_TRUSTED]: "Muy confiable",
    [TRUST_BADGES.RECOMMENDED]: "Recomendado",
    [TRUST_BADGES.GOOD_MATCH]: "Buena opción",
    [TRUST_BADGES.RECENTLY_CHANGED]: "Cambio reciente",
    [TRUST_BADGES.LIVE_VERIFICATION_RECOMMENDED]: "Verificación en vivo recomendada"
  }
};

const reasonCatalog = {
  en: {
    reliable: "Reliable service pattern",
    reputation: "public reputation evidence",
    fit: "mission fit",
    source: "source quality",
    verify: "verify before booking",
    warning: "recent provider signal changed"
  },
  ko: {
    reliable: "안정적인 서비스 흐름",
    reputation: "공개 평판 근거",
    fit: "미션 적합성",
    source: "출처 품질",
    verify: "예약 전 확인 권장",
    warning: "최근 제공업체 신호 변동"
  },
  es: {
    reliable: "patrón de servicio confiable",
    reputation: "evidencia pública",
    fit: "encaje con la misión",
    source: "calidad de fuente",
    verify: "verificar antes de reservar",
    warning: "señal reciente cambiada"
  }
};

export const trustBadgeLabel = (badge, language = "en") => (badgeLabels[language] || badgeLabels.en)[badge] || badgeLabels.en[TRUST_BADGES.GOOD_MATCH];

export const evaluateProviderTrust = (provider = {}, context = {}) => {
  const category = inferCategory(provider, context.providerType || context.missionType);
  const sourceState = provider.sourceState || provider.sourceMetadata?.sourceState || context.sourceState || "estimated";
  const signals = mergeSignals(provider, category);
  const weightedSignalScore = Object.entries(signalWeights).reduce((sum, [key, weight]) => sum + clamp(signals[key]) * weight, 0);
  const signalWeightTotal = Object.values(signalWeights).reduce((sum, weight) => sum + weight, 0);
  const signalScore = weightedSignalScore / signalWeightTotal;
  const worldWarning = hasWorldRisk(provider, context.worldIntelligence);
  const evidenceLevel = clamp(sourceEvidence(sourceState) + (provider.trustSignals ? 0.1 : 0) - (worldWarning ? 0.12 : 0));
  const commercialPenalty = provider.sponsored || provider.advertisingPartner || provider.paidPlacement ? -0.03 : 0;
  const preferenceBoost = preferenceAdjustment(provider, context.personalMissionMemory || {});
  const contextBoost = contextualAdjustment(provider, category, context);
  const history = providerHistoryState(provider, evidenceLevel);
  const historyAdjustment = history === "improving" ? 0.03 : history === "recently_declining" ? -0.08 : 0.02;
  const lowTrustCap = Math.min(signals.reliability, signals.safetyRecord || 1) < 0.45 ? 0.58 : 1;
  const rawScore = signalScore + sourceWeight(sourceState) + preferenceBoost + contextBoost + historyAdjustment + commercialPenalty - (worldWarning ? 0.14 : 0);
  const score = clamp(Math.min(rawScore, lowTrustCap));
  const badge = badgeFor({ score, evidenceLevel, changed: history === "recently_declining", warning: worldWarning });
  const language = context.language === "ko" || context.language === "es" ? context.language : "en";
  const reasons = [];
  const copy = reasonCatalog[language] || reasonCatalog.en;
  if (signals.reliability >= 0.62) reasons.push(copy.reliable);
  if (signals.verifiedPublicReputation >= 0.6) reasons.push(copy.reputation);
  if (signals.missionSuitability + contextBoost >= 0.63) reasons.push(copy.fit);
  if (sourceWeight(sourceState) > 0) reasons.push(copy.source);
  if (badge === TRUST_BADGES.LIVE_VERIFICATION_RECOMMENDED) reasons.push(copy.verify);
  if (worldWarning || history === "recently_declining") reasons.push(copy.warning);

  return {
    version: ALPHA09_PROVIDER_TRUST_NETWORK_VERSION,
    providerId: provider.id || compactId(extractProviderName(provider)) || "provider",
    providerName: extractProviderName(provider),
    category,
    sourceState,
    score,
    evidenceLevel,
    badge,
    badgeLabel: trustBadgeLabel(badge, language),
    reasons: [...new Set(reasons)].slice(0, 3),
    explanation: [...new Set(reasons)].slice(0, 3).join("; "),
    warnings: worldWarning
      ? [language === "ko" ? "공식 또는 제공업체 최종 확인이 필요합니다." : language === "es" ? "Se recomienda verificación oficial o del proveedor." : "Official or provider verification recommended."]
      : badge === TRUST_BADGES.LIVE_VERIFICATION_RECOMMENDED
        ? [language === "ko" ? "정보가 제한적입니다. 예약 전 확인하세요." : language === "es" ? "Información limitada. Verifica antes de reservar." : "Limited information available. Recommend verifying before booking."]
        : [],
    history,
    sponsoredIgnored: Boolean(provider.sponsored || provider.advertisingPartner || provider.paidPlacement),
    privacyBoundary: "public_or_provider_safe_signals_only"
  };
};

export const rankProvidersByTrust = (providers = [], context = {}) => {
  const evaluations = providers.map((provider, index) => ({
    provider,
    evaluation: evaluateProviderTrust(provider, context),
    originalIndex: index
  }));
  return evaluations
    .sort((a, b) => {
      if (Math.abs(b.evaluation.score - a.evaluation.score) > 0.0001) return b.evaluation.score - a.evaluation.score;
      return a.originalIndex - b.originalIndex;
    })
    .map((entry, index) => ({
      ...entry.provider,
      trust: { ...entry.evaluation, rank: index + 1 }
    }));
};

const collectProviders = (result = {}) => {
  const withCategory = (items = [], category) => (Array.isArray(items) ? items : []).map((item) => ({ ...item, trustCategory: category }));
  const transport = [
    ...(Array.isArray(result.airportTransfer?.options) ? result.airportTransfer.options : []),
    result.airportTransfer?.recommended
  ].filter(Boolean);
  return [
    ...withCategory(result.flights, "flight"),
    ...withCategory(result.hotels, "hotel"),
    ...withCategory(result.restaurants, "restaurant"),
    ...withCategory(transport, "transport"),
    ...withCategory(result.providers, result.providerType || result.type || "provider"),
    ...withCategory(result.providerOptions, result.providerType || result.type || "provider")
  ];
};

export const buildProviderTrustBrief = ({
  result = {},
  context = {},
  missionDirector = null,
  personalMissionMemory = null,
  worldIntelligence = null,
  language = "en"
} = {}) => {
  const providers = collectProviders(result);
  const dedupe = new Set();
  const uniqueProviders = providers.filter((provider) => {
    const id = `${inferCategory(provider)}:${compactId(extractProviderName(provider))}`;
    if (dedupe.has(id)) return false;
    dedupe.add(id);
    return true;
  });
  const ranked = rankProvidersByTrust(uniqueProviders, {
    ...context,
    language,
    worldIntelligence: worldIntelligence || result.worldIntelligence,
    personalMissionMemory: personalMissionMemory || result.alpha07PersonalMissionMemory
  });
  const byCategory = ranked.reduce((map, provider) => {
    const category = provider.trust?.category || inferCategory(provider);
    if (!map[category]) map[category] = [];
    map[category].push(provider.trust);
    return map;
  }, {});
  const warnings = ranked.flatMap((provider) => provider.trust?.warnings || []);
  return {
    version: ALPHA09_PROVIDER_TRUST_NETWORK_VERSION,
    status: "ready",
    trustPrinciple: "trust_not_advertising",
    missionSpecific: true,
    missionDirectorUsed: Boolean(missionDirector),
    providerCount: uniqueProviders.length,
    categories: Object.keys(byCategory),
    topProviders: ranked.slice(0, 6).map((provider) => provider.trust),
    byCategory,
    warnings: [...new Set(warnings)].slice(0, 5),
    privacyBoundary: "no_private_user_data_or_confidential_provider_data",
    commercialSeparation: "sponsored_status_never_boosts_trust_rank"
  };
};

export const validateProviderTrustBrief = (brief = {}) => {
  const failures = [];
  if (brief.version !== ALPHA09_PROVIDER_TRUST_NETWORK_VERSION) failures.push("wrong_version");
  if (brief.trustPrinciple !== "trust_not_advertising") failures.push("trust_principle_missing");
  if (!brief.commercialSeparation) failures.push("commercial_separation_missing");
  if (!brief.privacyBoundary) failures.push("privacy_boundary_missing");
  if (!Array.isArray(brief.topProviders)) failures.push("top_providers_missing");
  if (brief.topProviders?.some((provider) => /%|stars?|rating/i.test(provider.badgeLabel || ""))) failures.push("badge_style_not_allowed");
  return { ok: failures.length === 0, failures };
};

export const ALPHA09_FOUNDER_PREVIEW_SCENARIOS = Object.freeze([
  { id: "travel-hotel-comparison", missionType: "travel", providerType: "hotel" },
  { id: "restaurant-selection", missionType: "restaurant", providerType: "restaurant" },
  { id: "hospital-recommendation", missionType: "healthcare", providerType: "hospital" },
  { id: "insurance-comparison", missionType: "insurance", providerType: "insurance" },
  { id: "business-banking", missionType: "business", providerType: "banking" }
]);

export const createProviderTrustNetwork = () => ({
  version: ALPHA09_PROVIDER_TRUST_NETWORK_VERSION,
  evaluateProviderTrust,
  rankProvidersByTrust,
  buildProviderTrustBrief,
  validateProviderTrustBrief,
  trustBadgeLabel
});
