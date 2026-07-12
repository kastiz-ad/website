import { fetchJson } from "../engine/providers.js?v=20260711-1";

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
    lifestyle: ["라이프스타일 미션을 이해하고 있어요...", "업체 후보를 준비하고 있어요...", "일정을 준비하고 있어요...", "예산 옵션을 준비하고 있어요...", "예약 체크리스트를 준비하고 있어요..."]
  }
};

const fallbackProvider = (provider, category, message, error = null) => ({
  provider,
  category,
  sourceStatus: "fallback_data",
  liveData: false,
  requiresKey: false,
  requiresPartnerAccess: false,
  items: [{ label: category, value: message }],
  error
});

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
  if (progressBar) progressBar.style.width = `${progress}%`;

  loadingSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === activeStepIndex);
    step.classList.toggle("is-complete", index < activeStepIndex);
  });
};

const loadingUi = {
  en: {
    title: "Mission in progress",
    steps: ["Understanding your dream", "Exploring every possibility", "Finding trusted providers", "Preparing everything", "Turning your idea into reality"]
  },
  ko: {
    title: "미션 진행 중",
    steps: ["요청 이해하기", "가능성 탐색하기", "신뢰할 수 있는 제공자 찾기", "필요한 내용 준비하기", "아이디어를 현실로 만들기"]
  }
};

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getCoordinates = (mission) => {
  if (mission?.countryProfile?.latitude && mission?.countryProfile?.longitude) {
    return { latitude: mission.countryProfile.latitude, longitude: mission.countryProfile.longitude };
  }

  if (mission?.destination?.city === "Tokyo") return { latitude: 35.6762, longitude: 139.6503 };
  return { latitude: 37.5665, longitude: 126.978 };
};

const fetchWeather = async (mission) => {
  const { latitude, longitude } = getCoordinates(mission);
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
      value: `${Math.round(data.daily.temperature_2m_min[index])}°C - ${Math.round(data.daily.temperature_2m_max[index])}°C`,
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
    return fallbackProvider("Frankfurter", "currency", "Currency provider is ready. Live rates may be checked again before final execution.", error.message);
  }
};

const fetchCountryInfo = async (mission) => {
  const countryCode = mission?.country || mission?.destination?.code;

  if (!countryCode) return fallbackProvider("REST Countries", "country", "Country profile adapter is ready.");

  try {
    const data = await fetchJson(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(countryCode)}`);
    const country = Array.isArray(data) ? data[0] : null;

    return {
      provider: "REST Countries",
      category: "country",
      sourceStatus: "free_live_api",
      liveData: Boolean(country),
      requiresKey: false,
      requiresPartnerAccess: false,
      items: country ? [
        { label: "Country", value: country.name?.common || countryCode },
        { label: "Capital", value: Array.isArray(country.capital) ? country.capital.join(", ") : "Unknown" },
        { label: "Region", value: country.region || "Unknown" },
        { label: "Currency", value: country.currencies ? Object.keys(country.currencies).join(", ") : "Unknown" }
      ] : [],
      error: null
    };
  } catch (error) {
    return fallbackProvider("REST Countries", "country", "Country profile adapter is ready.", error.message);
  }
};

const fetchMapInfo = async (mission) => {
  const query = mission?.destination?.city || mission?.countryProfile?.capital || mission?.countryProfile?.name || mission?.rawInput || "";

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

const fetchWikipediaInfo = async (mission) => {
  const topic = mission?.destination?.city || mission?.countryProfile?.capital || mission?.countryProfile?.name || mission?.rawInput || "";

  if (!topic) return fallbackProvider("Wikipedia", "destination_info", "Public knowledge adapter is ready.");

  try {
    const data = await fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);

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
        value: mission.language === "ko"
          ? "파트너 접근 권한이 필요한 프로토타입 어댑터입니다. 실제 실행은 하지 않습니다."
          : "Prototype adapter requiring partner access. No real execution is performed."
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
      () => fetchMapInfo(mission)
    );
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

  updateLoadingMessage(language === "ko" ? "미션 준비가 완료되었습니다..." : "Mission ready...", 100, loadingSteps.length);
  saveMission(enrichedMission);

  await wait(620);

  body.classList.add("is-transitioning");

  window.setTimeout(() => {
    window.location.href = "results.html";
  }, 360);
};

window.addEventListener("pageshow", () => {
  body.classList.remove("is-transitioning");
});

runLoadingSequence();


