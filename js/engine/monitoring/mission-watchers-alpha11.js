export const ALPHA11_AUTONOMOUS_MISSION_MONITORING_VERSION = "ALPHA-11";

export const WATCHER_LIFECYCLE = Object.freeze({
  CREATED: "created",
  MONITORING: "monitoring",
  EVENT_DETECTED: "event_detected",
  VALIDATED: "validated",
  DISPLAYED: "displayed",
  DISMISSED: "dismissed",
  RESOLVED: "resolved",
  EXPIRED: "expired",
  PAUSED: "paused",
  DISABLED: "disabled"
});

export const EVENT_PRIORITIES = Object.freeze({
  CRITICAL: "critical",
  HIGH: "high",
  NORMAL: "normal",
  LOW: "low"
});

const DAY_MS = 86400000;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const stableText = (value = "") => String(value || "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
const uniq = (items = []) => [...new Set(items.filter(Boolean))];
const asArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
const iso = (date = new Date()) => new Date(date).toISOString();

const localCopy = (language = "en", copy = {}) => copy[language] || copy.en || "";

export const watcherLabel = (type = "", language = "en") => {
  const labels = {
    flight: { en: "Flights", ko: "항공", es: "Vuelos" },
    hotel: { en: "Hotels", ko: "호텔", es: "Hoteles" },
    weather: { en: "Weather", ko: "날씨", es: "Clima" },
    visa: { en: "Visa / government", ko: "비자 / 정부", es: "Visa / gobierno" },
    exchange_rate: { en: "Exchange rate", ko: "환율", es: "Cambio" },
    event: { en: "Events", ko: "행사", es: "Eventos" },
    transportation: { en: "Transportation", ko: "이동", es: "Transporte" },
    safety: { en: "Safety", ko: "안전", es: "Seguridad" },
    restaurant: { en: "Restaurants", ko: "레스토랑", es: "Restaurantes" },
    provider_trust: { en: "Provider trust", ko: "제공업체 신뢰", es: "Confianza de proveedor" },
    mission: { en: "Mission", ko: "미션", es: "Misión" }
  };
  return localCopy(language, labels[type] || { en: type, ko: type, es: type });
};

const defaultWatcherTypes = (result = {}) => {
  const types = ["mission"];
  if (result.type === "travel" || result.destination) {
    if (result.flights?.length) types.push("flight");
    if (result.hotels?.length) types.push("hotel");
    if (result.weather?.length || result.worldIntelligence?.models?.weather?.length) types.push("weather");
    if (result.visa || result.entryRequirement || result.worldIntelligence?.models?.advisories?.length) types.push("visa", "safety");
    if (result.exchangeRate || result.currency || result.worldIntelligence?.models?.currency?.length) types.push("exchange_rate");
    if (result.restaurants?.length) types.push("restaurant");
    if (result.airportTransfer || result.transportation) types.push("transportation");
    types.push("event");
  }
  if (result.alpha09ProviderTrust?.providerCount || result.providers?.length || result.providerOptions?.length) types.push("provider_trust");
  return uniq(types);
};

export const createMissionWatchers = ({ result = {}, state = {}, now = new Date(), language = "en" } = {}) => {
  const disabled = new Set(asArray(state.disabledWatchers));
  const paused = Boolean(state.paused);
  return defaultWatcherTypes(result).map((type) => ({
    watcherId: `watcher-${type}-${stableText(result.missionId || result.id || result.rawInput || "mission") || "mission"}`,
    type,
    label: watcherLabel(type, language),
    lifecycle: disabled.has(type) ? WATCHER_LIFECYCLE.DISABLED : paused ? WATCHER_LIFECYCLE.PAUSED : WATCHER_LIFECYCLE.MONITORING,
    status: disabled.has(type) ? "disabled" : paused ? "paused" : "monitoring",
    lastCheckedAt: iso(now),
    lastEventAt: state.lastEventAtByWatcher?.[type] || null,
    sharedInfrastructureKey: `monitor:${type}`,
    continuesUntilMissionCompletion: true
  }));
};

const eventCopy = (type, language, detail = {}) => {
  const copy = {
    flight_price_drop: {
      en: `Flight prices changed meaningfully${detail.percent ? ` by about ${detail.percent}%` : ""}.`,
      ko: `항공권 가격이 의미 있게 변동했습니다${detail.percent ? ` · 약 ${detail.percent}%` : ""}.`,
      es: `Los precios de vuelos cambiaron de forma importante${detail.percent ? `, aprox. ${detail.percent}%` : ""}.`
    },
    hotel_availability_change: {
      en: "Hotel availability changed.",
      ko: "호텔 가능 여부가 변경되었습니다.",
      es: "Cambió la disponibilidad del hotel."
    },
    weather_significant_change: {
      en: "Weather forecast changed enough to review the plan.",
      ko: "계획을 확인할 만큼 날씨 예보가 바뀌었습니다.",
      es: "El pronóstico cambió lo suficiente para revisar el plan."
    },
    government_advisory_update: {
      en: "Government or entry guidance changed.",
      ko: "정부 또는 입국 관련 안내가 변경되었습니다.",
      es: "Cambió una guía gubernamental o de entrada."
    },
    exchange_rate_improved: {
      en: "Exchange rate moved in a favorable direction.",
      ko: "환율이 유리한 방향으로 움직였습니다.",
      es: "El tipo de cambio mejoró."
    },
    event_announcement: {
      en: "A relevant local event update was found.",
      ko: "관련 현지 행사 업데이트가 확인되었습니다.",
      es: "Se encontró una actualización de evento local."
    },
    provider_trust_warning: {
      en: "A provider trust signal changed.",
      ko: "제공업체 신뢰 신호가 변경되었습니다.",
      es: "Cambió una señal de confianza del proveedor."
    },
    restaurant_status_change: {
      en: "Restaurant status may need rechecking.",
      ko: "레스토랑 상태 재확인이 필요할 수 있습니다.",
      es: "Puede ser necesario revisar el estado del restaurante."
    },
    transportation_update: {
      en: "Transportation details may need review.",
      ko: "이동 정보 확인이 필요할 수 있습니다.",
      es: "Puede ser necesario revisar el transporte."
    }
  };
  return localCopy(language, copy[type] || { en: "Mission update detected.", ko: "미션 업데이트가 감지되었습니다.", es: "Actualización de misión detectada." });
};

const nextActionFor = (eventType, language = "en") => {
  const actions = {
    flight_price_drop: { en: "Review flights", ko: "항공권 검토", es: "Revisar vuelos" },
    hotel_availability_change: { en: "Review hotels", ko: "호텔 검토", es: "Revisar hoteles" },
    weather_significant_change: { en: "Review weather plan", ko: "날씨 대안 검토", es: "Revisar plan por clima" },
    government_advisory_update: { en: "Review official guidance", ko: "공식 안내 확인", es: "Revisar guía oficial" },
    exchange_rate_improved: { en: "Review budget", ko: "예산 검토", es: "Revisar presupuesto" },
    event_announcement: { en: "Review itinerary", ko: "일정 검토", es: "Revisar itinerario" },
    provider_trust_warning: { en: "Review alternatives", ko: "대안 검토", es: "Revisar alternativas" },
    restaurant_status_change: { en: "Review restaurants", ko: "레스토랑 검토", es: "Revisar restaurantes" },
    transportation_update: { en: "Review transport", ko: "이동 검토", es: "Revisar transporte" }
  };
  return localCopy(language, actions[eventType] || { en: "Review mission", ko: "미션 검토", es: "Revisar misión" });
};

const makeEvent = ({
  missionId,
  watcherType,
  eventType,
  priority = EVENT_PRIORITIES.NORMAL,
  detail = {},
  source = "mission_snapshot",
  confidence = 0.7,
  now = new Date(),
  language = "en",
  groupKey = ""
}) => {
  const timestamp = iso(now);
  const safeGroup = groupKey || `${watcherType}:${eventType}`;
  return {
    eventId: `event-${stableText(safeGroup)}-${timestamp.slice(0, 10)}`,
    missionId,
    watcherType,
    watcherLabel: watcherLabel(watcherType, language),
    eventType,
    priority,
    title: eventCopy(eventType, language, detail),
    evidence: detail.evidence || eventCopy(eventType, language, detail),
    confidence: clamp(confidence),
    timestamp,
    source,
    expiry: iso(new Date(new Date(now).getTime() + 7 * DAY_MS)),
    lifecycle: WATCHER_LIFECYCLE.VALIDATED,
    status: "new",
    nextRecommendedAction: nextActionFor(eventType, language),
    groupKey: safeGroup,
    executionStatus: "not_executed"
  };
};

export const validateMissionEvent = (event = {}) => {
  const failures = [];
  for (const key of ["eventId", "watcherType", "eventType", "priority", "evidence", "timestamp", "source", "expiry"]) {
    if (!event[key]) failures.push(`${key}_missing`);
  }
  if (!Number.isFinite(Number(event.confidence)) || Number(event.confidence) <= 0) failures.push("confidence_missing");
  if (event.executionStatus !== "not_executed") failures.push("execution_boundary_missing");
  return { ok: failures.length === 0, failures };
};

const previousRange = (state = {}, key) => state.previousSnapshots?.[key];
const currentRange = (range = {}) => {
  const min = Number(range.min || 0);
  const max = Number(range.max || 0);
  if (!min && !max) return 0;
  return (min + max) / (min && max ? 2 : 1);
};

export const detectMissionWatcherEvents = ({ result = {}, state = {}, now = new Date(), language = "en" } = {}) => {
  const missionId = result.missionId || result.id || stableText(result.rawInput || result.originalMission || "mission");
  const events = [];
  const flightNow = currentRange(result.budget?.flights || result.flights?.[0]?.estimatedPrice);
  const flightBefore = Number(previousRange(state, "flightAverage") || 0);
  if (flightNow && flightBefore) {
    const delta = (flightBefore - flightNow) / flightBefore;
    if (Math.abs(delta) >= 0.08) {
      events.push(makeEvent({
        missionId,
        watcherType: "flight",
        eventType: "flight_price_drop",
        priority: delta > 0 ? EVENT_PRIORITIES.HIGH : EVENT_PRIORITIES.NORMAL,
        detail: { percent: Math.round(Math.abs(delta) * 100), evidence: `previous=${flightBefore}; current=${flightNow}` },
        source: "mission_price_snapshot",
        confidence: 0.74,
        now,
        language,
        groupKey: "flight-price"
      }));
    }
  }
  if (state.previousSnapshots?.hotelAvailability === "available" && result.hotels?.some((hotel) => hotel.availability === "sold_out" || hotel.status === "sold_out")) {
    events.push(makeEvent({ missionId, watcherType: "hotel", eventType: "hotel_availability_change", priority: EVENT_PRIORITIES.HIGH, detail: { evidence: "previous hotel available; current selected hotel sold out" }, source: "hotel_snapshot", confidence: 0.78, now, language, groupKey: "hotel-availability" }));
  }
  const weatherChange = result.weather?.some((item) => /storm|heavy rain|snow|typhoon|폭우|태풍|폭설|tormenta|lluvia fuerte/i.test(`${item.summary || item.value || item.condition || ""}`));
  if (weatherChange) {
    events.push(makeEvent({ missionId, watcherType: "weather", eventType: "weather_significant_change", priority: EVENT_PRIORITIES.HIGH, detail: { evidence: "significant weather keyword in forecast" }, source: "weather_snapshot", confidence: 0.72, now, language, groupKey: "weather-significant" }));
  }
  const failures = asArray(result.worldIntelligence?.failures);
  if (failures.some((failure) => /advisory|visa|government|entry|restriction|정부|비자|입국|제한/i.test(`${failure.providerType || ""} ${failure.message || ""}`))) {
    events.push(makeEvent({ missionId, watcherType: "visa", eventType: "government_advisory_update", priority: EVENT_PRIORITIES.CRITICAL, detail: { evidence: failures.map((failure) => failure.message || failure.providerType).join("; ") }, source: "world_intelligence", confidence: 0.76, now, language, groupKey: "government-advisory" }));
  }
  if (Number(state.previousSnapshots?.exchangeRate || 0) && Number(result.exchangeRate?.rate || result.exchangeRate?.value || 0)) {
    const before = Number(state.previousSnapshots.exchangeRate);
    const current = Number(result.exchangeRate.rate || result.exchangeRate.value);
    if (Math.abs((current - before) / before) >= 0.04) {
      events.push(makeEvent({ missionId, watcherType: "exchange_rate", eventType: "exchange_rate_improved", priority: EVENT_PRIORITIES.NORMAL, detail: { evidence: `previous=${before}; current=${current}` }, source: "currency_snapshot", confidence: 0.68, now, language, groupKey: "exchange-rate" }));
    }
  }
  if (asArray(result.events).some((event) => event.confirmed || /festival|concert|전시|축제|festival|concierto/i.test(`${event.title || event.name || ""}`))) {
    events.push(makeEvent({ missionId, watcherType: "event", eventType: "event_announcement", priority: EVENT_PRIORITIES.NORMAL, detail: { evidence: "event/festival candidate in mission data" }, source: "event_snapshot", confidence: 0.62, now, language, groupKey: "local-event" }));
  }
  if (result.alpha09ProviderTrust?.warnings?.length) {
    events.push(makeEvent({ missionId, watcherType: "provider_trust", eventType: "provider_trust_warning", priority: EVENT_PRIORITIES.HIGH, detail: { evidence: result.alpha09ProviderTrust.warnings.join("; ") }, source: "provider_trust_network", confidence: 0.8, now, language, groupKey: "provider-trust" }));
  }
  if (result.restaurants?.some((restaurant) => restaurant.status === "closed" || restaurant.availability === "closed")) {
    events.push(makeEvent({ missionId, watcherType: "restaurant", eventType: "restaurant_status_change", priority: EVENT_PRIORITIES.NORMAL, detail: { evidence: "restaurant marked closed in snapshot" }, source: "restaurant_snapshot", confidence: 0.7, now, language, groupKey: "restaurant-status" }));
  }
  if (result.transportation?.disruption || result.airportTransfer?.disruption) {
    events.push(makeEvent({ missionId, watcherType: "transportation", eventType: "transportation_update", priority: EVENT_PRIORITIES.HIGH, detail: { evidence: "transportation disruption present in mission data" }, source: "transport_snapshot", confidence: 0.72, now, language, groupKey: "transport-disruption" }));
  }
  return events.filter((event) => validateMissionEvent(event).ok);
};

export const groupMissionEvents = (events = []) => {
  const grouped = new Map();
  events.forEach((event) => {
    const key = event.groupKey || `${event.watcherType}:${event.eventType}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, { ...event, relatedEventCount: 1 });
      return;
    }
    const priorityOrder = [EVENT_PRIORITIES.LOW, EVENT_PRIORITIES.NORMAL, EVENT_PRIORITIES.HIGH, EVENT_PRIORITIES.CRITICAL];
    const stronger = priorityOrder.indexOf(event.priority) > priorityOrder.indexOf(existing.priority) ? event : existing;
    grouped.set(key, {
      ...stronger,
      relatedEventCount: (existing.relatedEventCount || 1) + 1,
      evidence: uniq([existing.evidence, event.evidence]).join("; ")
    });
  });
  return [...grouped.values()];
};

export const splitMissionNotifications = (events = []) => ({
  proactive: events.filter((event) => [EVENT_PRIORITIES.CRITICAL, EVENT_PRIORITIES.HIGH].includes(event.priority)),
  historyOnly: events.filter((event) => event.priority === EVENT_PRIORITIES.NORMAL),
  silent: events.filter((event) => event.priority === EVENT_PRIORITIES.LOW)
});

export const buildMissionDigest = (events = [], { language = "en", now = new Date() } = {}) => {
  const dayLabel = localCopy(language, { en: "Today", ko: "오늘", es: "Hoy" });
  const grouped = groupMissionEvents(events);
  return {
    generatedAt: iso(now),
    label: dayLabel,
    updates: grouped.map((event) => ({
      eventId: event.eventId,
      priority: event.priority,
      watcher: watcherLabel(event.watcherType, language),
      title: event.title,
      whatChanged: event.evidence,
      why: event.source,
      status: event.status,
      nextRecommendedAction: event.nextRecommendedAction
    }))
  };
};

export const pauseMissionMonitoring = (state = {}) => ({ ...state, paused: true, pausedAt: iso(new Date()) });
export const resumeMissionMonitoring = (state = {}) => ({ ...state, paused: false, resumedAt: iso(new Date()) });
export const disableMissionWatcher = (state = {}, watcherType) => ({ ...state, disabledWatchers: uniq([...asArray(state.disabledWatchers), watcherType]) });
export const deleteMissionWatcher = (state = {}, watcherType) => ({ ...disableMissionWatcher(state, watcherType), deletedWatchers: uniq([...asArray(state.deletedWatchers), watcherType]) });

export const createMissionWatcherLayer = ({
  result = {},
  state = {},
  now = new Date(),
  language = "en"
} = {}) => {
  const completed = /completed|cancelled|failed_terminal|expired/i.test(String(result.missionProgress?.currentState || result.status || ""));
  const watchers = createMissionWatchers({ result, state, now, language }).map((watcher) => completed ? { ...watcher, lifecycle: WATCHER_LIFECYCLE.EXPIRED, status: "stopped_after_completion" } : watcher);
  const events = completed || state.paused ? [] : groupMissionEvents(detectMissionWatcherEvents({ result, state, now, language }));
  const notificationSplit = splitMissionNotifications(events);
  const history = [...asArray(state.history), ...events].map((event) => ({ ...event, lifecycle: WATCHER_LIFECYCLE.DISPLAYED }));
  return {
    version: ALPHA11_AUTONOMOUS_MISSION_MONITORING_VERSION,
    mode: "monitor_evaluate_notify_never_execute",
    watchers,
    events,
    notifications: notificationSplit.proactive,
    historyOnlyEvents: notificationSplit.historyOnly,
    silentEvents: notificationSplit.silent,
    digest: buildMissionDigest(events, { language, now }),
    missionHistory: history,
    nextRecommendedAction: notificationSplit.proactive[0]?.nextRecommendedAction || events[0]?.nextRecommendedAction || null,
    paused: Boolean(state.paused),
    stoppedAfterCompletion: completed,
    infrastructure: {
      sharedWatcherInfrastructure: true,
      duplicateMonitoringAvoided: true,
      webhookReady: true,
      pollingReady: true,
      noAutomaticExecution: true
    },
    sourceReuse: {
      worldIntelligence: Boolean(result.worldIntelligence),
      predictiveIntelligenceDistinct: Boolean(result.alpha06PredictiveIntelligence),
      personalMissionMemory: Boolean(result.alpha07PersonalMissionMemory),
      providerTrustNetwork: Boolean(result.alpha09ProviderTrust)
    }
  };
};

export const validateMissionWatcherLayer = (layer = {}) => {
  const failures = [];
  if (layer.version !== ALPHA11_AUTONOMOUS_MISSION_MONITORING_VERSION) failures.push("wrong_version");
  if (layer.mode !== "monitor_evaluate_notify_never_execute") failures.push("mode_missing");
  if (!layer.infrastructure?.noAutomaticExecution) failures.push("execution_boundary_missing");
  if (!Array.isArray(layer.watchers)) failures.push("watchers_missing");
  if ((layer.events || []).some((event) => !validateMissionEvent(event).ok)) failures.push("invalid_event");
  if ((layer.notifications || []).some((event) => ![EVENT_PRIORITIES.CRITICAL, EVENT_PRIORITIES.HIGH].includes(event.priority))) failures.push("low_priority_notification");
  return { ok: failures.length === 0, failures };
};
