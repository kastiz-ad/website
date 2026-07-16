import { fetchJson } from "../engine/providers.js?v=20260711-1";
import { trackEvent } from "../analytics.js";

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

const fallbackLanguage = localStorage.getItem(STORAGE_KEYS.language) || "en";
const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";

root.setAttribute("data-theme", savedTheme);
root.setAttribute("lang", fallbackLanguage);

const approvalMessages = {
  en: "Nothing will be booked, purchased, reserved, signed, submitted, paid for, or legally committed until you approve.",
  ko: "사용자가 승인하기 전에는 예약, 결제, 구매, 서명, 제출 또는 법적 약속이 진행되지 않습니다."
};

const loadingMessages = {
  en: {
    general_mission: ["Understanding your mission...", "Finding trusted options...", "Checking live data...", "Preparing recommendations...", "Turning your idea into reality..."],
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
    general_mission: ["미션을 이해하고 있어요...", "신뢰할 수 있는 선택지를 찾고 있어요...", "실시간 데이터를 확인하고 있어요...", "추천 결과를 준비하고 있어요...", "당신의 아이디어를 현실로 만들고 있어요..."],
    travel: ["여행 미션을 이해하고 있어요...", "날씨를 확인하고 있어요...", "환율을 확인하고 있어요...", "항공권 옵션을 준비하고 있어요...", "숙소 옵션을 준비하고 있어요...", "여행 체크리스트를 준비하고 있어요..."],
    shopping: ["쇼핑 미션을 이해하고 있어요...", "제품을 비교하고 있어요...", "가격 옵션을 확인하고 있어요...", "가성비 좋은 선택지를 준비하고 있어요...", "구매 체크리스트를 준비하고 있어요..."],
    housing: ["주거 미션을 이해하고 있어요...", "지역 후보를 준비하고 있어요...", "예산 가정을 확인하고 있어요...", "계약 체크리스트를 준비하고 있어요...", "주거 추천 결과를 준비하고 있어요..."],
    legal: ["법률 미션을 이해하고 있어요...", "법률 서비스 옵션을 준비하고 있어요...", "필요 서류를 확인하고 있어요...", "상담 질문을 준비하고 있어요...", "법률 체크리스트를 준비하고 있어요..."],
    moving: ["이주 미션을 이해하고 있어요...", "국가 정보를 확인하고 있어요...", "비자 단계를 준비하고 있어요...", "주거와 배송 옵션을 준비하고 있어요...", "이주 체크리스트를 준비하고 있어요..."],
    business: ["사업 미션을 이해하고 있어요...", "사업 시작 단계를 준비하고 있어요...", "등록 요건을 확인하고 있어요...", "세금과 공급업체 옵션을 준비하고 있어요...", "사업 체크리스트를 준비하고 있어요..."],
    healthcare: ["의료 미션을 이해하고 있어요...", "병원과 클리닉 옵션을 준비하고 있어요...", "예약 단계를 준비하고 있어요...", "필요 서류를 확인하고 있어요...", "의료 체크리스트를 준비하고 있어요..."],
    finance: ["금융 미션을 이해하고 있어요...", "대출과 금리 옵션을 준비하고 있어요...", "필요 서류를 확인하고 있어요...", "리스크를 정리하고 있어요...", "금융 체크리스트를 준비하고 있어요..."],
    career: ["커리어 미션을 이해하고 있어요...", "채용 목표를 준비하고 있어요...", "이력서 단계를 준비하고 있어요...", "면접 계획을 준비하고 있어요...", "커리어 체크리스트를 준비하고 있어요..."],
    tutoring: ["학습 목표를 이해하고 있어요...", "튜터 후보를 비교하고 있어요...", "수업 방식과 일정을 확인하고 있어요...", "수업 선택지를 준비하고 있어요...", "체험 수업 체크리스트를 준비하고 있어요..."],
    childcare: ["돌봄 조건을 이해하고 있어요...", "신뢰와 안전 확인 항목을 준비하고 있어요...", "돌봄 제공자 조건을 비교하고 있어요...", "일정과 예산 선택지를 준비하고 있어요...", "아이 돌봄 체크리스트를 준비하고 있어요..."],
    language_exchange: ["언어 목표를 이해하고 있어요...", "수준과 관심사를 맞추고 있어요...", "온라인과 현지 방식을 비교하고 있어요...", "대화 파트너 선택지를 준비하고 있어요...", "안전한 첫 만남 체크리스트를 준비하고 있어요..."],
    lifestyle: ["라이프스타일 미션을 이해하고 있어요...", "업체 후보를 준비하고 있어요...", "일정을 준비하고 있어요...", "예산 옵션을 준비하고 있어요...", "예약 체크리스트를 준비하고 있어요..."]
  }
};

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
  ? "프로토타입 예상 정보입니다. 실제 가격과 이용 가능 여부는 승인 전 다시 확인됩니다."
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
    title: "ONE이 미션을 준비하고 있어요...",
    steps: ["목표 이해하기", "실시간 정보 수집하기", "선택지 비교하기", "미션 정리하기", "거의 준비 완료"]
  }
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
  return { latitude: 37.5665, longitude: 126.978 };
};

const fetchWeather = async (mission) => {
  const { latitude, longitude } = await getCoordinates(mission);
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
      value: `${Math.round(data.daily.temperature_2m_min[index])}°C ~ ${Math.round(data.daily.temperature_2m_max[index])}°C`,
      precipitation: `${data.daily.precipitation_probability_max[index] ?? 0}%`,
      humidity: `${data.daily.relative_humidity_2m_max?.[index] ?? "—"}%`
    })) || [];

    return { provider: "Open-Meteo", category: "weather", sourceStatus: "free_live_api", liveData: true, requiresKey: false, requiresPartnerAccess: false, items, error: null };
  } catch (error) {
    return fallbackProvider("Open-Meteo", "weather", "Weather provider is ready. Live data may be checked again before final execution.", error.message);
  }
};

const fetchCurrency = async (mission) => {
  const from = mission?.budget?.currency || "KRW";
  const to = mission?.countryProfile?.currency || mission?.exchangeRate?.to || "JPY";

  if (from === to) {
    return { provider: "Frankfurter", category: "currency", sourceStatus: "free_live_api", liveData: true, requiresKey: false, requiresPartnerAccess: false, items: [{ label: `${from} → ${to}`, value: "Same currency" }], error: null };
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
      { label: `${from} → ${to}`, value: String(rate), from, to, rate },
      { label: `${from} → USD`, value: Number.isFinite(usdRate) ? String(usdRate) : "Unavailable", from, to: "USD", rate: usdRate }
    ], error: null };
  } catch (error) {
    try {
      const data = await fetchJson(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`, { timeout: 7000 });
      const rate = Number(data?.rates?.[to]);
      const usdRate = Number(data?.rates?.USD);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("Fallback rate unavailable");
      return { provider: "ExchangeRate-API Open Access", category: "currency", sourceStatus: "free_live_api", liveData: true, requiresKey: false, requiresPartnerAccess: false, items: [
        { label: `${from} → ${to}`, value: String(rate), from, to, rate },
        { label: `${from} → USD`, value: Number.isFinite(usdRate) ? String(usdRate) : "Unavailable", from, to: "USD", rate: usdRate }
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
    const { latitude, longitude } = await getCoordinates(mission);
    const query = `[out:json][timeout:20];(nwr(around:12000,${latitude},${longitude})[amenity~"restaurant|cafe|fast_food"];nwr(around:12000,${latitude},${longitude})[tourism~"hotel|hostel|guest_house|motel|apartment"];nwr(around:12000,${latitude},${longitude})[public_transport];);out center 160;`;
    const data = await fetchJson(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { timeout: 18000, retries: 0, cacheTtl: 86400000 });
    const seen = new Set();
    const normalize = (entry) => {
      const tags = entry.tags || {};
      const kind = tags.tourism ? "hotel" : tags.amenity && /restaurant|cafe|fast_food/.test(tags.amenity) ? "restaurant" : "transport";
      const name = tags[mission.language === "ko" ? "name:ko" : "name:en"] || tags.name;
      return { label: name, value: tags.tourism || tags.amenity || tags.public_transport || "place", kind, cuisine: tags.cuisine || "", stars: tags.stars || "", source: "OpenStreetMap" };
    };
    const items = (data?.elements || []).map(normalize).filter((item) => item.label && !seen.has(`${item.kind}:${item.label.toLowerCase()}`) && seen.add(`${item.kind}:${item.label.toLowerCase()}`));
    if (items.filter((item) => item.kind === "restaurant").length < 4) {
      const placeQuery = ["restaurants", city, country].filter(Boolean).join(" ");
      const restaurantSearch = await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&extratags=1&limit=12&q=${encodeURIComponent(placeQuery)}`, { timeout: 10000, retries: 0, cacheTtl: 86400000 }).catch(() => []);
      (Array.isArray(restaurantSearch) ? restaurantSearch : []).forEach((place) => {
        const label = place.namedetails?.[mission.language === "ko" ? "name:ko" : "name:en"] || place.namedetails?.name || String(place.display_name || "").split(",")[0].trim();
        const key = `restaurant:${String(label).toLowerCase()}`;
        if (!label || /^(restaurant|restaurants|cafe)$/i.test(label) || seen.has(key)) return;
        seen.add(key);
        items.push({ label, value: place.type || "restaurant", kind: "restaurant", cuisine: place.extratags?.cuisine || "", stars: "", source: "OpenStreetMap Nominatim" });
      });
    }
    if (items.filter((item) => item.kind === "hotel").length < 5) {
      const placeQuery = ["hotels and accommodations", city, country].filter(Boolean).join(" ");
      const accommodationSearch = await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&extratags=1&limit=15&q=${encodeURIComponent(placeQuery)}`, { timeout: 10000, retries: 0, cacheTtl: 86400000 }).catch(() => []);
      (Array.isArray(accommodationSearch) ? accommodationSearch : []).forEach((place) => {
        const label = place.namedetails?.[mission.language === "ko" ? "name:ko" : "name:en"] || place.namedetails?.name || String(place.display_name || "").split(",")[0].trim();
        const key = `hotel:${String(label).toLowerCase()}`;
        if (!label || /^(hotel|hotels|accommodation|accommodations)$/i.test(label) || seen.has(key)) return;
        seen.add(key);
        items.push({ label, value: place.type || "hotel", kind: "hotel", cuisine: "", stars: place.extratags?.stars || "", source: "OpenStreetMap Nominatim" });
      });
    }
    return { provider: "OpenStreetMap Overpass", category: "local_places", sourceStatus: "free_live_api", liveData: items.length > 0, requiresKey: false, requiresPartnerAccess: false, items, attribution: "© OpenStreetMap contributors", error: null };
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
  const aliases = { "United States": "usa", "South Korea": "south-korea", "North Korea": "north-korea", "Czech Republic": "czechia", "Côte d'Ivoire": "ivory-coast", "Democratic Republic of the Congo": "democratic-republic-of-the-congo", "Republic of the Congo": "republic-of-the-congo" };
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
      attribution: "UK Foreign, Commonwealth & Development Office · Open Government Licence",
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
  const isKorea = countryCode === "KR" || /Korea|대한민국|한국/i.test(country);
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
      { label: ko ? `${destination} 여행 가이드 영상` : `${destination} travel guide videos`, value: "YouTube", url: `https://www.youtube.com/results?search_query=${query}+travel+guide+things+to+know` },
      { label: ko ? `${destination} 출국 전 알아둘 점` : `Things to know before visiting ${destination}`, value: "YouTube", url: `https://www.youtube.com/results?search_query=${query}+before+you+go+local+tips` },
      { label: ko ? "미국 국무부 여행경보" : "U.S. State Department travel advisories", value: ko ? "공식 여행경보 목록" : "Official advisory directory", url: "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/" },
      { label: ko ? "대한민국 재외공관" : "Korean embassies and consulates", value: ko ? "외교부 재외공관 목록" : "Official overseas missions directory", url: "https://overseas.mofa.go.kr/" },
      { label: ko ? `${destination} 지하철·대중교통 지도` : `${destination} subway and transit map`, value: "OpenStreetMap", url: `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${destination} subway station`)}` },
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
      { label: ko ? "British Council 무료 영어 학습 자료" : "British Council free English resources", value: ko ? "공식 학습 자료" : "Official learning resources", url: "https://learnenglish.britishcouncil.org/" },
      { label: ko ? `${subject} 추천 학습 영상` : `Recommended ${subject} learning videos`, value: "YouTube", url: `https://www.youtube.com/results?search_query=${query}+lesson+tutorial` },
      { label: "Duolingo", value: ko ? "공식 학습 서비스" : "Official learning service", url: "https://www.duolingo.com/" },
      { label: "HelloTalk", value: ko ? "언어교환 서비스 · 외부 앱" : "Language exchange service · external app", url: "https://www.hellotalk.com/" }
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

  providerResults.push(...buildPrototypeProviderResults(mission));

  return {
    ...mission,
    status: "mission_ready",
    providerResults,
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

  const language = mission.language === "ko" ? "ko" : "en";
  trackEvent("loading_started", { mission_type: mission.type, language, page: "loading" });
  const messages = loadingMessages[language][mission.type] || loadingMessages[language].general_mission;
  const subtext = language === "ko" ? approvalMessages.ko : approvalMessages.en;

  const loadingTitle = document.getElementById("loadingTitle");
  if (loadingTitle) loadingTitle.textContent = loadingUi[language].title;
  document.title = language === "ko" ? "Kastiz ONE — 미션 준비 중" : "Kastiz ONE — Preparing Mission";
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

  const enrichedMission = await enrichMission(mission);
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

  updateLoadingMessage(language === "ko" ? "미션 준비가 완료되었습니다..." : "Mission ready...", 100, loadingSteps.length);
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


