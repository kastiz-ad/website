export const ALPHA07_PERSONAL_MISSION_MEMORY_VERSION = "ALPHA-07";
export const PERSONAL_MISSION_MEMORY_STORAGE_KEY = "kastiz-one-personal-mission-memory-alpha07";

export const PERSONAL_MISSION_MEMORY_CATEGORIES = Object.freeze([
  "travel",
  "food",
  "transportation",
  "hotels",
  "business",
  "healthcare",
  "education",
  "career",
  "shopping",
  "lifestyle"
]);

const CATEGORY_LABELS = Object.freeze({
  en: {
    travel: "Travel",
    food: "Food",
    transportation: "Transportation",
    hotels: "Hotels",
    business: "Business",
    healthcare: "Healthcare",
    education: "Education",
    career: "Career",
    shopping: "Shopping",
    lifestyle: "Lifestyle"
  },
  ko: {
    travel: "여행",
    food: "음식",
    transportation: "이동",
    hotels: "호텔",
    business: "비즈니스",
    healthcare: "의료",
    education: "교육",
    career: "커리어",
    shopping: "쇼핑",
    lifestyle: "라이프스타일"
  },
  es: {
    travel: "Viajes",
    food: "Comida",
    transportation: "Transporte",
    hotels: "Hoteles",
    business: "Negocios",
    healthcare: "Salud",
    education: "Educación",
    career: "Carrera",
    shopping: "Compras",
    lifestyle: "Estilo de vida"
  }
});

const FIELD_MAP = Object.freeze({
  airlinePreference: "travel",
  seatPreference: "travel",
  favoriteDestinations: "travel",
  walkingTolerance: "travel",
  budgetStyle: "travel",
  roomType: "hotels",
  hotelType: "hotels",
  hotelLocation: "hotels",
  foodPreference: "food",
  dislikedFood: "food",
  dietaryPreference: "food",
  transportPreference: "transportation",
  businessBank: "business",
  accountingStyle: "business",
  businessLanguage: "business",
  preferredHospital: "healthcare",
  insurancePreference: "healthcare",
  appointmentPreference: "healthcare",
  learningStyle: "education",
  resumeLanguage: "career",
  interviewLanguage: "career",
  favoriteBrands: "shopping",
  deliveryWindow: "shopping"
});

const SENSITIVE_PATTERN = /(password|passcode|otp|token|secret|cvv|card|credit|debit|bank\s?(number|account|username|password)|passport\s?(number|no)|identity|resident|registration\s?number|ssn|national\s?id|visa\s?number|medical\s?record|diagnosis|prescription|raw\s?image|child\s?name|full\s?address|phone|email|credential|auth)/i;
const CHAT_PATTERN = /(chat|conversation|transcript|message history|raw mission text|private conversation)/i;
const HIGH_CONFIDENCE_SOURCES = new Set(["explicit_user_preference", "user_approval", "mission_confirmation"]);
const LEARNED_SOURCES = new Set(["repeated_behavior", "repeated_confirmation"]);
const LANGUAGES = new Set(["en", "ko", "es"]);

const nowIso = () => new Date().toISOString();
const clean = (value, limit = 240) => String(value ?? "")
  .normalize("NFKC")
  .replace(/[<>]/g, "")
  .trim()
  .slice(0, limit);
const normalizeLanguage = (language = "en") => LANGUAGES.has(language) ? language : "en";
const normalizeCategory = (category = "lifestyle") => {
  const key = clean(category).toLowerCase().replace(/[\s-]+/g, "_");
  return PERSONAL_MISSION_MEMORY_CATEGORIES.includes(key) ? key : FIELD_MAP[key] || "lifestyle";
};
const normalizeField = (field = "preference") => clean(field, 80).replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "") || "preference";
const confidence = (value) => Math.max(0, Math.min(0.99, Number(value) || 0));

function stableId(category, key, value = "") {
  const raw = `${category}:${key}:${clean(value, 80).toLowerCase()}`;
  return `alpha07-${raw.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 92) || "memory"}`;
}

export function isSensitiveMissionMemory({ category = "", key = "", value = "" } = {}) {
  const joined = `${category} ${key} ${typeof value === "object" ? JSON.stringify(value) : value}`;
  return SENSITIVE_PATTERN.test(joined) || CHAT_PATTERN.test(joined);
}

export function createPersonalMissionMemory(input = {}) {
  const records = Array.isArray(input.records) ? input.records : [];
  const normalized = records
    .map((record) => normalizeMemoryRecord(record))
    .filter(Boolean);
  const byId = new Map();
  for (const record of normalized) byId.set(record.id, record);
  return Object.freeze({
    version: ALPHA07_PERSONAL_MISSION_MEMORY_VERSION,
    storage: "device-local-personal-mission-memory",
    records: Object.freeze([...byId.values()]),
    updatedAt: input.updatedAt || nowIso(),
    safety: Object.freeze({
      storesChatHistory: false,
      storesProfileSecrets: false,
      storesSensitiveCredentials: false,
      userControlled: true
    })
  });
}

function normalizeValue(value, language = "en") {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const entries = Object.entries(value)
      .map(([lang, text]) => [normalizeLanguage(lang), clean(text)])
      .filter(([, text]) => text);
    return Object.freeze(Object.fromEntries(entries));
  }
  const text = clean(value);
  return text ? Object.freeze({ [normalizeLanguage(language)]: text, default: text }) : null;
}

function memoryValue(record = {}, language = "en") {
  const lang = normalizeLanguage(language);
  return record.value?.[lang] || record.value?.default || record.value?.en || record.value?.ko || record.value?.es || "";
}

function sourceConfidence(sourceType = "single_mission", confirmations = 0) {
  if (HIGH_CONFIDENCE_SOURCES.has(sourceType)) return 0.9;
  if (LEARNED_SOURCES.has(sourceType) && Number(confirmations) >= 2) return 0.78;
  return 0.45;
}

function normalizeMemoryRecord(record = {}) {
  const category = normalizeCategory(record.category || FIELD_MAP[record.key] || "lifestyle");
  const key = normalizeField(record.key || record.field || "preference");
  const value = normalizeValue(record.value, record.language);
  if (!value || isSensitiveMissionMemory({ category, key, value })) return null;
  const valueText = value.default || value.en || value.ko || value.es || "";
  const createdAt = record.createdAt || nowIso();
  return Object.freeze({
    id: clean(record.id || stableId(category, key, valueText), 120),
    version: ALPHA07_PERSONAL_MISSION_MEMORY_VERSION,
    category,
    key,
    label: clean(record.label || key.replace(/[_-]+/g, " "), 120),
    value,
    confidence: confidence(record.confidence ?? sourceConfidence(record.sourceType || record.source, record.confirmations)),
    source: clean(record.source || record.sourceType || "explicit_user_preference", 80),
    sourceMissionId: clean(record.sourceMissionId || "", 80),
    createdAt,
    updatedAt: record.updatedAt || createdAt,
    lastUsedAt: record.lastUsedAt || null,
    lastConfirmedAt: record.lastConfirmedAt || (record.userConfirmed === false ? null : createdAt),
    confirmations: Math.max(0, Number(record.confirmations || (record.userConfirmed === false ? 0 : 1))),
    overrides: Math.max(0, Number(record.overrides || 0)),
    dismissals: Math.max(0, Number(record.dismissals || 0)),
    importance: clean(record.importance || "normal", 40),
    editable: record.editable !== false,
    enabled: record.enabled !== false,
    permanent: record.permanent === true || confidence(record.confidence ?? sourceConfidence(record.sourceType || record.source, record.confirmations)) >= 0.7,
    requiresConfirmation: record.requiresConfirmation === true || confidence(record.confidence ?? sourceConfidence(record.sourceType || record.source, record.confirmations)) < 0.7,
    whyExists: clean(record.whyExists || record.reason || "Saved because you confirmed this mission preference.", 220),
    howUsed: clean(record.howUsed || "Used only to reduce repeated questions and improve future mission fit.", 220),
    storage: "personal-mission-memory",
    sensitive: false
  });
}

export function createMemoryCandidate(input = {}) {
  const normalized = normalizeMemoryRecord({
    ...input,
    confidence: input.confidence ?? sourceConfidence(input.sourceType || input.source, input.confirmations),
    userConfirmed: input.sourceType === "single_mission" ? false : input.userConfirmed
  });
  if (!normalized) return Object.freeze({ candidate: null, accepted: false, reason: "sensitive_or_empty" });
  return Object.freeze({
    candidate: normalized,
    accepted: normalized.confidence >= 0.7 && normalized.requiresConfirmation === false,
    reason: normalized.requiresConfirmation ? "confirmation_required" : "ready_to_save"
  });
}

function mergeRecord(existing, incoming, { confirmed = false, override = false } = {}) {
  const nextConfidence = override
    ? Math.max(0.72, incoming.confidence)
    : Math.min(0.99, Math.max(existing.confidence, incoming.confidence) + (confirmed ? 0.08 : 0.03));
  const confirmations = existing.confirmations + (confirmed ? 1 : 0) + Math.max(0, incoming.confirmations - 1);
  return Object.freeze({
    ...existing,
    label: incoming.label || existing.label,
    value: incoming.value,
    confidence: confidence(nextConfidence),
    source: incoming.source || existing.source,
    sourceMissionId: incoming.sourceMissionId || existing.sourceMissionId,
    updatedAt: nowIso(),
    lastConfirmedAt: confirmed ? nowIso() : existing.lastConfirmedAt,
    confirmations,
    overrides: existing.overrides + (override ? 1 : 0),
    whyExists: incoming.whyExists || existing.whyExists,
    howUsed: incoming.howUsed || existing.howUsed,
    permanent: nextConfidence >= 0.7,
    requiresConfirmation: nextConfidence < 0.7
  });
}

export function rememberMissionPreference(memoryInput = {}, preference = {}, options = {}) {
  const memory = createPersonalMissionMemory(memoryInput);
  const candidateResult = preference.candidate ? { candidate: preference.candidate } : createMemoryCandidate(preference);
  const candidate = normalizeMemoryRecord(candidateResult.candidate || preference);
  if (!candidate) return Object.freeze({ memory, saved: false, reason: "sensitive_or_empty", candidate: null });
  if (candidate.requiresConfirmation && options.confirm !== true) {
    return Object.freeze({ memory, saved: false, reason: "confirmation_required", candidate });
  }
  const existing = memory.records.find((record) => record.category === candidate.category && record.key === candidate.key);
  const records = existing
    ? memory.records.map((record) => record.id === existing.id ? mergeRecord(record, candidate, { confirmed: true, override: options.override === true }) : record)
    : [...memory.records, Object.freeze({ ...candidate, requiresConfirmation: false, permanent: true, confidence: Math.max(candidate.confidence, 0.72), lastConfirmedAt: nowIso(), confirmations: Math.max(1, candidate.confirmations) })];
  return Object.freeze({
    memory: createPersonalMissionMemory({ records, updatedAt: nowIso() }),
    saved: true,
    reason: existing ? "merged" : "saved",
    candidate
  });
}

export function editMissionMemory(memoryInput = {}, id, patch = {}) {
  const memory = createPersonalMissionMemory(memoryInput);
  const records = memory.records.map((record) => {
    if (record.id !== id || record.editable === false) return record;
    const incoming = normalizeMemoryRecord({ ...record, ...patch, id: record.id, source: "user_edit", confidence: 0.96 });
    return incoming ? mergeRecord(record, incoming, { confirmed: true, override: true }) : record;
  });
  return createPersonalMissionMemory({ records, updatedAt: nowIso() });
}

export function disableMissionMemory(memoryInput = {}, id) {
  const memory = createPersonalMissionMemory(memoryInput);
  return createPersonalMissionMemory({
    records: memory.records.map((record) => record.id === id ? Object.freeze({ ...record, enabled: false, updatedAt: nowIso() }) : record),
    updatedAt: nowIso()
  });
}

export function deleteMissionMemory(memoryInput = {}, id) {
  const memory = createPersonalMissionMemory(memoryInput);
  return createPersonalMissionMemory({ records: memory.records.filter((record) => record.id !== id), updatedAt: nowIso() });
}

export function clearPersonalMissionMemory() {
  return createPersonalMissionMemory({ records: [], updatedAt: nowIso() });
}

export function recordMemoryUse(memoryInput = {}, id, { accepted = true } = {}) {
  const memory = createPersonalMissionMemory(memoryInput);
  return createPersonalMissionMemory({
    records: memory.records.map((record) => {
      if (record.id !== id) return record;
      const delta = accepted ? 0.02 : -0.08;
      return Object.freeze({
        ...record,
        confidence: confidence(record.confidence + delta),
        lastUsedAt: nowIso(),
        dismissals: record.dismissals + (accepted ? 0 : 1),
        updatedAt: nowIso()
      });
    }),
    updatedAt: nowIso()
  });
}

export function explainMissionMemoryUse(record = {}, { language = "en" } = {}) {
  const lang = normalizeLanguage(language);
  const label = CATEGORY_LABELS[lang]?.[record.category] || record.category;
  const value = memoryValue(record, lang);
  if (lang === "ko") return `${label} 기억: ${value}. ${record.howUsed || "앞으로 같은 질문을 줄이기 위해 사용됩니다."}`;
  if (lang === "es") return `Memoria de ${label}: ${value}. ${record.howUsed || "Se usa para reducir preguntas repetidas."}`;
  return `${label} memory: ${value}. ${record.howUsed || "Used to reduce repeated questions."}`;
}

export function applyPersonalMissionMemory(memoryInput = {}, { domain = "travel", explicitInstructions = "", language = "en" } = {}) {
  const memory = createPersonalMissionMemory(memoryInput);
  const normalizedDomain = normalizeCategory(domain);
  const explicit = clean(explicitInstructions, 400).toLowerCase();
  const override = /\b(no|not|avoid|don't|do not|without|except|싫어|피해|하지 마|말고|빼고|원하지|sin|no quiero|evitar|excepto)\b/i.test(explicit);
  const allowedCategories = new Set([normalizedDomain]);
  if (normalizedDomain === "travel") ["travel", "food", "transportation", "hotels"].forEach((category) => allowedCategories.add(category));
  const used = override ? [] : memory.records
    .filter((record) => record.enabled && record.confidence >= 0.7 && allowedCategories.has(record.category))
    .map((record) => Object.freeze({
      id: record.id,
      category: record.category,
      key: record.key,
      value: memoryValue(record, language),
      confidence: record.confidence,
      explanation: explainMissionMemoryUse(record, { language }),
      source: record.source
    }));
  return Object.freeze({
    version: ALPHA07_PERSONAL_MISSION_MEMORY_VERSION,
    applied: Object.freeze(used),
    availableCount: memory.records.length,
    explicitInstructionsOverrideMemory: override,
    reason: override
      ? "Explicit user instruction conflicts with memory, so memory was not applied."
      : "High-confidence personal mission memory may reduce repeated questions.",
    executionEnabled: false,
    approvalRequired: true
  });
}

export function exportPersonalMissionMemory(memoryInput = {}, { language = "en" } = {}) {
  const memory = createPersonalMissionMemory(memoryInput);
  return Object.freeze({
    version: memory.version,
    exportedAt: nowIso(),
    records: Object.freeze(memory.records.map((record) => Object.freeze({
      id: record.id,
      category: record.category,
      categoryLabel: CATEGORY_LABELS[normalizeLanguage(language)]?.[record.category] || record.category,
      key: record.key,
      value: memoryValue(record, language),
      confidence: record.confidence,
      source: record.source,
      createdAt: record.createdAt,
      lastUsedAt: record.lastUsedAt,
      lastConfirmedAt: record.lastConfirmedAt,
      enabled: record.enabled,
      whyExists: record.whyExists,
      howUsed: record.howUsed
    })))
  });
}

export function readPersonalMissionMemoryFromBrowser() {
  if (typeof localStorage === "undefined") return createPersonalMissionMemory();
  try {
    return createPersonalMissionMemory(JSON.parse(localStorage.getItem(PERSONAL_MISSION_MEMORY_STORAGE_KEY) || "{}"));
  } catch {
    return createPersonalMissionMemory();
  }
}

export function writePersonalMissionMemoryToBrowser(memoryInput = {}) {
  const memory = createPersonalMissionMemory(memoryInput);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(PERSONAL_MISSION_MEMORY_STORAGE_KEY, JSON.stringify(memory));
  }
  return memory;
}

export function seedFounderPreviewMemory() {
  let memory = createPersonalMissionMemory();
  for (const preference of [
    { category: "travel", key: "airlinePreference", value: { en: "Asiana or Korean Air", ko: "아시아나 또는 대한항공", es: "Asiana o Korean Air" }, source: "mission_confirmation", reason: "Confirmed from returning traveler preview." },
    { category: "hotels", key: "hotelLocation", value: { en: "Near train stations", ko: "기차역 근처", es: "Cerca de estaciones de tren" }, source: "explicit_user_preference" },
    { category: "food", key: "dislikedFood", value: { en: "Avoid seafood", ko: "해산물 피하기", es: "Evitar mariscos" }, source: "explicit_user_preference" },
    { category: "business", key: "accountingStyle", value: { en: "Clear monthly checklist", ko: "월별 체크리스트", es: "Lista mensual clara" }, source: "mission_confirmation" },
    { category: "education", key: "learningStyle", value: { en: "Calm teacher, not too much homework", ko: "숙제가 너무 많지 않은 차분한 선생님", es: "Profesor tranquilo, no demasiada tarea" }, source: "mission_confirmation" },
    { category: "career", key: "resumeLanguage", value: { en: "English first, Korean support", ko: "영어 우선, 한국어 보조", es: "Inglés primero, apoyo coreano" }, source: "mission_confirmation" }
  ]) {
    memory = rememberMissionPreference(memory, preference, { confirm: true }).memory;
  }
  return memory;
}
