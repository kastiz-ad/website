export const LIVE_EVENTS_DISCOVERY_VERSION = "20260730-live-events-discovery-v1";

export const EVENT_CATEGORIES = Object.freeze([
  "concert",
  "festival",
  "sports",
  "exhibition",
  "seasonal_attraction",
  "fireworks",
  "market",
  "cultural_performance",
  "family_event"
]);

export const EVENT_PROVIDER_STATUS = Object.freeze({
  VERIFIED_LIVE: "verified_live",
  SETUP_REQUIRED: "setup_required",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  AUTHENTICATION_FAILED: "authentication_failed",
  ERROR: "error"
});

export const EVENT_ACTIONS = Object.freeze({
  ACCEPT: "accept",
  DISMISS: "dismiss",
  REMIND_LATER: "remind_later"
});

const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const nowIso = () => new Date().toISOString();

export const eventDiscoveryStorageKey = (result = {}) => {
  const id = clean(result.id || result.reference || result.rawInput || result.mission || "current");
  return `kastiz-one-events-discovery:${id.replace(/[^a-z0-9_-]/gi, "_").slice(0, 80)}`;
};

export function createEventDiscoveryState(input = {}) {
  return Object.freeze({
    accepted: Object.freeze(asArray(input.accepted)),
    dismissed: Object.freeze(asArray(input.dismissed)),
    remindLater: Object.freeze(asArray(input.remindLater)),
    updatedAt: input.updatedAt || nowIso()
  });
}

export function normalizeEvent(input = {}) {
  const startTime = clean(input.startTime || input.startsAt || input.dateTime || input.date);
  const endTime = clean(input.endTime || input.endsAt || "");
  const category = EVENT_CATEGORIES.includes(input.category) ? input.category : "cultural_performance";
  return Object.freeze({
    id: clean(input.id || input.providerEventId || input.url || input.title),
    providerEventId: clean(input.providerEventId || input.id),
    title: clean(input.title || input.name),
    category,
    venue: clean(input.venue || input.locationName || input.place),
    city: clean(input.city || input.destination?.city),
    country: clean(input.country || input.destination?.country),
    startTime,
    endTime,
    price: Object.freeze({
      currency: clean(input.currency || input.price?.currency || "KRW"),
      min: num(input.priceMin ?? input.price?.min),
      max: num(input.priceMax ?? input.price?.max)
    }),
    coordinates: input.coordinates || null,
    distanceKm: num(input.distanceKm || input.distance),
    url: clean(input.url),
    familyFriendly: input.familyFriendly === true,
    indoor: input.indoor === true,
    outdoor: input.outdoor === true,
    tags: Object.freeze(asArray(input.tags)),
    source: clean(input.source || input.provider || "event-provider"),
    sourceState: input.sourceState || EVENT_PROVIDER_STATUS.VERIFIED_LIVE,
    retrievedAt: input.retrievedAt || nowIso()
  });
}

export function createEventProviderResult({
  ok = false,
  provider = "event-provider",
  status = EVENT_PROVIDER_STATUS.SETUP_REQUIRED,
  items = [],
  message = "Live event data unavailable.",
  retrievedAt = nowIso()
} = {}) {
  return Object.freeze({
    ok: Boolean(ok),
    provider,
    status,
    dataState: status,
    items: Object.freeze(asArray(items).map(normalizeEvent)),
    message,
    retrievedAt
  });
}

export class EventsProvider {
  constructor({ providerId = "events-provider", label = "Events Provider", enabled = false, fetcher = null } = {}) {
    this.providerId = providerId;
    this.label = label;
    this.providerType = "events";
    this.enabled = Boolean(enabled);
    this.fetcher = fetcher;
  }

  async searchEvents(request = {}) {
    void request;
    return createEventProviderResult({
      provider: this.providerId,
      status: EVENT_PROVIDER_STATUS.SETUP_REQUIRED,
      message: "Live event data unavailable."
    });
  }
}

export class TicketingEventsProvider extends EventsProvider {}
export class TourismEventsProvider extends EventsProvider {}
export class CulturalEventsProvider extends EventsProvider {}

const parseDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? date : null;
};

const missionWindow = (result = {}) => {
  const start = parseDate(result.schedule?.startDate ? `${result.schedule.startDate}T00:00:00` : result.startDate);
  const end = parseDate(result.schedule?.endDate ? `${result.schedule.endDate}T23:59:59` : result.endDate);
  return { start, end };
};

export function eventMatchesMissionSchedule(event = {}, result = {}) {
  const eventStart = parseDate(event.startTime);
  const { start, end } = missionWindow(result);
  if (!eventStart || !start || !end) return false;
  return eventStart >= start && eventStart <= end;
}

export function detectEventTimeConflict(event = {}, itinerary = []) {
  const start = parseDate(event.startTime);
  const end = parseDate(event.endTime) || (start ? new Date(start.getTime() + 2 * 60 * 60 * 1000) : null);
  if (!start || !end) return Object.freeze({ hasConflict: false, conflicts: Object.freeze([]) });
  const conflicts = asArray(itinerary).filter((item) => {
    const itemStart = parseDate(item.startTime || item.timeStart || item.dateTime);
    const itemEnd = parseDate(item.endTime || item.timeEnd) || (itemStart ? new Date(itemStart.getTime() + 90 * 60 * 1000) : null);
    if (!itemStart || !itemEnd) return false;
    return start < itemEnd && end > itemStart;
  });
  return Object.freeze({ hasConflict: conflicts.length > 0, conflicts: Object.freeze(conflicts) });
}

const interestScore = (event = {}, interests = []) => {
  const haystack = lower(`${event.title} ${event.category} ${event.tags.join(" ")}`);
  return asArray(interests).reduce((score, interest) => score + (haystack.includes(lower(interest)) ? 12 : 0), 0);
};

export function scoreEventForMission(eventInput = {}, { result = {}, interests = [], budget = null, itinerary = [] } = {}) {
  const event = normalizeEvent(eventInput);
  const conflict = detectEventTimeConflict(event, itinerary);
  const inSchedule = eventMatchesMissionSchedule(event, result);
  const budgetMax = num(budget?.max ?? budget);
  const priceMax = event.price.max ?? event.price.min;
  const budgetScore = budgetMax === null || priceMax === null ? 0 : priceMax <= budgetMax ? 14 : -18;
  const distanceScore = event.distanceKm === null ? 0 : Math.max(-12, 18 - event.distanceKm * 3);
  const fitScore = interestScore(event, interests);
  const familyScore = /family|kids|children|가족|아이|familia/i.test(`${result.rawInput || ""} ${result.mission || ""}`) && event.familyFriendly ? 10 : 0;
  const conflictPenalty = conflict.hasConflict ? -40 : 0;
  const scheduleScore = inSchedule ? 22 : -100;
  const sourceScore = event.sourceState === EVENT_PROVIDER_STATUS.VERIFIED_LIVE ? 14 : 0;
  const score = clamp(48 + scheduleScore + budgetScore + distanceScore + fitScore + familyScore + conflictPenalty + sourceScore);
  const reasons = [
    inSchedule ? "Matches the mission dates." : "Outside the mission dates.",
    conflict.hasConflict ? "Conflicts with the current itinerary." : "No detected time conflict.",
    event.distanceKm !== null ? `About ${event.distanceKm} km from the route or destination.` : "",
    budgetScore > 0 ? "Fits the stated budget." : budgetScore < 0 ? "May exceed the stated budget." : "",
    fitScore > 0 ? "Matches stated interests." : "",
    event.sourceState === EVENT_PROVIDER_STATUS.VERIFIED_LIVE ? "Provider-backed event data." : ""
  ].filter(Boolean);
  return Object.freeze({ score, reasons: Object.freeze(reasons), conflict });
}

export function createEventRecommendation(eventInput = {}, context = {}) {
  const event = normalizeEvent(eventInput);
  const scored = scoreEventForMission(event, context);
  return Object.freeze({
    id: `event-${event.id}`,
    event,
    score: scored.score,
    priority: scored.conflict.hasConflict ? "low" : scored.score >= 84 ? "high" : scored.score >= 68 ? "medium" : "low",
    reason: scored.reasons.join(" "),
    expectedBenefit: scored.conflict.hasConflict
      ? "Keep as optional because it conflicts with the current itinerary."
      : "Adds a relevant local event without changing the mission until approved.",
    affectedComponents: Object.freeze(["itinerary", "map", "budget", "travel_time"]),
    requiresApproval: true,
    sourceState: event.sourceState,
    retrievedAt: event.retrievedAt
  });
}

const hidden = (state = createEventDiscoveryState()) => new Set([...state.dismissed]);

export function createLiveEventsDiscoveryEngine({ result = {}, providerResult = null, interests = [], language = "en", state = {} } = {}) {
  const normalizedState = createEventDiscoveryState(state);
  const provider = providerResult || createEventProviderResult();
  const itinerary = asArray(result.itinerary || result.dailyItinerary || result.timeline);
  if (!provider.ok || provider.status !== EVENT_PROVIDER_STATUS.VERIFIED_LIVE) {
    return Object.freeze({
      version: LIVE_EVENTS_DISCOVERY_VERSION,
      status: "unavailable",
      providerStatus: provider.status || EVENT_PROVIDER_STATUS.SETUP_REQUIRED,
      message: language === "ko" ? "실시간 이벤트 데이터를 사용할 수 없습니다." : language === "es" ? "Datos de eventos en vivo no disponibles." : "Live event data unavailable.",
      recommendations: Object.freeze([]),
      controls: Object.freeze(["accept", "dismiss", "remind_later"]),
      generatedAt: nowIso()
    });
  }
  const dismissed = hidden(normalizedState);
  const recommendations = provider.items
    .filter((event) => eventMatchesMissionSchedule(event, result))
    .map((event) => createEventRecommendation(event, { result, interests, budget: result.budget?.activities || result.budget, itinerary }))
    .filter((rec) => !dismissed.has(rec.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  return Object.freeze({
    version: LIVE_EVENTS_DISCOVERY_VERSION,
    status: recommendations.length ? "ready" : "no_matching_events",
    providerStatus: provider.status,
    provider: provider.provider,
    recommendations: Object.freeze(recommendations),
    controls: Object.freeze(["accept", "dismiss", "remind_later"]),
    generatedAt: nowIso()
  });
}

export function applyEventDiscoveryAction(stateInput = {}, recommendation = {}, action = EVENT_ACTIONS.DISMISS) {
  const state = createEventDiscoveryState(stateInput);
  const id = clean(recommendation.id);
  if (!id) return state;
  const without = (items) => asArray(items).filter((item) => item !== id);
  const withId = (items) => Object.freeze([...new Set([...without(items), id])]);
  const next = { accepted: without(state.accepted), dismissed: without(state.dismissed), remindLater: without(state.remindLater), updatedAt: nowIso() };
  if (action === EVENT_ACTIONS.ACCEPT) next.accepted = withId(state.accepted);
  if (action === EVENT_ACTIONS.DISMISS) next.dismissed = withId(state.dismissed);
  if (action === EVENT_ACTIONS.REMIND_LATER) next.remindLater = withId(state.remindLater);
  return createEventDiscoveryState(next);
}
