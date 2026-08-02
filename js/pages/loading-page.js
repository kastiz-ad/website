import { fetchJson } from "../engine/providers.js?v=20260711-1";
import { trackEvent } from "../analytics.js";
import { normalizeInterfaceLocale } from "../i18n/locale-registry.js";
import { createGeographicScope, enforceGeographicScope, stampGeographicEvidence } from "../engine/location/geographic-guard.js?v=20260722-location-restore";
import { placeFallbackPlan } from "../engine/world/place-intelligence-engine.js";

const root = document.documentElement;
const body = document.body;

const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  travelMission: "kastiz-one-travel-mission",
  results: "kastiz-one-results",
  enrichedMission: "kastiz-one-enriched-mission",
  executionState: "kastiz-one-execution-state"
};

const missionName = document.getElementById("missionName");
const loadingMessage = document.getElementById("loadingMessage");
const progressBar = document.getElementById("progressBar");
const loadingSteps = Array.from(document.querySelectorAll(".loading-step"));

const fallbackLanguage = normalizeInterfaceLocale(localStorage.getItem(STORAGE_KEYS.language) || navigator.language);
const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";

root.setAttribute("data-theme", savedTheme);
root.setAttribute("lang", fallbackLanguage);

const approvalMessages = {
  en: "Nothing will be booked, purchased, reserved, signed, submitted, paid for, or legally committed until you approve.",
  ko: "ì‚¬ìš©ìžê°€ ìŠ¹ì¸í•˜ê¸° ì „ì—ëŠ” ì˜ˆì•½, ê²°ì œ, êµ¬ë§¤, ì„œëª…, ì œì¶œ ë˜ëŠ” ë²•ì  ì•½ì†ì´ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.",
  es: "Nada se reserva, compra, paga, envÃ­a, firma ni comparte con un proveedor sin tu aprobaciÃ³n explÃ­cita."
};

const loadingMessages = {
  en: {
    general_mission: ["Understanding your mission...", "Finding trusted options...", "Checking live data...", "Preparing your ONE Pick...", "Turning your idea into reality..."],
    travel: ["Understanding your travel mission...", "Checking weather...", "Checking exchange rates...", "Preparing flight options...", "Preparing hotel options...", "Preparing your travel checklist..."],
    shopping: ["Understanding your shopping mission...", "Comparing products...", "Checking price options...", "Preparing best-value choices...", "Preparing your buying checklist..."],
    housing: ["Understanding your housing mission...", "Preparing area options...", "Checking budget assumptions...", "Preparing contract checklist...", "Preparing housing recommendations..."],
    legal: ["Understanding your legal mission...", "Preparing legal service options...", "Checking required documents...", "Preparing questions to ask...", "Preparing legal checklist..."],
    moving: ["Understanding your moving mission...", "Checking country information...", "Preparing visa steps...", "Preparing housing and shipping options...", "Preparing relocation checklist..."],
    business: ["Understanding your business mission...", "Preparing business setup steps...", "Checking registration requirements...", "Preparing tax and supplier options...", "Preparing business checklist..."],
    healthcare: ["Understanding your healthcare mission...", "Preparing clinic and hospital options...", "Preparing appointment steps...", "Checking document needs...", "Preparing healthcare checklist..."],
    finance: ["Understanding your finance mission...", "Preparing loan and rate options...", "Checking required documents...", "Preparing risk notes...", "Preparing finance checklist..."],
    career: ["Understanding your career mission...", "Preparing job targets...", "Preparing resume steps...", "Preparing interview plan...", "Preparing career checklist..."],
    tutoring: ["Understanding the learner's goal...", "Comparing tutor profiles...", "Checking format and schedule...", "Preparing lesson options...", "Preparing a trial-lesson checklist..."],
    childcare: ["Understanding the care requirements...", "Preparing trust and safety checks...", "Comparing caregiver preferences...", "Preparing schedule and budget options...", "Preparing the childcare checklist..."],
    language_exchange: ["Understanding your language goal...", "Matching level and interests...", "Comparing online and local formats...", "Preparing conversation options...", "Preparing a safe first-meeting checklist..."],
    lifestyle: ["Understanding your lifestyle mission...", "Preparing vendors...", "Preparing timeline...", "Preparing budget options...", "Preparing reservation checklist..."]
  },
  ko: {
    general_mission: ["ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ì‹ ë¢°í•  ìˆ˜ ìžˆëŠ” ì„ íƒì§€ë¥¼ ì°¾ê³  ìžˆì–´ìš”...", "ì‹¤ì‹œê°„ ë°ì´í„°ë¥¼ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ONE Pickì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ë‹¹ì‹ ì˜ ì•„ì´ë””ì–´ë¥¼ í˜„ì‹¤ë¡œ ë§Œë“¤ê³  ìžˆì–´ìš”..."],
    travel: ["ì—¬í–‰ ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ë‚ ì”¨ë¥¼ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "í™˜ìœ¨ì„ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "í•­ê³µê¶Œ ì˜µì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ìˆ™ì†Œ ì˜µì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì—¬í–‰ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    shopping: ["ì‡¼í•‘ ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ì œí’ˆì„ ë¹„êµí•˜ê³  ìžˆì–´ìš”...", "ê°€ê²© ì˜µì…˜ì„ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ê°€ì„±ë¹„ ì¢‹ì€ ì„ íƒì§€ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "êµ¬ë§¤ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    housing: ["ì£¼ê±° ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ì§€ì—­ í›„ë³´ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì˜ˆì‚° ê°€ì •ì„ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ê³„ì•½ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì£¼ê±° ì¶”ì²œ ê²°ê³¼ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    legal: ["ë²•ë¥  ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ë²•ë¥  ì„œë¹„ìŠ¤ ì˜µì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "í•„ìš” ì„œë¥˜ë¥¼ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ìƒë‹´ ì§ˆë¬¸ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ë²•ë¥  ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    moving: ["ì´ì£¼ ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "êµ­ê°€ ì •ë³´ë¥¼ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ë¹„ìž ë‹¨ê³„ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì£¼ê±°ì™€ ë°°ì†¡ ì˜µì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì´ì£¼ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    business: ["ì‚¬ì—… ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ì‚¬ì—… ì‹œìž‘ ë‹¨ê³„ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ë“±ë¡ ìš”ê±´ì„ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ì„¸ê¸ˆê³¼ ê³µê¸‰ì—…ì²´ ì˜µì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì‚¬ì—… ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    healthcare: ["ì˜ë£Œ ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ë³‘ì›ê³¼ í´ë¦¬ë‹‰ ì˜µì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì˜ˆì•½ ë‹¨ê³„ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "í•„ìš” ì„œë¥˜ë¥¼ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ì˜ë£Œ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    finance: ["ê¸ˆìœµ ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ëŒ€ì¶œê³¼ ê¸ˆë¦¬ ì˜µì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "í•„ìš” ì„œë¥˜ë¥¼ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ë¦¬ìŠ¤í¬ë¥¼ ì •ë¦¬í•˜ê³  ìžˆì–´ìš”...", "ê¸ˆìœµ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    career: ["ì»¤ë¦¬ì–´ ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ì±„ìš© ëª©í‘œë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì´ë ¥ì„œ ë‹¨ê³„ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ë©´ì ‘ ê³„íšì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì»¤ë¦¬ì–´ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    tutoring: ["í•™ìŠµ ëª©í‘œë¥¼ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "íŠœí„° í›„ë³´ë¥¼ ë¹„êµí•˜ê³  ìžˆì–´ìš”...", "ìˆ˜ì—… ë°©ì‹ê³¼ ì¼ì •ì„ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ìˆ˜ì—… ì„ íƒì§€ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì²´í—˜ ìˆ˜ì—… ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    childcare: ["ëŒë´„ ì¡°ê±´ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ì‹ ë¢°ì™€ ì•ˆì „ í™•ì¸ í•­ëª©ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ëŒë´„ ì œê³µìž ì¡°ê±´ì„ ë¹„êµí•˜ê³  ìžˆì–´ìš”...", "ì¼ì •ê³¼ ì˜ˆì‚° ì„ íƒì§€ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì•„ì´ ëŒë´„ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    language_exchange: ["ì–¸ì–´ ëª©í‘œë¥¼ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ìˆ˜ì¤€ê³¼ ê´€ì‹¬ì‚¬ë¥¼ ë§žì¶”ê³  ìžˆì–´ìš”...", "ì˜¨ë¼ì¸ê³¼ í˜„ì§€ ë°©ì‹ì„ ë¹„êµí•˜ê³  ìžˆì–´ìš”...", "ëŒ€í™” íŒŒíŠ¸ë„ˆ ì„ íƒì§€ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì•ˆì „í•œ ì²« ë§Œë‚¨ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."],
    lifestyle: ["ë¼ì´í”„ìŠ¤íƒ€ì¼ ë¯¸ì…˜ì„ ì´í•´í•˜ê³  ìžˆì–´ìš”...", "ì—…ì²´ í›„ë³´ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì¼ì •ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì˜ˆì‚° ì˜µì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ì˜ˆì•½ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”..."]
  }
};

loadingMessages.es = Object.fromEntries(Object.keys(loadingMessages.en).map(key => [key, ["Entendiendo tu misiÃ³n...", "Revisando informaciÃ³n disponible...", "Comparando opciones...", "Preparando ONE Pick...", "Organizando tu misiÃ³n..."]]));

const fallbackProvider = (provider, category, message, error = null) => ({
  provider,
  category,
  sourceStatus: "fallback_demo",
  liveData: false,
  retrievedAt: new Date().toISOString(),
  requiresKey: false,
  requiresPartnerAccess: false,
  items: [{ label: category, value: message }],
  error
});

const prototypeNotice = (language) => language === "ko"
  ? "í”„ë¡œí† íƒ€ìž… ì˜ˆìƒ ì •ë³´ìž…ë‹ˆë‹¤. ì‹¤ì œ ê°€ê²©ê³¼ ì´ìš© ê°€ëŠ¥ ì—¬ë¶€ëŠ” ìŠ¹ì¸ ì „ ë‹¤ì‹œ í™•ì¸ë©ë‹ˆë‹¤."
  : "Prototype estimate. Price and availability are checked again before approval.";

const getStoredMission = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEYS.mission));
  } catch {
    return null;
  }
};

const saveMission = (mission) => {
  sessionStorage.setItem(STORAGE_KEYS.enrichedMission, JSON.stringify(mission));
  sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(mission));
  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(mission));

  if (mission.type === "travel") {
    sessionStorage.setItem(STORAGE_KEYS.travelMission, JSON.stringify(mission));
  }
};

const updateLoadingMessage = (message, progress, activeStepIndex) => {
  if (loadingMessage) loadingMessage.textContent = message;
  // Progress is communicated by completed preparation steps, never a fake percentage.

  loadingSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === activeStepIndex);
    step.classList.toggle("is-complete", index < activeStepIndex);
  });
};

const loadingUi = {
  en: {
    title: "ONE is preparing your mission...",
    steps: ["Understanding your goal", "Collecting live information", "Comparing available options", "Organizing your mission", "Almost ready"]
  },
  ko: {
    title: "ONEì´ ë¯¸ì…˜ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...",
    steps: ["ëª©í‘œ ì´í•´í•˜ê¸°", "ì‹¤ì‹œê°„ ì •ë³´ ìˆ˜ì§‘í•˜ê¸°", "ì„ íƒì§€ ë¹„êµí•˜ê¸°", "ë¯¸ì…˜ ì •ë¦¬í•˜ê¸°", "ê±°ì˜ ì¤€ë¹„ ì™„ë£Œ"]
  },
  es: { title: "ONE estÃ¡ preparando tu misiÃ³n...", steps: ["Entendiendo tu objetivo", "Recopilando informaciÃ³n", "Comparando opciones", "Organizando tu misiÃ³n", "Casi listo"] }
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getCoordinates = async (mission) => {
  if (mission?.destination?.latitude && mission?.destination?.longitude) {
    return { latitude: mission.destination.latitude, longitude: mission.destination.longitude };
  }

  if (mission?.countryProfile?.latitude && mission?.countryProfile?.longitude) {
    return { latitude: mission.countryProfile.latitude, longitude: mission.countryProfile.longitude };
  }

  const query = [mission?.destination?.city, mission?.countryProfile?.name || mission?.destination?.country].filter(Boolean).join(", ");
  if (query) {
    try {
      const geocoded = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=${mission?.language === "ko" ? "ko" : "en"}&format=json`, { timeout: 7000, cacheTtl: 86400000 });
      const match = geocoded?.results?.[0];
      if (Number.isFinite(Number(match?.latitude)) && Number.isFinite(Number(match?.longitude))) return { latitude: Number(match.latitude), longitude: Number(match.longitude) };
    } catch { /* Continue to the secondary geocoder. */ }
    try {
      const matches = await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, { timeout: 7000 });
      const place = Array.isArray(matches) ? matches[0] : null;
      if (place?.lat && place?.lon) return { latitude: Number(place.lat), longitude: Number(place.lon) };
    } catch { /* Continue to safe fallback. */ }
  }
  if (mission?.destination?.city === "Tokyo") return { latitude: 35.6762, longitude: 139.6503 };
  if (mission?.destination?.city === "Seoul") return { latitude: 37.5665, longitude: 126.978 };
  return null;
};

const fetchWeather = async (mission) => {
  const coordinates = await getCoordinates(mission);
  if (!coordinates) return fallbackProvider("Open-Meteo", "weather", "Weather requires a verified destination location; no other city was substituted.");
  const { latitude, longitude } = coordinates;
  const schedule = mission?.schedule;
  const scheduledDays = schedule?.startDate && schedule?.endDate
    ? Math.max(1, Math.round((new Date(`${schedule.endDate}T00:00:00`) - new Date(`${schedule.startDate}T00:00:00`)) / 86400000) + 1)
    : 6;
  const dateQuery = schedule?.startDate && schedule?.endDate ? `&start_date=${encodeURIComponent(schedule.startDate)}&end_date=${encodeURIComponent(schedule.endDate)}` : "";
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_max&timezone=auto${dateQuery}`;

  try {
    const data = await fetchJson(url);
    const items = data?.daily?.time?.slice(0, Math.min(scheduledDays, 16)).map((date, index) => ({
      label: date,
      value: `${Math.round(data.daily.temperature_2m_min[index])}Â°C ~ ${Math.round(data.daily.temperature_2m_max[index])}Â°C`,
      precipitation: `${data.daily.precipitation_probability_max[index] ?? 0}%`,
      humidity: `${data.daily.relative_humidity_2m_max?.[index] ?? "â€”"}%`
    })) || [];

    return { provider: "Open-Meteo", category: "weather", sourceStatus: "free_live_api", liveData: true, requiresKey: false, requiresPartnerAccess: false, items, error: null };
  } catch (error) {
    return fallbackProvider("Open-Meteo", "weather", "Weather provider is ready. Live data may be checked again before final execution.", error.message);
  }
};

const fetchCurrency = async (mission) => {
  const from = mission?.budget?.currency || "KRW";
  const to = mission?.countryProfile?.currency || mission?.exchangeRate?.to || "USD";

  if (from === to) {
    return { provider: "Frankfurter", category: "currency", sourceStatus: "free_live_api", liveData: true, requiresKey: false, requiresPartnerAccess: false, items: [{ label: `${from} â†’ ${to}`, value: "Same currency" }], error: null };
  }

  try {
    const [data, usdData] = await Promise.all([
      fetchJson(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`, { timeout: 7000 }),
      from === "USD" ? Promise.resolve({ rate: 1 }) : fetchJson(`https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/USD`, { timeout: 7000 })
    ]);
    const rate = Number(data?.rate);
    const usdRate = Number(usdData?.rate);

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Rate unavailable");
    }

    return { provider: "Frankfurter", category: "currency", sourceStatus: "free_live_api", liveData: true, requiresKey: false, requiresPartnerAccess: false, items: [
      { label: `${from} â†’ ${to}`, value: String(rate), from, to, rate },
      { label: `${from} â†’ USD`, value: Number.isFinite(usdRate) ? String(usdRate) : "Unavailable", from, to: "USD", rate: usdRate }
    ], error: null };
  } catch (error) {
    try {
      const data = await fetchJson(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`, { timeout: 7000 });
      const rate = Number(data?.rates?.[to]);
      const usdRate = Number(data?.rates?.USD);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Fallback rate unavailable");
      return { provider: "ExchangeRate-API Open Access", category: "currency", sourceStatus: "free_live_api", liveData: true, requiresKey: false, requiresPartnerAccess: false, items: [
        { label: `${from} â†’ ${to}`, value: String(rate), from, to, rate },
        { label: `${from} â†’ USD`, value: Number.isFinite(usdRate) ? String(usdRate) : "Unavailable", from, to: "USD", rate: usdRate }
      ], error: null };
    } catch (fallbackError) {
      return fallbackProvider("Currency providers", "currency", "Live exchange rate is unavailable and must be checked before approval.", `${error.message}; ${fallbackError.message}`);
    }
  }
};

const fetchCountryInfo = async (mission) => {
  const countryCode = mission?.country || mission?.destination?.code;
  const countryName = mission?.countryProfile?.name || mission?.destination?.country;

  if (!countryCode && !countryName) return fallbackProvider("CountriesNow", "country", "Country profile adapter is ready.");

  try {
    const query = encodeURIComponent(countryName || countryCode);
    const [capitalPayload, currencyPayload, positionPayload] = await Promise.all([
      fetchJson(`https://countriesnow.space/api/v0.1/countries/capital/q?country=${query}`, { timeout: 7000 }),
      fetchJson(`https://countriesnow.space/api/v0.1/countries/currency/q?country=${query}`, { timeout: 7000 }),
      fetchJson(`https://countriesnow.space/api/v0.1/countries/positions/q?country=${query}`, { timeout: 7000 })
    ]);
    const country = capitalPayload?.data;
    const currency = currencyPayload?.data?.currency;
    const position = positionPayload?.data;

    return {
      provider: "CountriesNow",
      category: "country",
      sourceStatus: "free_live_api",
      liveData: Boolean(country),
      requiresKey: false,
      requiresPartnerAccess: false,
      items: country ? [
        { label: "Country", value: country.name || countryName || countryCode },
        { label: "Capital", value: country.capital || "Unknown" },
        { label: "Currency", value: currency || "Unknown" },
        { label: "Position", value: position ? `${position.lat}, ${position.long}` : "Unknown" }
      ] : [],
      error: null
    };
  } catch (error) {
    return fallbackProvider("CountriesNow", "country", "Country profile adapter is ready.", error.message);
  }
};

const fetchMapInfo = async (mission) => {
  const query = [mission?.destination?.city || mission?.countryProfile?.capital, mission?.countryProfile?.name || mission?.destination?.country].filter(Boolean).join(", ") || mission?.rawInput || "";

  if (!query) return fallbackProvider("OpenStreetMap Nominatim", "maps", "Map provider interface is ready.");

  try {
    const data = await fetchJson(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`);

    return {
      provider: "OpenStreetMap Nominatim",
      category: "maps",
      sourceStatus: "free_live_api",
      liveData: Array.isArray(data) && data.length > 0,
      requiresKey: false,
      requiresPartnerAccess: false,
      items: Array.isArray(data) ? data.slice(0, 3).map((item) => ({
        label: item.display_name?.split(",").slice(0, 2).join(",") || query,
        value: `${item.lat}, ${item.lon}`
      })) : [],
      error: null
    };
  } catch (error) {
    return fallbackProvider("OpenStreetMap Nominatim", "maps", "Map provider interface is ready.", error.message);
  }
};

const fetchLocalPlaces = async (mission) => {
  const city = mission?.destination?.city || mission?.countryProfile?.capital || "";
  const country = mission?.countryProfile?.name || mission?.destination?.country || "";
  if (!city) return fallbackProvider("OpenStreetMap", "local_places", "Local place search requires a destination city.");
  try {
    const coordinates = await getCoordinates(mission);
    if (!coordinates) return fallbackProvider("OpenStreetMap", "local_places", "Destination coordinates could not be verified; no places from another city were substituted.");
    const { latitude, longitude } = coordinates;
    const geographicScope = createGeographicScope(mission, coordinates);
    const placeQueries = [
      `[out:json][timeout:12];nwr(around:3500,${latitude},${longitude})[amenity~"restaurant|cafe|fast_food"][name];out center 30;`,
      `[out:json][timeout:12];nwr(around:6000,${latitude},${longitude})[tourism~"hotel|hostel|guest_house|motel|apartment"][name];out center 20;`
    ];
    const placeEndpoints = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
    const elements = [];
    for (const [index, query] of placeQueries.entries()) {
      for (let attempt = 0; attempt < placeEndpoints.length; attempt += 1) {
        try {
          const endpoint = placeEndpoints[(index + attempt) % placeEndpoints.length];
          const response = await fetchJson(`${endpoint}?data=${encodeURIComponent(query)}`, { timeout: 14000, retries: 0, cacheTtl: 86400000 });
          const matches = response?.elements || [];
          if (matches.length) { elements.push(...matches); break; }
        } catch { /* Try the alternate public instance for this category. */ }
      }
    }
    const seen = new Set();
    const normalize = (entry) => {
      const tags = entry.tags || {};
      const kind = tags.tourism ? "hotel" : tags.amenity && /restaurant|cafe|fast_food/.test(tags.amenity) ? "restaurant" : "transport";
      const name = tags[mission.language === "ko" ? "name:ko" : "name:en"] || tags.name;
      return stampGeographicEvidence({ label: name, value: tags.tourism || tags.amenity || tags.public_transport || "place", kind, cuisine: tags.cuisine || "", stars: tags.stars || "", source: "OpenStreetMap" }, geographicScope, { latitude: entry.lat || entry.center?.lat, longitude: entry.lon || entry.center?.lon });
    };
    const items = elements.map(normalize).filter((item) => item.label && !seen.has(`${item.kind}:${item.label.toLowerCase()}`) && seen.add(`${item.kind}:${item.label.toLowerCase()}`));
    if (items.filter((item) => item.kind === "restaurant").length < 4) {
      const viewbox = `${longitude - .12},${latitude + .12},${longitude + .12},${latitude - .12}`;
      const restaurantSearch = await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&extratags=1&bounded=1&viewbox=${encodeURIComponent(viewbox)}&limit=12&q=restaurant`, { timeout: 10000, retries: 0, cacheTtl: 86400000 }).catch(() => []);
      (Array.isArray(restaurantSearch) ? restaurantSearch : []).forEach((place) => {
        const label = place.namedetails?.[mission.language === "ko" ? "name:ko" : "name:en"] || place.namedetails?.name || String(place.display_name || "").split(",")[0].trim();
        const key = `restaurant:${String(label).toLowerCase()}`;
        if (!label || /^(restaurant|restaurants|cafe)$/i.test(label) || seen.has(key)) return;
        seen.add(key);
        items.push(stampGeographicEvidence({ label, value: place.type || "restaurant", kind: "restaurant", cuisine: place.extratags?.cuisine || "", stars: "", source: "OpenStreetMap Nominatim" }, geographicScope, { latitude: place.lat, longitude: place.lon }));
      });
    }
    if (items.filter((item) => item.kind === "hotel").length < 5) {
      const viewbox = `${longitude - .16},${latitude + .16},${longitude + .16},${latitude - .16}`;
      const accommodationSearch = await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&extratags=1&bounded=1&viewbox=${encodeURIComponent(viewbox)}&limit=15&q=hotel`, { timeout: 10000, retries: 0, cacheTtl: 86400000 }).catch(() => []);
      (Array.isArray(accommodationSearch) ? accommodationSearch : []).forEach((place) => {
        const label = place.namedetails?.[mission.language === "ko" ? "name:ko" : "name:en"] || place.namedetails?.name || String(place.display_name || "").split(",")[0].trim();
        const key = `hotel:${String(label).toLowerCase()}`;
        if (!label || /^(hotel|hotels|accommodation|accommodations)$/i.test(label) || seen.has(key)) return;
        seen.add(key);
        items.push(stampGeographicEvidence({ label, value: place.type || "hotel", kind: "hotel", cuisine: "", stars: place.extratags?.stars || "", source: "OpenStreetMap Nominatim" }, geographicScope, { latitude: place.lat, longitude: place.lon }));
      });
    }
    const scopedItems = enforceGeographicScope(items, geographicScope);
    return { provider: "OpenStreetMap Overpass", category: "local_places", sourceStatus: "free_live_api", liveData: scopedItems.length > 0, requiresKey: false, requiresPartnerAccess: false, items: scopedItems, geographicScope, attribution: "Â© OpenStreetMap contributors", error: null };
  } catch (error) {
    return fallbackProvider("OpenStreetMap Overpass", "local_places", "Public hotel, restaurant and transport names could not be loaded; prototype fallbacks are shown.", error.message);
  }
};

const fetchWikipediaInfo = async (mission) => {
  const topic = mission?.destination?.city || mission?.countryProfile?.capital || mission?.countryProfile?.name || mission?.rawInput || "";

  if (!topic) return fallbackProvider("Wikipedia", "destination_info", "Public knowledge adapter is ready.");

  try {
    const wikiLanguage = mission?.language === "ko" ? "ko" : "en";
    const data = await fetchJson(`https://${wikiLanguage}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);

    return {
      provider: "Wikipedia",
      category: "destination_info",
      sourceStatus: "free_live_api",
      liveData: Boolean(data?.extract),
      requiresKey: false,
      requiresPartnerAccess: false,
      items: [{ label: data?.title || topic, value: data?.extract || "Public information unavailable" }],
      error: null
    };
  } catch (error) {
    return fallbackProvider("Wikipedia", "destination_info", "Public knowledge adapter is ready.", error.message);
  }
};

const govUkCountrySlug = (country = "") => {
  const aliases = { "United States": "usa", "South Korea": "south-korea", "North Korea": "north-korea", "Czech Republic": "czechia", "CÃ´te d'Ivoire": "ivory-coast", "Democratic Republic of the Congo": "democratic-republic-of-the-congo", "Republic of the Congo": "republic-of-the-congo" };
  return aliases[country] || String(country).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
};

const fetchOfficialTravelAdvice = async (mission) => {
  const country = mission?.countryProfile?.name || mission?.destination?.country || "";
  if (!country) return fallbackProvider("GOV.UK Foreign Travel Advice", "travel_advisory", "Select a destination to check official advice.");
  const slug = govUkCountrySlug(country);
  try {
    const data = await fetchJson(`https://www.gov.uk/api/content/foreign-travel-advice/${encodeURIComponent(slug)}`, { timeout: 7000, cacheTtl: 3600000 });
    return {
      provider: "GOV.UK Foreign Travel Advice",
      category: "travel_advisory",
      sourceStatus: "free_live_api",
      liveData: Boolean(data?.title),
      requiresKey: false,
      requiresPartnerAccess: false,
      items: [{ label: data?.title || `${country} travel advice`, value: data?.description || "Official entry, safety and local-law information", url: `https://www.gov.uk${data?.base_path || `/foreign-travel-advice/${slug}`}`, updatedAt: data?.public_updated_at || data?.updated_at || "" }],
      attribution: "UK Foreign, Commonwealth & Development Office Â· Open Government Licence",
      error: null
    };
  } catch (error) {
    return { ...fallbackProvider("GOV.UK Foreign Travel Advice", "travel_advisory", "Open the official country advice before travel.", error.message), items: [{ label: `${country} official travel advice`, value: "Official guidance", url: `https://www.gov.uk/foreign-travel-advice/${slug}` }] };
  }
};

const buildTravelResourceLinks = (mission) => {
  const ko = mission?.language === "ko";
  const city = mission?.destination?.city || mission?.countryProfile?.capital || "";
  const country = mission?.countryProfile?.name || mission?.destination?.country || "";
  const destination = [city, country].filter(Boolean).join(", ");
  const query = encodeURIComponent(destination || "international travel");
  const countryCode = String(mission?.countryProfile?.code || mission?.destination?.countryCode || "").toUpperCase();
  const isKorea = countryCode === "KR" || /Korea|ëŒ€í•œë¯¼êµ­|í•œêµ­/i.test(country);
  const koreaResources = isKorea ? [
    { label: ko ? `${destination} 네이버 지도·대중교통` : `${destination} Naver Map and public transit`, value: ko ? "버스·지하철·도보 경로" : "Bus, subway and walking routes", url: `https://map.naver.com/p/search/${encodeURIComponent(destination)}` },
    { label: ko ? `${destination} 식당 예약 찾기` : `Find restaurant reservations in ${destination}`, value: ko ? "네이버 예약 검색 · 외부 서비스" : "Naver booking search · external service", url: `https://search.naver.com/search.naver?query=${encodeURIComponent(`${destination} 식당 네이버 예약`)}` },
    { label: ko ? `${destination} 미용실·서비스 예약 찾기` : `Find salons and services in ${destination}`, value: ko ? "네이버 예약 검색 · 외부 서비스" : "Naver booking search · external service", url: `https://search.naver.com/search.naver?query=${encodeURIComponent(`${destination} 미용실 서비스 네이버 예약`)}` }
  ] : [];
  return {
    provider: "ONE Public Travel Resources",
    category: "travel_resources",
    sourceStatus: "free_public_links",
    liveData: true,
    requiresKey: false,
    requiresPartnerAccess: false,
    items: [
      { label: ko ? `${destination} ì—¬í–‰ ê°€ì´ë“œ ì˜ìƒ` : `${destination} travel guide videos`, value: "YouTube", url: `https://www.youtube.com/results?search_query=${query}+travel+guide+things+to+know` },
      { label: ko ? `${destination} ì¶œêµ­ ì „ ì•Œì•„ë‘˜ ì ` : `Things to know before visiting ${destination}`, value: "YouTube", url: `https://www.youtube.com/results?search_query=${query}+before+you+go+local+tips` },
      { label: ko ? "ë¯¸êµ­ êµ­ë¬´ë¶€ ì—¬í–‰ê²½ë³´" : "U.S. State Department travel advisories", value: ko ? "ê³µì‹ ì—¬í–‰ê²½ë³´ ëª©ë¡" : "Official advisory directory", url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/" },
      { label: ko ? "ëŒ€í•œë¯¼êµ­ ìž¬ì™¸ê³µê´€" : "Korean embassies and consulates", value: ko ? "ì™¸êµë¶€ ìž¬ì™¸ê³µê´€ ëª©ë¡" : "Official overseas missions directory", url: "https://overseas.mofa.go.kr/" },
      { label: ko ? `${destination} ì§€í•˜ì² Â·ëŒ€ì¤‘êµí†µ ì§€ë„` : `${destination} subway and transit map`, value: "OpenStreetMap", url: `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${destination} subway station`)}` },
      ...koreaResources
    ],
    error: null
  };
};

const buildLearningResourceLinks = (mission) => {
  const ko = mission?.language === "ko";
  const subject = mission?.details?.subject || mission?.rawInput || "English learning";
  const query = encodeURIComponent(subject);
  return {
    provider: "ONE Learning Resources",
    category: "learning_resources",
    sourceStatus: "free_public_links",
    liveData: true,
    requiresKey: false,
    requiresPartnerAccess: false,
    items: [
      { label: ko ? "British Council ë¬´ë£Œ ì˜ì–´ í•™ìŠµ ìžë£Œ" : "British Council free English resources", value: ko ? "ê³µì‹ í•™ìŠµ ìžë£Œ" : "Official learning resources", url: "https://learnenglish.britishcouncil.org/" },
      { label: ko ? `${subject} ì¶”ì²œ í•™ìŠµ ì˜ìƒ` : `Recommended ${subject} learning videos`, value: "YouTube", url: `https://www.youtube.com/results?search_query=${query}+lesson+tutorial` },
      { label: "Duolingo", value: ko ? "ê³µì‹ í•™ìŠµ ì„œë¹„ìŠ¤" : "Official learning service", url: "https://www.duolingo.com/" },
      { label: "HelloTalk", value: ko ? "ì–¸ì–´êµí™˜ ì„œë¹„ìŠ¤ Â· ì™¸ë¶€ ì•±" : "Language exchange service Â· external app", url: "https://www.hellotalk.com/" }
    ],
    error: null
  };
};

const buildPrototypeProviderResults = (mission) => {
  const providers = Array.isArray(mission.providers) ? mission.providers : [];

  return providers
    .filter((provider) => provider.sourceStatus === "prototype_adapter")
    .map((provider) => ({
      provider: provider.provider,
      category: provider.category,
      sourceStatus: "prototype_adapter",
      liveData: false,
      requiresKey: provider.requiresKey,
      requiresPartnerAccess: provider.requiresPartnerAccess,
      items: [{
        label: provider.category,
        value: prototypeNotice(mission.language)
      }],
      error: null
    }));
};

const enrichMission = async (mission) => {
  const type = mission.type || "general_mission";
  const providerRequests = [];

  if (type === "travel") {
    providerRequests.push(
      () => fetchWeather(mission),
      () => fetchCurrency(mission),
      () => fetchCountryInfo(mission),
      () => fetchMapInfo(mission),
      () => fetchLocalPlaces(mission),
      () => fetchOfficialTravelAdvice(mission),
      () => Promise.resolve(buildTravelResourceLinks(mission))
    );
  }

  if (type === "tutoring" || type === "language_exchange") {
    providerRequests.push(() => Promise.resolve(buildLearningResourceLinks(mission)));
  }

  if (type === "moving") {
    providerRequests.push(() => fetchCountryInfo(mission), () => fetchMapInfo(mission));
  }

  if (type === "housing" || type === "healthcare" || type === "lifestyle") {
    providerRequests.push(() => fetchMapInfo(mission));
  }

  if (type === "finance") {
    providerRequests.push(() => fetchCurrency(mission));
  }

  // Every mission can benefit from free public background knowledge.
  providerRequests.push(() => fetchWikipediaInfo(mission));

  const providerResults = await Promise.all(providerRequests.map((request) => request()));

  const fallbackPlan = placeFallbackPlan({
    DESTINATION_SPECIFIC_DATA: providerResults.some((result) => result?.items?.length && result.sourceStatus !== "fallback_demo"),
    COUNTRY_LEVEL_DATA: providerResults.some((result) => result?.category === "country" && result?.items?.length),
    REGIONAL_RECOMMENDATIONS: Boolean(mission?.destination?.continent),
    INTELLIGENT_WEB_SEARCH: true,
    AI_REASONING: true
  });
  providerResults.forEach((result) => {
    if (!result || (Array.isArray(result.items) && result.items.length)) return;
    result.items = [{
      label: mission.language === "ko" ? "ëª©ì ì§€ ê¸°ë°˜ ëŒ€ì•ˆ" : mission.language === "es" ? "Alternativa basada en el destino" : "Destination-based alternative",
      value: mission.language === "ko" ? "ONEì´ êµ­ê°€Â·ì§€ì—­ ì •ë³´ì™€ ê³µê°œ ê²€ìƒ‰ì„ ì‚¬ìš©í•´ ìœ ìš©í•œ ëŒ€ì•ˆì„ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤." : mission.language === "es" ? "ONE preparÃ³ una alternativa Ãºtil con datos del paÃ­s, la regiÃ³n y bÃºsqueda pÃºblica." : "ONE prepared a useful alternative using country, regional and public-search context."
    }];
    result.sourceStatus ||= "fallback_demo";
  });

  providerResults.push(...buildPrototypeProviderResults(mission));

  return {
    ...mission,
    status: "mission_ready",
    providerResults,
    placeIntelligence: { fallback: fallbackPlan, blankResultsAllowed: false },
    providersUsed: providerResults.map((result) => ({
      provider: result.provider,
      category: result.category,
      sourceStatus: result.sourceStatus,
      liveData: result.liveData,
      requiresKey: result.requiresKey,
      requiresPartnerAccess: result.requiresPartnerAccess
    })),
    approvalProtection: {
      required: true,
      message: mission.language === "ko" ? approvalMessages.ko : approvalMessages.en
    },
    updatedAt: new Date().toISOString()
  };
};

const runLoadingSequence = async () => {
  const mission = getStoredMission();

  if (!mission) {
    window.location.href = "index.html";
    return;
  }

  const language = normalizeInterfaceLocale(mission.interfaceLocale || mission.language || fallbackLanguage);
  trackEvent("loading_started", { mission_type: mission.type, language, page: "loading" });
  const messages = loadingMessages[language][mission.type] || loadingMessages[language].general_mission;
  const subtext = language === "ko" ? approvalMessages.ko : approvalMessages.en;

  const loadingTitle = document.getElementById("loadingTitle");
  if (loadingTitle) loadingTitle.textContent = loadingUi[language].title;
  document.title = language === "ko" ? "Kastiz ONE â€” ë¯¸ì…˜ ì¤€ë¹„ ì¤‘" : language === "es" ? "Kastiz ONE â€” Preparando misiÃ³n" : "Kastiz ONE â€” Preparing Mission";
  loadingSteps.forEach((step, index) => {
    const label = step.querySelector("strong");
    if (label) label.textContent = loadingUi[language].steps[index] || "";
  });

  if (missionName) {
    missionName.textContent = mission.rawInput || mission.title || mission.mission || subtext;
  }

  for (let index = 0; index < messages.length; index += 1) {
    const progress = Math.round(((index + 1) / (messages.length + 1)) * 82);
    const activeStepIndex = Math.min(index, loadingSteps.length - 1);
    updateLoadingMessage(messages[index], progress, activeStepIndex);
    await wait(index === 0 ? 720 : 620);
  }

  let enrichedMission;
  try {
    enrichedMission = await Promise.race([
      enrichMission(mission),
      wait(18000).then(() => ({
        ...mission,
        status: "mission_ready",
        providerResults: [fallbackProvider("ONE Safe Loader", "fallback", language === "ko" ? "제공업체 응답이 늦어 기본 미션 결과를 먼저 준비했습니다." : language === "es" ? "Un proveedor tardó demasiado; ONE preparó primero un resultado seguro." : "A provider took too long, so ONE prepared a safe result first.", "loading_timeout")],
        placeIntelligence: { fallback: { AI_REASONING: true }, blankResultsAllowed: false },
        approvalProtection: { required: true, message: language === "ko" ? approvalMessages.ko : language === "es" ? approvalMessages.es : approvalMessages.en },
        updatedAt: new Date().toISOString()
      }))
    ]);
  } catch (error) {
    enrichedMission = {
      ...mission,
      status: "mission_ready",
      providerResults: [fallbackProvider("ONE Safe Loader", "fallback", language === "ko" ? "언어 또는 제공업체 오류가 있었지만 빈 결과 대신 안전한 기본 결과를 준비했습니다." : language === "es" ? "Hubo un error de idioma o proveedor; ONE preparó un resultado seguro en vez de una página vacía." : "A language or provider error occurred; ONE prepared a safe result instead of a blank page.", error?.message || "loading_error")],
      placeIntelligence: { fallback: { AI_REASONING: true }, blankResultsAllowed: false },
      approvalProtection: { required: true, message: language === "ko" ? approvalMessages.ko : language === "es" ? approvalMessages.es : approvalMessages.en },
      updatedAt: new Date().toISOString()
    };
  }
  (enrichedMission.providerResults || []).filter(Boolean).forEach((provider) => {
    const status = provider.sourceStatus || "unknown";
    trackEvent("provider_request_started", { mission_type: enrichedMission.type, mission_subtype: provider.category, language, page: "loading", source_status: status });
    trackEvent(status === "fallback_demo" ? "provider_fallback_used" : provider.error ? "provider_request_failed" : "provider_request_succeeded", {
      mission_type: enrichedMission.type,
      mission_subtype: provider.category,
      language,
      page: "loading",
      source_status: status,
      success: !provider.error,
      error_code: provider.error ? "provider_unavailable" : undefined
    });
  });

  updateLoadingMessage(language === "ko" ? "ë¯¸ì…˜ ì¤€ë¹„ê°€ ì™„ë£Œë˜ì—ˆìŠµë‹ˆë‹¤..." : "Mission ready...", 100, loadingSteps.length);
  saveMission(enrichedMission);
  trackEvent("loading_complete", { mission_type: enrichedMission.type, language, page: "loading", schedule_used: Boolean(enrichedMission.schedule?.startDate && enrichedMission.schedule?.endDate) });

  await wait(620);

  body.classList.add("is-transitioning");

  window.setTimeout(() => {
    window.location.href = "results.html?v=20260713-38";
  }, 360);
};

window.addEventListener("pageshow", () => {
  body.classList.remove("is-transitioning");
});

runLoadingSequence();


