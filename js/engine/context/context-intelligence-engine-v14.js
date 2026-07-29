import { buildMissionContext } from "./mission-context-intelligence.js";
import { buildLifeMemoryContext } from "../../profile/life-memory-engine.js";

export const CONTEXT_ENGINE_VERSION = "V14";

const SAFE_STATE = Object.freeze({
  approvalRequired: true,
  executionEnabled: false,
  externalCallsEnabled: false
});

const clean = (value) => String(value ?? "").normalize("NFKC").replace(/[<>]/g, "").trim().slice(0, 240);
const safeObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const list = (value) => Array.isArray(value) ? value.map(clean).filter(Boolean) : value ? [clean(value)].filter(Boolean) : [];

function normalizeTime(input = {}) {
  const date = input.now ? new Date(input.now) : new Date();
  const valid = Number.isFinite(date.getTime()) ? date : new Date();
  return Object.freeze({
    iso: valid.toISOString(),
    date: valid.toISOString().slice(0, 10),
    dayOfWeek: valid.toLocaleDateString("en-US", { weekday: "long", timeZone: input.timezone || "UTC" }),
    timezone: clean(input.timezone || "UTC"),
    source: input.now ? "provided" : "system"
  });
}

function normalizeWeather(input = {}) {
  const weather = safeObject(input.weather);
  return Object.freeze({
    status: clean(weather.status || input.weatherStatus || "unknown"),
    temperature: clean(weather.temperature || input.temperature || ""),
    precipitation: clean(weather.precipitation || input.precipitation || ""),
    source: clean(weather.source || "not-live"),
    live: weather.live === true && input.liveWeatherEnabled === true
  });
}

function normalizeCalendar(input = {}) {
  const events = list(input.calendar?.events || input.calendarEvents).slice(0, 12).map((title, index) => Object.freeze({
    id: `calendar-${index + 1}`,
    title,
    date: clean(input.calendar?.dates?.[index] || ""),
    source: "provided"
  }));
  return Object.freeze({
    connected: input.calendar?.connected === true,
    events: Object.freeze(events),
    busy: events.length > 0,
    source: events.length ? "provided" : "none"
  });
}

function normalizePreviousMissions(input = {}) {
  const missions = (Array.isArray(input.previousMissions) ? input.previousMissions : []).slice(0, 20).map((mission, index) => {
    const source = typeof mission === "object" && mission !== null ? mission : { category: mission };
    return Object.freeze({
      id: clean(source.id || `previous-${index + 1}`),
      category: clean(source.category || source.type || "mission"),
      outcome: clean(source.outcome || source.status || "unknown"),
      completedAt: clean(source.completedAt || source.date || ""),
      source: "provided"
    });
  });
  return Object.freeze({
    count: missions.length,
    recent: Object.freeze(missions.slice(0, 5)),
    categories: Object.freeze([...new Set(missions.map((mission) => mission.category).filter(Boolean))])
  });
}

function normalizeState(value = {}, allowed = []) {
  const source = safeObject(value);
  return Object.freeze(Object.fromEntries(allowed.map((key) => [key, clean(source[key])]).filter(([, next]) => next)));
}

function inferTravelState(input = {}, missionContext = {}) {
  const direct = normalizeState(input.travelState, ["origin", "destination", "departureDate", "returnDate", "passportStatus", "visaStatus", "luggage", "companions"]);
  return Object.freeze({
    ...direct,
    scope: missionContext.scope || "",
    distanceClass: missionContext.distanceClass || "",
    requiresInternationalTravel: missionContext.requiresInternationalTravel === true
  });
}

function buildUnderstandingSignals({ missionContext, calendar, previousMissions, lifeMemoryContext, input }) {
  return Object.freeze([
    missionContext?.destination?.city ? `Destination context: ${missionContext.destination.city}` : null,
    missionContext?.relationship?.value && missionContext.relationship.value !== "unspecified" ? `Relationship context: ${missionContext.relationship.value}` : null,
    calendar.busy ? "Calendar has scheduled events that may affect timing." : null,
    previousMissions.count ? `Previous missions available: ${previousMissions.count}` : null,
    lifeMemoryContext.entriesUsed?.length ? `Life Memory entries available: ${lifeMemoryContext.entriesUsed.length}` : null,
    input.vehicle?.inspectionDue ? "Vehicle deadline context exists." : null,
    input.home?.maintenanceDue ? "Home maintenance context exists." : null,
    input.business?.renewalDue ? "Business renewal context exists." : null
  ].filter(Boolean));
}

export function buildContextObject(input = {}) {
  const mission = clean(input.mission || input.goal || input.currentMission);
  const language = ["en", "ko", "es"].includes(input.language) ? input.language : undefined;
  const missionContext = input.missionContext || buildMissionContext(mission, input);
  const time = normalizeTime({ now: input.now, timezone: input.timezone || input.location?.timezone });
  const location = Object.freeze({
    current: clean(input.currentLocation || input.location?.current || missionContext.origin?.city || ""),
    destination: missionContext.destination || null,
    source: input.currentLocation || input.location?.current ? "provided" : "mission-context"
  });
  const weather = normalizeWeather(input);
  const calendar = normalizeCalendar(input);
  const memory = buildLifeMemoryContext({
    memory: input.lifeMemory,
    missionType: input.missionType || input.classification?.providerType || input.providerType || "travel",
    explicitInstructions: mission,
    language: language || missionContext.interfaceLanguage || missionContext.language || "en"
  });
  const previousMissions = normalizePreviousMissions(input);
  const currentMission = Object.freeze({
    text: mission,
    type: clean(input.missionType || input.classification?.providerType || input.providerType || "unknown"),
    language: language || missionContext.language || "en",
    confidence: input.classification?.confidence || null
  });
  const travelState = inferTravelState(input, missionContext);
  const familyContext = normalizeState(input.family, ["householdSize", "childrenAges", "elderCare", "schoolCalendar", "sharedSchedule"]);
  const vehicle = normalizeState(input.vehicle, ["vehicleType", "inspectionDue", "insuranceRenewal", "maintenanceDue", "parking"]);
  const home = normalizeState(input.home, ["propertyType", "maintenanceDue", "movingDate", "leaseEnd", "serviceArea"]);
  const business = normalizeState(input.business, ["companyType", "renewalDue", "taxDeadline", "licenseDeadline", "billingCycle"]);
  const understandingSignals = buildUnderstandingSignals({ missionContext, calendar, previousMissions, lifeMemoryContext: memory, input });

  return Object.freeze({
    version: CONTEXT_ENGINE_VERSION,
    time,
    location,
    weather,
    calendar,
    memory,
    previousMissions,
    currentMission,
    travelState,
    familyContext,
    vehicle,
    home,
    business,
    missionContext,
    understandingSignals,
    consumedByMissionEngines: true,
    improvesUnderstandingOnly: true,
    ...SAFE_STATE
  });
}

export function summarizeContextObject(context = {}) {
  const signals = list(context.understandingSignals).slice(0, 6);
  return Object.freeze({
    version: context.version || CONTEXT_ENGINE_VERSION,
    destination: context.location?.destination?.city || "",
    currentLocation: context.location?.current || "",
    calendarEvents: context.calendar?.events?.length || 0,
    memoryEntriesUsed: context.memory?.entriesUsed?.length || 0,
    previousMissionCount: context.previousMissions?.count || 0,
    signals,
    approvalRequired: true,
    executionEnabled: false
  });
}
