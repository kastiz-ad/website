import {
  LOCAL_MISSION_ENGINES,
  LOCAL_MISSION_ENGINE_IDS,
  LOCAL_MISSION_PIPELINE
} from "./local-mission-registry.js";

const LABELS = {
  en: {
    demoSource: "Prototype provider layer",
    unknownLocation: "location to confirm",
    noExecution: "No booking, payment, provider contact, submission, or legal commitment occurs without explicit approval.",
    fallback: "No live provider result is available yet, so ONE prepared a safe prototype shortlist."
  },
  ko: {
    demoSource: "프로토타입 제공업체 레이어",
    unknownLocation: "확인이 필요한 위치",
    noExecution: "명시적 승인 전에는 예약, 결제, 제공업체 연락, 제출 또는 법적 약속이 진행되지 않습니다.",
    fallback: "아직 실시간 제공업체 결과가 없어 안전한 프로토타입 후보를 준비했습니다."
  },
  es: {
    demoSource: "Capa de proveedores prototipo",
    unknownLocation: "ubicación por confirmar",
    noExecution: "No se reserva, paga, contacta, envía ni compromete nada sin aprobación explícita.",
    fallback: "Aún no hay resultado de proveedor en vivo, así que ONE preparó una lista prototipo segura."
  }
};

const normalizeLanguage = (language = "en") => ["en", "ko", "es"].includes(language) ? language : "en";

export function isLocalMissionType(type) {
  return LOCAL_MISSION_ENGINE_IDS.includes(type);
}

export function getLocalMissionEngine(type) {
  return LOCAL_MISSION_ENGINES[type] || null;
}

export function rankLocalProviders({ providers = [], engine, needs = {} } = {}) {
  const serviceWords = new Set(String(needs.goal || needs.service || "").toLowerCase().split(/[^a-z0-9가-힣]+/).filter(Boolean));
  return providers.map((provider, index) => {
    const searchable = [
      provider.name,
      provider.businessName,
      provider.providerType,
      provider.service,
      provider.specialty,
      ...(provider.languagesSupported || [])
    ].join(" ").toLowerCase();
    const goalScore = [...serviceWords].filter((word) => searchable.includes(word)).length * 10;
    const languageScore = provider.languagesSupported?.includes(needs.language) ? 8 : 0;
    const availabilityScore = /available|open|same|today|이번|오늘/i.test(String(provider.availability || "")) ? 8 : 0;
    const distanceScore = Number.isFinite(Number(provider.distanceMinutes)) ? Math.max(0, 12 - Number(provider.distanceMinutes) / 5) : 4;
    const baseScore = 70 - index * 4;
    return {
      ...provider,
      score: Math.round(baseScore + goalScore + languageScore + availabilityScore + distanceScore),
      matchReasons: [
        engine?.rankingSignals?.[0] || "goal match",
        engine?.rankingSignals?.[1] || "location fit",
        provider.price || provider.estimatedCost ? "price clarity" : "approval-stage price check"
      ]
    };
  }).sort((a, b) => b.score - a.score);
}

export function buildLocalMissionPlan(input = {}) {
  const language = normalizeLanguage(input.language);
  const labels = LABELS[language];
  const engine = getLocalMissionEngine(input.type || input.providerType || input.category);
  if (!engine) {
    return {
      supported: false,
      pipeline: LOCAL_MISSION_PIPELINE,
      approvalRequired: true,
      executionEnabled: false,
      reason: "Unsupported local mission type"
    };
  }

  const location = input.location || input.destination?.city || input.currentLocation || labels.unknownLocation;
  const providerSeeds = input.providers?.length ? input.providers : engine.services.slice(0, 4).map((service, index) => ({
    id: `${engine.id}-demo-${index + 1}`,
    name: `${location} ${service}`,
    providerType: engine.providerTypes[index % engine.providerTypes.length],
    service,
    availability: index === 0 ? "available after approval check" : "to confirm",
    estimatedCost: null,
    languagesSupported: [language],
    source: labels.demoSource
  }));
  const rankedProviders = rankLocalProviders({
    providers: providerSeeds,
    engine,
    needs: { goal: input.goal || input.mission || "", service: input.service, language }
  });

  return {
    supported: true,
    version: "V11",
    pipeline: LOCAL_MISSION_PIPELINE,
    engineId: engine.id,
    engineLabel: engine.labels[language] || engine.labels.en,
    mission: input.mission || "",
    location,
    understoodGoal: {
      goal: input.goal || input.mission || "",
      serviceCategory: engine.id,
      language,
      locationResolved: Boolean(location)
    },
    essentialFollowUps: engine.essentialQuestions,
    providerLayer: {
      status: providerSeeds.length ? "ready" : "fallback",
      source: labels.demoSource,
      verifiedProviderLookupEnabled: false,
      rankedProviders
    },
    structuredPlan: [
      `Understand the ${engine.labels.en} request`,
      `Resolve service area: ${location}`,
      "Prepare ranked provider shortlist",
      "Explain why each option matches",
      "Prepare approval review"
    ],
    nextStep: engine.nextStep,
    approval: {
      required: true,
      state: "not-approved",
      protection: labels.noExecution
    },
    execution: {
      enabled: false,
      blockedUntilApproval: true
    },
    zeroBlankResult: true,
    fallbackPolicy: labels.fallback
  };
}

export { LOCAL_MISSION_ENGINES, LOCAL_MISSION_ENGINE_IDS, LOCAL_MISSION_PIPELINE };
