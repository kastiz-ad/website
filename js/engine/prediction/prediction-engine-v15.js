import { buildContextObject } from "../context/context-intelligence-engine-v14.js";
import { exportLifeMemorySummary } from "../../profile/life-memory-engine.js";

export const PREDICTION_ENGINE_VERSION = "V15";

const clean = (value) => String(value ?? "").normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, 240);
const list = (value) => Array.isArray(value) ? value : value ? [value] : [];
const monthDistance = (isoDate, now = new Date()) => {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return null;
  return (date.getUTCFullYear() - now.getUTCFullYear()) * 12 + (date.getUTCMonth() - now.getUTCMonth());
};

const COPY = Object.freeze({
  en: {
    passport: "Prepare passport renewal",
    birthday: "Prepare birthday mission",
    health: "Prepare health screening",
    vehicle: "Prepare vehicle inspection",
    business: "Prepare business renewal",
    travel: "Prepare travel checklist",
    school: "Prepare school registration",
    government: "Prepare government deadline",
    whyPrefix: "Why it appeared:"
  },
  ko: {
    passport: "여권 갱신 준비",
    birthday: "생일 미션 준비",
    health: "건강검진 준비",
    vehicle: "차량 검사 준비",
    business: "사업 갱신 준비",
    travel: "여행 준비 체크리스트",
    school: "학교 등록 준비",
    government: "정부·민원 마감 준비",
    whyPrefix: "나타난 이유:"
  },
  es: {
    passport: "Preparar renovación de pasaporte",
    birthday: "Preparar misión de cumpleaños",
    health: "Preparar chequeo de salud",
    vehicle: "Preparar inspección del vehículo",
    business: "Preparar renovación del negocio",
    travel: "Preparar lista de viaje",
    school: "Preparar inscripción escolar",
    government: "Preparar plazo gubernamental",
    whyPrefix: "Por qué apareció:"
  }
});

const languageOf = (context = {}, input = {}) => ["en", "ko", "es"].includes(input.language)
  ? input.language
  : ["en", "ko", "es"].includes(context.currentMission?.language)
    ? context.currentMission.language
    : "en";

const suggestion = ({ type, title, why, confidence = 0.7, sourceSignals = [], dueDate = null, language = "en" }) => Object.freeze({
  id: `v15-${type}-${clean(dueDate || title).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 40) || "suggestion"}`,
  version: PREDICTION_ENGINE_VERSION,
  type,
  title,
  why: `${COPY[language]?.whyPrefix || COPY.en.whyPrefix} ${why}`,
  confidence: Math.max(0.05, Math.min(0.98, confidence)),
  dueDate,
  sourceSignals: Object.freeze(sourceSignals.map(clean).filter(Boolean)),
  nextMissionDraft: Object.freeze({
    missionType: type,
    prompt: title,
    preparedOnly: true
  }),
  approvalRequired: true,
  executionEnabled: false,
  externalCallsEnabled: false,
  status: "suggestion_prepared"
});

function memoryValue(memoryRows, domain, field) {
  return memoryRows.find((row) => row.domain === domain && row.field === field)?.value || "";
}

function predictFromMemory({ context, input, language, now }) {
  const memoryRows = exportLifeMemorySummary(input.lifeMemory || {}, { language });
  const out = [];
  const passportMonth = memoryValue(memoryRows, "government", "renewalMonth");
  if (passportMonth) out.push(suggestion({
    type: "passport-renewal",
    title: COPY[language].passport,
    why: `Saved government memory includes renewal timing (${passportMonth}).`,
    confidence: 0.82,
    sourceSignals: ["memory:government.renewalMonth"],
    language
  }));
  const healthArea = memoryValue(memoryRows, "healthcare", "preferredArea");
  if (healthArea) out.push(suggestion({
    type: "health-screening",
    title: COPY[language].health,
    why: `Healthcare memory has a preferred area (${healthArea}), so ONE can prepare a non-diagnostic screening checklist.`,
    confidence: 0.72,
    sourceSignals: ["memory:healthcare.preferredArea"],
    language
  }));
  const schoolLevel = memoryValue(memoryRows, "education", "level");
  if (schoolLevel) out.push(suggestion({
    type: "school-registration",
    title: COPY[language].school,
    why: `Education memory includes level (${schoolLevel}), which may affect registration windows and academy preparation.`,
    confidence: 0.68,
    sourceSignals: ["memory:education.level"],
    language
  }));
  const destination = context.location?.destination?.city;
  const travelPreference = memoryValue(memoryRows, "travel", "departureAirport") || memoryValue(memoryRows, "travel", "hotelStyle");
  if (destination && travelPreference) out.push(suggestion({
    type: "travel-preparation",
    title: COPY[language].travel,
    why: `Current mission has destination context (${destination}) and travel memory is available (${travelPreference}).`,
    confidence: 0.78,
    sourceSignals: ["context:destination", "memory:travel"],
    language
  }));
  return out;
}

function predictFromCalendar({ context, language }) {
  const out = [];
  for (const event of context.calendar?.events || []) {
    if (/birthday|생일|cumple/i.test(event.title)) {
      out.push(suggestion({
        type: "birthday",
        title: COPY[language].birthday,
        why: `Calendar contains "${event.title}", so ONE can prepare a celebration mission before the date.`,
        confidence: 0.86,
        sourceSignals: ["calendar:birthday"],
        dueDate: event.date || null,
        language
      }));
    }
    if (/school|registration|입학|등록|inscrip/i.test(event.title)) {
      out.push(suggestion({
        type: "school-registration",
        title: COPY[language].school,
        why: `Calendar contains "${event.title}", which looks like a school registration or education deadline.`,
        confidence: 0.8,
        sourceSignals: ["calendar:school"],
        dueDate: event.date || null,
        language
      }));
    }
  }
  return out;
}

function predictFromState({ context, language, now }) {
  const out = [];
  if (context.vehicle?.inspectionDue) {
    out.push(suggestion({
      type: "vehicle-inspection",
      title: COPY[language].vehicle,
      why: `Vehicle context includes inspection due timing (${context.vehicle.inspectionDue}).`,
      confidence: 0.84,
      sourceSignals: ["context:vehicle.inspectionDue"],
      dueDate: context.vehicle.inspectionDue,
      language
    }));
  }
  if (context.business?.renewalDue) {
    out.push(suggestion({
      type: "business-renewal",
      title: COPY[language].business,
      why: `Business context includes renewal due timing (${context.business.renewalDue}).`,
      confidence: 0.84,
      sourceSignals: ["context:business.renewalDue"],
      dueDate: context.business.renewalDue,
      language
    }));
  }
  if (context.business?.taxDeadline) {
    out.push(suggestion({
      type: "government-deadline",
      title: COPY[language].government,
      why: `Business context includes a tax deadline (${context.business.taxDeadline}).`,
      confidence: 0.76,
      sourceSignals: ["context:business.taxDeadline"],
      dueDate: context.business.taxDeadline,
      language
    }));
  }
  if (context.home?.maintenanceDue) {
    out.push(suggestion({
      type: "home-maintenance",
      title: language === "ko" ? "집 관리 미션 준비" : language === "es" ? "Preparar mantenimiento del hogar" : "Prepare home maintenance",
      why: `Home context includes maintenance due (${context.home.maintenanceDue}).`,
      confidence: 0.72,
      sourceSignals: ["context:home.maintenanceDue"],
      dueDate: context.home.maintenanceDue,
      language
    }));
  }
  return out;
}

function predictFromMissions({ context, language }) {
  const out = [];
  const categories = context.previousMissions?.categories || [];
  if (categories.includes("travel") && context.travelState?.requiresInternationalTravel) {
    out.push(suggestion({
      type: "travel-preparation",
      title: COPY[language].travel,
      why: "Previous missions include travel and the current context indicates international travel.",
      confidence: 0.74,
      sourceSignals: ["previousMissions:travel", "context:international"],
      language
    }));
  }
  if (categories.includes("government") && (context.business?.renewalDue || context.vehicle?.inspectionDue)) {
    out.push(suggestion({
      type: "government-deadline",
      title: COPY[language].government,
      why: "Previous government missions plus a current deadline suggest preparing documents early.",
      confidence: 0.72,
      sourceSignals: ["previousMissions:government", "context:deadline"],
      language
    }));
  }
  return out;
}

function dedupeAndRank(suggestions) {
  const byType = new Map();
  for (const item of suggestions) {
    const current = byType.get(item.type);
    if (!current || current.confidence < item.confidence) byType.set(item.type, item);
  }
  return Object.freeze([...byType.values()].sort((a, b) => b.confidence - a.confidence).slice(0, 12));
}

export function generateFutureMissionSuggestions(input = {}) {
  const context = input.contextObject || buildContextObject(input);
  const language = languageOf(context, input);
  const now = input.now ? new Date(input.now) : new Date(context.time?.iso || Date.now());
  const suggestions = dedupeAndRank([
    ...predictFromMemory({ context, input, language, now }),
    ...predictFromCalendar({ context, input, language, now }),
    ...predictFromState({ context, input, language, now }),
    ...predictFromMissions({ context, input, language, now })
  ]);
  return Object.freeze({
    version: PREDICTION_ENGINE_VERSION,
    generatedAt: Number.isFinite(now.getTime()) ? now.toISOString() : new Date().toISOString(),
    contextVersion: context.version,
    suggestions,
    analyzed: Object.freeze({
      memory: true,
      context: true,
      calendar: true,
      missions: true
    }),
    approvalRequired: true,
    executionEnabled: false,
    externalCallsEnabled: false
  });
}

export function shouldShowPrediction(suggestionRecord, { minimumConfidence = 0.6 } = {}) {
  return Boolean(
    suggestionRecord &&
    suggestionRecord.executionEnabled === false &&
    suggestionRecord.confidence >= minimumConfidence &&
    suggestionRecord.why
  );
}
