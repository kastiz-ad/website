export const AI_MISSION_MEMORY_VERSION = "AI_MISSION_MEMORY_V1";

export const MEMORY_LAYERS = Object.freeze([
  "permanentProfile",
  "travelPreferences",
  "foodPreferences",
  "accessibilityPreferences",
  "transportationPreferences",
  "budgetPreferences",
  "languagePreferences",
  "temporaryMissionContext",
  "sessionContext"
]);

const LAYER_TO_DOMAIN = Object.freeze({
  permanentProfile: "profile",
  travelPreferences: "travel",
  foodPreferences: "food",
  accessibilityPreferences: "accessibility",
  transportationPreferences: "transportation",
  budgetPreferences: "budget",
  languagePreferences: "language",
  temporaryMissionContext: "mission",
  sessionContext: "session"
});

const DOMAIN_TO_LAYER = Object.freeze(Object.fromEntries(Object.entries(LAYER_TO_DOMAIN).map(([layer, domain]) => [domain, layer])));
const PERMANENT_LAYERS = new Set(["permanentProfile", "travelPreferences", "foodPreferences", "accessibilityPreferences", "transportationPreferences", "budgetPreferences", "languagePreferences"]);
const EPHEMERAL_LAYERS = new Set(["temporaryMissionContext", "sessionContext"]);
const SENSITIVE_PATTERN = /(password|passcode|otp|token|secret|oauth|refresh|cvv|card|credit|debit|bank|passport|government.?id|resident|registration.?number|ssn|national.?id|provider.?password|biometric|medical.?record|health.?record|diagnosis|prescription|raw.?document|scan|credential)/i;

const FIELD_ALIASES = Object.freeze({
  preferredAirport: ["departureAirport", "airport", "preferredDepartureAirport"],
  preferredAirline: ["airline", "airlinePreference", "preferredAirlines"],
  preferredHotelStyle: ["hotelStyle", "hotelType", "preferredHotelTypes"],
  seatPreference: ["seat"],
  travelPace: ["pace", "travelStyle", "tripPace"],
  budgetPreference: ["budget", "budgetStyle"],
  favoriteCuisines: ["cuisine", "cuisines"],
  dislikedFoods: ["dislikedFood", "avoidFood"],
  dietaryPreference: ["dietaryPreferences", "diet"],
  accessibilityNeed: ["accessibilityPreferences", "mobility"],
  transportPreference: ["transport", "transportation"],
  languagePreference: ["language"],
  currencyPreference: ["currency"],
  timeFormat: ["time"]
});

const nowIso = () => new Date().toISOString();
const clean = (value, limit = 300) => String(value ?? "").normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, limit);
const asArray = value => Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value];
const emptyLayers = () => Object.fromEntries(MEMORY_LAYERS.map(layer => [layer, []]));
const normalizeLayer = layer => MEMORY_LAYERS.includes(layer) ? layer : DOMAIN_TO_LAYER[String(layer || "").trim()] || "permanentProfile";
const normalizeField = field => clean(field, 80).replace(/[^\p{L}\p{N}_.-]+/gu, "_").replace(/^_+|_+$/g, "") || "preference";
const safeId = (...parts) => `mem-${parts.map(part => clean(part, 80).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "")).filter(Boolean).join("-")}`.slice(0, 140);
const confidence = value => Math.max(0, Math.min(0.99, Number(value) || 0));

export function isSensitiveMemory({ layer = "", field = "", value = "" } = {}) {
  const text = `${layer} ${field} ${typeof value === "object" ? JSON.stringify(value) : value}`;
  return SENSITIVE_PATTERN.test(text);
}

function normalizeMemoryValue(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(item => clean(item, 120)).filter(Boolean).slice(0, 30));
  if (value && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [
      clean(key, 60),
      Array.isArray(item) ? item.map(x => clean(x, 120)).filter(Boolean) : clean(item, 240)
    ]).filter(([key, item]) => key && (Array.isArray(item) ? item.length : item))));
  }
  return clean(value, 240);
}

function dedupe(records) {
  const map = new Map();
  for (const record of records) {
    const key = `${record.layer}:${record.field}`;
    const existing = map.get(key);
    if (!existing || record.updatedAt > existing.updatedAt || record.confidence > existing.confidence) map.set(key, record);
  }
  return [...map.values()].sort((a, b) => a.layer.localeCompare(b.layer) || a.field.localeCompare(b.field));
}

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function normalizeMemoryRecord(record = {}) {
  const layer = normalizeLayer(record.layer || record.domain);
  const field = normalizeField(record.field || record.key);
  const value = normalizeMemoryValue(record.value);
  if (!field || value === "" || isSensitiveMemory({ layer, field, value })) return null;
  const createdAt = record.createdAt || nowIso();
  const userConfirmed = record.userConfirmed === true;
  const confirmations = Math.max(0, Number(record.confirmations || (userConfirmed ? 1 : 0)));
  const useCount = Math.max(0, Number(record.useCount || 0));
  const baseConfidence = userConfirmed ? 0.82 : EPHEMERAL_LAYERS.has(layer) ? 0.45 : 0.25;
  return Object.freeze({
    id: clean(record.id || safeId(layer, field, Array.isArray(value) ? value.join("-") : typeof value === "object" ? JSON.stringify(value) : value), 160),
    version: AI_MISSION_MEMORY_VERSION,
    layer,
    domain: LAYER_TO_DOMAIN[layer],
    field,
    value,
    source: clean(record.source || "user_confirmed", 80),
    sourceMissionId: clean(record.sourceMissionId || "", 100),
    createdAt,
    updatedAt: record.updatedAt || createdAt,
    lastUsed: record.lastUsed || null,
    confidence: confidence(record.confidence ?? Math.min(0.99, baseConfidence + confirmations * 0.04 + useCount * 0.02)),
    userConfirmed,
    confirmations,
    useCount,
    dismissedAt: record.dismissedAt || null,
    disabledAt: record.disabledAt || null,
    expiresAt: record.expiresAt || (layer === "temporaryMissionContext" ? record.missionEndsAt || null : null),
    whyStored: clean(record.whyStored || (userConfirmed ? "Stored because the user explicitly approved this memory." : "Not permanent until the user confirms it."), 400),
    howUsed: clean(record.howUsed || "Used to personalize future missions without overriding explicit instructions.", 400),
    conflictPolicy: "ask_before_overwrite"
  });
}

export function createAIMissionMemoryState(input = {}) {
  const layers = emptyLayers();
  for (const record of asArray(input.records)) {
    const normalized = normalizeMemoryRecord(record);
    if (normalized) layers[normalized.layer].push(normalized);
  }
  for (const layer of MEMORY_LAYERS) {
    for (const record of asArray(input.layers?.[layer])) {
      const normalized = normalizeMemoryRecord({ ...record, layer });
      if (normalized) layers[normalized.layer].push(normalized);
    }
  }
  return Object.freeze({
    version: AI_MISSION_MEMORY_VERSION,
    paused: input.paused === true,
    consent: Object.freeze({
      permanentMemory: input.consent?.permanentMemory === true,
      missionMemory: input.consent?.missionMemory !== false
    }),
    layers: Object.freeze(Object.fromEntries(Object.entries(layers).map(([layer, rows]) => [layer, Object.freeze(dedupe(rows))]))),
    updatedAt: input.updatedAt || nowIso(),
    safety: Object.freeze({
      storesChatHistory: false,
      storesSensitiveCredentials: false,
      requiresExplicitPermanentConsent: true,
      userControlled: true
    })
  });
}

export function buildConsentPrompt(candidate = {}, language = "en") {
  const value = Array.isArray(candidate.value) ? candidate.value.join(", ") : typeof candidate.value === "object" ? Object.values(candidate.value).join(", ") : clean(candidate.value);
  if (language === "ko") return `${value}을(를) 다음 미션에도 기억할까요?`;
  if (language === "es") return `¿Quieres que recuerde ${value} para futuras misiones?`;
  return `Would you like me to remember ${value} for future missions?`;
}

export function rememberMemory(stateInput = {}, candidate = {}, { approved = false } = {}) {
  const state = createAIMissionMemoryState(stateInput);
  const layer = normalizeLayer(candidate.layer || candidate.domain);
  const permanent = PERMANENT_LAYERS.has(layer);
  if (state.paused) return Object.freeze({ state, saved: false, reason: "memory_paused" });
  if (permanent && (!approved || state.consent.permanentMemory !== true)) {
    return Object.freeze({
      state,
      saved: false,
      reason: "explicit_consent_required",
      consentPrompt: buildConsentPrompt({ ...candidate, layer }, candidate.language)
    });
  }
  const record = normalizeMemoryRecord({ ...candidate, layer, userConfirmed: permanent ? true : candidate.userConfirmed === true });
  if (!record) return Object.freeze({ state, saved: false, reason: "unsafe_or_empty_memory" });
  const existing = state.layers[layer].find(item => item.field === record.field && !item.disabledAt);
  if (existing && !sameValue(existing.value, record.value)) {
    return Object.freeze({
      state,
      saved: false,
      reason: "memory_conflict",
      conflict: Object.freeze({
        layer,
        field: record.field,
        existing,
        candidate: record,
        question: "Is this a one-time choice or a future preference?"
      })
    });
  }
  const nextLayers = { ...state.layers, [layer]: [...state.layers[layer].filter(item => item.field !== record.field), record] };
  return Object.freeze({ state: createAIMissionMemoryState({ ...state, layers: nextLayers }), saved: true, memory: record, reason: "saved" });
}

export function resolveMemoryConflict(stateInput = {}, conflict, decision = "one_time") {
  const state = createAIMissionMemoryState(stateInput);
  if (!conflict?.candidate) return Object.freeze({ state, resolved: false, reason: "missing_conflict" });
  if (decision === "future_preference") {
    const layer = normalizeLayer(conflict.layer || conflict.candidate.layer);
    const field = normalizeField(conflict.field || conflict.candidate.field);
    const layers = { ...state.layers, [layer]: state.layers[layer].filter(record => record.field !== field) };
    return rememberMemory(createAIMissionMemoryState({ ...state, layers }), conflict.candidate, { approved: true });
  }
  if (decision === "one_time") {
    return rememberMemory(state, {
      ...conflict.candidate,
      layer: "temporaryMissionContext",
      expiresAt: conflict.candidate.expiresAt || nowIso(),
      userConfirmed: false
    }, { approved: false });
  }
  return Object.freeze({ state, resolved: false, reason: "unknown_decision" });
}

export function recordMemoryUse(stateInput = {}, memoryIds = [], usedAt = nowIso()) {
  const state = createAIMissionMemoryState(stateInput);
  const ids = new Set(memoryIds);
  const layers = Object.fromEntries(Object.entries(state.layers).map(([layer, rows]) => [
    layer,
    rows.map(record => ids.has(record.id) ? normalizeMemoryRecord({ ...record, useCount: record.useCount + 1, lastUsed: usedAt, confidence: Math.min(0.99, record.confidence + 0.02) }) : record)
  ]));
  return createAIMissionMemoryState({ ...state, layers });
}

export function expireTemporaryMissionContext(stateInput = {}, { missionId = "", completedAt = nowIso() } = {}) {
  const state = createAIMissionMemoryState(stateInput);
  const temporary = state.layers.temporaryMissionContext.filter(record => record.sourceMissionId !== missionId && (!record.expiresAt || record.expiresAt > completedAt));
  return createAIMissionMemoryState({ ...state, layers: { ...state.layers, temporaryMissionContext: temporary } });
}

export function suggestMemoryUse(stateInput = {}, { missionType = "travel", language = "en", dismissed = [] } = {}) {
  const state = createAIMissionMemoryState(stateInput);
  if (state.paused) return Object.freeze([]);
  const dismissedSet = new Set(dismissed);
  const relevant = [
    ...state.layers.permanentProfile,
    ...state.layers.travelPreferences,
    ...state.layers.foodPreferences,
    ...state.layers.accessibilityPreferences,
    ...state.layers.transportationPreferences,
    ...state.layers.budgetPreferences,
    ...state.layers.languagePreferences
  ].filter(record => !record.disabledAt && !dismissedSet.has(record.id) && (missionType === "travel" || record.layer !== "travelPreferences"));
  return Object.freeze(relevant.slice(0, 5).map(record => Object.freeze({
    id: `suggest-${record.id}`,
    memoryId: record.id,
    dismissible: true,
    layer: record.layer,
    field: record.field,
    value: record.value,
    text: language === "ko" ? `저장된 ${record.field} 설정을 사용할까요?` : language === "es" ? `¿Usamos tu preferencia guardada de ${record.field}?` : `Use your saved ${record.field}?`,
    why: record.howUsed
  })));
}

export function buildMissionPersonalization(stateInput = {}, { missionType = "travel", explicitInstructions = "", language = "en" } = {}) {
  const state = createAIMissionMemoryState(stateInput);
  if (state.paused) return Object.freeze({ enabled: false, applied: [], suggestions: [], reason: "memory_paused" });
  const explicit = clean(explicitInstructions).toLowerCase();
  const applied = [];
  const push = record => {
    const aliases = [record.field, ...(FIELD_ALIASES[record.field] || [])].map(item => item.toLowerCase());
    if (aliases.some(alias => explicit.includes(alias))) return;
    applied.push(Object.freeze({
      id: record.id,
      layer: record.layer,
      field: record.field,
      value: record.value,
      confidence: record.confidence,
      why: record.howUsed
    }));
  };
  for (const layer of ["permanentProfile", "travelPreferences", "foodPreferences", "accessibilityPreferences", "transportationPreferences", "budgetPreferences", "languagePreferences"]) {
    for (const record of state.layers[layer]) {
      if (!record.disabledAt && record.userConfirmed && (missionType === "travel" || layer !== "travelPreferences")) push(record);
    }
  }
  return Object.freeze({
    enabled: true,
    missionType,
    applied: Object.freeze(applied.slice(0, 12)),
    suggestions: suggestMemoryUse(state, { missionType, language }),
    safety: Object.freeze({
      explicitInstructionsOverrideMemory: true,
      approvalRequiredForNewPermanentMemory: true
    })
  });
}

export function deleteMemory(stateInput = {}, memoryId) {
  const state = createAIMissionMemoryState(stateInput);
  const layers = Object.fromEntries(Object.entries(state.layers).map(([layer, rows]) => [layer, rows.filter(record => record.id !== memoryId)]));
  return createAIMissionMemoryState({ ...state, layers });
}

export function deleteMemoryCategory(stateInput = {}, layer) {
  const state = createAIMissionMemoryState(stateInput);
  return createAIMissionMemoryState({ ...state, layers: { ...state.layers, [normalizeLayer(layer)]: [] } });
}

export function deleteAllMemory(stateInput = {}) {
  return createAIMissionMemoryState({ ...stateInput, layers: emptyLayers() });
}

export function pauseMemory(stateInput = {}) {
  return createAIMissionMemoryState({ ...createAIMissionMemoryState(stateInput), paused: true });
}

export function resumeMemory(stateInput = {}) {
  return createAIMissionMemoryState({ ...createAIMissionMemoryState(stateInput), paused: false });
}

export function exportMemory(stateInput = {}) {
  const state = createAIMissionMemoryState(stateInput);
  return Object.freeze({
    version: state.version,
    exportedAt: nowIso(),
    paused: state.paused,
    layers: state.layers,
    safety: state.safety
  });
}
