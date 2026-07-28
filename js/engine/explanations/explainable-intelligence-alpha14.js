export const ALPHA14_EXPLAINABLE_INTELLIGENCE_VERSION = "ALPHA-14";

export const EXPLANATION_TYPES = Object.freeze({
  MISSION_RECOMMENDATION: "mission_recommendation",
  PREDICTION: "prediction",
  PROVIDER_RECOMMENDATION: "provider_recommendation",
  MISSION_UPDATE: "mission_update",
  TRUST_BADGE: "trust_badge",
  MISSION_CHANGE: "mission_change",
  APPROVAL_REQUEST: "approval_request",
  EXECUTION_SUGGESTION: "execution_suggestion",
  WARNING: "warning",
  COMPLETION: "completion"
});

export const EXPLANATION_DETAIL_LEVELS = Object.freeze({
  MINIMAL: "minimal",
  STANDARD: "standard",
  DETAILED: "detailed"
});

const local = (language = "en", copy = {}) => copy[language] || copy.en || "";
const asArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
const normalize = (value = "") => String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
const safeId = (value = "") => normalize(value).replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "") || "explanation";

const forbiddenReasoningTerms = [
  "chain-of-thought",
  "hidden reasoning",
  "internal prompt",
  "system prompt",
  "agent discussion",
  "model internals",
  "confidence calculation",
  "because i said so"
];

const questionForType = (type, language = "en") => ({
  [EXPLANATION_TYPES.MISSION_RECOMMENDATION]: {
    en: "Why this recommendation?",
    ko: "왜 이 추천인가요?",
    es: "¿Por qué esta recomendación?"
  },
  [EXPLANATION_TYPES.PREDICTION]: {
    en: "Why am I seeing this?",
    ko: "왜 보여주나요?",
    es: "¿Por qué aparece?"
  },
  [EXPLANATION_TYPES.PROVIDER_RECOMMENDATION]: {
    en: "Why this provider?",
    ko: "왜 이 제공업체인가요?",
    es: "¿Por qué este proveedor?"
  },
  [EXPLANATION_TYPES.MISSION_UPDATE]: {
    en: "Why did this change?",
    ko: "왜 바뀌었나요?",
    es: "¿Por qué cambió?"
  },
  [EXPLANATION_TYPES.TRUST_BADGE]: {
    en: "What does this trust signal mean?",
    ko: "이 신뢰 표시가 무엇을 의미하나요?",
    es: "¿Qué significa esta señal de confianza?"
  },
  [EXPLANATION_TYPES.MISSION_CHANGE]: {
    en: "Why was the mission updated?",
    ko: "왜 미션이 업데이트되었나요?",
    es: "¿Por qué se actualizó la misión?"
  },
  [EXPLANATION_TYPES.APPROVAL_REQUEST]: {
    en: "Why should I approve this?",
    ko: "왜 승인해야 하나요?",
    es: "¿Por qué debería aprobar esto?"
  },
  [EXPLANATION_TYPES.EXECUTION_SUGGESTION]: {
    en: "Why is this the next step?",
    ko: "왜 이것이 다음 단계인가요?",
    es: "¿Por qué este es el siguiente paso?"
  },
  [EXPLANATION_TYPES.WARNING]: {
    en: "Why is this warning shown?",
    ko: "왜 이 주의사항이 보이나요?",
    es: "¿Por qué se muestra esta advertencia?"
  },
  [EXPLANATION_TYPES.COMPLETION]: {
    en: "Why is this considered complete?",
    ko: "왜 완료로 보나요?",
    es: "¿Por qué se considera completo?"
  }
}[type]?.[language] || "Why?");

const trimSentences = (text = "", detailLevel = EXPLANATION_DETAIL_LEVELS.STANDARD) => {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (detailLevel === EXPLANATION_DETAIL_LEVELS.DETAILED) return clean.split(/(?<=[.!?。])\s+/).slice(0, 3).join(" ");
  if (detailLevel === EXPLANATION_DETAIL_LEVELS.MINIMAL) return clean.split(/(?<=[.!?。])\s+/).slice(0, 1).join(" ");
  return clean.split(/(?<=[.!?。])\s+/).slice(0, 2).join(" ");
};

const safeAnswer = (answer = "", language = "en", detailLevel = EXPLANATION_DETAIL_LEVELS.STANDARD) => {
  const fallback = local(language, {
    en: "ONE can explain this using visible mission signals, without exposing internal reasoning.",
    ko: "ONE은 내부 추론을 노출하지 않고 보이는 미션 근거로만 설명합니다.",
    es: "ONE lo explica con señales visibles de la misión, sin exponer razonamiento interno."
  });
  const candidate = trimSentences(answer || fallback, detailLevel);
  const normalized = normalize(candidate);
  if (forbiddenReasoningTerms.some((term) => normalized.includes(term))) return fallback;
  return candidate;
};

const makeExplanation = ({ id, type, answer, source, language, detailLevel, evidence = [] }) => ({
  explanationId: id || `${type}-${safeId(source || answer)}`,
  type,
  question: questionForType(type, language),
  answer: safeAnswer(answer, language, detailLevel),
  source: source || "existing_mission_output",
  evidence: asArray(evidence).slice(0, 3),
  detailLevel,
  exposesInternalReasoning: false,
  localized: ["en", "ko", "es"].includes(language)
});

const missionTitle = (result = {}, language = "en") => (
  result.display?.title
  || result.title?.[language]
  || result.title?.en
  || result.originalMission
  || result.rawInput
  || result.mission
  || local(language, { en: "this mission", ko: "이 미션", es: "esta misión" })
);

const buildMissionRecommendationExplanation = ({ result = {}, language, detailLevel }) => {
  const title = missionTitle(result, language);
  const answer = local(language, {
    en: `ONE organized ${title} around the strongest visible mission signals and keeps every real-world action approval-first.`,
    ko: `ONE은 ${title}에 대해 보이는 미션 신호를 기준으로 정리했고, 실제 행동은 항상 승인 후에만 진행합니다.`,
    es: `ONE organizó ${title} con las señales visibles de la misión y mantiene toda acción real bajo aprobación.`
  });
  return makeExplanation({
    type: EXPLANATION_TYPES.MISSION_RECOMMENDATION,
    answer,
    source: "mission_engine",
    language,
    detailLevel,
    evidence: [result.missionContext?.missionType, result.destination?.city || result.destination?.country].filter(Boolean)
  });
};

const buildPredictionExplanations = ({ predictions = {}, language, detailLevel }) => {
  const visible = asArray(predictions.visible || predictions.predictions).slice(0, 3);
  return visible.map((prediction) => makeExplanation({
    id: `prediction-${safeId(prediction.id || prediction.title)}`,
    type: EXPLANATION_TYPES.PREDICTION,
    answer: prediction.reason || prediction.why || prediction.explanation || local(language, {
      en: "This appears because it may affect a future mission.",
      ko: "향후 미션에 영향을 줄 수 있어 표시됩니다.",
      es: "Aparece porque puede afectar una misión futura."
    }),
    source: "predictive_intelligence",
    language,
    detailLevel,
    evidence: prediction.sourceSignals || prediction.source
  }));
};

const buildProviderExplanations = ({ providerTrust = {}, language, detailLevel }) => {
  return asArray(providerTrust.topProviders).slice(0, 3).map((provider) => makeExplanation({
    id: `provider-${safeId(provider.providerName)}`,
    type: EXPLANATION_TYPES.PROVIDER_RECOMMENDATION,
    answer: provider.explanation || asArray(provider.reasons).join(" ") || local(language, {
      en: "This provider is shown because it has visible trust or fit signals for this mission.",
      ko: "이 제공업체는 이 미션에 맞는 공개 신뢰 또는 적합 신호가 있어 표시됩니다.",
      es: "Este proveedor aparece por señales visibles de confianza o ajuste a la misión."
    }),
    source: "provider_trust_network",
    language,
    detailLevel,
    evidence: [provider.badgeLabel || provider.badge, provider.category].filter(Boolean)
  }));
};

const buildMissionUpdateExplanations = ({ monitoring = {}, language, detailLevel }) => {
  const notifications = asArray(monitoring.notifications).slice(0, 3);
  const updates = asArray(monitoring.digest?.updates).slice(0, 2);
  return [...notifications, ...updates].map((update) => makeExplanation({
    id: `update-${safeId(update.eventId || update.title || update.nextRecommendedAction)}`,
    type: EXPLANATION_TYPES.MISSION_UPDATE,
    answer: update.whatChanged || update.why || update.evidence || update.nextRecommendedAction || local(language, {
      en: "This update is shown because mission conditions changed enough to matter.",
      ko: "미션 조건에 의미 있는 변화가 있어 표시됩니다.",
      es: "Esta actualización aparece porque cambió algo importante para la misión."
    }),
    source: "mission_monitoring",
    language,
    detailLevel,
    evidence: [update.watcher, update.priority].filter(Boolean)
  }));
};

const buildApprovalExplanation = ({ result = {}, language, detailLevel }) => makeExplanation({
  type: EXPLANATION_TYPES.APPROVAL_REQUEST,
  answer: local(language, {
    en: "Approval is required because this step can change the mission from preparation into an authorized real-world action.",
    ko: "이 단계는 준비 상태를 사용자가 허용한 실제 행동으로 바꿀 수 있으므로 승인이 필요합니다.",
    es: "Se requiere aprobación porque este paso puede convertir preparación en una acción real autorizada."
  }),
  source: result.trustedActionGateway ? "trusted_action_gateway" : "approval_engine",
  language,
  detailLevel,
  evidence: ["approval-first", "no execution before approval"]
});

const buildWarningExplanations = ({ worldIntelligence = {}, providerTrust = {}, language, detailLevel }) => {
  const warnings = [
    ...asArray(worldIntelligence.warnings),
    ...asArray(providerTrust.warnings)
  ].slice(0, 3);
  return warnings.map((warning) => makeExplanation({
    id: `warning-${safeId(warning)}`,
    type: EXPLANATION_TYPES.WARNING,
    answer: String(warning),
    source: "visible_safety_warning",
    language,
    detailLevel
  }));
};

const buildCompletionExplanation = ({ progress = {}, language, detailLevel }) => {
  if (!progress.currentState && !progress.finalOutcome) return [];
  return [makeExplanation({
    type: EXPLANATION_TYPES.COMPLETION,
    answer: progress.completionConfidence
      ? local(language, {
        en: "Completion status is based on visible mission evidence and still needs verification when provider proof is unavailable.",
        ko: "완료 상태는 보이는 미션 근거를 기준으로 하며, 제공업체 증거가 없으면 확인이 필요합니다.",
        es: "El estado de finalización usa evidencia visible y requiere verificación si falta prueba del proveedor."
      })
      : local(language, {
        en: "ONE will not mark this mission fully complete without evidence or user confirmation.",
        ko: "ONE은 증거 또는 사용자 확인 없이는 이 미션을 완전히 완료로 표시하지 않습니다.",
        es: "ONE no marcará esta misión como completa sin evidencia o confirmación del usuario."
      }),
    source: "mission_completion_loop",
    language,
    detailLevel,
    evidence: [progress.currentState, progress.completionConfidence].filter(Boolean)
  })];
};

export const createExplanationLayer = ({
  result = {},
  detailLevel = EXPLANATION_DETAIL_LEVELS.STANDARD,
  language = "en",
  history = []
} = {}) => {
  const level = Object.values(EXPLANATION_DETAIL_LEVELS).includes(detailLevel) ? detailLevel : EXPLANATION_DETAIL_LEVELS.STANDARD;
  const explanations = [
    buildMissionRecommendationExplanation({ result, language, detailLevel: level }),
    ...buildPredictionExplanations({ predictions: result.alpha06PredictiveIntelligence, language, detailLevel: level }),
    ...buildProviderExplanations({ providerTrust: result.alpha09ProviderTrust, language, detailLevel: level }),
    ...buildMissionUpdateExplanations({ monitoring: result.alpha11MissionMonitoring, language, detailLevel: level }),
    ...buildWarningExplanations({ worldIntelligence: result.worldIntelligence, providerTrust: result.alpha09ProviderTrust, language, detailLevel: level }),
    buildApprovalExplanation({ result, language, detailLevel: level }),
    ...buildCompletionExplanation({ progress: result.missionProgress, language, detailLevel: level })
  ].filter(Boolean);

  const unique = [];
  const seen = new Set();
  for (const explanation of explanations) {
    const key = `${explanation.type}:${safeId(explanation.question)}:${safeId(explanation.answer)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(explanation);
  }

  return {
    version: ALPHA14_EXPLAINABLE_INTELLIGENCE_VERSION,
    mode: "outcome_explanations_not_internal_reasoning",
    detailLevel: level,
    userControls: {
      minimal: true,
      standard: true,
      detailed: true
    },
    tone: {
      plainLanguage: true,
      maxSentencesDefault: 2,
      noTechnicalInternals: true,
      localized: true
    },
    explanations: unique,
    missionHistory: asArray(history).slice(-8).map((entry) => ({
      at: entry.at || new Date().toISOString(),
      explanation: safeAnswer(entry.explanation || entry.reason, language, level),
      type: entry.type || EXPLANATION_TYPES.MISSION_CHANGE
    })),
    privacy: "explains_visible_outcomes_without_chain_of_thought",
    exposesInternalReasoning: false
  };
};

export const setExplanationDetailLevel = (state = {}, detailLevel = EXPLANATION_DETAIL_LEVELS.STANDARD) => ({
  ...state,
  detailLevel: Object.values(EXPLANATION_DETAIL_LEVELS).includes(detailLevel) ? detailLevel : EXPLANATION_DETAIL_LEVELS.STANDARD
});

export const recordMissionExplanationChange = (history = [], { explanation, type = EXPLANATION_TYPES.MISSION_CHANGE, at = new Date().toISOString() } = {}) => [
  ...asArray(history),
  { at, type, explanation: safeAnswer(explanation, "en", EXPLANATION_DETAIL_LEVELS.STANDARD) }
].slice(-20);

export const validateExplanationLayer = (layer = {}) => {
  const failures = [];
  if (layer.version !== ALPHA14_EXPLAINABLE_INTELLIGENCE_VERSION) failures.push("wrong_version");
  if (layer.mode !== "outcome_explanations_not_internal_reasoning") failures.push("wrong_mode");
  if (layer.exposesInternalReasoning) failures.push("internal_reasoning_exposed");
  if (!layer.userControls?.minimal || !layer.userControls?.standard || !layer.userControls?.detailed) failures.push("detail_controls_missing");
  if (!Array.isArray(layer.explanations) || !layer.explanations.length) failures.push("explanations_missing");
  for (const explanation of asArray(layer.explanations)) {
    if (!explanation.question || !explanation.answer) failures.push("malformed_explanation");
    if (forbiddenReasoningTerms.some((term) => normalize(`${explanation.question} ${explanation.answer}`).includes(term))) failures.push("forbidden_internal_reasoning_language");
    if (explanation.answer.split(/(?<=[.!?。])\s+/).filter(Boolean).length > 3) failures.push("too_verbose");
  }
  return { ok: failures.length === 0, failures: [...new Set(failures)] };
};

