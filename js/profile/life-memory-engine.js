export const LIFE_MEMORY_VERSION = "V13";

export const LIFE_DOMAINS = Object.freeze([
  "travel",
  "healthcare",
  "education",
  "sports",
  "career",
  "family",
  "pets",
  "finance",
  "vehicles",
  "government",
  "food",
  "housing",
  "beauty",
  "home_services",
  "professionals",
  "accessibility"
]);

const DOMAIN_ALIASES = Object.freeze({
  tutoring: "education",
  language_exchange: "education",
  sports_wellness: "sports",
  restaurant: "food",
  accommodation: "travel",
  transportation: "travel",
  shopping: "finance",
  repair: "home_services",
  "home-services": "home_services",
  legal: "professionals",
  "professional-service": "professionals",
  government_services: "government",
  foreigner_korea: "government",
  childcare: "family",
  "pet-care": "pets",
  automotive: "vehicles"
});

const DOMAIN_LABELS = Object.freeze({
  en: {
    travel: "Travel",
    healthcare: "Healthcare",
    education: "Education",
    sports: "Sports",
    career: "Career",
    family: "Family",
    pets: "Pets",
    finance: "Finance",
    vehicles: "Vehicles",
    government: "Government",
    food: "Food",
    housing: "Housing",
    beauty: "Beauty",
    home_services: "Home Services",
    professionals: "Professionals",
    accessibility: "Accessibility"
  },
  ko: {
    travel: "여행",
    healthcare: "의료",
    education: "교육",
    sports: "스포츠",
    career: "커리어",
    family: "가족",
    pets: "반려동물",
    finance: "금융",
    vehicles: "차량",
    government: "정부·민원",
    food: "음식",
    housing: "주거",
    beauty: "뷰티",
    home_services: "생활 서비스",
    professionals: "전문가",
    accessibility: "접근성"
  },
  es: {
    travel: "Viajes",
    healthcare: "Salud",
    education: "Educación",
    sports: "Deportes",
    career: "Carrera",
    family: "Familia",
    pets: "Mascotas",
    finance: "Finanzas",
    vehicles: "Vehículos",
    government: "Gobierno",
    food: "Comida",
    housing: "Vivienda",
    beauty: "Belleza",
    home_services: "Servicios del hogar",
    professionals: "Profesionales",
    accessibility: "Accesibilidad"
  }
});

const ALLOWED_FIELDS = Object.freeze({
  travel: ["departureAirport", "airlinePreference", "seatPreference", "hotelStyle", "pace", "budgetStyle", "transportPreference", "avoid"],
  healthcare: ["preferredArea", "languageSupport", "accessibilityNeeds", "appointmentPreference", "avoid"],
  education: ["subject", "level", "learningStyle", "schedule", "format", "budgetStyle", "avoid"],
  sports: ["activities", "intensity", "schedule", "facilityPreference", "budgetStyle", "avoid"],
  career: ["targetRole", "skills", "workLocation", "salaryRange", "language", "visaStatus", "avoid"],
  family: ["householdNeeds", "celebrations", "schoolPreference", "carePreference", "avoid"],
  pets: ["petType", "servicePreference", "area", "schedule", "avoid"],
  finance: ["budgetStyle", "invoicePreference", "riskPreference", "currencyPreference", "avoid"],
  vehicles: ["vehicleType", "inspectionMonth", "serviceArea", "maintenancePreference", "avoid"],
  government: ["jurisdiction", "documentPreference", "renewalMonth", "languageSupport", "avoid"],
  food: ["cuisines", "dietaryPreference", "dislikedFoods", "reservationTime", "budgetStyle", "avoid"],
  housing: ["area", "housingType", "commutePreference", "monthlyBudgetStyle", "petFriendly", "avoid"],
  beauty: ["servicePreference", "stylePreference", "schedule", "budgetStyle", "avoid"],
  home_services: ["serviceArea", "propertyType", "schedule", "budgetStyle", "avoid"],
  professionals: ["specialty", "languageSupport", "consultationPreference", "budgetStyle", "avoid"],
  accessibility: ["interfacePreference", "mobilityPreference", "languagePreference", "communicationPreference", "avoid"]
});

const SENSITIVE_PATTERN = /(raw|chat|message|transcript|passport|visa|national.?id|resident.?number|ssn|password|token|secret|card|bank|payment|account|diagnosis|symptom|medical.?record|prescription|child.?name|full.?address|phone|email|gps|latitude|longitude)/i;
const EXPLICIT_NEGATION = /\b(no|not|avoid|don't|do not|without|except|싫어|피해|하지 마|말고|빼고|원하지|sin|no quiero|evitar|excepto)\b/i;

const nowIso = () => new Date().toISOString();
const clean = (value) => String(value ?? "").normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, 240);
const normalizeLanguage = (language = "en") => ["en", "ko", "es"].includes(language) ? language : "en";
const emptyDomains = () => Object.fromEntries(LIFE_DOMAINS.map((domain) => [domain, {}]));

export function normalizeLifeDomain(domain = "travel") {
  const key = String(domain || "").trim();
  const mapped = DOMAIN_ALIASES[key] || key;
  return LIFE_DOMAINS.includes(mapped) ? mapped : "travel";
}

export function createLifeMemory(input = {}) {
  const memory = {
    version: LIFE_MEMORY_VERSION,
    consent: {
      enabled: input.consent?.enabled === true,
      consentedAt: input.consent?.consentedAt || null
    },
    domains: emptyDomains(),
    updatedAt: input.updatedAt || nowIso()
  };

  for (const domain of LIFE_DOMAINS) {
    const source = input.domains?.[domain] || {};
    for (const [field, record] of Object.entries(source)) {
      if (!isAllowedMemoryField(domain, field)) continue;
      const normalized = normalizeMemoryRecord({ domain, field, record });
      if (normalized) memory.domains[domain][field] = normalized;
    }
  }

  return Object.freeze({
    ...memory,
    consent: Object.freeze(memory.consent),
    domains: Object.freeze(Object.fromEntries(
      Object.entries(memory.domains).map(([domain, values]) => [domain, Object.freeze(values)])
    ))
  });
}

export function isAllowedMemoryField(domain, field) {
  const normalizedDomain = normalizeLifeDomain(domain);
  return ALLOWED_FIELDS[normalizedDomain]?.includes(field) && !SENSITIVE_PATTERN.test(`${normalizedDomain} ${field}`);
}

function normalizeMemoryRecord({ domain, field, record }) {
  if (SENSITIVE_PATTERN.test(`${domain} ${field}`)) return null;
  const source = typeof record === "object" && record !== null ? record : { value: record };
  const value = source.value;
  const localizedValue = typeof value === "object" && value !== null
    ? Object.fromEntries(Object.entries(value).map(([lang, text]) => [normalizeLanguage(lang), clean(text)]).filter(([, text]) => text))
    : { default: clean(value) };
  if (!Object.keys(localizedValue).length) return null;
  const why = clean(source.why || source.reason || "Saved because the user explicitly confirmed this preference.");
  return Object.freeze({
    value: Object.freeze(localizedValue),
    sourceMissionId: clean(source.sourceMissionId || ""),
    confidence: Math.max(0, Math.min(1, Number(source.confidence ?? 1))),
    userConfirmed: source.userConfirmed !== false,
    editable: true,
    whyUsed: why,
    updatedAt: source.updatedAt || nowIso(),
    storage: "structured-life-domain"
  });
}

export function getMemoryValue(record, language = "en") {
  if (!record?.value) return "";
  const lang = normalizeLanguage(language);
  return record.value[lang] || record.value.default || record.value.en || record.value.ko || record.value.es || "";
}

export function readLifeDomain(memoryInput = {}, domain = "travel", { language = "en" } = {}) {
  const memory = createLifeMemory(memoryInput);
  const normalizedDomain = normalizeLifeDomain(domain);
  const entries = Object.entries(memory.domains[normalizedDomain] || {}).map(([field, record]) => Object.freeze({
    domain: normalizedDomain,
    domainLabel: DOMAIN_LABELS[normalizeLanguage(language)]?.[normalizedDomain] || normalizedDomain,
    field,
    value: getMemoryValue(record, language),
    record,
    editable: record.editable === true,
    whyUsed: explainMemoryUse({ domain: normalizedDomain, field, record, language })
  }));
  return Object.freeze({
    enabled: memory.consent.enabled,
    domain: normalizedDomain,
    entries: Object.freeze(entries)
  });
}

export function updateLifeMemory(memoryInput = {}, { domain, field, value, language = "en", sourceMissionId = "", reason = "", consent = false } = {}) {
  const memory = createLifeMemory(memoryInput);
  if (!memory.consent.enabled && consent !== true) return Object.freeze({ memory, updated: false, reason: "consent_required" });
  const normalizedDomain = normalizeLifeDomain(domain);
  if (!isAllowedMemoryField(normalizedDomain, field)) return Object.freeze({ memory, updated: false, reason: "field_not_allowed" });
  const normalized = normalizeMemoryRecord({
    domain: normalizedDomain,
    field,
    record: {
      value: typeof value === "object" && value !== null ? value : { [normalizeLanguage(language)]: value },
      sourceMissionId,
      why: reason || "Saved because the user explicitly confirmed this preference.",
      confidence: 1,
      userConfirmed: true
    }
  });
  if (!normalized) return Object.freeze({ memory, updated: false, reason: "unsafe_or_empty_value" });
  const next = createLifeMemory({
    ...memory,
    consent: memory.consent.enabled ? memory.consent : { enabled: true, consentedAt: nowIso() },
    domains: {
      ...memory.domains,
      [normalizedDomain]: {
        ...memory.domains[normalizedDomain],
        [field]: normalized
      }
    },
    updatedAt: nowIso()
  });
  return Object.freeze({ memory: next, updated: true, reason: "saved" });
}

export function deleteLifeMemoryEntry(memoryInput = {}, domain, field) {
  const memory = createLifeMemory(memoryInput);
  const normalizedDomain = normalizeLifeDomain(domain);
  const values = { ...memory.domains[normalizedDomain] };
  delete values[field];
  return createLifeMemory({
    ...memory,
    domains: { ...memory.domains, [normalizedDomain]: values },
    updatedAt: nowIso()
  });
}

export function clearLifeDomain(memoryInput = {}, domain) {
  const memory = createLifeMemory(memoryInput);
  return createLifeMemory({
    ...memory,
    domains: { ...memory.domains, [normalizeLifeDomain(domain)]: {} },
    updatedAt: nowIso()
  });
}

export function explainMemoryUse({ domain, field, record, language = "en" } = {}) {
  const lang = normalizeLanguage(language);
  const domainLabel = DOMAIN_LABELS[lang]?.[normalizeLifeDomain(domain)] || normalizeLifeDomain(domain);
  const value = getMemoryValue(record, lang);
  const custom = record?.whyUsed || "";
  const usage = lang === "ko"
    ? `${domainLabel} 미션에서 '${field}' 선호(${value})를 사용해 불필요한 질문을 줄입니다.`
    : lang === "es"
      ? `ONE usa la preferencia '${field}' (${value}) en ${domainLabel} para hacer menos preguntas.`
      : `ONE uses the ${domainLabel} preference '${field}' (${value}) to reduce unnecessary questions.`;
  return custom ? `${usage} ${custom}` : usage;
}

export function buildLifeMemoryContext({ memory, missionType = "travel", explicitInstructions = "", language = "en" } = {}) {
  const domainContext = readLifeDomain(memory, missionType, { language });
  const explicit = clean(explicitInstructions);
  const explicitBlocksMemory = EXPLICIT_NEGATION.test(explicit);
  const usableEntries = explicitBlocksMemory ? [] : domainContext.entries;
  return Object.freeze({
    version: LIFE_MEMORY_VERSION,
    enabled: domainContext.enabled,
    domain: domainContext.domain,
    explicitInstructions,
    explicitInstructionsOverrideMemory: explicitBlocksMemory,
    entriesUsed: Object.freeze(usableEntries.map(({ domain, field, value, whyUsed }) => Object.freeze({ domain, field, value, whyUsed }))),
    entriesAvailable: Object.freeze(domainContext.entries.map(({ domain, field, value, whyUsed }) => Object.freeze({ domain, field, value, whyUsed }))),
    reason: explicitBlocksMemory
      ? "Explicit user instruction conflicts with memory, so memory was not applied."
      : "Structured Life Domain memory may be used to reduce questions, but it cannot execute actions or override the user.",
    approvalRequired: true,
    executionEnabled: false
  });
}

export function exportLifeMemorySummary(memoryInput = {}, { language = "en" } = {}) {
  const memory = createLifeMemory(memoryInput);
  return Object.freeze(LIFE_DOMAINS.flatMap((domain) => readLifeDomain(memory, domain, { language }).entries.map((entry) => Object.freeze({
    domain,
    field: entry.field,
    value: entry.value,
    whyUsed: entry.whyUsed,
    editable: true
  }))));
}
