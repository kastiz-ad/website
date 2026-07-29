export const WEATHER_INTELLIGENCE_VERSION = "20260730-weather-intelligence-v1";

export const WEATHER_PROVIDER_STATUS = Object.freeze({
  VERIFIED_LIVE: "verified_live",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  SETUP_REQUIRED: "setup_required",
  ERROR: "error"
});

export const WEATHER_HAZARDS = Object.freeze({
  RAIN: "rain",
  HEAT: "heat",
  SNOW: "snow",
  STORM: "storm",
  WIND: "wind",
  SEVERE: "severe"
});

const clean = (value) => String(value ?? "").trim();
const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : null;
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const nowIso = () => new Date().toISOString();
const local = (language, en, ko, es) => language === "ko" ? ko : language === "es" ? es : en;

export function createWeatherProviderResult({
  ok = false,
  provider = "weather-provider",
  status = WEATHER_PROVIDER_STATUS.PROVIDER_UNAVAILABLE,
  forecast = [],
  message = "Weather provider unavailable",
  evidence = {}
} = {}) {
  return Object.freeze({
    ok: Boolean(ok),
    provider,
    status,
    dataState: status,
    forecast: Object.freeze(asArray(forecast).map(normalizeWeatherPoint)),
    message,
    evidence: Object.freeze({
      provider,
      retrievedAt: nowIso(),
      ...evidence
    })
  });
}

export function normalizeWeatherPoint(input = {}) {
  return Object.freeze({
    time: clean(input.time || input.dateTime || input.date),
    temperatureC: num(input.temperatureC ?? input.temperature_2m ?? input.temperature),
    precipitationMm: num(input.precipitationMm ?? input.precipitation),
    rainMm: num(input.rainMm ?? input.rain),
    snowfallCm: num(input.snowfallCm ?? input.snowfall),
    windKph: num(input.windKph ?? input.wind_speed_10m ?? input.windSpeed),
    weatherCode: num(input.weatherCode ?? input.weather_code),
    summary: clean(input.summary || input.condition),
    sourceState: input.sourceState || WEATHER_PROVIDER_STATUS.VERIFIED_LIVE
  });
}

export class OpenMeteoWeatherProvider {
  constructor({ providerId = "open-meteo", fetcher = typeof fetch !== "undefined" ? fetch.bind(globalThis) : null, enabled = true, timeoutMs = 8000 } = {}) {
    this.providerId = providerId;
    this.providerType = "weather";
    this.enabled = Boolean(enabled);
    this.fetcher = fetcher;
    this.timeoutMs = timeoutMs;
  }

  async getForecast({ latitude, longitude, startDate = "", endDate = "" } = {}) {
    if (!this.enabled || !this.fetcher || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return createWeatherProviderResult({ provider: this.providerId, status: WEATHER_PROVIDER_STATUS.PROVIDER_UNAVAILABLE, message: "Weather provider unavailable" });
    }
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      hourly: "temperature_2m,precipitation,rain,snowfall,wind_speed_10m,weather_code",
      timezone: "auto"
    });
    if (startDate) params.set("start_date", startDate);
    if (endDate) params.set("end_date", endDate);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) return createWeatherProviderResult({ provider: this.providerId, status: WEATHER_PROVIDER_STATUS.ERROR, message: "Weather provider unavailable", evidence: { status: response.status } });
      const hourly = data?.hourly || {};
      const forecast = asArray(hourly.time).map((time, index) => normalizeWeatherPoint({
        time,
        temperatureC: hourly.temperature_2m?.[index],
        precipitationMm: hourly.precipitation?.[index],
        rainMm: hourly.rain?.[index],
        snowfallCm: hourly.snowfall?.[index],
        windKph: hourly.wind_speed_10m?.[index],
        weatherCode: hourly.weather_code?.[index]
      }));
      return createWeatherProviderResult({
        ok: forecast.length > 0,
        provider: this.providerId,
        status: forecast.length ? WEATHER_PROVIDER_STATUS.VERIFIED_LIVE : WEATHER_PROVIDER_STATUS.PROVIDER_UNAVAILABLE,
        forecast,
        message: forecast.length ? "Weather forecast retrieved." : "Weather provider unavailable",
        evidence: { endpoint: "open-meteo-forecast", attribution: "Open-Meteo" }
      });
    } catch {
      return createWeatherProviderResult({ provider: this.providerId, status: WEATHER_PROVIDER_STATUS.PROVIDER_UNAVAILABLE, message: "Weather provider unavailable" });
    } finally {
      clearTimeout(timeout);
    }
  }
}

const codeIndicatesStorm = (code) => [95, 96, 99].includes(Number(code));
const codeIndicatesSnow = (code) => [71, 73, 75, 77, 85, 86].includes(Number(code));
const codeIndicatesRain = (code) => [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(Number(code));

export function detectWeatherHazards(forecast = []) {
  const hazards = new Map();
  for (const point of asArray(forecast).map(normalizeWeatherPoint)) {
    const add = (type, severity, reason) => {
      const current = hazards.get(type);
      if (!current || severity > current.severity) hazards.set(type, { type, severity, reason, time: point.time, point });
    };
    if ((point.rainMm ?? 0) > 0 || (point.precipitationMm ?? 0) >= 1 || codeIndicatesRain(point.weatherCode)) add(WEATHER_HAZARDS.RAIN, Math.min(100, 40 + (point.rainMm || point.precipitationMm || 1) * 10), "Rain is forecast during the itinerary window.");
    if ((point.temperatureC ?? 0) >= 32) add(WEATHER_HAZARDS.HEAT, Math.min(100, 45 + (point.temperatureC - 32) * 8), "High temperature may affect outdoor walking.");
    if ((point.snowfallCm ?? 0) > 0 || codeIndicatesSnow(point.weatherCode)) add(WEATHER_HAZARDS.SNOW, Math.min(100, 45 + (point.snowfallCm || 1) * 10), "Snow may affect walking and transport.");
    if (codeIndicatesStorm(point.weatherCode)) add(WEATHER_HAZARDS.STORM, 88, "Storm conditions may require schedule changes.");
    if ((point.windKph ?? 0) >= 38) add(WEATHER_HAZARDS.WIND, Math.min(100, 40 + (point.windKph - 38) * 2), "Strong wind may affect outdoor activities.");
    if (codeIndicatesStorm(point.weatherCode) || (point.windKph ?? 0) >= 55 || (point.precipitationMm ?? 0) >= 12) add(WEATHER_HAZARDS.SEVERE, 92, "Severe weather conditions may affect safety.");
  }
  return Object.freeze([...hazards.values()].sort((a, b) => b.severity - a.severity));
}

const isOutdoorItem = (item = {}) => /park|walk|beach|outdoor|view|hike|market|street|산책|공원|해변|전망|시장|야외|caminar|parque/i.test(`${item.title || ""} ${item.name || ""} ${item.type || ""} ${item.tags || ""}`);
const isIndoorItem = (item = {}) => /museum|aquarium|gallery|mall|shopping|cafe|restaurant|indoor|미술관|박물관|아쿠아리움|백화점|쇼핑|카페|실내|museo|galer/i.test(`${item.title || ""} ${item.name || ""} ${item.type || ""} ${item.tags || ""}`);

export function estimateWeatherImpact({ forecast = [], itinerary = [], routes = [] } = {}) {
  const hazards = detectWeatherHazards(forecast);
  const impactedItems = asArray(itinerary).filter((item) => isOutdoorItem(item) && hazards.some((hazard) => [WEATHER_HAZARDS.RAIN, WEATHER_HAZARDS.SNOW, WEATHER_HAZARDS.STORM, WEATHER_HAZARDS.HEAT, WEATHER_HAZARDS.SEVERE].includes(hazard.type)));
  const routeImpact = asArray(routes).filter((route) => Number(route.walkingMinutes || route.walkingDistanceKm || 0) > 10 && hazards.length);
  const severity = clamp(hazards.reduce((max, hazard) => Math.max(max, hazard.severity), 0));
  return Object.freeze({
    hazards,
    impactedItems: Object.freeze(impactedItems),
    routeImpact: Object.freeze(routeImpact),
    severity,
    missionImpactScore: clamp(severity + impactedItems.length * 8 + routeImpact.length * 4)
  });
}

export function createWeatherSuggestion(input = {}) {
  return Object.freeze({
    id: clean(input.id),
    category: "weather",
    priority: input.priority || "medium",
    title: clean(input.title),
    reason: clean(input.reason),
    expectedBenefit: clean(input.expectedBenefit),
    affectedComponents: Object.freeze(asArray(input.affectedComponents || ["itinerary", "routes"])),
    providerBacked: input.providerBacked === true,
    confidence: clamp(input.confidence ?? 70),
    sourceState: input.sourceState || WEATHER_PROVIDER_STATUS.VERIFIED_LIVE,
    requiresApproval: true,
    patch: Object.freeze(input.patch || {})
  });
}

export function createWeatherIntelligenceEngine({ result = {}, providerResult = null, language = "en" } = {}) {
  const provider = providerResult || createWeatherProviderResult();
  if (!provider.ok || provider.status !== WEATHER_PROVIDER_STATUS.VERIFIED_LIVE) {
    return Object.freeze({
      version: WEATHER_INTELLIGENCE_VERSION,
      status: "unavailable",
      providerStatus: provider.status,
      message: local(language, "Weather provider unavailable", "날씨 제공업체를 사용할 수 없습니다.", "Proveedor meteorológico no disponible"),
      suggestions: Object.freeze([]),
      accessibilityReview: Object.freeze({ ok: true, note: "No dynamic weather UI rendered without provider data." }),
      performanceReview: Object.freeze({ providerCalls: 0, estimatedRenderCost: "low" })
    });
  }
  const itinerary = asArray(result.itinerary || result.dailyItinerary || result.timeline);
  const routes = asArray(result.routes || result.transportation);
  const impact = estimateWeatherImpact({ forecast: provider.forecast, itinerary, routes });
  const indoor = itinerary.find(isIndoorItem);
  const outdoor = impact.impactedItems[0];
  const suggestions = [];
  const topHazard = impact.hazards[0];
  if (topHazard && outdoor && indoor) {
    suggestions.push(createWeatherSuggestion({
      id: "weather-swap-indoor-outdoor",
      priority: topHazard.severity >= 80 ? "high" : "medium",
      title: local(language, "Move indoor activity into the weather-risk window", "날씨 위험 시간에 실내 일정을 배치", "Mover actividad interior al bloque de clima"),
      reason: `${topHazard.reason} ${outdoor.title || outdoor.name} is outdoor-sensitive.`,
      expectedBenefit: local(language, "Keeps the mission structure while reducing weather exposure.", "미션 구조는 유지하고 날씨 노출을 줄입니다.", "Mantiene la estructura reduciendo exposición."),
      providerBacked: true,
      confidence: Math.min(96, topHazard.severity),
      sourceState: provider.status,
      patch: { operation: "swap_items", outdoorId: outdoor.id || outdoor.title || "", indoorId: indoor.id || indoor.title || "" }
    }));
  }
  if (impact.routeImpact.length) {
    suggestions.push(createWeatherSuggestion({
      id: "weather-route-walking-reduction",
      priority: impact.severity >= 80 ? "high" : "medium",
      title: local(language, "Reduce exposed walking", "노출 도보 줄이기", "Reducir caminata expuesta"),
      reason: topHazard?.reason || "Weather may affect walking routes.",
      expectedBenefit: local(language, "ONE can re-check routes that reduce outdoor walking after approval.", "승인 후 야외 도보가 적은 경로를 다시 확인할 수 있습니다.", "ONE puede revisar rutas con menos caminata exterior tras aprobar."),
      providerBacked: true,
      confidence: Math.min(92, impact.severity + 8),
      sourceState: provider.status,
      patch: { operation: "reroute_for_weather", routeIds: impact.routeImpact.map((route) => route.id || route.label || "") }
    }));
  }
  if (impact.hazards.some((hazard) => hazard.type === WEATHER_HAZARDS.SEVERE)) {
    suggestions.unshift(createWeatherSuggestion({
      id: "weather-severe-safety-review",
      priority: "critical",
      title: local(language, "Review severe weather before continuing", "진행 전 악천후 확인", "Revisar clima severo antes de seguir"),
      reason: impact.hazards.find((hazard) => hazard.type === WEATHER_HAZARDS.SEVERE).reason,
      expectedBenefit: local(language, "Prevents unsafe outdoor routing.", "안전하지 않은 야외 동선을 피합니다.", "Evita rutas exteriores inseguras."),
      affectedComponents: ["itinerary", "routes", "safety"],
      providerBacked: true,
      confidence: 94,
      sourceState: provider.status,
      patch: { operation: "require_safety_review" }
    }));
  }
  return Object.freeze({
    version: WEATHER_INTELLIGENCE_VERSION,
    status: suggestions.length ? "ready" : "clear",
    providerStatus: provider.status,
    provider: provider.provider,
    impact,
    suggestions: Object.freeze(suggestions),
    message: suggestions.length ? "Weather intelligence prepared." : "No weather-driven change recommended.",
    accessibilityReview: Object.freeze({
      ok: true,
      note: "Suggestions are exposed as button actions and text; no color-only status is required."
    }),
    performanceReview: Object.freeze({
      providerCalls: 1,
      forecastPoints: provider.forecast.length,
      estimatedRenderCost: provider.forecast.length > 200 ? "medium" : "low"
    })
  });
}
