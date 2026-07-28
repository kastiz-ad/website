import { trackEvent } from "../analytics.js";
import { openApprovalInformationReview } from "../ui/approval-information-review.js";
import { OFFICIAL_LOCALES, localeSection } from "../i18n/locale-registry.js";
import { reviseMission } from "../engine/revision/mission-revision-engine.js";
import { buildContextualExperienceIntelligence as buildExperienceIntelligence } from "../engine/context/context-experience-intelligence.js?v=20260722-context-v2";
import { buildMissionContext, isDomesticContext } from "../engine/context/mission-context-intelligence.js?v=20260722-context-v2";
import { missionMemoryEnabled, readMissionMemories } from "../profile/mission-memory.js";
import { createHOSKernel } from "../engine/kernel/hos-kernel-v16.js?v=20260726-v21-1";
import { buildTravelWorldIntelligence, sourceStateUserLabel } from "../engine/world-intelligence/world-intelligence-foundation-v24.js?v=20260727-v24";
import { generateMissionInsights, insightStorageKey, splitVisibleMissionInsights } from "../engine/insights/mission-insights-alpha01.js?v=20260727-alpha01";
import {
  ALPHA04_LIVING_MISSION_VERSION,
  createLivingMissionWorkspace,
  getSectionUpdateReason,
  livingMissionStorageKey,
  sectionWasRecentlyUpdated
} from "../engine/workspace/living-mission-alpha04.js?v=20260727-alpha04-living-mission";
import {
  ALPHA05_EXECUTION_ORCHESTRATOR_VERSION,
  createExecutionOrchestrator,
  validateExecutionOrchestrator
} from "../engine/workspace/execution-orchestrator-alpha05.js?v=20260729-alpha05-execution-orchestrator";
import {
  ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION,
  applyPredictionFeedback,
  createPredictiveIntelligenceLayer,
  predictionStorageKey,
  validatePredictiveIntelligence
} from "../engine/workspace/predictive-intelligence-alpha06.js?v=20260729-alpha06-predictive-intelligence";
import {
  ALPHA07_PERSONAL_MISSION_MEMORY_VERSION,
  applyPersonalMissionMemory,
  explainMissionMemoryUse,
  readPersonalMissionMemoryFromBrowser
} from "../profile/personal-mission-memory-alpha07.js?v=20260729-alpha07-personal-mission-memory";
import {
  createMissionDirectorBrief,
  validateMissionDirectorBrief
} from "../engine/agents/mission-director-alpha08.js?v=20260729-alpha08-multi-agent-collaboration";
import {
  buildProviderTrustBrief,
  trustBadgeLabel,
  validateProviderTrustBrief
} from "../engine/trust/provider-trust-network-alpha09.js?v=20260729-alpha09-provider-trust-network";
import {
  buildConversationUnderstandingLayer,
  validateConversationUnderstandingLayer
} from "../engine/conversation/natural-mission-conversation-alpha10.js?v=20260729-alpha10-natural-mission-conversation";
import {
  createMissionWatcherLayer,
  validateMissionWatcherLayer,
  watcherLabel
} from "../engine/monitoring/mission-watchers-alpha11.js?v=20260729-alpha14-selection-fix";
import {
  createLifeTimelineLayer,
  deleteLifeTimeline,
  disableLifeMissionSuggestions,
  exportLifeTimeline,
  hideLifeTimeline,
  pauseLifeTimeline,
  relationshipLabel,
  validateLifeTimelineLayer
} from "../engine/timeline/life-timeline-alpha12.js?v=20260729-alpha14-selection-fix";
import {
  EXPLANATION_DETAIL_LEVELS,
  createExplanationLayer,
  setExplanationDetailLevel,
  validateExplanationLayer
} from "../engine/explanations/explainable-intelligence-alpha14.js?v=20260729-alpha14-selection-fix";
import {
  ALPHA02_REFINEMENT_VERSION,
  applyRefinementAnswer,
  archiveRefinementQuestion,
  buildProgressiveRefinement,
  createEmptyRefinementState,
  refinementStorageKey
} from "../engine/refinement/progressive-refinement-alpha02.js?v=20260727-alpha04-living-mission";

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
  const manualScenario = getManualScenarioResult();
  if (manualScenario) return manualScenario;
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

const MANUAL_V21_SCENARIOS = Object.freeze({
  "child-english": "아이가 영어가 부족한데 어떻게 할까?",
  "academy-english": "인천 서구에서 중학생 영어 내신 학원 찾아줘",
  "japan-travel": "일본 여행",
  "tooth-pain": "이가 아픈데 오늘 갈 수 있는 치과 찾아줘",
  "sink-leak": "싱크대 누수 수리업체 찾아줘",
  "unknown-help": "도와줘"
});

const V22_VERSION = "20260726-v22-product-refinement";

const MANUAL_V22_SCENARIOS = Object.freeze({
  travel: "일본 여행",
  education: "인천 서구에서 중학생 영어 내신 학원 찾아줘",
  healthcare: "이가 아픈데 오늘 갈 수 있는 치과 찾아줘",
  business: "한국에서 외국인이 회사를 시작하려면 준비해 줘",
  "home-services": "싱크대 누수 수리업체 찾아줘",
  home: "싱크대 누수 수리업체 찾아줘",
  career: "한국에서 일자리를 찾고 싶어"
});

const MANUAL_V23_TRAVEL_SCENARIOS = Object.freeze({
  "sapporo-general": "삿포로 여행",
  "sapporo-food": "삿포로 맛집 여행",
  "sapporo-family": "가족과 삿포로 여행",
  "sapporo-budget": "삿포로 실속 여행",
  "missing-live-data": "삿포로 여행",
  "mixed-source-states": "삿포로 여행",
  "mobile": "삿포로 여행",
  "long-provider-names": "삿포로 여행",
  "no-visa-required": "삿포로 여행",
  "visa-unresolved": "삿포로 여행"
});

const MANUAL_V231_APPROVAL_SCENARIOS = Object.freeze({
  "preparation-approved-no-dates": "preparation_approved",
  "dates-known-no-live-provider": "preparation_approved",
  "live-search-approved-adapter-unavailable": "live_search_requested",
  "cached-public-provider-result": "preparation_approved",
  "verified-live-provider-result-not-booked": "preparation_approved",
  "booking-approval-requested": "transaction_approval_requested",
  "provider-processing": "provider_processing",
  "real-completion-fixture": "completed_verified_fixture",
  "direct-completion-blocked": "completion_blocked",
  "korean-language-integrity": "preparation_approved"
});

const isTravelResult = (result) => ["travel", "travel-preparation"].includes(result?.type) || result?.domain === "travel" || result?.resolutionPlan?.domain === "travel";

const createResolutionResultFromPrompt = (prompt, language = activeLanguage) => {
  const kernelOutput = createHOSKernel().run({
    mission: prompt,
    language,
    currentLocation: language === "ko" ? "서울" : "Seoul"
  });
  const plan = kernelOutput.resolutionPlan;
  return {
    id: `manual-v21-${Date.now()}`,
    resultId: `manual-result-${Date.now()}`,
    type: plan?.domain || kernelOutput.classification?.providerType || "general_mission",
    domain: plan?.domain || kernelOutput.classification?.providerType || "general_mission",
    missionType: plan?.missionType,
    status: "mission-ready",
    mission: prompt,
    originalMission: prompt,
    rawInput: prompt,
    language,
    interfaceLanguage: language,
    approvalRequired: true,
    classification: kernelOutput.classification,
    humanReasoning: kernelOutput.humanReasoning,
    missionIntelligence: kernelOutput.missionIntelligence,
    resolutionPlan: plan,
    display: {
      missionReady: t("missionReady"),
      title: prompt,
      approvalProtection: t("approvalProtection")
    },
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

function getManualScenarioResult() {
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get("v23TravelScenario") || params.get("v22Scenario") || params.get("v21Scenario") || params.get("scenario");
  const prompt = MANUAL_V23_TRAVEL_SCENARIOS[scenario] || MANUAL_V22_SCENARIOS[scenario] || MANUAL_V21_SCENARIOS[scenario] || params.get("mission");
  if (!prompt) return null;
  const language = params.get("lang") || (/[\u3131-\uD79D]/.test(prompt) ? "ko" : activeLanguage);
  const result = createResolutionResultFromPrompt(prompt, language);
  result.v24WorldScenario = params.get("v24WorldScenario") || "";
  result.alpha04Scenario = params.get("alpha04Scenario") || "";
  if (MANUAL_V23_TRAVEL_SCENARIOS[scenario]) {
    result.v23TravelScenario = scenario;
    result.v23ApprovalScenario = params.get("v23ApprovalScenario") || "";
    result.destination = {
      ...(result.destination || {}),
      country: "Japan",
      countryKo: "일본",
      countryCode: "JP",
      city: "Sapporo",
      cityKo: "삿포로",
      continent: "Asia"
    };
    result.country = "JP";
    result.countryProfile = { ...(result.countryProfile || {}), code: "JP", name: "Japan", nameKo: "일본", capital: "Tokyo", currency: "JPY", continent: "Asia" };
  }
  return result;
}

const createNeutralMissionResult = () => createResolutionResultFromPrompt(
  activeLanguage === "ko" ? "도와줘" : activeLanguage === "es" ? "Ayúdame" : "Help me",
  activeLanguage
);

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
  if (!stored) return createNeutralMissionResult();

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

const normalizeOptionLabel = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const getFlightName = (flight) => {
  const name = activeLanguage === "ko" ? flight.providerKo || flight.provider : flight.provider;
  return /^KLM(?:\s|$)/i.test(String(name || "")) ? "KLM" : name;
};

const getHotelName = (hotel) => {
  const destination = currentResult?.destination?.city || currentResult?.destination?.country || currentResult?.display?.destination || "";
  const name = activeLanguage === "ko" ? hotel.nameKo || hotel.name : hotel.name;
  return String(name || "").replace(/^the destination\b/i, destination || (activeLanguage === "ko" ? "목적지" : "Destination")).trim();
};

const getRestaurantName = (restaurant) => {
  const destination = currentResult?.destination?.city || currentResult?.destination?.country || currentResult?.display?.destination || "";
  const name = activeLanguage === "ko" ? restaurant.typeKo || restaurant.type : restaurant.type;
  return String(name || "").replace(/^the destination\b/i, destination || (activeLanguage === "ko" ? "목적지" : "Destination")).trim();
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
    [`${city} Dining Room`, 4.4, 45000, 110000], [`${city} Neighborhood Cafe`, 4.5, 12000, 35000],
    [`${city} Bistro`, 4.5, 28000, 68000], [`${city} Grill`, 4.4, 35000, 90000],
    [`${city} Sushi House`, 4.5, 30000, 85000], [`${city} Pasta Bar`, 4.4, 26000, 72000],
    [`${city} Steak Kitchen`, 4.5, 55000, 140000], [`${city} Seafood Table`, 4.4, 45000, 120000],
    [`${city} Bakery Cafe`, 4.6, 12000, 32000], [`${city} Rooftop Dining`, 4.5, 50000, 135000]
  ];
};

const TRAVEL_OPTION_TARGETS = Object.freeze({
  flights: 8,
  hotels: 8,
  restaurants: 12
});

const airlineFallbackOptions = [
  ["Korean Air", "대한항공"],
  ["Asiana Airlines", "아시아나항공"],
  ["Delta Air Lines", "델타항공"],
  ["United Airlines", "유나이티드항공"],
  ["American Airlines", "아메리칸항공"],
  ["Qatar Airways", "카타르항공"],
  ["Emirates", "에미레이트항공"],
  ["Turkish Airlines", "터키항공"],
  ["Singapore Airlines", "싱가포르항공"],
  ["Lufthansa", "루프트한자"]
];

const uniqueProviderEntries = (entries = []) => {
  const seen = new Set();
  return entries.filter((entry) => {
    const name = String(Array.isArray(entry) ? entry[0] : entry || "").trim();
    const key = name.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const expandPriceRanges = (ranges = [], fallbackRanges = [], target = 8) => {
  const usable = [...(Array.isArray(ranges) ? ranges : []), ...(Array.isArray(fallbackRanges) ? fallbackRanges : [])]
    .filter((range) => Array.isArray(range) && range.length >= 2 && Number.isFinite(Number(range[0])) && Number.isFinite(Number(range[1])));
  const base = usable.length ? usable : [[120000, 340000], [220000, 560000], [90000, 250000], [70000, 180000]];
  const next = [...usable];
  let cursor = 0;
  while (next.length < target) {
    const source = base[cursor % base.length];
    const drift = 1 + (Math.floor(cursor / base.length) + 1) * 0.04;
    next.push([Math.round(source[0] * drift / 1000) * 1000, Math.round(source[1] * drift / 1000) * 1000]);
    cursor += 1;
  }
  return next.slice(0, target);
};

const uniqueRestaurantCandidates = (entries = []) => {
  const seen = new Set();
  return entries.filter(([name]) => {
    const key = String(name || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function adaptTravelResultToDestination(result) {
  const code = result.country || result.countryProfile?.code || result.destination?.code;
  const continent = result.destination?.continent || result.countryProfile?.continent || "";
  const profileCode = String(code || "global").toLowerCase();
  const city = result.destination?.city || result.countryProfile?.capital || "the destination";
  const cityKo = result.destination?.cityKo || result.countryProfile?.capitalKo || city;
  const livePlaces = findLiveProvider(result, "local_places");
  const worldIntelligence = buildTravelWorldIntelligence(result, { scenario: result.v24WorldScenario || "" });
  const worldHotels = worldIntelligence.models.hotels || [];
  const worldRestaurants = worldIntelligence.models.restaurants || [];
  const worldFlights = worldIntelligence.models.flights || [];
  const worldHotelNames = worldHotels.map((item) => item.name).filter(Boolean);
  const liveHotelNames = (livePlaces?.items || []).filter((item) => item.kind === "hotel").map((item) => item.label).slice(0, TRAVEL_OPTION_TARGETS.hotels);
  const liveRestaurantPlaces = (livePlaces?.items || []).filter((item) => item.kind === "restaurant").slice(0, TRAVEL_OPTION_TARGETS.restaurants);
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
    hotels: worldHotelNames.length ? worldHotelNames : (liveHotelNames.length ? liveHotelNames : [`${city} accommodation search required`]),
    hotelPrices: nightlyRangesByContinent[continent] || [[120000, 340000], [220000, 560000], [90000, 250000], [70000, 180000]],
    transfer: `Official airport rail, bus, taxi, or licensed transfer in ${city}`
  };
  const cityOverride = cityProfileOverride(code, city);
  const profile = cityOverride ? { ...baseProfile, ...cityOverride } : { ...baseProfile };
  const hotelFallbacks = [
    `${city} accommodation live search`,
    `${city} premium stay live search`,
    `${city} value stay live search`,
    `${city} budget stay live search`,
    `${city} boutique stay live search`,
    `${city} family stay live search`,
    `${city} flexible stay live search`,
    `${city} verified-provider search`
  ];
  const hotelPool = [...new Set([...liveHotelNames, ...(profile.hotels || []), ...hotelFallbacks])];
  profile.hotels = hotelPool.slice(0, TRAVEL_OPTION_TARGETS.hotels);
  profile.airlines = uniqueProviderEntries([...(profile.airlines || []), ...airlineFallbackOptions]).slice(0, TRAVEL_OPTION_TARGETS.flights);
  profile.flightPrices = expandPriceRanges(profile.flightPrices, genericPrices, TRAVEL_OPTION_TARGETS.flights);
  profile.hotelPrices = expandPriceRanges(profile.hotelPrices, nightlyRangesByContinent[continent], TRAVEL_OPTION_TARGETS.hotels);
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
    const worldFlight = worldFlights[index] || worldFlights[0] || {};
    return {
      ...(result.flights?.[index] || result.flights?.[0] || {}),
      id: `flight-${profileCode}-${index + 1}`,
      provider: worldFlight.airline || provider,
      providerKo,
      category: index === 0 ? "recommended" : "alternative",
      estimatedPrice: priceFor(index),
      priceBasis: worldFlight.priceState || "estimated_until_live_search",
      sourceState: worldFlight.sourceState || "estimated",
      sourceMetadata: worldFlight.sourceMetadata || null,
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
    priceBasis: worldHotels[index]?.priceState || "requires_live_search",
    sourceState: worldHotels[index]?.sourceState || "unavailable",
    sourceMetadata: worldHotels[index]?.sourceMetadata || null,
    reason: hotelReasons[index]?.[0] || `Practical prototype accommodation option in ${city}.`,
    reasonKo: hotelReasons[index]?.[1] || `${cityKo}의 실용적인 프로토타입 숙소 옵션입니다.`
  }));
  const liveRestaurantCandidates = liveRestaurantPlaces.map((place, index) => [
    place.label,
    null,
    [30000, 22000, 45000, 18000, 35000, 25000, 28000, 42000, 52000, 16000, 38000, 47000][index] || 25000,
    [75000, 60000, 110000, 50000, 85000, 65000, 70000, 95000, 130000, 42000, 90000, 120000][index] || 65000,
    place.cuisine,
    place.source
  ]);
  const restaurantCandidates = uniqueRestaurantCandidates([
    ...liveRestaurantCandidates,
    ...restaurantProfileForCity(city)
  ]).slice(0, TRAVEL_OPTION_TARGETS.restaurants);
  const restaurants = restaurantCandidates.map(([name, rating, min, max, cuisine, source], index) => ({
    ...(result.restaurants?.[index] || {}),
    id: `restaurant-${profileCode}-${index + 1}`,
    type: name,
    typeKo: localizedVenueNames[name] || name,
    venueName: name,
    venueNameKo: localizedVenueNames[name] || name,
    rating,
    cuisine: cuisine || "",
    providerSource: source || "ONE World Intelligence estimate",
    sourceState: worldRestaurants[index]?.sourceState || (source ? "cached_public" : "estimated"),
    sourceMetadata: worldRestaurants[index]?.sourceMetadata || null,
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
    worldIntelligence,
    v24WorldIntelligence: true,
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

const v22Local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;

const DOMAIN_PRESENTATION = Object.freeze({
  education: {
    icon: "✦",
    accent: "learning",
    title: {
      en: "Learning plan",
      ko: "학습 해결 계획",
      es: "Plan de aprendizaje"
    },
    prototype: {
      en: "Prototype · education support · no academy contacted",
      ko: "프로토타입 · 학습 지원 · 학원 연락 없음",
      es: "Prototipo · apoyo educativo · sin contactar academias"
    },
    understood: {
      en: "ONE understood the learning gap, student level, commute, and comparison path.",
      ko: "ONE이 학습 문제, 학생 수준, 통학 조건, 비교 방향을 정리했습니다.",
      es: "ONE entendió la necesidad de aprendizaje, nivel, distancia y comparación."
    },
    prepared: {
      en: ["Level check", "Academy path", "Tutor option", "Home routine"],
      ko: ["수준 점검", "학원 비교", "과외 대안", "가정 학습"],
      es: ["Nivel", "Academias", "Tutor", "Rutina en casa"]
    }
  },
  healthcare: {
    icon: "＋",
    accent: "care",
    title: {
      en: "Care navigation",
      ko: "진료 안내 계획",
      es: "Ruta de atención"
    },
    prototype: {
      en: "Prototype · care navigation · not medical advice",
      ko: "프로토타입 · 진료 안내 · 의학적 진단 아님",
      es: "Prototipo · orientación médica · no es diagnóstico"
    },
    understood: {
      en: "ONE separated urgency, specialty, same-day path, and safety warnings.",
      ko: "ONE이 긴급도, 진료과, 당일 가능 경로, 주의사항을 나눠 정리했습니다.",
      es: "ONE separó urgencia, especialidad, disponibilidad y advertencias."
    },
    prepared: {
      en: ["Urgency", "Specialty", "Same-day path", "Warning signs"],
      ko: ["긴급도", "진료과", "당일 경로", "주의 신호"],
      es: ["Urgencia", "Especialidad", "Hoy", "Alertas"]
    }
  },
  business: {
    icon: "◇",
    accent: "business",
    title: {
      en: "Business setup plan",
      ko: "사업 준비 계획",
      es: "Plan de negocio"
    },
    prototype: {
      en: "Prototype · business preparation · no filing submitted",
      ko: "프로토타입 · 사업 준비 · 서류 제출 없음",
      es: "Prototipo · preparación empresarial · sin presentar trámites"
    },
    understood: {
      en: "ONE organized the official steps, documents, expert help, and approval boundary.",
      ko: "ONE이 공식 절차, 필요 서류, 전문가 도움, 승인 경계를 정리했습니다.",
      es: "ONE organizó pasos oficiales, documentos, expertos y aprobación."
    },
    prepared: {
      en: ["Official steps", "Documents", "Specialists", "Approval boundary"],
      ko: ["공식 절차", "필요 서류", "전문가", "승인 경계"],
      es: ["Pasos oficiales", "Documentos", "Expertos", "Aprobación"]
    }
  },
  "home-services": {
    icon: "⌂",
    accent: "home",
    title: {
      en: "Home service plan",
      ko: "생활 서비스 해결 계획",
      es: "Plan de servicio local"
    },
    prototype: {
      en: "Prototype · local service preparation · no provider contacted",
      ko: "프로토타입 · 생활 서비스 준비 · 업체 연락 없음",
      es: "Prototipo · servicio local · sin contactar proveedores"
    },
    understood: {
      en: "ONE prepared immediate damage control, provider comparison, and safe approval steps.",
      ko: "ONE이 즉시 피해 줄이기, 업체 비교, 승인 후 연락 단계를 준비했습니다.",
      es: "ONE preparó control inicial, comparación y aprobación segura."
    },
    prepared: {
      en: ["Damage control", "Provider path", "Photos", "Fallbacks"],
      ko: ["피해 줄이기", "업체 경로", "사진 준비", "대안"],
      es: ["Control", "Proveedor", "Fotos", "Alternativas"]
    }
  },
  career: {
    icon: "↗",
    accent: "career",
    title: {
      en: "Career action plan",
      ko: "커리어 실행 계획",
      es: "Plan profesional"
    },
    prototype: {
      en: "Prototype · career preparation · no application submitted",
      ko: "프로토타입 · 커리어 준비 · 지원서 제출 없음",
      es: "Prototipo · carrera · sin enviar solicitudes"
    },
    understood: {
      en: "ONE structured the role target, resume path, interview preparation, and approval gate.",
      ko: "ONE이 목표 직무, 이력서, 면접 준비, 승인 후 지원 단계를 정리했습니다.",
      es: "ONE estructuró objetivo, CV, entrevista y aprobación."
    },
    prepared: {
      en: ["Role target", "Resume", "Interview", "Applications"],
      ko: ["목표 직무", "이력서", "면접", "지원"],
      es: ["Puesto", "CV", "Entrevista", "Postulación"]
    }
  },
  general: {
    icon: "○",
    accent: "general",
    title: {
      en: "Mission plan",
      ko: "미션 해결 계획",
      es: "Plan de misión"
    },
    prototype: {
      en: "Prototype · approval protected · no external action",
      ko: "프로토타입 · 승인 보호 · 외부 실행 없음",
      es: "Prototipo · aprobación protegida · sin acción externa"
    },
    understood: {
      en: "ONE organized the goal, possible paths, and approval boundary.",
      ko: "ONE이 목표, 가능한 경로, 승인 경계를 정리했습니다.",
      es: "ONE organizó objetivo, rutas posibles y aprobación."
    },
    prepared: {
      en: ["Goal", "Plan", "Options", "Approval"],
      ko: ["목표", "계획", "대안", "승인"],
      es: ["Objetivo", "Plan", "Opciones", "Aprobación"]
    }
  }
});

const TERM_TRANSLATIONS = Object.freeze({
  "education": { ko: "교육", es: "educación" },
  "healthcare": { ko: "의료", es: "salud" },
  "business": { ko: "사업", es: "negocio" },
  "home-services": { ko: "생활 서비스", es: "servicios del hogar" },
  "career": { ko: "커리어", es: "carrera" },
  "general": { ko: "일반 미션", es: "misión general" },
  "child-english-performance-decline": { ko: "아이 영어 실력 개선", es: "mejorar inglés del niño" },
  "academy-finder": { ko: "학원 찾기", es: "buscar academia" },
  "dental-care": { ko: "치과 진료 안내", es: "atención dental" },
  "plumbing": { ko: "누수 수리", es: "reparación de fuga" },
  "company-formation": { ko: "회사 설립 준비", es: "creación de empresa" },
  "job-search": { ko: "일자리 찾기", es: "búsqueda laboral" },
  "English level and study-pattern review": { ko: "영어 수준과 학습 패턴 점검", es: "revisión de nivel y hábitos de inglés" },
  "English academy comparison path": { ko: "영어 학원 비교", es: "comparación de academias de inglés" },
  "Private tutor path": { ko: "과외 선생님 비교", es: "comparación de tutor privado" },
  "Eight-week home-study routine": { ko: "8주 가정 학습 루틴", es: "rutina de estudio de 8 semanas" },
  "Teacher or school discussion path": { ko: "학교 선생님 상담 준비", es: "conversación con profesor o escuela" },
  "Same-day dental navigation": { ko: "오늘 가능한 치과 진료 경로", es: "ruta dental para hoy" },
  "Urgent or emergency escalation": { ko: "응급 여부 확인", es: "evaluación urgente" },
  "After-hours fallback": { ko: "야간·주말 대안", es: "alternativa fuera de horario" },
  "Immediate damage control": { ko: "즉시 피해 줄이기", es: "control inmediato de daños" },
  "Plumber provider path": { ko: "수리업체 연결 준비", es: "ruta de proveedor de plomería" },
  "Landlord or building manager fallback": { ko: "집주인·관리사무소 대안", es: "alternativa con propietario o administración" },
  "Official business registration path": { ko: "공식 사업자 등록 경로", es: "ruta oficial de registro" },
  "Professional support path": { ko: "전문가 도움 경로", es: "ruta con especialista" },
  "Job matching preparation path": { ko: "일자리 매칭 준비", es: "preparación de búsqueda laboral" },
  "Resume and interview readiness path": { ko: "이력서·면접 준비", es: "CV y entrevista" },
  "Review prepared plan": { ko: "준비된 계획 검토", es: "revisar plan preparado" },
  "Contact provider after approval": { ko: "승인 후 제공업체 연락", es: "contactar proveedor tras aprobación" },
  "Submit after approval": { ko: "승인 후 제출", es: "enviar tras aprobación" },
  "Schedule after approval": { ko: "승인 후 일정 확정", es: "programar tras aprobación" },
  "No external action before approval.": { ko: "승인 전에는 외부 실행이 없습니다.", es: "Sin acción externa antes de aprobar." },
  "Live provider data is not connected in this prototype.": { ko: "이 프로토타입에는 실시간 제공업체 데이터가 연결되어 있지 않습니다.", es: "Este prototipo no tiene datos de proveedores en vivo." }
});

const getDomainKey = (result = currentResult) => {
  const key = result?.resolutionPlan?.domain || result?.domain || result?.type || "general";
  return DOMAIN_PRESENTATION[key] ? key : "general";
};

const domainPresentation = (result = currentResult) => DOMAIN_PRESENTATION[getDomainKey(result)] || DOMAIN_PRESENTATION.general;

const localizeDomainText = (value) => {
  const raw = String(value?.title || value?.label || value || "").trim();
  if (!raw) return "";
  const translated = TERM_TRANSLATIONS[raw];
  if (translated) return activeLanguage === "ko" ? translated.ko : activeLanguage === "es" ? translated.es : raw;
  const cleaned = raw.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
  if (activeLanguage === "en" && !/[.!?]/.test(cleaned) && cleaned.length < 42) {
    return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
  return cleaned;
};

const hasUntranslatedEnglish = (value) => activeLanguage !== "en" && /[A-Za-z]{4,}/.test(String(value || ""));

const polishedDomainText = (value, fallback) => {
  const text = localizeDomainText(value);
  return hasUntranslatedEnglish(text) ? fallback : text;
};

const createV22Chip = (label, tone = "") => {
  const safe = escapeSummaryText(localizeDomainText(label));
  return safe ? `<span class="v22-chip${tone ? ` is-${tone}` : ""}">${safe}</span>` : "";
};

const createV22Card = ({ id, title, kicker = "", body = "", chips = [], items = [], wide = false, tone = "" }) => {
  const article = document.createElement("article");
  article.className = `mission-card v22-card${wide ? " is-wide" : ""}${tone ? ` is-${tone}` : ""}`;
  article.dataset.cardId = id;
  const chipHtml = chips.map((chip) => createV22Chip(chip)).join("");
  const itemHtml = items.map((item) => `<li>${escapeSummaryText(localizeDomainText(item))}</li>`).join("");
  article.innerHTML = `
    <div class="v22-card-heading">
      ${kicker ? `<span class="v22-kicker">${escapeSummaryText(kicker)}</span>` : ""}
      <h2>${escapeSummaryText(title)}</h2>
    </div>
    ${body ? `<p class="v22-card-body">${escapeSummaryText(localizeDomainText(body))}</p>` : ""}
    ${chipHtml ? `<div class="v22-chip-list">${chipHtml}</div>` : ""}
    ${itemHtml ? `<ul class="v22-clean-list">${itemHtml}</ul>` : ""}
  `;
  return article;
};

const createV22PathCard = ({ id, title, reason, steps = [], selected = false }) => {
  const article = document.createElement("article");
  article.className = `v22-path-card${selected ? " is-selected" : ""}`;
  article.dataset.pathId = id;
  article.innerHTML = `
    <button type="button" class="v22-path-select" aria-pressed="${selected}">
      <span class="v22-path-check">${selected ? "✓" : "+"}</span>
      <span class="v22-path-content">
        <strong>${escapeSummaryText(localizeDomainText(title))}</strong>
        <small>${escapeSummaryText(localizeDomainText(reason))}</small>
      </span>
    </button>
    <div class="v22-chip-list">${steps.slice(0, 4).map((step) => createV22Chip(step)).join("")}</div>
  `;
  return article;
};

const getTravelDestinationLabel = (result) => {
  const city = activeLanguage === "ko" ? result.destination?.cityKo || result.destination?.city : result.destination?.city;
  const country = activeLanguage === "ko" ? result.destination?.countryKo || result.destination?.country : result.destination?.country;
  return city || country || (activeLanguage === "ko" ? "목적지" : activeLanguage === "es" ? "destino" : "destination");
};

const getTravelDurationLabel = (result) => {
  const start = result.schedule?.startDate ? new Date(`${result.schedule.startDate}T00:00:00`) : null;
  const end = result.schedule?.endDate ? new Date(`${result.schedule.endDate}T00:00:00`) : null;
  const days = start && end && !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf())
    ? Math.max(1, Math.round((end - start) / 86400000) + 1)
    : 5;
  return activeLanguage === "ko" ? `${days}일` : activeLanguage === "es" ? `${days} días` : `${days} days`;
};

const getTravelBudgetLabel = (result, tone = "balanced") => {
  const total = result.budget?.estimatedTotal || result.budget?.total;
  if (total?.min && total?.max) {
    return activeLanguage === "ko" ? `예상 ${formatRange(total)}` : activeLanguage === "es" ? `Estimado ${formatRange(total)}` : `Estimated ${formatRange(total)}`;
  }
  const labels = {
    balanced: { en: "Estimated budget: medium", ko: "예상 예산: 중간", es: "Presupuesto estimado: medio" },
    food: { en: "Estimated budget: medium+", ko: "예상 예산: 중상", es: "Presupuesto estimado: medio alto" },
    value: { en: "Estimated budget: value", ko: "예상 예산: 실속", es: "Presupuesto estimado: ahorro" },
    rest: { en: "Estimated budget: comfort", ko: "예상 예산: 여유", es: "Presupuesto estimado: cómodo" }
  };
  return localize(labels[tone] || labels.balanced);
};

const sourceStateLabel = (state) => {
  const labels = {
    verified_live: { en: "Verified live", ko: "실시간 확인", es: "Verificado en vivo" },
    cached_public: { en: "Recent public info", ko: "최근 공개 정보 기준", es: "Información pública reciente" },
    estimated: { en: "Estimated", ko: "예상", es: "Estimado" },
    placeholder: { en: "Search structure ready", ko: "검색 조건 준비됨", es: "Estructura preparada" },
    unavailable: { en: "Live search required", ko: "실시간 검색 필요", es: "Búsqueda en vivo necesaria" }
  };
  return localize(labels[state] || labels.placeholder);
};

const getScenarioSourceState = (result, key, fallback = "estimated") => {
  if (result.v23TravelScenario === "missing-live-data") return "unavailable";
  if (result.v23TravelScenario === "mixed-source-states") {
    return { flight: "estimated", hotel: "cached_public", transport: "placeholder", food: "placeholder", entry: "unavailable", insurance: "placeholder" }[key] || fallback;
  }
  return fallback;
};

const providerSourceNote = (state) => {
  const copy = {
    verified_live: { en: "Confirmed by a live provider source.", ko: "실시간 제공업체 정보로 확인되었습니다.", es: "Confirmado por fuente en vivo." },
    cached_public: { en: "Based on recent public information.", ko: "최근 공개 정보 기준입니다.", es: "Basado en información pública reciente." },
    estimated: { en: "Estimated only. ONE will verify before approval.", ko: "예상 정보입니다. 승인 전 ONE이 다시 확인합니다.", es: "Solo estimado. ONE verifica antes de aprobar." },
    placeholder: { en: "No fictional provider shown. Search conditions are ready.", ko: "가상 업체명은 표시하지 않습니다. 검색 조건만 준비했습니다.", es: "Sin proveedor ficticio; criterios listos." },
    unavailable: { en: "Live provider search is required.", ko: "실시간 제공업체 검색이 필요합니다.", es: "Se requiere búsqueda en vivo." }
  };
  return localize(copy[state] || copy.placeholder);
};

const buildV23TravelJourneys = (result, missionContext) => {
  const destination = getTravelDestinationLabel(result);
  const duration = getTravelDurationLabel(result);
  const ko = activeLanguage === "ko";
  const es = activeLanguage === "es";
  const isFamily = /가족|family|familia/i.test(result.rawInput || result.mission || "");
  const isFood = /맛집|food|gourmet|comida/i.test(result.rawInput || result.mission || "") || result.v23TravelScenario === "sapporo-food";
  const isBudget = /실속|저렴|budget|cheap|econ[oó]mico/i.test(result.rawInput || result.mission || "") || result.v23TravelScenario === "sapporo-budget";
  const names = [
    ko ? `편안한 ${destination}` : es ? `${destination} cómodo` : `Comfortable ${destination}`,
    ko ? `맛집 중심 ${destination}` : es ? `${destination} gastronómico` : `Food-focused ${destination}`,
    ko ? `실속형 ${destination}` : es ? `${destination} eficiente` : `Value ${destination}`,
    ko ? (isFamily ? `가족 추억 ${destination}` : `온천과 휴식 ${destination}`) : es ? `${destination} descanso` : `Restful ${destination}`
  ];
  const purposes = [
    ko ? "이동 부담을 줄이고 음식과 관광의 균형을 맞춘 일정" : es ? "Menos fricción, buen equilibrio entre comida y ciudad" : "Low-friction balance of food, city, and comfort",
    ko ? "현지 음식과 시장, 카페 시간을 더 넉넉하게 둔 일정" : es ? "Más tiempo para comida local, mercados y cafés" : "More time for local food, markets, and cafés",
    ko ? "핵심 경험은 지키고 불필요한 비용을 낮춘 일정" : es ? "Mantiene lo esencial y baja gastos innecesarios" : "Keeps the core experience while reducing spend",
    ko ? "휴식과 여유를 중심에 둔 느린 여행" : es ? "Viaje más lento, cómodo y reparador" : "A slower journey focused on rest"
  ];
  const tags = [
    ko ? ["음식", "시내 관광", "편안함", "결정 부담 낮음"] : es ? ["Comida", "Ciudad", "Cómodo", "Fácil"] : ["Food", "City", "Comfort", "Easy"],
    ko ? ["맛집", "시장", "카페", "야경"] : es ? ["Comida", "Mercado", "Café", "Noche"] : ["Food", "Markets", "Cafés", "Night"],
    ko ? ["실속", "핵심 관광", "대중교통", "가성비"] : es ? ["Ahorro", "Esencial", "Transporte", "Valor"] : ["Value", "Essentials", "Transit", "Efficient"],
    ko ? ["휴식", "온천", "천천히", isFamily ? "가족" : "여유"] : es ? ["Descanso", "Spa", "Lento", "Calma"] : ["Rest", "Spa", "Slow", "Calm"]
  ];
  const reasons = [
    ko ? "가장 무난하고 결정 부담이 적은 구성입니다." : es ? "La opción más fácil y equilibrada." : "The easiest balanced choice with the fewest decisions.",
    ko ? "먹는 즐거움을 여행의 중심에 두고 싶을 때 가장 잘 맞습니다." : es ? "Ideal si la comida es el centro del viaje." : "Best when food should lead the trip.",
    ko ? "가격 부담을 낮추면서 핵심 일정은 유지합니다." : es ? "Reduce gasto sin perder lo esencial." : "Lowers spend while keeping the core plan.",
    ko ? "빡빡한 이동보다 회복과 기억에 남는 시간을 우선합니다." : es ? "Prioriza descanso y momentos memorables." : "Prioritizes recovery and memorable time."
  ];
  const tones = ["balanced", "food", "value", "rest"];
  const preferredIndex = isFood ? 1 : isBudget ? 2 : isFamily ? 3 : 0;
  const timelines = [
    ko ? ["도착 후 숙소 주변 적응", "시내 대표 동선", "음식과 쇼핑", "여유 일정", "귀국 준비"] : ["Arrival and easy area setup", "Core city route", "Food and shopping", "Flexible day", "Return prep"],
    ko ? ["대표 음식 첫 식사", "시장과 카페", "예약 후보 비교", "야경과 디저트", "귀국 전 가벼운 식사"] : ["Signature first meal", "Market and cafés", "Restaurant shortlist", "Night view and dessert", "Easy final meal"],
    ko ? ["저녁 도착 기준 정리", "핵심 명소 압축", "대중교통 중심 이동", "무료·저비용 선택지", "귀국 준비"] : ["Evening arrival setup", "Compact highlights", "Transit-first route", "Low-cost options", "Return prep"],
    ko ? ["느린 체크인", "온천 또는 휴식", "가벼운 관광", "카페와 산책", "무리 없는 귀국"] : ["Slow check-in", "Spa or rest", "Light sightseeing", "Café and walk", "Easy return"]
  ];
  return names.map((name, index) => ({
    id: `v23-journey-${index}`,
    name,
    purpose: purposes[index],
    tags: tags[index],
    reason: reasons[index],
    duration,
    tone: tones[index],
    comfort: ko ? (index === 2 ? "효율 높음" : index === 1 ? "취향 선명" : "편안함 높음") : es ? (index === 2 ? "Muy eficiente" : "Alta comodidad") : (index === 2 ? "High efficiency" : "High comfort"),
    budget: getTravelBudgetLabel(result, tones[index]),
    timeline: timelines[index],
    selected: index === preferredIndex,
    details: {
      flight: ko ? "인천 출발 직항 또는 환승 부담이 낮은 항공편 우선" : es ? "Priorizar vuelo directo o conexión simple desde Incheon" : "Prioritize direct or low-friction flights from Incheon",
      hotel: ko ? `${destination}역 또는 중심 이동권 숙소 우선` : es ? `Zona central o estación principal de ${destination}` : `${destination} central station or walkable center`,
      transport: ko ? "공식 교통과 허가된 이동수단 중심으로 비교" : es ? "Comparar transporte oficial y traslados autorizados" : "Compare official transit and licensed transfers",
      food: ko ? (index === 1 ? "현지 음식·시장·카페 후보를 중심으로 구성" : "음식, 카페, 가벼운 활동을 균형 있게 구성") : es ? "Comida local, cafés y actividades equilibradas" : "Balanced food, cafés, and light activities",
      entry: ko ? "입국 요건은 실행 전 공식 채널로 다시 확인" : es ? "Revisar requisitos oficiales antes de ejecutar" : "Re-check entry requirements through official channels before execution",
      insurance: ko ? "여행자 보험과 일정 변경 리스크 확인 준비" : es ? "Preparar seguro y riesgo de cambios" : "Prepare insurance and schedule-change risk review"
    },
    sourceStates: {
      flight: getScenarioSourceState(result, "flight", "estimated"),
      hotel: getScenarioSourceState(result, "hotel", "estimated"),
      transport: getScenarioSourceState(result, "transport", "placeholder"),
      food: getScenarioSourceState(result, "food", "placeholder"),
      entry: result.v23TravelScenario === "no-visa-required" ? "cached_public" : getScenarioSourceState(result, "entry", "unavailable"),
      insurance: getScenarioSourceState(result, "insurance", "placeholder")
    }
  }));
};

const createV23SourcePill = (state) => `<span class="v23-source-pill is-${state}">${escapeSummaryText(sourceStateLabel(state))}</span>`;

const alpha03Copy = (en, ko, es) => v22Local(en, ko, es);

const getAlpha03DestinationProfile = (destination) => {
  const key = String(destination || "").toLowerCase();
  if (/sapporo|삿포로/.test(key)) {
    return {
      restaurants: [
        { icon: "🍜", name: "Sapporo Ramen Yokocho", tags: ["ramen", "Susukino"], source: "cached_public" },
        { icon: "🦀", name: "Nijo Market Seafood", tags: ["market", "seafood"], source: "cached_public" },
        { icon: "🍛", name: "Soup Curry GARAKU", tags: ["soup curry", "central"], source: "cached_public" },
        { icon: "☕", name: "MORIHICO Café", tags: ["coffee", "slow break"], source: "estimated" },
        { icon: "🍺", name: "Sapporo Beer Garden", tags: ["beer hall", "classic"], source: "cached_public" }
      ],
      places: [
        { icon: "🌳", name: "Odori Park", tags: ["walk", "seasonal"], source: "cached_public" },
        { icon: "🍺", name: "Sapporo Beer Museum", tags: ["indoor", "classic"], source: "cached_public" },
        { icon: "🦀", name: "Nijo Market", tags: ["morning", "food"], source: "cached_public" },
        { icon: "🌃", name: "JR Tower Observatory", tags: ["night view", "city"], source: "estimated" },
        { icon: "🛍️", name: "Tanukikoji Shopping Street", tags: ["shopping", "covered"], source: "cached_public" }
      ]
    };
  }
  return {
    restaurants: [
      { icon: "🍽️", name: `${destination} local table`, tags: ["local food", "central area"], source: "estimated" },
      { icon: "☕", name: `${destination} café stop`, tags: ["coffee", "rest"], source: "estimated" },
      { icon: "🥘", name: `${destination} signature meal`, tags: ["regional", "recommended check"], source: "estimated" },
      { icon: "🌙", name: `${destination} evening dining area`, tags: ["dinner", "walkable"], source: "estimated" }
    ],
    places: [
      { icon: "📍", name: `${destination} central landmark`, tags: ["orientation", "photo"], source: "estimated" },
      { icon: "🧭", name: `${destination} old town / main district`, tags: ["walk", "culture"], source: "estimated" },
      { icon: "🏛️", name: `${destination} museum or indoor highlight`, tags: ["rain plan", "culture"], source: "estimated" },
      { icon: "🌿", name: `${destination} park or viewpoint`, tags: ["view", "slow time"], source: "estimated" }
    ]
  };
};

const selectAlpha03Items = (items, tone, targetCount) => {
  const keywordMap = {
    food: /ramen|market|seafood|soup|food|meal|table|dining|curry/i,
    value: /market|walk|central|covered|local|park/i,
    rest: /café|coffee|park|view|observatory|slow|indoor/i,
    balanced: /central|classic|walk|market|park|landmark/i
  };
  const pattern = keywordMap[tone] || keywordMap.balanced;
  const ranked = [...items].sort((a, b) => Number(pattern.test(`${b.name} ${(b.tags || []).join(" ")}`)) - Number(pattern.test(`${a.name} ${(a.tags || []).join(" ")}`)));
  return ranked.slice(0, targetCount);
};

const buildAlpha03DayCards = (journey, destination) => {
  const ko = activeLanguage === "ko";
  const es = activeLanguage === "es";
  const tone = journey.tone || "balanced";
  const daySets = {
    food: [
      [alpha03Copy("Arrival", "도착", "Llegada"), alpha03Copy("Check-in", "호텔 체크인", "Check-in"), alpha03Copy("Market dinner", "시장 저녁", "Cena de mercado"), alpha03Copy("Night dessert", "야경과 디저트", "Postre nocturno")],
      [alpha03Copy("Morning café", "아침 카페", "Café de mañana"), alpha03Copy("Local market", "현지 시장", "Mercado local"), alpha03Copy("Signature lunch", "대표 점심", "Almuerzo especial"), alpha03Copy("Relaxed shopping", "가벼운 쇼핑", "Compras tranquilas")],
      [alpha03Copy("Slow breakfast", "느린 아침", "Desayuno lento"), alpha03Copy("Final walk", "마지막 산책", "Paseo final"), alpha03Copy("Return prep", "귀국 준비", "Preparación de regreso")]
    ],
    value: [
      [alpha03Copy("Arrival", "도착", "Llegada"), alpha03Copy("Transit to hotel", "대중교통으로 숙소 이동", "Traslado económico"), alpha03Copy("Neighborhood walk", "숙소 주변 산책", "Paseo por la zona")],
      [alpha03Copy("Core landmark", "핵심 명소", "Lugar principal"), alpha03Copy("Local lunch", "현지 점심", "Almuerzo local"), alpha03Copy("Free viewpoint", "무료 전망/산책", "Mirador o paseo gratis")],
      [alpha03Copy("Flexible morning", "여유 아침", "Mañana flexible"), alpha03Copy("Souvenir stop", "기념품", "Recuerdos"), alpha03Copy("Return prep", "귀국 준비", "Preparación de regreso")]
    ],
    rest: [
      [alpha03Copy("Arrival", "도착", "Llegada"), alpha03Copy("Easy check-in", "느린 체크인", "Check-in tranquilo"), alpha03Copy("Warm dinner", "편안한 저녁", "Cena cómoda")],
      [alpha03Copy("Late morning", "늦은 아침", "Mañana lenta"), alpha03Copy("Spa or indoor rest", "온천/실내 휴식", "Spa o descanso interior"), alpha03Copy("Quiet café", "조용한 카페", "Café tranquilo")],
      [alpha03Copy("Park walk", "공원 산책", "Paseo por parque"), alpha03Copy("Light lunch", "가벼운 점심", "Almuerzo ligero"), alpha03Copy("Return prep", "귀국 준비", "Preparación de regreso")]
    ],
    balanced: [
      [alpha03Copy("Arrival", "도착", "Llegada"), alpha03Copy("Hotel check-in", "호텔 체크인", "Check-in"), alpha03Copy("First city walk", "첫 도시 산책", "Primer paseo"), alpha03Copy("Comfort dinner", "편안한 저녁", "Cena cómoda")],
      [alpha03Copy("Market", "시장", "Mercado"), alpha03Copy("Landmark", "대표 명소", "Lugar icónico"), alpha03Copy("Café break", "카페 휴식", "Pausa de café"), alpha03Copy("Night view", "야경", "Vista nocturna")],
      [alpha03Copy("Free morning", "자유 오전", "Mañana libre"), alpha03Copy("Shopping", "쇼핑", "Compras"), alpha03Copy("Return prep", "귀국 준비", "Preparación de regreso")]
    ]
  };
  return (daySets[tone] || daySets.balanced).map((items, index) => ({
    day: `DAY ${index + 1}`,
    title: index === 0
      ? alpha03Copy("Arrive softly", "부담 없이 도착", "Llegada tranquila")
      : index === 1
        ? alpha03Copy(`${destination} highlight day`, `${destination} 하이라이트`, `Día especial en ${destination}`)
        : alpha03Copy("Leave with space", "여유 있게 마무리", "Cierre con calma"),
    items
  }));
};

const createAlpha03Card = ({ className, icon, title, badge, tags = [], text = "" }) => `
  <article class="${className}">
    <span class="alpha03-card-icon" aria-hidden="true">${escapeSummaryText(icon)}</span>
    <div>
      <strong>${escapeSummaryText(title)}</strong>
      ${text ? `<p>${escapeSummaryText(text)}</p>` : ""}
      <div class="alpha03-tag-row">
        ${badge ? `<span class="alpha03-truth-badge">${escapeSummaryText(badge)}</span>` : ""}
        ${tags.map((tag) => `<span>${escapeSummaryText(tag)}</span>`).join("")}
      </div>
    </div>
  </article>
`;

const createAlpha03ExperienceHtml = (journey, result) => {
  const destination = getTravelDestinationLabel(result);
  const ko = activeLanguage === "ko";
  const profile = getAlpha03DestinationProfile(destination);
  const workspace = result.alpha04Workspace || null;
  const restaurants = selectAlpha03Items(profile.restaurants, journey.tone, journey.tone === "food" ? 5 : 4);
  const places = selectAlpha03Items(profile.places, journey.tone, 5);
  const days = buildAlpha03DayCards(journey, destination);
  const truthLabel = (state) => sourceStateLabel(state || "estimated");
  const transportationSummary = journey.tone === "value"
    ? alpha03Copy("Transit-first route with licensed taxi only when it saves energy.", "대중교통 중심, 꼭 필요할 때만 허가된 택시를 사용합니다.", "Ruta con transporte público y taxi autorizado solo cuando ahorra energía.")
    : journey.tone === "rest"
      ? alpha03Copy("Short moves, fewer transfers, and more time inside the destination.", "짧은 이동, 적은 환승, 목적지에서 머무는 시간을 늘립니다.", "Traslados cortos, menos cambios y más tiempo en destino.")
      : alpha03Copy("Walkable core route with official transit or licensed transfer checks.", "도보 가능한 중심 동선에 공식 교통 또는 허가 이동수단을 확인합니다.", "Ruta caminable con transporte oficial o traslado autorizado.");
  return `
    <div ${alpha04SectionAttrs(workspace, "journey", "v23-journey-overview alpha03-hero")}>
      <div>
        <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Selected journey", "선택한 여정", "Viaje seleccionado"))}</span>
        <h2>${escapeSummaryText(journey.name)}</h2>
        <p>${escapeSummaryText(journey.purpose)}</p>
      </div>
      <div class="v23-overview-meta">
        <span>${escapeSummaryText(journey.duration)}</span>
        <span>${escapeSummaryText(journey.comfort)}</span>
        <span>${escapeSummaryText(journey.budget)}</span>
      </div>
    </div>
    <section ${alpha04SectionAttrs(workspace, "journey", "alpha03-story-panel")}>
      <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Picture the trip", "여행이 그려지는 순간", "Imagina el viaje"))}</span>
      <h3>${escapeSummaryText(alpha03Copy(
        `A ${destination} journey that feels easy before it feels busy.`,
        `${destination}에서 바쁘기보다 먼저 설레는 여행입니다.`,
        `Un viaje a ${destination} que se siente emocionante, no pesado.`
      ))}</h3>
      <p>${escapeSummaryText(journey.reason)}</p>
      <div class="alpha03-mood-row">
        ${journey.tags.slice(0, 4).map((tag) => `<span>${escapeSummaryText(tag)}</span>`).join("")}
      </div>
    </section>
    <section ${alpha04SectionAttrs(workspace, "restaurants", "alpha03-section")}>
      <div class="alpha03-section-heading">
        <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Restaurants", "추천 맛집", "Restaurantes"))}</span>
        <h3>${escapeSummaryText(alpha03Copy("Places to taste the trip", "여행을 맛보는 장소", "Lugares para saborear el viaje"))}</h3>
      </div>
      <div class="alpha03-card-grid is-restaurants">
        ${restaurants.map((item) => createAlpha03Card({
          className: "alpha03-visual-card",
          icon: item.icon,
          title: item.name,
          badge: truthLabel(item.source),
          tags: item.tags
        })).join("")}
      </div>
    </section>
    <section ${alpha04SectionAttrs(workspace, "places", "alpha03-section")}>
      <div class="alpha03-section-heading">
        <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Places", "추천 명소", "Lugares"))}</span>
        <h3>${escapeSummaryText(alpha03Copy("Moments worth remembering", "기억에 남을 장면", "Momentos para recordar"))}</h3>
      </div>
      <div class="alpha03-card-grid">
        ${places.map((item) => createAlpha03Card({
          className: "alpha03-visual-card",
          icon: item.icon,
          title: item.name,
          badge: truthLabel(item.source),
          tags: item.tags
        })).join("")}
      </div>
    </section>
    <section ${alpha04SectionAttrs(workspace, "timeline", "alpha03-section")}>
      <div class="alpha03-section-heading">
        <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Day preview", "하루씩 보기", "Vista por día"))}</span>
        <h3>${escapeSummaryText(alpha03Copy("Readable in five seconds", "5초 안에 이해되는 일정", "Se entiende en cinco segundos"))}</h3>
      </div>
      <div class="alpha03-day-grid">
        ${days.map((day) => `
          <article class="alpha03-day-card">
            <span>${escapeSummaryText(day.day)}</span>
            <strong>${escapeSummaryText(day.title)}</strong>
            <ul>${day.items.map((item) => `<li>${escapeSummaryText(item)}</li>`).join("")}</ul>
          </article>
        `).join("")}
      </div>
    </section>
    <section class="alpha03-logistics-strip" aria-label="${escapeSummaryText(alpha03Copy("Travel direction", "여행 방향", "Dirección del viaje"))}">
      ${createAlpha03Card({ className: "alpha03-mini-card", icon: "🏨", title: alpha03Copy("Hotel direction", "숙소 방향", "Hotel"), badge: truthLabel(journey.sourceStates.hotel), text: journey.details.hotel })}
      ${createAlpha03Card({ className: "alpha03-mini-card", icon: "✈️", title: alpha03Copy("Flight direction", "항공 방향", "Vuelo"), badge: truthLabel(journey.sourceStates.flight), text: journey.details.flight })}
      ${createAlpha03Card({ className: "alpha03-mini-card", icon: "🚇", title: alpha03Copy("Transportation", "이동", "Transporte"), badge: truthLabel(journey.sourceStates.transport), text: transportationSummary })}
    </section>
    <details ${alpha04SectionAttrs(workspace, "preparation", "alpha03-preparation-details")}>
      <summary>${escapeSummaryText(alpha03Copy("Travel preparation", "여행 준비", "Preparación del viaje"))}</summary>
      <div class="v23-detail-grid">
        ${[
          ["insurance", alpha03Copy("Insurance and risk", "보험과 리스크", "Seguro y riesgo"), journey.details.insurance, journey.sourceStates.insurance],
          ["entry", alpha03Copy("Entry requirements", "입국 요건", "Requisitos de entrada"), journey.details.entry, journey.sourceStates.entry],
          ["transport-detail", alpha03Copy("Transport details", "교통 세부사항", "Detalles de transporte"), journey.details.transport, journey.sourceStates.transport],
          ["secure-documents", alpha03Copy("Secure documents", "보안 문서", "Documentos seguros"), alpha03Copy("Secure document handling is still being prepared. Nothing is submitted before approval.", "보안 문서 연동은 아직 준비 중입니다. 승인 전에는 어떤 문서도 제출되지 않습니다.", "La gestión segura de documentos aún se está preparando. Nada se envía antes de aprobar."), "placeholder"],
          ["approval-check", alpha03Copy("Before approval", "승인 전 확인", "Antes de aprobar"), alpha03Copy("ONE verifies live price, availability, rules, and material changes before any external action.", "ONE은 외부 실행 전 실시간 가격, 가능 여부, 규정, 중요한 변경사항을 다시 확인합니다.", "ONE verifica precio, disponibilidad, reglas y cambios importantes antes de cualquier acción externa."), "estimated"]
        ].map(([id, title, body, source]) => `
          <details class="v23-detail-card" data-detail-id="${id}">
            <summary><span>${escapeSummaryText(title)}</span>${createV23SourcePill(source)}</summary>
            <p>${escapeSummaryText(body)}</p>
            <small>${escapeSummaryText(providerSourceNote(source))}</small>
          </details>
        `).join("")}
      </div>
    </details>
    <div ${alpha04SectionAttrs(workspace, "approval", "v23-approval-preview")}>
      <strong>${escapeSummaryText(alpha03Copy("If approved, ONE prepares", "승인하면 ONE이 준비할 것", "Si apruebas, ONE prepara"))}</strong>
      <ul>
        <li>${escapeSummaryText(alpha03Copy("Live flight and hotel checks", "실시간 항공·숙소 확인", "Verificación en vivo de vuelos y hoteles"))}</li>
        <li>${escapeSummaryText(alpha03Copy("Restaurant and experience shortlist validation", "맛집·경험 후보 검증", "Validación de restaurantes y experiencias"))}</li>
        <li>${escapeSummaryText(alpha03Copy("Final comparison using your selected journey", "선택한 여정 기준 최종 비교", "Comparación final con tu viaje elegido"))}</li>
      </ul>
      <p>${escapeSummaryText(alpha03Copy("No booking, payment, or submission happens yet. No provider contact happens yet.", "아직 예약·결제·제출·제공업체 연락은 진행되지 않습니다.", "Aún no hay reserva, pago, envío ni contacto con proveedor."))}</p>
    </div>
  `;
};

const createV23TravelDetailHtml = (journey, result) => {
  return createAlpha03ExperienceHtml(journey, result);
};

const createTravelPackagesCard = (result, missionContext) => {
  const journeys = buildV23TravelJourneys(result, missionContext);
  const selectedIndex = Math.max(0, journeys.findIndex((journey) => journey.selected));
  const destination = getTravelDestinationLabel(result);
  const article = document.createElement("article");
  article.className = "mission-card is-wide travel-package-card v23-travel-experience";
  article.dataset.cardId = "travel-experiences";
  article.innerHTML = `
    <div class="v23-travel-heading">
      <span class="v23-eyebrow">${v22Local("ONE Recommendation", "ONE 추천", "ONE recomienda")}</span>
      <h2>${escapeSummaryText(v22Local(
        `${destination} trip prepared four ways`,
        `${destination} 여행을 네 가지 방식으로 준비했습니다.`,
        `Viaje a ${destination} preparado en cuatro formas`
      ))}</h2>
      <p>${escapeSummaryText(v22Local(
        "Choose the experience first. Providers stay underneath the journey, where they belong.",
        "먼저 원하는 경험을 고르세요. 항공·숙소·식당은 선택한 여정 안에서 조용히 정리됩니다.",
        "Elige primero la experiencia. Los proveedores quedan dentro del viaje seleccionado."
      ))}</p>
    </div>
    <div class="v23-style-chips" aria-label="${escapeSummaryText(v22Local("Travel style", "여행 스타일", "Estilo de viaje"))}">
      ${["편안함", "맛집", "실속", "휴식", "쇼핑", "가족"].map((chip) => `<button type="button" class="v23-style-chip">${chip}</button>`).join("")}
    </div>
    <div class="v23-journey-layout">
      <button class="v23-journey-card is-featured${selectedIndex === 0 ? " is-selected" : ""}" type="button" data-journey-index="0" aria-pressed="${selectedIndex === 0}">
        ${renderV23JourneyCardInner(journeys[0], true)}
      </button>
      <div class="v23-alternative-journeys">
        ${journeys.slice(1).map((journey, index) => `
          <button class="v23-journey-card${selectedIndex === index + 1 ? " is-selected" : ""}" type="button" data-journey-index="${index + 1}" aria-pressed="${selectedIndex === index + 1}">
            ${renderV23JourneyCardInner(journey, false)}
          </button>
        `).join("")}
      </div>
    </div>
    <section class="v23-selected-journey" aria-live="polite">${createV23TravelDetailHtml(journeys[selectedIndex], result)}</section>
  `;
  article._v23Journeys = journeys;
  return article;
};

function renderV23JourneyCardInner(journey, featured) {
  return `
    <span class="v23-selected-badge">${journey.selected ? v22Local("Selected", "선택됨", "Seleccionado") : v22Local("Choose", "선택", "Elegir")}</span>
    <strong>${escapeSummaryText(journey.name)}</strong>
    <small>${escapeSummaryText(journey.purpose)}</small>
    <div class="v23-journey-tags">${journey.tags.map((tag) => `<span>${escapeSummaryText(tag)}</span>`).join("")}</div>
    <div class="v23-journey-meta">
      <span>${escapeSummaryText(journey.duration)}</span>
      <span>${escapeSummaryText(journey.comfort)}</span>
      <span>${escapeSummaryText(journey.budget)}</span>
    </div>
    <p>${escapeSummaryText(journey.reason)}</p>
    ${featured ? `<em>${v22Local("Recommended because it reduces decisions.", "결정 부담을 줄여 주기 때문에 추천합니다.", "Recomendado porque reduce decisiones.")}</em>` : ""}
  `;
}

const updateV23JourneySelection = (container, index, result) => {
  const journeys = container._v23Journeys || [];
  const selected = journeys[index] || journeys[0];
  if (!selected) return;
  journeys.forEach((journey, cursor) => { journey.selected = cursor === index; });
  container.querySelectorAll(".v23-journey-card").forEach((card) => {
    const selectedCard = Number(card.dataset.journeyIndex) === index;
    card.classList.toggle("is-selected", selectedCard);
    card.setAttribute("aria-pressed", selectedCard ? "true" : "false");
    const badge = card.querySelector(".v23-selected-badge");
    if (badge) badge.textContent = selectedCard ? v22Local("Selected", "선택됨", "Seleccionado") : v22Local("Choose", "선택", "Elegir");
  });
  const details = container.querySelector(".v23-selected-journey");
  if (details) details.innerHTML = createV23TravelDetailHtml(selected, result);
  currentResult.v23SelectedJourney = selected;
};

const readInsightDismissals = (result) => {
  try {
    return JSON.parse(localStorage.getItem(insightStorageKey(result)) || "{}");
  } catch {
    return {};
  }
};

const writeInsightDismissal = (result, insightId, state) => {
  try {
    const key = insightStorageKey(result);
    const current = JSON.parse(localStorage.getItem(key) || "{}");
    current[insightId] = state;
    localStorage.setItem(key, JSON.stringify(current));
  } catch {
    // Local persistence is optional; insight actions must never block the mission.
  }
};

const createMissionInsightsCard = (result, context) => {
  const insights = generateMissionInsights({
    result,
    context,
    language: activeLanguage,
    worldIntelligence: result.worldIntelligence
  });
  const { visible, collapsed } = splitVisibleMissionInsights(insights, readInsightDismissals(result));
  if (!visible.length && !collapsed.length) return null;
  const language = activeLanguage === "ko" ? "ko" : activeLanguage === "es" ? "es" : "en";
  const actionLabels = {
    dismiss: v22Local("Dismiss", "닫기", "Descartar"),
    later: v22Local("Remind later", "나중에 보기", "Recordar luego"),
    hide: v22Local("Hide for this mission", "이 미션에서 숨기기", "Ocultar en esta misión")
  };
  const renderInsight = (insight, compact = false) => `
    <article class="alpha-insight-row" data-insight-id="${escapeSummaryText(insight.id)}">
      <div class="alpha-insight-main">
        <span class="alpha-insight-urgency is-${escapeSummaryText(insight.urgency)}">${escapeSummaryText(sourceStateUserLabel(insight.sourceState, language))}</span>
        <h3>${escapeSummaryText(insight.title)}</h3>
        <p>${escapeSummaryText(insight.explanation)}</p>
        ${compact ? "" : `<details><summary>${escapeSummaryText(v22Local("Why am I seeing this?", "왜 보여주나요?", "¿Por qué aparece?"))}</summary><p>${escapeSummaryText(insight.why)}</p></details>`}
      </div>
      <div class="alpha-insight-meta">
        <span>${escapeSummaryText(v22Local("Urgency", "긴급도", "Urgencia"))}: ${escapeSummaryText(insight.urgency)}</span>
        <span>${escapeSummaryText(v22Local("Confidence", "신뢰도", "Confianza"))}: ${Math.round(Number(insight.confidence || 0) * 100)}%</span>
        <span>${escapeSummaryText(v22Local("Action", "사용자 행동", "Acción"))}: ${escapeSummaryText(insight.actionRequired ? v22Local("Optional decision", "선택 결정", "Decisión opcional") : v22Local("No action required", "필수 행동 없음", "Sin acción requerida"))}</span>
      </div>
      <div class="alpha-insight-actions">
        <button type="button" data-insight-action="dismiss">${escapeSummaryText(actionLabels.dismiss)}</button>
        <button type="button" data-insight-action="later">${escapeSummaryText(actionLabels.later)}</button>
        <button type="button" data-insight-action="hide">${escapeSummaryText(actionLabels.hide)}</button>
      </div>
    </article>
  `;
  const article = document.createElement("article");
  article.className = "mission-card is-wide alpha-insights-card";
  article.dataset.cardId = "mission-insights-alpha01";
  article.innerHTML = `
    <div class="alpha-insights-heading">
      <span class="v23-eyebrow">ALPHA-01 · Mission Insights</span>
      <h2>${escapeSummaryText(v22Local("Things worth knowing", "알아두면 좋은 것", "Cosas que conviene saber"))}</h2>
      <p>${escapeSummaryText(v22Local(
        "ONE prepared these quietly so you can decide with less mental effort.",
        "ONE이 결정 부담을 줄이기 위해 조용히 준비한 참고사항이에요.",
        "ONE preparó esto para reducir tu esfuerzo mental."
      ))}</p>
    </div>
    <div class="alpha-insight-list">${visible.map((insight) => renderInsight(insight)).join("")}</div>
    ${collapsed.length ? `
      <details class="alpha-insight-more">
        <summary>${escapeSummaryText(v22Local("More optional insights", "추가 참고사항", "Más consejos opcionales"))} · ${collapsed.length}</summary>
        <div class="alpha-insight-list">${collapsed.map((insight) => renderInsight(insight, true)).join("")}</div>
      </details>
    ` : ""}
  `;
  article.addEventListener("click", (event) => {
    const button = event.target?.closest?.("[data-insight-action]");
    if (!button) return;
    const row = button.closest("[data-insight-id]");
    const insightId = row?.dataset?.insightId;
    if (!insightId) return;
    const action = button.dataset.insightAction;
    writeInsightDismissal(result, insightId, action === "hide" ? "hidden" : action === "later" ? "later" : "dismissed");
    row.classList.add("is-dismissed");
    row.setAttribute("aria-hidden", "true");
  });
  return article;
};

const readRefinementState = (result) => {
  const embedded = result.alpha02Refinements || createEmptyRefinementState();
  try {
    const saved = JSON.parse(localStorage.getItem(refinementStorageKey(result)) || "{}");
    return {
      ...createEmptyRefinementState(),
      ...embedded,
      ...saved,
      answers: { ...(embedded.answers || {}), ...(saved.answers || {}) },
      archived: { ...(embedded.archived || {}), ...(saved.archived || {}) }
    };
  } catch {
    return embedded;
  }
};

const writeRefinementState = (result, state) => {
  const nextState = {
    ...createEmptyRefinementState(),
    ...state,
    updatedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(refinementStorageKey(result), JSON.stringify(nextState));
  } catch {
    // Mission refinement persistence is helpful, not mission-critical.
  }
  currentResult.alpha02Refinements = nextState;
  sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
  return nextState;
};

const createProgressiveRefinementCard = (result, context) => {
  const state = readRefinementState(result);
  result.alpha02Refinements = state;
  const refinement = buildProgressiveRefinement(result, context, state, { language: activeLanguage });
  if (!refinement.visible.length && !refinement.collapsed.length && !result.alpha02LastUpdate) return null;
  const renderQuestion = (question, compact = false) => `
    <article class="alpha02-question" data-question-id="${escapeSummaryText(question.id)}" data-priority="${escapeSummaryText(question.priority)}">
      <div class="alpha02-question-copy">
        <span class="alpha02-priority">${escapeSummaryText(question.priority === "critical" ? v22Local("Critical", "중요", "Crítico") : question.priority === "high" ? v22Local("High value", "가치 높음", "Alto valor") : v22Local("Helpful", "도움됨", "Útil"))}</span>
        <h3>${escapeSummaryText(question.titleText)}</h3>
        <p>${escapeSummaryText(question.explanationText)}</p>
      </div>
      <div class="alpha02-chip-row" role="group" aria-label="${escapeSummaryText(question.titleText)}">
        ${question.choices.map((choice) => `<button type="button" class="alpha02-answer-chip" data-answer-value="${escapeSummaryText(choice.value)}">${escapeSummaryText(choice.labelText)}</button>`).join("")}
      </div>
      ${compact ? "" : `<p class="alpha02-impact">${escapeSummaryText(question.improvementText)}</p>`}
      <div class="alpha02-question-actions">
        <button type="button" data-refinement-action="skip">${escapeSummaryText(v22Local("Skip", "건너뛰기", "Saltar"))}</button>
        <button type="button" data-refinement-action="later">${escapeSummaryText(v22Local("Later", "나중에", "Luego"))}</button>
        <button type="button" data-refinement-action="hide">${escapeSummaryText(v22Local("Don't ask again", "다시 묻지 않기", "No preguntar otra vez"))}</button>
      </div>
    </article>
  `;
  const article = document.createElement("article");
  article.className = "mission-card is-wide alpha02-refinement-card";
  article.dataset.cardId = "progressive-refinement-alpha02";
  article.dataset.alpha02Wired = "direct";
  article.innerHTML = `
    <div class="alpha02-heading">
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA02_REFINEMENT_VERSION)} · Progressive Refinement</span>
      <h2>${escapeSummaryText(v22Local("Help me improve this plan", "이 계획을 더 좋게 만들기", "Ayúdame a mejorar este plan"))}</h2>
      <p>${escapeSummaryText(v22Local(
        "This recommendation is already good. Answering only what matters can make it more personal.",
        "이 추천은 이미 진행할 수 있어요. 중요한 것만 답하면 더 개인화됩니다.",
        "Esta recomendación ya sirve. Responder solo lo importante la vuelve más personal."
      ))}</p>
    </div>
    ${result.alpha02LastUpdate ? `<div class="alpha02-update-note" role="status">${escapeSummaryText(result.alpha02LastUpdate)}</div>` : ""}
    ${refinement.visible.length ? `<div class="alpha02-visible-questions">${refinement.visible.map((question) => renderQuestion(question)).join("")}</div>` : `<p class="alpha02-empty">${escapeSummaryText(v22Local("No extra question is needed right now.", "지금은 추가 질문이 필요하지 않습니다.", "No hace falta otra pregunta ahora."))}</p>`}
    ${refinement.collapsed.length ? `
      <details class="alpha02-more">
        <summary>${escapeSummaryText(v22Local("Helpful questions", "도움 되는 질문", "Preguntas útiles"))} · ${refinement.collapsed.length}</summary>
        <div class="alpha02-visible-questions">${refinement.collapsed.map((question) => renderQuestion(question, true)).join("")}</div>
      </details>
    ` : ""}
  `;
  const handleRefinementAnswer = (answerButton) => {
    const question = answerButton.closest("[data-question-id]");
    const questionId = question?.dataset?.questionId;
    if (!questionId) return;
      currentResult = applyRefinementAnswer(currentResult, { questionId, value: answerButton.dataset.answerValue }, { language: activeLanguage });
      writeRefinementState(currentResult, currentResult.alpha02Refinements);
      trackEvent("mission_refinement_answered", { mission_type: currentResult?.type, language: activeLanguage, page: "results", question_id: questionId });
      renderMission();
  };
  const handleRefinementArchive = (actionButton) => {
    const question = actionButton.closest("[data-question-id]");
    const questionId = question?.dataset?.questionId;
    if (!questionId) return;
      const status = actionButton.dataset.refinementAction === "hide" ? "hidden" : actionButton.dataset.refinementAction === "later" ? "later" : "skipped";
      const nextState = archiveRefinementQuestion(readRefinementState(currentResult), questionId, status);
      writeRefinementState(currentResult, nextState);
      question.classList.add("is-archived");
      question.setAttribute("aria-hidden", "true");
      trackEvent("mission_refinement_archived", { mission_type: currentResult?.type, language: activeLanguage, page: "results", question_id: questionId, status });
  };
  article.dataset.alpha02Handlers = String(article.querySelectorAll(".alpha02-answer-chip").length);
  article.querySelectorAll(".alpha02-answer-chip").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      handleRefinementAnswer(button);
    });
  });
  article.querySelectorAll("[data-refinement-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      handleRefinementArchive(button);
    });
  });
  return article;
};

const createWorldIntelligenceSourceCard = (result) => {
  const foundation = result.worldIntelligence;
  if (!foundation) return null;
  const language = activeLanguage === "ko" ? "ko" : activeLanguage === "es" ? "es" : "en";
  const breakdown = foundation.sourceBreakdown || {};
  const failures = Array.isArray(foundation.failures) ? foundation.failures : [];
  const title = v22Local("World Intelligence status", "월드 인텔리전스 상태", "Estado de inteligencia mundial");
  const subtitle = v22Local(
    "ONE separates verified, public, estimated, and unavailable data before planning.",
    "ONE은 계획 전에 검증·공개·예상·불가 데이터를 분리합니다.",
    "ONE separa datos verificados, públicos, estimados y no disponibles antes de planificar."
  );
  const sourceRows = ["verified_live", "cached_public", "estimated", "placeholder", "unavailable"].map((state) => `
    <span class="v24-source-chip is-${state}">
      <strong>${escapeSummaryText(sourceStateUserLabel(state, language))}</strong>
      <small>${Number(breakdown[state] || 0)}</small>
    </span>
  `).join("");
  const failureRows = failures.length
    ? failures.slice(0, 4).map((failure) => `<li>${escapeSummaryText(failure.providerType || "provider")}: ${escapeSummaryText(failure.message || "")}</li>`).join("")
    : `<li>${escapeSummaryText(v22Local("No adapter failures reported.", "어댑터 오류 없음", "Sin fallos de adaptador."))}</li>`;
  const article = document.createElement("article");
  article.className = "mission-card is-wide v24-world-source-card";
  article.dataset.cardId = "world-intelligence-status";
  article.innerHTML = `
    <div class="v24-source-header">
      <span class="v23-eyebrow">V24 · World Intelligence Foundation</span>
      <h2>${escapeSummaryText(title)}</h2>
      <p>${escapeSummaryText(subtitle)}</p>
    </div>
    <div class="v24-source-chip-grid">${sourceRows}</div>
    <div class="v24-source-diagnostics">
      <span>${escapeSummaryText(v22Local("Cache health", "캐시 상태", "Estado de caché"))}: ${escapeSummaryText(foundation.cache?.health || "unknown")}</span>
      <span>${escapeSummaryText(v22Local("Confidence", "신뢰도", "Confianza"))}: ${Math.round(Number(foundation.averageConfidence || 0) * 100)}%</span>
      <span>${escapeSummaryText(v22Local("Fixture mode", "픽스처 모드", "Modo fixture"))}: ${foundation.fixtureMode ? "on" : "off"}</span>
    </div>
    <details class="v24-source-failures">
      <summary>${escapeSummaryText(v22Local("Provider notes", "제공업체 메모", "Notas de proveedor"))}</summary>
      <ul>${failureRows}</ul>
    </details>
  `;
  return article;
};

const alpha04Local = (en, ko, es) => v22Local(en, ko, es);

const formatAlpha04Time = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : activeLanguage === "es" ? "es" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const createAlpha04UpdateBadge = (workspace, sectionKey) => {
  if (!sectionWasRecentlyUpdated(workspace, sectionKey)) return "";
  return `<span class="alpha04-update-badge" title="${escapeSummaryText(getSectionUpdateReason(workspace, sectionKey))}">${escapeSummaryText(alpha04Local("Updated", "업데이트", "Actualizado"))}</span>`;
};

const alpha04SectionAttrs = (workspace, sectionKey, className) => {
  const updated = sectionWasRecentlyUpdated(workspace, sectionKey);
  const reason = updated ? ` data-alpha04-update-reason="${escapeSummaryText(getSectionUpdateReason(workspace, sectionKey))}"` : "";
  return `class="${className}${updated ? " is-recently-updated" : ""}" data-section-id="${sectionKey}"${reason}`;
};

const createLivingMissionWorkspaceCard = (result, missionContext) => {
  const workspace = createLivingMissionWorkspace(result, {
    language: activeLanguage,
    scenario: new URLSearchParams(window.location.search).get("alpha04Scenario") || result.alpha04Scenario
  });
  currentResult.alpha04Workspace = workspace;
  const card = document.createElement("article");
  card.className = "mission-card is-wide alpha04-workspace-card";
  card.dataset.cardId = "living-mission-alpha04";
  card.dataset.storageKey = livingMissionStorageKey(result);
  const pendingTasks = workspace.tasks.length
    ? workspace.tasks.map((task) => `<li>${escapeSummaryText(task.label)}</li>`).join("")
    : `<li>${escapeSummaryText(alpha04Local("No pending task right now", "지금은 남은 작업이 없습니다", "No hay tareas pendientes ahora"))}</li>`;
  const notifications = workspace.notifications.length
    ? workspace.notifications.map((notice) => `<li class="is-${escapeSummaryText(notice.level)}">${escapeSummaryText(notice.label)}</li>`).join("")
    : `<li>${escapeSummaryText(alpha04Local("No urgent update. ONE is keeping the workspace ready.", "긴급 업데이트는 없습니다. ONE이 작업 공간을 준비 상태로 유지합니다.", "No hay actualización urgente. ONE mantiene el espacio listo."))}</li>`;
  const historyRows = workspace.history.slice(-5).reverse().map((event) => `
    <li>
      <strong>${escapeSummaryText(event.label)}</strong>
      <span>${escapeSummaryText(formatAlpha04Time(event.at))}</span>
    </li>
  `).join("");
  const approvalRows = workspace.approvalHistory.length
    ? workspace.approvalHistory.slice(-4).reverse().map((approval) => `
      <li>
        <strong>${escapeSummaryText(approval.label)}</strong>
        <span>${escapeSummaryText(approval.executionApproved ? alpha04Local("Execution approved", "실행 승인", "Ejecución aprobada") : alpha04Local("Preparation only", "준비만 승인", "Solo preparación"))}</span>
      </li>
    `).join("")
    : `<li><strong>${escapeSummaryText(alpha04Local("No approval yet", "아직 승인 없음", "Sin aprobación todavía"))}</strong><span>${escapeSummaryText(alpha04Local("Search approval and booking approval stay separate.", "검색 승인과 예약 승인은 분리됩니다.", "La aprobación de búsqueda y reserva se separan."))}</span></li>`;
  card.innerHTML = `
    <div class="alpha04-workspace-header">
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA04_LIVING_MISSION_VERSION)} · ${escapeSummaryText(alpha04Local("Living Mission", "살아있는 미션", "Misión viva"))}</span>
      <h2>${escapeSummaryText(alpha04Local("Mission Workspace", "미션 작업 공간", "Espacio de misión"))}</h2>
      <p>${escapeSummaryText(alpha04Local(
        "ONE keeps this mission alive as your choices, timing, providers, and world data change.",
        "ONE은 선택, 일정, 제공업체, 월드 데이터가 바뀔 때마다 이 미션을 살아있는 상태로 유지합니다.",
        "ONE mantiene esta misión viva cuando cambian tus elecciones, horarios, proveedores y datos."
      ))}</p>
    </div>
    <div class="alpha04-compact-summary" aria-label="${escapeSummaryText(alpha04Local("Mission summary", "미션 요약", "Resumen de misión"))}">
      <div><span>${escapeSummaryText(alpha04Local("Mission", "미션", "Misión"))}</span><strong>${escapeSummaryText(workspace.mission)}</strong></div>
      <div><span>${escapeSummaryText(alpha04Local("Status", "상태", "Estado"))}</span><strong>${escapeSummaryText(workspace.status.label)}</strong></div>
      <div><span>${escapeSummaryText(alpha04Local("Progress", "진행", "Progreso"))}</span><strong>${workspace.progress}%</strong></div>
      <div><span>${escapeSummaryText(alpha04Local("Updated", "업데이트", "Actualizado"))}</span><strong>${escapeSummaryText(formatAlpha04Time(workspace.lastUpdated))}</strong></div>
      <div><span>${escapeSummaryText(alpha04Local("Next", "다음", "Siguiente"))}</span><strong>${escapeSummaryText(workspace.nextAction)}</strong></div>
    </div>
    <div class="alpha04-stage-row">
      ${workspace.stages.map((stage) => `<span class="alpha04-stage is-${escapeSummaryText(stage.state)}">${escapeSummaryText(stage.label)}</span>`).join("")}
    </div>
    <div class="alpha04-workspace-grid">
      <section class="alpha04-panel">
        <h3>${escapeSummaryText(alpha04Local("Remaining tasks", "남은 작업", "Tareas pendientes"))}</h3>
        <ul class="alpha04-task-list">${pendingTasks}</ul>
      </section>
      <section class="alpha04-panel">
        <h3>${escapeSummaryText(alpha04Local("Mission updates", "미션 업데이트", "Actualizaciones"))}</h3>
        <ul class="alpha04-notification-list">${notifications}</ul>
      </section>
    </div>
    <details class="alpha04-history-panel" data-alpha04-detail-id="mission-history">
      <summary>${escapeSummaryText(alpha04Local("Mission history", "미션 히스토리", "Historial de misión"))}</summary>
      <ul>${historyRows}</ul>
    </details>
    <details class="alpha04-history-panel" data-alpha04-detail-id="approval-history">
      <summary>${escapeSummaryText(alpha04Local("Approval history", "승인 히스토리", "Historial de aprobación"))}</summary>
      <ul>${approvalRows}</ul>
    </details>
  `;
  return { card, workspace };
};

const alpha05StatusClass = (status = "") => {
  return String(status).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z-]/g, "") || "unknown";
};

const createAlpha05ActionItem = (action) => `
  <li class="alpha05-action is-${alpha05StatusClass(action.status)}" tabindex="0">
    <span class="alpha05-action-state">${escapeSummaryText(action.status)}</span>
    <strong>${escapeSummaryText(action.title)}</strong>
    <small>${escapeSummaryText(action.explanation?.whyItExists || action.description)}</small>
  </li>
`;

const createExecutionOrchestratorCard = (result, workspace) => {
  const orchestrator = createExecutionOrchestrator(result, {
    language: activeLanguage,
    scenario: new URLSearchParams(window.location.search).get("alpha05Scenario") || result.alpha05Scenario || result.alpha04Scenario
  });
  const validation = validateExecutionOrchestrator(orchestrator);
  currentResult.alpha05ExecutionOrchestrator = orchestrator;

  const card = document.createElement("article");
  card.className = "mission-card is-wide alpha05-orchestrator-card";
  card.dataset.cardId = "execution-orchestrator-alpha05";

  const actionsById = new Map(orchestrator.actionGraph.nodes.map((action) => [action.id, action]));
  const boardSections = orchestrator.board.map((section) => {
    const items = section.actions
      .map((actionId) => actionsById.get(actionId))
      .filter(Boolean)
      .map(createAlpha05ActionItem)
      .join("");
    return `
      <section class="alpha05-board-column" aria-labelledby="alpha05-${escapeSummaryText(section.id)}">
        <h3 id="alpha05-${escapeSummaryText(section.id)}">${escapeSummaryText(section.label)}</h3>
        <ul>${items || `<li class="alpha05-empty">${escapeSummaryText(alpha04Local("Nothing here right now.", "지금은 없습니다.", "Nada aquí ahora."))}</li>`}</ul>
      </section>
    `;
  }).join("");

  const timeline = orchestrator.timeline.map((item) => `
    <li class="alpha05-timeline-item is-${alpha05StatusClass(item.status)}">
      <span aria-hidden="true">${escapeSummaryText(item.marker)}</span>
      <strong>${escapeSummaryText(item.label)}</strong>
      <small>${escapeSummaryText(item.status)}</small>
    </li>
  `).join("");

  const history = orchestrator.history.slice(-6).reverse().map((event) => `
    <li>
      <strong>${escapeSummaryText(event.actionTitle || event.type)}</strong>
      <span>${escapeSummaryText(event.reason)}</span>
    </li>
  `).join("");

  const safeLabel = validation.valid
    ? alpha04Local("Approval-safe", "승인 안전", "Seguro con aprobación")
    : alpha04Local("Needs review", "검토 필요", "Necesita revisión");

  card.innerHTML = `
    <div class="alpha05-orchestrator-header">
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA05_EXECUTION_ORCHESTRATOR_VERSION)} · ${escapeSummaryText(alpha04Local("Execution Orchestrator", "실행 오케스트레이터", "Orquestador de ejecución"))}</span>
      <h2>${escapeSummaryText(alpha04Local("Mission Board", "미션 보드", "Tablero de misión"))}</h2>
      <p>${escapeSummaryText(alpha04Local(
        "ONE now coordinates actions, dependencies, approval scopes, status, and recovery instead of showing only a passive plan.",
        "ONE은 이제 단순 계획이 아니라 액션, 의존성, 승인 범위, 상태, 복구를 함께 조율합니다.",
        "ONE coordina acciones, dependencias, aprobaciones, estado y recuperación, no solo un plan pasivo."
      ))}</p>
    </div>
    <div class="alpha05-next-action" role="status" aria-live="polite">
      <span>${escapeSummaryText(alpha04Local("Next best action", "다음 최우선 행동", "Siguiente mejor acción"))}</span>
      <strong>${escapeSummaryText(orchestrator.nextBestAction.title)}</strong>
      <small>${escapeSummaryText(orchestrator.nextBestAction.reason)}</small>
    </div>
    <div class="alpha05-board" role="list">${boardSections}</div>
    <div class="alpha05-lower-grid">
      <section class="alpha05-panel">
        <h3>${escapeSummaryText(alpha04Local("Mission timeline", "미션 타임라인", "Línea de tiempo"))}</h3>
        <ol class="alpha05-timeline">${timeline}</ol>
      </section>
      <section class="alpha05-panel">
        <h3>${escapeSummaryText(alpha04Local("Execution safety", "실행 안전", "Seguridad de ejecución"))}</h3>
        <p>${escapeSummaryText(orchestrator.executionSafety.note)}</p>
        <p>${escapeSummaryText(alpha04Local(
          "Demo only. No provider contact, booking, payment, or submission happens from this board.",
          "데모 전용입니다. 이 보드에서 제공업체 연락, 예약, 결제, 제출은 진행되지 않습니다.",
          "Solo demo. Este tablero no contacta proveedores, reserva, paga ni envía nada."
        ))}</p>
        <span class="alpha05-safe-pill">${escapeSummaryText(safeLabel)}</span>
      </section>
    </div>
    <details class="alpha05-history-panel">
      <summary>${escapeSummaryText(alpha04Local("Action history", "액션 기록", "Historial de acciones"))}</summary>
      <ul>${history}</ul>
    </details>
  `;
  return { card, orchestrator, validation, workspace };
};

const alpha06Local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;

const readAlpha06State = (result) => {
  try {
    return JSON.parse(localStorage.getItem(predictionStorageKey(result)) || "{}");
  } catch {
    return {};
  }
};

const writeAlpha06State = (result, state = {}) => {
  try {
    localStorage.setItem(predictionStorageKey(result), JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
  } catch {
    // Predictive cards are assistive only. Storage must never block results.
  }
};

const createPredictionCardMarkup = (prediction) => `
  <article class="alpha06-prediction is-${escapeSummaryText(String(prediction.priority || "Helpful").toLowerCase())}" data-alpha06-id="${escapeSummaryText(prediction.id)}">
    <div class="alpha06-prediction-icon" aria-hidden="true">${prediction.priority === "Critical" ? "!" : "✦"}</div>
    <div class="alpha06-prediction-copy">
      <div class="alpha06-prediction-topline">
        <strong>${escapeSummaryText(prediction.title)}</strong>
        <span>${escapeSummaryText(prediction.priority)}</span>
      </div>
      <p>${escapeSummaryText(prediction.explanation)}</p>
      <small><b>${escapeSummaryText(alpha06Local("Why", "이유", "Motivo"))}:</b> ${escapeSummaryText(prediction.reason)}</small>
      <div class="alpha06-prediction-meta">
        <span>${escapeSummaryText(alpha06Local("Confidence", "확신도", "Confianza"))}: ${Math.round(Number(prediction.confidence || 0) * 100)}%</span>
        <span>${escapeSummaryText(prediction.sourceSignals?.slice(0, 2).join(" · ") || prediction.source)}</span>
      </div>
    </div>
    <div class="alpha06-prediction-actions" aria-label="${escapeSummaryText(alpha06Local("Prediction controls", "예측 제어", "Controles de predicción"))}">
      <button type="button" data-alpha06-feedback="accepted">${escapeSummaryText(prediction.actionLabel || alpha06Local("Review", "검토", "Revisar"))}</button>
      <button type="button" data-alpha06-feedback="dismissed">${escapeSummaryText(alpha06Local("Ignore", "무시", "Ignorar"))}</button>
      <button type="button" data-alpha06-feedback="not_relevant">${escapeSummaryText(alpha06Local("Not relevant", "관련 없음", "No relevante"))}</button>
    </div>
  </article>
`;

const createPredictiveIntelligenceCard = (result, missionContext, orchestrator) => {
  const state = readAlpha06State(result);
  const layer = createPredictiveIntelligenceLayer({
    result,
    context: missionContext || {},
    worldIntelligence: result.worldIntelligence || currentResult.worldIntelligence,
    orchestrator,
    language: activeLanguage,
    state
  });
  const validation = validatePredictiveIntelligence(layer);
  currentResult.alpha06PredictiveIntelligence = layer;
  if (!layer.visible.length && !layer.collapsed.length) return null;

  const card = document.createElement("article");
  card.className = "mission-card is-wide alpha06-predictive-card";
  card.dataset.cardId = "predictive-intelligence-alpha06";
  card.dataset.alpha06Valid = validation.ok ? "true" : "false";

  const visible = layer.visible.map(createPredictionCardMarkup).join("");
  const collapsed = layer.collapsed.slice(0, 6).map(createPredictionCardMarkup).join("");
  card.innerHTML = `
    <div class="alpha06-header">
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION)} · ${escapeSummaryText(alpha06Local("Predictive Intelligence", "예측 지능", "Inteligencia predictiva"))}</span>
      <h2>${escapeSummaryText(alpha06Local(
        "ONE noticed what may matter next",
        "ONE이 다음에 중요할 일을 감지했어요",
        "ONE detectó lo que puede importar después"
      ))}</h2>
      <p>${escapeSummaryText(alpha06Local(
        "Quiet preparation only. Nothing executes without approval.",
        "조용히 준비만 합니다. 승인 없이 실행하지 않습니다.",
        "Solo preparación tranquila. Nada se ejecuta sin aprobación."
      ))}</p>
    </div>
    <div class="alpha06-prediction-list">${visible}</div>
    ${collapsed ? `
      <details class="alpha06-collapsed">
        <summary>${escapeSummaryText(alpha06Local("Helpful ideas kept quiet", "조용히 보관한 도움 아이디어", "Ideas útiles guardadas en silencio"))}</summary>
        <div class="alpha06-prediction-list">${collapsed}</div>
      </details>
    ` : ""}
    <p class="alpha06-safety-note">${escapeSummaryText(alpha06Local(
      "Predictions prepare the mission. They never search, book, pay, submit, or contact providers by themselves.",
      "예측은 미션 준비만 돕습니다. 스스로 검색, 예약, 결제, 제출, 제공업체 연락을 하지 않습니다.",
      "Las predicciones preparan la misión. Nunca buscan, reservan, pagan, envían ni contactan proveedores solas."
    ))}</p>
  `;

  card.addEventListener("click", (event) => {
    const button = event.target.closest("[data-alpha06-feedback]");
    if (!button) return;
    const predictionElement = button.closest("[data-alpha06-id]");
    const prediction = layer.predictions.find((item) => item.id === predictionElement?.dataset.alpha06Id);
    if (!prediction) return;
    const nextState = applyPredictionFeedback(readAlpha06State(result), prediction, button.dataset.alpha06Feedback);
    writeAlpha06State(result, nextState);
    if (button.dataset.alpha06Feedback !== "accepted") {
      predictionElement.hidden = true;
    } else {
      button.textContent = alpha06Local("Prepared", "준비됨", "Preparado");
      button.disabled = true;
    }
  });
  return { card, layer, validation };
};

const createPersonalMissionMemoryCard = (result) => {
  const memory = readPersonalMissionMemoryFromBrowser();
  const domain = getDomainKey(result);
  const applied = applyPersonalMissionMemory(memory, {
    domain,
    explicitInstructions: result.rawInput || result.mission || result.originalMission || result.resolutionPlan?.userProblem || "",
    language: activeLanguage
  });
  currentResult.alpha07PersonalMissionMemory = applied;
  if (!applied.applied.length) return null;

  const card = document.createElement("article");
  card.className = "mission-card is-wide alpha07-memory-card";
  card.dataset.cardId = "personal-mission-memory-alpha07";
  const rows = applied.applied.slice(0, 6).map((entry) => `
    <li>
      <span>${escapeSummaryText(entry.category)}</span>
      <strong>${escapeSummaryText(entry.value)}</strong>
      <small>${escapeSummaryText(entry.explanation || explainMissionMemoryUse(entry, { language: activeLanguage }))}</small>
    </li>
  `).join("");
  card.innerHTML = `
    <div class="alpha07-header">
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA07_PERSONAL_MISSION_MEMORY_VERSION)} · ${escapeSummaryText(alpha06Local("Personal Mission Memory", "개인 미션 기억", "Memoria personal de misiones"))}</span>
      <h2>${escapeSummaryText(alpha06Local("ONE used what helps, not everything", "ONE이 필요한 기억만 사용했어요", "ONE usó solo lo que ayuda"))}</h2>
      <p>${escapeSummaryText(alpha06Local(
        "These preferences reduced repeated questions for this mission.",
        "이 기억은 같은 질문을 반복하지 않기 위해 사용되었습니다.",
        "Estas preferencias redujeron preguntas repetidas para esta misión."
      ))}</p>
    </div>
    <ul class="alpha07-memory-list">${rows}</ul>
    <div class="alpha07-memory-actions">
      <a href="personal-mission-memory.html">${escapeSummaryText(alpha06Local("Manage memory", "기억 관리", "Gestionar memoria"))}</a>
      <span>${escapeSummaryText(alpha06Local("Sensitive data is never saved here.", "민감 정보는 여기에 저장하지 않습니다.", "Los datos sensibles nunca se guardan aquí."))}</span>
    </div>
  `;
  return { card, applied };
};

const attachMissionDirectorBrief = (result) => {
  try {
    const brief = createMissionDirectorBrief({
      result,
      context: result.missionContext,
      worldIntelligence: result.worldIntelligence,
      personalMissionMemory: result.alpha07PersonalMissionMemory,
      predictiveIntelligence: result.alpha06PredictiveIntelligence,
      orchestrator: result.alpha05ExecutionOrchestrator,
      language: activeLanguage
    });
    const validation = validateMissionDirectorBrief(brief);
    currentResult.alpha08MissionDirector = brief;
    currentResult.alpha08MissionDirectorValidation = validation;
    missionGrid.dataset.alpha08Director = validation.ok ? "ready" : "degraded";
    missionGrid.dataset.alpha08VisibleAgents = "0";
  } catch (error) {
    currentResult.alpha08MissionDirector = {
      version: "ALPHA-08",
      status: "degraded",
      userFacingMode: "single-one-response",
      failureReason: String(error?.message || "mission_director_unavailable").slice(0, 120)
    };
    missionGrid.dataset.alpha08Director = "degraded";
    missionGrid.dataset.alpha08VisibleAgents = "0";
  }
};

const createProviderTrustNetworkCard = (brief) => {
  if (!brief || !brief.topProviders?.length) return null;
  const local = v22Local;
  const categoryLabel = (category = "") => ({
    flight: local("Flights", "항공", "Vuelos"),
    hotel: local("Hotels", "호텔", "Hoteles"),
    restaurant: local("Restaurants", "레스토랑", "Restaurantes"),
    transport: local("Transport", "이동", "Transporte"),
    hospital: local("Healthcare", "의료", "Salud"),
    insurance: local("Insurance", "보험", "Seguro"),
    banking: local("Banking", "은행", "Banca")
  }[category] || localizeDomainText(category || local("Provider", "제공업체", "Proveedor")));
  const language = activeLanguage === "ko" ? "ko" : activeLanguage === "es" ? "es" : "en";
  const title = local("Provider Trust Network", "제공업체 신뢰 네트워크", "Red de confianza de proveedores");
  const subtitle = local(
    "Ranked by trust signals, mission fit, public evidence, and approval-safe verification needs — never by ads.",
    "광고가 아니라 신뢰 신호, 미션 적합성, 공개 근거, 승인 전 확인 필요성을 기준으로 정리했습니다.",
    "Ordenado por señales de confianza, ajuste a la misión, evidencia pública y verificación segura; nunca por anuncios."
  );
  const topRows = brief.topProviders.slice(0, 6).map((provider) => `
    <li>
      <strong>${escapeSummaryText(provider.providerName)}</strong>
      <span>${escapeSummaryText(categoryLabel(provider.category))} · ${escapeSummaryText(provider.badgeLabel || trustBadgeLabel(provider.badge, language))}</span>
      <small>${escapeSummaryText(provider.explanation || provider.reasons?.join("; ") || "")}</small>
    </li>
  `).join("");
  const warnings = brief.warnings?.length
    ? `<div class="v22-chip-list">${brief.warnings.slice(0, 2).map((warning) => createV22Chip(warning)).join("")}</div>`
    : "";
  const article = document.createElement("article");
  article.className = "mission-card v22-card is-wide alpha09-provider-trust-card";
  article.dataset.cardId = "provider-trust-network";
  article.innerHTML = `
    <div class="v22-card-heading">
      <span class="v22-kicker">ALPHA-09 · Trust, not advertising</span>
      <h2>${escapeSummaryText(title)}</h2>
    </div>
    <p class="v22-card-body">${escapeSummaryText(subtitle)}</p>
    <ul class="v22-clean-list">${topRows}</ul>
    ${warnings}
  `;
  return article;
};

const createNaturalConversationCard = (result, context, refinement = null) => {
  try {
    const refinementLayer = refinement || buildProgressiveRefinement(result, context, readRefinementState(result), { language: activeLanguage });
    const layer = buildConversationUnderstandingLayer({
      messages: [result.originalMission || result.rawInput || result.mission || result.display?.title || ""],
      result,
      context,
      refinement: refinementLayer,
      predictions: result.alpha06PredictiveIntelligence,
      memory: result.alpha07PersonalMissionMemory,
      language: activeLanguage
    });
    const validation = validateConversationUnderstandingLayer(layer);
    currentResult.alpha10NaturalConversation = layer;
    currentResult.alpha10NaturalConversationValidation = validation;
    const local = v22Local;
    const u = layer.understanding || {};
    const fields = [
      [local("Goal", "목표", "Objetivo"), u.goal],
      [local("Intent", "의도", "Intención"), u.missionIntent],
      [local("Location", "장소", "Lugar"), u.locations?.join(" · ")],
      [local("Dates", "날짜", "Fechas"), u.dates?.join(" · ")],
      [local("People", "사람", "Personas"), u.people?.join(" · ")],
      [local("Budget", "예산", "Presupuesto"), u.budget],
      [local("Preferences", "선호", "Preferencias"), u.preferences?.join(" · ")],
      [local("Constraints", "조건", "Restricciones"), u.constraints?.join(" · ")]
    ].filter(([, value]) => value);
    const missing = layer.visibleQuestions?.length
      ? layer.visibleQuestions.map((question) => question.text)
      : [local("No extra question is needed right now.", "지금은 추가 질문이 필요하지 않습니다.", "No hace falta otra pregunta ahora.")];
    const confidenceLabel = layer.confidence?.level === "high"
      ? local("Clear enough to continue", "계속 준비해도 충분히 명확함", "Claro para continuar")
      : layer.confidence?.level === "medium"
        ? local("Almost clear", "거의 명확함", "Casi claro")
        : local("Needs quick confirmation", "짧은 확인 필요", "Necesita confirmación");
    const article = document.createElement("article");
    article.className = "mission-card v22-card is-wide alpha10-conversation-card";
    article.dataset.cardId = "natural-mission-conversation";
    article.dataset.alpha10Confidence = layer.confidence?.level || "unknown";
    article.dataset.alpha10QuestionCount = String(layer.visibleQuestions?.length || 0);
    article.innerHTML = `
      <div class="v22-card-heading">
        <span class="v22-kicker">ALPHA-10 · Natural Mission Conversation</span>
        <h2>${escapeSummaryText(local("ONE currently understands", "ONE이 현재 이해한 내용", "ONE entiende ahora"))}</h2>
      </div>
      <p class="v22-card-body">${escapeSummaryText(local(
        "Keep talking naturally. ONE extracts only what matters and asks only if it improves the mission.",
        "자연스럽게 말하면 됩니다. ONE은 중요한 정보만 이해하고, 꼭 필요할 때만 묻습니다.",
        "Habla naturalmente. ONE extrae lo importante y solo pregunta si mejora la misión."
      ))}</p>
      <div class="v22-chip-list">${fields.map(([label, value]) => createV22Chip(`${label}: ${value}`)).join("")}</div>
      <div class="v22-chip-list">${createV22Chip(confidenceLabel, "primary")}</div>
      <details class="alpha10-missing-info"${layer.visibleQuestions?.length ? " open" : ""}>
        <summary>${escapeSummaryText(local("Natural follow-up", "자연스러운 확인", "Seguimiento natural"))}</summary>
        <ul class="v22-clean-list">${missing.map((item) => `<li>${escapeSummaryText(item)}</li>`).join("")}</ul>
      </details>
    `;
    return article;
  } catch (error) {
    currentResult.alpha10NaturalConversation = {
      version: "ALPHA-10",
      status: "degraded",
      failureReason: String(error?.message || "conversation_understanding_unavailable").slice(0, 120)
    };
    return null;
  }
};

const attachProviderTrustBrief = (result) => {
  try {
    const brief = buildProviderTrustBrief({
      result,
      context: result.missionContext,
      missionDirector: result.alpha08MissionDirector,
      personalMissionMemory: result.alpha07PersonalMissionMemory,
      worldIntelligence: result.worldIntelligence,
      language: activeLanguage
    });
    const validation = validateProviderTrustBrief(brief);
    currentResult.alpha09ProviderTrust = brief;
    currentResult.alpha09ProviderTrustValidation = validation;
    missionGrid.dataset.alpha09ProviderTrust = validation.ok ? "ready" : "degraded";
    const card = createProviderTrustNetworkCard(brief);
    if (card && !missionGrid.querySelector('[data-card-id="provider-trust-network"]')) {
      missionGrid.appendChild(card);
    }
  } catch (error) {
    currentResult.alpha09ProviderTrust = {
      version: "ALPHA-09",
      status: "degraded",
      failureReason: String(error?.message || "provider_trust_unavailable").slice(0, 120)
    };
    missionGrid.dataset.alpha09ProviderTrust = "degraded";
  }
};

const readAlpha11MonitoringState = (result) => {
  try {
    return JSON.parse(localStorage.getItem(`kastiz-one-alpha11-monitoring:${result?.missionId || result?.id || result?.rawInput || "mission"}`) || "{}");
  } catch {
    return {};
  }
};

const writeAlpha11MonitoringState = (result, state) => {
  try {
    localStorage.setItem(`kastiz-one-alpha11-monitoring:${result?.missionId || result?.id || result?.rawInput || "mission"}`, JSON.stringify(state));
  } catch {
    // Monitoring state is helpful, not mission-critical.
  }
};

const alpha12TimelineStorageKey = (result) => `kastiz-one-alpha12-life-timeline:${result?.missionId || result?.id || result?.rawInput || "mission"}`;

const readAlpha12LifeTimelineState = (result) => {
  try {
    return JSON.parse(localStorage.getItem(alpha12TimelineStorageKey(result)) || "{}");
  } catch {
    return {};
  }
};

const writeAlpha12LifeTimelineState = (result, state) => {
  try {
    localStorage.setItem(alpha12TimelineStorageKey(result), JSON.stringify(state));
  } catch {
    // Timeline controls are user convenience. They must never block mission results.
  }
};

const createLifeTimelineCard = (layer) => {
  if (!layer || layer.hidden) return null;
  const local = v22Local;
  const map = layer.missionMap || {};
  const relationText = (relationship) => relationship === "current"
    ? local("Current", "현재", "Actual")
    : relationshipLabel(relationship, activeLanguage);
  const statusText = (status = "") => ({
    active: local("Active", "진행 중", "Activo"),
    "mission-ready": local("Prepared", "준비됨", "Preparado"),
    prepared_opportunity: local("Prepared option", "준비된 선택지", "Opción preparada"),
    completed: local("Completed", "완료", "Completado")
  }[status] || local("Prepared", "준비됨", "Preparado"));
  const renderNodes = (nodes = []) => nodes.length
    ? nodes.slice(0, 4).map((node) => `
      <li>
        <strong>${escapeSummaryText(node.title || node.canonicalTitle || node.missionId)}</strong>
        <span>${escapeSummaryText(relationText(node.relationship))} · ${escapeSummaryText(statusText(node.status))}</span>
      </li>
    `).join("")
    : `<li>${escapeSummaryText(local("Nothing extra needed yet.", "아직 추가로 필요한 것은 없습니다.", "Aún no hace falta nada más."))}</li>`;
  const goalRows = (layer.goals || []).slice(0, 3).map((goal) => `
    <li>
      <strong>${escapeSummaryText(goal.title)}</strong>
      <span>${escapeSummaryText(goal.progressNarrative || "")}</span>
      <small>${escapeSummaryText(local("Remaining", "남은 단계", "Pendiente"))}: ${escapeSummaryText((goal.remaining || []).slice(0, 3).join(" · "))}</small>
    </li>
  `).join("");
  const futureRows = (layer.futureMissions || []).slice(0, 6).map((mission) => `
    <li>
      <strong>${escapeSummaryText(mission.title)}</strong>
      <span>${escapeSummaryText(relationshipLabel(mission.relationship, activeLanguage))}</span>
      <small>${escapeSummaryText(mission.reason || "")}</small>
    </li>
  `).join("");
  const article = document.createElement("article");
  article.className = "mission-card v22-card is-wide alpha12-life-timeline-card";
  article.dataset.cardId = "life-timeline";
  article.dataset.alpha12Paused = String(Boolean(layer.paused));
  article.dataset.alpha12FutureCount = String(layer.futureMissions?.length || 0);
  article.innerHTML = `
    <div class="v22-card-heading">
      <span class="v22-kicker">ALPHA-12 · Life Timeline</span>
      <h2>${escapeSummaryText(local("Where this mission fits in your life", "이 미션이 삶에서 어디에 이어지는지", "Dónde encaja esta misión en tu vida"))}</h2>
    </div>
    <p class="v22-card-body">${escapeSummaryText(local(
      "ONE connects the current mission to related, dependent, optional, and future life missions without turning it into a calendar or to-do app.",
      "ONE은 현재 미션을 관련·의존·선택·미래 미션과 연결하지만, 캘린더나 할 일 앱처럼 만들지는 않습니다.",
      "ONE conecta esta misión con misiones relacionadas, dependientes, opcionales y futuras sin convertirlo en calendario o lista de tareas."
    ))}</p>
    <div class="v22-chip-list">
      ${createV22Chip(`${local("Life stage", "삶의 단계", "Etapa")}: ${layer.lifeStageLabel}`)}
      ${createV22Chip(layer.paused ? local("Paused", "일시정지됨", "Pausado") : local("Active", "활성", "Activo"), "primary")}
      ${createV22Chip(`${local("Suggestions", "제안", "Sugerencias")}: ${layer.futureMissions?.length || 0}`)}
    </div>
    <div class="v22-grid">
      <section>
        <h3>${escapeSummaryText(local("Current", "현재", "Actual"))}</h3>
        <ul class="v22-clean-list">${renderNodes(map.current)}</ul>
      </section>
      <section>
        <h3>${escapeSummaryText(local("Upcoming", "다음", "Próximo"))}</h3>
        <ul class="v22-clean-list">${renderNodes(map.upcoming)}</ul>
      </section>
      <section>
        <h3>${escapeSummaryText(local("Related", "관련", "Relacionado"))}</h3>
        <ul class="v22-clean-list">${renderNodes(map.related)}</ul>
      </section>
      <section>
        <h3>${escapeSummaryText(local("Future opportunities", "미래 기회", "Oportunidades futuras"))}</h3>
        <ul class="v22-clean-list">${futureRows || renderNodes(map.future)}</ul>
      </section>
    </div>
    <details open>
      <summary>${escapeSummaryText(local("Goals this supports", "이 미션이 돕는 목표", "Metas que apoya"))}</summary>
      <ul class="v22-clean-list">${goalRows || renderNodes([])}</ul>
    </details>
    <div class="alpha12-timeline-actions" role="group" aria-label="${escapeSummaryText(local("Life timeline controls", "라이프 타임라인 제어", "Controles de línea de vida"))}">
      <button type="button" data-alpha12-action="pause">${escapeSummaryText(local("Pause", "일시정지", "Pausar"))}</button>
      <button type="button" data-alpha12-action="hide">${escapeSummaryText(local("Hide", "숨기기", "Ocultar"))}</button>
      <button type="button" data-alpha12-action="disable-suggestions">${escapeSummaryText(local("Disable suggestions", "제안 끄기", "Desactivar sugerencias"))}</button>
      <button type="button" data-alpha12-action="export">${escapeSummaryText(local("Export", "내보내기", "Exportar"))}</button>
      <button type="button" data-alpha12-action="delete">${escapeSummaryText(local("Delete", "삭제", "Eliminar"))}</button>
    </div>
  `;
  return article;
};

const attachLifeTimelineLayer = (result) => {
  try {
    const state = readAlpha12LifeTimelineState(result);
    const layer = createLifeTimelineLayer({
      result,
      context: result.missionContext,
      memory: result.alpha07PersonalMissionMemory,
      predictions: result.alpha06PredictiveIntelligence,
      monitoring: result.alpha11MissionMonitoring,
      previousMissions: result.previousMissions || [],
      goals: result.lifeGoals || [],
      state,
      language: activeLanguage
    });
    const validation = validateLifeTimelineLayer(layer);
    currentResult.alpha12LifeTimeline = layer;
    currentResult.alpha12LifeTimelineValidation = validation;
    missionGrid.dataset.alpha12LifeTimeline = validation.ok ? "ready" : "degraded";
    const card = createLifeTimelineCard(layer);
    if (card && !missionGrid.querySelector('[data-card-id="life-timeline"]')) {
      missionGrid.appendChild(card);
      card.querySelectorAll("[data-alpha12-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const currentState = readAlpha12LifeTimelineState(currentResult);
          const action = button.dataset.alpha12Action;
          if (action === "export") {
            const blob = new Blob([JSON.stringify(exportLifeTimeline(currentResult.alpha12LifeTimeline), null, 2)], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "kastiz-one-life-timeline.json";
            link.click();
            URL.revokeObjectURL(link.href);
            return;
          }
          const nextState = action === "pause"
            ? pauseLifeTimeline(currentState)
            : action === "hide"
              ? hideLifeTimeline(currentState)
              : action === "delete"
                ? deleteLifeTimeline()
                : action === "disable-suggestions"
                  ? disableLifeMissionSuggestions(currentState)
                  : currentState;
          writeAlpha12LifeTimelineState(currentResult, nextState);
          renderMission();
        });
      });
    }
  } catch (error) {
    currentResult.alpha12LifeTimeline = {
      version: "ALPHA-12",
      status: "degraded",
      failureReason: String(error?.message || "life_timeline_unavailable").slice(0, 120)
    };
    missionGrid.dataset.alpha12LifeTimeline = "degraded";
  }
};

const alpha14ExplanationStorageKey = (result) => `kastiz-one-alpha14-explanations:${result?.missionId || result?.id || result?.rawInput || "mission"}`;

const readAlpha14ExplanationState = (result) => {
  try {
    return JSON.parse(localStorage.getItem(alpha14ExplanationStorageKey(result)) || "{}");
  } catch {
    return {};
  }
};

const writeAlpha14ExplanationState = (result, state) => {
  try {
    localStorage.setItem(alpha14ExplanationStorageKey(result), JSON.stringify(state));
  } catch {
    // Explanation preference is local convenience only.
  }
};

const createExplainableIntelligenceCard = (layer) => {
  if (!layer || !layer.explanations?.length) return null;
  const local = v22Local;
  const explanations = layer.explanations.slice(0, layer.detailLevel === "minimal" ? 4 : 8).map((explanation) => `
    <li>
      <strong>${escapeSummaryText(explanation.question)}</strong>
      <span>${escapeSummaryText(explanation.answer)}</span>
    </li>
  `).join("");
  const selected = (level) => layer.detailLevel === level ? " aria-pressed=\"true\" class=\"is-active\"" : " aria-pressed=\"false\"";
  const article = document.createElement("article");
  article.className = "mission-card v22-card is-wide alpha14-explainable-card";
  article.dataset.cardId = "explainable-intelligence";
  article.dataset.alpha14DetailLevel = layer.detailLevel;
  article.dataset.alpha14ExplanationCount = String(layer.explanations.length);
  article.innerHTML = `
    <div class="v22-card-heading">
      <span class="v22-kicker">ALPHA-14 · Explainable Intelligence</span>
      <h2>${escapeSummaryText(local("Why ONE recommends this", "ONE이 이렇게 추천한 이유", "Por qué ONE recomienda esto"))}</h2>
    </div>
    <p class="v22-card-body">${escapeSummaryText(local(
      "Short explanations from visible mission signals. No internal reasoning, prompts, or hidden agent discussion is shown.",
      "보이는 미션 신호만 짧게 설명합니다. 내부 추론, 프롬프트, 숨겨진 에이전트 논의는 보여주지 않습니다.",
      "Explicaciones breves con señales visibles de la misión. No muestra razonamiento interno, prompts ni discusiones ocultas."
    ))}</p>
    <div class="v22-chip-list">
      ${createV22Chip(`${local("Explanations", "설명", "Explicaciones")}: ${layer.explanations.length}`)}
      ${createV22Chip(local("Approval-first", "승인 우선", "Aprobación primero"), "primary")}
    </div>
    <ul class="v22-clean-list">${explanations}</ul>
    <div class="alpha14-explanation-actions" role="group" aria-label="${escapeSummaryText(local("Explanation detail", "설명 자세히 보기", "Detalle de explicación"))}">
      <button type="button" data-alpha14-detail="${EXPLANATION_DETAIL_LEVELS.MINIMAL}"${selected(EXPLANATION_DETAIL_LEVELS.MINIMAL)}>${escapeSummaryText(local("Minimal", "간단히", "Mínimo"))}</button>
      <button type="button" data-alpha14-detail="${EXPLANATION_DETAIL_LEVELS.STANDARD}"${selected(EXPLANATION_DETAIL_LEVELS.STANDARD)}>${escapeSummaryText(local("Standard", "표준", "Estándar"))}</button>
      <button type="button" data-alpha14-detail="${EXPLANATION_DETAIL_LEVELS.DETAILED}"${selected(EXPLANATION_DETAIL_LEVELS.DETAILED)}>${escapeSummaryText(local("Detailed", "자세히", "Detallado"))}</button>
    </div>
  `;
  return article;
};

const attachExplainableIntelligenceLayer = (result) => {
  try {
    const state = readAlpha14ExplanationState(result);
    const layer = createExplanationLayer({
      result,
      detailLevel: state.detailLevel || EXPLANATION_DETAIL_LEVELS.STANDARD,
      language: activeLanguage,
      history: state.history || []
    });
    const validation = validateExplanationLayer(layer);
    currentResult.alpha14ExplainableIntelligence = layer;
    currentResult.alpha14ExplainableIntelligenceValidation = validation;
    missionGrid.dataset.alpha14ExplainableIntelligence = validation.ok ? "ready" : "degraded";
    const card = createExplainableIntelligenceCard(layer);
    if (card && !missionGrid.querySelector('[data-card-id="explainable-intelligence"]')) {
      missionGrid.appendChild(card);
      card.querySelectorAll("[data-alpha14-detail]").forEach((button) => {
        button.addEventListener("click", () => {
          const currentState = readAlpha14ExplanationState(currentResult);
          writeAlpha14ExplanationState(currentResult, setExplanationDetailLevel(currentState, button.dataset.alpha14Detail));
          renderMission();
        });
      });
    }
  } catch (error) {
    currentResult.alpha14ExplainableIntelligence = {
      version: "ALPHA-14",
      status: "degraded",
      failureReason: String(error?.message || "explainable_intelligence_unavailable").slice(0, 120)
    };
    missionGrid.dataset.alpha14ExplainableIntelligence = "degraded";
  }
};

const createMissionMonitoringCard = (layer) => {
  if (!layer || !layer.watchers?.length) return null;
  const local = v22Local;
  const watcherRows = layer.watchers.slice(0, 8).map((watcher) => `
    <li>
      <strong>${escapeSummaryText(watcher.label || watcherLabel(watcher.type, activeLanguage))}</strong>
      <span>${escapeSummaryText(watcher.status || watcher.lifecycle)} · ${escapeSummaryText(local("Last checked", "마지막 확인", "Última revisión"))}: ${escapeSummaryText(new Date(watcher.lastCheckedAt).toLocaleString(activeLanguage === "ko" ? "ko-KR" : activeLanguage === "es" ? "es" : "en"))}</span>
    </li>
  `).join("");
  const digestRows = layer.digest?.updates?.length
    ? layer.digest.updates.slice(0, 5).map((update) => `
      <li>
        <strong>${escapeSummaryText(update.title)}</strong>
        <span>${escapeSummaryText(update.watcher)} · ${escapeSummaryText(update.nextRecommendedAction || "")}</span>
        <small>${escapeSummaryText(update.whatChanged || update.why || "")}</small>
      </li>
    `).join("")
    : `<li>${escapeSummaryText(local("No meaningful changes since the last check.", "마지막 확인 이후 중요한 변화는 없습니다.", "No hay cambios importantes desde la última revisión."))}</li>`;
  const notificationCount = layer.notifications?.length || 0;
  const article = document.createElement("article");
  article.className = "mission-card v22-card is-wide alpha11-monitoring-card";
  article.dataset.cardId = "autonomous-mission-monitoring";
  article.dataset.alpha11NotificationCount = String(notificationCount);
  article.dataset.alpha11WatcherCount = String(layer.watchers.length);
  article.innerHTML = `
    <div class="v22-card-heading">
      <span class="v22-kicker">ALPHA-11 · Autonomous Mission Monitoring</span>
      <h2>${escapeSummaryText(local("Mission Updates", "미션 업데이트", "Actualizaciones de misión"))}</h2>
    </div>
    <p class="v22-card-body">${escapeSummaryText(local(
      "ONE quietly watches meaningful changes and never executes anything without approval.",
      "ONE은 중요한 변화만 조용히 확인하며, 승인 없이 아무것도 실행하지 않습니다.",
      "ONE observa cambios importantes y nunca ejecuta nada sin aprobación."
    ))}</p>
    <div class="v22-chip-list">
      ${createV22Chip(local("Watching", "확인 중", "Observando") + `: ${layer.watchers.length}`)}
      ${createV22Chip(local("Proactive alerts", "중요 알림", "Alertas") + `: ${notificationCount}`)}
      ${layer.nextRecommendedAction ? createV22Chip(local("Next", "다음", "Siguiente") + `: ${layer.nextRecommendedAction}`) : ""}
    </div>
    <details open>
      <summary>${escapeSummaryText(local("Watching", "확인 중", "Observando"))}</summary>
      <ul class="v22-clean-list">${watcherRows}</ul>
    </details>
    <details${layer.digest?.updates?.length ? " open" : ""}>
      <summary>${escapeSummaryText(local("Mission history", "미션 기록", "Historial"))}</summary>
      <ul class="v22-clean-list">${digestRows}</ul>
    </details>
    <div class="alpha11-monitoring-actions" role="group" aria-label="${escapeSummaryText(local("Monitoring controls", "모니터링 제어", "Controles de monitoreo"))}">
      <button type="button" data-alpha11-action="pause">${escapeSummaryText(local("Pause monitoring", "모니터링 일시정지", "Pausar monitoreo"))}</button>
      <button type="button" data-alpha11-action="resume">${escapeSummaryText(local("Resume", "다시 시작", "Reanudar"))}</button>
    </div>
  `;
  return article;
};

const attachMissionMonitoringLayer = (result) => {
  try {
    const state = readAlpha11MonitoringState(result);
    const layer = createMissionWatcherLayer({
      result,
      state,
      language: activeLanguage
    });
    const validation = validateMissionWatcherLayer(layer);
    currentResult.alpha11MissionMonitoring = layer;
    currentResult.alpha11MissionMonitoringValidation = validation;
    missionGrid.dataset.alpha11Monitoring = validation.ok ? "ready" : "degraded";
    const card = createMissionMonitoringCard(layer);
    if (card && !missionGrid.querySelector('[data-card-id="autonomous-mission-monitoring"]')) {
      missionGrid.appendChild(card);
      card.querySelectorAll("[data-alpha11-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const currentState = readAlpha11MonitoringState(currentResult);
          const nextState = { ...currentState, paused: button.dataset.alpha11Action === "pause" ? true : false };
          writeAlpha11MonitoringState(currentResult, nextState);
          renderMission();
        });
      });
    }
  } catch (error) {
    currentResult.alpha11MissionMonitoring = {
      version: "ALPHA-11",
      status: "degraded",
      failureReason: String(error?.message || "mission_monitoring_unavailable").slice(0, 120)
    };
    missionGrid.dataset.alpha11Monitoring = "degraded";
  }
};

const readAlpha04UiState = (result) => {
  try {
    return JSON.parse(localStorage.getItem(`${livingMissionStorageKey(result)}:ui`) || "{}");
  } catch {
    return {};
  }
};

const writeAlpha04UiState = (result, patch = {}) => {
  if (!result) return;
  try {
    const key = `${livingMissionStorageKey(result)}:ui`;
    localStorage.setItem(key, JSON.stringify({ ...readAlpha04UiState(result), ...patch, updatedAt: new Date().toISOString() }));
  } catch {
    // Workspace resume is a convenience layer. It must never block mission results.
  }
};

const restoreAlpha04UiState = (result) => {
  const state = readAlpha04UiState(result);
  const opened = Array.isArray(state.openedSections) ? new Set(state.openedSections) : new Set();
  document.querySelectorAll("[data-alpha04-detail-id]").forEach((details) => {
    details.open = opened.has(details.dataset.alpha04DetailId);
  });
  if (Number.isFinite(Number(state.scrollY)) && Number(state.scrollY) > 0 && !document.body.classList.contains("portable-summary-view")) {
    window.requestAnimationFrame(() => window.scrollTo({ top: Number(state.scrollY), behavior: "auto" }));
  }
};

const trackAlpha04Details = (result) => {
  document.querySelectorAll(".alpha04-history-panel").forEach((details, index) => {
    details.dataset.alpha04DetailId = details.dataset.alpha04DetailId || `alpha04-history-${index}`;
    details.addEventListener("toggle", () => {
      const openedSections = [...document.querySelectorAll("[data-alpha04-detail-id][open]")].map((item) => item.dataset.alpha04DetailId);
      writeAlpha04UiState(result, { openedSections });
    });
  });
};

const renderTravelMission = (result, missionContext) => {
  const destination = getTravelDestinationLabel(result);
  missionTitle.textContent = v22Local(
    `${destination} trip prepared four ways`,
    `${destination} 여행을 네 가지 방식으로 준비했습니다.`,
    `Viaje a ${destination} preparado en cuatro formas`
  );
  missionGrid.innerHTML = "";
  currentResult.v22TravelPackages = false;
  currentResult.v23TravelExperience = true;
  missionGrid.classList.add("is-v23-travel-layout");
  const disclosure = document.querySelector(".prototype-disclosure");
  if (disclosure) disclosure.textContent = v22Local(
    "Prototype · experience-first travel plan · no booking or payment",
    "프로토타입 · 경험 중심 여행 계획 · 예약과 결제 없음",
    "Prototipo · viaje centrado en experiencia · sin reservas ni pagos"
  );
  const livingWorkspace = createLivingMissionWorkspaceCard(result, missionContext);
  missionGrid.appendChild(livingWorkspace.card);
  const conversationCard = createNaturalConversationCard(result, missionContext);
  if (conversationCard) missionGrid.appendChild(conversationCard);
  const executionOrchestrator = createExecutionOrchestratorCard(result, livingWorkspace.workspace);
  missionGrid.appendChild(executionOrchestrator.card);
  const predictiveCard = createPredictiveIntelligenceCard(result, missionContext, executionOrchestrator.orchestrator);
  if (predictiveCard) missionGrid.appendChild(predictiveCard.card);
  const memoryCard = createPersonalMissionMemoryCard(result);
  if (memoryCard) missionGrid.appendChild(memoryCard.card);
  const travelExperience = createTravelPackagesCard(result, missionContext);
  missionGrid.appendChild(travelExperience);
  const refinementCard = createProgressiveRefinementCard(result, missionContext);
  if (refinementCard) missionGrid.appendChild(refinementCard);
  const insightsCard = createMissionInsightsCard(result, missionContext);
  if (insightsCard) missionGrid.appendChild(insightsCard);
  const worldSourceCard = createWorldIntelligenceSourceCard(result);
  if (worldSourceCard) missionGrid.appendChild(worldSourceCard);
  trackAlpha04Details(result);
  restoreAlpha04UiState(result);
  updateV23JourneySelection(travelExperience, Math.max(0, travelExperience._v23Journeys.findIndex((journey) => journey.selected)), result);
  travelExperience.querySelectorAll(".v23-journey-card").forEach((card) => {
    card.addEventListener("click", () => updateV23JourneySelection(travelExperience, Number(card.dataset.journeyIndex || 0), result));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        updateV23JourneySelection(travelExperience, Number(card.dataset.journeyIndex || 0), result);
      }
    });
  });
  travelExperience.querySelectorAll(".v23-style-chip").forEach((chip) => {
    chip.addEventListener("click", () => chip.classList.toggle("is-selected"));
  });
};

const renderResolutionPlanMission = (result) => {
  const plan = result.resolutionPlan || {};
  const domainKey = getDomainKey(result);
  const presentation = domainPresentation(result);
  const local = v22Local;
  const safeItems = (items = []) => items.map((item) => localizeDomainText(item?.title || item?.label || item)).filter(Boolean);
  const mission = plan.userProblem || result.originalMission || result.rawInput || result.mission || "";
  missionTitle.textContent = mission || local("Prepared mission", "준비된 미션", "Misión preparada");
  missionGrid.innerHTML = "";
  missionGrid.classList.add("is-domain-layout");
  missionGrid.dataset.domain = domainKey;
  currentResult.v22DomainLayout = true;
  const disclosure = document.querySelector(".prototype-disclosure");
  if (disclosure) disclosure.textContent = localize(presentation.prototype);
  const scheduleCard = createScheduleCard(result);
  if (scheduleCard) missionGrid.appendChild(scheduleCard);
  const conversationCard = createNaturalConversationCard(result, result.missionContext);
  if (conversationCard) missionGrid.appendChild(conversationCard);
  const executionOrchestrator = createExecutionOrchestratorCard(result, null);
  missionGrid.appendChild(executionOrchestrator.card);
  const predictiveCard = createPredictiveIntelligenceCard(result, { resolutionPlan: plan }, executionOrchestrator.orchestrator);
  if (predictiveCard) missionGrid.appendChild(predictiveCard.card);
  const memoryCard = createPersonalMissionMemoryCard(result);
  if (memoryCard) missionGrid.appendChild(memoryCard.card);

  const recommended = plan.recommendedPath || plan.solutionPaths?.[0] || {};

  missionGrid.appendChild(createV22Card({
    id: "resolution-understanding",
    title: local("What ONE understood", "ONE이 이해한 내용", "Lo que ONE entendió"),
    kicker: localize(presentation.title),
    body: localize(presentation.understood),
    chips: [
      `${local("Goal", "목표", "Objetivo")}: ${mission || polishedDomainText(plan.desiredOutcome, local("Mission prepared", "미션 준비", "Misión preparada"))}`,
      `${local("Domain", "분야", "Dominio")}: ${localizeDomainText(plan.domain || result.domain || result.type || "general")}`,
      `${local("Type", "유형", "Tipo")}: ${localizeDomainText(plan.missionType || result.missionType || "general")}`
    ],
    wide: true,
    tone: "hero"
  }));

  const recommendedFallback = local(
    "ONE prepared the safest useful path and kept every real-world action behind approval.",
    "ONE이 가장 적합한 해결 경로를 준비했고 실제 실행은 승인 뒤로 막아두었습니다.",
    "ONE preparó la ruta más útil y protegió toda acción real con aprobación."
  );
  const recommendedSteps = activeLanguage === "en"
    ? safeItems(recommended.requiredSteps || plan.preparedActions || []).slice(0, 5)
    : (presentation.prepared?.[activeLanguage] || presentation.prepared?.en || []);
  missionGrid.appendChild(createV22Card({
    id: "resolution-recommended-solution",
    title: local("Recommended solution", "추천 해결 방법", "Solución recomendada"),
    kicker: local("ONE Pick", "ONE 추천", "ONE recomienda"),
    body: polishedDomainText(recommended.expectedOutcome || plan.nextBestAction, recommendedFallback),
    chips: [polishedDomainText(recommended.title, local("Prepared solution path", "준비된 해결 경로", "Ruta preparada")), ...recommendedSteps],
    wide: true,
    tone: "primary"
  }));
  const insightsCard = createMissionInsightsCard(result, result.missionContext);
  if (insightsCard) missionGrid.appendChild(insightsCard);
  const refinementCard = createProgressiveRefinementCard(result, result.missionContext);
  if (refinementCard) missionGrid.appendChild(refinementCard);

  const alternativePaths = (plan.alternativePaths || []).slice(0, 4);
  const alternatives = document.createElement("article");
  alternatives.className = "mission-card v22-card is-wide";
  alternatives.dataset.cardId = "resolution-other-paths";
  alternatives.innerHTML = `
    <div class="v22-card-heading">
      <span class="v22-kicker">${local("Alternatives", "다른 좋은 선택지", "Alternativas")}</span>
      <h2>${local("Other good options", "다른 좋은 방법", "Otras buenas opciones")}</h2>
      <p class="v22-card-body">${local("Tap a direction to compare before approval.", "승인 전에 방향을 눌러 비교할 수 있습니다.", "Toca una ruta para comparar antes de aprobar.")}</p>
    </div>
    <div class="v22-path-grid"></div>
  `;
  const pathGrid = alternatives.querySelector(".v22-path-grid");
  if (alternativePaths.length) {
    const alternativeNames = [
      local("Compare another route", "다른 경로 비교", "Comparar otra ruta"),
      local("Lower-effort path", "부담이 적은 경로", "Ruta más simple"),
      local("Higher-support path", "지원이 더 많은 경로", "Ruta con más apoyo"),
      local("Fallback path", "대안 경로", "Ruta alternativa")
    ];
    alternativePaths.forEach((path, index) => pathGrid.appendChild(createV22PathCard({
      id: `path-${index}`,
      title: polishedDomainText(path.title || path, alternativeNames[index] || alternativeNames[0]),
      reason: polishedDomainText(path.expectedOutcome, local("Useful fallback if the main path does not fit.", "주요 경로가 맞지 않을 때 사용할 수 있는 대안입니다.", "Alternativa si la ruta principal no encaja.")),
      steps: activeLanguage === "en" ? path.requiredSteps || [] : (presentation.prepared?.[activeLanguage] || presentation.prepared?.en || []),
      selected: index === 0
    })));
  } else {
    pathGrid.appendChild(createV22PathCard({
      id: "path-default",
      title: local("Keep current recommendation", "현재 추천 유지", "Mantener recomendación"),
      reason: local("The current plan is enough to continue.", "현재 계획만으로도 계속 진행할 수 있습니다.", "El plan actual basta para continuar."),
      selected: true
    }));
  }
  missionGrid.appendChild(alternatives);

  missionGrid.appendChild(createV22Card({
    id: "resolution-prepared",
    title: local("Already prepared", "이미 준비된 것", "Ya preparado"),
    kicker: local("Ready", "준비 완료", "Listo"),
    chips: activeLanguage === "en" ? safeItems(plan.preparedActions?.length ? plan.preparedActions : presentation.prepared?.en || []) : (presentation.prepared?.[activeLanguage] || presentation.prepared?.en || []),
    wide: false,
    tone: "prepared"
  }));

  missionGrid.appendChild(createV22Card({
    id: "resolution-needed",
    title: local("Things I still need", "아직 필요한 것", "Lo que falta"),
    kicker: local("Only if needed", "필요할 때만", "Solo si hace falta"),
    chips: activeLanguage === "en"
      ? safeItems(plan.missingEssentialInformation?.length ? plan.missingEssentialInformation : plan.userRequiredActions || [local("Confirm before approval", "승인 전 확인", "Confirmar antes de aprobar")])
      : [local("필요 조건 확인", "필요 조건 확인", "Confirmar detalles"), local("승인 전 검토", "승인 전 검토", "Revisar antes de aprobar")],
    wide: false,
    tone: "needed"
  }));

  missionGrid.appendChild(createV22Card({
    id: "resolution-approval-actions",
    title: local("Ready when you are", "준비되면 승인하세요", "Listo cuando quieras"),
    kicker: local("Approval protected", "승인 보호", "Aprobación protegida"),
    body: local("Nothing is booked, paid, submitted, signed, or shared before explicit approval.", "명확한 승인 전에는 예약, 결제, 제출, 서명, 제공업체 공유가 진행되지 않습니다.", "Nada se reserva, paga, envía, firma o comparte antes de aprobar."),
    chips: activeLanguage === "en" ? safeItems(plan.approvalRequiredActions?.length ? plan.approvalRequiredActions : [local("Approve", "승인", "Aprobar"), local("Modify", "수정", "Modificar"), local("Cancel", "취소", "Cancelar")]) : [local("Approve", "승인", "Aprobar"), local("Modify", "수정", "Modificar"), local("Cancel", "취소", "Cancelar")],
    wide: true,
    tone: "approval"
  }));

  missionGrid.appendChild(createV22Card({
    id: "resolution-risks",
    title: local("Before execution", "실행 전 확인", "Antes de ejecutar"),
    kicker: local("Honest limits", "정직한 한계", "Límites honestos"),
    chips: activeLanguage === "en" ? safeItems(plan.risks?.length ? plan.risks : [local("Live availability may change.", "실시간 가능 여부는 바뀔 수 있습니다.", "La disponibilidad puede cambiar."), local("Provider confirmation is required.", "제공업체 최종 확인이 필요합니다.", "Se necesita confirmación del proveedor.")]) : [local("Live availability may change.", "실시간 가능 여부는 바뀔 수 있습니다.", "La disponibilidad puede cambiar."), local("Provider confirmation is required.", "제공업체 최종 확인이 필요합니다.", "Se necesita confirmación del proveedor.")],
    wide: false,
    tone: "quiet"
  }));

  missionGrid.appendChild(createV22Card({
    id: "resolution-next-action",
    title: local("Next action", "다음 행동", "Siguiente acción"),
    kicker: local("ONE is ready", "ONE 준비 완료", "ONE está listo"),
    body: polishedDomainText(plan.nextBestAction, local("Review the prepared solution, adjust anything, then approve when ready.", "준비된 해결 방법을 확인하고 필요한 부분을 고친 뒤 준비되면 승인하세요.", "Revisa la solución, ajusta lo necesario y aprueba cuando quieras.")),
    chips: presentation.prepared?.[activeLanguage] || presentation.prepared?.en || [],
    wide: false,
    tone: "next"
  }));
};

const renderGeneralMission = (result) => {
  missionTitle.textContent = result.display?.title || result.rawInput || (activeLanguage === "ko" ? "미션 계획" : "Mission Plan");
  missionGrid.innerHTML = "";
  const scheduleCard = createScheduleCard(result);
  if (scheduleCard) missionGrid.appendChild(scheduleCard);
  const conversationCard = createNaturalConversationCard(result, result.missionContext);
  if (conversationCard) missionGrid.appendChild(conversationCard);
  const insightsCard = createMissionInsightsCard(result, result.missionContext);
  if (insightsCard) missionGrid.appendChild(insightsCard);
  const refinementCard = createProgressiveRefinementCard(result, result.missionContext);
  if (refinementCard) missionGrid.appendChild(refinementCard);

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
  if (result?.type === "experience" || result?.portableExperienceData) return true;
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

  const conversationCard = createNaturalConversationCard(result, result.missionContext);
  if (conversationCard) missionGrid.appendChild(conversationCard);

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
  const insightsCard = createMissionInsightsCard(result, result.missionContext);
  if (insightsCard) missionGrid.appendChild(insightsCard);
  const refinementCard = createProgressiveRefinementCard(result, result.missionContext);
  if (refinementCard) missionGrid.appendChild(refinementCard);
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
    options: result.missionContext.transport.map((option, index) => makeOptionRow(option, "", {
      index,
      label: option,
      selected: normalizeOptionLabel(option) === normalizeOptionLabel(one.transportation)
    })),
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
    : isTravelResult(currentResult)
    ? normalizedTravelGoal || (ko ? "여행" : "Trip")
    : currentResult?.title?.[activeLanguage] || currentResult?.title?.en || rawGoal || (ko ? "준비된 미션" : "Prepared mission");
  const prepared = experienceMission
    ? (ko ? ["맞춤 경험", "시간별 일정", "음식", "이동", "날씨 대안"] : es ? ["Experiencia", "Horario", "Comida", "Transporte", "Plan alternativo"] : ["Experience", "Timeline", "Food", "Transportation", "Weather backup"])
    : currentResult?.type === "travel"
    ? (ko ? ["항공편", "호텔", "교통", "날씨", "예산", "체크리스트"] : es ? ["Vuelos", "Hotel", "Transporte", "Clima", "Presupuesto", "Lista"] : ["Flights", "Hotel", "Transportation", "Weather", "Budget", "Checklist"])
    : currentResult?.resolutionPlan
    ? (domainPresentation(currentResult).prepared?.[activeLanguage] || domainPresentation(currentResult).prepared?.en || [])
    : [ko ? "추천 해결" : es ? "Solución" : "Solution", ko ? "대안" : es ? "Alternativas" : "Alternatives", ko ? "준비 상태" : es ? "Preparado" : "Prepared", ko ? "승인 보호" : es ? "Aprobación" : "Approval"];
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
  if (currentResult?.v22DomainLayout || currentResult?.v22TravelPackages) return;
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
  missionGrid.classList.remove("is-domain-layout", "is-travel-package-layout", "is-v23-travel-layout");
  delete missionGrid.dataset.domain;
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
  } else if (isTravelResult(currentResult)) {
    renderTravelMission(currentResult, currentResult.missionContext);
  } else if (currentResult.resolutionPlan) {
    renderResolutionPlanMission(currentResult);
  } else {
    renderGeneralMission(currentResult);
  }

  renderPathwayOpportunities();
  missionGrid.insertBefore(pathwayOpportunityPanel, missionGrid.firstChild);
  missionGrid.appendChild(additionalServicesForm);
  missionGrid.appendChild(createApprovalCard(currentResult));
  attachMissionDirectorBrief(currentResult);
  attachProviderTrustBrief(currentResult);
  attachMissionMonitoringLayer(currentResult);
  attachLifeTimelineLayer(currentResult);
  attachExplainableIntelligenceLayer(currentResult);
  renderMissionUnderstanding();
  organizeProgressiveResults();
};

const renderPathwayOpportunities = () => {
  if (!pathwayOpportunityPanel || !pathwayOpportunityList) return;
  const local = v22Local;
  const goal = currentResult?.title?.[activeLanguage] || currentResult?.title?.en || currentResult?.mission || currentResult?.goal || "";
  const memoryEnabled = missionMemoryEnabled();
  const previousExperiences = memoryEnabled ? readMissionMemories().flatMap((row) => row.preferences || row.favoriteLocations || []).map(String) : [];
  const experienceMission = isExperienceMission(currentResult, currentResult?.missionContext);
  if (!experienceMission && !isTravelResult(currentResult) && currentResult?.resolutionPlan) {
    const plan = currentResult.resolutionPlan;
    const presentation = domainPresentation(currentResult);
    pathwayOpportunityTitle.textContent = local("ONE Recommendation", "ONE 추천", "Recomendación de ONE");
    experienceReviewOpening.textContent = polishedDomainText(plan.desiredOutcome, localize(presentation.understood) || local("ONE prepared a domain-aware solution path.", "ONE이 분야에 맞는 해결 경로를 준비했어요.", "ONE preparó una solución adecuada."));
    experienceReviewLabel.textContent = local("Why this fits", "이 선택이 맞는 이유", "Por qué encaja");
    const insights = [
      polishedDomainText(plan.recommendedPath?.expectedOutcome, local("The recommendation matches this mission and stays approval-first.", "추천 경로는 이 미션에 맞고 승인 우선 원칙을 지킵니다.", "La recomendación encaja y mantiene aprobación primero.")),
      polishedDomainText(plan.nextBestAction, local("Review, adjust, then approve when ready.", "검토하고 수정한 뒤 준비되면 승인하세요.", "Revisa, ajusta y aprueba cuando quieras.")),
      local("No provider contact, booking, payment, submission, or signature happens before approval.", "승인 전에는 제공업체 연락, 예약, 결제, 제출, 서명이 진행되지 않습니다.", "No hay contacto, reserva, pago, envío ni firma sin aprobación.")
    ].filter(Boolean);
    experienceReviewInsights.replaceChildren(...insights.map((insight) => {
      const item = document.createElement("li");
      item.textContent = insight;
      return item;
    }));
    experienceReviewConfidence.textContent = local("Domain locked", "분야 고정", "Dominio fijado");
    revisionLead.textContent = local("Use Modify to add constraints before approval.", "승인 전에 수정에서 조건을 추가할 수 있어요.", "Usa Modificar para añadir condiciones antes de aprobar.");
    pathwayOpportunityList.replaceChildren(...(plan.solutionPaths || []).slice(0, 3).map((path) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pathway-opportunity-action";
      button.dataset.revisionCommand = polishedDomainText(path.title || "", local("Prepared path", "준비된 경로", "Ruta preparada"));
      button.setAttribute("role", "listitem");
      button.textContent = polishedDomainText(path.title || "", local("Prepared path", "준비된 경로", "Ruta preparada"));
      return button;
    }));
    pathwayOpportunityPanel.hidden = false;
    return;
  }
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
  missionGrid.querySelectorAll(".travel-package-option").forEach((option) => {
    option.addEventListener("click", () => {
      const group = option.closest(".travel-package-grid");
      group?.querySelectorAll(".travel-package-option").forEach((item) => {
        item.classList.toggle("is-selected", item === option);
        item.setAttribute("aria-pressed", item === option ? "true" : "false");
      });
    });
  });
  missionGrid.querySelectorAll(".v22-path-select").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".v22-path-card");
      const group = card?.closest(".v22-path-grid");
      group?.querySelectorAll(".v22-path-card").forEach((item) => {
        const selected = item === card;
        item.classList.toggle("is-selected", selected);
        item.querySelector(".v22-path-select")?.setAttribute("aria-pressed", selected ? "true" : "false");
        const check = item.querySelector(".v22-path-check");
        if (check) check.textContent = selected ? "✓" : "+";
      });
    });
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
  const selectedAlternatives = [...missionGrid.querySelectorAll('[data-card-id="generated-one-pick"] .option-list .selectable-option[aria-pressed="true"]')]
    .map((option) => option.dataset.optionLabel ? decodeURIComponent(option.dataset.optionLabel) : option.querySelector(".option-value strong")?.textContent)
    .filter(Boolean);
  const alternativeItems = portable?.alternatives || selectedAlternatives;
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

const isV231TravelPreparationFlow = () => currentResult?.type === "travel" && currentResult?.v23TravelExperience === true;

const v231Local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;

const getV231SelectedJourney = () => {
  if (currentResult?.v23SelectedJourney) return currentResult.v23SelectedJourney;
  if (currentResult?.type !== "travel") return null;
  const journeys = buildV23TravelJourneys(currentResult, currentResult?.missionContext);
  const selected = journeys.find((journey) => journey.selected) || journeys[0] || null;
  if (selected) currentResult.v23SelectedJourney = selected;
  return selected;
};

const getV231SourceStateLabel = (state) => {
  const normalized = ["verified_live", "cached_public", "estimated", "placeholder"].includes(state) ? state : "unavailable";
  const labels = {
    verified_live: v231Local("Verified live", "실시간 확인됨", "Verificado en vivo"),
    cached_public: v231Local("Recent public information", "최근 공개 정보 기준", "Información pública reciente"),
    estimated: v231Local("Estimated information", "예상 정보", "Información estimada"),
    placeholder: v231Local("Search criteria prepared", "검색 조건 준비됨", "Criterios preparados"),
    unavailable: v231Local("Not retrieved yet", "아직 조회되지 않음", "Aún no consultado")
  };
  return labels[normalized];
};

const getV231MissingTravelFields = () => {
  const schedule = currentResult?.schedule || {};
  const answers = currentResult?.followUp?.answers || {};
  const missing = [];
  if (!schedule.startDate) missing.push(v231Local("Outbound date", "출국 날짜", "Fecha de salida"));
  if (!schedule.endDate) missing.push(v231Local("Return date or trip length", "귀국 날짜 또는 여행 기간", "Fecha de regreso o duración"));
  if (!answers.adults && !currentResult?.travelerCount && !currentResult?.travelers) missing.push(v231Local("Number of travelers", "여행 인원", "Número de viajeros"));
  if (!answers.originAirport && !currentResult?.originAirport) missing.push(v231Local("Departure airport confirmation", "출발 공항 확인", "Aeropuerto de salida"));
  if (!answers.rooms && !currentResult?.rooms) missing.push(v231Local("Number of rooms", "객실 수", "Número de habitaciones"));
  if (!currentResult?.budget?.preference && !currentResult?.budget?.userBudget && !currentResult?.budget?.estimatedTotal) missing.push(v231Local("Preferred budget range", "선호 예산 범위", "Rango de presupuesto preferido"));
  return missing;
};

const setV231CompletionHeader = (titleText, bodyText) => {
  completionMessage.hidden = false;
  const title = completionMessage.querySelector("h3");
  const subtitle = completionMessage.querySelector("p");
  if (title) title.textContent = titleText;
  if (subtitle) subtitle.textContent = bodyText;
};

const renderV231PreparationContinuation = ({ state = "preparation_approved" } = {}) => {
  if (!executionSummary) return;
  const journey = getV231SelectedJourney();
  if (!journey) return;

  currentResult.approvalState = {
    level: state,
    selectedJourneyId: journey.id,
    selectedJourneyName: journey.name,
    destination: currentResult.destination,
    approvedScope: ["journey_direction", "provider_search_criteria_preparation", "comparison_preparation"],
    blockedActions: ["booking", "payment", "ticketing", "submission", "provider_contact", "completion"],
    providerSearchStatus: state === "live_search_requested" ? "adapter_unavailable" : "not_started",
    completionEvidence: null
  };
  sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));

  const source = journey.sourceStates || {};
  const tags = (journey.tags || []).slice(0, 5).join(" · ");
  const missing = getV231MissingTravelFields();
  const approvedScope = [
    v231Local("Keep the selected journey direction", "선택한 여행 방향 유지", "Mantener el viaje elegido"),
    v231Local("Prepare live flight search criteria", "실시간 항공편 검색 조건 준비", "Preparar criterios de vuelos en vivo"),
    v231Local("Prepare accommodation search criteria", "숙소 검색 조건 준비", "Preparar criterios de alojamiento"),
    v231Local("Organize transport, food, and activity criteria", "교통·식사·활동 조건 정리", "Organizar transporte, comida y actividades"),
    v231Local("Prepare a final comparison plan", "최종 비교안 준비", "Preparar comparación final")
  ];
  const actionRows = [
    { title: v231Local("Flights", "항공편", "Vuelos"), body: journey.details?.flight || "—", state: source.flight || "unavailable" },
    { title: v231Local("Accommodation", "숙소", "Alojamiento"), body: journey.details?.hotel || "—", state: source.hotel || "unavailable" },
    { title: v231Local("Local transportation", "현지 이동", "Transporte local"), body: journey.details?.transport || "—", state: source.transport || "placeholder" },
    { title: v231Local("Food and activities", "식사와 활동", "Comida y actividades"), body: journey.details?.food || "—", state: source.food || "placeholder" }
  ];
  const stillNeeded = missing.length
    ? missing
    : [v231Local("Nothing essential is missing for the next preparation step.", "다음 준비 단계에 꼭 필요한 정보는 이미 있습니다.", "No falta información esencial para el siguiente paso.")];
  const providerNotice = state === "live_search_requested"
    ? v231Local(
        "Live provider search was approved, but no live provider adapter is connected in this prototype yet.",
        "실시간 제공업체 조회는 승인되었지만, 이 프로토타입에는 아직 연결된 실시간 제공업체 어댑터가 없습니다.",
        "La búsqueda en vivo fue aprobada, pero este prototipo aún no tiene un adaptador de proveedor en vivo conectado."
      )
    : v231Local(
        "Provider search has not started yet. ONE only prepared the next step.",
        "제공업체 조회는 아직 시작되지 않았습니다. ONE은 다음 단계만 준비했습니다.",
        "La búsqueda de proveedores aún no comenzó. ONE solo preparó el siguiente paso."
      );

  setV231CompletionHeader(
    v231Local("Next step prepared", "다음 단계를 준비했습니다", "Siguiente paso preparado"),
    v231Local(
      `ONE organized the criteria needed to continue with “${journey.name}”.`,
      `선택한 ‘${journey.name}’ 여행을 기준으로 다음 확인에 필요한 조건을 정리했습니다.`,
      `ONE organizó los criterios para continuar con “${journey.name}”.`
    )
  );

  executionSummary.innerHTML = `
    <section class="v231-continuation" data-stage="${escapeSummaryText(state)}">
      <div class="v231-stage-strip">${escapeSummaryText(v231Local("No booking, payment, ticketing, submission, or provider contact has occurred.", "아직 예약, 결제, 발권, 제출, 제공업체 연락은 진행되지 않았습니다.", "Todavía no hay reserva, pago, emisión, envío ni contacto con proveedores."))}</div>
      <article class="v231-selected-journey">
        <span class="v23-eyebrow">${escapeSummaryText(v231Local("Selected journey", "선택한 여행", "Viaje elegido"))}</span>
        <h4>${escapeSummaryText(journey.name)}</h4>
        <p>${escapeSummaryText(journey.purpose)}</p>
        <div class="v23-overview-meta">
          <span>${escapeSummaryText(journey.duration)}</span>
          <span>${escapeSummaryText(journey.comfort)}</span>
          <span>${escapeSummaryText(journey.budget)}</span>
          <span>${escapeSummaryText(tags)}</span>
        </div>
        <p class="v231-reason">${escapeSummaryText(journey.reason)}</p>
      </article>
      <article class="v231-card">
        <h4>${escapeSummaryText(v231Local("Scope approved", "승인한 범위", "Alcance aprobado"))}</h4>
        <ul>${approvedScope.map((item) => `<li>✓ ${escapeSummaryText(item)}</li>`).join("")}</ul>
      </article>
      <article class="v231-card">
        <h4>${escapeSummaryText(v231Local("What ONE will check next", "ONE이 다음에 확인할 내용", "Lo que ONE comprobará después"))}</h4>
        <div class="v231-action-grid">
          ${actionRows.map((item) => `
            <section>
              <strong>${escapeSummaryText(item.title)}</strong>
              <p>${escapeSummaryText(item.body)}</p>
              <small>${escapeSummaryText(v231Local("Current state", "현재 상태", "Estado actual"))}: ${escapeSummaryText(getV231SourceStateLabel(item.state))}</small>
            </section>
          `).join("")}
        </div>
        <p class="v231-provider-notice">${escapeSummaryText(providerNotice)}</p>
      </article>
      <article class="v231-card">
        <h4>${escapeSummaryText(v231Local("Information still needed", "아직 필요한 정보", "Información pendiente"))}</h4>
        <ul>${stillNeeded.map((item) => `<li>${escapeSummaryText(item)}</li>`).join("")}</ul>
      </article>
      <article class="v231-next-action">
        <strong>${escapeSummaryText(v231Local("One safe next action", "안전한 다음 작업 하나", "Una acción segura siguiente"))}</strong>
        <button type="button" class="v231-primary" data-v231-live-search>${escapeSummaryText(v231Local("Approve live search only", "실시간 조회만 승인하기", "Aprobar solo búsqueda en vivo"))}</button>
        <p>${escapeSummaryText(v231Local(
          "This allows search and comparison only. Before any booking or payment, ONE must show exact options, price, provider, terms, and ask for separate approval.",
          "이 승인은 검색과 비교까지만 허용합니다. 예약이나 결제 전에는 ONE이 정확한 옵션, 금액, 제공업체, 조건을 다시 보여드리고 별도 승인을 요청해야 합니다.",
          "Esto permite solo búsqueda y comparación. Antes de reservar o pagar, ONE debe mostrar opciones, precio, proveedor y condiciones exactas, y pedir otra aprobación."
        ))}</p>
      </article>
    </section>
  `;
};

const renderV231BlockedCompletionState = () => {
  if (!executionSummary) return;
  setV231CompletionHeader(
    v231Local("Completion requires evidence", "완료에는 확인 증거가 필요합니다", "La finalización requiere evidencia"),
    v231Local(
      "ONE did not open a completed booking screen because no verified provider result exists.",
      "확인된 제공업체 결과가 없기 때문에 완료된 예약 화면을 열지 않았습니다.",
      "ONE no abrió una pantalla de reserva completada porque no existe un resultado verificado del proveedor."
    )
  );
  executionSummary.innerHTML = `
    <section class="v231-continuation v231-blocked" data-stage="completion-blocked">
      <div class="v231-stage-strip">${escapeSummaryText(v231Local("No booking, payment, ticketing, submission, or provider contact has occurred.", "아직 예약, 결제, 발권, 제출, 제공업체 연락은 진행되지 않았습니다.", "Todavía no hay reserva, pago, emisión, envío ni contacto con proveedores."))}</div>
      <article class="v231-card">
        <h4>${escapeSummaryText(v231Local("Why this was blocked", "차단된 이유", "Por qué se bloqueó"))}</h4>
        <p>${escapeSummaryText(v231Local(
          "A prototype reference or direct completion link cannot prove that a real provider completed anything.",
          "프로토타입 참조 번호나 직접 완료 링크는 실제 제공업체가 무언가를 완료했다는 증거가 될 수 없습니다.",
          "Una referencia de prototipo o un enlace directo no demuestra que un proveedor haya completado algo."
        ))}</p>
      </article>
    </section>
  `;
};

const applyV231ManualApprovalScenario = () => {
  const scenario = currentResult?.v23ApprovalScenario;
  if (!scenario || !isV231TravelPreparationFlow()) return;
  const state = MANUAL_V231_APPROVAL_SCENARIOS[scenario];
  if (!state) return;
  document.body.classList.add("v231-manual-preview-view");
  bottomActions.hidden = true;
  approvalPanel.hidden = false;
  approvalList.hidden = true;
  if (state === "completion_blocked") {
    renderV231BlockedCompletionState();
    return;
  }
  if (state === "completed_verified_fixture") {
    renderV231PreparationContinuation({ state: "provider_processing" });
    const notice = executionSummary.querySelector(".v231-stage-strip");
    if (notice) notice.textContent = v231Local(
      "Verified completion requires a real provider receipt. This preview stops before fake completion.",
      "검증된 완료에는 실제 제공업체 영수증이 필요합니다. 이 미리보기는 가짜 완료 화면으로 가지 않습니다.",
      "La finalización verificada requiere un recibo real del proveedor. Esta vista previa no muestra una finalización falsa."
    );
    return;
  }
  renderV231PreparationContinuation({ state });
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
  if (isV231TravelPreparationFlow()) {
    trackEvent("preparation_approval_started", { mission_type: currentResult?.type, language: activeLanguage, page: "results", status: "preparation_only" });
    const items = [...approvalList.querySelectorAll(".approval-item")];

    makeRealityButton.disabled = true;
    bottomActions.hidden = true;
    approvalPanel.hidden = false;
    approvalPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    items.forEach((item) => {
      item.classList.add("is-complete");
      item.querySelector(".approval-check").textContent = "✓";
    });

    window.setTimeout(() => {
      renderV231PreparationContinuation();
      trackEvent("approval_confirmed", { mission_type: currentResult?.type, language: activeLanguage, page: "results", approval_scope: "preparation_only" });
      trackEvent("preparation_approved", { mission_type: currentResult?.type, language: activeLanguage, page: "results", provider_search_status: "not_started" });
      window.requestAnimationFrame(() => {
        const headerHeight = document.querySelector(".results-header")?.getBoundingClientRect().height || 76;
        const targetTop = window.scrollY + completionMessage.getBoundingClientRect().top - headerHeight - 28;
        window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      });
    }, 320);
    return;
  }

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
        const recommendedDetail = card.querySelector('.option-list .selectable-option[aria-pressed="true"]:not(.is-excluded)') || card.querySelector(".option-list .selectable-option");
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
  const alpha02Answer = event.target.closest?.(".alpha02-answer-chip");
  if (alpha02Answer) {
    const question = alpha02Answer.closest("[data-question-id]");
    const questionId = question?.dataset?.questionId;
    if (questionId) {
      currentResult = applyRefinementAnswer(currentResult, { questionId, value: alpha02Answer.dataset.answerValue }, { language: activeLanguage });
      writeRefinementState(currentResult, currentResult.alpha02Refinements);
      trackEvent("mission_refinement_answered", { mission_type: currentResult?.type, language: activeLanguage, page: "results", question_id: questionId });
      renderMission();
      return;
    }
  }
  const alpha02Action = event.target.closest?.("[data-refinement-action]");
  if (alpha02Action) {
    const question = alpha02Action.closest("[data-question-id]");
    const questionId = question?.dataset?.questionId;
    if (questionId) {
      const status = alpha02Action.dataset.refinementAction === "hide" ? "hidden" : alpha02Action.dataset.refinementAction === "later" ? "later" : "skipped";
      const nextState = archiveRefinementQuestion(readRefinementState(currentResult), questionId, status);
      writeRefinementState(currentResult, nextState);
      question.classList.add("is-archived");
      question.setAttribute("aria-hidden", "true");
      trackEvent("mission_refinement_archived", { mission_type: currentResult?.type, language: activeLanguage, page: "results", question_id: questionId, status });
      return;
    }
  }

  const v231LiveSearch = event.target.closest("[data-v231-live-search]");
  if (v231LiveSearch) {
    event.preventDefault();
    v231LiveSearch.disabled = true;
    renderV231PreparationContinuation({ state: "live_search_requested" });
    trackEvent("live_provider_search_requested", { mission_type: currentResult?.type, language: activeLanguage, page: "results", status: "adapter_unavailable" });
    return;
  }

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

let alpha04ScrollSaveQueued = false;
window.addEventListener("scroll", () => {
  if (!currentResult?.alpha04Workspace || alpha04ScrollSaveQueued) return;
  alpha04ScrollSaveQueued = true;
  window.requestAnimationFrame(() => {
    alpha04ScrollSaveQueued = false;
    writeAlpha04UiState(currentResult, { scrollY: window.scrollY });
  });
}, { passive: true });

returnHomeButton.addEventListener("click", returnHome);
makeRealityButton.addEventListener("click", () => {
  trackEvent("make_it_reality_clicked", { mission_type: currentResult?.type, language: activeLanguage, page: "results", schedule_used: Boolean(currentResult?.schedule?.startDate && currentResult?.schedule?.endDate) });
  const schedule = currentResult?.schedule || {};
  const flight = currentResult?.flights?.find?.((item) => item.recommended) || currentResult?.flights?.[0];
  const hotel = currentResult?.hotels?.find?.((item) => item.recommended) || currentResult?.hotels?.[0];
  const experienceMission = isExperienceMission(currentResult, currentResult?.missionContext);
  const experience = currentExperienceReview?.generatedExperience?.onePick;
  const local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
  const journey = isV231TravelPreparationFlow() ? getV231SelectedJourney() : null;
  const reviewItems = journey
    ? [
        { label: local("Mission", "미션", "Misión"), value: approvalMissionName() },
        { label: local("Selected journey", "선택한 여행", "Viaje elegido"), value: journey.name },
        { label: local("Journey style", "여행 스타일", "Estilo de viaje"), value: `${journey.duration} · ${journey.comfort} · ${journey.budget}` },
        { label: local("Approved scope", "승인 범위", "Alcance aprobado"), value: local("Prepare search and comparison only", "검색과 비교 준비까지만 승인", "Solo preparar búsqueda y comparación") },
        { label: local("Not approved", "승인되지 않은 것", "No aprobado"), value: local("No booking, payment, ticketing, submission, or provider contact", "예약, 결제, 발권, 제출, 제공업체 연락 없음", "Sin reserva, pago, emisión, envío ni contacto con proveedores") }
      ]
    : experienceMission && experience
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
applyV231ManualApprovalScenario();
const requestedReference = new URLSearchParams(location.search).get("reference")?.toUpperCase();
if (/^ONE-DEMO-[A-Z0-9]{8}$/.test(requestedReference || "")) {
  document.body.classList.add("completion-blocked-view");
  renderV231BlockedCompletionState();
  bottomActions.hidden = true;
  approvalPanel.hidden = false;
  approvalList.hidden = true;
  document.title = activeLanguage === "ko" ? "Kastiz ONE — 완료 확인 필요" : activeLanguage === "es" ? "Kastiz ONE — Finalización pendiente" : "Kastiz ONE — Completion Requires Evidence";
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
} else if (currentResult?.portableShare === true) {
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
