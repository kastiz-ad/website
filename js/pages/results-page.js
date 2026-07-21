import { trackEvent } from "../analytics.js";
import { openApprovalInformationReview } from "../ui/approval-information-review.js";
import { OFFICIAL_LOCALES, localeSection } from "../i18n/locale-registry.js";
import { reviseMission } from "../engine/revision/mission-revision-engine.js";
import { buildContextualExperienceIntelligence as buildExperienceIntelligence } from "../engine/context/context-experience-intelligence.js?v=20260722-context-v2";
import { buildMissionContext, isDomesticContext } from "../engine/context/mission-context-intelligence.js?v=20260722-context-v2";
import { missionMemoryEnabled, readMissionMemories } from "../profile/mission-memory.js";

const root = document.documentElement;
const missionTitle = document.getElementById("missionTitle");
const missionGrid = document.getElementById("missionGrid");
const bottomActions = document.getElementById("bottomActions");
const makeRealityButton = document.getElementById("makeRealityButton");
const approvalPanel = document.getElementById("approvalPanel");
const executionSummary = document.getElementById("executionSummary");
const approvalList = document.getElementById("approvalList");
const completionMessage = document.getElementById("completionMessage");
const returnHomeButton = document.getElementById("returnHomeButton");
const locationText = document.getElementById("locationText");
const additionalServiceInput = document.getElementById("additionalServiceInput");
const addServiceButton = document.getElementById("addServiceButton");
const additionalServiceList = document.getElementById("additionalServiceList");
const additionalServicesForm = document.getElementById("additionalServicesForm");
const revisionStatus = document.getElementById("revisionStatus");
const pathwayOpportunityPanel = document.getElementById("pathwayOpportunityPanel");
const pathwayOpportunityTitle = document.getElementById("pathwayOpportunityTitle");
const pathwayOpportunityList = document.getElementById("pathwayOpportunityList");
const experienceReviewOpening = document.getElementById("experienceReviewOpening");
const experienceReviewLabel = document.getElementById("experienceReviewLabel");
const experienceReviewInsights = document.getElementById("experienceReviewInsights");
const experienceReviewConfidence = document.getElementById("experienceReviewConfidence");
const revisionLead = document.getElementById("revisionLead");
const missionUnderstoodGoal = document.getElementById("missionUnderstoodGoal");
const missionUnderstoodItems = document.getElementById("missionUnderstoodItems");

const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  travelMission: "kastiz-one-travel-mission",
  results: "kastiz-one-results"
};

const supportedLanguages = OFFICIAL_LOCALES;
const supportedThemes = ["light", "gray", "midnight"];

const translations = {
  en: {
    upgrade: "Upgrade",
    login: "Login",
    missionReady: "Mission Ready",
    preparedByOne: "Prepared by ONE",
    customize: "Customize",
    makeItReality: "Approve & Proceed",
    withOne: "with ONE",
    additionalServices: "Customize Services",
    optional: "Optional",
    additionalServicesHelp: "Add or request a new destination, flight, tutor subject, language, or any other service.",
    additionalServicesPlaceholder: "Example: Add a flight to LAX",
    addService: "Add",
    missionApproved: "Mission Approved",
    oneIsWorking: "ONE is making it happen.",
    finalMessage: "ONE'D",
    returnHomeNow: "HOME",
    returningHome: "Returning to Home in {seconds} seconds...",
    partners: "Partners",
    business: "Business",
    developers: "Developers",
    poweredBy: "Powered by Kastiz",
    privacy: "Privacy",
    terms: "Terms",
    settings: "Settings",
    unknownLocation: "Unknown Location",
    recommended: "⭐ ONE Pick",
    reason: "Reason:",
    otherOptions: "Other options:",
    modify: "Modify",
    editing: "Editing",
    remove: "Remove",
    restore: "Restore",
    changeAirline: "Change airline",
    changeHotelType: "Change hotel type",
    removeRestaurants: "Remove restaurants",
    reduceBudget: "Reduce budget",
    upgradeQuality: "Upgrade quality",
    verifyVisa: "Verify before execution",
    budgetFlights: "Flights",
    budgetHotel: "Hotel",
    budgetFood: "Food",
    budgetTransport: "Transport",
    budgetActivities: "Activities",
    estimatedTotal: "Estimated total",
    weather: "Weather",
    exchangeRate: "Exchange Rate",
    visa: "Visa",
    apiPlaceholder: "Prototype estimate",
    prototypeDisclosure: "Prototype · Live public data + estimated travel options",
    flightEstimateNotice: "Estimated price range · not a live fare",
    verifyLiveFares: "Check current fares",
    approvalProtectionTitle: "Approval Protection",
    approvalProtection:
      "Nothing will be booked, purchased, reserved, signed, or legally committed until you explicitly approve.",
    executionSteps: [
      "Preparing flight booking...",
      "Preparing hotel reservation...",
      "Preparing travel checklist...",
      "Preparing restaurant options...",
      "Preparing airport transfer...",
      "Finalizing your mission..."
    ],
    fallbackMission: "Plan my Japan trip",
    fallbackTitle: "Japan Trip"
  },
  ko: {
    upgrade: "업그레이드",
    login: "로그인",
    missionReady: "미션 준비 완료",
    preparedByOne: "ONE 이 준비했습니다.",
    customize: "수정하기",
    makeItReality: "승인 후 실행",
    withOne: "ONE과 함께",
    additionalServices: "서비스 맞춤 설정",
    optional: "선택 사항",
    additionalServicesHelp: "새 목적지, 항공편, 튜터 과목, 언어 또는 원하는 서비스를 추가하거나 요청하세요.",
    additionalServicesPlaceholder: "예: LAX행 항공편 추가",
    addService: "추가",
    missionApproved: "미션 승인 완료",
    oneIsWorking: "ONE이 실행하고 있습니다.",
    finalMessage: "ONE'D",
    returnHomeNow: "HOME",
    returningHome: "{seconds}초 후 홈으로 돌아갑니다...",
    partners: "파트너",
    business: "비즈니스",
    developers: "개발자",
    poweredBy: "Kastiz 제공",
    privacy: "개인정보",
    terms: "약관",
    settings: "설정",
    unknownLocation: "알 수 없는 위치",
    recommended: "⭐ ONE Pick",
    reason: "선정 이유:",
    otherOptions: "다른 옵션:",
    modify: "수정",
    editing: "수정 중",
    remove: "제거",
    restore: "복구",
    changeAirline: "항공사 변경",
    changeHotelType: "호텔 유형 변경",
    removeRestaurants: "레스토랑 제외",
    reduceBudget: "예산 줄이기",
    upgradeQuality: "품질 업그레이드",
    verifyVisa: "실행 전 확인",
    budgetFlights: "항공권",
    budgetHotel: "호텔",
    budgetFood: "식비",
    budgetTransport: "교통",
    budgetActivities: "활동",
    estimatedTotal: "예상 총액",
    weather: "날씨",
    exchangeRate: "환율",
    visa: "비자",
    apiPlaceholder: "프로토타입 예상 정보",
    prototypeDisclosure: "프로토타입 · 공개 실시간 데이터 + 여행 예상 정보",
    flightEstimateNotice: "예상 가격 범위 · 실시간 운임 아님",
    verifyLiveFares: "현재 운임 확인",
    approvalProtectionTitle: "승인 보호",
    approvalProtection:
      "사용자가 명확히 승인하기 전까지 예약, 구매, 결제, 서명, 법적 약속은 절대 진행되지 않습니다.",
    executionSteps: [
      "항공권 예약 준비 중...",
      "호텔 예약 준비 중...",
      "여행 체크리스트 준비 중...",
      "레스토랑 옵션 준비 중...",
      "공항 이동 준비 중...",
      "미션을 최종 준비 중..."
    ],
    fallbackMission: "일본 여행 계획해줘",
    fallbackTitle: "일본 여행"
  }
};

translations.es = localeSection("es", "results");

const countryNamesByRegion = {
  KR: "South Korea",
  US: "United States",
  ES: "Spain",
  FR: "France",
  JP: "Japan",
  BR: "Brazil",
  DE: "Germany",
  CN: "China",
  IT: "Italy",
  PT: "Portugal",
  CA: "Canada",
  GB: "United Kingdom",
  AU: "Australia",
  NZ: "New Zealand",
  MX: "Mexico",
  SG: "Singapore",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
  ID: "Indonesia",
  IN: "India"
};

let activeLanguage = "en";
let currentResult = null;
let currentExperienceReview = null;

const getLanguage = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.language);
  return supportedLanguages.includes(saved) ? saved : "en";
};

const getTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  return supportedThemes.includes(saved) ? saved : "light";
};

const t = (key) => {
  return localeSection(activeLanguage, "results")[key] ?? translations[activeLanguage]?.[key] ?? translations.en[key] ?? "";
};

const localize = (value) => {
  if (typeof value === "string") return value;
  return value?.[activeLanguage] ?? value?.en ?? "";
};

const formatKRW = (value) => {
  if (typeof value !== "number") return value;

  return activeLanguage === "ko"
    ? `${Math.round(value / 10000).toLocaleString("ko-KR")}만 원`
    : activeLanguage === "es" ? `${value.toLocaleString("es-ES")} KRW` : `₩${value.toLocaleString("en-US")}`;
};

const formatRange = (range) => {
  if (!range) return "";

  if (typeof range.min === "number" && typeof range.max === "number") {
    return `${formatKRW(range.min)} – ${formatKRW(range.max)}`;
  }

  return "";
};

const setTheme = () => {
  const theme = getTheme();
  root.setAttribute("data-theme", theme);

  const colors = {
    light: "#ffffff",
    gray: "#3f4146",
    midnight: "#121315"
  };

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", colors[theme] || colors.light);
};

const updateTextContent = () => {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    element.textContent = t(key);
  });
};

const updateLocation = () => {
  const locale = navigator.language || "en";
  const region = locale.includes("-") ? locale.split("-").pop().toUpperCase() : "";

  locationText.textContent = activeLanguage === "ko"
    ? countryNamesKoByRegion[region] || t("unknownLocation")
    : countryNamesByRegion[region] || t("unknownLocation");
};

const encodePortableShare = (value) => {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
};

const getPortableSharedResult = () => {
  try {
    const encoded = new URLSearchParams(location.search).get("share");
    if (!encoded || encoded.length > 12000) return null;
    const padded = encoded.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (parsed?.p === 2) {
      const [recommendation = "", reasoning = "", transportation = "", rainPlan = ""] = parsed.q || [];
      const timeline = (parsed.t || []).map(([time, title, type]) => ({ time, title, type }));
      const missionLabel = parsed.l === "ko" ? "저장된 맞춤 경험" : parsed.l === "es" ? "Experiencia personalizada guardada" : "Saved personalized experience";
      return {
        portableShare: true, type: "experience", id: parsed.r, language: parsed.l || "en",
        originalMission: missionLabel,
        missionContext: { purpose: { value: "romance" }, destination: { id: "Seoul" }, transport: [] },
        portableExperienceData: {
          recommendation,
          onePick: { reasoning, transportation, rainPlan, timeline, foods: parsed.f || [] },
          alternatives: parsed.a || []
        },
        approvalRequired: true
      };
    }
    if (parsed?.p !== 1) return parsed?.portableShare === true && parsed?.type === "travel" ? parsed : null;
    const [country = "", countryKo = "", city = "", cityKo = ""] = parsed.d || [];
    const [startDate = "", endDate = "", timePreference = "any"] = parsed.s || [];
    const [flightName = "", flightNameKo = "", flightMin = 0, flightMax = 0] = parsed.f || [];
    const [hotelName = "", hotelNameKo = "", hotelMin = 0, hotelMax = 0] = parsed.h || [];
    const budgetValues = parsed.b || [];
    const [foodMin = 0, foodMax = 0, transportMin = 0, transportMax = 0, activitiesMin = 0, activitiesMax = 0, compactBudgetMin = 0, compactBudgetMax = 0] = budgetValues;
    const budgetMin = budgetValues.length === 2 ? budgetValues[0] : compactBudgetMin;
    const budgetMax = budgetValues.length === 2 ? budgetValues[1] : compactBudgetMax;
    const savedFoodMin = budgetValues.length === 2 ? 0 : foodMin;
    const savedFoodMax = budgetValues.length === 2 ? 0 : foodMax;
    const portableChecklist = parsed.l === "ko"
      ? ["여권", "여행자 보험", "SIM / eSIM", "환전", "교통카드", "호텔 예약 확인서", "비상 연락처"]
      : ["Passport", "Travel insurance", "SIM / eSIM", "Currency", "Transit card", "Hotel confirmation", "Emergency contacts"];
    const providerResults = [];
    if (parsed.w?.length) providerResults.push({ category: "weather", provider: "Open-Meteo", liveData: true, items: parsed.w.map(([label, value, humidity, precipitation]) => ({ label, value, humidity, precipitation })) });
    if (parsed.e?.length) providerResults.push({ category: "currency", provider: "ExchangeRate API", liveData: true, items: parsed.e.map(([to, rate]) => ({ to, rate, value: rate })) });
    return {
      portableShare: true, type: "travel", id: parsed.r, language: parsed.l || "en", country,
      destination: { country, countryKo: countryKo || country, city, cityKo: cityKo || city },
      display: {
        title: parsed.l === "ko" ? `${countryKo || country} 여행` : `${country || city} Trip`,
        destination: parsed.l === "ko" ? (countryKo || country) : country,
        city: parsed.l === "ko" ? (cityKo || city) : city
      },
      schedule: { startDate, endDate, timePreference }, tripType: parsed.t || "round_trip",
      flights: flightName ? [{ provider: flightName, providerKo: flightNameKo || flightName, estimatedPrice: { currency: "KRW", min: flightMin, max: flightMax }, recommended: true }] : [],
      hotels: hotelName ? [{ name: hotelName, nameKo: hotelNameKo || hotelName, estimatedNightlyPrice: { currency: "KRW", min: hotelMin, max: hotelMax }, recommended: true }] : [],
      airportTransfer: { recommended: parsed.x || "", options: parsed.x ? [parsed.x] : [] },
      restaurants: (parsed.n || []).map((name) => ({ type: name, typeKo: name, venueName: name, venueNameKo: name })),
      checklist: (parsed.k?.length ? parsed.k : portableChecklist).map((text) => ({ en: text, ko: text })), providerResults,
      weather: { status: parsed.w?.length ? "live" : "prototype", message: { en: "Weather data saved with this summary", ko: "이 요약에 저장된 날씨 정보" } },
      exchangeRate: { from: "KRW", to: parsed.c || "USD", status: parsed.e?.length ? "live" : "prototype", message: { en: "Currency data saved with this summary", ko: "이 요약에 저장된 환율 정보" } },
      budget: { currency: "KRW", flights: { currency: "KRW", min: flightMin, max: flightMax }, hotel: { currency: "KRW", min: hotelMin, max: hotelMax }, food: { currency: "KRW", min: savedFoodMin, max: savedFoodMax }, transport: { currency: "KRW", min: transportMin, max: transportMax }, activities: { currency: "KRW", min: activitiesMin, max: activitiesMax }, estimatedTotal: { currency: "KRW", min: budgetMin, max: budgetMax } },
      approvalRequired: true
    };
  } catch {
    return null;
  }
};

const getStoredResult = () => {
  const sharedResult = getPortableSharedResult();
  if (sharedResult) return sharedResult;
  try {
    const resultsRaw = sessionStorage.getItem(STORAGE_KEYS.results);
    const travelRaw = sessionStorage.getItem(STORAGE_KEYS.travelMission);
    const missionRaw = sessionStorage.getItem(STORAGE_KEYS.mission);
    const parsed = JSON.parse(resultsRaw || travelRaw || missionRaw);

    if (parsed?.type) return parsed;
  } catch {}

  return null;
};

const countryNamesKoByRegion = {
  KR: "대한민국", US: "미국", ES: "스페인", FR: "프랑스", JP: "일본",
  BR: "브라질", DE: "독일", CN: "중국", IT: "이탈리아", PT: "포르투갈",
  CA: "캐나다", GB: "영국", AU: "호주", NZ: "뉴질랜드", MX: "멕시코",
  SG: "싱가포르", TH: "태국", VN: "베트남", PH: "필리핀", ID: "인도네시아", IN: "인도"
};

const findLiveProvider = (result, category) => {
  return (result?.providerResults || []).find((provider) => provider.category === category && provider.liveData);
};

const makeLiveWeatherMessage = (provider) => {
  const summary = (provider?.items || []).slice(0, 3).map((item) => {
    return `${item.label}: ${item.value}${item.precipitation ? ` (${item.precipitation})` : ""}`;
  }).join(" · ");

  return {
    en: `Live weather from ${provider.provider}: ${summary}`,
    ko: `${provider.provider} 실시간 날씨: ${summary}`
  };
};

const makeLiveCurrencyMessage = (provider) => {
  const item = provider?.items?.[0];
  const summary = item ? `${item.label}: ${item.value}` : "Rate unavailable";
  return {
    en: `Live exchange rate from ${provider.provider}: ${summary}`,
    ko: `${provider.provider} 실시간 환율: ${summary}`
  };
};

const createFallbackTravelResult = () => {
  return {
    id: `fallback-travel-${Date.now()}`,
    resultId: `fallback-result-${Date.now()}`,
    type: "travel",
    status: "mission-ready",
    mission: t("fallbackMission"),
    originalMission: t("fallbackMission"),
    language: activeLanguage,
    approvalRequired: true,
    display: {
      missionReady: t("missionReady"),
      title: t("fallbackTitle"),
      destination: activeLanguage === "ko" ? "일본" : "Japan",
      city: activeLanguage === "ko" ? "도쿄" : "Tokyo",
      approvalProtection: t("approvalProtection")
    },
    destination: {
      country: "Japan",
      countryKo: "일본",
      city: "Tokyo",
      cityKo: "도쿄"
    },
    durationDays: 7,
    departureCountry: {
      code: "KR",
      name: "South Korea"
    },
    flights: [
      {
        id: "flight-korean-air",
        provider: "Korean Air",
        providerKo: "대한항공",
        category: "recommended",
        reason: "Best balance of comfort, direct routes, and service quality.",
        reasonKo: "편안함, 직항 노선, 서비스 품질의 균형이 가장 좋습니다.",
        estimatedPrice: {
          currency: "KRW",
          min: 420000,
          max: 760000
        },
        editable: true
      },
      {
        id: "flight-asiana",
        provider: "Asiana Airlines",
        providerKo: "아시아나항공",
        category: "quality",
        reason: "Strong service quality and convenient Korea to Japan schedules.",
        reasonKo: "서비스 품질이 좋고 한국-일본 노선 일정이 편리합니다.",
        estimatedPrice: {
          currency: "KRW",
          min: 390000,
          max: 720000
        },
        editable: true
      },
      {
        id: "flight-jeju-air",
        provider: "Jeju Air",
        providerKo: "제주항공",
        category: "budget",
        reason: "Lower-cost option for flexible travelers.",
        reasonKo: "일정이 유연한 여행자에게 적합한 저가 옵션입니다.",
        estimatedPrice: {
          currency: "KRW",
          min: 180000,
          max: 390000
        },
        editable: true
      },
      {
        id: "flight-jal",
        provider: "Japan Airlines",
        providerKo: "일본항공",
        category: "premium",
        reason: "Premium Japan-based carrier with excellent reliability.",
        reasonKo: "안정성이 뛰어난 일본 기반 프리미엄 항공사입니다.",
        estimatedPrice: {
          currency: "KRW",
          min: 460000,
          max: 820000
        },
        editable: true
      },
      {
        id: "flight-united",
        provider: "United Airlines",
        providerKo: "유나이티드항공",
        category: "alternative",
        reason: "Useful alternative depending on route availability.",
        reasonKo: "노선 가능 여부에 따라 선택할 수 있는 대안입니다.",
        estimatedPrice: {
          currency: "KRW",
          min: 430000,
          max: 850000
        },
        editable: true
      }
    ],
    hotels: [
      {
        id: "hotel-metropolitan",
        name: "Hotel Metropolitan Tokyo Marunouchi",
        nameKo: "호텔 메트로폴리탄 도쿄 마루노우치",
        category: "recommended",
        reason: "Central location, strong reviews, easy access to transport.",
        reasonKo: "중심 위치, 좋은 리뷰, 편리한 교통 접근성을 갖췄습니다.",
        estimatedNightlyPrice: {
          currency: "KRW",
          min: 240000,
          max: 420000
        },
        editable: true
      },
      {
        id: "hotel-hilton-tokyo",
        name: "Hilton Tokyo",
        nameKo: "힐튼 도쿄",
        category: "premium",
        reason: "Premium comfort and reliable international service.",
        reasonKo: "프리미엄 숙박 경험과 안정적인 글로벌 서비스를 제공합니다.",
        estimatedNightlyPrice: {
          currency: "KRW",
          min: 320000,
          max: 620000
        },
        editable: true
      },
      {
        id: "hotel-tokyu-stay",
        name: "Tokyu Stay Shinjuku",
        nameKo: "도큐 스테이 신주쿠",
        category: "value",
        reason: "Practical location and strong value for longer stays.",
        reasonKo: "실용적인 위치와 장기 숙박에 좋은 가성비를 제공합니다.",
        estimatedNightlyPrice: {
          currency: "KRW",
          min: 160000,
          max: 290000
        },
        editable: true
      },
      {
        id: "hotel-apa",
        name: "APA Hotel",
        nameKo: "APA 호텔",
        category: "budget",
        reason: "Budget-friendly and widely available across Tokyo.",
        reasonKo: "도쿄 전역에서 찾기 쉽고 예산을 아끼기 좋은 옵션입니다.",
        estimatedNightlyPrice: {
          currency: "KRW",
          min: 95000,
          max: 180000
        },
        editable: true
      }
    ],
    airportTransfer: {
      recommended: {
        en: "Narita Express or Airport Limousine Bus",
        ko: "나리타 익스프레스 또는 공항 리무진 버스"
      },
      reason: {
        en: "Best balance of reliability, luggage convenience, and access to central Tokyo.",
        ko: "정시성, 수하물 편의성, 도쿄 중심 접근성의 균형이 좋습니다."
      },
      options: [
        {
          en: "Narita Express",
          ko: "나리타 익스프레스"
        },
        {
          en: "Airport Limousine Bus",
          ko: "공항 리무진 버스"
        },
        {
          en: "Private airport transfer",
          ko: "프라이빗 공항 픽업"
        }
      ],
      editable: true
    },
    weather: {
      status: "placeholder",
      message: {
        en: "Weather will be checked with a live weather API before execution.",
        ko: "실행 전 실시간 날씨 API로 날씨를 확인합니다."
      }
    },
    exchangeRate: {
      status: "placeholder",
      from: "KRW",
      to: "JPY",
      message: {
        en: "Exchange rate will be checked with a live currency API before execution.",
        ko: "실행 전 실시간 환율 API로 환율을 확인합니다."
      }
    },
    visa: {
      status: "requires-verification",
      message: {
        en: "For many travelers visa-free entry may apply, but ONE must verify before execution.",
        ko: "많은 여행자에게 무비자 입국이 가능할 수 있지만, 실행 전 ONE이 반드시 확인해야 합니다."
      }
    },
    checklist: [
      {
        id: "passport",
        en: "Passport",
        ko: "여권",
        required: true,
        editable: true
      },
      {
        id: "travel-insurance",
        en: "Travel insurance",
        ko: "여행자 보험",
        required: true,
        editable: true
      },
      {
        id: "sim-esim",
        en: "SIM / eSIM",
        ko: "SIM / eSIM",
        required: false,
        editable: true
      },
      {
        id: "currency",
        en: "Currency",
        ko: "환전",
        required: true,
        editable: true
      },
      {
        id: "transit-card",
        en: "Transit card",
        ko: "교통카드",
        required: false,
        editable: true
      },
      {
        id: "hotel-confirmation",
        en: "Hotel confirmation",
        ko: "호텔 예약 확인서",
        required: true,
        editable: true
      },
      {
        id: "emergency-contacts",
        en: "Emergency contacts",
        ko: "비상 연락처",
        required: true,
        editable: true
      }
    ],
    restaurants: [
      {
        id: "sushi",
        type: "Sushi",
        typeKo: "스시",
        recommendation: "Reservation-ready sushi options near your route.",
        recommendationKo: "동선 근처 예약 가능한 스시 옵션을 준비합니다.",
        editable: true
      },
      {
        id: "ramen",
        type: "Ramen",
        typeKo: "라멘",
        recommendation: "Local ramen shortlist based on location and wait time.",
        recommendationKo: "위치와 대기 시간을 기준으로 현지 라멘 후보를 준비합니다.",
        editable: true
      },
      {
        id: "wagyu",
        type: "Wagyu",
        typeKo: "와규",
        recommendation: "Premium wagyu options for one special meal.",
        recommendationKo: "특별한 식사를 위한 프리미엄 와규 옵션을 준비합니다.",
        editable: true
      },
      {
        id: "izakaya",
        type: "Izakaya",
        typeKo: "이자카야",
        recommendation: "Casual evening options near hotel or station.",
        recommendationKo: "호텔이나 역 근처의 캐주얼한 저녁 옵션을 준비합니다.",
        editable: true
      },
      {
        id: "cafe",
        type: "Cafe",
        typeKo: "카페",
        recommendation: "Premium cafes and quiet stops along the itinerary.",
        recommendationKo: "일정 중 들르기 좋은 프리미엄 카페와 조용한 장소를 준비합니다.",
        editable: true
      }
    ],
    budget: {
      currency: "KRW",
      flights: {
        min: 420000,
        max: 760000
      },
      hotel: {
        min: 1680000,
        max: 2940000
      },
      food: {
        min: 420000,
        max: 980000
      },
      transport: {
        min: 120000,
        max: 280000
      },
      activities: {
        min: 250000,
        max: 700000
      },
      estimatedTotal: {
        min: 2890000,
        max: 5660000
      },
      editable: true
    },
    recommendedOption: {
      level: "balanced",
      en: "Balanced quality plan",
      ko: "균형형 품질 플랜",
      reason: {
        en: "Best overall mix of comfort, price control, transport access, and reliable providers.",
        ko: "편안함, 가격 통제, 교통 접근성, 신뢰 가능한 제공업체의 균형이 가장 좋습니다."
      }
    },
    modifyOptions: [
      {
        id: "change-airline",
        en: "Change airline",
        ko: "항공사 변경"
      },
      {
        id: "change-hotel-type",
        en: "Change hotel type",
        ko: "호텔 유형 변경"
      },
      {
        id: "remove-restaurants",
        en: "Remove restaurants",
        ko: "레스토랑 제외"
      },
      {
        id: "reduce-budget",
        en: "Reduce budget",
        ko: "예산 줄이기"
      },
      {
        id: "upgrade-quality",
        en: "Upgrade quality",
        ko: "품질 업그레이드"
      }
    ],
    executionSequence: {
      en: translations.en.executionSteps,
      ko: translations.ko.executionSteps
    },
    finalMessage: {
      en: translations.en.finalMessage,
      ko: translations.ko.finalMessage
    },
    approvalProtection: {
      en: translations.en.approvalProtection,
      ko: translations.ko.approvalProtection
    }
  };
};

const normalizeStoredResult = (stored) => {
  if (!stored) return createFallbackTravelResult();

  if (stored.type === "travel") {
    const result = {
      ...stored,
      display: {
        missionReady: stored.display?.missionReady || t("missionReady"),
        title:
          stored.display?.title ||
          (activeLanguage === "ko"
            ? `${stored.destination?.countryKo || "일본"} 여행`
            : `${stored.destination?.country || "Japan"} Trip`),
        destination:
          stored.display?.destination ||
          (activeLanguage === "ko"
            ? stored.destination?.countryKo || "일본"
            : stored.destination?.country || "Japan"),
        city:
          stored.display?.city ||
          (activeLanguage === "ko"
            ? stored.destination?.cityKo || "도쿄"
            : stored.destination?.city || "Tokyo"),
        approvalProtection:
          stored.display?.approvalProtection ||
          localize(stored.approvalProtection) ||
          t("approvalProtection")
      }
    };

    if (stored.portableShare === true) {
      result.executionSequence = { en: translations.en.executionSteps, ko: translations.ko.executionSteps };
      result.finalMessage = { en: translations.en.finalMessage, ko: translations.ko.finalMessage };
      return result;
    }

    const weatherProvider = findLiveProvider(stored, "weather");
    const currencyProvider = findLiveProvider(stored, "currency");

    if (weatherProvider) {
      result.weather = { ...result.weather, status: "live", message: makeLiveWeatherMessage(weatherProvider) };
    }

    if (currencyProvider) {
      result.exchangeRate = { ...result.exchangeRate, status: "live", message: makeLiveCurrencyMessage(currencyProvider) };
    }

    result.executionSequence = result.executionSequence || {
      en: translations.en.executionSteps,
      ko: translations.ko.executionSteps
    };

    result.finalMessage = result.finalMessage || {
      en: translations.en.finalMessage,
      ko: translations.ko.finalMessage
    };

    return adaptTravelResultToDestination(result);
  }

  return {
    ...stored,
    display: {
      ...stored.display,
      title: stored.display?.title || stored.rawInput || stored.mission || (activeLanguage === "ko" ? "미션 계획" : "Mission Plan"),
      approvalProtection: stored.display?.approvalProtection || localize(stored.approvalProtection?.message || stored.approvalProtection) || t("approvalProtection")
    },
    executionSequence: stored.executionSequence || {
      en: stored.executionSimulation?.messages || translations.en.executionSteps,
      ko: stored.executionSimulation?.messages || translations.ko.executionSteps
    }
  };
};

const makeOptionRow = (key, value, details = {}) => {
  const reason = encodeURIComponent(details.reason || "");
  const label = encodeURIComponent(details.label || key || "");
  const index = Number.isInteger(details.index) ? details.index : -1;
  const selected = details.selected !== false;
  const priceAttributes = details.price
    ? ` data-price-min="${Number(details.price.min || 0)}" data-price-max="${Number(details.price.max || 0)}" data-price-currency="${details.price.currency || "KRW"}"`
    : "";
  return `
    <button class="option-row selectable-option${selected ? "" : " is-excluded"}" type="button" aria-pressed="${selected}" data-option-index="${index}" data-option-label="${label}" data-option-reason="${reason}"${priceAttributes}>
      <span class="option-key">${selected ? "✓" : "+"}</span>
      <span class="option-value"><strong>${key}</strong><span>${value}</span></span>
    </button>
  `;
};

const makeOptionList = (options) => {
  if (!Array.isArray(options) || options.length === 0) return "";

  return `
    <p class="recommendation-label">${t("otherOptions")}</p>
    <div class="option-list">
      ${options.join("")}
    </div>
  `;
};

const getFlightName = (flight) => {
  const name = activeLanguage === "ko" ? flight.providerKo || flight.provider : flight.provider;
  return /^KLM(?:\s|$)/i.test(String(name || "")) ? "KLM" : name;
};

const getHotelName = (hotel) => {
  return activeLanguage === "ko" ? hotel.nameKo || hotel.name : hotel.name;
};

const getRestaurantName = (restaurant) => {
  return activeLanguage === "ko" ? restaurant.typeKo || restaurant.type : restaurant.type;
};

const getRestaurantRecommendation = (restaurant) => {
  return activeLanguage === "ko"
    ? restaurant.recommendationKo || restaurant.recommendation
    : restaurant.recommendation;
};

const restaurantVenueProfiles = {
  JP: [
    { en: "Sushi Dai", ko: "스시다이", rating: 4.7 }, { en: "Ichiran Ramen", ko: "이치란 라멘", rating: 4.5 },
    { en: "Gyukatsu Motomura", ko: "규카츠 모토무라", rating: 4.6 }, { en: "Gonpachi", ko: "곤파치", rating: 4.3 },
    { en: "Blue Bottle Coffee", ko: "블루보틀 커피", rating: 4.4 }
  ],
  US: [
    { en: "The Modern", ko: "더 모던", rating: 4.6 }, { en: "Keens Steakhouse", ko: "킨스 스테이크하우스", rating: 4.5 },
    { en: "Rubirosa", ko: "루비로사", rating: 4.6 }, { en: "Joe's Shanghai", ko: "조스 상하이", rating: 4.3 }
  ],
  ES: [
    { en: "Sobrino de Botín", ko: "소브리노 데 보틴", rating: 4.4 }, { en: "Casa Lucio", ko: "카사 루시오", rating: 4.3 },
    { en: "Sala de Despiece", ko: "살라 데 데스피에세", rating: 4.5 }, { en: "Chocolatería San Ginés", ko: "산 히네스", rating: 4.4 }
  ],
  CO: [
    { en: "Leo", ko: "레오", rating: 4.6 }, { en: "El Chato", ko: "엘 차토", rating: 4.6 },
    { en: "Andrés Carne de Res", ko: "안드레스 카르네 데 레스", rating: 4.5 }, { en: "Mesa Franca", ko: "메사 프랑카", rating: 4.6 }
  ]
};

const createMissionCard = ({ id, title, label, value, reason, options, supportingContent = "", wide = false, editable = true, selectionMode = "exclusive" }) => {
  const article = document.createElement("article");
  article.className = "mission-card";
  article.dataset.cardId = id;
  if (editable) article.classList.add(selectionMode === "multiple" ? "multiple-choice-card" : "exclusive-choice-card");

  if (wide) {
    article.classList.add("is-wide");
  }

  article.innerHTML = `
    <div class="card-top">
      <div class="card-title-group">${editable ? `<button class="category-toggle" type="button" aria-pressed="true" aria-label="${activeLanguage === "ko" ? "카테고리 포함" : "Include category"}">✓</button>` : ""}<h2 class="card-title">${title}</h2></div>
      <span class="card-label">${label}</span>
    </div>

    <div class="recommendation">
      ${editable ? `<button class="selectable-recommendation selectable-option" type="button" aria-pressed="true"><span class="option-key">✓</span><span class="recommendation-value">${value}</span></button>` : `<p class="recommendation-value">${value}</p>`}
    </div>

    <p class="recommendation-label">${t("reason")}</p>
    <p class="reason">${reason}</p>
    ${supportingContent}

    ${makeOptionList(options)}

    ${editable ? `
      <div class="alternative-picker">
        <p class="alternative-picker-title">${activeLanguage === "ko" ? "포함할 옵션을 선택하세요" : "Choose options to include"}</p>
        <div class="alternative-options" data-alternatives-for="${id}"></div>
      </div>
    ` : ""}

    ${
      editable
        ? `
          <div class="card-actions">
            <button class="modify-button" type="button" data-card-action="${id}">${t("modify")}</button>
          </div>
        `
        : ""
    }
  `;

  return article;
};

const createListCard = ({ id, title, label, items, itemDetails = [], wide = false, editable = true }) => {
  const article = document.createElement("article");
  article.className = "mission-card";
  article.dataset.cardId = id;
  if (!editable) article.classList.add("is-locked-card");

  if (wide) {
    article.classList.add("is-wide");
  }

  article.innerHTML = `
    <div class="card-top">
      <div class="card-title-group">${editable ? `<button class="category-toggle" type="button" aria-pressed="true" aria-label="${activeLanguage === "ko" ? "카테고리 포함" : "Include category"}">✓</button>` : ""}<h2 class="card-title">${title}</h2></div>
      <span class="card-label">${label}</span>
    </div>

    <div class="option-list">
      ${items.map((item, index) => {
        const price = itemDetails[index]?.price;
        const priceAttributes = price
          ? ` data-price-min="${Number(price.min || 0)}" data-price-max="${Number(price.max || 0)}" data-price-currency="${price.currency || "KRW"}"`
          : "";
        return editable ? `
        <button class="option-row selectable-option" type="button" data-option-index="${index}"${priceAttributes} aria-pressed="true">
          <span class="option-key">✓</span><span class="option-value">${item}</span>
        </button>
      ` : `<div class="option-row locked-option"><span class="option-key">•</span><span class="option-value">${item}</span></div>`;
      }).join("")}
    </div>

    ${editable ? `
      <div class="alternative-picker">
        <p class="alternative-picker-title">${activeLanguage === "ko" ? "포함할 옵션을 선택하세요" : "Choose options to include"}</p>
        <div class="alternative-options" data-alternatives-for="${id}"></div>
      </div>
    ` : ""}

    ${
      editable
        ? `
          <div class="card-actions">
            <button class="modify-button" type="button" data-card-action="${id}">${t("modify")}</button>
          </div>
        `
        : ""
    }
  `;

  return article;
};

const createBudgetCard = (budget) => {
  const article = document.createElement("article");
  article.className = "mission-card is-wide";
  article.dataset.cardId = "budget";

  const total = budget?.estimatedTotal || { currency: budget?.currency || "KRW", min: 0, max: 0 };
  const budgetRows = [
    ["flights", t("budgetFlights"), budget?.flights],
    ["hotel", t("budgetHotel"), budget?.hotel],
    ["food", t("budgetFood"), budget?.food],
    ["transport", t("budgetTransport"), budget?.transport],
    ["activities", t("budgetActivities"), budget?.activities],
    ["estimatedTotal", t("estimatedTotal"), total]
  ];
  const rows = budgetRows.map(([, label, range]) => makeOptionRow(label, formatRange(range))).join("");

  article.innerHTML = `
    <div class="card-top">
      <div class="card-title-group"><button class="category-toggle" type="button" aria-pressed="true" aria-label="${activeLanguage === "ko" ? "예산 포함" : "Include budget"}">✓</button><h2 class="card-title">${activeLanguage === "ko" ? "예산" : "Budget"}</h2></div>
      <span class="card-label">${activeLanguage === "ko" ? "예상" : "Estimated"}</span>
    </div>

    <div class="option-list">
      ${rows}
    </div>

    <div class="card-actions">
      <button class="modify-button" type="button" data-card-action="budget">${t("modify")}</button>
    </div>
  `;

  article.querySelectorAll(".option-list .option-row").forEach((row, index) => {
    row.dataset.budgetKey = budgetRows[index][0];
  });

  return article;
};

const createPlaceholderCard = ({ id, title, message, status }) => {
  return createMissionCard({
    id,
    title,
    label: status === "live" ? (activeLanguage === "ko" ? "실시간 데이터" : "Live data") : t("apiPlaceholder"),
    value: localize(message),
    reason: localize(message),
    options: [],
    wide: false,
    editable: false
  });
};

const createApprovalCard = (result) => {
  return createMissionCard({
    id: "approval-protection",
    title: t("approvalProtectionTitle"),
    label: activeLanguage === "ko" ? "필수" : "Required",
    value: activeLanguage === "ko" ? "승인 전 실행 금지" : "Approval-first execution",
    reason: result.display?.approvalProtection || localize(result.approvalProtection) || t("approvalProtection"),
    options: [],
    wide: true,
    editable: false
  });
};

const createVisaVerificationCard = (result) => {
  const article = document.createElement("article");
  article.className = "mission-card is-full visa-verification-card";
  article.dataset.cardId = "visa";
  const ko = activeLanguage === "ko";
  article.innerHTML = `
    <div class="card-top"><h2 class="card-title">${ko ? "비자 확인" : "Visa Verification"}</h2><span class="card-label">${ko ? "필수 확인" : "Required"}</span></div>
    <p class="reason">${localize(result.visa?.message)}</p>
    <div class="visa-upload-grid">
      <button class="document-upload-button" type="button" data-document-type="passport">${ko ? "여권 이미지 추가" : "Add Passport Image"}</button>
      <button class="document-upload-button" type="button" data-document-type="visa">${ko ? "비자 이미지 추가" : "Add Visa Image"}</button>
      <input id="passportUploadInput" type="file" accept="image/*,application/pdf" hidden />
      <input id="visaUploadInput" type="file" accept="image/*,application/pdf" hidden />
    </div>
    <div class="document-status" id="visaDocumentStatus" aria-live="polite"></div>
    <label class="personal-data-consent"><input id="personalDataConsent" type="checkbox" /><span>${ko ? "비자 신청서 준비를 위해 승인한 개인정보와 업로드한 문서를 ONE이 사용하도록 허용합니다." : "I allow ONE to use the personal details and documents I approve to prepare my visa application."}</span></label>
    <button class="prepare-visa-button" id="prepareVisaButton" type="button" disabled>${ko ? "비자 신청 준비" : "Prepare Visa Application"}</button>
    <p class="visa-protection-note">${ko ? "ONE은 신청서를 준비만 합니다. 최종 승인 전에는 제출, 서명 또는 결제가 진행되지 않습니다." : "ONE prepares the application only. Nothing is submitted, signed, or paid until your final approval."}</p>
  `;
  article.querySelectorAll(".option-list .selectable-option").forEach((option) => {
    option.setAttribute("aria-pressed", "false");
    option.classList.add("is-excluded");
    option.querySelector(".option-key").textContent = "+";
  });
  const recommendedDetail = article.querySelector(".option-list .selectable-option");
  if (recommendedDetail) {
    recommendedDetail.setAttribute("aria-pressed", "true");
    recommendedDetail.classList.remove("is-excluded");
    recommendedDetail.querySelector(".option-key").textContent = "✓";
  }

  return article;
};

const destinationPrototypeProfiles = {
  US: {
    airlines: ["Korean Air", "Delta Air Lines", "Asiana Airlines", "United Airlines"],
    flightPrices: [[2200000, 2850000], [2050000, 2700000], [2150000, 2800000], [1950000, 2600000]],
    hotels: ["Lotte New York Palace", "Hilton New York Midtown", "Hyatt Grand Central New York", "Pod Times Square"],
    transfer: "AirTrain + subway or licensed airport transfer"
  },
  ES: {
    airlines: ["Korean Air", "Iberia", "Lufthansa", "Air France"],
    flightPrices: [[1550000, 2670000], [1450000, 2400000], [1500000, 2450000], [1530000, 2500000]],
    hotels: ["Hotel Riu Plaza España", "Hyatt Centric Gran Vía Madrid", "NH Collection Madrid", "Room Mate Macarena"],
    transfer: "Airport Express bus, Metro, or licensed airport transfer"
  },
  CO: {
    airlines: ["Avianca", "LATAM Airlines", "American Airlines", "United Airlines"],
    flightPrices: [[2300000, 3500000], [2400000, 3700000], [2200000, 3400000], [2250000, 3450000]],
    hotels: ["Grand Hyatt Bogotá", "Hilton Bogotá", "Sofitel Bogotá Victoria Regia", "GHL Hotel Capital"],
    transfer: "Authorized airport taxi or pre-arranged airport transfer"
  },
  JP: {
    airlines: ["Korean Air", "Asiana Airlines", "Jeju Air", "Japan Airlines"],
    flightPrices: [[440000, 660000], [400000, 620000], [180000, 390000], [520000, 830000]],
    hotels: ["Hotel Metropolitan Tokyo Marunouchi", "Hilton Tokyo", "Tokyu Stay Shinjuku", "APA Hotel"],
    transfer: "Narita Express or Airport Limousine Bus"
  }
};
const PROTOTYPE_MISSION_ARCHIVE_KEY = "kastiz-one-prototype-mission-archive";

const sanitizeArchivedMission = (value) => {
  const blockedKey = /passport|visaimage|payment|card|health|child|email|phone|upload|filename|nationalid/i;
  if (Array.isArray(value)) return value.map(sanitizeArchivedMission);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !blockedKey.test(key))
    .map(([key, item]) => [key, sanitizeArchivedMission(item)]));
};

const savePrototypeMission = (reference) => {
  try {
    const existing = JSON.parse(localStorage.getItem(PROTOTYPE_MISSION_ARCHIVE_KEY) || "[]");
    const record = { reference, savedAt: new Date().toISOString(), result: sanitizeArchivedMission(currentResult) };
    const next = [record, ...existing.filter((item) => item?.reference !== reference)].slice(0, 10);
    localStorage.setItem(PROTOTYPE_MISSION_ARCHIVE_KEY, JSON.stringify(next));
  } catch {}
};

const airlineProfilesByCountry = {
  KR: [["Korean Air", "대한항공"], ["Asiana Airlines", "아시아나항공"], ["Jeju Air", "제주항공"], ["T'way Air", "티웨이항공"]],
  CN: [["Korean Air", "대한항공"], ["Air China", "중국국제항공"], ["China Eastern Airlines", "중국동방항공"], ["China Southern Airlines", "중국남방항공"]],
  VN: [["Korean Air", "대한항공"], ["Vietnam Airlines", "베트남항공"], ["VietJet Air", "비엣젯항공"], ["Asiana Airlines", "아시아나항공"]],
  TH: [["Korean Air", "대한항공"], ["Thai Airways", "타이항공"], ["Asiana Airlines", "아시아나항공"], ["AirAsia", "에어아시아"]],
  SG: [["Singapore Airlines", "싱가포르항공"], ["Korean Air", "대한항공"], ["Asiana Airlines", "아시아나항공"], ["Scoot", "스쿠트항공"]],
  AU: [["Korean Air", "대한항공"], ["Qantas", "콴타스항공"], ["Singapore Airlines", "싱가포르항공"], ["Cathay Pacific", "캐세이퍼시픽"]],
  CA: [["Korean Air", "대한항공"], ["Air Canada", "에어캐나다"], ["Asiana Airlines", "아시아나항공"], ["WestJet", "웨스트젯"]],
  GB: [["Korean Air", "대한항공"], ["British Airways", "영국항공"], ["Asiana Airlines", "아시아나항공"], ["Lufthansa", "루프트한자"]],
  FR: [["Korean Air", "대한항공"], ["Air France", "에어프랑스"], ["Asiana Airlines", "아시아나항공"], ["KLM", "KLM 네덜란드항공"]],
  DE: [["Korean Air", "대한항공"], ["Lufthansa", "루프트한자"], ["Asiana Airlines", "아시아나항공"], ["Finnair", "핀에어"]],
  IT: [["Korean Air", "대한항공"], ["ITA Airways", "ITA 항공"], ["Asiana Airlines", "아시아나항공"], ["Lufthansa", "루프트한자"]],
  MX: [["Korean Air", "대한항공"], ["Aeromexico", "아에로멕시코"], ["American Airlines", "아메리칸항공"], ["United Airlines", "유나이티드항공"]],
  AR: [["Korean Air", "대한항공"], ["Aerolineas Argentinas", "아르헨티나항공"], ["LATAM Airlines", "라탐항공"], ["American Airlines", "아메리칸항공"]],
  BR: [["Korean Air", "대한항공"], ["LATAM Airlines", "라탐항공"], ["GOL Airlines", "골항공"], ["American Airlines", "아메리칸항공"]],
  PE: [["Korean Air", "대한항공"], ["LATAM Airlines", "라탐항공"], ["Avianca", "아비앙카항공"], ["American Airlines", "아메리칸항공"]],
  CL: [["Korean Air", "대한항공"], ["LATAM Airlines", "라탐항공"], ["American Airlines", "아메리칸항공"], ["Air Canada", "에어캐나다"]],
  PT: [["Korean Air", "대한항공"], ["TAP Air Portugal", "TAP 포르투갈항공"], ["Lufthansa", "루프트한자"], ["Air France", "에어프랑스"]],
  NL: [["KLM", "KLM 네덜란드항공"], ["Korean Air", "대한항공"], ["Lufthansa", "루프트한자"], ["Air France", "에어프랑스"]],
  GR: [["Korean Air", "대한항공"], ["Aegean Airlines", "에게항공"], ["Turkish Airlines", "터키항공"], ["Lufthansa", "루프트한자"]],
  AE: [["Emirates", "에미레이트항공"], ["Etihad Airways", "에티하드항공"], ["Korean Air", "대한항공"], ["Qatar Airways", "카타르항공"]],
  IN: [["Air India", "에어인디아"], ["Korean Air", "대한항공"], ["Singapore Airlines", "싱가포르항공"], ["Thai Airways", "타이항공"]],
  ID: [["Garuda Indonesia", "가루다인도네시아항공"], ["Korean Air", "대한항공"], ["Singapore Airlines", "싱가포르항공"], ["AirAsia", "에어아시아"]],
  MY: [["Malaysia Airlines", "말레이시아항공"], ["Korean Air", "대한항공"], ["AirAsia", "에어아시아"], ["Singapore Airlines", "싱가포르항공"]],
  NZ: [["Air New Zealand", "에어뉴질랜드"], ["Korean Air", "대한항공"], ["Qantas", "콴타스항공"], ["Singapore Airlines", "싱가포르항공"]],
  ZA: [["South African Airways", "남아프리카항공"], ["Emirates", "에미레이트항공"], ["Qatar Airways", "카타르항공"], ["Ethiopian Airlines", "에티오피아항공"]]
};

Object.assign(airlineProfilesByCountry, {
  GT: [["Aeromexico", "아에로멕시코"], ["United Airlines", "유나이티드항공"], ["American Airlines", "아메리칸항공"], ["Copa Airlines", "코파항공"]],
  BZ: [["American Airlines", "아메리칸항공"], ["United Airlines", "유나이티드항공"], ["Copa Airlines", "코파항공"], ["Avianca", "아비앙카항공"]],
  CR: [["Avianca", "아비앙카항공"], ["United Airlines", "유나이티드항공"], ["American Airlines", "아메리칸항공"], ["Copa Airlines", "코파항공"]],
  SV: [["Avianca", "아비앙카항공"], ["United Airlines", "유나이티드항공"], ["American Airlines", "아메리칸항공"], ["Copa Airlines", "코파항공"]],
  HN: [["Avianca", "아비앙카항공"], ["United Airlines", "유나이티드항공"], ["American Airlines", "아메리칸항공"], ["Copa Airlines", "코파항공"]],
  NI: [["Avianca", "아비앙카항공"], ["Copa Airlines", "코파항공"], ["American Airlines", "아메리칸항공"], ["United Airlines", "유나이티드항공"]],
  PA: [["Copa Airlines", "코파항공"], ["United Airlines", "유나이티드항공"], ["American Airlines", "아메리칸항공"], ["Avianca", "아비앙카항공"]]
});

const airlineProfilesByContinent = {
  "Central America": airlineProfilesByCountry.GT,
  Caribbean: [["American Airlines", "아메리칸항공"], ["United Airlines", "유나이티드항공"], ["Copa Airlines", "코파항공"], ["Avianca", "아비앙카항공"]],
  "South America": [["LATAM Airlines", "라탐항공"], ["Avianca", "아비앙카항공"], ["American Airlines", "아메리칸항공"], ["Copa Airlines", "코파항공"]],
  Europe: [["Lufthansa", "루프트한자"], ["Air France", "에어프랑스"], ["KLM", "KLM 네덜란드항공"], ["Turkish Airlines", "터키항공"]],
  Africa: [["Ethiopian Airlines", "에티오피아항공"], ["Qatar Airways", "카타르항공"], ["Emirates", "에미레이트항공"], ["Turkish Airlines", "터키항공"]],
  "Middle East": [["Emirates", "에미레이트항공"], ["Qatar Airways", "카타르항공"], ["Etihad Airways", "에티하드항공"], ["Turkish Airlines", "터키항공"]],
  Oceania: [["Qantas", "콴타스항공"], ["Singapore Airlines", "싱가포르항공"], ["Cathay Pacific", "캐세이퍼시픽"], ["Air New Zealand", "에어뉴질랜드"]],
  Asia: [["Korean Air", "대한항공"], ["Asiana Airlines", "아시아나항공"], ["Singapore Airlines", "싱가포르항공"], ["Cathay Pacific", "캐세이퍼시픽"]],
  "North America": [["Korean Air", "대한항공"], ["Delta Air Lines", "델타항공"], ["United Airlines", "유나이티드항공"], ["American Airlines", "아메리칸항공"]]
};

const airlineNameKo = {
  "Korean Air": "대한항공", "Asiana Airlines": "아시아나항공", "Jeju Air": "제주항공", "Japan Airlines": "일본항공",
  "Delta Air Lines": "델타항공", "United Airlines": "유나이티드항공", "Iberia": "이베리아항공", "Lufthansa": "루프트한자",
  "Air France": "에어프랑스", "Avianca": "아비앙카항공", "LATAM Airlines": "라탐항공", "American Airlines": "아메리칸항공"
};

const localizedVenueNames = {
  "Bestia": "베스티아", "Republique": "레퓌블리크", "Guelaguetza": "겔라게차", "Grand Central Market": "그랜드 센트럴 마켓",
  "The Modern": "더 모던", "Keens Steakhouse": "킨스 스테이크하우스", "Rubirosa": "루비로사", "Joe's Shanghai": "조스 상하이",
  "Sushi Dai": "스시다이", "Ichiran Ramen": "이치란 라멘", "Gyukatsu Motomura": "규카츠 모토무라", "Gonpachi": "곤파치",
  "Sobrino de Botin": "소브리노 데 보틴", "Casa Lucio": "카사 루시오", "Sala de Despiece": "살라 데 데스피에세", "Chocolateria San Gines": "쇼콜라테리아 산 히네스",
  "InterContinental Los Angeles Downtown": "인터컨티넨탈 로스앤젤레스 다운타운", "Conrad Los Angeles": "콘래드 로스앤젤레스",
  "citizenM Los Angeles Downtown": "시티즌M 로스앤젤레스 다운타운", "Freehand Los Angeles": "프리핸드 로스앤젤레스"
};

const cityProfileOverride = (code, city) => {
  const normalized = String(city || "").trim().toLowerCase();
  const primaryCities = {
    US: ["new york", "뉴욕"], ES: ["madrid", "마드리드"],
    JP: ["tokyo", "도쿄"], CO: ["bogotá", "bogota", "보고타"]
  };
  if (primaryCities[code]?.includes(normalized)) return null;
  if (["los angeles", "로스앤젤레스", "la", "l.a."].includes(normalized)) {
    return {
      hotels: ["InterContinental Los Angeles Downtown", "Conrad Los Angeles", "citizenM Los Angeles Downtown", "Freehand Los Angeles"],
      hotelPrices: [[260000, 520000], [420000, 760000], [190000, 360000], [150000, 310000]],
      transfer: "LAX FlyAway bus, Metro connection, taxi, or licensed airport transfer"
    };
  }
  const hotelPriceDefaults = {
    US: [[220000, 480000], [350000, 680000], [170000, 340000], [120000, 270000]],
    ES: [[180000, 390000], [280000, 560000], [140000, 300000], [100000, 230000]],
    JP: [[170000, 380000], [280000, 580000], [130000, 270000], [90000, 190000]],
    CO: [[130000, 300000], [220000, 470000], [100000, 240000], [70000, 170000]]
  };
  return {
    hotels: [`${city} Central Hotel`],
    hotelPrices: hotelPriceDefaults[code] || [[160000, 360000], [260000, 520000], [120000, 280000], [90000, 210000]],
    transfer: `Official airport rail, bus, taxi, or licensed transfer serving ${city}`
  };
};

const cityRestaurantProfiles = {
  "new york": [
    ["The Modern", 4.6, 85000, 180000], ["Keens Steakhouse", 4.5, 90000, 190000],
    ["Rubirosa", 4.6, 35000, 75000], ["Joe's Shanghai", 4.3, 25000, 60000]
  ],
  "los angeles": [
    ["Bestia", 4.6, 65000, 140000], ["Republique", 4.6, 45000, 110000],
    ["Guelaguetza", 4.5, 25000, 60000], ["Grand Central Market", 4.5, 18000, 45000]
  ],
  "washington, d.c.": [
    ["Old Ebbitt Grill", 4.6, 45000, 95000], ["Le Diplomate", 4.6, 55000, 120000],
    ["Founding Farmers", 4.4, 35000, 75000], ["Ben's Chili Bowl", 4.5, 15000, 35000]
  ],
  "san francisco": [
    ["State Bird Provisions", 4.6, 70000, 150000], ["House of Prime Rib", 4.7, 85000, 170000],
    ["Swan Oyster Depot", 4.6, 45000, 95000], ["Tartine Manufactory", 4.5, 25000, 60000]
  ],
  chicago: [
    ["Girl & the Goat", 4.6, 60000, 130000], ["Bavette's Bar & Boeuf", 4.7, 90000, 190000],
    ["Lou Malnati's", 4.5, 25000, 55000], ["Portillo's", 4.4, 15000, 35000]
  ],
  miami: [
    ["Joe's Stone Crab", 4.5, 85000, 190000], ["Mandolin Aegean Bistro", 4.6, 50000, 110000],
    ["Versailles", 4.5, 25000, 55000], ["La Sandwicherie", 4.6, 15000, 35000]
  ],
  madrid: [
    ["Sobrino de Botin", 4.4, 55000, 120000], ["Casa Lucio", 4.3, 50000, 110000],
    ["Sala de Despiece", 4.5, 45000, 95000], ["Chocolateria San Gines", 4.4, 12000, 30000]
  ],
  barcelona: [
    ["Disfrutar", 4.8, 180000, 320000], ["Can Culleretes", 4.5, 40000, 85000],
    ["El Xampanyet", 4.5, 30000, 65000], ["La Paradeta", 4.4, 30000, 70000]
  ],
  seville: [
    ["El Rinconcillo", 4.4, 30000, 70000], ["Eslava", 4.6, 35000, 80000],
    ["La Azotea", 4.5, 40000, 90000], ["Bodega Santa Cruz", 4.4, 18000, 45000]
  ],
  tokyo: [
    ["Sushi Dai", 4.7, 45000, 95000], ["Ichiran Ramen", 4.5, 12000, 25000],
    ["Gyukatsu Motomura", 4.6, 22000, 48000], ["Gonpachi", 4.3, 35000, 80000]
  ],
  osaka: [
    ["Mizuno", 4.4, 15000, 35000], ["Kani Doraku Dotonbori", 4.3, 45000, 100000],
    ["Ajinoya Honten", 4.5, 15000, 35000], ["Harukoma Sushi", 4.4, 25000, 60000]
  ],
  kyoto: [
    ["Kikunoi Roan", 4.5, 100000, 220000], ["Omen Ginkaku-ji", 4.4, 18000, 40000],
    ["Izuju Sushi", 4.3, 22000, 50000], ["Nishiki Warai", 4.3, 18000, 42000]
  ]
};

const restaurantProfileForCity = (city) => {
  const normalized = String(city || "").trim().toLowerCase();
  const aliases = {
    "뉴욕": "new york", "로스앤젤레스": "los angeles", "워싱턴 d.c.": "washington, d.c.",
    "샌프란시스코": "san francisco", "시카고": "chicago", "마이애미": "miami",
    "마드리드": "madrid", "바르셀로나": "barcelona", "세비야": "seville",
    "도쿄": "tokyo", "오사카": "osaka", "교토": "kyoto"
  };
  const key = aliases[normalized] || normalized;
  return cityRestaurantProfiles[key] || [
    [`${city} Local Table`, 4.6, 30000, 75000], [`${city} Market Kitchen`, 4.5, 22000, 60000],
    [`${city} Dining Room`, 4.4, 45000, 110000], [`${city} Neighborhood Cafe`, 4.5, 12000, 35000]
  ];
};

function adaptTravelResultToDestination(result) {
  const code = result.country || result.countryProfile?.code || result.destination?.code;
  const continent = result.destination?.continent || result.countryProfile?.continent || "";
  const profileCode = String(code || "global").toLowerCase();
  const city = result.destination?.city || result.countryProfile?.capital || "the destination";
  const cityKo = result.destination?.cityKo || result.countryProfile?.capitalKo || city;
  const livePlaces = findLiveProvider(result, "local_places");
  const liveHotelNames = (livePlaces?.items || []).filter((item) => item.kind === "hotel").map((item) => item.label).slice(0, 6);
  const liveRestaurantPlaces = (livePlaces?.items || []).filter((item) => item.kind === "restaurant").slice(0, 6);
  const regionalFareRanges = {
    KR: [[90000, 220000], [100000, 250000], [70000, 190000], [120000, 280000]],
    CN: [[280000, 620000], [300000, 680000], [220000, 520000], [340000, 740000]],
    VN: [[350000, 780000], [380000, 820000], [260000, 650000], [420000, 900000]],
    TH: [[420000, 900000], [450000, 950000], [320000, 760000], [480000, 1020000]],
    SG: [[500000, 1050000], [530000, 1100000], [390000, 850000], [560000, 1180000]],
    AU: [[1050000, 2100000], [1150000, 2250000], [900000, 1850000], [1200000, 2350000]],
    CA: [[1750000, 2850000], [1650000, 2700000], [1800000, 2950000], [1600000, 2650000]],
    GB: [[1450000, 2550000], [1400000, 2450000], [1500000, 2600000], [1380000, 2400000]],
    FR: [[1450000, 2550000], [1400000, 2450000], [1500000, 2600000], [1380000, 2400000]],
    DE: [[1400000, 2500000], [1350000, 2400000], [1450000, 2550000], [1330000, 2350000]],
    IT: [[1500000, 2700000], [1450000, 2600000], [1550000, 2750000], [1420000, 2500000]],
    MX: [[1900000, 3200000], [1850000, 3100000], [2000000, 3350000], [1800000, 3000000]],
    GT: [[2300000, 3900000], [2200000, 3700000], [2250000, 3800000], [2350000, 4000000]],
    BZ: [[2400000, 4100000], [2300000, 3950000], [2350000, 4000000], [2450000, 4200000]],
    CR: [[2200000, 3800000], [2150000, 3700000], [2250000, 3900000], [2300000, 3950000]],
    SV: [[2250000, 3850000], [2150000, 3700000], [2200000, 3800000], [2300000, 3950000]],
    HN: [[2300000, 3950000], [2200000, 3800000], [2250000, 3900000], [2350000, 4050000]],
    NI: [[2300000, 4000000], [2200000, 3850000], [2250000, 3950000], [2350000, 4100000]],
    PA: [[2150000, 3700000], [2200000, 3800000], [2250000, 3900000], [2100000, 3650000]]
  };
  const fareRangesByContinent = {
    "Central America": [[2200000, 4000000], [2150000, 3900000], [2250000, 4100000], [2300000, 4200000]],
    Caribbean: [[2200000, 4100000], [2150000, 4000000], [2250000, 4200000], [2300000, 4300000]],
    "South America": [[2100000, 3900000], [2050000, 3800000], [2150000, 4000000], [2200000, 4100000]],
    Europe: [[1350000, 2700000], [1300000, 2600000], [1400000, 2750000], [1450000, 2850000]],
    Africa: [[1600000, 3200000], [1550000, 3100000], [1650000, 3300000], [1700000, 3400000]],
    "Middle East": [[1000000, 2200000], [1050000, 2300000], [1100000, 2400000], [1150000, 2500000]],
    Oceania: [[1050000, 2400000], [1100000, 2500000], [1150000, 2600000], [1200000, 2700000]],
    Asia: [[350000, 1300000], [380000, 1400000], [420000, 1500000], [450000, 1600000]],
    "North America": [[1650000, 3100000], [1600000, 3000000], [1700000, 3200000], [1750000, 3300000]]
  };
  const genericPrices = regionalFareRanges[code] || fareRangesByContinent[continent] || [[1400000, 3000000], [1350000, 2900000], [1450000, 3100000], [1500000, 3200000]];
  const nightlyRangesByContinent = {
    "Central America": [[90000, 240000], [150000, 360000], [70000, 180000], [50000, 130000]],
    Caribbean: [[140000, 380000], [240000, 600000], [100000, 280000], [70000, 190000]],
    "South America": [[90000, 250000], [160000, 400000], [70000, 190000], [50000, 140000]],
    Europe: [[160000, 420000], [280000, 700000], [120000, 320000], [90000, 240000]],
    Africa: [[90000, 260000], [170000, 450000], [70000, 190000], [50000, 140000]],
    "Middle East": [[150000, 420000], [300000, 850000], [110000, 300000], [80000, 220000]],
    Oceania: [[170000, 450000], [300000, 750000], [130000, 340000], [100000, 260000]],
    Asia: [[100000, 300000], [200000, 550000], [80000, 220000], [60000, 160000]],
    "North America": [[170000, 480000], [320000, 800000], [130000, 360000], [90000, 260000]]
  };
  const baseProfile = destinationPrototypeProfiles[code] || {
    airlines: airlineProfilesByCountry[code] || airlineProfilesByContinent[continent] || airlineProfilesByContinent.Asia,
    flightPrices: genericPrices,
    hotels: liveHotelNames.length ? liveHotelNames : [`${city} Central Hotel`],
    hotelPrices: nightlyRangesByContinent[continent] || [[120000, 340000], [220000, 560000], [90000, 250000], [70000, 180000]],
    transfer: `Official airport rail, bus, taxi, or licensed transfer in ${city}`
  };
  const cityOverride = cityProfileOverride(code, city);
  const profile = cityOverride ? { ...baseProfile, ...cityOverride } : { ...baseProfile };
  const hotelFallbacks = [
    `${city} Central Hotel`,
    `${city} Premium Hotel`,
    `${city} Best-Value Stay`,
    `${city} Budget Hotel`,
    `${city} Flexible Stay`
  ];
  const hotelPool = [...new Set([...liveHotelNames, ...(profile.hotels || []), ...hotelFallbacks])];
  profile.hotels = hotelPool.slice(0, hotelPool.length >= 6 ? 6 : 4);
  const flightReasons = [
    [`Best overall itinerary option for ${city}.`, `${cityKo}행 일정 중 전체 균형이 가장 좋은 옵션입니다.`],
    [`Service-focused itinerary option for ${city}.`, `${cityKo}행 서비스 중심 일정 옵션입니다.`],
    [`Best budget-conscious option when price and flexible timing matter most.`, `가격과 유연한 일정이 가장 중요할 때 적합한 가성비 옵션입니다.`],
    [`Best quality alternative for travelers prioritizing reliability and onboard experience.`, `안정성과 기내 경험을 우선하는 여행자에게 적합한 고품질 대안입니다.`]
  ];
  const hotelReasons = [
    [`Best overall balance of location, guest experience, and estimated nightly price in ${city}.`, `${cityKo}에서 위치, 숙박 경험과 예상 1박 가격의 균형이 가장 좋습니다.`],
    [`Best premium-service option for comfort, facilities, and consistent hospitality.`, `편안함, 시설과 안정적인 서비스를 중시할 때 적합한 프리미엄 옵션입니다.`],
    [`Best value option for balancing location and total stay cost.`, `위치와 전체 숙박비의 균형을 맞추기 좋은 가성비 옵션입니다.`],
    [`Best budget option for keeping accommodation costs lower while retaining practical access.`, `실용적인 접근성을 유지하면서 숙박비를 낮추기 좋은 예산형 옵션입니다.`]
  ];
  const tripMultiplier = result.tripType === "one_way" ? 0.62 : 1;
  const travelerCount = Math.max(1, Number(
    result.followUp?.answers?.adults || result.travelerCount || result.travelers || 1
  ));
  const priceFor = (index) => {
    const range = profile.flightPrices?.[index] || profile.flightPrices?.[0] || [420000, 760000];
    return {
      currency: "KRW",
      min: Math.round(range[0] * tripMultiplier * travelerCount / 10000) * 10000,
      max: Math.round(range[1] * tripMultiplier * travelerCount / 10000) * 10000
    };
  };
  const flights = profile.airlines.map((providerEntry, index) => {
    const provider = Array.isArray(providerEntry) ? providerEntry[0] : providerEntry;
    const providerKo = Array.isArray(providerEntry) ? providerEntry[1] : (airlineNameKo[provider] || provider);
    return {
      ...(result.flights?.[index] || result.flights?.[0] || {}),
      id: `flight-${profileCode}-${index + 1}`,
      provider,
      providerKo,
      category: index === 0 ? "recommended" : "alternative",
      estimatedPrice: priceFor(index),
      priceBasis: "prototype_market_estimate",
      reason: flightReasons[index]?.[0] || `Practical prototype flight option for ${city}.`,
      reasonKo: flightReasons[index]?.[1] || `${cityKo} 노선의 실용적인 프로토타입 항공 옵션입니다.`
    };
  });
  const hotels = profile.hotels.map((name, index) => ({
    ...(result.hotels?.[index] || result.hotels?.[0] || {}),
    id: `hotel-${profileCode}-${index + 1}`,
    name,
    nameKo: localizedVenueNames[name] || name,
    category: index === 0 ? "recommended" : index === 1 ? "premium" : index === 2 ? "value" : "budget",
    estimatedNightlyPrice: profile.hotelPrices?.[index]
      ? { currency: "KRW", min: profile.hotelPrices[index][0], max: profile.hotelPrices[index][1] }
      : (result.hotels?.[index]?.estimatedNightlyPrice || result.hotels?.[0]?.estimatedNightlyPrice),
    reason: hotelReasons[index]?.[0] || `Practical prototype accommodation option in ${city}.`,
    reasonKo: hotelReasons[index]?.[1] || `${cityKo}의 실용적인 프로토타입 숙소 옵션입니다.`
  }));
  const restaurantCandidates = liveRestaurantPlaces.length
    ? liveRestaurantPlaces.map((place, index) => [place.label, null, [30000, 22000, 45000, 18000, 35000, 25000][index] || 25000, [75000, 60000, 110000, 50000, 85000, 65000][index] || 65000, place.cuisine, place.source])
    : restaurantProfileForCity(city);
  const restaurants = restaurantCandidates.map(([name, rating, min, max, cuisine, source], index) => ({
    ...(result.restaurants?.[index] || {}),
    id: `restaurant-${profileCode}-${index + 1}`,
    type: name,
    typeKo: localizedVenueNames[name] || name,
    venueName: name,
    venueNameKo: localizedVenueNames[name] || name,
    rating,
    cuisine: cuisine || "",
    providerSource: source || "Prototype curated fallback",
    livePlaceName: Boolean(liveRestaurantPlaces.length),
    estimatedPrice: { currency: "KRW", min, max },
    recommendation: `Prototype dining option matched to ${city}; price and availability require final provider confirmation.`,
    recommendationKo: `${cityKo} 일정에 맞춘 프로토타입 식당 옵션입니다. 가격과 예약 가능 여부는 제공업체 최종 확인이 필요합니다.`,
    editable: true
  }));
  const startDate = result.schedule?.startDate;
  const endDate = result.schedule?.endDate;
  const tripNights = startDate && endDate
    ? Math.max(1, Math.round((new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) / 86400000))
    : Math.max(1, Number(result.durationDays || 2) - 1);
  const flightsBudget = flights[0]?.estimatedPrice || result.budget?.flights;
  const nightlyBudget = hotels[0]?.estimatedNightlyPrice || result.budget?.hotel;
  const hotelBudget = nightlyBudget ? {
    currency: nightlyBudget.currency || "KRW",
    min: Number(nightlyBudget.min || 0) * tripNights,
    max: Number(nightlyBudget.max || 0) * tripNights
  } : result.budget?.hotel;
  const foodBudget = {
    currency: "KRW",
    min: restaurants.reduce((sum, restaurant) => sum + Number(restaurant.estimatedPrice?.min || 0), 0),
    max: restaurants.reduce((sum, restaurant) => sum + Number(restaurant.estimatedPrice?.max || 0), 0)
  };
  const budgetParts = [flightsBudget, hotelBudget, foodBudget, result.budget?.transport, result.budget?.activities].filter(Boolean);
  const estimatedTotal = {
    currency: budgetParts[0]?.currency || "KRW",
    min: budgetParts.reduce((sum, range) => sum + Number(range.min || 0), 0),
    max: budgetParts.reduce((sum, range) => sum + Number(range.max || 0), 0)
  };

  return {
    ...result,
    flights,
    hotels,
    restaurants,
    budget: { ...result.budget, flights: flightsBudget, hotel: hotelBudget, food: foodBudget, estimatedTotal },
    airportTransfer: {
      ...result.airportTransfer,
      recommended: { en: profile.transfer, ko: profile.transfer },
      reason: {
        en: `Prototype transfer recommendation for arrival in ${city}.`,
        ko: `${cityKo} 도착 기준 프로토타입 이동 추천입니다.`
      },
      options: [
        { en: profile.transfer, ko: profile.transfer },
        { en: "Pre-arranged private transfer", ko: "사전 예약 전용 차량" },
        { en: "Official airport public transport", ko: "공식 공항 대중교통" }
      ]
    },
    exchangeRate: { ...result.exchangeRate, to: result.countryProfile?.currency || result.exchangeRate?.to }
  };
}

const createExchangeBudgetCard = (result) => {
  const provider = findLiveProvider(result, "currency");
  const localCode = result.exchangeRate?.from || result.budget?.currency || "KRW";
  const destinationCode = result.exchangeRate?.to || result.countryProfile?.currency || "USD";
  const total = result.budget?.estimatedTotal;
  const formatAmount = (amount, code) => new Intl.NumberFormat(activeLanguage === "ko" ? "ko-KR" : "en-US", {
    style: "currency", currency: code, maximumFractionDigits: code === "KRW" ? 0 : 2
  }).format(amount);
  const rangeWithRate = (rate, code) => Number.isFinite(rate) && total
    ? `${formatAmount(total.min * rate, code)} – ${formatAmount(total.max * rate, code)}`
    : (activeLanguage === "ko" ? "실시간 환율 확인 필요" : "Live rate required");
  const destinationRate = Number(provider?.items?.find((item) => item.to === destinationCode)?.rate ?? provider?.items?.[0]?.value);
  const usdRate = Number(provider?.items?.find((item) => item.to === "USD")?.rate);
  const items = [
    `${localCode}: ${total ? `${formatAmount(total.min, localCode)} – ${formatAmount(total.max, localCode)}` : "—"}`,
    `USD: ${rangeWithRate(usdRate, "USD")}`,
    `${destinationCode}: ${rangeWithRate(destinationRate, destinationCode)}`,
    localize(result.exchangeRate?.message)
  ];
  return createListCard({ id: "exchange-rate", title: t("exchangeRate"), label: provider ? (activeLanguage === "ko" ? "실시간 데이터" : "Live data") : t("apiPlaceholder"), items, wide: true, editable: false });
};

const createWeatherForecastCard = (result) => {
  const provider = findLiveProvider(result, "weather");
  const items = provider?.items?.length
    ? provider.items.map((item) => {
      const date = new Date(`${item.label}T00:00:00`);
      const weekday = new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : "en-US", { weekday: "long" }).format(date);
      return activeLanguage === "ko"
        ? `${weekday} · 날짜 ${item.label} · 기온 ${item.value} · 습도 ${item.humidity || "—"} · 강수확률 ${item.precipitation || "—"}`
        : `${weekday} · Date ${item.label} · Temperature ${item.value} · Humidity ${item.humidity || "—"} · Rain chance ${item.precipitation || "—"}`;
    })
    : [localize(result.weather?.message)];
  return createListCard({ id: "weather", title: t("weather"), label: provider ? (activeLanguage === "ko" ? "실시간 예보" : "Live forecast") : t("apiPlaceholder"), items, wide: true, editable: false });
};

const createPublicResourceCard = (result, category, title, label) => {
  const provider = (result?.providerResults || []).find((item) => item.category === category);
  if (!provider?.items?.length) return null;
  const items = provider.items.map((item) => {
    const url = String(item.url || "");
    const safeUrl = /^https:\/\//i.test(url) ? url : "";
    const text = [item.label, item.value].filter(Boolean).map(escapeSummaryText).join(" · ");
    return safeUrl ? `<a href="${escapeSummaryText(safeUrl)}" target="_blank" rel="noopener noreferrer">${text}</a>` : text;
  });
  return createListCard({ id: category.replaceAll("_", "-"), title, label, items, wide: true, editable: false });
};

const createScheduleCard = (result) => {
  const schedule = result.schedule;
  if (!schedule?.startDate || !schedule?.endDate) return null;
  const locale = activeLanguage === "ko" ? "ko-KR" : "en-US";
  const formatDate = (value) => new Intl.DateTimeFormat(locale, currentResult?.portableShare
    ? { weekday: "short", year: "numeric", month: "short", day: "numeric" }
    : { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date(`${value}T00:00:00`));
  const timeLabels = activeLanguage === "ko"
    ? { any: "시간 무관", morning: "오전 06:00–12:00", afternoon: "오후 12:00–17:00", evening: "저녁 17:00–22:00" }
    : { any: "Any time / No preference", morning: "Morning 06:00–12:00", afternoon: "Afternoon 12:00–17:00", evening: "Evening 17:00–22:00" };
  const article = document.createElement("article");
  article.className = "mission-card is-wide is-locked-card schedule-result-card";
  article.dataset.cardId = "schedule";
  article.innerHTML = `
    <div class="card-top">
      <div class="card-title-group"><h2 class="card-title">${activeLanguage === "ko" ? "선택 일정" : "Selected Schedule"}</h2></div>
      <span class="card-label">${activeLanguage === "ko" ? "확정" : "Confirmed"}</span>
    </div>
    <div class="schedule-result-dates">
      <div class="schedule-result-value"><strong>${activeLanguage === "ko" ? "시작" : "From"}</strong><span>${formatDate(schedule.startDate)}</span></div>
      <div class="schedule-result-value"><strong>${activeLanguage === "ko" ? "종료" : "To"}</strong><span>${formatDate(schedule.endDate)}</span></div>
    </div>
    <div class="schedule-result-time"><strong>${activeLanguage === "ko" ? "시간" : "Time"}</strong><span>${timeLabels[schedule.timePreference] || timeLabels.any}</span></div>
  `;
  return article;
};

const renderTravelMission = (result, missionContext) => {
  const recommendedFlight = result.flights?.[0];
  const recommendedHotel = result.hotels?.[0];
  const transfer = result.airportTransfer;
  const checklist = result.checklist || [];
  const restaurants = result.restaurants || [];
  const flightPriceLabel = result.tripType === "one_way"
    ? (activeLanguage === "ko" ? "편도" : "one way")
    : (activeLanguage === "ko" ? "왕복" : "round trip");
  const flightOrigin = result.followUp?.answers?.origin || result.origin || (activeLanguage === "ko" ? "서울" : "Seoul");
  const flightDestination = result.destination?.city || result.destination?.country || result.display?.destination || "Japan";
  const flightSchedule = result.schedule || {};
  const liveFareQuery = [
    `Flights from ${flightOrigin} to ${flightDestination}`,
    flightSchedule.startDate || "",
    result.tripType === "one_way" ? "one way" : `return ${flightSchedule.endDate || ""}`
  ].filter(Boolean).join(" ");
  const liveFareUrl = `https://www.google.com/travel/flights?q=${encodeURIComponent(liveFareQuery)}`;
  const flightVerification = `<p class="flight-estimate-notice"><span>${t("flightEstimateNotice")}</span><a href="${liveFareUrl}" target="_blank" rel="noopener noreferrer">${t("verifyLiveFares")}</a></p>`;
  const transportBudget = result.budget?.transport || { currency: "KRW", min: 120000, max: 280000 };
  const transferPriceRanges = [
    { currency: transportBudget.currency || result.budget?.currency || "KRW", min: Math.round(transportBudget.min * .5), max: Math.round(transportBudget.max * .57) },
    { currency: transportBudget.currency || result.budget?.currency || "KRW", min: Math.round(transportBudget.min * 1.15), max: Math.round(transportBudget.max * 1.35) },
    { currency: transportBudget.currency || result.budget?.currency || "KRW", min: Math.round(transportBudget.min * .17), max: Math.round(transportBudget.max * .22) }
  ];
  const restaurantPriceFallbacks = [
    { currency: "KRW", min: 25000, max: 65000 },
    { currency: "KRW", min: 12000, max: 25000 },
    { currency: "KRW", min: 70000, max: 180000 },
    { currency: "KRW", min: 25000, max: 60000 },
    { currency: "KRW", min: 8000, max: 22000 }
  ];

  missionTitle.textContent = result.display?.title || t("fallbackTitle");
  missionGrid.innerHTML = "";
  const scheduleCard = createScheduleCard(result);
  if (scheduleCard) missionGrid.appendChild(scheduleCard);

  const flightOptions = (result.flights || [])
    .map((flight, index) => makeOptionRow(getFlightName(flight), `${formatRange(flight.estimatedPrice)} · ${flightPriceLabel}`, {
      index, label: getFlightName(flight), reason: activeLanguage === "ko" ? flight.reasonKo || flight.reason : flight.reason, price: flight.estimatedPrice
    }));

  if (!isDomesticContext(missionContext) || missionContext.destination.id === "jeju") missionGrid.appendChild(
    createMissionCard({
      id: "flights",
      title: activeLanguage === "ko" ? "항공권" : "Flights",
      label: "⭐ ONE Pick",
      value: `<span class="recommended-name">${getFlightName(recommendedFlight)}</span><span class="recommended-price">${formatRange(recommendedFlight?.estimatedPrice)} · ${flightPriceLabel}</span>`,
      reason:
        activeLanguage === "ko"
          ? recommendedFlight?.reasonKo || recommendedFlight?.reason || ""
          : recommendedFlight?.reason || "",
      supportingContent: flightVerification,
      options: flightOptions,
      editable: true
    })
  );

  const hotelOptions = (result.hotels || [])
    .map((hotel, index) => makeOptionRow(getHotelName(hotel), formatRange(hotel.estimatedNightlyPrice), {
      index, label: getHotelName(hotel), reason: activeLanguage === "ko" ? hotel.reasonKo || hotel.reason : hotel.reason, price: hotel.estimatedNightlyPrice
    }));

  missionGrid.appendChild(
    createMissionCard({
      id: "hotel",
      title: activeLanguage === "ko" ? "호텔" : "Hotel",
      label: "⭐ ONE Pick",
      value: `<span class="recommended-name">${getHotelName(recommendedHotel)}</span><span class="recommended-price">${formatRange(recommendedHotel?.estimatedNightlyPrice)} / ${activeLanguage === "ko" ? "1박" : "night"}</span>`,
      reason:
        activeLanguage === "ko"
          ? recommendedHotel?.reasonKo || recommendedHotel?.reason || ""
          : recommendedHotel?.reason || "",
      options: hotelOptions,
      editable: true
    })
  );

  if (!isDomesticContext(missionContext)) missionGrid.appendChild(
    createMissionCard({
      id: "airport-transfer",
      title: activeLanguage === "ko" ? "공항 이동" : "Airport Transfer",
      label: "⭐ ONE Pick",
      value: localize(transfer?.recommended),
      reason: localize(transfer?.reason),
      options: (transfer?.options || []).map((option, index) => {
        const reasons = activeLanguage === "ko"
          ? [localize(transfer?.reason), "수하물 이동과 편안함을 우선하는 가장 편리한 옵션입니다.", "공식 대중교통으로 비용을 줄이려는 여행자에게 적합한 예산형 옵션입니다."]
          : [localize(transfer?.reason), "Best comfort option when luggage handling and convenience matter most.", "Best budget option for travelers comfortable using official public transport."];
        const types = activeLanguage === "ko" ? ["균형형", "편의 중심", "예산 중심"] : ["Balanced", "Best comfort", "Best budget"];
        const price = transferPriceRanges[index] || transferPriceRanges[0];
        return makeOptionRow(localize(option), `${types[index] || types[0]} · ${formatRange(price)}`, { index, label: localize(option), reason: reasons[index] || reasons[0], price });
      }),
      editable: true
    })
  );

  if (isDomesticContext(missionContext)) missionGrid.appendChild(
    createMissionCard({
      id: "local-transport",
      title: activeLanguage === "ko" ? "이동" : activeLanguage === "es" ? "Transporte" : "Getting Around",
      label: "⭐ ONE Pick",
      value: missionContext.transport.slice(0, 2).join(" · "),
      reason: activeLanguage === "ko" ? "거리와 이동 시간을 기준으로 가장 자연스러운 동선을 먼저 골랐어요." : activeLanguage === "es" ? "Elegí la ruta más natural según la distancia y el tiempo." : "ONE picked the most natural route for the distance and available time.",
      options: missionContext.transport.map((option, index) => makeOptionRow(option, "", { index, label: option })),
      editable: true
    })
  );

  missionGrid.appendChild(
    createListCard({
      id: "checklist",
      title: activeLanguage === "ko" ? "여행 체크리스트" : "Travel Checklist",
      label: activeLanguage === "ko" ? "준비" : "Prepared",
      items: checklist.map((item) => localize(item)),
      wide: true,
      editable: true
    })
  );

  missionGrid.appendChild(
    createMissionCard({
      id: "visa-legacy",
      title: t("visa"),
      label: t("verifyVisa"),
      value: activeLanguage === "ko" ? "실행 전 확인 필요" : "Verification required",
      reason: localize(result.visa?.message),
      options: [],
      editable: false
    })
  );

  missionGrid.querySelector('[data-card-id="visa-legacy"]')?.remove();
  if (!isDomesticContext(missionContext)) missionGrid.appendChild(createVisaVerificationCard(result));

  missionGrid.appendChild(
    createListCard({
      id: "restaurants",
      title: activeLanguage === "ko" ? "레스토랑" : "Restaurants",
      label: activeLanguage === "ko" ? "프로토타입 가격" : "Prototype prices",
      items: restaurants.map((restaurant, index) => {
        const price = formatRange(restaurant.estimatedPrice || restaurantPriceFallbacks[index] || restaurantPriceFallbacks[0]);
        const countryCode = result.country || result.countryProfile?.code || "JP";
        const venue = restaurantVenueProfiles[countryCode]?.[index];
        const venueName = activeLanguage === "ko"
          ? restaurant.venueNameKo || restaurant.venueName || restaurant.typeKo || venue?.ko || restaurant.type
          : restaurant.venueName || restaurant.type || venue?.en;
        const rating = restaurant.rating || venue?.rating;
        const cuisine = restaurant.cuisine ? String(restaurant.cuisine).replaceAll(";", " · ") : "";
        const facts = [rating ? `★ ${rating}` : "", cuisine, `${activeLanguage === "ko" ? "1인 예상" : "per person"} ${price}`].filter(Boolean).join('<span aria-hidden="true"> · </span>');
        return `<span class="restaurant-entry"><strong class="restaurant-name">${venueName}</strong><small class="restaurant-meta"><span aria-hidden="true"> · </span>${facts}</small></span>`;
      }),
      itemDetails: restaurants.map((restaurant, index) => ({ price: restaurant.estimatedPrice || restaurantPriceFallbacks[index] || restaurantPriceFallbacks[0] })),
      wide: true,
      editable: true
    })
  );

  missionGrid.appendChild(createBudgetCard(result.budget));

  missionGrid.appendChild(createWeatherForecastCard(result));

  missionGrid.appendChild(createExchangeBudgetCard(result));

  const advisoryCard = createPublicResourceCard(result, "travel_advisory", activeLanguage === "ko" ? "공식 여행 안전 정보" : "Official Travel Advice", activeLanguage === "ko" ? "공식 자료" : "Official source");
  if (advisoryCard) missionGrid.appendChild(advisoryCard);
  const resourcesCard = createPublicResourceCard(result, "travel_resources", activeLanguage === "ko" ? "여행 전 추천 자료" : "Before You Go", activeLanguage === "ko" ? "무료 공개 자료" : "Free public resources");
  if (resourcesCard) missionGrid.appendChild(resourcesCard);

};

const renderGeneralMission = (result) => {
  missionTitle.textContent = result.display?.title || result.rawInput || (activeLanguage === "ko" ? "미션 계획" : "Mission Plan");
  missionGrid.innerHTML = "";
  const scheduleCard = createScheduleCard(result);
  if (scheduleCard) missionGrid.appendChild(scheduleCard);

  const detailLabels = {
    tutors: ["Matched tutor profiles", "튜터 프로필 매칭"], style: ["Teaching approach compared", "수업 방식 비교"],
    format: ["Online and offline options", "온라인·오프라인 선택지"], experience: ["Experience verified before selection", "선택 전 경력 확인"],
    price: ["Price ranges compared", "가격대 비교"], languages: ["Teaching languages checked", "수업 언어 확인"],
    availability: ["Available schedules prepared", "가능 일정 준비"], questions: ["Interview questions prepared", "인터뷰 질문 준비"],
    trial: ["Trial lesson prepared", "체험 수업 준비"], recommended_product: ["Best-fit option selected", "최적 제품 선정"],
    alternative_products: ["Alternatives compared", "대안 제품 비교"], price_comparison: ["Prices compared", "가격 비교"],
    where_to_buy: ["Trusted sellers prepared", "신뢰할 판매처 준비"], warranty: ["Warranty terms checked", "보증 조건 확인"],
    delivery: ["Delivery options checked", "배송 옵션 확인"], housing_options: ["Matching homes shortlisted", "조건에 맞는 주거 후보"],
    area_comparison: ["Areas compared", "지역 비교"], documents: ["Required documents prepared", "필요 서류 준비"],
    risks: ["Important risks identified", "주요 위험 확인"], lawyer_type: ["Relevant specialist identified", "적합한 전문가 유형 확인"],
    process: ["Expected process outlined", "예상 절차 정리"], visa: ["Requirements prepared for verification", "확인할 요건 준비"],
    housing: ["Housing options prepared", "주거 옵션 준비"], shipping: ["Shipping options prepared", "배송 옵션 준비"],
    banking: ["Banking setup prepared", "은행 업무 준비"], insurance: ["Insurance options prepared", "보험 옵션 준비"],
    schools: ["School options prepared", "학교 옵션 준비"], registration: ["Registration steps prepared", "등록 단계 준비"],
    tax: ["Tax and accounting checklist prepared", "세금·회계 체크리스트 준비"], brand: ["Brand and domain options prepared", "브랜드·도메인 옵션 준비"],
    suppliers: ["Supplier shortlist prepared", "공급업체 후보 준비"], clinic: ["Clinic options shortlisted", "병원 후보 준비"],
    appointment: ["Appointment requirements prepared", "예약 요건 준비"], cost: ["Cost range estimated", "예상 비용 범위 준비"],
    loan_options: ["Suitable options compared", "적합한 옵션 비교"], rates: ["Rates prepared for comparison", "금리 비교 준비"],
    targets: ["Targets shortlisted", "목표 후보 준비"], resume: ["Resume plan prepared", "이력서 계획 준비"],
    interview: ["Interview plan prepared", "면접 계획 준비"], recruiters: ["Recruiter options prepared", "리크루터 후보 준비"],
    vendors: ["Vendors shortlisted", "업체 후보 준비"], timeline: ["Timeline prepared", "일정 준비"],
    budget: ["Estimated budget prepared", "예상 예산 준비"], reservations: ["Reservation options prepared", "예약 옵션 준비"],
    checklist: ["Action checklist prepared", "실행 체크리스트 준비"], mission_plan: ["Mission plan structured", "미션 계획 구성"],
    options: ["Relevant options prepared", "관련 선택지 준비"]
  };

  const serviceCards = Array.isArray(result.cards) ? result.cards.filter((card) => !card.removed) : [];
  serviceCards.forEach((card) => {
    const detail = detailLabels[card.id];
    const preparedText = detail
      ? detail[activeLanguage === "ko" ? 1 : 0]
      : (activeLanguage === "ko" ? "관련 선택지를 준비했습니다" : "Relevant options prepared");
    missionGrid.appendChild(createListCard({
      id: card.id,
      title: localize(card.title) || card.title || card.id,
      label: activeLanguage === "ko" ? "준비 완료" : "Prepared",
      items: [preparedText, activeLanguage === "ko" ? "수정 및 비교 가능" : "Ready to customize and compare"],
      wide: false,
      editable: result.type !== "legal" && !["visa", "risks"].includes(card.id)
    }));
  });

  if (serviceCards.length === 0) missionGrid.appendChild(createListCard({
    id: "mission-steps",
    title: activeLanguage === "ko" ? "미션 단계" : "Mission Steps",
    label: activeLanguage === "ko" ? "준비됨" : "Prepared",
    items: (result.steps || []).map((step) => step.title || step.label || step.id),
    wide: true
  }));

  missionGrid.appendChild(createListCard({
    id: "assumptions",
    title: activeLanguage === "ko" ? "계획 기준" : "Planning Assumptions",
    label: activeLanguage === "ko" ? "확인" : "Review",
    items: result.assumptions || [],
    wide: true
  }));

  missionGrid.appendChild(createListCard({
    id: "risks",
    title: activeLanguage === "ko" ? "확인 사항" : "Things to Check",
    label: activeLanguage === "ko" ? "중요" : "Important",
    items: result.risks || [],
    wide: true
  }));

  const learningResources = createPublicResourceCard(result, "learning_resources", activeLanguage === "ko" ? "추천 학습 자료" : "Recommended Learning Resources", activeLanguage === "ko" ? "무료 공개 자료" : "Free public resources");
  if (learningResources) missionGrid.appendChild(learningResources);

  missionGrid.appendChild(createListCard({
    id: "information-sources",
    title: activeLanguage === "ko" ? "정보 출처" : "Information Sources",
    label: activeLanguage === "ko" ? "프로토타입" : "Prototype",
    items: (result.providerResults || result.providers || []).map((provider) => {
      const name = provider.provider || provider.name || provider.category;
      const status = provider.liveData
        ? (activeLanguage === "ko" ? "실시간 공개 데이터" : "Live public data")
        : (activeLanguage === "ko" ? "데모용 준비 데이터" : "Demo-ready data");
      return `${name} — ${status}`;
    }),
    wide: true,
    editable: false
  }));

};

const isExperienceMission = (result, context) => {
  const mission = String(result?.originalMission || result?.rawInput || result?.mission || "");
  if (context?.providerEligibility?.experience === false || context?.requiresInternationalTravel) return false;
  return context?.purpose?.value === "romance" || /date|데이트|기념일|anniversary|weekend.{0,12}(?:plan|outing)|주말.{0,12}(?:데이트|나들이|여행)|hangout|나들이|salida romántica|cita/i.test(mission);
};

const renderGeneratedExperienceMission = (result) => {
  const mission = result?.originalMission || result?.rawInput || result?.mission || (activeLanguage === "ko" ? "새로운 경험" : "New experience");
  missionTitle.textContent = mission;
  missionGrid.innerHTML = "";
  const memoryEnabled = missionMemoryEnabled();
  const previousExperiences = memoryEnabled ? readMissionMemories().flatMap((row) => row.preferences || row.favoriteLocations || []).map(String) : [];
  currentExperienceReview = buildExperienceIntelligence({ mission, goal: mission, language: activeLanguage, budget: result?.budget?.total, memoryEnabled, previousExperiences, context: result.missionContext });
  const generated = currentExperienceReview.generatedExperience;
  const one = generated.onePick;
  const local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
  const disclosure = document.querySelector(".prototype-disclosure");
  if (disclosure) disclosure.textContent = local("Prototype · personalized experience plan · no booking made", "프로토타입 · 맞춤 경험 계획 · 실제 예약 아님", "Prototipo · experiencia personalizada · sin reservas");

  missionGrid.appendChild(createMissionCard({
    id: "generated-one-pick",
    title: local("Your experience", "당신을 위한 경험", "Tu experiencia"),
    label: "⭐ ONE Pick",
    value: currentExperienceReview.recommendation,
    reason: one.reasoning,
    options: generated.alternatives
      .filter((alternative) => alternative !== currentExperienceReview.recommendation)
      .map((alternative, index) => makeOptionRow(alternative, "", { index, label: alternative, selected: false })),
    editable: true,
    selectionMode: "multiple"
  }));
  missionGrid.appendChild(createListCard({
    id: "generated-timeline",
    title: local("The story of your day", "하루의 이야기", "La historia del día"),
    label: local("Created for you", "맞춤 구성", "Creado para ti"),
    items: one.timeline.map((item) => `${item.time} · ${item.title}`),
    wide: true,
    editable: true
  }));
  missionGrid.appendChild(createListCard({
    id: "generated-food",
    title: local("Food moments", "음식과 디저트", "Momentos gastronómicos"),
    label: local("Balanced variety", "다양하게 구성", "Variedad equilibrada"),
    items: one.foods,
    wide: true,
    editable: true
  }));
  missionGrid.appendChild(createMissionCard({
    id: "generated-transport",
    title: local("Getting around", "이동 방법", "Cómo moverse"),
    label: "ONE Pick",
    value: one.transportation,
    reason: result.missionContext.nearbyFirst ? local("Less transit, more time together.", "이동은 줄이고 함께하는 시간을 늘렸어요.", "Menos traslado y más tiempo juntos.") : local("Balanced for distance and time.", "거리와 시간을 함께 고려했어요.", "Equilibrado según distancia y tiempo."),
    options: result.missionContext.transport.map((option, index) => makeOptionRow(option, "", { index, label: option })),
    editable: true
  }));
  missionGrid.appendChild(createListCard({
    id: "generated-rain-plan",
    title: local("If the weather changes", "비가 오거나 날씨가 바뀌면", "Si cambia el clima"),
    label: local("Backup ready", "대안 준비", "Alternativa lista"),
    items: [one.rainPlan],
    wide: true,
    editable: true
  }));
};

const renderMissionUnderstanding = () => {
  if (!missionUnderstoodGoal || !missionUnderstoodItems) return;
  const ko = activeLanguage === "ko";
  const es = activeLanguage === "es";
  const rawGoal = String(currentResult?.originalMission || currentResult?.rawInput || currentResult?.mission || "").trim();
  const cleanedGoal = rawGoal.toLowerCase().replace(/\b(?:trip|travel|vacation|visit|to|in|plan|please)\b/gi, " ").replace(/(?:여행|출장|가줘|가고 싶어|계획해줘)/g, " ").replace(/\s+/g, " ").trim();
  const countryName = ko ? currentResult?.destination?.countryKo || currentResult?.destination?.country : currentResult?.destination?.country;
  const cityName = ko ? currentResult?.destination?.cityKo || currentResult?.destination?.city : currentResult?.destination?.city;
  const goalAliases = { la: cityName || "Los Angeles", "l.a.": cityName || "Los Angeles", nyc: cityName || "New York", "new york city": cityName || "New York", korea: countryName || "South Korea", "south korea": countryName || "South Korea", usa: countryName || "United States", "u.s.a.": countryName || "United States", uk: countryName || "United Kingdom", "u.k.": countryName || "United Kingdom" };
  const normalizedCountry = String(currentResult?.destination?.country || "").toLowerCase();
  const normalizedCity = String(currentResult?.destination?.city || "").toLowerCase();
  const normalizedTravelGoal = goalAliases[cleanedGoal]
    || (cleanedGoal && normalizedCountry.includes(cleanedGoal) ? countryName : "")
    || (cleanedGoal && normalizedCity.includes(cleanedGoal) ? cityName : "")
    || cityName || countryName;
  const experienceMission = isExperienceMission(currentResult, currentResult?.missionContext);
  const title = experienceMission
    ? rawGoal
    : currentResult?.type === "travel"
    ? normalizedTravelGoal || (ko ? "여행" : "Trip")
    : currentResult?.title?.[activeLanguage] || currentResult?.title?.en || rawGoal || (ko ? "준비된 미션" : "Prepared mission");
  const prepared = experienceMission
    ? (ko ? ["맞춤 경험", "시간별 일정", "음식", "이동", "날씨 대안"] : es ? ["Experiencia", "Horario", "Comida", "Transporte", "Plan alternativo"] : ["Experience", "Timeline", "Food", "Transportation", "Weather backup"])
    : currentResult?.type === "travel"
    ? (ko ? ["항공편", "호텔", "교통", "날씨", "예산", "체크리스트"] : es ? ["Vuelos", "Hotel", "Transporte", "Clima", "Presupuesto", "Lista"] : ["Flights", "Hotel", "Transportation", "Weather", "Budget", "Checklist"])
    : ["⭐ ONE Pick", ko ? "비교 선택지" : es ? "Opciones comparadas" : "Compared options", ko ? "예산" : es ? "Presupuesto" : "Budget", ko ? "체크리스트" : es ? "Lista" : "Checklist"];
  missionUnderstoodGoal.innerHTML = `<span>${ko ? "목표" : es ? "Objetivo" : "Goal"}</span><strong>${escapeSummaryText(title)}</strong>`;
  missionUnderstoodItems.innerHTML = prepared.map((item) => `<span>✓ ${item}</span>`).join("");
  const heading = document.getElementById("missionUnderstoodTitle");
  const summary = document.querySelector("#missionUnderstood .eyebrow");
  const timing = document.querySelector("#missionUnderstood .mission-understood-time");
  if (heading) heading.textContent = ko ? "이렇게 준비했어요." : es ? "Esto es lo que preparé para ti." : "Here’s what I prepared for you.";
  if (summary) summary.textContent = ko ? "미션 요약" : es ? "Resumen de la misión" : "Mission Summary";
  if (timing) timing.textContent = ko ? "1분 이내에 준비했습니다." : es ? "Preparado en menos de un minuto." : "Prepared in under a minute.";
  const stages = ko ? { mission: "미션", planning: "계획", review: "검토", approval: "승인", execution: "실행", complete: "완료" } : { mission: "Mission", planning: "Planning", review: "Review", approval: "Approval", execution: "Execution", complete: "Complete" };
  document.querySelectorAll("[data-stage]").forEach((item) => { item.textContent = stages[item.dataset.stage] || item.textContent; });
};

const organizeProgressiveResults = () => {
  const nodes = [...missionGrid.children];
  const nodeIds = new Set(nodes.map((node) => node.dataset?.cardId || (node.id === "additionalServicesForm" ? "additional-services" : "")));
  const groups = [
    { title: "1. ⭐ ONE Pick", open: true, match: () => true },
    { title: activeLanguage === "ko" ? "2. 중요 정보" : "2. Important Information", ids: new Set(["visa", "checklist", "information-sources"]) },
    { title: activeLanguage === "ko" ? "3. 날씨" : "3. Weather", ids: new Set(["weather"]) },
    { title: activeLanguage === "ko" ? "4. 환율" : "4. Currency", ids: new Set(["exchange-rate"]) },
    { title: activeLanguage === "ko" ? "5. 미션 수정" : activeLanguage === "es" ? "5. Revisión" : "5. Revision", ids: new Set(["additional-services"]) },
    { title: activeLanguage === "ko" ? "6. 승인" : "6. Approval", open: true, ids: new Set(["approval-protection"]) }
  ].filter((group) => !group.ids || [...group.ids].some((id) => nodeIds.has(id)));
  const details = groups.map((group) => {
    const element = document.createElement("details");
    element.className = "result-section";
    element.open = Boolean(group.open);
    element.innerHTML = `<summary>${group.title}<span aria-hidden="true">+</span></summary><div class="result-section-grid"></div>`;
    missionGrid.appendChild(element);
    return element;
  });
  nodes.forEach((node) => {
    const id = node.dataset?.cardId || (node.id === "additionalServicesForm" ? "additional-services" : "");
    const groupIndex = groups.findIndex((group, index) => index > 0 && group.ids?.has(id));
    details[groupIndex >= 0 ? groupIndex : 0].querySelector(".result-section-grid").appendChild(node);
  });
  details.forEach((detail) => detail.addEventListener("toggle", () => {
    detail.querySelector("summary span").textContent = detail.open ? "−" : "+";
  }));
  details.forEach((detail) => {
    detail.querySelector("summary span").textContent = detail.open ? "−" : "+";
  });
};

const renderMission = () => {
  currentResult = normalizeStoredResult(getStoredResult());
  currentExperienceReview = null;
  const schedule = currentResult.schedule || {};
  const start = schedule.startDate ? new Date(schedule.startDate) : null;
  const end = schedule.endDate ? new Date(schedule.endDate) : null;
  const durationDays = start && end && !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf()) ? Math.max(1, Math.round((end - start) / 86400000) + 1) : 1;
  currentResult.missionContext = buildMissionContext(currentResult.rawInput || currentResult.mission || currentResult.display?.title || "", {
    language: activeLanguage,
    destination: currentResult.destination?.city || currentResult.destination?.country || currentResult.display?.destination,
    destinationCountryCode: currentResult.destination?.countryCode || currentResult.countryProfile?.code || currentResult.country,
    destinationCountry: currentResult.destination?.country || currentResult.countryProfile?.name,
    destinationContinent: currentResult.destination?.continent || currentResult.countryProfile?.continent,
    destinationCurrency: currentResult.exchangeRate?.to || currentResult.countryProfile?.currency,
    resolvedDestination: currentResult.destination,
    country: currentResult.countryProfile?.code || currentResult.country,
    currentLocation: currentResult.followUp?.answers?.origin || currentResult.origin || "Seoul",
    durationDays,
    budget: currentResult.budget?.total
  });

  if (isExperienceMission(currentResult, currentResult.missionContext)) {
    renderGeneratedExperienceMission(currentResult);
  } else if (currentResult.type === "travel") {
    renderTravelMission(currentResult, currentResult.missionContext);
  } else {
    renderGeneralMission(currentResult);
  }

  renderPathwayOpportunities();
  missionGrid.insertBefore(pathwayOpportunityPanel, missionGrid.firstChild);
  missionGrid.appendChild(additionalServicesForm);
  missionGrid.appendChild(createApprovalCard(currentResult));
  renderMissionUnderstanding();
  organizeProgressiveResults();
};

const renderPathwayOpportunities = () => {
  if (!pathwayOpportunityPanel || !pathwayOpportunityList) return;
  const local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
  const goal = currentResult?.title?.[activeLanguage] || currentResult?.title?.en || currentResult?.mission || currentResult?.goal || "";
  const memoryEnabled = missionMemoryEnabled();
  const previousExperiences = memoryEnabled ? readMissionMemories().flatMap((row) => row.preferences || row.favoriteLocations || []).map(String) : [];
  const experienceMission = isExperienceMission(currentResult, currentResult?.missionContext);
  const destinationName = activeLanguage === "ko"
    ? currentResult?.destination?.cityKo || currentResult?.destination?.countryKo || currentResult?.missionContext?.destination?.city
    : currentResult?.destination?.city || currentResult?.destination?.country || currentResult?.missionContext?.destination?.city;
  const recommendedFlight = currentResult?.flights?.[0];
  const recommendedHotel = currentResult?.hotels?.[0];
  const travelReview = {
    title: local("ONE Recommendation", "ONE 추천", "Recomendación de ONE"),
    opening: local(`Travel options prepared specifically for ${destinationName || "your destination"}.`, `${destinationName || "목적지"}에 맞는 여행 선택지만 준비했어요.`, `Opciones preparadas específicamente para ${destinationName || "tu destino"}.`),
    whyLabel: local("Why this fits", "이 선택이 잘 맞는 이유", "Por qué encaja"),
    insights: [
      activeLanguage === "ko" ? recommendedFlight?.reasonKo || recommendedFlight?.reason : recommendedFlight?.reason,
      activeLanguage === "ko" ? recommendedHotel?.reasonKo || recommendedHotel?.reason : recommendedHotel?.reason,
      local("Every displayed travel option is restricted to the detected destination.", "표시되는 여행 선택지는 감지된 목적지로 제한됩니다.", "Todas las opciones se limitan al destino detectado.")
    ].filter(Boolean),
    confidence: local("Destination locked", "목적지 고정", "Destino fijado"),
    lead: local("Use Modify to compare destination-appropriate options before approval.", "승인 전에 수정에서 목적지에 맞는 선택지를 비교할 수 있어요.", "Usa Modificar para comparar opciones antes de aprobar."),
    choices: [recommendedFlight && { text: getFlightName(recommendedFlight), command: local("Compare flight options", "항공편 선택지 비교", "Comparar vuelos") }, recommendedHotel && { text: getHotelName(recommendedHotel), command: local("Compare hotel options", "호텔 선택지 비교", "Comparar hoteles") }].filter(Boolean)
  };
  const review = experienceMission
    ? (currentExperienceReview || buildExperienceIntelligence({mission:currentResult?.rawInput||goal,goal,language:activeLanguage,budget:currentResult?.budget?.total,memoryEnabled,previousExperiences,context:currentResult?.missionContext}))
    : travelReview;
  pathwayOpportunityTitle.textContent = review.title;
  experienceReviewOpening.textContent = review.opening;
  experienceReviewLabel.textContent = review.whyLabel;
  experienceReviewInsights.replaceChildren(...review.insights.map((insight)=>{const item=document.createElement("li");item.textContent=insight;return item;}));
  experienceReviewConfidence.textContent = review.confidence;
  revisionLead.textContent = review.lead;
  pathwayOpportunityList.replaceChildren(...review.choices.map((suggestion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "pathway-opportunity-action";
    button.dataset.revisionCommand = suggestion.command;
    button.setAttribute("role", "listitem");
    button.textContent = suggestion.text;
    return button;
  }));
  pathwayOpportunityPanel.hidden = false;
};

const initializeOptionSelections = () => {
  missionGrid.querySelectorAll(".option-row.selectable-option").forEach((option) => {
    option.setAttribute("aria-pressed", "false");
    option.classList.add("is-excluded");
    option.querySelector(".option-key").textContent = "+";
  });
  missionGrid.querySelectorAll(".selectable-recommendation").forEach((option) => {
    option.setAttribute("aria-pressed", "true");
    option.classList.remove("is-excluded");
    option.querySelector(".option-key").textContent = "✓";
  });
  missionGrid.querySelectorAll(".exclusive-choice-card").forEach((card) => {
    const detail = card.querySelector(".option-list .selectable-option");
    if (!detail) return;
    detail.setAttribute("aria-pressed", "true");
    detail.classList.remove("is-excluded");
    detail.querySelector(".option-key").textContent = "✓";
  });
  ["restaurants", "budget", "checklist"].forEach((cardId) => {
    missionGrid.querySelectorAll(`[data-card-id="${cardId}"] .option-row.selectable-option`).forEach((option) => {
      option.setAttribute("aria-pressed", "true");
      option.classList.remove("is-excluded");
      option.querySelector(".option-key").textContent = "✓";
    });
  });
  missionGrid.querySelectorAll(".option-list").forEach((list) => {
    list.style.setProperty("--option-rows", String(Math.max(1, Math.ceil(list.children.length / 2))));
  });
};

const renderApprovalList = () => {
  const experienceSteps = activeLanguage === "ko"
    ? ["선택한 경험 정리 중...", "시간별 일정 준비 중...", "음식과 이동 선택 반영 중...", "날씨 대안 확인 중...", "미션을 최종 준비 중..."]
    : activeLanguage === "es"
      ? ["Organizando la experiencia elegida...", "Preparando el horario...", "Aplicando comida y transporte...", "Comprobando el plan climático...", "Finalizando la misión..."]
      : ["Organizing your selected experience...", "Preparing the timeline...", "Applying food and transportation choices...", "Checking the weather backup...", "Finalizing your mission..."];
  const steps = isExperienceMission(currentResult, currentResult?.missionContext)
    ? experienceSteps
    : currentResult?.executionSequence?.[activeLanguage] || t("executionSteps");

  approvalList.innerHTML = steps
    .map((step) => {
      return `
        <div class="approval-item">
          <span class="approval-check">•</span>
          <span>${step}</span>
        </div>
      `;
    })
    .join("");
};

const returnHome = () => {
  trackEvent("return_home", { mission_type: currentResult?.type, language: activeLanguage, page: "results" });
  document.body.classList.add("is-leaving");

  window.setTimeout(() => {
    window.location.href = "index.html";
  }, 420);
};

const buildExperienceExecutionSummary = () => {
  const review = currentExperienceReview;
  const portable = currentResult?.portableExperienceData;
  const experience = portable?.onePick || review?.generatedExperience?.onePick;
  if (!executionSummary || !experience) return;
  const local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
  const reference = String(currentResult?.id || "").startsWith("ONE-DEMO-") ? currentResult.id : `ONE-DEMO-${String(currentResult?.id || Date.now()).replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase()}`;
  const row = (label, value, detail = "", wide = false) => `<div class="execution-summary-item${wide ? " is-wide" : ""}"><span class="execution-summary-label">${escapeSummaryText(label)}</span><span class="execution-summary-value">${escapeSummaryText(value)}</span>${detail ? `<span class="execution-summary-detail">${escapeSummaryText(detail)}</span>` : ""}</div>`;
  const timeline = experience.timeline.map((item) => `${item.time} · ${item.title}`).join(" / ");
  const foods = experience.foods.join(" · ");
  const recommendation = portable?.recommendation || review.recommendation;
  const alternativeItems = portable?.alternatives || review.generatedExperience.alternatives || [];
  const alternatives = alternativeItems.join(" · ");
  const portableResult = { p: 2, r: reference, l: activeLanguage, q: [recommendation, experience.reasoning, experience.transportation, experience.rainPlan], t: experience.timeline.map((item) => [item.time, item.title, item.type]), f: experience.foods, a: alternativeItems };
  const portableUrl = `${location.origin}${location.pathname}?share=${encodeURIComponent(encodePortableShare(portableResult))}`;
  const qrMarkup = `<div class="execution-summary-item is-wide is-reference"><span class="execution-summary-label">${local("Prototype reference", "프로토타입 참조 번호", "Referencia del prototipo")}</span><span class="execution-summary-value">${escapeSummaryText(reference)}</span><a href="${escapeSummaryText(portableUrl)}" aria-label="${local("Reopen this summary from the QR link", "QR 링크로 이 요약 다시 열기", "Volver a abrir este resumen desde el QR")}"><img class="prototype-reference-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=900x900&amp;format=png&amp;ecc=L&amp;qzone=8&amp;data=${encodeURIComponent(portableUrl)}" alt="${local("Prototype summary QR code", "프로토타입 요약 QR 코드", "Código QR del resumen")}" width="320" height="320"></a><small class="prototype-reference-qr-help">${local("Scan with your phone camera to reopen this summary", "휴대폰 카메라로 스캔하면 이 요약을 다시 열 수 있습니다", "Escanea con la cámara para volver a abrir el resumen")}</small><span class="execution-summary-detail">${local("Not a booking number", "실제 예약 번호가 아닙니다", "No es un número de reserva")}</span></div>`;
  const rows = [
    row(local("Your experience", "당신을 위한 경험", "Tu experiencia"), recommendation, experience.reasoning, true),
    row(local("Timeline", "시간별 일정", "Horario"), timeline, "", true),
    row(local("Food", "음식과 디저트", "Comida"), foods),
    row(local("Transportation", "이동 방법", "Transporte"), experience.transportation),
    row(local("Weather backup", "날씨 대안", "Alternativa climática"), experience.rainPlan),
    row(local("Other ideas", "다른 선택지", "Otras ideas"), alternatives)
  ];
  executionSummary.innerHTML = `<div class="execution-summary-head"><h4>${local("Approved experience summary", "승인된 경험 요약", "Resumen de experiencia aprobado")}</h4><p>${local("Your selected experience is organized and ready to use. No booking, payment, or provider contact has occurred.", "선택한 경험을 바로 사용할 수 있도록 정리했습니다. 예약, 결제 또는 제공업체 연락은 진행되지 않았습니다.", "Tu experiencia está organizada y lista. No se realizó ninguna reserva, pago ni contacto con proveedores.")}</p><span class="execution-summary-status">${local("Prototype · Plan ready · Nothing booked", "프로토타입 · 계획 준비 완료 · 실제 예약 아님", "Prototipo · Plan listo · Sin reservas")}</span></div><div class="execution-summary-grid">${rows.join("")}${qrMarkup}</div><a class="all-in-slogan" href="index.html" aria-label="${local("Return home", "홈으로 돌아가기", "Volver al inicio")}"><span>All in</span><span class="all-in-one" aria-label="ONE"><img src="assets/one-final-circle.png?v=20260713-20" alt=""><strong>NE</strong></span></a>`;
  savePrototypeMission(reference);
};

const properCaseLocation = (value) => String(value || "").trim().toLowerCase().replace(/(^|[\s-])([a-zà-öø-ÿ])/g, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);

const approvalMissionName = () => {
  if (isExperienceMission(currentResult, currentResult?.missionContext)) {
    return currentResult?.originalMission || currentResult?.rawInput || currentResult?.mission || currentResult?.title?.[activeLanguage] || currentResult?.title?.en || "";
  }
  if (currentResult?.type === "travel") {
    const destination = activeLanguage === "ko"
      ? currentResult?.destination?.cityKo || currentResult?.destination?.countryKo || currentResult?.destination?.city || currentResult?.destination?.country
      : currentResult?.destination?.city || currentResult?.destination?.country;
    return properCaseLocation(destination);
  }
  return currentResult?.title?.[activeLanguage] || currentResult?.title?.en || currentResult?.rawInput || "";
};

const escapeSummaryText = (value) => String(value ?? "—").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

const selectedOptionIndex = (cardId) => {
  const option = missionGrid.querySelector(`[data-card-id="${cardId}"] .option-list .selectable-option[aria-pressed="true"]`);
  const index = Number(option?.dataset.optionIndex);
  return Number.isInteger(index) && index >= 0 ? index : 0;
};

const normalizeBudgetRange = (range, fallback = { min: 0, max: 0 }) => ({
  currency: range?.currency || fallback?.currency || currentResult?.budget?.currency || "KRW",
  min: Number.isFinite(Number(range?.min)) ? Number(range.min) : Number(fallback?.min || 0),
  max: Number.isFinite(Number(range?.max)) ? Number(range.max) : Number(fallback?.max || 0)
});

const scaleBudgetRange = (range, multiplier) => {
  const normalized = normalizeBudgetRange(range);
  return {
    currency: normalized.currency,
    min: Math.round(normalized.min * multiplier),
    max: Math.round(normalized.max * multiplier)
  };
};

const getTripNightCount = () => {
  const { startDate, endDate } = currentResult?.schedule || {};
  if (!startDate || !endDate) return 1;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const nights = Math.round((end - start) / 86400000);
  return Number.isFinite(nights) ? Math.max(1, nights) : 1;
};

const rangeFromPricedOption = (option) => option ? normalizeBudgetRange({
  currency: option.dataset.priceCurrency,
  min: Number(option.dataset.priceMin || 0),
  max: Number(option.dataset.priceMax || 0)
}) : normalizeBudgetRange();

const selectedPricedOption = (cardId) => missionGrid.querySelector(
  `[data-card-id="${cardId}"] .option-list .selectable-option[aria-pressed="true"][data-price-min]`
);

const addBudgetRanges = (...ranges) => {
  const normalized = ranges.map((range) => normalizeBudgetRange(range));
  return {
    currency: normalized.find((range) => range.currency)?.currency || currentResult?.budget?.currency || "KRW",
    min: normalized.reduce((sum, range) => sum + range.min, 0),
    max: normalized.reduce((sum, range) => sum + range.max, 0)
  };
};

const subtractBudgetRange = (total, deduction) => {
  const normalizedTotal = normalizeBudgetRange(total);
  const normalizedDeduction = normalizeBudgetRange(deduction);
  return {
    currency: normalizedTotal.currency,
    min: Math.max(0, normalizedTotal.min - normalizedDeduction.min),
    max: Math.max(0, normalizedTotal.max - normalizedDeduction.max)
  };
};

const updateTravelBudgetFromSelections = () => {
  if (currentResult?.type !== "travel" || !currentResult.budget) return;

  if (!currentResult._budgetBaseline) {
    currentResult._budgetBaseline = {
      flights: normalizeBudgetRange(currentResult.budget.flights),
      hotel: normalizeBudgetRange(currentResult.budget.hotel),
      food: normalizeBudgetRange(currentResult.budget.food),
      transport: normalizeBudgetRange(currentResult.budget.transport),
      activities: normalizeBudgetRange(currentResult.budget.activities)
    };
  }
  const baseline = currentResult._budgetBaseline;
  const cardIncluded = (cardId) => !missionGrid.querySelector(`[data-card-id="${cardId}"]`)?.classList.contains("is-excluded");
  const selectedFlight = currentResult.flights?.[selectedOptionIndex("flights")];
  const selectedHotel = currentResult.hotels?.[selectedOptionIndex("hotel")];
  const selectedFlightPrice = selectedPricedOption("flights");
  const selectedHotelPrice = selectedPricedOption("hotel");
  const flights = cardIncluded("flights")
    ? (selectedFlightPrice ? rangeFromPricedOption(selectedFlightPrice) : normalizeBudgetRange(selectedFlight?.estimatedPrice, baseline.flights))
    : normalizeBudgetRange();
  const nightlyHotelPrice = selectedHotelPrice ? rangeFromPricedOption(selectedHotelPrice) : selectedHotel?.estimatedNightlyPrice;
  const hotel = cardIncluded("hotel") && nightlyHotelPrice
    ? scaleBudgetRange(nightlyHotelPrice, getTripNightCount())
    : cardIncluded("hotel") ? normalizeBudgetRange(baseline.hotel) : normalizeBudgetRange();

  const restaurantRows = [...missionGrid.querySelectorAll('[data-card-id="restaurants"] .option-row[data-price-min]')];
  const allRestaurantFees = addBudgetRanges(...restaurantRows.map(rangeFromPricedOption));
  const selectedRestaurantFees = cardIncluded("restaurants")
    ? addBudgetRanges(...restaurantRows.filter((row) => row.getAttribute("aria-pressed") === "true").map(rangeFromPricedOption))
    : normalizeBudgetRange();
  const food = addBudgetRanges(subtractBudgetRange(baseline.food, allRestaurantFees), selectedRestaurantFees);

  const transferRows = [...missionGrid.querySelectorAll('[data-card-id="airport-transfer"] .option-row[data-price-min]')];
  const standardTransferFee = rangeFromPricedOption(transferRows[0]);
  const selectedTransferRow = transferRows.find((row) => row.getAttribute("aria-pressed") === "true");
  const selectedTransferFee = cardIncluded("airport-transfer") ? rangeFromPricedOption(selectedTransferRow) : normalizeBudgetRange();
  const transport = addBudgetRanges(subtractBudgetRange(baseline.transport, standardTransferFee), selectedTransferFee);
  const activities = normalizeBudgetRange(baseline.activities);
  const costRanges = { flights, hotel, food, transport, activities };
  const ranges = Object.entries(costRanges)
    .filter(([key]) => missionGrid.querySelector(`[data-card-id="budget"] [data-budget-key="${key}"]`)?.getAttribute("aria-pressed") !== "false")
    .map(([, range]) => range);
  const estimatedTotal = {
    currency: currentResult.budget.currency || flights.currency,
    min: ranges.reduce((sum, range) => sum + range.min, 0),
    max: ranges.reduce((sum, range) => sum + range.max, 0)
  };

  currentResult.budget = { ...currentResult.budget, flights, hotel, food, transport, activities, estimatedTotal };

  Object.entries({ flights, hotel, food, transport, activities, estimatedTotal }).forEach(([key, range]) => {
    const row = missionGrid.querySelector(`[data-card-id="budget"] [data-budget-key="${key}"]`);
    const value = row?.querySelector(".option-value > span");
    const displayRange = key !== "estimatedTotal" && row?.getAttribute("aria-pressed") === "false"
      ? { currency: range.currency, min: 0, max: 0 }
      : range;
    if (value) value.textContent = formatRange(displayRange);
  });

  const exchangeCard = missionGrid.querySelector('[data-card-id="exchange-rate"]');
  if (exchangeCard) exchangeCard.replaceWith(createExchangeBudgetCard(currentResult));
};

const buildExecutionSummary = () => {
  if (!executionSummary) return;
  if (isExperienceMission(currentResult, currentResult?.missionContext)) {
    buildExperienceExecutionSummary();
    return;
  }
  if (currentResult?.type !== "travel") return;
  const ko = activeLanguage === "ko";
  const flightIndex = selectedOptionIndex("flights");
  const flight = currentResult.flights?.[flightIndex] || currentResult.flights?.[0];
  const hotel = currentResult.hotels?.[selectedOptionIndex("hotel")] || currentResult.hotels?.[0];
  const transfer = currentResult.airportTransfer?.options?.[selectedOptionIndex("airport-transfer")] || currentResult.airportTransfer?.recommended;
  const restaurants = [...missionGrid.querySelectorAll('[data-card-id="restaurants"] .selectable-option[aria-pressed="true"] .option-value')].map((item) => item.textContent.trim()).filter(Boolean);
  const schedule = currentResult.schedule || {};
  const dateRange = schedule.startDate && schedule.endDate ? `${schedule.startDate} → ${schedule.endDate}` : (ko ? "날짜 확인 필요" : "Dates pending");
  const timeLabels = ko ? { any: "시간 미정", morning: "오전 06:00–12:00", afternoon: "오후 12:00–17:00", evening: "저녁 17:00–22:00" } : { any: "Time to be confirmed", morning: "Morning 06:00–12:00", afternoon: "Afternoon 12:00–17:00", evening: "Evening 17:00–22:00" };
  const codes = { "Korean Air": "KE", "Asiana Airlines": "OZ", "Japan Airlines": "JL", "Delta Air Lines": "DL", "United Airlines": "UA", "American Airlines": "AA", "Avianca": "AV", "Aeromexico": "AM", "Copa Airlines": "CM", "Iberia": "IB", "LATAM Airlines": "LA", Lufthansa: "LH", "Air France": "AF", KLM: "KL", Emirates: "EK", "Qatar Airways": "QR", "Turkish Airlines": "TK" };
  const flightNumber = `${codes[flight?.provider] || "ONE"}-${(flightIndex + 1) * 101}`;
  const isRoundTrip = currentResult.tripType !== "one_way";
  const returnFlightNumber = `${codes[flight?.provider] || "ONE"}-${(flightIndex + 1) * 101 + 1}`;
  const airlineName = flight ? getFlightName(flight) : "—";
  const selectedTime = timeLabels[schedule.timePreference] || timeLabels.any;
  const flightRows = isRoundTrip
    ? [
        [ko ? "출국 항공편" : "Outbound flight", `${airlineName} · ${flightNumber}`, `${schedule.startDate || dateRange} · ${selectedTime} · ${formatRange(flight?.estimatedPrice)} (${ko ? "왕복 총액" : "round-trip total"})`],
        [ko ? "귀국 항공편" : "Return flight", `${airlineName} · ${returnFlightNumber}`, `${schedule.endDate || dateRange} · ${ko ? "귀국 시간 최종 확인 필요" : "Return time requires final confirmation"} · (${ko ? "왕복 총액" : "round-trip total"})`]
      ]
    : [[ko ? "편도 항공편" : "One-way flight", `${airlineName} · ${flightNumber}`, `${schedule.startDate || dateRange} · ${selectedTime} · ${formatRange(flight?.estimatedPrice)}`]];
  const reference = `ONE-DEMO-${String(currentResult.id || Date.now()).replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase()}`;
  const selectedRestaurantNames = [...missionGrid.querySelectorAll('[data-card-id="restaurants"] .selectable-option[aria-pressed="true"]')].map((button) => {
    const restaurant = currentResult.restaurants?.[Number(button.dataset.optionIndex)] || {};
    return (ko ? restaurant.venueNameKo : restaurant.venueName) || restaurant.venueName || restaurant.type || button.querySelector(".restaurant-name")?.textContent?.trim() || "Restaurant";
  }).filter(Boolean).slice(0, 6);
  const totalRange = currentResult.budget?.estimatedTotal || {};
  const foodRange = currentResult.budget?.food || {};
  const transportRange = currentResult.budget?.transport || {};
  const activitiesRange = currentResult.budget?.activities || {};
  const weatherItems = (findLiveProvider(currentResult, "weather")?.items || []).slice(0, 7).map((item) => [item.label || "", item.value || "", item.humidity || "", item.precipitation || ""]);
  const currencyItems = (findLiveProvider(currentResult, "currency")?.items || []).slice(0, 6).map((item) => [item.to || "", Number(item.rate ?? item.value) || 0]).filter(([to, rate]) => to && rate);
  const portableCountry = ko
    ? currentResult.destination?.countryKo || currentResult.destination?.country || ""
    : currentResult.destination?.country || "";
  const portableCity = ko
    ? currentResult.destination?.cityKo || currentResult.destination?.city || ""
    : currentResult.destination?.city || "";
  const portableFlightName = flight ? getFlightName(flight) : "";
  const portableHotelName = hotel ? getHotelName(hotel) : "";
  const portableResult = {
    p: 1, r: reference, l: activeLanguage,
    d: [portableCountry, "", portableCity, ""],
    s: [schedule.startDate || "", schedule.endDate || "", schedule.timePreference || "any"],
    t: currentResult.tripType || "round_trip",
    f: flight ? [portableFlightName, "", flight.estimatedPrice?.min || 0, flight.estimatedPrice?.max || 0] : [],
    h: hotel ? [portableHotelName, "", hotel.estimatedNightlyPrice?.min || 0, hotel.estimatedNightlyPrice?.max || 0] : [],
    x: localize(transfer) || "", n: selectedRestaurantNames,
    w: weatherItems, e: currencyItems, c: currentResult.exchangeRate?.to || currentResult.countryProfile?.currency || "USD",
    b: [foodRange.min || 0, foodRange.max || 0, transportRange.min || 0, transportRange.max || 0, activitiesRange.min || 0, activitiesRange.max || 0, totalRange.min || 0, totalRange.max || 0]
  };
  const portableUrl = `${location.origin}${location.pathname}?share=${encodeURIComponent(encodePortableShare(portableResult))}`;
  const restaurantRows = restaurants.length
    ? restaurants.map((restaurant, index) => [
        ko ? `레스토랑 ${index + 1}` : `Restaurant ${index + 1}`,
        restaurant,
        ko ? "가격 및 예약 가능 여부 최종 확인 필요" : "Final price and availability verification required",
        "is-restaurant"
      ])
    : [[ko ? "레스토랑" : "Restaurants", ko ? "선택 없음" : "None selected", ko ? "선택된 레스토랑이 없습니다" : "No restaurants selected", "is-restaurant"]];
  const rows = [
    [ko ? "여행 일정" : "Schedule", "", selectedTime, "is-wide is-schedule", { start: schedule.startDate, end: schedule.endDate }],
    ...flightRows,
    [ko ? "호텔" : "Hotel", hotel ? getHotelName(hotel) : "—", `${dateRange} · ${formatRange(hotel?.estimatedNightlyPrice)} / ${ko ? "1박" : "night"}`],
    [ko ? "공항 이동" : "Airport transfer", localize(transfer), ko ? "선택한 이동 옵션 준비 완료" : "Selected transfer option prepared"],
    ...restaurantRows,
    [ko ? "프로토타입 참조 번호" : "Prototype reference", reference, ko ? "실제 예약 번호가 아닙니다" : "This is not a real booking number", "is-wide is-reference"]
  ];
  const renderSummaryRow = ([label, value, detail, className = "", metadata = null]) => {
    const qrMarkup = className.includes("is-reference")
      ? `<a href="${escapeSummaryText(portableUrl)}" aria-label="${ko ? "QR 링크로 이 요약 다시 열기" : "Reopen this summary from the QR link"}"><img class="prototype-reference-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=900x900&amp;format=png&amp;ecc=L&amp;qzone=8&amp;data=${encodeURIComponent(portableUrl)}" alt="${ko ? "프로토타입 요약 링크 QR 코드" : "Prototype summary link QR code"}" width="320" height="320"></a><small class="prototype-reference-qr-help">${ko ? "휴대폰 카메라로 스캔하면 이 요약을 다시 열 수 있습니다" : "Scan with your phone camera to reopen this summary"}</small>`
      : "";
    const valueMarkup = className.includes("is-schedule")
      ? `<span class="execution-summary-value schedule-summary-dates"><strong>${escapeSummaryText(metadata?.start || "—")}</strong><i aria-hidden="true">→</i><strong>${escapeSummaryText(metadata?.end || "—")}</strong></span>`
      : `<span class="execution-summary-value">${escapeSummaryText(value)}</span>`;
    return `<div class="execution-summary-item ${className}"><span class="execution-summary-label">${escapeSummaryText(label)}</span>${valueMarkup}${qrMarkup}<span class="execution-summary-detail">${escapeSummaryText(detail)}</span></div>`;
  };
  executionSummary.innerHTML = `<div class="execution-summary-head"><h4>${ko ? "승인된 실행 요약" : "Approved execution summary"}</h4><p>${ko ? "선택 항목을 실행 준비 상태로 정리했습니다. 실제 예약·결제·발권은 제공업체 최종 확인 후에만 완료됩니다." : "Selected items are prepared for execution. Actual booking, payment, and ticketing complete only after final provider confirmation."}</p><span class="execution-summary-status">${ko ? "프로토타입 · 준비 완료 · 실제 예약 아님" : "Prototype · Prepared · Not actually booked"}</span></div><div class="execution-summary-grid">${rows.map(renderSummaryRow).join("")}</div><a class="all-in-slogan" href="index.html" aria-label="${ko ? "홈으로 돌아가기" : "Return home"}"><span>All in</span><span class="all-in-one" aria-label="ONE"><img src="assets/one-final-circle.png?v=20260713-20" alt=""><strong>NE</strong></span></a>`;
  savePrototypeMission(reference);
};

const runApprovalSequence = () => {
  trackEvent("simulated_execution_started", { mission_type: currentResult?.type, language: activeLanguage, page: "results", status: "prototype_simulation" });
  const items = [...approvalList.querySelectorAll(".approval-item")];

  makeRealityButton.disabled = true;
  bottomActions.hidden = true;
  approvalPanel.hidden = false;
  approvalPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  items.forEach((item, index) => {
    trackEvent("simulated_step_started", { mission_type: currentResult?.type, language: activeLanguage, page: "results", step: String(index + 1) });
    window.setTimeout(() => {
      item.classList.add("is-complete");
      item.querySelector(".approval-check").textContent = "✓";
      trackEvent("simulated_step_completed", { mission_type: currentResult?.type, language: activeLanguage, page: "results", step: String(index + 1), success: true });

      if (index === items.length - 1) {
        window.setTimeout(() => {
          const finalTitle = completionMessage.querySelector("h3");

          if (finalTitle) {
            finalTitle.textContent = localize(currentResult?.finalMessage) || t("finalMessage");
          }

          buildExecutionSummary();
          completionMessage.hidden = false;
          trackEvent("execution_summary_shown", {
            mission_type: currentResult?.type,
            language: activeLanguage,
            page: "results",
            schedule_used: Boolean(currentResult?.schedule?.startDate && currentResult?.schedule?.endDate)
          });
          trackEvent("approval_confirmed", { mission_type: currentResult?.type, language: activeLanguage, page: "results" });
          trackEvent("simulated_execution_completed", { mission_type: currentResult?.type, language: activeLanguage, page: "results", status: "prototype_simulation" });
          window.requestAnimationFrame(() => {
            const headerHeight = document.querySelector(".results-header")?.getBoundingClientRect().height || 76;
            const targetTop = window.scrollY + completionMessage.getBoundingClientRect().top - headerHeight - 28;
            window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
          });
        }, 650);
      }
    }, index * 760);
  });
};

const applySimulatedModification = (cardId, card, button) => {
  const cardTitle = card.querySelector(".card-title")?.textContent || "";
  const value = card.querySelector(".recommendation-value");
  const reason = card.querySelector(".reason");

  card.classList.toggle("is-editing");

  if (!card.classList.contains("is-editing")) {
    button.textContent = t("modify");
    return;
  }

  button.textContent = t("editing");

  if (["flights", "hotel", "airport-transfer"].includes(cardId)) return;

  if (cardId === "flights" && value) {
    value.textContent = activeLanguage === "ko" ? "제주항공" : "Jeju Air";

    if (reason) {
      reason.textContent =
        activeLanguage === "ko"
          ? "예산을 줄이기 위해 저가 항공 옵션으로 변경했습니다. 실제 예약은 승인 전까지 진행되지 않습니다."
          : "Changed to a lower-cost airline option to reduce budget. No booking will happen without approval.";
    }
  }

  if (cardId === "hotel" && value) {
    value.textContent = activeLanguage === "ko" ? "도큐 스테이 신주쿠" : "Tokyu Stay Shinjuku";

    if (reason) {
      reason.textContent =
        activeLanguage === "ko"
          ? "교통 접근성과 예산 균형을 위해 실용적인 호텔 옵션으로 변경했습니다."
          : "Changed to a practical hotel option for stronger balance between location and budget.";
    }
  }

  if (cardId === "restaurants") {
    const rows = card.querySelectorAll(".option-row");

    if (rows.length > 0) {
      rows[rows.length - 1].remove();
    }
  }

  if (cardId === "budget") {
    const values = card.querySelectorAll(".option-value");

    values.forEach((item) => {
      item.textContent =
        activeLanguage === "ko"
          ? "예산 절감 옵션 적용됨"
          : "Budget-saving option applied";
    });
  }

  if (cardId === "airport-transfer" && value) {
    value.textContent = activeLanguage === "ko" ? "공항 리무진 버스" : "Airport Limousine Bus";

    if (reason) {
      reason.textContent =
        activeLanguage === "ko"
          ? "수하물 이동과 비용 균형을 기준으로 공항 리무진 옵션을 우선 적용했습니다."
          : "Prioritized airport limousine service for better luggage convenience and cost balance.";
    }
  }

  if (cardId === "checklist") {
    const list = card.querySelector(".option-list");

    if (list) {
      list.insertAdjacentHTML(
        "beforeend",
        makeOptionRow("✓", activeLanguage === "ko" ? "로밍 / eSIM 가격 비교" : "Roaming / eSIM price comparison")
      );
    }
  }

  if (cardId === "visa" && reason) {
    reason.textContent =
      activeLanguage === "ko"
        ? "비자 확인 요청이 추가되었습니다. 실행 전 정부/대사관 데이터 기준으로 확인합니다."
        : "Visa verification request added. ONE will verify using government or embassy data before execution.";
  }
};

const enableCustomization = () => {
  document.addEventListener("click", (event) => {
    const categoryToggle = event.target.closest(".category-toggle");
    if (categoryToggle) {
      const card = categoryToggle.closest(".mission-card");
      const included = categoryToggle.getAttribute("aria-pressed") !== "true";
      categoryToggle.setAttribute("aria-pressed", String(included));
      categoryToggle.textContent = included ? "✓" : "+";
      card?.classList.toggle("is-excluded", !included);
      trackEvent("option_selected", { mission_type: currentResult?.type, language: activeLanguage, page: "results", option_category: card?.dataset.cardId });
      if (["flights", "hotel", "airport-transfer", "restaurants"].includes(card?.dataset.cardId)) {
        updateTravelBudgetFromSelections();
      }
      return;
    }

    const selectable = event.target.closest(".selectable-option");
    if (selectable) {
      const card = selectable.closest(".mission-card");
      trackEvent("option_selected", { mission_type: currentResult?.type, language: activeLanguage, page: "results", option_category: card?.dataset.cardId });
      if (card?.classList.contains("multiple-choice-card") && selectable.classList.contains("selectable-recommendation")) {
        selectable.setAttribute("aria-pressed", "true");
        selectable.classList.remove("is-excluded");
        selectable.querySelector(".option-key").textContent = "\u2713";
        return;
      }
      const exclusive = card?.classList.contains("exclusive-choice-card") && !card.classList.contains("is-editing");
      if (exclusive) {
        const recommendation = card.querySelector(".selectable-recommendation");
        const recommendedDetail = card.querySelector(".option-list .selectable-option");
        const choosingRecommended = selectable === recommendation || selectable === recommendedDetail;
        const chosen = choosingRecommended ? recommendedDetail : selectable;
        card.querySelectorAll(".selectable-option").forEach((option) => {
          const selected = option === recommendation || option === chosen;
          option.setAttribute("aria-pressed", String(selected));
          option.classList.toggle("is-excluded", !selected);
          option.querySelector(".option-key").textContent = selected ? "✓" : "+";
        });
        const optionIndex = Number(chosen?.dataset.optionIndex || 0);
        const chosenName = chosen?.dataset.optionLabel ? decodeURIComponent(chosen.dataset.optionLabel) : chosen?.querySelector(".option-value strong")?.textContent;
        const chosenPrice = chosen?.querySelector(".option-value > span")?.textContent;
        const recommendationValue = recommendation?.querySelector(".recommendation-value");
        if (recommendationValue && chosenName) {
          const suffix = card.dataset.cardId === "hotel" && chosenPrice
            ? `${chosenPrice} / ${activeLanguage === "ko" ? "1박" : "night"}`
            : chosenPrice || "";
          recommendationValue.innerHTML = `<span class="recommended-name">${chosenName}</span><span class="recommended-price">${suffix}</span>`;
        }
        let selectedReason = chosen?.dataset.optionReason;
        if (card.dataset.cardId === "flights") {
          const selected = currentResult?.flights?.[optionIndex];
          selectedReason = encodeURIComponent(activeLanguage === "ko" ? selected?.reasonKo || selected?.reason || "" : selected?.reason || "");
        } else if (card.dataset.cardId === "hotel") {
          const selected = currentResult?.hotels?.[optionIndex];
          selectedReason = encodeURIComponent(activeLanguage === "ko" ? selected?.reasonKo || selected?.reason || "" : selected?.reason || "");
        }
        const reasonElement = card.querySelector(".reason");
        if (reasonElement && selectedReason) reasonElement.textContent = decodeURIComponent(selectedReason);
        if (["flights", "hotel", "airport-transfer"].includes(card.dataset.cardId)) {
          updateTravelBudgetFromSelections();
        }
        return;
      }
      const included = selectable.getAttribute("aria-pressed") !== "true";
      selectable.setAttribute("aria-pressed", String(included));
      selectable.classList.toggle("is-excluded", !included);
      selectable.querySelector(".option-key").textContent = included ? "✓" : "+";
      if (card?.dataset.cardId === "restaurants") updateTravelBudgetFromSelections();
      if (card?.dataset.cardId === "budget") {
        const budgetKey = selectable.dataset.budgetKey;
        if (budgetKey === "estimatedTotal") {
          selectable.setAttribute("aria-pressed", "true");
          selectable.classList.remove("is-excluded");
          selectable.querySelector(".option-key").textContent = "✓";
        }
        updateTravelBudgetFromSelections();
      }
      return;
    }

    const alternative = event.target.closest(".alternative-choice");
    if (alternative) {
      alternative.classList.toggle("is-selected");
      const card = alternative.closest(".mission-card");
      const list = card?.querySelector(".option-list");
      const optionName = alternative.textContent.trim();
      const existing = [...(list?.querySelectorAll(".selectable-option") || [])]
        .find((row) => row.querySelector(".option-value")?.textContent.trim() === optionName);
      if (alternative.classList.contains("is-selected") && list && !existing) {
        list.insertAdjacentHTML("beforeend", `<button class="option-row selectable-option" type="button" aria-pressed="true"><span class="option-key">✓</span><span class="option-value">${optionName}</span></button>`);
      } else if (!alternative.classList.contains("is-selected")) {
        existing?.remove();
      }
      return;
    }

    const button = event.target.closest(".modify-button");

    if (!button) return;

    const card = button.closest(".mission-card");
    const cardId = button.getAttribute("data-card-action") || card?.dataset.cardId;

    if (!card || !cardId) return;
    trackEvent("customize_opened", { mission_type: currentResult?.type, language: activeLanguage, page: "results", option_category: cardId });

    const picker = card.querySelector("[data-alternatives-for]");
    if (picker && !picker.children.length) {
      const airlineOptions = ["Korean Air", "Asiana Airlines", "Delta Air Lines", "American Airlines", "United Airlines", "Japan Airlines"];
      const hotelOptions = ["Four Seasons", "Rosewood", "Atlantis", "Lotte", "Shilla", "Le Méridien", "Sofitel", "Hyatt", "InterContinental", "JW Marriott", "Hilton", "APA Hotel"];
      const generalOptions = activeLanguage === "ko"
        ? ["⭐ ONE Pick", "예산 중심", "품질 중심", "가까운 위치", "프리미엄"]
        : ["⭐ ONE Pick", "Budget", "Best quality", "Nearest", "Premium"];
      const options = cardId === "flights" ? airlineOptions : cardId === "hotel" ? hotelOptions : generalOptions;
      picker.innerHTML = options.map((option) => `<button class="alternative-choice" type="button">${option}</button>`).join("");
    }
    applySimulatedModification(cardId, card, button);
    trackEvent("customize_completed", { mission_type: currentResult?.type, language: activeLanguage, page: "results", option_category: cardId, success: true });
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.getAttribute("data-i18n-placeholder"));
  });
};

const applyRevisionCommand = async () => {
  const value = additionalServiceInput?.value.trim();
  if (!value || !additionalServiceList) return;
  addServiceButton.disabled = true;
  addServiceButton.setAttribute("aria-busy", "true");
  if (revisionStatus) revisionStatus.textContent = t("revisionLoading");
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  try {
    const result = reviseMission(currentResult, value, { language: activeLanguage, provider: "OPENAI" });
    currentResult = result.mission;
    sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
    sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
    const sections = [[result.summary.added, result.diff.added], [result.summary.changed, result.diff.changed], [result.summary.removed, result.diff.removed], [result.summary.verify, result.diff.needsVerification]];
    additionalServiceList.innerHTML = `<h3>${result.summary.title}</h3>${sections.filter(([,items])=>items.length).map(([label,items])=>`<p><strong>${label}:</strong> ${items.map(escapeSummaryText).join(", ")}</p>`).join("")}<p><strong>${result.summary.approval}:</strong> ${escapeSummaryText(result.diff.approval)}</p>`;
    if (revisionStatus) revisionStatus.textContent = t("revisionComplete");
    trackEvent("mission_revision_completed", { mission_type: currentResult?.type, language: activeLanguage, page: "results", revision_type: result.intent.type, approval_invalidated: result.impact.material, provider: "OPENAI" });
    additionalServiceInput.value = "";
    additionalServiceInput.focus();
  } catch {
    if (revisionStatus) revisionStatus.textContent = t("revisionError");
  } finally {
    addServiceButton.disabled = false;
    addServiceButton.removeAttribute("aria-busy");
  }
};

const addAdditionalService = () => {
  return applyRevisionCommand();
};

additionalServicesForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  addAdditionalService();
});
additionalServiceInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    additionalServicesForm.requestSubmit();
  }
});

document.addEventListener("click", (event) => {
  const pathwayAction = event.target.closest(".pathway-opportunity-action");
  if (pathwayAction && additionalServiceInput) {
    additionalServiceInput.value = pathwayAction.dataset.revisionCommand || pathwayAction.textContent.trim();
    additionalServiceInput.focus();
    pathwayOpportunityPanel.querySelectorAll(".pathway-opportunity-action").forEach((button) => button.setAttribute("aria-pressed", String(button === pathwayAction)));
    return;
  }
  const uploadButton = event.target.closest(".document-upload-button");
  if (uploadButton) {
    const type = uploadButton.dataset.documentType;
    document.getElementById(type === "passport" ? "passportUploadInput" : "visaUploadInput")?.click();
  }

  if (event.target.closest("#prepareVisaButton")) {
    const status = document.getElementById("visaDocumentStatus");
    if (status) status.textContent = activeLanguage === "ko"
      ? "비자 신청 준비 항목이 최종 승인 목록에 추가되었습니다. 아직 제출되지 않았습니다."
      : "Visa application preparation was added to final approval. Nothing has been submitted.";
  }
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input.id === "passportUploadInput" || input.id === "visaUploadInput") {
    const type = input.id === "passportUploadInput" ? "passport" : "visa";
    const button = document.querySelector(`[data-document-type="${type}"]`);
    button?.classList.toggle("has-file", Boolean(input.files?.length));
    const status = document.getElementById("visaDocumentStatus");
    if (status && input.files?.length) status.textContent = activeLanguage === "ko"
      ? `${type === "passport" ? "여권" : "비자"} 문서가 이 세션에 추가되었습니다.`
      : `${type === "passport" ? "Passport" : "Visa"} document added for this session.`;
  }

  if (input.id === "personalDataConsent") {
    const prepareButton = document.getElementById("prepareVisaButton");
    if (prepareButton) prepareButton.disabled = !input.checked;
  }
});

returnHomeButton.addEventListener("click", returnHome);
makeRealityButton.addEventListener("click", () => {
  trackEvent("make_it_reality_clicked", { mission_type: currentResult?.type, language: activeLanguage, page: "results", schedule_used: Boolean(currentResult?.schedule?.startDate && currentResult?.schedule?.endDate) });
  const schedule = currentResult?.schedule || {};
  const flight = currentResult?.flights?.find?.((item) => item.recommended) || currentResult?.flights?.[0];
  const hotel = currentResult?.hotels?.find?.((item) => item.recommended) || currentResult?.hotels?.[0];
  const experienceMission = isExperienceMission(currentResult, currentResult?.missionContext);
  const experience = currentExperienceReview?.generatedExperience?.onePick;
  const local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
  const reviewItems = experienceMission && experience
    ? [
        { label: local("Mission", "미션", "Misión"), value: approvalMissionName() },
        { label: "ONE Pick", value: currentExperienceReview.recommendation },
        { label: local("Timeline", "시간별 일정", "Horario"), value: experience.timeline.map((item) => `${item.time} · ${item.title}`).join(" / ") },
        { label: local("Transportation", "이동 방법", "Transporte"), value: experience.transportation },
        { label: local("Weather backup", "날씨 대안", "Alternativa climática"), value: experience.rainPlan }
      ]
    : [
        { label: activeLanguage === "ko" ? "미션" : "Mission", value: approvalMissionName() },
        { label: activeLanguage === "ko" ? "여행 날짜" : "Travel dates", value: schedule.startDate && schedule.endDate ? `${schedule.startDate} → ${schedule.endDate}` : "" },
        { label: activeLanguage === "ko" ? "항공편 설정" : "Flight preference", value: flight?.provider || "" },
        { label: activeLanguage === "ko" ? "호텔 설정" : "Hotel preference", value: hotel?.name || "" }
      ];
  openApprovalInformationReview({
    language: activeLanguage,
    items: reviewItems,
    onApprove: runApprovalSequence
  });

});

activeLanguage = getLanguage();

document.documentElement.lang = activeLanguage;
document.title = activeLanguage === "ko" ? "Kastiz ONE — 미션 준비 완료" : "Kastiz ONE — Mission Ready";

setTheme();
updateTextContent();
updateLocation();
renderMission();
initializeOptionSelections();
renderApprovalList();
enableCustomization();
const requestedReference = new URLSearchParams(location.search).get("reference")?.toUpperCase();
if (currentResult?.portableShare === true || /^ONE-DEMO-[A-Z0-9]{8}$/.test(requestedReference || "")) {
  document.body.classList.add("portable-summary-view");
  buildExecutionSummary();
  const finalTitle = completionMessage.querySelector("h3");
  if (finalTitle) finalTitle.textContent = localize(currentResult?.finalMessage) || t("finalMessage");
  completionMessage.hidden = false;
  bottomActions.hidden = true;
  approvalPanel.hidden = false;
  approvalList.hidden = true;
  document.title = activeLanguage === "ko" ? "Kastiz ONE — 완료된 실행 요약" : "Kastiz ONE — Completed Summary";
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
}
trackEvent("page_visit", { page: "results", language: activeLanguage });
trackEvent("results_viewed", { page: "results", language: activeLanguage, mission_type: currentResult?.type });


