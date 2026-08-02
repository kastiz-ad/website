import { trackEvent } from "../analytics.js";
import { openApprovalInformationReview } from "../ui/approval-information-review.js";
import { OFFICIAL_LOCALES, localeSection } from "../i18n/locale-registry.js";
import { applyMissionEdit } from "../engine/orchestration/mission-orchestration-engine.js?v=20260730-mission-orchestration";
import { createAIDecisionLayer, decisionMemoryKey, recordDecisionFeedback } from "../engine/decision/ai-decision-engine.js?v=20260730-ai-decision-engine";
import { createProviderOrchestrationFromMissionData } from "../engine/providers/live/provider-orchestration.js?v=20260730-universal-execution";
import { buildContextualExperienceIntelligence as buildExperienceIntelligence } from "../engine/context/context-experience-intelligence.js?v=20260722-context-v2";
import { buildMissionContext, isDomesticContext } from "../engine/context/mission-context-intelligence.js?v=20260722-context-v2";
import { missionMemoryEnabled, readMissionMemories } from "../profile/mission-memory.js";
import { createHOSKernel } from "../engine/kernel/hos-kernel-v16.js?v=20260726-v21-1";
import { buildTravelWorldIntelligence, sourceStateUserLabel } from "../engine/world-intelligence/world-intelligence-foundation-v24.js?v=20260727-v24";
import { buildPreviewMapMarkers, mapTileUrlForProfile, previewItemAdvice, profileForResult } from "../engine/world/preview-destination-intelligence.js?v=20260803-preview-qa";
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
import {
  AI_TRAVEL_CONCIERGE_VERSION,
  applyConciergeRecommendation,
  conciergeStorageKey,
  createAITravelConcierge,
  createConciergeState
} from "../engine/concierge/ai-travel-concierge.js?v=20260730-ai-travel-concierge";
import {
  isInvestorDemoMode,
  mountInvestorDemoResults
} from "../engine/demo/investor-demo-mode.js?v=20260730-investor-demo-mode";

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
const missionLifecyclePanel = document.getElementById("missionLifecyclePanel");
const missionLifecycleTitle = document.getElementById("missionLifecycleTitle");
const missionLifecycleEyebrow = document.getElementById("missionLifecycleEyebrow");
const missionLifecycleLive = document.getElementById("missionLifecycleLive");
const missionLifecycleSteps = document.getElementById("missionLifecycleSteps");

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
    makeItReality: "Start Live Search",
    withOne: "with NE",
    withOnePrefix: "with",
    withOneSuffix: "",
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
    recommended: "â­ ONE Pick",
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
    upgrade: "ì—…ê·¸ë ˆì´ë“œ",
    login: "ë¡œê·¸ì¸",
    missionReady: "ë¯¸ì…˜ ì¤€ë¹„ ì™„ë£Œ",
    preparedByOne: "ONE 이 준비했습니다.",
    customize: "ìˆ˜ì •í•˜ê¸°",
    makeItReality: "ì‹¤ì‹œê°„ ê²€ìƒ‰ ì‹œìž‘",
    withOne: "NEê³¼ í•¨ê»˜",
    withOnePrefix: "",
    withOneSuffix: "ê³¼ í•¨ê»˜",
    additionalServices: "ì„œë¹„ìŠ¤ ë§žì¶¤ ì„¤ì •",
    optional: "ì„ íƒ ì‚¬í•­",
    additionalServicesHelp: "ìƒˆ ëª©ì ì§€, í•­ê³µíŽ¸, íŠœí„° ê³¼ëª©, ì–¸ì–´ ë˜ëŠ” ì›í•˜ëŠ” ì„œë¹„ìŠ¤ë¥¼ ì¶”ê°€í•˜ê±°ë‚˜ ìš”ì²­í•˜ì„¸ìš”.",
    additionalServicesPlaceholder: "ì˜ˆ: LAXí–‰ í•­ê³µíŽ¸ ì¶”ê°€",
    addService: "ì¶”ê°€",
    missionApproved: "ë¯¸ì…˜ ìŠ¹ì¸ ì™„ë£Œ",
    oneIsWorking: "ONEì´ ì‹¤í–‰í•˜ê³  ìžˆìŠµë‹ˆë‹¤.",
    finalMessage: "ONE'D",
    returnHomeNow: "HOME",
    returningHome: "{seconds}ì´ˆ í›„ í™ˆìœ¼ë¡œ ëŒì•„ê°‘ë‹ˆë‹¤...",
    partners: "íŒŒíŠ¸ë„ˆ",
    business: "ë¹„ì¦ˆë‹ˆìŠ¤",
    developers: "ê°œë°œìž",
    poweredBy: "Kastiz ì œê³µ",
    privacy: "ê°œì¸ì •ë³´",
    terms: "ì•½ê´€",
    settings: "ì„¤ì •",
    unknownLocation: "ì•Œ ìˆ˜ ì—†ëŠ” ìœ„ì¹˜",
    recommended: "â­ ONE Pick",
    reason: "ì„ ì • ì´ìœ :",
    otherOptions: "ë‹¤ë¥¸ ì˜µì…˜:",
    modify: "ìˆ˜ì •",
    editing: "ìˆ˜ì • ì¤‘",
    remove: "ì œê±°",
    restore: "ë³µêµ¬",
    changeAirline: "í•­ê³µì‚¬ ë³€ê²½",
    changeHotelType: "í˜¸í…” ìœ í˜• ë³€ê²½",
    removeRestaurants: "ë ˆìŠ¤í† ëž‘ ì œì™¸",
    reduceBudget: "ì˜ˆì‚° ì¤„ì´ê¸°",
    upgradeQuality: "í’ˆì§ˆ ì—…ê·¸ë ˆì´ë“œ",
    verifyVisa: "ì‹¤í–‰ ì „ í™•ì¸",
    budgetFlights: "í•­ê³µê¶Œ",
    budgetHotel: "í˜¸í…”",
    budgetFood: "ì‹ë¹„",
    budgetTransport: "êµí†µ",
    budgetActivities: "í™œë™",
    estimatedTotal: "ì˜ˆìƒ ì´ì•¡",
    weather: "ë‚ ì”¨",
    exchangeRate: "í™˜ìœ¨",
    visa: "ë¹„ìž",
    apiPlaceholder: "í”„ë¡œí† íƒ€ìž… ì˜ˆìƒ ì •ë³´",
    prototypeDisclosure: "í”„ë¡œí† íƒ€ìž… · ê³µê°œ ì‹¤ì‹œê°„ ë°ì´í„° + ì—¬í–‰ ì˜ˆìƒ ì •ë³´",
    flightEstimateNotice: "ì˜ˆìƒ ê°€ê²© ë²”ìœ„ · ì‹¤ì‹œê°„ ìš´ìž„ ì•„ë‹˜",
    verifyLiveFares: "í˜„ìž¬ ìš´ìž„ í™•ì¸",
    approvalProtectionTitle: "ìŠ¹ì¸ ë³´í˜¸",
    approvalProtection:
      "ì‚¬ìš©ìžê°€ ëª…í™•ížˆ ìŠ¹ì¸í•˜ê¸° ì „ê¹Œì§€ ì˜ˆì•½, êµ¬ë§¤, ê²°ì œ, ì„œëª…, ë²•ì  ì•½ì†ì€ ì ˆëŒ€ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.",
    executionSteps: [
      "í•­ê³µê¶Œ ì˜ˆì•½ ì¤€ë¹„ ì¤‘...",
      "í˜¸í…” ì˜ˆì•½ ì¤€ë¹„ ì¤‘...",
      "ì—¬í–‰ ì²´í¬ë¦¬ìŠ¤íŠ¸ ì¤€ë¹„ ì¤‘...",
      "ë ˆìŠ¤í† ëž‘ ì˜µì…˜ ì¤€ë¹„ ì¤‘...",
      "ê³µí•­ ì´ë™ ì¤€ë¹„ ì¤‘...",
      "ë¯¸ì…˜ì„ ìµœì¢… ì¤€ë¹„ ì¤‘..."
    ],
    fallbackMission: "ì¼ë³¸ ì—¬í–‰ ê³„íší•´ì¤˜",
    fallbackTitle: "ì¼ë³¸ ì—¬í–‰"
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
  return localeSection(activeLanguage, "results")[key] || translations[activeLanguage]?.[key] || translations.en[key] || "";
};

const localize = (value) => {
  if (typeof value === "string") return value;
  return value?.[activeLanguage] || value?.en || "";
};

const formatKRW = (value) => {
  if (typeof value !== "number") return value;

  return activeLanguage === "ko"
    ? `${Math.round(value / 10000).toLocaleString("ko-KR")}ë§Œ ì›`
    : activeLanguage === "es" ? `${value.toLocaleString("es-ES")} KRW` : `â‚©${value.toLocaleString("en-US")}`;
};

const formatRange = (range) => {
  if (!range) return "";

  if (typeof range.min === "number" && typeof range.max === "number") {
    return `${formatKRW(range.min)} â€“ ${formatKRW(range.max)}`;
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
      const missionLabel = parsed.l === "ko" ? "ì €ìž¥ëœ ë§žì¶¤ ê²½í—˜" : parsed.l === "es" ? "Experiencia personalizada guardada" : "Saved personalized experience";
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
      ? ["ì—¬ê¶Œ", "ì—¬í–‰ìž ë³´í—˜", "SIM / eSIM", "í™˜ì „", "êµí†µì¹´ë“œ", "í˜¸í…” ì˜ˆì•½ í™•ì¸ì„œ", "ë¹„ìƒ ì—°ë½ì²˜"]
      : ["Passport", "Travel insurance", "SIM / eSIM", "Currency", "Transit card", "Hotel confirmation", "Emergency contacts"];
    const providerResults = [];
    if (parsed.w?.length) providerResults.push({ category: "weather", provider: "Open-Meteo", liveData: true, items: parsed.w.map(([label, value, humidity, precipitation]) => ({ label, value, humidity, precipitation })) });
    if (parsed.e?.length) providerResults.push({ category: "currency", provider: "ExchangeRate API", liveData: true, items: parsed.e.map(([to, rate]) => ({ to, rate, value: rate })) });
    return {
      portableShare: true, type: "travel", id: parsed.r, language: parsed.l || "en", country,
      destination: { country, countryKo: countryKo || country, city, cityKo: cityKo || city },
      display: {
        title: parsed.l === "ko" ? `${countryKo || country} ì—¬í–‰` : `${country || city} Trip`,
        destination: parsed.l === "ko" ? (countryKo || country) : country,
        city: parsed.l === "ko" ? (cityKo || city) : city
      },
      schedule: { startDate, endDate, timePreference }, tripType: parsed.t || "round_trip",
      flights: flightName ? [{ provider: flightName, providerKo: flightNameKo || flightName, estimatedPrice: { currency: "KRW", min: flightMin, max: flightMax }, recommended: true }] : [],
      hotels: hotelName ? [{ name: hotelName, nameKo: hotelNameKo || hotelName, estimatedNightlyPrice: { currency: "KRW", min: hotelMin, max: hotelMax }, recommended: true }] : [],
      airportTransfer: { recommended: parsed.x || "", options: parsed.x ? [parsed.x] : [] },
      restaurants: (parsed.n || []).map((name) => ({ type: name, typeKo: name, venueName: name, venueNameKo: name })),
      checklist: (parsed.k?.length ? parsed.k : portableChecklist).map((text) => ({ en: text, ko: text })), providerResults,
      weather: { status: parsed.w?.length ? "live" : "prototype", message: { en: "Weather data saved with this summary", ko: "ì´ ìš”ì•½ì— ì €ìž¥ëœ ë‚ ì”¨ ì •ë³´" } },
      exchangeRate: { from: "KRW", to: parsed.c || "USD", status: parsed.e?.length ? "live" : "prototype", message: { en: "Currency data saved with this summary", ko: "ì´ ìš”ì•½ì— ì €ìž¥ëœ í™˜ìœ¨ ì •ë³´" } },
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
  "child-english": "ì•„ì´ê°€ ì˜ì–´ê°€ ë¶€ì¡±í•œë° ì–´ë–»ê²Œ í• ê¹Œ?",
  "academy-english": "ì¸ì²œ ì„œêµ¬ì—ì„œ ì¤‘í•™ìƒ ì˜ì–´ ë‚´ì‹  í•™ì› ì°¾ì•„ì¤˜",
  "japan-travel": "ì¼ë³¸ ì—¬í–‰",
  "tooth-pain": "ì´ê°€ ì•„í”ˆë° ì˜¤ëŠ˜ ê°ˆ ìˆ˜ ìžˆëŠ” ì¹˜ê³¼ ì°¾ì•„ì¤˜",
  "sink-leak": "ì‹±í¬ëŒ€ ëˆ„ìˆ˜ ìˆ˜ë¦¬ì—…ì²´ ì°¾ì•„ì¤˜",
  "unknown-help": "ë„ì™€ì¤˜"
});

const V22_VERSION = "20260726-v22-product-refinement";

const MANUAL_V22_SCENARIOS = Object.freeze({
  travel: "ì¼ë³¸ ì—¬í–‰",
  education: "ì¸ì²œ ì„œêµ¬ì—ì„œ ì¤‘í•™ìƒ ì˜ì–´ ë‚´ì‹  í•™ì› ì°¾ì•„ì¤˜",
  healthcare: "ì´ê°€ ì•„í”ˆë° ì˜¤ëŠ˜ ê°ˆ ìˆ˜ ìžˆëŠ” ì¹˜ê³¼ ì°¾ì•„ì¤˜",
  business: "í•œêµ­ì—ì„œ ì™¸êµ­ì¸ì´ íšŒì‚¬ë¥¼ ì‹œìž‘í•˜ë ¤ë©´ ì¤€ë¹„í•´ ì¤˜",
  "home-services": "ì‹±í¬ëŒ€ ëˆ„ìˆ˜ ìˆ˜ë¦¬ì—…ì²´ ì°¾ì•„ì¤˜",
  home: "ì‹±í¬ëŒ€ ëˆ„ìˆ˜ ìˆ˜ë¦¬ì—…ì²´ ì°¾ì•„ì¤˜",
  career: "í•œêµ­ì—ì„œ ì¼ìžë¦¬ë¥¼ ì°¾ê³  ì‹¶ì–´"
});

const MANUAL_V23_TRAVEL_SCENARIOS = Object.freeze({
  "sapporo-general": "ì‚¿í¬ë¡œ ì—¬í–‰",
  "sapporo-food": "ì‚¿í¬ë¡œ ë§›ì§‘ ì—¬í–‰",
  "sapporo-family": "ê°€ì¡±ê³¼ ì‚¿í¬ë¡œ ì—¬í–‰",
  "sapporo-budget": "ì‚¿í¬ë¡œ ì‹¤ì† ì—¬í–‰",
  "missing-live-data": "ì‚¿í¬ë¡œ ì—¬í–‰",
  "mixed-source-states": "ì‚¿í¬ë¡œ ì—¬í–‰",
  "mobile": "ì‚¿í¬ë¡œ ì—¬í–‰",
  "long-provider-names": "ì‚¿í¬ë¡œ ì—¬í–‰",
  "no-visa-required": "ì‚¿í¬ë¡œ ì—¬í–‰",
  "visa-unresolved": "ì‚¿í¬ë¡œ ì—¬í–‰"
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
    currentLocation: language === "ko" ? "ì„œìš¸" : "Seoul"
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
      countryKo: "ì¼ë³¸",
      countryCode: "JP",
      city: "Sapporo",
      cityKo: "ì‚¿í¬ë¡œ",
      continent: "Asia"
    };
    result.country = "JP";
    result.countryProfile = { ...(result.countryProfile || {}), code: "JP", name: "Japan", nameKo: "ì¼ë³¸", capital: "Tokyo", currency: "JPY", continent: "Asia" };
  }
  return result;
}

const createNeutralMissionResult = () => createResolutionResultFromPrompt(
  activeLanguage === "ko" ? "ë„ì™€ì¤˜" : activeLanguage === "es" ? "AyÃºdame" : "Help me",
  activeLanguage
);

const countryNamesKoByRegion = {
  KR: "ëŒ€í•œë¯¼êµ­", US: "ë¯¸êµ­", ES: "ìŠ¤íŽ˜ì¸", FR: "í”„ëž‘ìŠ¤", JP: "ì¼ë³¸",
  BR: "ë¸Œë¼ì§ˆ", DE: "ë…ì¼", CN: "ì¤‘êµ­", IT: "ì´íƒˆë¦¬ì•„", PT: "í¬ë¥´íˆ¬ê°ˆ",
  CA: "ìºë‚˜ë‹¤", GB: "ì˜êµ­", AU: "í˜¸ì£¼", NZ: "ë‰´ì§ˆëžœë“œ", MX: "ë©•ì‹œì½”",
  SG: "ì‹±ê°€í¬ë¥´", TH: "íƒœêµ­", VN: "ë² íŠ¸ë‚¨", PH: "í•„ë¦¬í•€", ID: "ì¸ë„ë„¤ì‹œì•„", IN: "ì¸ë„"
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
    ko: `${provider.provider} ì‹¤ì‹œê°„ ë‚ ì”¨: ${summary}`
  };
};

const makeLiveCurrencyMessage = (provider) => {
  const item = provider?.items?.[0];
  const summary = item ? `${item.label}: ${item.value}` : "Rate unavailable";
  return {
    en: `Live exchange rate from ${provider.provider}: ${summary}`,
    ko: `${provider.provider} ì‹¤ì‹œê°„ í™˜ìœ¨: ${summary}`
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
      destination: activeLanguage === "ko" ? "ì¼ë³¸" : "Japan",
      city: activeLanguage === "ko" ? "ë„ì¿„" : "Tokyo",
      approvalProtection: t("approvalProtection")
    },
    destination: {
      country: "Japan",
      countryKo: "ì¼ë³¸",
      city: "Tokyo",
      cityKo: "ë„ì¿„"
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
        providerKo: "ëŒ€í•œí•­ê³µ",
        category: "recommended",
        reason: "Best balance of comfort, direct routes, and service quality.",
        reasonKo: "íŽ¸ì•ˆí•¨, ì§í•­ ë…¸ì„ , ì„œë¹„ìŠ¤ í’ˆì§ˆì˜ ê· í˜•ì´ ê°€ìž¥ ì¢‹ìŠµë‹ˆë‹¤.",
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
        providerKo: "ì•„ì‹œì•„ë‚˜í•­ê³µ",
        category: "quality",
        reason: "Strong service quality and convenient Korea to Japan schedules.",
        reasonKo: "ì„œë¹„ìŠ¤ í’ˆì§ˆì´ ì¢‹ê³  í•œêµ­-ì¼ë³¸ ë…¸ì„  ì¼ì •ì´ íŽ¸ë¦¬í•©ë‹ˆë‹¤.",
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
        providerKo: "ì œì£¼í•­ê³µ",
        category: "budget",
        reason: "Lower-cost option for flexible travelers.",
        reasonKo: "ì¼ì •ì´ ìœ ì—°í•œ ì—¬í–‰ìžì—ê²Œ ì í•©í•œ ì €ê°€ ì˜µì…˜ìž…ë‹ˆë‹¤.",
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
        providerKo: "ì¼ë³¸í•­ê³µ",
        category: "premium",
        reason: "Premium Japan-based carrier with excellent reliability.",
        reasonKo: "ì•ˆì •ì„±ì´ ë›°ì–´ë‚œ ì¼ë³¸ ê¸°ë°˜ í”„ë¦¬ë¯¸ì—„ í•­ê³µì‚¬ìž…ë‹ˆë‹¤.",
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
        providerKo: "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ",
        category: "alternative",
        reason: "Useful alternative depending on route availability.",
        reasonKo: "ë…¸ì„  ê°€ëŠ¥ ì—¬ë¶€ì— ë”°ë¼ ì„ íƒí•  ìˆ˜ ìžˆëŠ” ëŒ€ì•ˆìž…ë‹ˆë‹¤.",
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
        nameKo: "í˜¸í…” ë©”íŠ¸ë¡œí´ë¦¬íƒ„ ë„ì¿„ ë§ˆë£¨ë…¸ìš°ì¹˜",
        category: "recommended",
        reason: "Central location, strong reviews, easy access to transport.",
        reasonKo: "ì¤‘ì‹¬ ìœ„ì¹˜, ì¢‹ì€ ë¦¬ë·°, íŽ¸ë¦¬í•œ êµí†µ ì ‘ê·¼ì„±ì„ ê°–ì·„ìŠµë‹ˆë‹¤.",
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
        nameKo: "ížíŠ¼ ë„ì¿„",
        category: "premium",
        reason: "Premium comfort and reliable international service.",
        reasonKo: "í”„ë¦¬ë¯¸ì—„ ìˆ™ë°• ê²½í—˜ê³¼ ì•ˆì •ì ì¸ ê¸€ë¡œë²Œ ì„œë¹„ìŠ¤ë¥¼ ì œê³µí•©ë‹ˆë‹¤.",
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
        nameKo: "ë„í ìŠ¤í…Œì´ ì‹ ì£¼ì¿ ",
        category: "value",
        reason: "Practical location and strong value for longer stays.",
        reasonKo: "ì‹¤ìš©ì ì¸ ìœ„ì¹˜ì™€ ìž¥ê¸° ìˆ™ë°•ì— ì¢‹ì€ ê°€ì„±ë¹„ë¥¼ ì œê³µí•©ë‹ˆë‹¤.",
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
        nameKo: "APA í˜¸í…”",
        category: "budget",
        reason: "Budget-friendly and widely available across Tokyo.",
        reasonKo: "ë„ì¿„ ì „ì—­ì—ì„œ ì°¾ê¸° ì‰½ê³  ì˜ˆì‚°ì„ ì•„ë¼ê¸° ì¢‹ì€ ì˜µì…˜ìž…ë‹ˆë‹¤.",
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
        ko: "ë‚˜ë¦¬íƒ€ ìµìŠ¤í”„ë ˆìŠ¤ ë˜ëŠ” ê³µí•­ ë¦¬ë¬´ì§„ ë²„ìŠ¤"
      },
      reason: {
        en: "Best balance of reliability, luggage convenience, and access to central Tokyo.",
        ko: "ì •ì‹œì„±, ìˆ˜í•˜ë¬¼ íŽ¸ì˜ì„±, ë„ì¿„ ì¤‘ì‹¬ ì ‘ê·¼ì„±ì˜ ê· í˜•ì´ ì¢‹ìŠµë‹ˆë‹¤."
      },
      options: [
        {
          en: "Narita Express",
          ko: "ë‚˜ë¦¬íƒ€ ìµìŠ¤í”„ë ˆìŠ¤"
        },
        {
          en: "Airport Limousine Bus",
          ko: "ê³µí•­ ë¦¬ë¬´ì§„ ë²„ìŠ¤"
        },
        {
          en: "Private airport transfer",
          ko: "í”„ë¼ì´ë¹— ê³µí•­ í”½ì—…"
        }
      ],
      editable: true
    },
    weather: {
      status: "placeholder",
      message: {
        en: "Weather will be checked with a live weather API before execution.",
        ko: "ì‹¤í–‰ ì „ ì‹¤ì‹œê°„ ë‚ ì”¨ APIë¡œ ë‚ ì”¨ë¥¼ í™•ì¸í•©ë‹ˆë‹¤."
      }
    },
    exchangeRate: {
      status: "placeholder",
      from: "KRW",
      to: "JPY",
      message: {
        en: "Exchange rate will be checked with a live currency API before execution.",
        ko: "ì‹¤í–‰ ì „ ì‹¤ì‹œê°„ í™˜ìœ¨ APIë¡œ í™˜ìœ¨ì„ í™•ì¸í•©ë‹ˆë‹¤."
      }
    },
    visa: {
      status: "requires-verification",
      message: {
        en: "For many travelers visa-free entry may apply, but ONE must verify before execution.",
        ko: "ë§Žì€ ì—¬í–‰ìžì—ê²Œ ë¬´ë¹„ìž ìž…êµ­ì´ ê°€ëŠ¥í•  ìˆ˜ ìžˆì§€ë§Œ, ì‹¤í–‰ ì „ ONEì´ ë°˜ë“œì‹œ í™•ì¸í•´ì•¼ í•©ë‹ˆë‹¤."
      }
    },
    checklist: [
      {
        id: "passport",
        en: "Passport",
        ko: "ì—¬ê¶Œ",
        required: true,
        editable: true
      },
      {
        id: "travel-insurance",
        en: "Travel insurance",
        ko: "ì—¬í–‰ìž ë³´í—˜",
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
        ko: "í™˜ì „",
        required: true,
        editable: true
      },
      {
        id: "transit-card",
        en: "Transit card",
        ko: "êµí†µì¹´ë“œ",
        required: false,
        editable: true
      },
      {
        id: "hotel-confirmation",
        en: "Hotel confirmation",
        ko: "í˜¸í…” ì˜ˆì•½ í™•ì¸ì„œ",
        required: true,
        editable: true
      },
      {
        id: "emergency-contacts",
        en: "Emergency contacts",
        ko: "ë¹„ìƒ ì—°ë½ì²˜",
        required: true,
        editable: true
      }
    ],
    restaurants: [
      {
        id: "sushi",
        type: "Sushi",
        typeKo: "ìŠ¤ì‹œ",
        recommendation: "Reservation-ready sushi options near your route.",
        recommendationKo: "ë™ì„  ê·¼ì²˜ ì˜ˆì•½ ê°€ëŠ¥í•œ ìŠ¤ì‹œ ì˜µì…˜ì„ ì¤€ë¹„í•©ë‹ˆë‹¤.",
        editable: true
      },
      {
        id: "ramen",
        type: "Ramen",
        typeKo: "ë¼ë©˜",
        recommendation: "Local ramen shortlist based on location and wait time.",
        recommendationKo: "ìœ„ì¹˜ì™€ ëŒ€ê¸° ì‹œê°„ì„ ê¸°ì¤€ìœ¼ë¡œ í˜„ì§€ ë¼ë©˜ í›„ë³´ë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤.",
        editable: true
      },
      {
        id: "wagyu",
        type: "Wagyu",
        typeKo: "ì™€ê·œ",
        recommendation: "Premium wagyu options for one special meal.",
        recommendationKo: "íŠ¹ë³„í•œ ì‹ì‚¬ë¥¼ ìœ„í•œ í”„ë¦¬ë¯¸ì—„ ì™€ê·œ ì˜µì…˜ì„ ì¤€ë¹„í•©ë‹ˆë‹¤.",
        editable: true
      },
      {
        id: "izakaya",
        type: "Izakaya",
        typeKo: "ì´ìžì¹´ì•¼",
        recommendation: "Casual evening options near hotel or station.",
        recommendationKo: "í˜¸í…”ì´ë‚˜ ì—­ ê·¼ì²˜ì˜ ìºì£¼ì–¼í•œ ì €ë… ì˜µì…˜ì„ ì¤€ë¹„í•©ë‹ˆë‹¤.",
        editable: true
      },
      {
        id: "cafe",
        type: "Cafe",
        typeKo: "ì¹´íŽ˜",
        recommendation: "Premium cafes and quiet stops along the itinerary.",
        recommendationKo: "ì¼ì • ì¤‘ ë“¤ë¥´ê¸° ì¢‹ì€ í”„ë¦¬ë¯¸ì—„ ì¹´íŽ˜ì™€ ì¡°ìš©í•œ ìž¥ì†Œë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤.",
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
      ko: "ê· í˜•í˜• í’ˆì§ˆ í”Œëžœ",
      reason: {
        en: "Best overall mix of comfort, price control, transport access, and reliable providers.",
        ko: "íŽ¸ì•ˆí•¨, ê°€ê²© í†µì œ, êµí†µ ì ‘ê·¼ì„±, ì‹ ë¢° ê°€ëŠ¥í•œ ì œê³µì—…ì²´ì˜ ê· í˜•ì´ ê°€ìž¥ ì¢‹ìŠµë‹ˆë‹¤."
      }
    },
    modifyOptions: [
      {
        id: "change-airline",
        en: "Change airline",
        ko: "í•­ê³µì‚¬ ë³€ê²½"
      },
      {
        id: "change-hotel-type",
        en: "Change hotel type",
        ko: "í˜¸í…” ìœ í˜• ë³€ê²½"
      },
      {
        id: "remove-restaurants",
        en: "Remove restaurants",
        ko: "ë ˆìŠ¤í† ëž‘ ì œì™¸"
      },
      {
        id: "reduce-budget",
        en: "Reduce budget",
        ko: "ì˜ˆì‚° ì¤„ì´ê¸°"
      },
      {
        id: "upgrade-quality",
        en: "Upgrade quality",
        ko: "í’ˆì§ˆ ì—…ê·¸ë ˆì´ë“œ"
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
            ? `${stored.destination?.countryKo || "ì¼ë³¸"} ì—¬í–‰`
            : `${stored.destination?.country || "Japan"} Trip`),
        destination:
          stored.display?.destination ||
          (activeLanguage === "ko"
            ? stored.destination?.countryKo || "ì¼ë³¸"
            : stored.destination?.country || "Japan"),
        city:
          stored.display?.city ||
          (activeLanguage === "ko"
            ? stored.destination?.cityKo || "ë„ì¿„"
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
      title: stored.display?.title || stored.rawInput || stored.mission || (activeLanguage === "ko" ? "ë¯¸ì…˜ ê³„íš" : "Mission Plan"),
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
      <span class="option-key">${selected ? "âœ“" : "+"}</span>
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
  return String(name || "").replace(/^the destination\b/i, destination || (activeLanguage === "ko" ? "ëª©ì ì§€" : "Destination")).trim();
};

const getRestaurantName = (restaurant) => {
  const destination = currentResult?.destination?.city || currentResult?.destination?.country || currentResult?.display?.destination || "";
  const name = activeLanguage === "ko" ? restaurant.typeKo || restaurant.type : restaurant.type;
  return String(name || "").replace(/^the destination\b/i, destination || (activeLanguage === "ko" ? "ëª©ì ì§€" : "Destination")).trim();
};

const getRestaurantRecommendation = (restaurant) => {
  return activeLanguage === "ko"
    ? restaurant.recommendationKo || restaurant.recommendation
    : restaurant.recommendation;
};

const restaurantVenueProfiles = {
  JP: [
    { en: "Sushi Dai", ko: "ìŠ¤ì‹œë‹¤ì´", rating: 4.7 }, { en: "Ichiran Ramen", ko: "ì´ì¹˜ëž€ ë¼ë©˜", rating: 4.5 },
    { en: "Gyukatsu Motomura", ko: "ê·œì¹´ì¸  ëª¨í† ë¬´ë¼", rating: 4.6 }, { en: "Gonpachi", ko: "ê³¤íŒŒì¹˜", rating: 4.3 },
    { en: "Blue Bottle Coffee", ko: "ë¸”ë£¨ë³´í‹€ ì»¤í”¼", rating: 4.4 }
  ],
  US: [
    { en: "The Modern", ko: "ë” ëª¨ë˜", rating: 4.6 }, { en: "Keens Steakhouse", ko: "í‚¨ìŠ¤ ìŠ¤í…Œì´í¬í•˜ìš°ìŠ¤", rating: 4.5 },
    { en: "Rubirosa", ko: "ë£¨ë¹„ë¡œì‚¬", rating: 4.6 }, { en: "Joe's Shanghai", ko: "ì¡°ìŠ¤ ìƒí•˜ì´", rating: 4.3 }
  ],
  ES: [
    { en: "Sobrino de BotÃ­n", ko: "ì†Œë¸Œë¦¬ë…¸ ë° ë³´í‹´", rating: 4.4 }, { en: "Casa Lucio", ko: "ì¹´ì‚¬ ë£¨ì‹œì˜¤", rating: 4.3 },
    { en: "Sala de Despiece", ko: "ì‚´ë¼ ë° ë°ìŠ¤í”¼ì—ì„¸", rating: 4.5 }, { en: "ChocolaterÃ­a San GinÃ©s", ko: "ì‚° ížˆë„¤ìŠ¤", rating: 4.4 }
  ],
  CO: [
    { en: "Leo", ko: "ë ˆì˜¤", rating: 4.6 }, { en: "El Chato", ko: "ì—˜ ì°¨í† ", rating: 4.6 },
    { en: "AndrÃ©s Carne de Res", ko: "ì•ˆë“œë ˆìŠ¤ ì¹´ë¥´ë„¤ ë° ë ˆìŠ¤", rating: 4.5 }, { en: "Mesa Franca", ko: "ë©”ì‚¬ í”„ëž‘ì¹´", rating: 4.6 }
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
      <div class="card-title-group">${editable ? `<button class="category-toggle" type="button" aria-pressed="true" aria-label="${activeLanguage === "ko" ? "ì¹´í…Œê³ ë¦¬ í¬í•¨" : "Include category"}">âœ“</button>` : ""}<h2 class="card-title">${title}</h2></div>
      <span class="card-label">${label}</span>
    </div>

    <div class="recommendation">
      ${editable ? `<button class="selectable-recommendation selectable-option" type="button" aria-pressed="true"><span class="option-key">âœ“</span><span class="recommendation-value">${value}</span></button>` : `<p class="recommendation-value">${value}</p>`}
    </div>

    <p class="recommendation-label">${t("reason")}</p>
    <p class="reason">${reason}</p>
    ${supportingContent}

    ${makeOptionList(options)}

    ${editable ? `
      <div class="alternative-picker">
        <p class="alternative-picker-title">${activeLanguage === "ko" ? "í¬í•¨í•  ì˜µì…˜ì„ ì„ íƒí•˜ì„¸ìš”" : "Choose options to include"}</p>
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
      <div class="card-title-group">${editable ? `<button class="category-toggle" type="button" aria-pressed="true" aria-label="${activeLanguage === "ko" ? "ì¹´í…Œê³ ë¦¬ í¬í•¨" : "Include category"}">âœ“</button>` : ""}<h2 class="card-title">${title}</h2></div>
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
          <span class="option-key">âœ“</span><span class="option-value">${item}</span>
        </button>
      ` : `<div class="option-row locked-option"><span class="option-key">â€¢</span><span class="option-value">${item}</span></div>`;
      }).join("")}
    </div>

    ${editable ? `
      <div class="alternative-picker">
        <p class="alternative-picker-title">${activeLanguage === "ko" ? "í¬í•¨í•  ì˜µì…˜ì„ ì„ íƒí•˜ì„¸ìš”" : "Choose options to include"}</p>
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
      <div class="card-title-group"><button class="category-toggle" type="button" aria-pressed="true" aria-label="${activeLanguage === "ko" ? "ì˜ˆì‚° í¬í•¨" : "Include budget"}">âœ“</button><h2 class="card-title">${activeLanguage === "ko" ? "ì˜ˆì‚°" : "Budget"}</h2></div>
      <span class="card-label">${activeLanguage === "ko" ? "ì˜ˆìƒ" : "Estimated"}</span>
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
    label: status === "live" ? (activeLanguage === "ko" ? "ì‹¤ì‹œê°„ ë°ì´í„°" : "Live data") : t("apiPlaceholder"),
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
    label: activeLanguage === "ko" ? "í•„ìˆ˜" : "Required",
    value: activeLanguage === "ko" ? "ìŠ¹ì¸ ì „ ì‹¤í–‰ ê¸ˆì§€" : "Approval-first execution",
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
    <div class="card-top"><h2 class="card-title">${ko ? "ë¹„ìž í™•ì¸" : "Visa Verification"}</h2><span class="card-label">${ko ? "í•„ìˆ˜ í™•ì¸" : "Required"}</span></div>
    <p class="reason">${localize(result.visa?.message)}</p>
    <div class="visa-upload-grid">
      <button class="document-upload-button" type="button" data-document-type="passport">${ko ? "ì—¬ê¶Œ ì´ë¯¸ì§€ ì¶”ê°€" : "Add Passport Image"}</button>
      <button class="document-upload-button" type="button" data-document-type="visa">${ko ? "ë¹„ìž ì´ë¯¸ì§€ ì¶”ê°€" : "Add Visa Image"}</button>
      <input id="passportUploadInput" type="file" accept="image/*,application/pdf" hidden />
      <input id="visaUploadInput" type="file" accept="image/*,application/pdf" hidden />
    </div>
    <div class="document-status" id="visaDocumentStatus" aria-live="polite"></div>
    <label class="personal-data-consent"><input id="personalDataConsent" type="checkbox" /><span>${ko ? "ë¹„ìž ì‹ ì²­ì„œ ì¤€ë¹„ë¥¼ ìœ„í•´ ìŠ¹ì¸í•œ ê°œì¸ì •ë³´ì™€ ì—…ë¡œë“œí•œ ë¬¸ì„œë¥¼ ONEì´ ì‚¬ìš©í•˜ë„ë¡ í—ˆìš©í•©ë‹ˆë‹¤." : "I allow ONE to use the personal details and documents I approve to prepare my visa application."}</span></label>
    <button class="prepare-visa-button" id="prepareVisaButton" type="button" disabled>${ko ? "ë¹„ìž ì‹ ì²­ ì¤€ë¹„" : "Prepare Visa Application"}</button>
    <p class="visa-protection-note">${ko ? "ONEì€ ì‹ ì²­ì„œë¥¼ ì¤€ë¹„ë§Œ í•©ë‹ˆë‹¤. ìµœì¢… ìŠ¹ì¸ ì „ì—ëŠ” ì œì¶œ, ì„œëª… ë˜ëŠ” ê²°ì œê°€ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤." : "ONE prepares the application only. Nothing is submitted, signed, or paid until your final approval."}</p>
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
    recommendedDetail.querySelector(".option-key").textContent = "âœ“";
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
    hotels: ["Hotel Riu Plaza EspaÃ±a", "Hyatt Centric Gran VÃ­a Madrid", "NH Collection Madrid", "Room Mate Macarena"],
    transfer: "Airport Express bus, Metro, or licensed airport transfer"
  },
  CO: {
    airlines: ["Avianca", "LATAM Airlines", "American Airlines", "United Airlines"],
    flightPrices: [[2300000, 3500000], [2400000, 3700000], [2200000, 3400000], [2250000, 3450000]],
    hotels: ["Grand Hyatt BogotÃ¡", "Hilton BogotÃ¡", "Sofitel BogotÃ¡ Victoria Regia", "GHL Hotel Capital"],
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
  KR: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["Jeju Air", "ì œì£¼í•­ê³µ"], ["T'way Air", "í‹°ì›¨ì´í•­ê³µ"]],
  CN: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Air China", "ì¤‘êµ­êµ­ì œí•­ê³µ"], ["China Eastern Airlines", "ì¤‘êµ­ë™ë°©í•­ê³µ"], ["China Southern Airlines", "ì¤‘êµ­ë‚¨ë°©í•­ê³µ"]],
  VN: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Vietnam Airlines", "ë² íŠ¸ë‚¨í•­ê³µ"], ["VietJet Air", "ë¹„ì—£ì ¯í•­ê³µ"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"]],
  TH: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Thai Airways", "íƒ€ì´í•­ê³µ"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["AirAsia", "ì—ì–´ì•„ì‹œì•„"]],
  SG: [["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"], ["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["Scoot", "ìŠ¤ì¿ íŠ¸í•­ê³µ"]],
  AU: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Qantas", "ì½´íƒ€ìŠ¤í•­ê³µ"], ["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"], ["Cathay Pacific", "ìºì„¸ì´í¼ì‹œí”½"]],
  CA: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Air Canada", "ì—ì–´ìºë‚˜ë‹¤"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["WestJet", "ì›¨ìŠ¤íŠ¸ì ¯"]],
  GB: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["British Airways", "ì˜êµ­í•­ê³µ"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["Lufthansa", "ë£¨í”„íŠ¸í•œìž"]],
  FR: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Air France", "ì—ì–´í”„ëž‘ìŠ¤"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["KLM", "KLM ë„¤ëœëž€ë“œí•­ê³µ"]],
  DE: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Lufthansa", "ë£¨í”„íŠ¸í•œìž"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["Finnair", "í•€ì—ì–´"]],
  IT: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["ITA Airways", "ITA í•­ê³µ"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["Lufthansa", "ë£¨í”„íŠ¸í•œìž"]],
  MX: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Aeromexico", "ì•„ì—ë¡œë©•ì‹œì½”"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"]],
  AR: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Aerolineas Argentinas", "ì•„ë¥´í—¨í‹°ë‚˜í•­ê³µ"], ["LATAM Airlines", "ë¼íƒí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"]],
  BR: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["LATAM Airlines", "ë¼íƒí•­ê³µ"], ["GOL Airlines", "ê³¨í•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"]],
  PE: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["LATAM Airlines", "ë¼íƒí•­ê³µ"], ["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"]],
  CL: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["LATAM Airlines", "ë¼íƒí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["Air Canada", "ì—ì–´ìºë‚˜ë‹¤"]],
  PT: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["TAP Air Portugal", "TAP í¬ë¥´íˆ¬ê°ˆí•­ê³µ"], ["Lufthansa", "ë£¨í”„íŠ¸í•œìž"], ["Air France", "ì—ì–´í”„ëž‘ìŠ¤"]],
  NL: [["KLM", "KLM ë„¤ëœëž€ë“œí•­ê³µ"], ["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Lufthansa", "ë£¨í”„íŠ¸í•œìž"], ["Air France", "ì—ì–´í”„ëž‘ìŠ¤"]],
  GR: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Aegean Airlines", "ì—ê²Œí•­ê³µ"], ["Turkish Airlines", "í„°í‚¤í•­ê³µ"], ["Lufthansa", "ë£¨í”„íŠ¸í•œìž"]],
  AE: [["Emirates", "ì—ë¯¸ë ˆì´íŠ¸í•­ê³µ"], ["Etihad Airways", "ì—í‹°í•˜ë“œí•­ê³µ"], ["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Qatar Airways", "ì¹´íƒ€ë¥´í•­ê³µ"]],
  IN: [["Air India", "ì—ì–´ì¸ë””ì•„"], ["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"], ["Thai Airways", "íƒ€ì´í•­ê³µ"]],
  ID: [["Garuda Indonesia", "ê°€ë£¨ë‹¤ì¸ë„ë„¤ì‹œì•„í•­ê³µ"], ["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"], ["AirAsia", "ì—ì–´ì•„ì‹œì•„"]],
  MY: [["Malaysia Airlines", "ë§ë ˆì´ì‹œì•„í•­ê³µ"], ["Korean Air", "ëŒ€í•œí•­ê³µ"], ["AirAsia", "ì—ì–´ì•„ì‹œì•„"], ["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"]],
  NZ: [["Air New Zealand", "ì—ì–´ë‰´ì§ˆëžœë“œ"], ["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Qantas", "ì½´íƒ€ìŠ¤í•­ê³µ"], ["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"]],
  ZA: [["South African Airways", "ë‚¨ì•„í”„ë¦¬ì¹´í•­ê³µ"], ["Emirates", "ì—ë¯¸ë ˆì´íŠ¸í•­ê³µ"], ["Qatar Airways", "ì¹´íƒ€ë¥´í•­ê³µ"], ["Ethiopian Airlines", "ì—í‹°ì˜¤í”¼ì•„í•­ê³µ"]]
};

Object.assign(airlineProfilesByCountry, {
  GT: [["Aeromexico", "ì•„ì—ë¡œë©•ì‹œì½”"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["Copa Airlines", "ì½”íŒŒí•­ê³µ"]],
  BZ: [["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"], ["Copa Airlines", "ì½”íŒŒí•­ê³µ"], ["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"]],
  CR: [["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["Copa Airlines", "ì½”íŒŒí•­ê³µ"]],
  SV: [["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["Copa Airlines", "ì½”íŒŒí•­ê³µ"]],
  HN: [["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["Copa Airlines", "ì½”íŒŒí•­ê³µ"]],
  NI: [["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"], ["Copa Airlines", "ì½”íŒŒí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"]],
  PA: [["Copa Airlines", "ì½”íŒŒí•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"]]
});

const airlineProfilesByContinent = {
  "Central America": airlineProfilesByCountry.GT,
  Caribbean: [["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"], ["Copa Airlines", "ì½”íŒŒí•­ê³µ"], ["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"]],
  "South America": [["LATAM Airlines", "ë¼íƒí•­ê³µ"], ["Avianca", "ì•„ë¹„ì•™ì¹´í•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"], ["Copa Airlines", "ì½”íŒŒí•­ê³µ"]],
  Europe: [["Lufthansa", "ë£¨í”„íŠ¸í•œìž"], ["Air France", "ì—ì–´í”„ëž‘ìŠ¤"], ["KLM", "KLM ë„¤ëœëž€ë“œí•­ê³µ"], ["Turkish Airlines", "í„°í‚¤í•­ê³µ"]],
  Africa: [["Ethiopian Airlines", "ì—í‹°ì˜¤í”¼ì•„í•­ê³µ"], ["Qatar Airways", "ì¹´íƒ€ë¥´í•­ê³µ"], ["Emirates", "ì—ë¯¸ë ˆì´íŠ¸í•­ê³µ"], ["Turkish Airlines", "í„°í‚¤í•­ê³µ"]],
  "Middle East": [["Emirates", "ì—ë¯¸ë ˆì´íŠ¸í•­ê³µ"], ["Qatar Airways", "ì¹´íƒ€ë¥´í•­ê³µ"], ["Etihad Airways", "ì—í‹°í•˜ë“œí•­ê³µ"], ["Turkish Airlines", "í„°í‚¤í•­ê³µ"]],
  Oceania: [["Qantas", "ì½´íƒ€ìŠ¤í•­ê³µ"], ["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"], ["Cathay Pacific", "ìºì„¸ì´í¼ì‹œí”½"], ["Air New Zealand", "ì—ì–´ë‰´ì§ˆëžœë“œ"]],
  Asia: [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"], ["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"], ["Cathay Pacific", "ìºì„¸ì´í¼ì‹œí”½"]],
  "North America": [["Korean Air", "ëŒ€í•œí•­ê³µ"], ["Delta Air Lines", "ë¸íƒ€í•­ê³µ"], ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"], ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"]]
};

const airlineNameKo = {
  "Korean Air": "ëŒ€í•œí•­ê³µ", "Asiana Airlines": "ì•„ì‹œì•„ë‚˜í•­ê³µ", "Jeju Air": "ì œì£¼í•­ê³µ", "Japan Airlines": "ì¼ë³¸í•­ê³µ",
  "Delta Air Lines": "ë¸íƒ€í•­ê³µ", "United Airlines": "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ", "Iberia": "ì´ë² ë¦¬ì•„í•­ê³µ", "Lufthansa": "ë£¨í”„íŠ¸í•œìž",
  "Air France": "ì—ì–´í”„ëž‘ìŠ¤", "Avianca": "ì•„ë¹„ì•™ì¹´í•­ê³µ", "LATAM Airlines": "ë¼íƒí•­ê³µ", "American Airlines": "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"
};

const localizedVenueNames = {
  "Bestia": "ë² ìŠ¤í‹°ì•„", "Republique": "ë ˆí“Œë¸”ë¦¬í¬", "Guelaguetza": "ê²”ë¼ê²Œì°¨", "Grand Central Market": "ê·¸ëžœë“œ ì„¼íŠ¸ëŸ´ ë§ˆì¼“",
  "The Modern": "ë” ëª¨ë˜", "Keens Steakhouse": "í‚¨ìŠ¤ ìŠ¤í…Œì´í¬í•˜ìš°ìŠ¤", "Rubirosa": "ë£¨ë¹„ë¡œì‚¬", "Joe's Shanghai": "ì¡°ìŠ¤ ìƒí•˜ì´",
  "Sushi Dai": "ìŠ¤ì‹œë‹¤ì´", "Ichiran Ramen": "ì´ì¹˜ëž€ ë¼ë©˜", "Gyukatsu Motomura": "ê·œì¹´ì¸  ëª¨í† ë¬´ë¼", "Gonpachi": "ê³¤íŒŒì¹˜",
  "Sobrino de Botin": "ì†Œë¸Œë¦¬ë…¸ ë° ë³´í‹´", "Casa Lucio": "ì¹´ì‚¬ ë£¨ì‹œì˜¤", "Sala de Despiece": "ì‚´ë¼ ë° ë°ìŠ¤í”¼ì—ì„¸", "Chocolateria San Gines": "ì‡¼ì½œë¼í…Œë¦¬ì•„ ì‚° ížˆë„¤ìŠ¤",
  "InterContinental Los Angeles Downtown": "ì¸í„°ì»¨í‹°ë„¨íƒˆ ë¡œìŠ¤ì•¤ì ¤ë ˆìŠ¤ ë‹¤ìš´íƒ€ìš´", "Conrad Los Angeles": "ì½˜ëž˜ë“œ ë¡œìŠ¤ì•¤ì ¤ë ˆìŠ¤",
  "citizenM Los Angeles Downtown": "ì‹œí‹°ì¦ŒM ë¡œìŠ¤ì•¤ì ¤ë ˆìŠ¤ ë‹¤ìš´íƒ€ìš´", "Freehand Los Angeles": "í”„ë¦¬í•¸ë“œ ë¡œìŠ¤ì•¤ì ¤ë ˆìŠ¤"
};

const cityProfileOverride = (code, city) => {
  const normalized = String(city || "").trim().toLowerCase();
  const primaryCities = {
    US: ["new york", "ë‰´ìš•"], ES: ["madrid", "ë§ˆë“œë¦¬ë“œ"],
    JP: ["tokyo", "ë„ì¿„"], CO: ["bogotÃ¡", "bogota", "ë³´ê³ íƒ€"]
  };
  if (primaryCities[code]?.includes(normalized)) return null;
  if (["los angeles", "ë¡œìŠ¤ì•¤ì ¤ë ˆìŠ¤", "la", "l.a."].includes(normalized)) {
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
    ["Rubirosa", 4.6, 35000, 75000], ["Joe's Shanghai", 4.3, 25000, 60000],
    ["Katz's Delicatessen", 4.5, 30000, 65000], ["Joe's Pizza", 4.4, 12000, 30000],
    ["Los Tacos No. 1", 4.6, 18000, 42000], ["Levain Bakery", 4.6, 12000, 28000],
    ["Russ & Daughters", 4.5, 28000, 65000], ["Chelsea Market", 4.5, 25000, 70000],
    ["Balthazar", 4.4, 60000, 140000], ["Dominique Ansel Bakery", 4.5, 15000, 35000],
    ["Eataly Flatiron", 4.4, 30000, 80000], ["Magnolia Bakery", 4.4, 10000, 28000]
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

const restaurantCuisineProfiles = {
  JP: [["Sushi counter", 4.6, 30000, 85000, "sushi"], ["Ramen shop", 4.5, 16000, 38000, "ramen"], ["Wagyu grill", 4.6, 65000, 150000, "wagyu"], ["Izakaya", 4.5, 28000, 70000, "izakaya"], ["Matcha dessert stop", 4.6, 12000, 32000, "dessert"], ["Tempura house", 4.5, 35000, 90000, "tempura"], ["Market seafood stall", 4.5, 22000, 68000, "seafood"], ["Curry rice shop", 4.4, 14000, 36000, "curry"], ["Yakitori alley", 4.5, 25000, 65000, "yakitori"], ["Udon and soba shop", 4.4, 13000, 34000, "noodles"], ["Kaiseki dinner", 4.6, 85000, 220000, "kaiseki"], ["Local bakery cafe", 4.4, 10000, 28000, "cafe"]],
  US: [["Classic deli", 4.5, 22000, 60000, "deli"], ["Steakhouse", 4.6, 70000, 170000, "steak"], ["Pizza slice shop", 4.5, 12000, 36000, "pizza"], ["Burger grill", 4.4, 18000, 48000, "burger"], ["Seafood bar", 4.5, 45000, 120000, "seafood"], ["Brunch cafe", 4.4, 20000, 52000, "brunch"], ["Taco counter", 4.4, 14000, 38000, "tacos"], ["Rooftop dinner", 4.5, 55000, 140000, "dinner"], ["Bakery and coffee", 4.5, 10000, 30000, "bakery"], ["Market food hall", 4.4, 18000, 52000, "market"], ["Fine dining", 4.6, 95000, 240000, "fine dining"], ["Neighborhood bistro", 4.4, 28000, 72000, "bistro"]],
  FR: [["Neighborhood bistro", 4.6, 35000, 90000, "bistro"], ["Bakery and coffee", 4.6, 9000, 28000, "bakery"], ["Wine bar", 4.5, 30000, 85000, "wine"], ["Brasserie", 4.5, 32000, 90000, "brasserie"], ["Crepe stop", 4.4, 12000, 36000, "crepe"], ["Cheese and charcuterie", 4.5, 28000, 72000, "cheese"], ["Market lunch", 4.4, 18000, 52000, "market"], ["Seafood table", 4.5, 45000, 120000, "seafood"]],
  ES: [["Tapas bar", 4.6, 22000, 65000, "tapas"], ["Paella restaurant", 4.5, 35000, 95000, "paella"], ["Churros cafe", 4.5, 9000, 26000, "dessert"], ["Market counter", 4.4, 16000, 48000, "market"], ["Seafood tavern", 4.5, 42000, 110000, "seafood"], ["Wine and pintxos", 4.5, 26000, 72000, "pintxos"]],
  IT: [["Trattoria", 4.6, 28000, 76000, "trattoria"], ["Pizzeria", 4.5, 16000, 42000, "pizza"], ["Gelato stop", 4.6, 7000, 22000, "gelato"], ["Pasta house", 4.5, 26000, 72000, "pasta"], ["Aperitivo bar", 4.4, 22000, 62000, "aperitivo"], ["Seafood osteria", 4.5, 42000, 110000, "seafood"]],
  MX: [["Taco stand", 4.6, 10000, 32000, "tacos"], ["Mole kitchen", 4.5, 24000, 68000, "mole"], ["Cantina", 4.4, 22000, 62000, "cantina"], ["Market lunch", 4.5, 12000, 36000, "market"], ["Seafood tostada bar", 4.4, 18000, 52000, "seafood"], ["Churros and coffee", 4.5, 8000, 24000, "dessert"]],
  PE: [["Ceviche house", 4.6, 24000, 72000, "ceviche"], ["Nikkei restaurant", 4.6, 45000, 130000, "nikkei"], ["Anticucho grill", 4.5, 16000, 48000, "grill"], ["Pisco and tapas", 4.4, 24000, 68000, "pisco"], ["Market lunch", 4.4, 12000, 38000, "market"], ["Coffee and dessert", 4.5, 9000, 26000, "cafe"]],
  CO: [["Arepa cafe", 4.5, 10000, 28000, "arepa"], ["Bandeja paisa kitchen", 4.5, 18000, 48000, "local"], ["Grill and empanadas", 4.4, 14000, 42000, "grill"], ["Coffee house", 4.6, 8000, 24000, "coffee"], ["Rooftop dinner", 4.5, 42000, 110000, "dinner"], ["Market lunch", 4.4, 12000, 36000, "market"]],
  BR: [["Churrascaria", 4.6, 42000, 110000, "steak"], ["Feijoada kitchen", 4.5, 20000, 58000, "local"], ["Acai and juice bar", 4.5, 8000, 24000, "snack"], ["Seafood restaurant", 4.4, 36000, 98000, "seafood"], ["Bakery cafe", 4.5, 9000, 26000, "bakery"], ["Market lunch", 4.4, 12000, 38000, "market"]],
  KR: [["Korean BBQ", 4.6, 30000, 85000, "bbq"], ["Kimbap and noodles", 4.4, 9000, 26000, "casual"], ["Market street food", 4.5, 8000, 25000, "street food"], ["Cafe dessert stop", 4.5, 9000, 28000, "cafe"], ["Hanwoo dinner", 4.6, 70000, 180000, "hanwoo"], ["Traditional table", 4.5, 22000, 65000, "korean"]]
};

const cuisineProfilesByContinent = {
  Asia: restaurantCuisineProfiles.JP,
  Europe: restaurantCuisineProfiles.FR,
  "North America": restaurantCuisineProfiles.US,
  "South America": restaurantCuisineProfiles.PE,
  "Central America": restaurantCuisineProfiles.MX,
  Caribbean: restaurantCuisineProfiles.MX,
  Africa: [["Grill house", 4.5, 22000, 65000, "grill"], ["Local stew kitchen", 4.4, 16000, 48000, "local"], ["Seafood table", 4.4, 32000, 90000, "seafood"], ["Coffee and pastry", 4.5, 8000, 24000, "cafe"], ["Market lunch", 4.4, 12000, 36000, "market"], ["Rooftop dinner", 4.5, 38000, 105000, "dinner"]],
  "Middle East": [["Kebab grill", 4.5, 18000, 52000, "kebab"], ["Mezze table", 4.5, 22000, 65000, "mezze"], ["Seafood restaurant", 4.4, 36000, 98000, "seafood"], ["Bakery and coffee", 4.5, 9000, 26000, "bakery"], ["Market lunch", 4.4, 12000, 38000, "market"], ["Rooftop dinner", 4.5, 42000, 120000, "dinner"]],
  Oceania: [["Seafood restaurant", 4.5, 36000, 98000, "seafood"], ["Brunch cafe", 4.5, 18000, 48000, "brunch"], ["Steak grill", 4.5, 48000, 125000, "steak"], ["Market food hall", 4.4, 16000, 46000, "market"], ["Bakery and coffee", 4.5, 9000, 28000, "bakery"], ["Wine bar", 4.4, 30000, 82000, "wine"]]
};

const restaurantProfileForCity = (city, result = {}) => {
  const normalized = String(city || "").trim().toLowerCase();
  const aliases = {
    "ë‰´ìš•": "new york", "ë¡œìŠ¤ì•¤ì ¤ë ˆìŠ¤": "los angeles", "ì›Œì‹±í„´ d.c.": "washington, d.c.",
    "ìƒŒí”„ëž€ì‹œìŠ¤ì½”": "san francisco", "ì‹œì¹´ê³ ": "chicago", "ë§ˆì´ì• ë¯¸": "miami",
    "ë§ˆë“œë¦¬ë“œ": "madrid", "ë°”ë¥´ì…€ë¡œë‚˜": "barcelona", "ì„¸ë¹„ì•¼": "seville",
    "ë„ì¿„": "tokyo", "ì˜¤ì‚¬ì¹´": "osaka", "êµí† ": "kyoto"
  };
  const key = aliases[normalized] || normalized;
  const countryCode = result.country || result.countryProfile?.code || result.destination?.countryCode || result.destination?.code || "";
  const continent = result.destination?.continent || result.countryProfile?.continent || "";
  const cuisineProfile = restaurantCuisineProfiles[countryCode] || cuisineProfilesByContinent[continent] || [
    ["Local signature restaurant", 4.5, 22000, 65000, "local"],
    ["Market food hall", 4.4, 14000, 42000, "market"],
    ["Neighborhood cafe", 4.5, 9000, 28000, "cafe"],
    ["Grill house", 4.4, 30000, 85000, "grill"],
    ["Seafood table", 4.4, 38000, 105000, "seafood"],
    ["Bakery and dessert", 4.5, 8000, 24000, "dessert"],
    ["Rooftop dinner", 4.5, 42000, 120000, "dinner"],
    ["Casual lunch spot", 4.4, 12000, 36000, "casual"]
  ];
  return cuisineProfile.map(([name, rating, min, max, cuisine], index) => [
    `${city} ${name}`,
    rating,
    min,
    max,
    cuisine,
    "ONE destination cuisine fallback"
  ]).slice(0, TRAVEL_OPTION_TARGETS.restaurants);
};

const TRAVEL_OPTION_TARGETS = Object.freeze({
  flights: 8,
  hotels: 8,
  restaurants: 12
});

const calculateTripDayCounts = (result) => {
  const startDate = result?.schedule?.startDate;
  const endDate = result?.schedule?.endDate;
  if (startDate && endDate) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (!Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf())) {
      const tripDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
      return { tripDays, tripNights: Math.max(1, tripDays - 1) };
    }
  }
  const tripDays = Math.max(1, Number(result?.durationDays || 3));
  return { tripDays, tripNights: Math.max(1, tripDays - 1) };
};

const getTravelPartyDetails = (result) => {
  const answers = result?.followUp?.answers || {};
  const travelerCount = Math.max(1, Number(answers.adults || answers.travelers || result?.travelerCount || result?.travelers || 1));
  const rooms = Math.max(1, Number(answers.rooms || answers.roomCount || result?.rooms || result?.roomCount || Math.ceil(travelerCount / 2)));
  const originAirport = answers.originAirport || answers.departureAirport || result?.originAirport || result?.departureAirport || "ICN";
  const groupType = result?.groupType || (travelerCount <= 1 ? "solo" : travelerCount === 2 ? "couple" : travelerCount >= 4 ? "family_or_group" : "small_group");
  return { travelerCount, rooms, originAirport, groupType };
};

const airlineFallbackOptions = [
  ["Korean Air", "ëŒ€í•œí•­ê³µ"],
  ["Asiana Airlines", "ì•„ì‹œì•„ë‚˜í•­ê³µ"],
  ["Delta Air Lines", "ë¸íƒ€í•­ê³µ"],
  ["United Airlines", "ìœ ë‚˜ì´í‹°ë“œí•­ê³µ"],
  ["American Airlines", "ì•„ë©”ë¦¬ì¹¸í•­ê³µ"],
  ["Qatar Airways", "ì¹´íƒ€ë¥´í•­ê³µ"],
  ["Emirates", "ì—ë¯¸ë ˆì´íŠ¸í•­ê³µ"],
  ["Turkish Airlines", "í„°í‚¤í•­ê³µ"],
  ["Singapore Airlines", "ì‹±ê°€í¬ë¥´í•­ê³µ"],
  ["Lufthansa", "ë£¨í”„íŠ¸í•œìž"]
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
    [`Best overall itinerary option for ${city}.`, `${cityKo}í–‰ ì¼ì • ì¤‘ ì „ì²´ ê· í˜•ì´ ê°€ìž¥ ì¢‹ì€ ì˜µì…˜ìž…ë‹ˆë‹¤.`],
    [`Service-focused itinerary option for ${city}.`, `${cityKo}í–‰ ì„œë¹„ìŠ¤ ì¤‘ì‹¬ ì¼ì • ì˜µì…˜ìž…ë‹ˆë‹¤.`],
    [`Best budget-conscious option when price and flexible timing matter most.`, `ê°€ê²©ê³¼ ìœ ì—°í•œ ì¼ì •ì´ ê°€ìž¥ ì¤‘ìš”í•  ë•Œ ì í•©í•œ ê°€ì„±ë¹„ ì˜µì…˜ìž…ë‹ˆë‹¤.`],
    [`Best quality alternative for travelers prioritizing reliability and onboard experience.`, `ì•ˆì •ì„±ê³¼ ê¸°ë‚´ ê²½í—˜ì„ ìš°ì„ í•˜ëŠ” ì—¬í–‰ìžì—ê²Œ ì í•©í•œ ê³ í’ˆì§ˆ ëŒ€ì•ˆìž…ë‹ˆë‹¤.`]
  ];
  const hotelReasons = [
    [`Best overall balance of location, guest experience, and estimated nightly price in ${city}.`, `${cityKo}ì—ì„œ ìœ„ì¹˜, ìˆ™ë°• ê²½í—˜ê³¼ ì˜ˆìƒ 1ë°• ê°€ê²©ì˜ ê· í˜•ì´ ê°€ìž¥ ì¢‹ìŠµë‹ˆë‹¤.`],
    [`Best premium-service option for comfort, facilities, and consistent hospitality.`, `íŽ¸ì•ˆí•¨, ì‹œì„¤ê³¼ ì•ˆì •ì ì¸ ì„œë¹„ìŠ¤ë¥¼ ì¤‘ì‹œí•  ë•Œ ì í•©í•œ í”„ë¦¬ë¯¸ì—„ ì˜µì…˜ìž…ë‹ˆë‹¤.`],
    [`Best value option for balancing location and total stay cost.`, `ìœ„ì¹˜ì™€ ì „ì²´ ìˆ™ë°•ë¹„ì˜ ê· í˜•ì„ ë§žì¶”ê¸° ì¢‹ì€ ê°€ì„±ë¹„ ì˜µì…˜ìž…ë‹ˆë‹¤.`],
    [`Best budget option for keeping accommodation costs lower while retaining practical access.`, `ì‹¤ìš©ì ì¸ ì ‘ê·¼ì„±ì„ ìœ ì§€í•˜ë©´ì„œ ìˆ™ë°•ë¹„ë¥¼ ë‚®ì¶”ê¸° ì¢‹ì€ ì˜ˆì‚°í˜• ì˜µì…˜ìž…ë‹ˆë‹¤.`]
  ];
  const tripMultiplier = result.tripType === "one_way" ? 0.62 : 1;
  const { tripDays, tripNights } = calculateTripDayCounts(result);
  const { travelerCount, rooms, originAirport, groupType } = getTravelPartyDetails(result);
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
      reasonKo: flightReasons[index]?.[1] || `${cityKo} ë…¸ì„ ì˜ ì‹¤ìš©ì ì¸ í”„ë¡œí† íƒ€ìž… í•­ê³µ ì˜µì…˜ìž…ë‹ˆë‹¤.`
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
    reasonKo: hotelReasons[index]?.[1] || `${cityKo}ì˜ ì‹¤ìš©ì ì¸ í”„ë¡œí† íƒ€ìž… ìˆ™ì†Œ ì˜µì…˜ìž…ë‹ˆë‹¤.`
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
    ...restaurantProfileForCity(city, result)
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
    recommendationKo: `${cityKo} ì¼ì •ì— ë§žì¶˜ í”„ë¡œí† íƒ€ìž… ì‹ë‹¹ ì˜µì…˜ìž…ë‹ˆë‹¤. ê°€ê²©ê³¼ ì˜ˆì•½ ê°€ëŠ¥ ì—¬ë¶€ëŠ” ì œê³µì—…ì²´ ìµœì¢… í™•ì¸ì´ í•„ìš”í•©ë‹ˆë‹¤.`,
    editable: true
  }));
  const flightsBudget = flights[0]?.estimatedPrice || result.budget?.flights;
  const nightlyBudget = hotels[0]?.estimatedNightlyPrice || result.budget?.hotel;
  const hotelBudget = nightlyBudget ? {
    currency: nightlyBudget.currency || "KRW",
    min: Number(nightlyBudget.min || 0) * tripNights * rooms,
    max: Number(nightlyBudget.max || 0) * tripNights * rooms
  } : result.budget?.hotel;
  const averageRestaurantMin = restaurants.length
    ? Math.round(restaurants.reduce((sum, restaurant) => sum + Number(restaurant.estimatedPrice?.min || 0), 0) / restaurants.length)
    : 0;
  const averageRestaurantMax = restaurants.length
    ? Math.round(restaurants.reduce((sum, restaurant) => sum + Number(restaurant.estimatedPrice?.max || 0), 0) / restaurants.length)
    : 0;
  const plannedMealsPerDay = tripDays <= 3 ? 2 : 2.5;
  const foodBudget = {
    currency: "KRW",
    min: Math.round(averageRestaurantMin * plannedMealsPerDay * tripDays * travelerCount / 10000) * 10000,
    max: Math.round(averageRestaurantMax * plannedMealsPerDay * tripDays * travelerCount / 10000) * 10000
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
    durationDays: tripDays,
    travelerCount,
    travelers: travelerCount,
    rooms,
    roomCount: rooms,
    groupType,
    originAirport,
    departureAirport: originAirport,
    followUp: {
      ...(result.followUp || { type: "travel" }),
      type: "travel",
      answers: {
        ...(result.followUp?.answers || {}),
        adults: travelerCount,
        travelers: travelerCount,
        rooms,
        roomCount: rooms,
        originAirport,
        departureAirport: originAirport
      }
    },
    budget: { ...result.budget, flights: flightsBudget, hotel: hotelBudget, food: foodBudget, estimatedTotal },
    airportTransfer: {
      ...result.airportTransfer,
      recommended: { en: profile.transfer, ko: profile.transfer },
      reason: {
        en: `Prototype transfer recommendation for arrival in ${city}.`,
        ko: `${cityKo} ë„ì°© ê¸°ì¤€ í”„ë¡œí† íƒ€ìž… ì´ë™ ì¶”ì²œìž…ë‹ˆë‹¤.`
      },
      options: [
        { en: profile.transfer, ko: profile.transfer },
        { en: "Pre-arranged private transfer", ko: "ì‚¬ì „ ì˜ˆì•½ ì „ìš© ì°¨ëŸ‰" },
        { en: "Official airport public transport", ko: "ê³µì‹ ê³µí•­ ëŒ€ì¤‘êµí†µ" }
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
    ? `${formatAmount(total.min * rate, code)} â€“ ${formatAmount(total.max * rate, code)}`
    : (activeLanguage === "ko" ? "ì‹¤ì‹œê°„ í™˜ìœ¨ í™•ì¸ í•„ìš”" : "Live rate required");
  const destinationRate = Number(provider?.items?.find((item) => item.to === destinationCode)?.rate || provider?.items?.[0]?.value);
  const usdRate = Number(provider?.items?.find((item) => item.to === "USD")?.rate);
  const items = [
    `${localCode}: ${total ? `${formatAmount(total.min, localCode)} â€“ ${formatAmount(total.max, localCode)}` : "â€”"}`,
    `USD: ${rangeWithRate(usdRate, "USD")}`,
    `${destinationCode}: ${rangeWithRate(destinationRate, destinationCode)}`,
    localize(result.exchangeRate?.message)
  ];
  return createListCard({ id: "exchange-rate", title: t("exchangeRate"), label: provider ? (activeLanguage === "ko" ? "ì‹¤ì‹œê°„ ë°ì´í„°" : "Live data") : t("apiPlaceholder"), items, wide: true, editable: false });
};

const createWeatherForecastCard = (result) => {
  const provider = findLiveProvider(result, "weather");
  const items = provider?.items?.length
    ? provider.items.map((item) => {
      const date = new Date(`${item.label}T00:00:00`);
      const weekday = new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : "en-US", { weekday: "long" }).format(date);
      return activeLanguage === "ko"
        ? `${weekday} · ë‚ ì§œ ${item.label} · ê¸°ì˜¨ ${item.value} · ìŠµë„ ${item.humidity || "â€”"} · ê°•ìˆ˜í™•ë¥  ${item.precipitation || "â€”"}`
        : `${weekday} · Date ${item.label} · Temperature ${item.value} · Humidity ${item.humidity || "â€”"} · Rain chance ${item.precipitation || "â€”"}`;
    })
    : [localize(result.weather?.message)];
  return createListCard({ id: "weather", title: t("weather"), label: provider ? (activeLanguage === "ko" ? "ì‹¤ì‹œê°„ ì˜ˆë³´" : "Live forecast") : t("apiPlaceholder"), items, wide: true, editable: false });
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
    ? { any: "ì‹œê°„ ë¬´ê´€", morning: "ì˜¤ì „ 06:00â€“12:00", afternoon: "ì˜¤í›„ 12:00â€“17:00", evening: "ì €ë… 17:00â€“22:00" }
    : { any: "Any time / No preference", morning: "Morning 06:00â€“12:00", afternoon: "Afternoon 12:00â€“17:00", evening: "Evening 17:00â€“22:00" };
  const article = document.createElement("article");
  article.className = "mission-card is-wide is-locked-card schedule-result-card";
  article.dataset.cardId = "schedule";
  article.innerHTML = `
    <div class="card-top">
      <div class="card-title-group"><h2 class="card-title">${activeLanguage === "ko" ? "ì„ íƒ ì¼ì •" : "Selected Schedule"}</h2></div>
      <span class="card-label">${activeLanguage === "ko" ? "í™•ì •" : "Confirmed"}</span>
    </div>
    <div class="schedule-result-dates">
      <div class="schedule-result-value"><strong>${activeLanguage === "ko" ? "ì‹œìž‘" : "From"}</strong><span>${formatDate(schedule.startDate)}</span></div>
      <div class="schedule-result-value"><strong>${activeLanguage === "ko" ? "ì¢…ë£Œ" : "To"}</strong><span>${formatDate(schedule.endDate)}</span></div>
    </div>
    <div class="schedule-result-time"><strong>${activeLanguage === "ko" ? "ì‹œê°„" : "Time"}</strong><span>${timeLabels[schedule.timePreference] || timeLabels.any}</span></div>
  `;
  return article;
};

const v22Local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;

const DOMAIN_PRESENTATION = Object.freeze({
  education: {
    icon: "âœ¦",
    accent: "learning",
    title: {
      en: "Learning plan",
      ko: "í•™ìŠµ í•´ê²° ê³„íš",
      es: "Plan de aprendizaje"
    },
    prototype: {
      en: "Prototype · education support · no academy contacted",
      ko: "í”„ë¡œí† íƒ€ìž… · í•™ìŠµ ì§€ì› · í•™ì› ì—°ë½ ì—†ìŒ",
      es: "Prototipo · apoyo educativo · sin contactar academias"
    },
    understood: {
      en: "ONE understood the learning gap, student level, commute, and comparison path.",
      ko: "ONEì´ í•™ìŠµ ë¬¸ì œ, í•™ìƒ ìˆ˜ì¤€, í†µí•™ ì¡°ê±´, ë¹„êµ ë°©í–¥ì„ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤.",
      es: "ONE entendiÃ³ la necesidad de aprendizaje, nivel, distancia y comparaciÃ³n."
    },
    prepared: {
      en: ["Level check", "Academy path", "Tutor option", "Home routine"],
      ko: ["ìˆ˜ì¤€ ì ê²€", "í•™ì› ë¹„êµ", "ê³¼ì™¸ ëŒ€ì•ˆ", "ê°€ì • í•™ìŠµ"],
      es: ["Nivel", "Academias", "Tutor", "Rutina en casa"]
    }
  },
  healthcare: {
    icon: "ï¼‹",
    accent: "care",
    title: {
      en: "Care navigation",
      ko: "ì§„ë£Œ ì•ˆë‚´ ê³„íš",
      es: "Ruta de atenciÃ³n"
    },
    prototype: {
      en: "Prototype · care navigation · not medical advice",
      ko: "í”„ë¡œí† íƒ€ìž… · ì§„ë£Œ ì•ˆë‚´ · ì˜í•™ì  ì§„ë‹¨ ì•„ë‹˜",
      es: "Prototipo · orientaciÃ³n mÃ©dica · no es diagnÃ³stico"
    },
    understood: {
      en: "ONE separated urgency, specialty, same-day path, and safety warnings.",
      ko: "ONEì´ ê¸´ê¸‰ë„, ì§„ë£Œê³¼, ë‹¹ì¼ ê°€ëŠ¥ ê²½ë¡œ, ì£¼ì˜ì‚¬í•­ì„ ë‚˜ëˆ  ì •ë¦¬í–ˆìŠµë‹ˆë‹¤.",
      es: "ONE separÃ³ urgencia, especialidad, disponibilidad y advertencias."
    },
    prepared: {
      en: ["Urgency", "Specialty", "Same-day path", "Warning signs"],
      ko: ["ê¸´ê¸‰ë„", "ì§„ë£Œê³¼", "ë‹¹ì¼ ê²½ë¡œ", "ì£¼ì˜ ì‹ í˜¸"],
      es: ["Urgencia", "Especialidad", "Hoy", "Alertas"]
    }
  },
  business: {
    icon: "â—‡",
    accent: "business",
    title: {
      en: "Business setup plan",
      ko: "ì‚¬ì—… ì¤€ë¹„ ê³„íš",
      es: "Plan de negocio"
    },
    prototype: {
      en: "Prototype · business preparation · no filing submitted",
      ko: "í”„ë¡œí† íƒ€ìž… · ì‚¬ì—… ì¤€ë¹„ · ì„œë¥˜ ì œì¶œ ì—†ìŒ",
      es: "Prototipo · preparaciÃ³n empresarial · sin presentar trÃ¡mites"
    },
    understood: {
      en: "ONE organized the official steps, documents, expert help, and approval boundary.",
      ko: "ONEì´ ê³µì‹ ì ˆì°¨, í•„ìš” ì„œë¥˜, ì „ë¬¸ê°€ ë„ì›€, ìŠ¹ì¸ ê²½ê³„ë¥¼ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤.",
      es: "ONE organizÃ³ pasos oficiales, documentos, expertos y aprobaciÃ³n."
    },
    prepared: {
      en: ["Official steps", "Documents", "Specialists", "Approval boundary"],
      ko: ["ê³µì‹ ì ˆì°¨", "í•„ìš” ì„œë¥˜", "ì „ë¬¸ê°€", "ìŠ¹ì¸ ê²½ê³„"],
      es: ["Pasos oficiales", "Documentos", "Expertos", "AprobaciÃ³n"]
    }
  },
  "home-services": {
    icon: "âŒ‚",
    accent: "home",
    title: {
      en: "Home service plan",
      ko: "ìƒí™œ ì„œë¹„ìŠ¤ í•´ê²° ê³„íš",
      es: "Plan de servicio local"
    },
    prototype: {
      en: "Prototype · local service preparation · no provider contacted",
      ko: "í”„ë¡œí† íƒ€ìž… · ìƒí™œ ì„œë¹„ìŠ¤ ì¤€ë¹„ · ì—…ì²´ ì—°ë½ ì—†ìŒ",
      es: "Prototipo · servicio local · sin contactar proveedores"
    },
    understood: {
      en: "ONE prepared immediate damage control, provider comparison, and safe approval steps.",
      ko: "ONEì´ ì¦‰ì‹œ í”¼í•´ ì¤„ì´ê¸°, ì—…ì²´ ë¹„êµ, ìŠ¹ì¸ í›„ ì—°ë½ ë‹¨ê³„ë¥¼ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤.",
      es: "ONE preparÃ³ control inicial, comparaciÃ³n y aprobaciÃ³n segura."
    },
    prepared: {
      en: ["Damage control", "Provider path", "Photos", "Fallbacks"],
      ko: ["í”¼í•´ ì¤„ì´ê¸°", "ì—…ì²´ ê²½ë¡œ", "ì‚¬ì§„ ì¤€ë¹„", "ëŒ€ì•ˆ"],
      es: ["Control", "Proveedor", "Fotos", "Alternativas"]
    }
  },
  career: {
    icon: "â†—",
    accent: "career",
    title: {
      en: "Career action plan",
      ko: "ì»¤ë¦¬ì–´ ì‹¤í–‰ ê³„íš",
      es: "Plan profesional"
    },
    prototype: {
      en: "Prototype · career preparation · no application submitted",
      ko: "í”„ë¡œí† íƒ€ìž… · ì»¤ë¦¬ì–´ ì¤€ë¹„ · ì§€ì›ì„œ ì œì¶œ ì—†ìŒ",
      es: "Prototipo · carrera · sin enviar solicitudes"
    },
    understood: {
      en: "ONE structured the role target, resume path, interview preparation, and approval gate.",
      ko: "ONEì´ ëª©í‘œ ì§ë¬´, ì´ë ¥ì„œ, ë©´ì ‘ ì¤€ë¹„, ìŠ¹ì¸ í›„ ì§€ì› ë‹¨ê³„ë¥¼ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤.",
      es: "ONE estructurÃ³ objetivo, CV, entrevista y aprobaciÃ³n."
    },
    prepared: {
      en: ["Role target", "Resume", "Interview", "Applications"],
      ko: ["ëª©í‘œ ì§ë¬´", "ì´ë ¥ì„œ", "ë©´ì ‘", "ì§€ì›"],
      es: ["Puesto", "CV", "Entrevista", "PostulaciÃ³n"]
    }
  },
  general: {
    icon: "â—‹",
    accent: "general",
    title: {
      en: "Mission plan",
      ko: "ë¯¸ì…˜ í•´ê²° ê³„íš",
      es: "Plan de misiÃ³n"
    },
    prototype: {
      en: "Prototype · approval protected · no external action",
      ko: "í”„ë¡œí† íƒ€ìž… · ìŠ¹ì¸ ë³´í˜¸ · ì™¸ë¶€ ì‹¤í–‰ ì—†ìŒ",
      es: "Prototipo · aprobaciÃ³n protegida · sin acciÃ³n externa"
    },
    understood: {
      en: "ONE organized the goal, possible paths, and approval boundary.",
      ko: "ONEì´ ëª©í‘œ, ê°€ëŠ¥í•œ ê²½ë¡œ, ìŠ¹ì¸ ê²½ê³„ë¥¼ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤.",
      es: "ONE organizÃ³ objetivo, rutas posibles y aprobaciÃ³n."
    },
    prepared: {
      en: ["Goal", "Plan", "Options", "Approval"],
      ko: ["ëª©í‘œ", "ê³„íš", "ëŒ€ì•ˆ", "ìŠ¹ì¸"],
      es: ["Objetivo", "Plan", "Opciones", "AprobaciÃ³n"]
    }
  }
});

const TERM_TRANSLATIONS = Object.freeze({
  "education": { ko: "êµìœ¡", es: "educaciÃ³n" },
  "healthcare": { ko: "ì˜ë£Œ", es: "salud" },
  "business": { ko: "ì‚¬ì—…", es: "negocio" },
  "home-services": { ko: "ìƒí™œ ì„œë¹„ìŠ¤", es: "servicios del hogar" },
  "career": { ko: "ì»¤ë¦¬ì–´", es: "carrera" },
  "general": { ko: "ì¼ë°˜ ë¯¸ì…˜", es: "misiÃ³n general" },
  "child-english-performance-decline": { ko: "ì•„ì´ ì˜ì–´ ì‹¤ë ¥ ê°œì„ ", es: "mejorar inglÃ©s del niÃ±o" },
  "academy-finder": { ko: "í•™ì› ì°¾ê¸°", es: "buscar academia" },
  "dental-care": { ko: "ì¹˜ê³¼ ì§„ë£Œ ì•ˆë‚´", es: "atenciÃ³n dental" },
  "plumbing": { ko: "ëˆ„ìˆ˜ ìˆ˜ë¦¬", es: "reparaciÃ³n de fuga" },
  "company-formation": { ko: "íšŒì‚¬ ì„¤ë¦½ ì¤€ë¹„", es: "creaciÃ³n de empresa" },
  "job-search": { ko: "ì¼ìžë¦¬ ì°¾ê¸°", es: "bÃºsqueda laboral" },
  "English level and study-pattern review": { ko: "ì˜ì–´ ìˆ˜ì¤€ê³¼ í•™ìŠµ íŒ¨í„´ ì ê²€", es: "revisiÃ³n de nivel y hÃ¡bitos de inglÃ©s" },
  "English academy comparison path": { ko: "ì˜ì–´ í•™ì› ë¹„êµ", es: "comparaciÃ³n de academias de inglÃ©s" },
  "Private tutor path": { ko: "ê³¼ì™¸ ì„ ìƒë‹˜ ë¹„êµ", es: "comparaciÃ³n de tutor privado" },
  "Eight-week home-study routine": { ko: "8ì£¼ ê°€ì • í•™ìŠµ ë£¨í‹´", es: "rutina de estudio de 8 semanas" },
  "Teacher or school discussion path": { ko: "í•™êµ ì„ ìƒë‹˜ ìƒë‹´ ì¤€ë¹„", es: "conversaciÃ³n con profesor o escuela" },
  "Same-day dental navigation": { ko: "ì˜¤ëŠ˜ ê°€ëŠ¥í•œ ì¹˜ê³¼ ì§„ë£Œ ê²½ë¡œ", es: "ruta dental para hoy" },
  "Urgent or emergency escalation": { ko: "ì‘ê¸‰ ì—¬ë¶€ í™•ì¸", es: "evaluaciÃ³n urgente" },
  "After-hours fallback": { ko: "ì•¼ê°„·ì£¼ë§ ëŒ€ì•ˆ", es: "alternativa fuera de horario" },
  "Immediate damage control": { ko: "ì¦‰ì‹œ í”¼í•´ ì¤„ì´ê¸°", es: "control inmediato de daÃ±os" },
  "Plumber provider path": { ko: "ìˆ˜ë¦¬ì—…ì²´ ì—°ê²° ì¤€ë¹„", es: "ruta de proveedor de plomerÃ­a" },
  "Landlord or building manager fallback": { ko: "ì§‘ì£¼ì¸·ê´€ë¦¬ì‚¬ë¬´ì†Œ ëŒ€ì•ˆ", es: "alternativa con propietario o administraciÃ³n" },
  "Official business registration path": { ko: "ê³µì‹ ì‚¬ì—…ìž ë“±ë¡ ê²½ë¡œ", es: "ruta oficial de registro" },
  "Professional support path": { ko: "ì „ë¬¸ê°€ ë„ì›€ ê²½ë¡œ", es: "ruta con especialista" },
  "Job matching preparation path": { ko: "ì¼ìžë¦¬ ë§¤ì¹­ ì¤€ë¹„", es: "preparaciÃ³n de bÃºsqueda laboral" },
  "Resume and interview readiness path": { ko: "ì´ë ¥ì„œ·ë©´ì ‘ ì¤€ë¹„", es: "CV y entrevista" },
  "Review prepared plan": { ko: "ì¤€ë¹„ëœ ê³„íš ê²€í† ", es: "revisar plan preparado" },
  "Contact provider after approval": { ko: "ìŠ¹ì¸ í›„ ì œê³µì—…ì²´ ì—°ë½", es: "contactar proveedor tras aprobaciÃ³n" },
  "Submit after approval": { ko: "ìŠ¹ì¸ í›„ ì œì¶œ", es: "enviar tras aprobaciÃ³n" },
  "Schedule after approval": { ko: "ìŠ¹ì¸ í›„ ì¼ì • í™•ì •", es: "programar tras aprobaciÃ³n" },
  "No external action before approval.": { ko: "ìŠ¹ì¸ ì „ì—ëŠ” ì™¸ë¶€ ì‹¤í–‰ì´ ì—†ìŠµë‹ˆë‹¤.", es: "Sin acciÃ³n externa antes de aprobar." },
  "Live provider data is not connected in this prototype.": { ko: "ì´ í”„ë¡œí† íƒ€ìž…ì—ëŠ” ì‹¤ì‹œê°„ ì œê³µì—…ì²´ ë°ì´í„°ê°€ ì—°ê²°ë˜ì–´ ìžˆì§€ ì•ŠìŠµë‹ˆë‹¤.", es: "Este prototipo no tiene datos de proveedores en vivo." }
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
      <span class="v22-path-check">${selected ? "âœ“" : "+"}</span>
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
  return city || country || (activeLanguage === "ko" ? "ëª©ì ì§€" : activeLanguage === "es" ? "destino" : "destination");
};

const getTravelDurationLabel = (result) => {
  const start = result.schedule?.startDate ? new Date(`${result.schedule.startDate}T00:00:00`) : null;
  const end = result.schedule?.endDate ? new Date(`${result.schedule.endDate}T00:00:00`) : null;
  const days = start && end && !Number.isNaN(start.valueOf()) && !Number.isNaN(end.valueOf())
    ? Math.max(1, Math.round((end - start) / 86400000) + 1)
    : 5;
  return activeLanguage === "ko" ? `${days}ì¼` : activeLanguage === "es" ? `${days} dÃ­as` : `${days} days`;
};

const getTravelBudgetLabel = (result, tone = "balanced") => {
  const total = result.budget?.estimatedTotal || result.budget?.total;
  if (total?.min && total?.max) {
    return activeLanguage === "ko" ? `ì˜ˆìƒ ${formatRange(total)}` : activeLanguage === "es" ? `Estimado ${formatRange(total)}` : `Estimated ${formatRange(total)}`;
  }
  const labels = {
    balanced: { en: "Estimated budget: medium", ko: "ì˜ˆìƒ ì˜ˆì‚°: ì¤‘ê°„", es: "Presupuesto estimado: medio" },
    food: { en: "Estimated budget: medium+", ko: "ì˜ˆìƒ ì˜ˆì‚°: ì¤‘ìƒ", es: "Presupuesto estimado: medio alto" },
    value: { en: "Estimated budget: value", ko: "ì˜ˆìƒ ì˜ˆì‚°: ì‹¤ì†", es: "Presupuesto estimado: ahorro" },
    rest: { en: "Estimated budget: comfort", ko: "ì˜ˆìƒ ì˜ˆì‚°: ì—¬ìœ ", es: "Presupuesto estimado: cÃ³modo" }
  };
  return localize(labels[tone] || labels.balanced);
};

const compactMoney = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  if (value >= 1000000) {
    const amount = value / 1000000;
    return `â‚©${amount >= 10 ? Math.round(amount) : amount.toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (value >= 10000) return `â‚©${Math.round(value / 10000)}ë§Œ`;
  return `â‚©${value.toLocaleString("en-US")}`;
};

const compactWonMan = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return `${Math.max(1, Math.round(value / 10000)).toLocaleString("ko-KR")}ë§Œì›`;
};

const getCompactTravelBudgetLabel = (result, fallback = "") => {
  const total = result.budget?.estimatedTotal || result.budget?.total;
  if (typeof total?.min === "number" && typeof total?.max === "number") {
    if (activeLanguage === "ko") return `ì˜ˆìƒ ${compactWonMan(total.min)} - ${compactWonMan(total.max)}`;
    return `${compactMoney(total.min)} â€“ ${compactMoney(total.max)}`;
  }
  return String(fallback || "").replace(/^Estimated\s+/i, "").replace(/^Estimado\s+/i, "");
};

const sourceStateLabel = (state) => {
  const labels = {
    verified_live: { en: "Verified live", ko: "ì‹¤ì‹œê°„ í™•ì¸", es: "Verificado en vivo" },
    cached_public: { en: "Recent public info", ko: "ìµœê·¼ ê³µê°œ ì •ë³´ ê¸°ì¤€", es: "InformaciÃ³n pÃºblica reciente" },
    estimated: { en: "Estimated", ko: "ì˜ˆìƒ", es: "Estimado" },
    placeholder: { en: "Search structure ready", ko: "ê²€ìƒ‰ ì¡°ê±´ ì¤€ë¹„ë¨", es: "Estructura preparada" },
    unavailable: { en: "Live search required", ko: "ì‹¤ì‹œê°„ ê²€ìƒ‰ í•„ìš”", es: "BÃºsqueda en vivo necesaria" }
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

// Specific destination aliases kept readable for regression: new york|nyc|뉴욕
const buildSpecificCityJourneys = (result, destination, duration) => {
  const key = `${destination || ""} ${result.rawInput || result.mission || ""}`.toLowerCase();
  const seed = `${result.missionSeed || result.id || result.rawInput || ""}-${result.schedule?.startDate || ""}`;
  const local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
  const previewProfile = profileForResult(result, destination);
  if (previewProfile?.journeys?.length) {
    return rotateList(previewProfile.journeys, seed).map((item, index) => ({
      id: `v23-preview-journey-${previewProfile.id}-${index}`,
      name: local(item[0], item[1], item[2]),
      purpose: local(item[3], item[4], item[3]),
      tags: item[5] || [],
      reason: local(
        "This option is built from curated destination highlights and the current mission context.",
        "현재 미션과 실제 목적지 하이라이트를 기준으로 구성했습니다.",
        "Esta opción usa puntos reales del destino y el contexto de la misión."
      ),
      duration,
      tone: ["balanced", "culture", "food", "local"][index] || "balanced",
      comfort: local("Practical", "실용적", "Práctico"),
      budget: getTravelBudgetLabel(result, index === 2 ? "food" : "balanced"),
      timeline: item[5] || [],
      selected: index === 0,
      details: {
        flight: local("Round-trip options are compared after approval for live price and schedule.", "왕복 항공권은 승인 후 실시간 가격과 일정을 확인합니다.", "Vuelos ida y vuelta se comparan tras aprobación."),
        hotel: local("Hotel candidates are matched to the route, walking load, and room count.", "숙소 후보는 동선, 도보 부담, 객실 수에 맞춰 비교합니다.", "Hoteles según ruta, caminata y habitaciones."),
        transport: local("Daily movement is grouped by neighborhood to avoid unnecessary backtracking.", "불필요한 왕복 이동을 줄이도록 날마다 지역을 묶습니다.", "Se agrupa por zonas para evitar traslados inútiles."),
        food: local("Food candidates are placed near the day route instead of as a random list.", "맛집 후보는 무작위 목록이 아니라 그날 동선 근처로 배치합니다.", "Comida cerca de la ruta del día."),
        entry: local("Entry and document rules are rechecked through official sources before action.", "입국·서류 요건은 실행 전 공식 출처로 다시 확인합니다.", "Requisitos se verifican con fuentes oficiales."),
        insurance: local("Insurance and cancellation rules are prepared for review before booking.", "예약 전 보험과 취소 규정을 검토할 수 있게 준비합니다.", "Seguro y cancelación se preparan antes de reservar.")
      },
      sourceStates: {
        flight: getScenarioSourceState(result, "flight", "estimated"),
        hotel: getScenarioSourceState(result, "hotel", "estimated"),
        transport: getScenarioSourceState(result, "transport", "placeholder"),
        food: getScenarioSourceState(result, "food", "cached_public"),
        entry: getScenarioSourceState(result, "entry", "unavailable"),
        insurance: getScenarioSourceState(result, "insurance", "placeholder")
      }
    }));
  }
  const specific = /new york|nyc|ë‰´ìš•/.test(key)
    ? [
        ["NYC first-timer essentials", "ë‰´ìš• í•µì‹¬ ì¼ì •", "Nueva York esencial", "Manhattan icons, Brooklyn, food, shopping, and night views without forcing every famous place into one day.", "ë§¨í•´íŠ¼ ëŒ€í‘œ ëª…ì†Œ, ë¸Œë£¨í´ë¦°, ìŒì‹, ì‡¼í•‘, ì•¼ê²½ì„ ë‚ ì§œë³„ë¡œ ë‚˜ëˆ  ë¬´ë¦¬ ì—†ì´ ë³´ëŠ” êµ¬ì„±ìž…ë‹ˆë‹¤.", ["Statue of Liberty", "Broadway", "Central Park", "Brooklyn"]],
        ["Broadway, museums and skyline", "ë¸Œë¡œë“œì›¨ì´·ë¯¸ìˆ ê´€·ì „ë§", "Broadway, museos y vistas", "Best when culture, indoor options, and skyline moments matter more than rushing.", "ê³µì—°, ë¯¸ìˆ ê´€, ì‹¤ë‚´ ëŒ€ì•ˆ, ì „ë§ëŒ€ë¥¼ ì¤‘ì‹¬ìœ¼ë¡œ ì°¨ë¶„í•˜ê²Œ ì¦ê¸°ëŠ” êµ¬ì„±ìž…ë‹ˆë‹¤.", ["Broadway", "MoMA", "The Met", "Top of the Rock"]],
        ["Shopping and food New York", "ì‡¼í•‘ê³¼ ë§›ì§‘ ë‰´ìš•", "Compras y comida en Nueva York", "Built around SoHo, Fifth Avenue, Chelsea Market, bakeries, steak, pizza, and outlet time if you want it.", "ì†Œí˜¸, 5ë²ˆê°€, ì²¼ì‹œë§ˆì¼“, ë² ì´ì»¤ë¦¬, ìŠ¤í…Œì´í¬, í”¼ìž, ì•„ìš¸ë › ì„ íƒì§€ë¥¼ ì¤‘ì‹¬ìœ¼ë¡œ êµ¬ì„±í•©ë‹ˆë‹¤.", ["SoHo", "Macy's", "Chelsea Market", "Woodbury"]],
        ["Brooklyn and local neighborhoods", "ë¸Œë£¨í´ë¦°ê³¼ ë¡œì»¬ ë‰´ìš•", "Brooklyn y barrios locales", "More neighborhoods, photos, parks, cafÃ©s, and less tourist checklist pressure.", "ê´€ê´‘ ì²´í¬ë¦¬ìŠ¤íŠ¸ë³´ë‹¤ ë™ë„¤ ì‚°ì±…, ì‚¬ì§„, ê³µì›, ì¹´íŽ˜ ì‹œê°„ì„ ë” ì‚´ë¦° êµ¬ì„±ìž…ë‹ˆë‹¤.", ["DUMBO", "High Line", "Village", "CafÃ©s"]]
      ]
    : /sapporo|ì‚¿í¬ë¡œ/.test(key)
      ? [
          ["Sapporo winter highlights", "ì‚¿í¬ë¡œ ê²¨ìš¸ í•˜ì´ë¼ì´íŠ¸", "Sapporo invierno", "Snow, ramen, markets, beer culture, and warm indoor breaks.", "ëˆˆ, ë¼ë©˜, ì‹œìž¥, ë§¥ì£¼ ë¬¸í™”, ë”°ëœ»í•œ ì‹¤ë‚´ íœ´ì‹ì„ ì„žì€ êµ¬ì„±ìž…ë‹ˆë‹¤.", ["Snow", "Ramen", "Beer Museum", "Market"]],
          ["Sapporo food route", "ì‚¿í¬ë¡œ ë¯¸ì‹ ì½”ìŠ¤", "Ruta gastronÃ³mica de Sapporo", "Ramen, soup curry, seafood, cafÃ©s, and Susukino evening food.", "ë¼ë©˜, ìˆ˜í”„ì¹´ë ˆ, í•´ì‚°ë¬¼, ì¹´íŽ˜, ìŠ¤ìŠ¤í‚¤ë…¸ ì €ë… ë§›ì§‘ ì¤‘ì‹¬ìž…ë‹ˆë‹¤.", ["Ramen", "Soup curry", "Seafood", "CafÃ©"]],
          ["Hokkaido nature plus city", "í™‹ì¹´ì´ë„ ìžì—°ê³¼ ë„ì‹œ", "Hokkaido naturaleza y ciudad", "Adds nature and views without losing central Sapporo convenience.", "ì‚¿í¬ë¡œ ì¤‘ì‹¬ íŽ¸ì˜ì„±ê³¼ ìžì—°·ì „ë§ì„ í•¨ê»˜ ë„£ì€ êµ¬ì„±ìž…ë‹ˆë‹¤.", ["Odori", "View", "Nature", "Shopping"]],
          ["Easy family Sapporo", "ê°€ì¡±ê³¼ íŽ¸í•œ ì‚¿í¬ë¡œ", "Sapporo fÃ¡cil en familia", "Shorter moves, food halls, indoor stops, and snow-friendly pacing.", "ì§§ì€ ì´ë™, í‘¸ë“œí™€, ì‹¤ë‚´ ìž¥ì†Œ, ëˆˆê¸¸ì— ë§žì¶˜ ì—¬ìœ  ë™ì„ ìž…ë‹ˆë‹¤.", ["Family", "Indoor", "Food", "Easy"]]
        ]
      : [];
  if (!specific.length) return null;
  return rotateList(specific, seed).map((item, index) => ({
    id: `v23-specific-journey-${index}`,
    name: local(item[0], item[1], item[2]),
    purpose: local(item[3], item[4], item[3]),
    tags: item[5],
    reason: local(
      "This option is built from actual destination highlights, not a generic travel template.",
      "ì¼ë°˜ í…œí”Œë¦¿ì´ ì•„ë‹ˆë¼ ì‹¤ì œ ëª©ì ì§€ì—ì„œ í•  ë§Œí•œ ê²ƒë“¤ì„ ê¸°ì¤€ìœ¼ë¡œ êµ¬ì„±í–ˆìŠµë‹ˆë‹¤.",
      "Esta opciÃ³n usa puntos reales del destino, no una plantilla genÃ©rica."
    ),
    duration,
    tone: ["balanced", "culture", "food", "local"][index] || "balanced",
    comfort: local("Practical", "ì‹¤ìš©ì ", "PrÃ¡ctico"),
    budget: getTravelBudgetLabel(result, index === 2 ? "food" : "balanced"),
    timeline: item[5],
    selected: index === 0,
    details: {
      flight: local("Round-trip options are compared after approval for live price and schedule.", "ì™•ë³µ í•­ê³µê¶Œì€ ìŠ¹ì¸ í›„ ì‹¤ì‹œê°„ ê°€ê²©ê³¼ ì¼ì •ì„ í™•ì¸í•©ë‹ˆë‹¤.", "Vuelos ida y vuelta se comparan tras aprobaciÃ³n."),
      hotel: local("Hotel candidates are matched to the route, walking load, and room count.", "ìˆ™ì†Œ í›„ë³´ëŠ” ë™ì„ , ë„ë³´ ë¶€ë‹´, ê°ì‹¤ ìˆ˜ì— ë§žì¶° ë¹„êµí•©ë‹ˆë‹¤.", "Hoteles segÃºn ruta, caminata y habitaciones."),
      transport: local("Daily movement is grouped by neighborhood to avoid unnecessary backtracking.", "ë¶ˆí•„ìš”í•œ ì™•ë³µ ì´ë™ì„ ì¤„ì´ë„ë¡ ë‚ ì§œë³„ ì§€ì—­ì„ ë¬¶ìŠµë‹ˆë‹¤.", "Se agrupa por zonas para evitar traslados inÃºtiles."),
      food: local("Food candidates are placed near the day route instead of as a random list.", "ë§›ì§‘ í›„ë³´ëŠ” ë¬´ìž‘ìœ„ ëª©ë¡ì´ ì•„ë‹ˆë¼ ê·¸ë‚  ë™ì„  ê·¼ì²˜ë¡œ ë°°ì¹˜í•©ë‹ˆë‹¤.", "Comida cerca de la ruta del dÃ­a."),
      entry: local("Entry and document rules are rechecked through official sources before action.", "ìž…êµ­·ì„œë¥˜ ìš”ê±´ì€ ì‹¤í–‰ ì „ ê³µì‹ ì¶œì²˜ë¡œ ë‹¤ì‹œ í™•ì¸í•©ë‹ˆë‹¤.", "Requisitos se verifican con fuentes oficiales."),
      insurance: local("Insurance and cancellation rules are prepared for review before booking.", "ì˜ˆì•½ ì „ ë³´í—˜ê³¼ ì·¨ì†Œ ê·œì •ì„ ê²€í† í•  ìˆ˜ ìžˆê²Œ ì¤€ë¹„í•©ë‹ˆë‹¤.", "Seguro y cancelaciÃ³n se preparan antes de reservar.")
    },
    sourceStates: {
      flight: getScenarioSourceState(result, "flight", "estimated"),
      hotel: getScenarioSourceState(result, "hotel", "estimated"),
      transport: getScenarioSourceState(result, "transport", "placeholder"),
      food: getScenarioSourceState(result, "food", "cached_public"),
      entry: getScenarioSourceState(result, "entry", "unavailable"),
      insurance: getScenarioSourceState(result, "insurance", "placeholder")
    }
  }));
};


const providerSourceNote = (state) => {
  const copy = {
    verified_live: { en: "Confirmed by a live provider source.", ko: "ì‹¤ì‹œê°„ ì œê³µì—…ì²´ ì •ë³´ë¡œ í™•ì¸ë˜ì—ˆìŠµë‹ˆë‹¤.", es: "Confirmado por fuente en vivo." },
    cached_public: { en: "Based on recent public information.", ko: "ìµœê·¼ ê³µê°œ ì •ë³´ ê¸°ì¤€ìž…ë‹ˆë‹¤.", es: "Basado en informaciÃ³n pÃºblica reciente." },
    estimated: { en: "Estimated only. ONE will verify before approval.", ko: "ì˜ˆìƒ ì •ë³´ìž…ë‹ˆë‹¤. ìŠ¹ì¸ ì „ ONEì´ ë‹¤ì‹œ í™•ì¸í•©ë‹ˆë‹¤.", es: "Solo estimado. ONE verifica antes de aprobar." },
    placeholder: { en: "No fictional provider shown. Search conditions are ready.", ko: "ê°€ìƒ ì—…ì²´ëª…ì€ í‘œì‹œí•˜ì§€ ì•ŠìŠµë‹ˆë‹¤. ê²€ìƒ‰ ì¡°ê±´ë§Œ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤.", es: "Sin proveedor ficticio; criterios listos." },
    unavailable: { en: "Live provider search is required.", ko: "ì‹¤ì‹œê°„ ì œê³µì—…ì²´ ê²€ìƒ‰ì´ í•„ìš”í•©ë‹ˆë‹¤.", es: "Se requiere bÃºsqueda en vivo." }
  };
  return localize(copy[state] || copy.placeholder);
};

const buildV23TravelJourneys = (result, missionContext) => {
  const destination = getTravelDestinationLabel(result);
  const duration = getTravelDurationLabel(result);
  const ko = activeLanguage === "ko";
  const es = activeLanguage === "es";
  const isFamily = /ê°€ì¡±|family|familia/i.test(result.rawInput || result.mission || "");
  const isFood = /ë§›ì§‘|food|gourmet|comida/i.test(result.rawInput || result.mission || "") || result.v23TravelScenario === "sapporo-food";
  const isBudget = /ì‹¤ì†|ì €ë ´|budget|cheap|econ[oÃ³]mico/i.test(result.rawInput || result.mission || "") || result.v23TravelScenario === "sapporo-budget";
  const destinationCode = result.destination?.countryCode || result.countryProfile?.code || result.country;
  const specificJourneys = buildSpecificCityJourneys(result, destination, duration);
  if (specificJourneys) return specificJourneys;
  if (destinationCode === "JP" || /japan|ì¼ë³¸|tokyo|osaka|kyoto|ë„ì¿„|ì˜¤ì‚¬ì¹´|êµí† /i.test(`${destination} ${result.rawInput || result.mission || ""}`)) {
    return buildJapanCreativeJourneys(result, destination, duration);
  }
  const names = [
    ko ? `íŽ¸ì•ˆí•œ ${destination}` : es ? `${destination} cÃ³modo` : `Comfortable ${destination}`,
    ko ? `ë§›ì§‘ ì¤‘ì‹¬ ${destination}` : es ? `${destination} gastronÃ³mico` : `Food-focused ${destination}`,
    ko ? `ì‹¤ì†í˜• ${destination}` : es ? `${destination} eficiente` : `Value ${destination}`,
    ko ? (isFamily ? `ê°€ì¡± ì¶”ì–µ ${destination}` : `ì˜¨ì²œê³¼ íœ´ì‹ ${destination}`) : es ? `${destination} descanso` : `Restful ${destination}`
  ];
  const purposes = [
    ko ? "ì´ë™ ë¶€ë‹´ì„ ì¤„ì´ê³  ìŒì‹ê³¼ ê´€ê´‘ì˜ ê· í˜•ì„ ë§žì¶˜ ì¼ì •" : es ? "Menos fricciÃ³n, buen equilibrio entre comida y ciudad" : "Low-friction balance of food, city, and comfort",
    ko ? "í˜„ì§€ ìŒì‹ê³¼ ì‹œìž¥, ì¹´íŽ˜ ì‹œê°„ì„ ë” ë„‰ë„‰í•˜ê²Œ ë‘” ì¼ì •" : es ? "MÃ¡s tiempo para comida local, mercados y cafÃ©s" : "More time for local food, markets, and cafÃ©s",
    ko ? "í•µì‹¬ ê²½í—˜ì€ ì§€í‚¤ê³  ë¶ˆí•„ìš”í•œ ë¹„ìš©ì„ ë‚®ì¶˜ ì¼ì •" : es ? "Mantiene lo esencial y baja gastos innecesarios" : "Keeps the core experience while reducing spend",
    ko ? "íœ´ì‹ê³¼ ì—¬ìœ ë¥¼ ì¤‘ì‹¬ì— ë‘” ëŠë¦° ì—¬í–‰" : es ? "Viaje mÃ¡s lento, cÃ³modo y reparador" : "A slower journey focused on rest"
  ];
  const tags = [
    ko ? ["ìŒì‹", "ì‹œë‚´ ê´€ê´‘", "íŽ¸ì•ˆí•¨", "ê²°ì • ë¶€ë‹´ ë‚®ìŒ"] : es ? ["Comida", "Ciudad", "CÃ³modo", "FÃ¡cil"] : ["Food", "City", "Comfort", "Easy"],
    ko ? ["ë§›ì§‘", "ì‹œìž¥", "ì¹´íŽ˜", "ì•¼ê²½"] : es ? ["Comida", "Mercado", "CafÃ©", "Noche"] : ["Food", "Markets", "CafÃ©s", "Night"],
    ko ? ["ì‹¤ì†", "í•µì‹¬ ê´€ê´‘", "ëŒ€ì¤‘êµí†µ", "ê°€ì„±ë¹„"] : es ? ["Ahorro", "Esencial", "Transporte", "Valor"] : ["Value", "Essentials", "Transit", "Efficient"],
    ko ? ["íœ´ì‹", "ì˜¨ì²œ", "ì²œì²œížˆ", isFamily ? "ê°€ì¡±" : "ì—¬ìœ "] : es ? ["Descanso", "Spa", "Lento", "Calma"] : ["Rest", "Spa", "Slow", "Calm"]
  ];
  const reasons = [
    ko ? "ê°€ìž¥ ë¬´ë‚œí•˜ê³  ê²°ì • ë¶€ë‹´ì´ ì ì€ êµ¬ì„±ìž…ë‹ˆë‹¤." : es ? "La opciÃ³n mÃ¡s fÃ¡cil y equilibrada." : "The easiest balanced choice with the fewest decisions.",
    ko ? "ë¨¹ëŠ” ì¦ê±°ì›€ì„ ì—¬í–‰ì˜ ì¤‘ì‹¬ì— ë‘ê³  ì‹¶ì„ ë•Œ ê°€ìž¥ ìž˜ ë§žìŠµë‹ˆë‹¤." : es ? "Ideal si la comida es el centro del viaje." : "Best when food should lead the trip.",
    ko ? "ê°€ê²© ë¶€ë‹´ì„ ë‚®ì¶”ë©´ì„œ í•µì‹¬ ì¼ì •ì€ ìœ ì§€í•©ë‹ˆë‹¤." : es ? "Reduce gasto sin perder lo esencial." : "Lowers spend while keeping the core plan.",
    ko ? "ë¹¡ë¹¡í•œ ì´ë™ë³´ë‹¤ íšŒë³µê³¼ ê¸°ì–µì— ë‚¨ëŠ” ì‹œê°„ì„ ìš°ì„ í•©ë‹ˆë‹¤." : es ? "Prioriza descanso y momentos memorables." : "Prioritizes recovery and memorable time."
  ];
  const tones = ["balanced", "food", "value", "rest"];
  const preferredIndex = isFood ? 1 : isBudget ? 2 : isFamily ? 3 : 0;
  const timelines = [
    ko ? ["ë„ì°© í›„ ìˆ™ì†Œ ì£¼ë³€ ì ì‘", "ì‹œë‚´ ëŒ€í‘œ ë™ì„ ", "ìŒì‹ê³¼ ì‡¼í•‘", "ì—¬ìœ  ì¼ì •", "ê·€êµ­ ì¤€ë¹„"] : ["Arrival and easy area setup", "Core city route", "Food and shopping", "Flexible day", "Return prep"],
    ko ? ["ëŒ€í‘œ ìŒì‹ ì²« ì‹ì‚¬", "ì‹œìž¥ê³¼ ì¹´íŽ˜", "ì˜ˆì•½ í›„ë³´ ë¹„êµ", "ì•¼ê²½ê³¼ ë””ì €íŠ¸", "ê·€êµ­ ì „ ê°€ë²¼ìš´ ì‹ì‚¬"] : ["Signature first meal", "Market and cafÃ©s", "Restaurant shortlist", "Night view and dessert", "Easy final meal"],
    ko ? ["ì €ë… ë„ì°© ê¸°ì¤€ ì •ë¦¬", "í•µì‹¬ ëª…ì†Œ ì••ì¶•", "ëŒ€ì¤‘êµí†µ ì¤‘ì‹¬ ì´ë™", "ë¬´ë£Œ·ì €ë¹„ìš© ì„ íƒì§€", "ê·€êµ­ ì¤€ë¹„"] : ["Evening arrival setup", "Compact highlights", "Transit-first route", "Low-cost options", "Return prep"],
    ko ? ["ëŠë¦° ì²´í¬ì¸", "ì˜¨ì²œ ë˜ëŠ” íœ´ì‹", "ê°€ë²¼ìš´ ê´€ê´‘", "ì¹´íŽ˜ì™€ ì‚°ì±…", "ë¬´ë¦¬ ì—†ëŠ” ê·€êµ­"] : ["Slow check-in", "Spa or rest", "Light sightseeing", "CafÃ© and walk", "Easy return"]
  ];
  return names.map((name, index) => ({
    id: `v23-journey-${index}`,
    name,
    purpose: purposes[index],
    tags: tags[index],
    reason: reasons[index],
    duration,
    tone: tones[index],
    comfort: ko ? (index === 2 ? "íš¨ìœ¨ ë†’ìŒ" : index === 1 ? "ì·¨í–¥ ì„ ëª…" : "íŽ¸ì•ˆí•¨ ë†’ìŒ") : es ? (index === 2 ? "Muy eficiente" : "Alta comodidad") : (index === 2 ? "High efficiency" : "High comfort"),
    budget: getTravelBudgetLabel(result, tones[index]),
    timeline: timelines[index],
    selected: index === preferredIndex,
    details: {
      flight: ko ? "ì¸ì²œ ì¶œë°œ ì§í•­ ë˜ëŠ” í™˜ìŠ¹ ë¶€ë‹´ì´ ë‚®ì€ í•­ê³µíŽ¸ ìš°ì„ " : es ? "Priorizar vuelo directo o conexiÃ³n simple desde Incheon" : "Prioritize direct or low-friction flights from Incheon",
      hotel: ko ? `${destination}ì—­ ë˜ëŠ” ì¤‘ì‹¬ ì´ë™ê¶Œ ìˆ™ì†Œ ìš°ì„ ` : es ? `Zona central o estaciÃ³n principal de ${destination}` : `${destination} central station or walkable center`,
      transport: ko ? "ê³µì‹ êµí†µê³¼ í—ˆê°€ëœ ì´ë™ìˆ˜ë‹¨ ì¤‘ì‹¬ìœ¼ë¡œ ë¹„êµ" : es ? "Comparar transporte oficial y traslados autorizados" : "Compare official transit and licensed transfers",
      food: ko ? (index === 1 ? "í˜„ì§€ ìŒì‹·ì‹œìž¥·ì¹´íŽ˜ í›„ë³´ë¥¼ ì¤‘ì‹¬ìœ¼ë¡œ êµ¬ì„±" : "ìŒì‹, ì¹´íŽ˜, ê°€ë²¼ìš´ í™œë™ì„ ê· í˜• ìžˆê²Œ êµ¬ì„±") : es ? "Comida local, cafÃ©s y actividades equilibradas" : "Balanced food, cafÃ©s, and light activities",
      entry: ko ? "ìž…êµ­ ìš”ê±´ì€ ì‹¤í–‰ ì „ ê³µì‹ ì±„ë„ë¡œ ë‹¤ì‹œ í™•ì¸" : es ? "Revisar requisitos oficiales antes de ejecutar" : "Re-check entry requirements through official channels before execution",
      insurance: ko ? "ì—¬í–‰ìž ë³´í—˜ê³¼ ì¼ì • ë³€ê²½ ë¦¬ìŠ¤í¬ í™•ì¸ ì¤€ë¹„" : es ? "Preparar seguro y riesgo de cambios" : "Prepare insurance and schedule-change risk review"
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

const formatAlpha03Date = (value) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.valueOf())) return String(value);
  const locale = activeLanguage === "ko" ? "ko-KR" : activeLanguage === "es" ? "es-ES" : "en-US";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date);
};

const getAlpha03DestinationProfile = (destination) => {
  const previewProfile = profileForResult(currentResult || {}, destination);
  if (previewProfile) {
    return {
      ...previewProfile,
      restaurants: previewProfile.restaurants,
      places: previewProfile.places,
      fallbackNote: ""
    };
  }
  const key = String(destination || "").toLowerCase();
  if (/new york|nyc|Ã«â€°Â´Ã¬Å¡â€¢/.test(key)) {
    return {
      restaurants: [
        { icon: "ðŸ¥¯", name: "Russ & Daughters", tags: ["bagel", "Lower East Side"], source: "cached_public" },
        { icon: "ðŸ¥ª", name: "Katz's Delicatessen", tags: ["deli", "classic"], source: "cached_public" },
        { icon: "ðŸ•", name: "Joe's Pizza", tags: ["slice", "casual"], source: "cached_public" },
        { icon: "ðŸŒ®", name: "Los Tacos No. 1", tags: ["Chelsea Market", "quick"], source: "cached_public" },
        { icon: "ðŸª", name: "Levain Bakery", tags: ["dessert", "cookie"], source: "cached_public" },
        { icon: "ðŸ¥©", name: "Keens Steakhouse", tags: ["steak", "Midtown"], source: "cached_public" },
        { icon: "ðŸ", name: "Rubirosa", tags: ["Italian", "Nolita"], source: "cached_public" },
        { icon: "â˜•", name: "Balthazar", tags: ["SoHo", "brunch"], source: "cached_public" },
        { icon: "ðŸ°", name: "Magnolia Bakery", tags: ["dessert", "classic"], source: "cached_public" },
        { icon: "ðŸ›’", name: "Chelsea Market", tags: ["food hall", "rain plan"], source: "cached_public" }
      ],
      places: [
        { icon: "ðŸ—½", name: "Statue of Liberty and Ellis Island", tags: ["iconic", "ferry"], source: "cached_public" },
        { icon: "ðŸŒ³", name: "Central Park", tags: ["walk", "classic"], source: "cached_public" },
        { icon: "ðŸŒ‰", name: "Brooklyn Bridge and DUMBO", tags: ["photo", "walk"], source: "cached_public" },
        { icon: "ðŸŽ­", name: "Broadway or Times Square", tags: ["night", "show"], source: "cached_public" },
        { icon: "ðŸ™ï¸", name: "Top of the Rock or Empire State Building", tags: ["view", "skyline"], source: "cached_public" },
        { icon: "ðŸ›ï¸", name: "Fifth Avenue and Macy's Herald Square", tags: ["shopping", "Midtown"], source: "cached_public" },
        { icon: "ðŸ“·", name: "B&H Photo Video", tags: ["camera", "shopping"], source: "cached_public" },
        { icon: "ðŸ›ï¸", name: "The Met or MoMA", tags: ["museum", "rain plan"], source: "cached_public" },
        { icon: "ðŸš¶", name: "High Line and Chelsea Market", tags: ["walk", "food"], source: "cached_public" },
        { icon: "ðŸ•Šï¸", name: "9/11 Memorial and One World Observatory", tags: ["history", "view"], source: "cached_public" },
        { icon: "ðŸ›ï¸", name: "Woodbury Common Premium Outlets", tags: ["day trip", "shopping"], source: "estimated" },
        { icon: "â›¸ï¸", name: "Bryant Park or Rockefeller Center skating", tags: ["winter", "seasonal"], source: "estimated" }
      ]
    };
  }
  if (/japan|tokyo|osaka|kyoto|ì¼ë³¸|ë„ì¿„|ì˜¤ì‚¬ì¹´|êµí† /.test(key)) {
    return {
      restaurants: [
        { icon: "ðŸ£", name: "Tsukiji / Toyosu sushi counter", tags: ["sushi", "market"], source: "estimated" },
        { icon: "ðŸœ", name: "Tokyo ramen alley", tags: ["ramen", "casual"], source: "estimated" },
        { icon: "ðŸ¥©", name: "Wagyu yakiniku table", tags: ["wagyu", "dinner"], source: "estimated" },
        { icon: "ðŸ¢", name: "Osaka kushikatsu stop", tags: ["Osaka", "street food"], source: "estimated" },
        { icon: "ðŸµ", name: "Kyoto tea and wagashi", tags: ["tea", "dessert"], source: "estimated" },
        { icon: "ðŸ›", name: "Japanese curry house", tags: ["comfort", "budget"], source: "estimated" },
        { icon: "â˜•", name: "Kissaten coffee break", tags: ["retro cafÃ©", "slow"], source: "estimated" },
        { icon: "ðŸ±", name: "Ekiben train lunch", tags: ["rail", "local"], source: "estimated" }
      ],
      places: [
        { icon: "ðŸŒƒ", name: "Shibuya Sky or Tokyo Tower view", tags: ["skyline", "night"], source: "estimated" },
        { icon: "ðŸ–¼ï¸", name: "teamLab Planets / Borderless", tags: ["immersive", "indoor"], source: "estimated" },
        { icon: "ðŸŽ¢", name: "Universal Studios Japan", tags: ["theme park", "family"], source: "estimated" },
        { icon: "ðŸ ", name: "Sunshine Aquarium or Osaka Aquarium", tags: ["rain plan", "family"], source: "estimated" },
        { icon: "â›©ï¸", name: "Fushimi Inari early walk", tags: ["Kyoto", "photo"], source: "estimated" },
        { icon: "ðŸŽ‹", name: "Arashiyama bamboo and river", tags: ["Kyoto", "walk"], source: "estimated" },
        { icon: "ðŸ¦Œ", name: "Nara deer park day trip", tags: ["day trip", "family"], source: "estimated" },
        { icon: "â™¨ï¸", name: "Hakone onsen and Mt. Fuji view", tags: ["onsen", "view"], source: "estimated" },
        { icon: "ðŸŽ®", name: "Akihabara retro arcade", tags: ["games", "indoor"], source: "estimated" },
        { icon: "ðŸŽ¤", name: "Karaoke or live jazz night", tags: ["night", "friends"], source: "estimated" },
        { icon: "ðŸ‘˜", name: "Kimono photo walk", tags: ["couple", "memory"], source: "estimated" },
        { icon: "ðŸ›ï¸", name: "Ginza / Harajuku / Dotonbori shopping", tags: ["shopping", "rain plan"], source: "estimated" },
        { icon: "ðŸ§‘â€ðŸ³", name: "Sushi or ramen making class", tags: ["activity", "food"], source: "estimated" },
        { icon: "ðŸ§¸", name: "Ghibli Museum or character cafÃ©", tags: ["ticket needed", "family"], source: "estimated" },
      ]
    };
  }
  if (/sapporo|ì‚¿í¬ë¡œ/.test(key)) {
    return {
      restaurants: [
        { icon: "ðŸœ", name: "Sapporo Ramen Yokocho", tags: ["ramen", "Susukino"], source: "cached_public" },
        { icon: "ðŸ¦€", name: "Nijo Market Seafood", tags: ["market", "seafood"], source: "cached_public" },
        { icon: "ðŸ›", name: "Soup Curry GARAKU", tags: ["soup curry", "central"], source: "cached_public" },
        { icon: "â˜•", name: "MORIHICO CafÃ©", tags: ["coffee", "slow break"], source: "estimated" },
        { icon: "ðŸº", name: "Sapporo Beer Garden", tags: ["beer hall", "classic"], source: "cached_public" }
      ],
      places: [
        { icon: "ðŸŒ³", name: "Odori Park", tags: ["walk", "seasonal"], source: "cached_public" },
        { icon: "ðŸº", name: "Sapporo Beer Museum", tags: ["indoor", "classic"], source: "cached_public" },
        { icon: "ðŸ¦€", name: "Nijo Market", tags: ["morning", "food"], source: "cached_public" },
        { icon: "ðŸŒƒ", name: "JR Tower Observatory", tags: ["night view", "city"], source: "estimated" },
        { icon: "ðŸ›ï¸", name: "Tanukikoji Shopping Street", tags: ["shopping", "covered"], source: "cached_public" }
      ]
    };
  }
  return {
    restaurants: [],
    places: [],
    fallbackNote: alpha03Copy(
      "Specific local candidates need live or curated destination data. ONE can still prepare the trip structure without inventing fake place names.",
      "êµ¬ì²´ì ì¸ í˜„ì§€ í›„ë³´ëŠ” ì‹¤ì‹œê°„ ë˜ëŠ” íë ˆì´ì…˜ ë°ì´í„°ê°€ í•„ìš”í•©ë‹ˆë‹¤. ONEì€ ê°€ì§œ ìž¥ì†Œëª…ì„ ë§Œë“¤ì§€ ì•Šê³  ì—¬í–‰ êµ¬ì¡°ë§Œ ì¤€ë¹„í•©ë‹ˆë‹¤.",
      "Los candidatos locales especÃ­ficos requieren datos en vivo o curados. ONE prepara la estructura sin inventar nombres."
    )
  };
};

const selectAlpha03Items = (items, tone, targetCount) => {
  const keywordMap = {
    food: /ramen|market|seafood|soup|food|meal|table|dining|curry/i,
    value: /market|walk|central|covered|local|park/i,
    rest: /cafÃ©|coffee|park|view|observatory|slow|indoor/i,
    balanced: /central|classic|walk|market|park|landmark/i
  };
  const pattern = keywordMap[tone] || keywordMap.balanced;
  const ranked = [...items].sort((a, b) => Number(pattern.test(`${b.name} ${(b.tags || []).join(" ")}`)) - Number(pattern.test(`${a.name} ${(a.tags || []).join(" ")}`)));
  return ranked.slice(0, targetCount);
};

const refineAlpha03ItemsForCommand = (items = [], result = {}, type = "places") => {
  const missionState = result.missionState || {};
  const structuredText = [
    ...(missionState.hardConstraints || []),
    ...(missionState.foodPreferences || []),
    ...(missionState.interests || []),
    ...(missionState.mobilityRequirements || []),
    ...(missionState.hotelPreferences || [])
  ].join(" ");
  const text = `${result.rawInput || ""} ${result.mission || ""} ${(result.revisionHistory || []).map((item) => item.command).join(" ")} ${structuredText}`.toLowerCase();
  let refined = [...items];
  if (/hate museums|no museums|avoid museums|without museums|ë°•ë¬¼ê´€ ì‹«|ë°•ë¬¼ê´€ ì œì™¸|ë¯¸ìˆ ê´€ ì œì™¸|sin museos|no museos/.test(text)) {
    refined = refined.filter((item) => !/museum|moma|met|gallery|exhibit|ë°•ë¬¼ê´€|ë¯¸ìˆ ê´€|ì „ì‹œ|museo|galer/i.test(`${item.name} ${(item.tags || []).join(" ")}`));
  }
  if (type === "restaurants" && /no seafood|without seafood|avoid seafood|í•´ì‚°ë¬¼|ìƒì„ |sin mariscos/.test(text)) {
    refined = refined.filter((item) => !/seafood|fish|sushi|crab|lobster|oyster|í•´ì‚°ë¬¼|ìƒì„ |ìŠ¤ì‹œ|ì´ˆë°¥|mariscos/i.test(`${item.name} ${(item.tags || []).join(" ")}`));
  }
  const priorities = [
    [/matcha|ë§ì°¨|green tea/i, /matcha|ë§ì°¨|green tea|tea|dessert|wagashi|cafÃ©|cafe|ì¹´íŽ˜|ë””ì €íŠ¸/i],
    [/sushi|ìŠ¤ì‹œ|ì´ˆë°¥/i, /sushi|ìŠ¤ì‹œ|ì´ˆë°¥|tsukiji|toyosu|market/i],
    [/shopping|shop|stores|outlet|ì‡¼í•‘|ì•„ìš¸ë ›|compras|tiendas/i, /shopping|shop|market|mall|outlet|soho|macy|ginza|harajuku|dotonbori|ì‡¼í•‘|ì‹œìž¥|ëª°|ì•„ìš¸ë ›|compras|mercado/i],
    [/nightlife|night view|bars|jazz|late|ì•¼ê²½|ë°¤|ìž¬ì¦ˆ|ë°”|ë‚˜ì´íŠ¸|vida nocturna|noche/i, /night|view|jazz|broadway|skytree|tower|bar|rooftop|ì•¼ê²½|ì „ë§|ìž¬ì¦ˆ|noche/i],
    [/food|restaurant|gourmet|ë§›ì§‘|ìŒì‹|ë¨¹|comida|restaurante/i, /food|restaurant|market|ramen|sushi|deli|pizza|steak|cafÃ©|ë§›ì§‘|ì‹œìž¥|ë¼ë©˜|ìŠ¤ì‹œ|comida|restaurante/i]
  ];
  const matched = priorities.find(([trigger]) => trigger.test(text));
  if (matched) {
    const [, pattern] = matched;
    refined.sort((a, b) => Number(pattern.test(`${b.name} ${(b.tags || []).join(" ")}`)) - Number(pattern.test(`${a.name} ${(a.tags || []).join(" ")}`)));
  }
  if (type === "restaurants" && /dessert|cafe|coffee|ë””ì €íŠ¸|ì¹´íŽ˜|ì»¤í”¼|postre|caf[eÃ©]/i.test(text)) {
    refined.sort((a, b) => Number(/dessert|bakery|cafÃ©|coffee|cookie|tea|ì¹´íŽ˜|ë””ì €íŠ¸/i.test(`${b.name} ${(b.tags || []).join(" ")}`)) - Number(/dessert|bakery|cafÃ©|coffee|cookie|tea|ì¹´íŽ˜|ë””ì €íŠ¸/i.test(`${a.name} ${(a.tags || []).join(" ")}`)));
  }
  const injections = result.orchestrationInjections?.[type] || [];
  if (injections.length) {
    const seen = new Set();
    refined = [...injections, ...refined].filter((item) => {
      const name = String(item?.name || "").toLowerCase();
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }
  return refined;
};

const buildAlpha03DayCards = (journey, destination, result, profile = null) => {
  const { tripDays } = calculateTripDayCounts(result);
  const selectedProfile = profile || getAlpha03DestinationProfile(destination);
  const places = Array.isArray(selectedProfile.places) ? selectedProfile.places : [];
  const restaurants = Array.isArray(selectedProfile.restaurants) ? selectedProfile.restaurants : [];
  const local = alpha03Copy;
  const dayTitle = (index) => {
    if (index === 0) return local("Arrival and first taste", "ë„ì°©ê³¼ ì²« ë¶„ìœ„ê¸°", "Llegada y primer ambiente");
    if (index === tripDays - 1) return local("Checkout and departure", "ì²´í¬ì•„ì›ƒê³¼ ì¶œë°œ", "Checkout y salida");
    return local(`${destination} day ${index + 1}`, `${destination} ${index + 1}ì¼ì°¨`, `DÃ­a ${index + 1} en ${destination}`);
  };
  const middleItems = (index) => {
    const a = places[(index * 2) % Math.max(1, places.length)]?.name;
    const b = places[(index * 2 + 1) % Math.max(1, places.length)]?.name;
    const meal = restaurants[index % Math.max(1, restaurants.length)]?.name;
    const fallback = journey.timeline?.[index % Math.max(1, journey.timeline.length)];
    return [a, meal, b, fallback].filter(Boolean).filter((item, cursor, list) => list.indexOf(item) === cursor).slice(0, 4);
  };
  return Array.from({ length: tripDays }, (_, index) => {
    const isFirst = index === 0;
    const isFinal = index === tripDays - 1;
    const arrivalMeal = restaurants[0]?.name || local("Nearby dinner", "ìˆ™ì†Œ ê·¼ì²˜ ì €ë…", "Cena cerca del hotel");
    const finalMeal = restaurants[(tripDays - 1) % Math.max(1, restaurants.length)]?.name || local("Light breakfast", "ê°€ë²¼ìš´ ì•„ì¹¨", "Desayuno ligero");
    const breakfast = restaurants[(index * 2) % Math.max(1, restaurants.length)]?.name || local("Hotel breakfast", "í˜¸í…” ì¡°ì‹", "Desayuno del hotel");
    const lunch = restaurants[(index * 2 + 1) % Math.max(1, restaurants.length)]?.name || local("Local lunch", "í˜„ì§€ ì ì‹¬", "Almuerzo local");
    const dinner = restaurants[(index * 2 + 2) % Math.max(1, restaurants.length)]?.name || arrivalMeal;
    const morningPlace = places[(index * 2) % Math.max(1, places.length)]?.name || local("Neighborhood walk", "ë™ë„¤ ì‚°ì±…", "Paseo por el barrio");
    const afternoonPlace = places[(index * 2 + 1) % Math.max(1, places.length)]?.name || local("Main attraction", "í•µì‹¬ ìž¥ì†Œ", "AtracciÃ³n principal");
    const eveningPlace = places[(index * 2 + 2) % Math.max(1, places.length)]?.name || local("Evening view", "ì €ë… ì „ë§", "Vista nocturna");
    const items = isFirst
      ? [local("Arrival", "ë„ì°©", "Llegada"), local("Hotel check-in", "í˜¸í…” ì²´í¬ì¸", "Check-in del hotel"), arrivalMeal, places[0]?.name].filter(Boolean).slice(0, 4)
      : isFinal
        ? [finalMeal, local("Hotel checkout", "í˜¸í…” ì²´í¬ì•„ì›ƒ", "Checkout del hotel"), local("Airport transfer", "ê³µí•­ ì´ë™", "Traslado al aeropuerto"), local("Departure", "ì¶œë°œ", "Salida")]
        : middleItems(index);
    const slots = isFinal
      ? [
          ["â˜•", local("Breakfast", "ì•„ì¹¨", "Desayuno"), finalMeal],
          ["ðŸ¨", local("Checkout", "ì²´í¬ì•„ì›ƒ", "Checkout"), local("Hotel checkout", "í˜¸í…” ì²´í¬ì•„ì›ƒ", "Checkout del hotel")],
          ["ðŸš•", local("Transfer", "ì´ë™", "Traslado"), local("Airport transfer", "ê³µí•­ ì´ë™", "Traslado al aeropuerto")],
          ["âœˆï¸", local("Departure", "ì¶œë°œ", "Salida"), local("Departure", "ì¶œë°œ", "Salida")]
        ]
      : isFirst
        ? [
            ["âœˆï¸", local("Arrival", "ë„ì°©", "Llegada"), local("Arrival", "ë„ì°©", "Llegada")],
            ["ðŸ¨", local("Check-in", "ì²´í¬ì¸", "Check-in"), local("Hotel check-in", "í˜¸í…” ì²´í¬ì¸", "Check-in del hotel")],
            ["ðŸ½ï¸", local("Dinner", "ì €ë…", "Cena"), arrivalMeal],
            ["ðŸŒƒ", local("Evening", "ì €ë…", "Noche"), eveningPlace]
          ]
        : [
            ["â˜•", local("Breakfast", "ì•„ì¹¨", "Desayuno"), breakfast],
            ["ðŸ›ï¸", local("Morning", "ì˜¤ì „", "MaÃ±ana"), morningPlace],
            ["ðŸœ", local("Lunch", "ì ì‹¬", "Almuerzo"), lunch],
            ["ðŸ›ï¸", local("Afternoon", "ì˜¤í›„", "Tarde"), afternoonPlace],
            ["ðŸ½ï¸", local("Dinner", "ì €ë…", "Cena"), dinner],
            ["ðŸŒƒ", local("Evening", "ì €ë… í›„", "Noche"), eveningPlace]
          ];
    return { day: `DAY ${index + 1}`, title: dayTitle(index), items, slots };
  });
};
const createAlpha03Card = ({ className, icon, title, badge, tags = [], text = "" }) => `
  <article class="${className}">
    <span class="alpha03-card-icon" aria-hidden="true">${escapeSummaryText(icon)}</span>
    <div>
      <strong>${escapeSummaryText(title)}</strong>
      ${text ? `<p>${escapeSummaryText(text)}</p>` : ""}
      <div class="alpha03-tag-row">
        ${tags.map((tag) => `<span>${escapeSummaryText(tag)}</span>`).join("")}
      </div>
    </div>
  </article>
`;

const getAlpha03HeroTone = (destination = "") => {
  const previewProfile = profileForResult(currentResult || {}, destination);
  if (previewProfile?.hero) {
    return {
      icon: previewProfile.hero.icon,
      className: previewProfile.hero.className,
      line: alpha03Copy(previewProfile.hero.line[0], previewProfile.hero.line[1], previewProfile.hero.line[2])
    };
  }
  const key = String(destination || "").toLowerCase();
  if (/new york|nyc|ë‰´ìš•/.test(key)) return { icon: "ðŸ—½", className: "is-nyc", line: alpha03Copy("Skyline, food, Broadway, neighborhoods.", "ìŠ¤ì¹´ì´ë¼ì¸, ìŒì‹, ë¸Œë¡œë“œì›¨ì´, ë™ë„¤ ê°ì„±.", "Skyline, comida, Broadway y barrios.") };
  if (/japan|tokyo|osaka|kyoto|ì¼ë³¸|ë„ì¿„|ì˜¤ì‚¬ì¹´|êµí† /.test(key)) return { icon: "â›©ï¸", className: "is-japan", line: alpha03Copy("City lights, food alleys, quiet rituals.", "ë„ì‹œì˜ ë¶ˆë¹›, ê³¨ëª© ë§›ì§‘, ì¡°ìš©í•œ ìˆœê°„.", "Luces, comida y momentos tranquilos.") };
  if (/sapporo|ì‚¿í¬ë¡œ/.test(key)) return { icon: "â„ï¸", className: "is-sapporo", line: alpha03Copy("Snow, ramen, warm indoor stops.", "ëˆˆ, ë¼ë©˜, ë”°ëœ»í•œ ì‹¤ë‚´ íœ´ì‹.", "Nieve, ramen y refugios cÃ¡lidos.") };
  return { icon: "âœ¦", className: "is-global", line: alpha03Copy("A clear route, chosen moments, less work.", "ëª…í™•í•œ ë™ì„ , ì„ íƒëœ ìˆœê°„, ì¤„ì–´ë“  ê³ ë¯¼.", "Ruta clara, momentos elegidos, menos trabajo.") };
};

const createAlpha03BudgetItems = (journey, result) => {
  const { tripNights } = calculateTripDayCounts(result);
  const travelers = getTravelPartyDetails(result).travelerCount || 1;
  const hotelNightLabel = `${tripNights} ${alpha03Copy("nights", "ë°•", "noches")}`;
  return [
    ["âœˆï¸", alpha03Copy("Flights", "í•­ê³µ", "Vuelos"), journey.budget],
    ["ðŸ¨", alpha03Copy("Hotels", "ìˆ™ì†Œ", "Hotel"), hotelNightLabel],
    ["ðŸ½ï¸", alpha03Copy("Food", "ì‹ì‚¬", "Comida"), alpha03Copy(`${travelers} traveler${travelers > 1 ? "s" : ""}`, `${travelers}ëª… ê¸°ì¤€`, `${travelers} viajero${travelers > 1 ? "s" : ""}`)],
    ["ðŸš•", alpha03Copy("Transport", "ì´ë™", "Transporte"), alpha03Copy("Route-based", "ë™ì„  ê¸°ì¤€", "SegÃºn ruta")]
  ];
};

const getAlpha03ItemAdvice = (item, type, index) => {
  const name = String(item?.name || "").toLowerCase();
  const ko = activeLanguage === "ko";
  const es = activeLanguage === "es";
  const previewAdvice = previewItemAdvice(item, activeLanguage);
  if (previewAdvice) return previewAdvice;
  if (type === "restaurant") {
    if (/tsukiji|toyosu|sushi|ìŠ¤ì‹œ|ì´ˆë°¥/.test(name)) return ko ? "ì°¸ì¹˜, ìš°ë‹ˆ, ê³„ëž€ì´ˆë°¥ì²˜ëŸ¼ ì‹ ì„ ë„ê°€ ë°”ë¡œ ëŠê»´ì§€ëŠ” ë©”ë‰´ë¥¼ ì¶”ì²œí•´ìš”. ì•„ì¹¨ì´ë‚˜ ì´ë¥¸ ì ì‹¬ì´ ê°€ìž¥ ì¢‹ìŠµë‹ˆë‹¤." : es ? "Pide atÃºn, uni o sushi de huevo; mejor temprano." : "Order tuna, uni, or tamago sushi; it is best early before the rush.";
    if (/ramen|ë¼ë©˜|ichiran/.test(name)) return ko ? "ì§„í•œ êµ­ë¬¼ ë¼ë©˜ì„ ë¨¹ê¸° ì¢‹ì•„ìš”. ë§¤ìš´ë§›ê³¼ ë©´ ìµíž˜ì„ ì·¨í–¥ëŒ€ë¡œ ë§žì¶°ë³´ì„¸ìš”." : es ? "Buen ramen intenso; ajusta picante y textura del fideo." : "Go for rich broth ramen and tune spice/noodle firmness to your taste.";
    if (/wagyu|yakiniku|ì™€ê·œ|ì•¼í‚¤ë‹ˆì¿ /.test(name)) return ko ? "ì™€ê·œë‚˜ ì•¼í‚¤ë‹ˆì¿  ì„¸íŠ¸ê°€ ìž˜ ë§žì•„ìš”. ì €ë… í•˜ì´ë¼ì´íŠ¸ë¡œ ìž¡ìœ¼ë©´ ë§Œì¡±ë„ê°€ ë†’ìŠµë‹ˆë‹¤." : es ? "Wagyu o yakiniku funcionan muy bien para una cena especial." : "Wagyu or yakiniku sets work well as a memorable dinner.";
    if (/takoyaki|okonomiyaki|íƒ€ì½”ì•¼í‚¤|ì˜¤ì½”ë…¸ë¯¸ì•¼í‚¤/.test(name)) return ko ? "íƒ€ì½”ì•¼í‚¤ì™€ ì˜¤ì½”ë…¸ë¯¸ì•¼í‚¤ë¥¼ ê°™ì´ ë¹„êµí•´ ë¨¹ê¸° ì¢‹ì•„ìš”. ì‹œìž¥ ì‚°ì±…ê³¼ ë¬¶ìœ¼ë©´ ìž¬ë¯¸ìžˆìŠµë‹ˆë‹¤." : es ? "Prueba takoyaki y okonomiyaki junto con paseo de mercado." : "Try takoyaki and okonomiyaki together, ideally with a market walk.";
    if (/curry|ì¹´ë ˆ/.test(name)) return ko ? "ì¼ë³¸ì‹ ì¹´ë ˆë‚˜ ëˆì¹´ì¸  ì¹´ë ˆê°€ ë¬´ë‚œí•´ìš”. ì´ë™ ì¤‘ ë¹ ë¥´ê³  ë“ ë“ í•œ í•œ ë¼ë¡œ ì¢‹ìŠµë‹ˆë‹¤." : es ? "El curry japonÃ©s o katsu curry es seguro y rÃ¡pido." : "Japanese curry or katsu curry is a dependable, easy meal.";
    if (/matcha|ë§ì°¨|green tea/.test(name)) return ko ? "ë§ì°¨ ì•„ì´ìŠ¤í¬ë¦¼ì´ë‚˜ ë§ì°¨ íŒŒë¥´íŽ˜ë¥¼ ì¶”ì²œí•´ìš”. ì˜¤í›„ ë””ì €íŠ¸ ì½”ìŠ¤ë¡œ ë„£ê¸° ì¢‹ìŠµë‹ˆë‹¤." : es ? "Prueba helado o parfait de matcha como postre." : "Try matcha ice cream or a matcha parfait as an afternoon dessert.";
    if (/katz|pastrami/.test(name)) return ko ? "íŒŒìŠ¤íŠ¸ë¼ë¯¸ ìƒŒë“œìœ„ì¹˜ê°€ ìœ ëª…í•´ìš”. ì ì‹¬ í”¼í¬ë¥¼ í”¼í•˜ë©´ í›¨ì”¬ íŽ¸í•©ë‹ˆë‹¤." : es ? "Famoso por pastrami; mejor evitar la hora pico." : "Known for pastrami; go just before or after lunch rush.";
    if (/russ|bagel/.test(name)) return ko ? "ë² ì´ê¸€ê³¼ í›ˆì œ ìƒì„ ìœ¼ë¡œ ìœ ëª…í•´ìš”. ì•„ì¹¨ ë™ì„ ì— ë„£ê¸° ì¢‹ìŠµë‹ˆë‹¤." : es ? "Bagels y pescado ahumado; ideal para la maÃ±ana." : "Bagels and smoked fish; best as a morning food stop.";
    if (/pizza|joe/.test(name)) return ko ? "ë‰´ìš•ì‹ ìŠ¬ë¼ì´ìŠ¤ë¥¼ ë¹ ë¥´ê²Œ ë§›ë³´ê¸° ì¢‹ì•„ìš”. ì´ë™ ì¤‘ ê°„ë‹¨í•œ ì‹ì‚¬ë¡œ ë§žìŠµë‹ˆë‹¤." : es ? "Buena parada rÃ¡pida para una slice clÃ¡sica." : "A clean classic-slice stop between neighborhoods.";
    if (/taco|chelsea/.test(name)) return ko ? "ì²¼ì‹œë§ˆì¼“ ê·¼ì²˜ë¼ ì‡¼í•‘·ì‚°ì±…ê³¼ ì—°ê²°í•˜ê¸° ì¢‹ì•„ìš”. ì•„ë„ë°”ë‹¤ë¥¼ ì¶”ì²œí•©ë‹ˆë‹¤." : es ? "Cerca de Chelsea Market; adobada es una opciÃ³n segura." : "Easy Chelsea Market stop; adobada is the safe order.";
    if (/levain|bakery|cookie/.test(name)) return ko ? "ì¿ í‚¤ì™€ ì»¤í”¼ë¡œ ì˜¤í›„ íœ´ì‹ì— ì¢‹ì•„ìš”. ë„ˆë¬´ ëŠ¦ìœ¼ë©´ ì¤„ì´ ê¸¸ ìˆ˜ ìžˆìŠµë‹ˆë‹¤." : es ? "Perfecto para descanso de tarde; puede haber fila." : "Use it as an afternoon dessert break; lines can build.";
    if (/keens|steak|grill|bbq/.test(name)) return ko ? "íŠ¹ë³„í•œ ì €ë… í•œ ë¼ë¡œ ì¢‹ì•„ìš”. ì˜ˆì•½ ê°€ëŠ¥ ì—¬ë¶€ë¥¼ ë¨¼ì € í™•ì¸í•´ì•¼ í•©ë‹ˆë‹¤." : es ? "Buena cena especial; verificar reserva primero." : "Best as one special dinner; verify reservations first.";
    return ko
      ? `${index + 1}ì¼ì°¨ ë™ì„ ì— ë„£ê¸° ì¢‹ì€ ì‹ì‚¬ í›„ë³´ì˜ˆìš”. ëŒ€í‘œ ë©”ë‰´ì™€ ì˜ˆì•½ ê°€ëŠ¥ ì—¬ë¶€ë¥¼ ìŠ¹ì¸ í›„ í™•ì¸í•©ë‹ˆë‹¤.`
      : es
        ? `Buena opciÃ³n para el dÃ­a ${index + 1}; ONE verifica plato recomendado y reserva.`
      : `Good fit for Day ${index + 1}; ONE checks what to order and reservation timing.`;
  }
  if (/universal studios|usj|ìœ ë‹ˆë²„ì„¤/.test(name)) return ko ? "í•´ë¦¬í¬í„°, ë¯¸ë‹ˆì–¸ì¦ˆ, ë‹Œí…ë„ ì›”ë“œì²˜ëŸ¼ ë§Œì¡±ë„ê°€ ë†’ì€ êµ¬ì—­ì„ ë¨¼ì € ìž¡ëŠ” ê²Œ ì¢‹ì•„ìš”." : es ? "Prioriza Harry Potter, Minions o Nintendo World." : "Prioritize Harry Potter, Minions, or Nintendo World before crowds build.";
  if (/teamlab|íŒ€ëž©/.test(name)) return ko ? "ëª°ìž…í˜• ì „ì‹œë¼ ì‚¬ì§„ê³¼ ê¸°ì–µì— ë‚¨ê¸° ì¢‹ì•„ìš”. ë¹„ ì˜¤ëŠ” ë‚  ëŒ€ì•ˆìœ¼ë¡œë„ ì•ˆì •ì ìž…ë‹ˆë‹¤." : es ? "Experiencia inmersiva, buena para fotos y lluvia." : "A memorable immersive stop and a reliable rainy-day option.";
  if (/fushimi|shrine|torii|ì‹ ì‚¬|ì‚¬ì°°/.test(name)) return ko ? "ë¶‰ì€ ë„ë¦¬ì´ ê¸¸ì²˜ëŸ¼ ì‚¬ì§„ í¬ì¸íŠ¸ê°€ ê°•í•´ìš”. ì˜¤ì „ì— ê°€ë©´ í›¨ì”¬ ì—¬ìœ ë¡­ìŠµë‹ˆë‹¤." : es ? "Los torii son perfectos para fotos; mejor por la maÃ±ana." : "The torii gates are the photo moment; mornings feel much calmer.";
  if (/aquarium|ìˆ˜ì¡±ê´€|ì•„ì¿ ì•„ë¦¬ì›€/.test(name)) return ko ? "ì‹¤ë‚´ì—ì„œ ì˜¤ëž˜ ë¨¸ë¬¼ê¸° ì¢‹ì•„ìš”. í•´íŒŒë¦¬·ëŒ€í˜• ìˆ˜ì¡° êµ¬ì—­ì„ ì¤‘ì‹¬ìœ¼ë¡œ ë³´ë©´ ë§Œì¡±ë„ê°€ ë†’ìŠµë‹ˆë‹¤." : es ? "Buen plan interior; busca medusas y tanques grandes." : "A strong indoor stop; jellyfish and large-tank zones are usually the highlights.";
  if (/shibuya|ì‹œë¶€ì•¼|sky/.test(name)) return ko ? "ìŠ¤í¬ëž¨ë¸” êµì°¨ë¡œì™€ ì „ë§ì„ ê°™ì´ ë¬¶ìœ¼ë©´ ë„ì¿„ ëŠë‚Œì´ ë°”ë¡œ ë‚©ë‹ˆë‹¤." : es ? "Combina el cruce y una vista para sentir Tokio." : "Pair the scramble crossing with a skyline view for the Tokyo feeling.";
  if (/nara|deer|ì‚¬ìŠ´/.test(name)) return ko ? "ì‚¬ìŠ´ê³µì›ê³¼ ì‚¬ì°° ì‚°ì±…ì„ ê°™ì´ ìž¡ìœ¼ë©´ í•˜ë£¨ ì—¬í–‰ìœ¼ë¡œ ê¸°ì–µì— ë‚¨ìŠµë‹ˆë‹¤." : es ? "Ciervos y templos juntos hacen una excursiÃ³n memorable." : "Deer park plus temple walking makes it a memorable day trip.";
  if (/hakone|onsen|í›„ì§€|ì˜¨ì²œ/.test(name)) return ko ? "ì˜¨ì²œê³¼ í›„ì§€ì‚° ì „ë§ì„ ê°™ì´ ë…¸ë¦¬ë©´ íœ´ì‹ê°ì´ í½ë‹ˆë‹¤. ì´ë™ ì‹œê°„ì€ ë„‰ë„‰ížˆ ìž¡ì•„ì•¼ í•´ìš”." : es ? "Onsen y vistas al Fuji; deja margen de traslado." : "Onsen plus Fuji views can be special; leave generous transfer time.";
  if (/statue|liberty|ellis/.test(name)) return ko ? "ë‰´ìš• ì²« ë°©ë¬¸ì´ë©´ ìƒì§•ì„±ì´ ê°€ìž¥ ê°•í•´ìš”. íŽ˜ë¦¬ ì‹œê°„ê¹Œì§€ ë¬¶ì–´ì„œ ë³´ëŠ” ê²Œ ì¢‹ìŠµë‹ˆë‹¤." : es ? "Icono de Nueva York; conviene planear ferry y tiempo juntos." : "The most iconic first-visit stop; plan ferry timing with it.";
  if (/central park/.test(name)) return ko ? "ê±·ê¸°ì™€ íœ´ì‹ ê· í˜•ì´ ì¢‹ì•„ìš”. ë‚ ì”¨ ì¢‹ì€ ë‚  ì˜¤ì „ì´ë‚˜ ëŠ¦ì€ ì˜¤í›„ê°€ ì¢‹ìŠµë‹ˆë‹¤." : es ? "Ideal para caminar y descansar; mejor maÃ±ana o tarde." : "Easy walking plus recovery; best morning or late afternoon.";
  if (/broadway|theater/.test(name)) return ko ? "ì €ë… í•˜ì´ë¼ì´íŠ¸ë¡œ ì¢‹ì•„ìš”. ì¢Œì„ê³¼ ê°€ê²©ì€ ì‹¤ì‹œê°„ í™•ì¸ì´ í•„ìš”í•©ë‹ˆë‹¤." : es ? "Gran cierre nocturno; asientos y precio se verifican en vivo." : "A strong night highlight; seats and prices need live check.";
  if (/museum|moma|met|aquarium|indoor/.test(name)) return ko ? "ë¹„ ì˜¤ëŠ” ë‚ ì—ë„ ì•ˆì •ì ì´ì—ìš”. 90ë¶„ ì´ìƒ ì—¬ìœ ë¥¼ ë‘ë©´ ë§Œì¡±ë„ê°€ ë†’ìŠµë‹ˆë‹¤." : es ? "Buena opciÃ³n con lluvia; reserva al menos 90 minutos." : "Reliable indoor option; give it 90+ minutes.";
  if (/market|shopping|macy|soho|outlet|fifth/.test(name)) return ko ? "ì‡¼í•‘ê³¼ ì‹ì‚¬ë¥¼ ê°™ì´ ë¬¶ê¸° ì¢‹ì•„ìš”. ë™ì„ ì„ í•˜ë£¨ì— ëª°ì•„ë‘ë©´ íŽ¸í•©ë‹ˆë‹¤." : es ? "Combina compras y comida; mejor agrupar la zona." : "Good shopping-and-food cluster; keep it on one route.";
  return ko
    ? `${index + 1}ë²ˆì§¸ í•µì‹¬ ìž¥ì†Œì˜ˆìš”. ì‚¬ì§„, ì´ë™ ì‹œê°„, ì£¼ë³€ ì‹ì‚¬ê¹Œì§€ í•¨ê»˜ ë¬¶ì–´ í™•ì¸í•©ë‹ˆë‹¤.`
    : es
      ? `Punto clave ${index + 1}; se conecta con fotos, traslado y comida cercana.`
      : `Highlight ${index + 1}; ONE connects it with timing, photos, and nearby food.`;
};

const createAlpha03VisualCard = (item, type, index) => `
  <article class="alpha03-visual-card alpha03-premium-card is-${type}">
    <div class="alpha03-thumb" aria-hidden="true"><span>${escapeSummaryText(item.icon || (type === "restaurant" ? "ðŸ½ï¸" : "ðŸ“"))}</span></div>
    <div>
      <strong>${escapeSummaryText(item.name)}</strong>
      <p>${escapeSummaryText(getAlpha03ItemAdvice(item, type, index))}</p>
    </div>
  </article>
`;

const createAlpha03JourneyMap = (days, restaurants, places, profile = null) => {
  const destinationProfile = profile || profileForResult(currentResult || {}, getTravelDestinationLabel(currentResult || {}));
  const tileUrl = mapTileUrlForProfile(destinationProfile);
  const markers = buildPreviewMapMarkers(destinationProfile, places, restaurants);
  const fallbackPins = days.slice(0, 7).map((day, index) => ({
    label: day.title,
    category: index % 3 === 0 ? "food" : "place",
    left: [47, 58, 38, 65, 52, 43, 70][index % 7],
    top: [42, 48, 55, 35, 62, 33, 56][index % 7]
  }));
  const pins = markers.length ? markers : fallbackPins;
  const style = tileUrl ? ` style="--map-tile:url('${escapeSummaryText(tileUrl)}')"` : "";
  return `
    <div class="alpha03-map-canvas is-real-preview" aria-label="${escapeSummaryText(alpha03Copy("Map preview", "지도 미리보기", "Vista de mapa"))}"${style}>
      <div class="alpha03-map-tile" aria-hidden="true"></div>
      ${pins.map((pin, index) => `<span class="alpha03-map-pin is-${pin.category}" style="--pin:${index};--x:${pin.left}%;--y:${pin.top}%;" title="${escapeSummaryText(pin.label)}" aria-label="${escapeSummaryText(pin.label)}"><i></i></span>`).join("")}
      <span class="alpha03-map-attribution">© OpenStreetMap contributors · preview</span>
    </div>
  `;
};
const createAlpha03OptionPreviewCard = (group, option, index, selected = false) => `
  <button class="alpha03-preview-option${selected ? " is-selected" : ""}" type="button" data-preview-group="${escapeSummaryText(group)}" data-preview-index="${index}" aria-pressed="${selected ? "true" : "false"}">
    <span>${selected ? "âœ“" : "+"}</span>
    <strong>${escapeSummaryText(option.name)}</strong>
    <em>${escapeSummaryText(option.meta)}</em>
  </button>
`;

const createAlpha03OptionPreview = (journey, result, transportationSummary) => {
  const firstFlightName = result.flights?.[0] ? getFlightName(result.flights[0]) : alpha03Copy("Live flight search", "ì‹¤ì‹œê°„ í•­ê³µ ê²€ìƒ‰", "BÃºsqueda de vuelos");
  const flights = (result.flights || []).slice(0, 8).map((flight) => ({
    name: getFlightName(flight),
    meta: formatRange(flight.estimatedPrice) || journey.budget
  })).concat([
    { name: `${firstFlightName} · Economy`, meta: alpha03Copy("lowest practical fare", "ì‹¤ì† ì¢Œì„", "tarifa prÃ¡ctica") },
    { name: `${firstFlightName} · Business`, meta: alpha03Copy("comfort upgrade check", "íŽ¸ì•ˆí•œ ì¢Œì„ í™•ì¸", "mejora de comodidad") },
    { name: `${firstFlightName} · First`, meta: alpha03Copy("premium cabin check", "í”„ë¦¬ë¯¸ì—„ ì¢Œì„ í™•ì¸", "cabina premium") }
  ]).slice(0, 8);
  const hotels = (result.hotels || []).slice(0, 6).map((hotel) => ({
    name: getHotelName(hotel),
    meta: formatRange(hotel.estimatedNightlyPrice || result.budget?.hotel) || alpha03Copy("Price check", "ê°€ê²© í™•ì¸", "Ver precio")
  })).concat([
    { name: alpha03Copy("Ryokan / traditional stay", "ë£Œì¹¸·ì „í†µ ìˆ™ì†Œ", "Ryokan / alojamiento tradicional"), meta: alpha03Copy("Japan-style stay", "ì¼ë³¸ ê°ì„± ìˆ™ë°•", "estancia japonesa") },
    { name: alpha03Copy("Hostel / budget stay", "í˜¸ìŠ¤í…”·ì‹¤ì† ìˆ™ì†Œ", "Hostal / econÃ³mico"), meta: alpha03Copy("lower cost search", "ë‚®ì€ ë¹„ìš© í™•ì¸", "menor costo") },
    { name: alpha03Copy("Luxury hotel", "ëŸ­ì…”ë¦¬ í˜¸í…”", "Hotel de lujo"), meta: alpha03Copy("service-first option", "ì„œë¹„ìŠ¤ ìš°ì„ ", "servicio premium") }
  ]).slice(0, 8);
  const transfers = [
    { name: alpha03Copy("Airport rail + subway + walk", "ê³µí•­ì² ë„ + ì§€í•˜ì²  + ë„ë³´", "Tren aeropuerto + metro + caminar"), meta: alpha03Copy("route search ready", "ë™ì„  ê²€ìƒ‰ ì¤€ë¹„", "ruta preparada") },
    { name: alpha03Copy("Airport bus + short walk", "ê³µí•­ë²„ìŠ¤ + ì§§ì€ ë„ë³´", "Bus aeropuerto + caminar"), meta: alpha03Copy("simple luggage route", "ì§ ìžˆì„ ë•Œ íŽ¸í•œ ë™ì„ ", "con equipaje") },
    { name: alpha03Copy("JR / metro day route", "JR·ì§€í•˜ì²  í•˜ë£¨ ë™ì„ ", "JR / metro diario"), meta: alpha03Copy("multi-stop route", "ì—¬ëŸ¬ ìž¥ì†Œ ì´ë™", "varias paradas") },
    { name: alpha03Copy("Taxi + walk", "íƒì‹œ + ë„ë³´", "Taxi + caminar"), meta: alpha03Copy("comfort route", "íŽ¸í•œ ì´ë™", "ruta cÃ³moda") },
    { name: alpha03Copy("Private transfer", "ì „ìš© ì´ë™", "Traslado privado"), meta: alpha03Copy("higher cost", "ë†’ì€ ë¹„ìš©", "mayor costo") }
  ];
  transfers.push(
    { name: alpha03Copy("Train + local bus + walk", "ì—´ì°¨ + í˜„ì§€ ë²„ìŠ¤ + ë„ë³´", "Tren + bus local + caminar"), meta: alpha03Copy("regional route", "ì§€ì—­ ì´ë™", "ruta regional") },
    { name: alpha03Copy("Subway pass route", "ì§€í•˜ì²  íŒ¨ìŠ¤ ë™ì„ ", "Ruta con pase de metro"), meta: alpha03Copy("easy repeat rides", "ë°˜ë³µ ì´ë™ì— íŽ¸í•¨", "traslados repetidos") },
    { name: alpha03Copy("Late-night taxi backup", "ì•¼ê°„ íƒì‹œ ëŒ€ì•ˆ", "Taxi nocturno alternativo"), meta: alpha03Copy("after dinner backup", "ì €ë… í›„ ëŒ€ì•ˆ", "despuÃ©s de cenar") }
  );
  const groups = [
    [alpha03Copy("Flights", "í•­ê³µ", "Vuelos"), "flights", flights],
    [alpha03Copy("Hotels", "ìˆ™ì†Œ", "Hotel"), "hotels", hotels],
    [alpha03Copy("Transport", "ì´ë™", "Transporte"), "transport", transfers]
  ];
  return `
    <section class="alpha03-option-preview" aria-label="${escapeSummaryText(alpha03Copy("Selectable travel options", "ì„ íƒ ê°€ëŠ¥í•œ ì—¬í–‰ ì˜µì…˜", "Opciones seleccionables"))}">
      ${groups.map(([title, key, options]) => `
        <div class="alpha03-preview-group">
          <h4>${escapeSummaryText(title)}</h4>
          <div>
            ${(options.length ? options : [{ name: alpha03Copy("Live search ready", "ì‹¤ì‹œê°„ ê²€ìƒ‰ ì¤€ë¹„", "BÃºsqueda en vivo lista"), meta: alpha03Copy("Prepared", "ì¤€ë¹„ë¨", "Preparado") }]).map((option, index) => createAlpha03OptionPreviewCard(key, option, index, index === 0)).join("")}
          </div>
        </div>
      `).join("")}
    </section>
  `;
};

const createAlpha03TimelineHtml = (days) => `
  <section class="alpha03-section alpha03-timeline-redesign">
    <div class="alpha03-section-heading">
      <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Timeline", "ì¼ì •", "Itinerario"))}</span>
      <h3>${escapeSummaryText(alpha03Copy("A full day you can picture", "í•˜ë£¨ê°€ ë°”ë¡œ ê·¸ë ¤ì§€ëŠ” ì¼ì •", "Un dÃ­a fÃ¡cil de imaginar"))}</h3>
    </div>
    <div class="alpha03-timeline-strip">
      ${days.map((day) => {
        const slots = Array.isArray(day.slots) && day.slots.length ? day.slots : [];
        return `
          <article class="alpha03-timeline-card">
            <span>${escapeSummaryText(day.day)}</span>
            <strong>${escapeSummaryText(day.title)}</strong>
            ${slots.map(([icon, label, value]) => `<div class="alpha03-day-slot"><b><i>${escapeSummaryText(icon)}</i>${escapeSummaryText(label)}</b><p>${escapeSummaryText(value)}</p></div>`).join("")}
          </article>
        `;
      }).join("")}
    </div>
  </section>
`;

const createAlpha03ExperienceHtml = (journey, result) => {
  const destination = getTravelDestinationLabel(result);
  const profile = getAlpha03DestinationProfile(destination);
  const workspace = result.alpha04Workspace || null;
  const { tripDays } = calculateTripDayCounts(result);
  const { travelerCount } = getTravelPartyDetails(result);
  let restaurants = selectAlpha03Items(profile.restaurants, journey.tone, Math.min(12, Math.max(6, tripDays + 3)));
  let places = selectAlpha03Items(profile.places, journey.tone, Math.min(12, Math.max(8, tripDays + 2)));
  restaurants = refineAlpha03ItemsForCommand(restaurants, result, "restaurants");
  places = refineAlpha03ItemsForCommand(places, result, "places");
  const days = buildAlpha03DayCards(journey, destination, result, { ...profile, restaurants, places });
  const hero = getAlpha03HeroTone(destination);
  const transportationSummary = journey.tone === "value"
    ? alpha03Copy("Transit-first route with licensed taxi only when it saves energy.", "ëŒ€ì¤‘êµí†µ ì¤‘ì‹¬, ê¼­ í•„ìš”í•  ë•Œë§Œ í—ˆê°€ëœ íƒì‹œë¥¼ ì‚¬ìš©í•©ë‹ˆë‹¤.", "Ruta con transporte pÃºblico y taxi autorizado solo cuando ahorra energÃ­a.")
    : journey.tone === "rest"
      ? alpha03Copy("Short moves, fewer transfers, and more time inside the destination.", "ì§§ì€ ì´ë™, ì ì€ í™˜ìŠ¹, ëª©ì ì§€ì—ì„œ ë¨¸ë¬´ëŠ” ì‹œê°„ì„ ëŠ˜ë¦½ë‹ˆë‹¤.", "Traslados cortos, menos cambios y mÃ¡s tiempo en destino.")
      : alpha03Copy("Walkable core route with official transit or licensed transfer checks.", "ë„ë³´ ê°€ëŠ¥í•œ ì¤‘ì‹¬ ë™ì„ ì— ê³µì‹ êµí†µ ë˜ëŠ” í—ˆê°€ ì´ë™ìˆ˜ë‹¨ì„ í™•ì¸í•©ë‹ˆë‹¤.", "Ruta caminable con transporte oficial o traslado autorizado.");
  const budgetItems = createAlpha03BudgetItems(journey, result);
  const compactBudget = getCompactTravelBudgetLabel(result, journey.budget);
  const schedule = result.schedule || {};
  const dateText = schedule.startDate && schedule.endDate
    ? `${formatAlpha03Date(schedule.startDate)} â†’ ${formatAlpha03Date(schedule.endDate)}`
    : alpha03Copy("Dates flexible", "ë‚ ì§œ ìœ ë™ì ", "Fechas flexibles");
  return `
    <section ${alpha04SectionAttrs(workspace, "journey", `alpha03-recommendation-stage ${hero.className}`)}>
      <div class="alpha03-recommendation-copy">
        <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("ONE Pick", "ONE ì¶”ì²œ", "ONE recomienda"))}</span>
        <h2>${escapeSummaryText(journey.name)}</h2>
        <p>${escapeSummaryText(journey.purpose)}</p>
        <div class="alpha03-recommendation-metrics">
          <span><b>${escapeSummaryText(String(tripDays))}</b><em>${escapeSummaryText(alpha03Copy("days", "ì¼", "dÃ­as"))}</em></span>
          <span><b>${escapeSummaryText(compactBudget)}</b><em>${escapeSummaryText(alpha03Copy("estimated", "ì˜ˆìƒ", "estimado"))}</em></span>
          <span><b>${escapeSummaryText(dateText)}</b><em>${escapeSummaryText(alpha03Copy("dates", "ë‚ ì§œ", "fechas"))}</em></span>
        </div>
        <span class="alpha03-primary-action">${escapeSummaryText(alpha03Copy("Live search ready", "ì‹¤ì‹œê°„ ê²€ìƒ‰ ì¤€ë¹„ ì™„ë£Œ", "BÃºsqueda en vivo lista"))}</span>
      </div>
      <div class="alpha03-recommendation-map" aria-label="${escapeSummaryText(alpha03Copy("Map preview", "ì§€ë„ ë¯¸ë¦¬ë³´ê¸°", "Vista de mapa"))}">
        ${createAlpha03JourneyMap(days, restaurants, places, profile)}
      </div>
    </section>

    <section class="alpha03-budget-breakdown" aria-label="${escapeSummaryText(alpha03Copy("Budget", "ì˜ˆì‚°", "Presupuesto"))}">
      <div>
        <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Budget", "ì˜ˆì‚°", "Presupuesto"))}</span>
        <h3>${escapeSummaryText(compactBudget)}</h3>
      </div>
      <div class="alpha03-budget-grid">
        ${budgetItems.map(([icon, label, value]) => `<span><i>${escapeSummaryText(icon)}</i><b>${escapeSummaryText(label)}</b><em>${escapeSummaryText(value)}</em></span>`).join("")}
      </div>
    </section>

    ${restaurants.length ? `
    <section ${alpha04SectionAttrs(workspace, "restaurants", "alpha03-section")}>
      <div class="alpha03-section-heading">
        <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Food", "ìŒì‹", "Comida"))}</span>
        <h3>${escapeSummaryText(alpha03Copy("Food worth planning around", "ì¼ì •ì— ë„£ì„ ë§Œí•œ ìŒì‹", "Comida que vale planear"))}</h3>
      </div>
      <div class="alpha03-card-grid is-restaurants">
        ${restaurants.map((item, index) => createAlpha03VisualCard(item, "restaurant", index)).join("")}
      </div>
    </section>
    ` : profile.fallbackNote ? `<section class="alpha03-section"><p>${escapeSummaryText(profile.fallbackNote)}</p></section>` : ""}

    ${places.length ? `
    <section ${alpha04SectionAttrs(workspace, "places", "alpha03-section")}>
      <div class="alpha03-section-heading">
        <span class="v23-eyebrow">${escapeSummaryText(alpha03Copy("Places", "ìž¥ì†Œ", "Lugares"))}</span>
        <h3>${escapeSummaryText(alpha03Copy("Places that make the trip feel real", "ì—¬í–‰ì´ ì‚´ì•„ë‚˜ëŠ” ìž¥ì†Œ", "Lugares que hacen real el viaje"))}</h3>
      </div>
      <div class="alpha03-card-grid">
        ${places.map((item, index) => createAlpha03VisualCard(item, "place", index)).join("")}
      </div>
    </section>
    ` : ""}

    ${createAlpha03TimelineHtml(days)}

    ${createAlpha03OptionPreview(journey, result, transportationSummary)}

    <details ${alpha04SectionAttrs(workspace, "preparation", "alpha03-preparation-details")} hidden>
      <summary>${escapeSummaryText(alpha03Copy("Preparation details", "ì¤€ë¹„ ì„¸ë¶€ì‚¬í•­", "Detalles de preparaciÃ³n"))}</summary>
      <div class="v23-detail-grid">
        ${[
          ["insurance", alpha03Copy("Insurance and risk", "ë³´í—˜ê³¼ ë¦¬ìŠ¤í¬", "Seguro y riesgo"), journey.details.insurance, journey.sourceStates.insurance],
          ["entry", alpha03Copy("Entry requirements", "ìž…êµ­ ìš”ê±´", "Requisitos de entrada"), journey.details.entry, journey.sourceStates.entry],
          ["transport-detail", alpha03Copy("Transport details", "êµí†µ ì„¸ë¶€ì‚¬í•­", "Detalles de transporte"), journey.details.transport, journey.sourceStates.transport],
          ["approval-check", alpha03Copy("Before live search", "ì‹¤ì‹œê°„ ê²€ìƒ‰ ì „", "Antes de buscar en vivo"), alpha03Copy("Live price, availability, rules, and material changes are checked before any external action.", "ì™¸ë¶€ ì‹¤í–‰ ì „ ì‹¤ì‹œê°„ ê°€ê²©, ê°€ëŠ¥ ì—¬ë¶€, ê·œì •, ì¤‘ìš”í•œ ë³€ê²½ì‚¬í•­ì„ ë‹¤ì‹œ í™•ì¸í•©ë‹ˆë‹¤.", "Se verifican precio, disponibilidad, reglas y cambios antes de cualquier acciÃ³n externa."), "estimated"]
        ].map(([id, title, body, source]) => `
          <details class="v23-detail-card" data-detail-id="${id}">
            <summary><span>${escapeSummaryText(title)}</span>${createV23SourcePill(source)}</summary>
            <p>${escapeSummaryText(body)}</p>
          </details>
        `).join("")}
      </div>
    </details>

    <div ${alpha04SectionAttrs(workspace, "approval", "v23-approval-preview")}>
      <strong>${escapeSummaryText(alpha03Copy("Live Search Ready", "ì‹¤ì‹œê°„ ê²€ìƒ‰ ì¤€ë¹„ ì™„ë£Œ", "BÃºsqueda en vivo lista"))}</strong>
    </div>
  `;
};


const createV23TravelDetailHtml = (journey, result) => {
  return createAlpha03ExperienceHtml(journey, result);
};

const createTravelPackagesCard = (result, missionContext) => {
  const journeys = buildV23TravelJourneys(result, missionContext);
  const selectedIndex = Math.max(0, journeys.findIndex((journey) => journey.selected));
  const article = document.createElement("article");
  article.className = "mission-card is-wide travel-package-card v23-travel-experience product-refined-results";
  article.dataset.cardId = "travel-experiences";
  article.innerHTML = `
    <div class="v23-journey-layout product-journey-layout is-compact">
      <div class="v23-alternative-journeys" aria-label="${escapeSummaryText(v22Local("Compare alternatives", "ë‹¤ë¥¸ ì„ íƒì§€ ë¹„êµ", "Comparar alternativas"))}">
        ${journeys.slice(0, 4).map((journey, index) => `
          <button class="v23-journey-card${selectedIndex === index ? " is-selected" : ""}" type="button" data-journey-index="${index}" aria-pressed="${selectedIndex === index}">
            ${renderV23JourneyCardInner(journey, false, result)}
          </button>
        `).join("")}
      </div>
    </div>
    <section class="v23-selected-journey" aria-live="polite">${createV23TravelDetailHtml(journeys[selectedIndex], result)}</section>
  `;
  article._v23Journeys = journeys;
  return article;
};

function renderV23JourneyCardInner(journey, featured, result) {
  const budget = result ? getCompactTravelBudgetLabel(result, journey.budget) : journey.budget;
  return `
    ${featured ? `<span class="v23-selected-badge">${escapeSummaryText(v22Local("ONE recommended trip", "ONE ì¶”ì²œ ì—¬í–‰", "Viaje recomendado por ONE"))}</span>` : ""}
    <strong>${escapeSummaryText(journey.name)}</strong>
    ${featured ? `<p>${escapeSummaryText(journey.reason)}</p>` : ""}
    <div class="v23-journey-meta">
      <span>${escapeSummaryText(journey.duration)}</span>
      <span>${escapeSummaryText(budget)}</span>
    </div>
    ${featured ? `<em class="v23-card-cta">${escapeSummaryText(v22Local("View this plan", "ì´ ì¼ì • ë³´ê¸°", "Ver este plan"))}</em>` : `<small>${escapeSummaryText((journey.tags || []).slice(0, 3).join(" · "))}</small>`}
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
    if (badge) badge.textContent = selectedCard ? v22Local("Selected", "ì„ íƒë¨", "Seleccionado") : v22Local("Choose", "ì„ íƒ", "Elegir");
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
    dismiss: v22Local("Dismiss", "ë‹«ê¸°", "Descartar"),
    later: v22Local("Remind later", "ë‚˜ì¤‘ì— ë³´ê¸°", "Recordar luego"),
    hide: v22Local("Hide for this mission", "ì´ ë¯¸ì…˜ì—ì„œ ìˆ¨ê¸°ê¸°", "Ocultar en esta misiÃ³n")
  };
  const renderInsight = (insight, compact = false) => `
    <article class="alpha-insight-row" data-insight-id="${escapeSummaryText(insight.id)}">
      <div class="alpha-insight-main">
        <span class="alpha-insight-urgency is-${escapeSummaryText(insight.urgency)}">${escapeSummaryText(sourceStateUserLabel(insight.sourceState, language))}</span>
        <h3>${escapeSummaryText(insight.title)}</h3>
        <p>${escapeSummaryText(insight.explanation)}</p>
        ${compact ? "" : `<details><summary>${escapeSummaryText(v22Local("Why am I seeing this?", "ì™œ ë³´ì—¬ì£¼ë‚˜ìš”?", "Â¿Por quÃ© aparece?"))}</summary><p>${escapeSummaryText(insight.why)}</p></details>`}
      </div>
      <div class="alpha-insight-meta">
        <span>${escapeSummaryText(v22Local("Urgency", "ê¸´ê¸‰ë„", "Urgencia"))}: ${escapeSummaryText(insight.urgency)}</span>
        <span>${escapeSummaryText(v22Local("Confidence", "ì‹ ë¢°ë„", "Confianza"))}: ${Math.round(Number(insight.confidence || 0) * 100)}%</span>
        <span>${escapeSummaryText(v22Local("Action", "ì‚¬ìš©ìž í–‰ë™", "AcciÃ³n"))}: ${escapeSummaryText(insight.actionRequired ? v22Local("Optional decision", "ì„ íƒ ê²°ì •", "DecisiÃ³n opcional") : v22Local("No action required", "í•„ìˆ˜ í–‰ë™ ì—†ìŒ", "Sin acciÃ³n requerida"))}</span>
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
      <h2>${escapeSummaryText(v22Local("Things worth knowing", "ì•Œì•„ë‘ë©´ ì¢‹ì€ ê²ƒ", "Cosas que conviene saber"))}</h2>
      <p>${escapeSummaryText(v22Local(
        "ONE prepared these quietly so you can decide with less mental effort.",
        "ONEì´ ê²°ì • ë¶€ë‹´ì„ ì¤„ì´ê¸° ìœ„í•´ ì¡°ìš©ížˆ ì¤€ë¹„í•œ ì°¸ê³ ì‚¬í•­ì´ì—ìš”.",
        "ONE preparÃ³ esto para reducir tu esfuerzo mental."
      ))}</p>
    </div>
    <div class="alpha-insight-list">${visible.map((insight) => renderInsight(insight)).join("")}</div>
    ${collapsed.length ? `
      <details class="alpha-insight-more">
        <summary>${escapeSummaryText(v22Local("More optional insights", "ì¶”ê°€ ì°¸ê³ ì‚¬í•­", "MÃ¡s consejos opcionales"))} · ${collapsed.length}</summary>
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

const readConciergeState = (result) => {
  try {
    return createConciergeState(JSON.parse(localStorage.getItem(conciergeStorageKey(result)) || "{}"));
  } catch {
    return createConciergeState();
  }
};

const writeConciergeState = (result, state) => {
  try {
    localStorage.setItem(conciergeStorageKey(result), JSON.stringify(state));
  } catch {
    // Concierge controls are helpful, but local persistence must never block mission review.
  }
};

const conciergeSourceLabel = (state) => {
  const labels = {
    verified_live: v22Local("Provider evidence", "ì œê³µì—…ì²´ ê·¼ê±°", "Evidencia del proveedor"),
    cached_public: v22Local("Public evidence", "ê³µê°œ ì •ë³´ ê·¼ê±°", "Evidencia pÃºblica"),
    estimated: v22Local("Estimated", "ì˜ˆìƒ", "Estimado"),
    demo: v22Local("Demo evidence", "ë°ëª¨ ê·¼ê±°", "Evidencia demo"),
    setup_required: v22Local("Setup required", "ì„¤ì • í•„ìš”", "ConfiguraciÃ³n necesaria"),
    unavailable: v22Local("Temporarily limited", "ì¼ì‹œ ì œí•œ", "Limitado temporalmente")
  };
  return labels[state] || labels.estimated;
};

const conciergePriorityLabel = (priority) => {
  const labels = {
    critical: v22Local("Critical", "ê¸´ê¸‰", "CrÃ­tico"),
    high: v22Local("High", "ë†’ìŒ", "Alta"),
    medium: v22Local("Medium", "ë³´í†µ", "Media"),
    low: v22Local("Low", "ë‚®ìŒ", "Baja")
  };
  return labels[priority] || labels.medium;
};

const conciergeBenefitText = (benefit = {}) => {
  const parts = [];
  if (Number.isFinite(Number(benefit.timeSavedMinutes))) parts.push(v22Local(`Saves ${benefit.timeSavedMinutes} min`, `${benefit.timeSavedMinutes}ë¶„ ì ˆì•½`, `Ahorra ${benefit.timeSavedMinutes} min`));
  if (Number.isFinite(Number(benefit.walkingReducedKm))) parts.push(v22Local(`Walk ${benefit.walkingReducedKm} km less`, `ë„ë³´ ${benefit.walkingReducedKm}km ê°ì†Œ`, `${benefit.walkingReducedKm} km menos`));
  if (Number.isFinite(Number(benefit.moneySaved))) parts.push(v22Local(`Saves about ${formatKRW(Number(benefit.moneySaved))}`, `ì•½ ${formatKRW(Number(benefit.moneySaved))} ì ˆì•½`, `Ahorra aprox. ${formatKRW(Number(benefit.moneySaved))}`));
  if (Number.isFinite(Number(benefit.comfortImproved))) parts.push(v22Local("Comfort improves", "íŽ¸ì•ˆí•¨ ê°œì„ ", "Mejora comodidad"));
  if (Number.isFinite(Number(benefit.accessibilityImproved))) parts.push(v22Local("Accessibility improves", "ì ‘ê·¼ì„± ê°œì„ ", "Mejora accesibilidad"));
  if (Number.isFinite(Number(benefit.missionQuality))) parts.push(v22Local("Plan quality improves", "ì¼ì • ì™„ì„±ë„ ê°œì„ ", "Mejora calidad"));
  return parts.length ? parts.join(" · ") : v22Local("No measurable live value yet", "ì•„ì§ ì¸¡ì • ê°€ëŠ¥í•œ ì‹¤ì‹œê°„ ìˆ˜ì¹˜ ì—†ìŒ", "Sin valor medible en vivo aÃºn");
};

const markConciergePatchAccepted = (recommendation) => {
  if (!recommendation?.patch?.target) return;
  const target = recommendation.patch.target;
  missionGrid.querySelectorAll(`[data-section-id="${target}"], [data-card-id="${target}"], .alpha03-section`).forEach((node) => {
    if (node.dataset.sectionId === target || node.dataset.cardId === target || node.textContent.toLowerCase().includes(target)) {
      node.classList.add("is-concierge-updated");
      node.dataset.conciergeUpdate = recommendation.title;
    }
  });
};

const createAIConciergeCard = (result) => {
  if (!isExperienceMission(result, result?.missionContext) && result?.type !== "travel") return null;
  const params = new URLSearchParams(window.location.search);
  const state = readConciergeState(result);
  const concierge = createAITravelConcierge({
    result,
    language: activeLanguage,
    state,
    scenario: params.get("conciergeScenario") || result.conciergeScenario || ""
  });
  if (concierge.status === "limited" && !isFounderDiagnosticsMode()) return null;
  const article = document.createElement("article");
  article.className = "mission-card is-wide ai-concierge-card";
  article.dataset.cardId = "ai-travel-concierge";
  const actions = {
    accept: v22Local("Accept", "ì ìš©", "Aceptar"),
    dismiss: v22Local("Dismiss", "ë‹«ê¸°", "Descartar"),
    remind_later: v22Local("Remind later", "ë‚˜ì¤‘ì—", "Recordar"),
    never_ask_again: v22Local("Never ask again", "ë‹¤ì‹œ ë¬»ì§€ ì•Šê¸°", "No preguntar")
  };
  const recommendations = concierge.recommendations.length ? concierge.recommendations.map((rec) => `
    <article class="ai-concierge-recommendation is-${escapeSummaryText(rec.priority)}" data-concierge-id="${escapeSummaryText(rec.id)}">
      <div class="ai-concierge-row-head">
        <span>${escapeSummaryText(conciergePriorityLabel(rec.priority))}</span>
        <strong>${escapeSummaryText(rec.title)}</strong>
      </div>
      <p>${escapeSummaryText(rec.reason)}</p>
      <div class="ai-concierge-benefit">${escapeSummaryText(rec.expectedBenefit)}</div>
      <div class="ai-concierge-meta">
        <span>${escapeSummaryText(conciergeBenefitText(rec.benefit))}</span>
        <span>${escapeSummaryText(v22Local("Confidence", "ì‹ ë¢°ë„", "Confianza"))}: ${Math.round(rec.confidence)}%</span>
        <span>${escapeSummaryText(conciergeSourceLabel(rec.sourceState))}${rec.retrievedAt ? ` · ${escapeSummaryText(formatAlpha04Time(rec.retrievedAt))}` : ""}</span>
      </div>
      <div class="ai-concierge-components">
        ${rec.affectedComponents.map((component) => `<span>${escapeSummaryText(component)}</span>`).join("")}
      </div>
      <div class="ai-concierge-actions">
        ${Object.entries(actions).map(([action, label]) => `<button type="button" data-concierge-action="${action}">${escapeSummaryText(label)}</button>`).join("")}
      </div>
    </article>
  `).join("") : `
    <div class="ai-concierge-limited">
      <strong>${escapeSummaryText(v22Local("Concierge is standing by", "ì»¨ì‹œì–´ì§€ê°€ ëŒ€ê¸° ì¤‘ìž…ë‹ˆë‹¤", "Concierge estÃ¡ listo"))}</strong>
      <p>${escapeSummaryText(concierge.limitations[0] || v22Local("Live provider updates are not available right now.", "ì§€ê¸ˆì€ ì‹¤ì‹œê°„ ì œê³µì—…ì²´ ì—…ë°ì´íŠ¸ê°€ ì—†ìŠµë‹ˆë‹¤.", "No hay actualizaciones en vivo ahora."))}</p>
    </div>
  `;
  const accepted = concierge.acceptedRecommendations.length ? `
    <details class="ai-concierge-accepted">
      <summary>${escapeSummaryText(v22Local("Accepted improvements", "ì ìš©í•œ ê°œì„ ", "Mejoras aceptadas"))} · ${concierge.acceptedRecommendations.length}</summary>
      <ul>${concierge.acceptedRecommendations.map((rec) => `<li>${escapeSummaryText(rec.title)}</li>`).join("")}</ul>
    </details>
  ` : "";
  article.innerHTML = `
    <div class="ai-concierge-heading">
      <span class="v23-eyebrow">${escapeSummaryText(AI_TRAVEL_CONCIERGE_VERSION)}</span>
      <h2>${escapeSummaryText(v22Local("ONE Concierge", "ONE ì»¨ì‹œì–´ì§€", "Concierge ONE"))}</h2>
      <p>${escapeSummaryText(v22Local(
        "Helpful improvements only. Nothing changes unless you choose it.",
        "ë„ì›€ ë˜ëŠ” ê°œì„ ë§Œ ë³´ì—¬ë“œë¦½ë‹ˆë‹¤. ì„ íƒí•˜ê¸° ì „ì—ëŠ” ì•„ë¬´ê²ƒë„ ë°”ê¾¸ì§€ ì•ŠìŠµë‹ˆë‹¤.",
        "Solo mejoras Ãºtiles. Nada cambia hasta que tÃº lo eliges."
      ))}</p>
      <div class="ai-concierge-score">
        <span>${escapeSummaryText(v22Local("Mission score", "ë¯¸ì…˜ ì ìˆ˜", "PuntuaciÃ³n"))}</span>
        <strong>${Math.round(concierge.missionScore)}</strong>
      </div>
    </div>
    <div class="ai-concierge-list">${recommendations}</div>
    ${accepted}
  `;
  article.addEventListener("click", (event) => {
    const button = event.target?.closest?.("[data-concierge-action]");
    if (!button) return;
    const row = button.closest("[data-concierge-id]");
    const recommendation = concierge.recommendations.find((rec) => rec.id === row?.dataset.conciergeId);
    if (!recommendation) return;
    const nextState = applyConciergeRecommendation(readConciergeState(result), recommendation, button.dataset.conciergeAction);
    writeConciergeState(result, nextState);
    if (button.dataset.conciergeAction === "accept") {
      markConciergePatchAccepted(recommendation);
      row.classList.add("is-accepted");
      row.querySelector(".ai-concierge-actions").innerHTML = `<button type="button" data-concierge-action="undo">${escapeSummaryText(v22Local("Undo", "ë˜ëŒë¦¬ê¸°", "Deshacer"))}</button>`;
    } else if (button.dataset.conciergeAction === "undo") {
      const undoneState = applyConciergeRecommendation(readConciergeState(result), recommendation, "undo");
      writeConciergeState(result, undoneState);
      row.classList.remove("is-accepted");
    } else {
      row.classList.add("is-dismissed");
      row.setAttribute("aria-hidden", "true");
    }
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
        <span class="alpha02-priority">${escapeSummaryText(question.priority === "critical" ? v22Local("Critical", "ì¤‘ìš”", "CrÃ­tico") : question.priority === "high" ? v22Local("High value", "ê°€ì¹˜ ë†’ìŒ", "Alto valor") : v22Local("Helpful", "ë„ì›€ë¨", "Ãštil"))}</span>
        <h3>${escapeSummaryText(question.titleText)}</h3>
        <p>${escapeSummaryText(question.explanationText)}</p>
      </div>
      <div class="alpha02-chip-row" role="group" aria-label="${escapeSummaryText(question.titleText)}">
        ${question.choices.map((choice) => `<button type="button" class="alpha02-answer-chip" data-answer-value="${escapeSummaryText(choice.value)}">${escapeSummaryText(choice.labelText)}</button>`).join("")}
      </div>
      ${compact ? "" : `<p class="alpha02-impact">${escapeSummaryText(question.improvementText)}</p>`}
      <div class="alpha02-question-actions">
        <button type="button" data-refinement-action="skip">${escapeSummaryText(v22Local("Skip", "ê±´ë„ˆë›°ê¸°", "Saltar"))}</button>
        <button type="button" data-refinement-action="later">${escapeSummaryText(v22Local("Later", "ë‚˜ì¤‘ì—", "Luego"))}</button>
        <button type="button" data-refinement-action="hide">${escapeSummaryText(v22Local("Don't ask again", "ë‹¤ì‹œ ë¬»ì§€ ì•Šê¸°", "No preguntar otra vez"))}</button>
      </div>
    </article>
  `;
  const article = document.createElement("article");
  article.className = "mission-card is-wide alpha02-refinement-card";
  article.dataset.cardId = "progressive-refinement-alpha02";
  article.dataset.alpha02Wired = "direct";
  article.innerHTML = `
    <div class="alpha02-heading">
      <span class="v23-eyebrow">${escapeSummaryText(v22Local("Quick adjustment", "ë¹ ë¥¸ ë§žì¶¤ ì„¤ì •", "Ajuste rÃ¡pido"))}</span>
      <h2>${escapeSummaryText(v22Local("Make this fit you better", "ì›í•˜ëŠ” ë°©ì‹ì— ë” ë§žì¶°ë³¼ê¹Œìš”?", "Hacer que encaje mejor contigo"))}</h2>
      <p>${escapeSummaryText(v22Local(
        "This recommendation is already good. Answering only what matters can make it more personal.",
        "ì´ ì¶”ì²œì€ ì´ë¯¸ ì§„í–‰í•  ìˆ˜ ìžˆì–´ìš”. ì¤‘ìš”í•œ ê²ƒë§Œ ë‹µí•˜ë©´ ë” ê°œì¸í™”ë©ë‹ˆë‹¤.",
        "Esta recomendaciÃ³n ya sirve. Responder solo lo importante la vuelve mÃ¡s personal."
      ))}</p>
    </div>
    ${result.alpha02LastUpdate ? `<div class="alpha02-update-note" role="status">${escapeSummaryText(result.alpha02LastUpdate)}</div>` : ""}
    ${refinement.visible.length ? `<div class="alpha02-visible-questions">${refinement.visible.map((question) => renderQuestion(question)).join("")}</div>` : `<p class="alpha02-empty">${escapeSummaryText(v22Local("No extra question is needed right now.", "ì§€ê¸ˆì€ ì¶”ê°€ ì§ˆë¬¸ì´ í•„ìš”í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.", "No hace falta otra pregunta ahora."))}</p>`}
    ${refinement.collapsed.length ? `
      <details class="alpha02-more">
        <summary>${escapeSummaryText(v22Local("Helpful questions", "ë„ì›€ ë˜ëŠ” ì§ˆë¬¸", "Preguntas Ãºtiles"))} · ${refinement.collapsed.length}</summary>
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
  const title = v22Local("World Intelligence status", "ì›”ë“œ ì¸í…”ë¦¬ì „ìŠ¤ ìƒíƒœ", "Estado de inteligencia mundial");
  const subtitle = v22Local(
    "ONE separates verified, public, estimated, and unavailable data before planning.",
    "ONEì€ ê³„íš ì „ì— ê²€ì¦·ê³µê°œ·ì˜ˆìƒ·ë¶ˆê°€ ë°ì´í„°ë¥¼ ë¶„ë¦¬í•©ë‹ˆë‹¤.",
    "ONE separa datos verificados, pÃºblicos, estimados y no disponibles antes de planificar."
  );
  const sourceRows = ["verified_live", "cached_public", "estimated", "placeholder", "unavailable"].map((state) => `
    <span class="v24-source-chip is-${state}">
      <strong>${escapeSummaryText(sourceStateUserLabel(state, language))}</strong>
      <small>${Number(breakdown[state] || 0)}</small>
    </span>
  `).join("");
  const failureRows = failures.length
    ? failures.slice(0, 4).map((failure) => `<li>${escapeSummaryText(failure.providerType || "provider")}: ${escapeSummaryText(failure.message || "")}</li>`).join("")
    : `<li>${escapeSummaryText(v22Local("No adapter failures reported.", "ì–´ëŒ‘í„° ì˜¤ë¥˜ ì—†ìŒ", "Sin fallos de adaptador."))}</li>`;
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
      <span>${escapeSummaryText(v22Local("Cache health", "ìºì‹œ ìƒíƒœ", "Estado de cachÃ©"))}: ${escapeSummaryText(foundation.cache?.health || "unknown")}</span>
      <span>${escapeSummaryText(v22Local("Confidence", "ì‹ ë¢°ë„", "Confianza"))}: ${Math.round(Number(foundation.averageConfidence || 0) * 100)}%</span>
      <span>${escapeSummaryText(v22Local("Fixture mode", "í”½ìŠ¤ì²˜ ëª¨ë“œ", "Modo fixture"))}: ${foundation.fixtureMode ? "on" : "off"}</span>
    </div>
    <details class="v24-source-failures">
      <summary>${escapeSummaryText(v22Local("Provider notes", "ì œê³µì—…ì²´ ë©”ëª¨", "Notas de proveedor"))}</summary>
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
  return `<span class="alpha04-update-badge" title="${escapeSummaryText(getSectionUpdateReason(workspace, sectionKey))}">${escapeSummaryText(alpha04Local("Updated", "ì—…ë°ì´íŠ¸", "Actualizado"))}</span>`;
};

const alpha04SectionAttrs = (workspace, sectionKey, className) => {
  const updated = sectionWasRecentlyUpdated(workspace, sectionKey);
  const reason = updated ? ` data-alpha04-update-reason="${escapeSummaryText(getSectionUpdateReason(workspace, sectionKey))}"` : "";
  return `class="${className}${updated ? " is-recently-updated" : ""}" data-section-id="${sectionKey}"${reason}`;
};

const isFounderDiagnosticsMode = () => {
  const params = new URLSearchParams(window.location.search);
  return ["1", "true", "yes"].includes(String(params.get("debug") || params.get("founder") || params.get("diagnostics") || "").toLowerCase());
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
    : `<li>${escapeSummaryText(alpha04Local("No pending task right now", "ì§€ê¸ˆì€ ë‚¨ì€ ìž‘ì—…ì´ ì—†ìŠµë‹ˆë‹¤", "No hay tareas pendientes ahora"))}</li>`;
  const notifications = workspace.notifications.length
    ? workspace.notifications.map((notice) => `<li class="is-${escapeSummaryText(notice.level)}">${escapeSummaryText(notice.label)}</li>`).join("")
    : `<li>${escapeSummaryText(alpha04Local("No urgent update. ONE is keeping the workspace ready.", "ê¸´ê¸‰ ì—…ë°ì´íŠ¸ëŠ” ì—†ìŠµë‹ˆë‹¤. ONEì´ ìž‘ì—… ê³µê°„ì„ ì¤€ë¹„ ìƒíƒœë¡œ ìœ ì§€í•©ë‹ˆë‹¤.", "No hay actualizaciÃ³n urgente. ONE mantiene el espacio listo."))}</li>`;
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
        <span>${escapeSummaryText(approval.executionApproved ? alpha04Local("Execution approved", "ì‹¤í–‰ ìŠ¹ì¸", "EjecuciÃ³n aprobada") : alpha04Local("Preparation only", "ì¤€ë¹„ë§Œ ìŠ¹ì¸", "Solo preparaciÃ³n"))}</span>
      </li>
    `).join("")
    : `<li><strong>${escapeSummaryText(alpha04Local("No approval yet", "ì•„ì§ ìŠ¹ì¸ ì—†ìŒ", "Sin aprobaciÃ³n todavÃ­a"))}</strong><span>${escapeSummaryText(alpha04Local("Search approval and booking approval stay separate.", "ê²€ìƒ‰ ìŠ¹ì¸ê³¼ ì˜ˆì•½ ìŠ¹ì¸ì€ ë¶„ë¦¬ë©ë‹ˆë‹¤.", "La aprobaciÃ³n de bÃºsqueda y reserva se separan."))}</span></li>`;
  card.innerHTML = `
    <div class="alpha04-workspace-header">
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA04_LIVING_MISSION_VERSION)} · ${escapeSummaryText(alpha04Local("Living Mission", "ì‚´ì•„ìžˆëŠ” ë¯¸ì…˜", "MisiÃ³n viva"))}</span>
      <h2>${escapeSummaryText(alpha04Local("Mission Workspace", "ë¯¸ì…˜ ìž‘ì—… ê³µê°„", "Espacio de misiÃ³n"))}</h2>
      <p>${escapeSummaryText(alpha04Local(
        "ONE keeps this mission alive as your choices, timing, providers, and world data change.",
        "ONEì€ ì„ íƒ, ì¼ì •, ì œê³µì—…ì²´, ì›”ë“œ ë°ì´í„°ê°€ ë°”ë€” ë•Œë§ˆë‹¤ ì´ ë¯¸ì…˜ì„ ì‚´ì•„ìžˆëŠ” ìƒíƒœë¡œ ìœ ì§€í•©ë‹ˆë‹¤.",
        "ONE mantiene esta misiÃ³n viva cuando cambian tus elecciones, horarios, proveedores y datos."
      ))}</p>
    </div>
    <div class="alpha04-compact-summary" aria-label="${escapeSummaryText(alpha04Local("Mission summary", "ë¯¸ì…˜ ìš”ì•½", "Resumen de misiÃ³n"))}">
      <div><span>${escapeSummaryText(alpha04Local("Mission", "ë¯¸ì…˜", "MisiÃ³n"))}</span><strong>${escapeSummaryText(workspace.mission)}</strong></div>
      <div><span>${escapeSummaryText(alpha04Local("Status", "ìƒíƒœ", "Estado"))}</span><strong>${escapeSummaryText(workspace.status.label)}</strong></div>
      <div><span>${escapeSummaryText(alpha04Local("Progress", "ì§„í–‰", "Progreso"))}</span><strong>${workspace.progress}%</strong></div>
      <div><span>${escapeSummaryText(alpha04Local("Updated", "ì—…ë°ì´íŠ¸", "Actualizado"))}</span><strong>${escapeSummaryText(formatAlpha04Time(workspace.lastUpdated))}</strong></div>
      <div><span>${escapeSummaryText(alpha04Local("Next", "ë‹¤ìŒ", "Siguiente"))}</span><strong>${escapeSummaryText(workspace.nextAction)}</strong></div>
    </div>
    <div class="alpha04-stage-row">
      ${workspace.stages.map((stage) => `<span class="alpha04-stage is-${escapeSummaryText(stage.state)}">${escapeSummaryText(stage.label)}</span>`).join("")}
    </div>
    <div class="alpha04-workspace-grid">
      <section class="alpha04-panel">
        <h3>${escapeSummaryText(alpha04Local("Remaining tasks", "ë‚¨ì€ ìž‘ì—…", "Tareas pendientes"))}</h3>
        <ul class="alpha04-task-list">${pendingTasks}</ul>
      </section>
      <section class="alpha04-panel">
        <h3>${escapeSummaryText(alpha04Local("Mission updates", "ë¯¸ì…˜ ì—…ë°ì´íŠ¸", "Actualizaciones"))}</h3>
        <ul class="alpha04-notification-list">${notifications}</ul>
      </section>
    </div>
    <details class="alpha04-history-panel" data-alpha04-detail-id="mission-history">
      <summary>${escapeSummaryText(alpha04Local("Mission history", "ë¯¸ì…˜ ížˆìŠ¤í† ë¦¬", "Historial de misiÃ³n"))}</summary>
      <ul>${historyRows}</ul>
    </details>
    <details class="alpha04-history-panel" data-alpha04-detail-id="approval-history">
      <summary>${escapeSummaryText(alpha04Local("Approval history", "ìŠ¹ì¸ ížˆìŠ¤í† ë¦¬", "Historial de aprobaciÃ³n"))}</summary>
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
        <ul>${items || `<li class="alpha05-empty">${escapeSummaryText(alpha04Local("Nothing here right now.", "ì§€ê¸ˆì€ ì—†ìŠµë‹ˆë‹¤.", "Nada aquÃ­ ahora."))}</li>`}</ul>
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
    ? alpha04Local("Approval-safe", "ìŠ¹ì¸ ì•ˆì „", "Seguro con aprobaciÃ³n")
    : alpha04Local("Needs review", "ê²€í†  í•„ìš”", "Necesita revisiÃ³n");

  card.innerHTML = `
    <div class="alpha05-orchestrator-header">
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA05_EXECUTION_ORCHESTRATOR_VERSION)} · ${escapeSummaryText(alpha04Local("Execution Orchestrator", "ì‹¤í–‰ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°", "Orquestador de ejecuciÃ³n"))}</span>
      <h2>${escapeSummaryText(alpha04Local("Mission Board", "ë¯¸ì…˜ ë³´ë“œ", "Tablero de misiÃ³n"))}</h2>
      <p>${escapeSummaryText(alpha04Local(
        "ONE now coordinates actions, dependencies, approval scopes, status, and recovery instead of showing only a passive plan.",
        "ONEì€ ì´ì œ ë‹¨ìˆœ ê³„íšì´ ì•„ë‹ˆë¼ ì•¡ì…˜, ì˜ì¡´ì„±, ìŠ¹ì¸ ë²”ìœ„, ìƒíƒœ, ë³µêµ¬ë¥¼ í•¨ê»˜ ì¡°ìœ¨í•©ë‹ˆë‹¤.",
        "ONE coordina acciones, dependencias, aprobaciones, estado y recuperaciÃ³n, no solo un plan pasivo."
      ))}</p>
    </div>
    <div class="alpha05-next-action" role="status" aria-live="polite">
      <span>${escapeSummaryText(alpha04Local("Next best action", "ë‹¤ìŒ ìµœìš°ì„  í–‰ë™", "Siguiente mejor acciÃ³n"))}</span>
      <strong>${escapeSummaryText(orchestrator.nextBestAction.title)}</strong>
      <small>${escapeSummaryText(orchestrator.nextBestAction.reason)}</small>
    </div>
    <div class="alpha05-board" role="list">${boardSections}</div>
    <div class="alpha05-lower-grid">
      <section class="alpha05-panel">
        <h3>${escapeSummaryText(alpha04Local("Mission timeline", "ë¯¸ì…˜ íƒ€ìž„ë¼ì¸", "LÃ­nea de tiempo"))}</h3>
        <ol class="alpha05-timeline">${timeline}</ol>
      </section>
      <section class="alpha05-panel">
        <h3>${escapeSummaryText(alpha04Local("Execution safety", "ì‹¤í–‰ ì•ˆì „", "Seguridad de ejecuciÃ³n"))}</h3>
        <p>${escapeSummaryText(orchestrator.executionSafety.note)}</p>
        <p>${escapeSummaryText(alpha04Local(
          "Demo only. No provider contact, booking, payment, or submission happens from this board.",
          "ë°ëª¨ ì „ìš©ìž…ë‹ˆë‹¤. ì´ ë³´ë“œì—ì„œ ì œê³µì—…ì²´ ì—°ë½, ì˜ˆì•½, ê²°ì œ, ì œì¶œì€ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.",
          "Solo demo. Este tablero no contacta proveedores, reserva, paga ni envÃ­a nada."
        ))}</p>
        <span class="alpha05-safe-pill">${escapeSummaryText(safeLabel)}</span>
      </section>
    </div>
    <details class="alpha05-history-panel">
      <summary>${escapeSummaryText(alpha04Local("Action history", "ì•¡ì…˜ ê¸°ë¡", "Historial de acciones"))}</summary>
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
    <div class="alpha06-prediction-icon" aria-hidden="true">${prediction.priority === "Critical" ? "!" : "âœ¦"}</div>
    <div class="alpha06-prediction-copy">
      <div class="alpha06-prediction-topline">
        <strong>${escapeSummaryText(prediction.title)}</strong>
        <span>${escapeSummaryText(prediction.priority)}</span>
      </div>
      <p>${escapeSummaryText(prediction.explanation)}</p>
      <small><b>${escapeSummaryText(alpha06Local("Why", "ì´ìœ ", "Motivo"))}:</b> ${escapeSummaryText(prediction.reason)}</small>
      <div class="alpha06-prediction-meta">
        <span>${escapeSummaryText(alpha06Local("Confidence", "í™•ì‹ ë„", "Confianza"))}: ${Math.round(Number(prediction.confidence || 0) * 100)}%</span>
        <span>${escapeSummaryText(prediction.sourceSignals?.slice(0, 2).join(" · ") || prediction.source)}</span>
      </div>
    </div>
    <div class="alpha06-prediction-actions" aria-label="${escapeSummaryText(alpha06Local("Prediction controls", "ì˜ˆì¸¡ ì œì–´", "Controles de predicciÃ³n"))}">
      <button type="button" data-alpha06-feedback="accepted">${escapeSummaryText(prediction.actionLabel || alpha06Local("Review", "ê²€í† ", "Revisar"))}</button>
      <button type="button" data-alpha06-feedback="dismissed">${escapeSummaryText(alpha06Local("Ignore", "ë¬´ì‹œ", "Ignorar"))}</button>
      <button type="button" data-alpha06-feedback="not_relevant">${escapeSummaryText(alpha06Local("Not relevant", "ê´€ë ¨ ì—†ìŒ", "No relevante"))}</button>
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
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA06_PREDICTIVE_INTELLIGENCE_VERSION)} · ${escapeSummaryText(alpha06Local("Predictive Intelligence", "ì˜ˆì¸¡ ì§€ëŠ¥", "Inteligencia predictiva"))}</span>
      <h2>${escapeSummaryText(alpha06Local(
        "ONE noticed what may matter next",
        "ONEì´ ë‹¤ìŒì— ì¤‘ìš”í•  ì¼ì„ ê°ì§€í–ˆì–´ìš”",
        "ONE detectÃ³ lo que puede importar despuÃ©s"
      ))}</h2>
      <p>${escapeSummaryText(alpha06Local(
        "Quiet preparation only. Nothing executes without approval.",
        "ì¡°ìš©ížˆ ì¤€ë¹„ë§Œ í•©ë‹ˆë‹¤. ìŠ¹ì¸ ì—†ì´ ì‹¤í–‰í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.",
        "Solo preparaciÃ³n tranquila. Nada se ejecuta sin aprobaciÃ³n."
      ))}</p>
    </div>
    <div class="alpha06-prediction-list">${visible}</div>
    ${collapsed ? `
      <details class="alpha06-collapsed">
        <summary>${escapeSummaryText(alpha06Local("Helpful ideas kept quiet", "ì¡°ìš©ížˆ ë³´ê´€í•œ ë„ì›€ ì•„ì´ë””ì–´", "Ideas Ãºtiles guardadas en silencio"))}</summary>
        <div class="alpha06-prediction-list">${collapsed}</div>
      </details>
    ` : ""}
    <p class="alpha06-safety-note">${escapeSummaryText(alpha06Local(
      "Predictions prepare the mission. They never search, book, pay, submit, or contact providers by themselves.",
      "ì˜ˆì¸¡ì€ ë¯¸ì…˜ ì¤€ë¹„ë§Œ ë•ìŠµë‹ˆë‹¤. ìŠ¤ìŠ¤ë¡œ ê²€ìƒ‰, ì˜ˆì•½, ê²°ì œ, ì œì¶œ, ì œê³µì—…ì²´ ì—°ë½ì„ í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.",
      "Las predicciones preparan la misiÃ³n. Nunca buscan, reservan, pagan, envÃ­an ni contactan proveedores solas."
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
      button.textContent = alpha06Local("Prepared", "ì¤€ë¹„ë¨", "Preparado");
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
      <span class="v23-eyebrow">${escapeSummaryText(ALPHA07_PERSONAL_MISSION_MEMORY_VERSION)} · ${escapeSummaryText(alpha06Local("Personal Mission Memory", "ê°œì¸ ë¯¸ì…˜ ê¸°ì–µ", "Memoria personal de misiones"))}</span>
      <h2>${escapeSummaryText(alpha06Local("ONE used what helps, not everything", "ONEì´ í•„ìš”í•œ ê¸°ì–µë§Œ ì‚¬ìš©í–ˆì–´ìš”", "ONE usÃ³ solo lo que ayuda"))}</h2>
      <p>${escapeSummaryText(alpha06Local(
        "These preferences reduced repeated questions for this mission.",
        "ì´ ê¸°ì–µì€ ê°™ì€ ì§ˆë¬¸ì„ ë°˜ë³µí•˜ì§€ ì•Šê¸° ìœ„í•´ ì‚¬ìš©ë˜ì—ˆìŠµë‹ˆë‹¤.",
        "Estas preferencias redujeron preguntas repetidas para esta misiÃ³n."
      ))}</p>
    </div>
    <ul class="alpha07-memory-list">${rows}</ul>
    <div class="alpha07-memory-actions">
      <a href="personal-mission-memory.html">${escapeSummaryText(alpha06Local("Manage memory", "ê¸°ì–µ ê´€ë¦¬", "Gestionar memoria"))}</a>
      <span>${escapeSummaryText(alpha06Local("Sensitive data is never saved here.", "ë¯¼ê° ì •ë³´ëŠ” ì—¬ê¸°ì— ì €ìž¥í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.", "Los datos sensibles nunca se guardan aquÃ­."))}</span>
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
    flight: local("Flights", "í•­ê³µ", "Vuelos"),
    hotel: local("Hotels", "í˜¸í…”", "Hoteles"),
    restaurant: local("Restaurants", "ë ˆìŠ¤í† ëž‘", "Restaurantes"),
    transport: local("Transport", "ì´ë™", "Transporte"),
    hospital: local("Healthcare", "ì˜ë£Œ", "Salud"),
    insurance: local("Insurance", "ë³´í—˜", "Seguro"),
    banking: local("Banking", "ì€í–‰", "Banca")
  }[category] || localizeDomainText(category || local("Provider", "ì œê³µì—…ì²´", "Proveedor")));
  const language = activeLanguage === "ko" ? "ko" : activeLanguage === "es" ? "es" : "en";
  const title = local("Provider Trust Network", "ì œê³µì—…ì²´ ì‹ ë¢° ë„¤íŠ¸ì›Œí¬", "Red de confianza de proveedores");
  const subtitle = local(
    "Ranked by trust signals, mission fit, public evidence, and approval-safe verification needs â€” never by ads.",
    "ê´‘ê³ ê°€ ì•„ë‹ˆë¼ ì‹ ë¢° ì‹ í˜¸, ë¯¸ì…˜ ì í•©ì„±, ê³µê°œ ê·¼ê±°, ìŠ¹ì¸ ì „ í™•ì¸ í•„ìš”ì„±ì„ ê¸°ì¤€ìœ¼ë¡œ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤.",
    "Ordenado por seÃ±ales de confianza, ajuste a la misiÃ³n, evidencia pÃºblica y verificaciÃ³n segura; nunca por anuncios."
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
      [local("Goal", "ëª©í‘œ", "Objetivo"), u.goal],
      [local("Intent", "ì˜ë„", "IntenciÃ³n"), u.missionIntent],
      [local("Location", "ìž¥ì†Œ", "Lugar"), u.locations?.join(" · ")],
      [local("Dates", "ë‚ ì§œ", "Fechas"), u.dates?.join(" · ")],
      [local("People", "ì‚¬ëžŒ", "Personas"), u.people?.join(" · ")],
      [local("Budget", "ì˜ˆì‚°", "Presupuesto"), u.budget],
      [local("Preferences", "ì„ í˜¸", "Preferencias"), u.preferences?.join(" · ")],
      [local("Constraints", "ì¡°ê±´", "Restricciones"), u.constraints?.join(" · ")]
    ].filter(([, value]) => value);
    const missing = layer.visibleQuestions?.length
      ? layer.visibleQuestions.map((question) => question.text)
      : [local("No extra question is needed right now.", "ì§€ê¸ˆì€ ì¶”ê°€ ì§ˆë¬¸ì´ í•„ìš”í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.", "No hace falta otra pregunta ahora.")];
    const confidenceLabel = layer.confidence?.level === "high"
      ? local("Clear enough to continue", "ê³„ì† ì¤€ë¹„í•´ë„ ì¶©ë¶„ížˆ ëª…í™•í•¨", "Claro para continuar")
      : layer.confidence?.level === "medium"
        ? local("Almost clear", "ê±°ì˜ ëª…í™•í•¨", "Casi claro")
        : local("Needs quick confirmation", "ì§§ì€ í™•ì¸ í•„ìš”", "Necesita confirmaciÃ³n");
    const article = document.createElement("article");
    article.className = "mission-card v22-card is-wide alpha10-conversation-card";
    article.dataset.cardId = "natural-mission-conversation";
    article.dataset.alpha10Confidence = layer.confidence?.level || "unknown";
    article.dataset.alpha10QuestionCount = String(layer.visibleQuestions?.length || 0);
    article.innerHTML = `
      <div class="v22-card-heading">
        <span class="v22-kicker">ALPHA-10 · Natural Mission Conversation</span>
        <h2>${escapeSummaryText(local("ONE currently understands", "ONEì´ í˜„ìž¬ ì´í•´í•œ ë‚´ìš©", "ONE entiende ahora"))}</h2>
      </div>
      <p class="v22-card-body">${escapeSummaryText(local(
        "Keep talking naturally. ONE extracts only what matters and asks only if it improves the mission.",
        "ìžì—°ìŠ¤ëŸ½ê²Œ ë§í•˜ë©´ ë©ë‹ˆë‹¤. ONEì€ ì¤‘ìš”í•œ ì •ë³´ë§Œ ì´í•´í•˜ê³ , ê¼­ í•„ìš”í•  ë•Œë§Œ ë¬»ìŠµë‹ˆë‹¤.",
        "Habla naturalmente. ONE extrae lo importante y solo pregunta si mejora la misiÃ³n."
      ))}</p>
      <div class="v22-chip-list">${fields.map(([label, value]) => createV22Chip(`${label}: ${value}`)).join("")}</div>
      <div class="v22-chip-list">${createV22Chip(confidenceLabel, "primary")}</div>
      <details class="alpha10-missing-info"${layer.visibleQuestions?.length ? " open" : ""}>
        <summary>${escapeSummaryText(local("Natural follow-up", "ìžì—°ìŠ¤ëŸ¬ìš´ í™•ì¸", "Seguimiento natural"))}</summary>
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
    ? local("Current", "í˜„ìž¬", "Actual")
    : relationshipLabel(relationship, activeLanguage);
  const statusText = (status = "") => ({
    active: local("Active", "ì§„í–‰ ì¤‘", "Activo"),
    "mission-ready": local("Prepared", "ì¤€ë¹„ë¨", "Preparado"),
    prepared_opportunity: local("Prepared option", "ì¤€ë¹„ëœ ì„ íƒì§€", "OpciÃ³n preparada"),
    completed: local("Completed", "ì™„ë£Œ", "Completado")
  }[status] || local("Prepared", "ì¤€ë¹„ë¨", "Preparado"));
  const renderNodes = (nodes = []) => nodes.length
    ? nodes.slice(0, 4).map((node) => `
      <li>
        <strong>${escapeSummaryText(node.title || node.canonicalTitle || node.missionId)}</strong>
        <span>${escapeSummaryText(relationText(node.relationship))} · ${escapeSummaryText(statusText(node.status))}</span>
      </li>
    `).join("")
    : `<li>${escapeSummaryText(local("Nothing extra needed yet.", "ì•„ì§ ì¶”ê°€ë¡œ í•„ìš”í•œ ê²ƒì€ ì—†ìŠµë‹ˆë‹¤.", "AÃºn no hace falta nada mÃ¡s."))}</li>`;
  const goalRows = (layer.goals || []).slice(0, 3).map((goal) => `
    <li>
      <strong>${escapeSummaryText(goal.title)}</strong>
      <span>${escapeSummaryText(goal.progressNarrative || "")}</span>
      <small>${escapeSummaryText(local("Remaining", "ë‚¨ì€ ë‹¨ê³„", "Pendiente"))}: ${escapeSummaryText((goal.remaining || []).slice(0, 3).join(" · "))}</small>
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
      <h2>${escapeSummaryText(local("Where this mission fits in your life", "ì´ ë¯¸ì…˜ì´ ì‚¶ì—ì„œ ì–´ë””ì— ì´ì–´ì§€ëŠ”ì§€", "DÃ³nde encaja esta misiÃ³n en tu vida"))}</h2>
    </div>
    <p class="v22-card-body">${escapeSummaryText(local(
      "ONE connects the current mission to related, dependent, optional, and future life missions without turning it into a calendar or to-do app.",
      "ONEì€ í˜„ìž¬ ë¯¸ì…˜ì„ ê´€ë ¨·ì˜ì¡´·ì„ íƒ·ë¯¸ëž˜ ë¯¸ì…˜ê³¼ ì—°ê²°í•˜ì§€ë§Œ, ìº˜ë¦°ë”ë‚˜ í•  ì¼ ì•±ì²˜ëŸ¼ ë§Œë“¤ì§€ëŠ” ì•ŠìŠµë‹ˆë‹¤.",
      "ONE conecta esta misiÃ³n con misiones relacionadas, dependientes, opcionales y futuras sin convertirlo en calendario o lista de tareas."
    ))}</p>
    <div class="v22-chip-list">
      ${createV22Chip(`${local("Life stage", "ì‚¶ì˜ ë‹¨ê³„", "Etapa")}: ${layer.lifeStageLabel}`)}
      ${createV22Chip(layer.paused ? local("Paused", "ì¼ì‹œì •ì§€ë¨", "Pausado") : local("Active", "í™œì„±", "Activo"), "primary")}
      ${createV22Chip(`${local("Suggestions", "ì œì•ˆ", "Sugerencias")}: ${layer.futureMissions?.length || 0}`)}
    </div>
    <div class="v22-grid">
      <section>
        <h3>${escapeSummaryText(local("Current", "í˜„ìž¬", "Actual"))}</h3>
        <ul class="v22-clean-list">${renderNodes(map.current)}</ul>
      </section>
      <section>
        <h3>${escapeSummaryText(local("Upcoming", "ë‹¤ìŒ", "PrÃ³ximo"))}</h3>
        <ul class="v22-clean-list">${renderNodes(map.upcoming)}</ul>
      </section>
      <section>
        <h3>${escapeSummaryText(local("Related", "ê´€ë ¨", "Relacionado"))}</h3>
        <ul class="v22-clean-list">${renderNodes(map.related)}</ul>
      </section>
      <section>
        <h3>${escapeSummaryText(local("Future opportunities", "ë¯¸ëž˜ ê¸°íšŒ", "Oportunidades futuras"))}</h3>
        <ul class="v22-clean-list">${futureRows || renderNodes(map.future)}</ul>
      </section>
    </div>
    <details open>
      <summary>${escapeSummaryText(local("Goals this supports", "ì´ ë¯¸ì…˜ì´ ë•ëŠ” ëª©í‘œ", "Metas que apoya"))}</summary>
      <ul class="v22-clean-list">${goalRows || renderNodes([])}</ul>
    </details>
    <div class="alpha12-timeline-actions" role="group" aria-label="${escapeSummaryText(local("Life timeline controls", "ë¼ì´í”„ íƒ€ìž„ë¼ì¸ ì œì–´", "Controles de lÃ­nea de vida"))}">
      <button type="button" data-alpha12-action="pause">${escapeSummaryText(local("Pause", "ì¼ì‹œì •ì§€", "Pausar"))}</button>
      <button type="button" data-alpha12-action="hide">${escapeSummaryText(local("Hide", "ìˆ¨ê¸°ê¸°", "Ocultar"))}</button>
      <button type="button" data-alpha12-action="disable-suggestions">${escapeSummaryText(local("Disable suggestions", "ì œì•ˆ ë„ê¸°", "Desactivar sugerencias"))}</button>
      <button type="button" data-alpha12-action="export">${escapeSummaryText(local("Export", "ë‚´ë³´ë‚´ê¸°", "Exportar"))}</button>
      <button type="button" data-alpha12-action="delete">${escapeSummaryText(local("Delete", "ì‚­ì œ", "Eliminar"))}</button>
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
      <h2>${escapeSummaryText(local("Why ONE recommends this", "ONEì´ ì´ë ‡ê²Œ ì¶”ì²œí•œ ì´ìœ ", "Por quÃ© ONE recomienda esto"))}</h2>
    </div>
    <p class="v22-card-body">${escapeSummaryText(local(
      "Short explanations from visible mission signals. No internal reasoning, prompts, or hidden agent discussion is shown.",
      "ë³´ì´ëŠ” ë¯¸ì…˜ ì‹ í˜¸ë§Œ ì§§ê²Œ ì„¤ëª…í•©ë‹ˆë‹¤. ë‚´ë¶€ ì¶”ë¡ , í”„ë¡¬í”„íŠ¸, ìˆ¨ê²¨ì§„ ì—ì´ì „íŠ¸ ë…¼ì˜ëŠ” ë³´ì—¬ì£¼ì§€ ì•ŠìŠµë‹ˆë‹¤.",
      "Explicaciones breves con seÃ±ales visibles de la misiÃ³n. No muestra razonamiento interno, prompts ni discusiones ocultas."
    ))}</p>
    <div class="v22-chip-list">
      ${createV22Chip(`${local("Explanations", "ì„¤ëª…", "Explicaciones")}: ${layer.explanations.length}`)}
      ${createV22Chip(local("Approval-first", "ìŠ¹ì¸ ìš°ì„ ", "AprobaciÃ³n primero"), "primary")}
    </div>
    <ul class="v22-clean-list">${explanations}</ul>
    <div class="alpha14-explanation-actions" role="group" aria-label="${escapeSummaryText(local("Explanation detail", "ì„¤ëª… ìžì„¸ížˆ ë³´ê¸°", "Detalle de explicaciÃ³n"))}">
      <button type="button" data-alpha14-detail="${EXPLANATION_DETAIL_LEVELS.MINIMAL}"${selected(EXPLANATION_DETAIL_LEVELS.MINIMAL)}>${escapeSummaryText(local("Minimal", "ê°„ë‹¨ížˆ", "MÃ­nimo"))}</button>
      <button type="button" data-alpha14-detail="${EXPLANATION_DETAIL_LEVELS.STANDARD}"${selected(EXPLANATION_DETAIL_LEVELS.STANDARD)}>${escapeSummaryText(local("Standard", "í‘œì¤€", "EstÃ¡ndar"))}</button>
      <button type="button" data-alpha14-detail="${EXPLANATION_DETAIL_LEVELS.DETAILED}"${selected(EXPLANATION_DETAIL_LEVELS.DETAILED)}>${escapeSummaryText(local("Detailed", "ìžì„¸ížˆ", "Detallado"))}</button>
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
      <span>${escapeSummaryText(watcher.status || watcher.lifecycle)} · ${escapeSummaryText(local("Last checked", "ë§ˆì§€ë§‰ í™•ì¸", "Ãšltima revisiÃ³n"))}: ${escapeSummaryText(new Date(watcher.lastCheckedAt).toLocaleString(activeLanguage === "ko" ? "ko-KR" : activeLanguage === "es" ? "es" : "en"))}</span>
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
    : `<li>${escapeSummaryText(local("No meaningful changes since the last check.", "ë§ˆì§€ë§‰ í™•ì¸ ì´í›„ ì¤‘ìš”í•œ ë³€í™”ëŠ” ì—†ìŠµë‹ˆë‹¤.", "No hay cambios importantes desde la Ãºltima revisiÃ³n."))}</li>`;
  const notificationCount = layer.notifications?.length || 0;
  const article = document.createElement("article");
  article.className = "mission-card v22-card is-wide alpha11-monitoring-card";
  article.dataset.cardId = "autonomous-mission-monitoring";
  article.dataset.alpha11NotificationCount = String(notificationCount);
  article.dataset.alpha11WatcherCount = String(layer.watchers.length);
  article.innerHTML = `
    <div class="v22-card-heading">
      <span class="v22-kicker">ALPHA-11 · Autonomous Mission Monitoring</span>
      <h2>${escapeSummaryText(local("Mission Updates", "ë¯¸ì…˜ ì—…ë°ì´íŠ¸", "Actualizaciones de misiÃ³n"))}</h2>
    </div>
    <p class="v22-card-body">${escapeSummaryText(local(
      "ONE quietly watches meaningful changes and never executes anything without approval.",
      "ONEì€ ì¤‘ìš”í•œ ë³€í™”ë§Œ ì¡°ìš©ížˆ í™•ì¸í•˜ë©°, ìŠ¹ì¸ ì—†ì´ ì•„ë¬´ê²ƒë„ ì‹¤í–‰í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.",
      "ONE observa cambios importantes y nunca ejecuta nada sin aprobaciÃ³n."
    ))}</p>
    <div class="v22-chip-list">
      ${createV22Chip(local("Watching", "í™•ì¸ ì¤‘", "Observando") + `: ${layer.watchers.length}`)}
      ${createV22Chip(local("Proactive alerts", "ì¤‘ìš” ì•Œë¦¼", "Alertas") + `: ${notificationCount}`)}
      ${layer.nextRecommendedAction ? createV22Chip(local("Next", "ë‹¤ìŒ", "Siguiente") + `: ${layer.nextRecommendedAction}`) : ""}
    </div>
    <details open>
      <summary>${escapeSummaryText(local("Watching", "í™•ì¸ ì¤‘", "Observando"))}</summary>
      <ul class="v22-clean-list">${watcherRows}</ul>
    </details>
    <details${layer.digest?.updates?.length ? " open" : ""}>
      <summary>${escapeSummaryText(local("Mission history", "ë¯¸ì…˜ ê¸°ë¡", "Historial"))}</summary>
      <ul class="v22-clean-list">${digestRows}</ul>
    </details>
    <div class="alpha11-monitoring-actions" role="group" aria-label="${escapeSummaryText(local("Monitoring controls", "ëª¨ë‹ˆí„°ë§ ì œì–´", "Controles de monitoreo"))}">
      <button type="button" data-alpha11-action="pause">${escapeSummaryText(local("Pause monitoring", "ëª¨ë‹ˆí„°ë§ ì¼ì‹œì •ì§€", "Pausar monitoreo"))}</button>
      <button type="button" data-alpha11-action="resume">${escapeSummaryText(local("Resume", "ë‹¤ì‹œ ì‹œìž‘", "Reanudar"))}</button>
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
  const { tripDays } = calculateTripDayCounts(result);
  missionTitle.textContent = destination;
  missionGrid.innerHTML = "";
  currentResult.v22TravelPackages = false;
  currentResult.v23TravelExperience = true;
  missionGrid.classList.add("is-v23-travel-layout");
  const disclosure = document.querySelector(".prototype-disclosure");
  if (disclosure) disclosure.hidden = true;

  const livingWorkspace = createLivingMissionWorkspaceCard(result, missionContext);
  const executionOrchestrator = createExecutionOrchestratorCard(result, livingWorkspace.workspace);
  const refinementCard = createProgressiveRefinementCard(result, missionContext);

  const travelExperience = createTravelPackagesCard(result, missionContext);
  const conciergeCard = createAIConciergeCard(result);
  missionGrid.appendChild(travelExperience);
  if (conciergeCard) missionGrid.appendChild(conciergeCard);
  if (refinementCard && isFounderDiagnosticsMode()) missionGrid.appendChild(refinementCard);

  if (isFounderDiagnosticsMode()) {
    missionGrid.appendChild(livingWorkspace.card);
    const conversationCard = createNaturalConversationCard(result, missionContext);
    if (conversationCard) missionGrid.appendChild(conversationCard);
    missionGrid.appendChild(executionOrchestrator.card);
    const predictiveCard = createPredictiveIntelligenceCard(result, missionContext, executionOrchestrator.orchestrator);
    if (predictiveCard) missionGrid.appendChild(predictiveCard.card);
    const memoryCard = createPersonalMissionMemoryCard(result);
    if (memoryCard) missionGrid.appendChild(memoryCard.card);
    const insightsCard = createMissionInsightsCard(result, missionContext);
    if (insightsCard) missionGrid.appendChild(insightsCard);
    const worldSourceCard = createWorldIntelligenceSourceCard(result);
    if (worldSourceCard) missionGrid.appendChild(worldSourceCard);
    trackAlpha04Details(result);
    restoreAlpha04UiState(result);
  }

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
};

const renderResolutionPlanMission = (result) => {
  const plan = result.resolutionPlan || {};
  const domainKey = getDomainKey(result);
  const presentation = domainPresentation(result);
  const local = v22Local;
  const safeItems = (items = []) => items.map((item) => localizeDomainText(item?.title || item?.label || item)).filter(Boolean);
  const mission = plan.userProblem || result.originalMission || result.rawInput || result.mission || "";
  missionTitle.textContent = mission || local("Prepared mission", "ì¤€ë¹„ëœ ë¯¸ì…˜", "MisiÃ³n preparada");
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
    title: local("What ONE understood", "ONEì´ ì´í•´í•œ ë‚´ìš©", "Lo que ONE entendiÃ³"),
    kicker: localize(presentation.title),
    body: localize(presentation.understood),
    chips: [
      `${local("Goal", "ëª©í‘œ", "Objetivo")}: ${mission || polishedDomainText(plan.desiredOutcome, local("Mission prepared", "ë¯¸ì…˜ ì¤€ë¹„", "MisiÃ³n preparada"))}`,
      `${local("Domain", "ë¶„ì•¼", "Dominio")}: ${localizeDomainText(plan.domain || result.domain || result.type || "general")}`,
      `${local("Type", "ìœ í˜•", "Tipo")}: ${localizeDomainText(plan.missionType || result.missionType || "general")}`
    ],
    wide: true,
    tone: "hero"
  }));

  const recommendedFallback = local(
    "ONE prepared the safest useful path and kept every real-world action behind approval.",
    "ONEì´ ê°€ìž¥ ì í•©í•œ í•´ê²° ê²½ë¡œë¥¼ ì¤€ë¹„í–ˆê³  ì‹¤ì œ ì‹¤í–‰ì€ ìŠ¹ì¸ ë’¤ë¡œ ë§‰ì•„ë‘ì—ˆìŠµë‹ˆë‹¤.",
    "ONE preparÃ³ la ruta mÃ¡s Ãºtil y protegiÃ³ toda acciÃ³n real con aprobaciÃ³n."
  );
  const recommendedSteps = activeLanguage === "en"
    ? safeItems(recommended.requiredSteps || plan.preparedActions || []).slice(0, 5)
    : (presentation.prepared?.[activeLanguage] || presentation.prepared?.en || []);
  missionGrid.appendChild(createV22Card({
    id: "resolution-recommended-solution",
    title: local("Recommended solution", "ì¶”ì²œ í•´ê²° ë°©ë²•", "SoluciÃ³n recomendada"),
    kicker: local("ONE Pick", "ONE ì¶”ì²œ", "ONE recomienda"),
    body: polishedDomainText(recommended.expectedOutcome || plan.nextBestAction, recommendedFallback),
    chips: [polishedDomainText(recommended.title, local("Prepared solution path", "ì¤€ë¹„ëœ í•´ê²° ê²½ë¡œ", "Ruta preparada")), ...recommendedSteps],
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
      <span class="v22-kicker">${local("Alternatives", "ë‹¤ë¥¸ ì¢‹ì€ ì„ íƒì§€", "Alternativas")}</span>
      <h2>${local("Other good options", "ë‹¤ë¥¸ ì¢‹ì€ ë°©ë²•", "Otras buenas opciones")}</h2>
      <p class="v22-card-body">${local("Tap a direction to compare before approval.", "ìŠ¹ì¸ ì „ì— ë°©í–¥ì„ ëˆŒëŸ¬ ë¹„êµí•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "Toca una ruta para comparar antes de aprobar.")}</p>
    </div>
    <div class="v22-path-grid"></div>
  `;
  const pathGrid = alternatives.querySelector(".v22-path-grid");
  if (alternativePaths.length) {
    const alternativeNames = [
      local("Compare another route", "ë‹¤ë¥¸ ê²½ë¡œ ë¹„êµ", "Comparar otra ruta"),
      local("Lower-effort path", "ë¶€ë‹´ì´ ì ì€ ê²½ë¡œ", "Ruta mÃ¡s simple"),
      local("Higher-support path", "ì§€ì›ì´ ë” ë§Žì€ ê²½ë¡œ", "Ruta con mÃ¡s apoyo"),
      local("Fallback path", "ëŒ€ì•ˆ ê²½ë¡œ", "Ruta alternativa")
    ];
    alternativePaths.forEach((path, index) => pathGrid.appendChild(createV22PathCard({
      id: `path-${index}`,
      title: polishedDomainText(path.title || path, alternativeNames[index] || alternativeNames[0]),
      reason: polishedDomainText(path.expectedOutcome, local("Useful fallback if the main path does not fit.", "ì£¼ìš” ê²½ë¡œê°€ ë§žì§€ ì•Šì„ ë•Œ ì‚¬ìš©í•  ìˆ˜ ìžˆëŠ” ëŒ€ì•ˆìž…ë‹ˆë‹¤.", "Alternativa si la ruta principal no encaja.")),
      steps: activeLanguage === "en" ? path.requiredSteps || [] : (presentation.prepared?.[activeLanguage] || presentation.prepared?.en || []),
      selected: index === 0
    })));
  } else {
    pathGrid.appendChild(createV22PathCard({
      id: "path-default",
      title: local("Keep current recommendation", "í˜„ìž¬ ì¶”ì²œ ìœ ì§€", "Mantener recomendaciÃ³n"),
      reason: local("The current plan is enough to continue.", "í˜„ìž¬ ê³„íšë§Œìœ¼ë¡œë„ ê³„ì† ì§„í–‰í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "El plan actual basta para continuar."),
      selected: true
    }));
  }
  missionGrid.appendChild(alternatives);

  missionGrid.appendChild(createV22Card({
    id: "resolution-prepared",
    title: local("Already prepared", "ì´ë¯¸ ì¤€ë¹„ëœ ê²ƒ", "Ya preparado"),
    kicker: local("Ready", "ì¤€ë¹„ ì™„ë£Œ", "Listo"),
    chips: activeLanguage === "en" ? safeItems(plan.preparedActions?.length ? plan.preparedActions : presentation.prepared?.en || []) : (presentation.prepared?.[activeLanguage] || presentation.prepared?.en || []),
    wide: false,
    tone: "prepared"
  }));

  missionGrid.appendChild(createV22Card({
    id: "resolution-needed",
    title: local("Things I still need", "ì•„ì§ í•„ìš”í•œ ê²ƒ", "Lo que falta"),
    kicker: local("Only if needed", "í•„ìš”í•  ë•Œë§Œ", "Solo si hace falta"),
    chips: activeLanguage === "en"
      ? safeItems(plan.missingEssentialInformation?.length ? plan.missingEssentialInformation : plan.userRequiredActions || [local("Confirm before approval", "ìŠ¹ì¸ ì „ í™•ì¸", "Confirmar antes de aprobar")])
      : [local("í•„ìš” ì¡°ê±´ í™•ì¸", "í•„ìš” ì¡°ê±´ í™•ì¸", "Confirmar detalles"), local("ìŠ¹ì¸ ì „ ê²€í† ", "ìŠ¹ì¸ ì „ ê²€í† ", "Revisar antes de aprobar")],
    wide: false,
    tone: "needed"
  }));

  missionGrid.appendChild(createV22Card({
    id: "resolution-approval-actions",
    title: local("Ready when you are", "ì¤€ë¹„ë˜ë©´ ìŠ¹ì¸í•˜ì„¸ìš”", "Listo cuando quieras"),
    kicker: local("Approval protected", "ìŠ¹ì¸ ë³´í˜¸", "AprobaciÃ³n protegida"),
    body: local("Nothing is booked, paid, submitted, signed, or shared before explicit approval.", "ëª…í™•í•œ ìŠ¹ì¸ ì „ì—ëŠ” ì˜ˆì•½, ê²°ì œ, ì œì¶œ, ì„œëª…, ì œê³µì—…ì²´ ê³µìœ ê°€ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.", "Nada se reserva, paga, envÃ­a, firma o comparte antes de aprobar."),
    chips: activeLanguage === "en" ? safeItems(plan.approvalRequiredActions?.length ? plan.approvalRequiredActions : [local("Approve", "ìŠ¹ì¸", "Aprobar"), local("Modify", "ìˆ˜ì •", "Modificar"), local("Cancel", "ì·¨ì†Œ", "Cancelar")]) : [local("Approve", "ìŠ¹ì¸", "Aprobar"), local("Modify", "ìˆ˜ì •", "Modificar"), local("Cancel", "ì·¨ì†Œ", "Cancelar")],
    wide: true,
    tone: "approval"
  }));

  missionGrid.appendChild(createV22Card({
    id: "resolution-risks",
    title: local("Before execution", "ì‹¤í–‰ ì „ í™•ì¸", "Antes de ejecutar"),
    kicker: local("Honest limits", "ì •ì§í•œ í•œê³„", "LÃ­mites honestos"),
    chips: activeLanguage === "en" ? safeItems(plan.risks?.length ? plan.risks : [local("Live availability may change.", "ì‹¤ì‹œê°„ ê°€ëŠ¥ ì—¬ë¶€ëŠ” ë°”ë€” ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "La disponibilidad puede cambiar."), local("Provider confirmation is required.", "ì œê³µì—…ì²´ ìµœì¢… í™•ì¸ì´ í•„ìš”í•©ë‹ˆë‹¤.", "Se necesita confirmaciÃ³n del proveedor.")]) : [local("Live availability may change.", "ì‹¤ì‹œê°„ ê°€ëŠ¥ ì—¬ë¶€ëŠ” ë°”ë€” ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "La disponibilidad puede cambiar."), local("Provider confirmation is required.", "ì œê³µì—…ì²´ ìµœì¢… í™•ì¸ì´ í•„ìš”í•©ë‹ˆë‹¤.", "Se necesita confirmaciÃ³n del proveedor.")],
    wide: false,
    tone: "quiet"
  }));

  missionGrid.appendChild(createV22Card({
    id: "resolution-next-action",
    title: local("Next action", "ë‹¤ìŒ í–‰ë™", "Siguiente acciÃ³n"),
    kicker: local("ONE is ready", "ONE ì¤€ë¹„ ì™„ë£Œ", "ONE estÃ¡ listo"),
    body: polishedDomainText(plan.nextBestAction, local("Review the prepared solution, adjust anything, then approve when ready.", "ì¤€ë¹„ëœ í•´ê²° ë°©ë²•ì„ í™•ì¸í•˜ê³  í•„ìš”í•œ ë¶€ë¶„ì„ ê³ ì¹œ ë’¤ ì¤€ë¹„ë˜ë©´ ìŠ¹ì¸í•˜ì„¸ìš”.", "Revisa la soluciÃ³n, ajusta lo necesario y aprueba cuando quieras.")),
    chips: presentation.prepared?.[activeLanguage] || presentation.prepared?.en || [],
    wide: false,
    tone: "next"
  }));
};

const renderGeneralMission = (result) => {
  missionTitle.textContent = result.display?.title || result.rawInput || (activeLanguage === "ko" ? "ë¯¸ì…˜ ê³„íš" : "Mission Plan");
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
    tutors: ["Matched tutor profiles", "íŠœí„° í”„ë¡œí•„ ë§¤ì¹­"], style: ["Teaching approach compared", "ìˆ˜ì—… ë°©ì‹ ë¹„êµ"],
    format: ["Online and offline options", "ì˜¨ë¼ì¸·ì˜¤í”„ë¼ì¸ ì„ íƒì§€"], experience: ["Experience verified before selection", "ì„ íƒ ì „ ê²½ë ¥ í™•ì¸"],
    price: ["Price ranges compared", "ê°€ê²©ëŒ€ ë¹„êµ"], languages: ["Teaching languages checked", "ìˆ˜ì—… ì–¸ì–´ í™•ì¸"],
    availability: ["Available schedules prepared", "ê°€ëŠ¥ ì¼ì • ì¤€ë¹„"], questions: ["Interview questions prepared", "ì¸í„°ë·° ì§ˆë¬¸ ì¤€ë¹„"],
    trial: ["Trial lesson prepared", "ì²´í—˜ ìˆ˜ì—… ì¤€ë¹„"], recommended_product: ["Best-fit option selected", "ìµœì  ì œí’ˆ ì„ ì •"],
    alternative_products: ["Alternatives compared", "ëŒ€ì•ˆ ì œí’ˆ ë¹„êµ"], price_comparison: ["Prices compared", "ê°€ê²© ë¹„êµ"],
    where_to_buy: ["Trusted sellers prepared", "ì‹ ë¢°í•  íŒë§¤ì²˜ ì¤€ë¹„"], warranty: ["Warranty terms checked", "ë³´ì¦ ì¡°ê±´ í™•ì¸"],
    delivery: ["Delivery options checked", "ë°°ì†¡ ì˜µì…˜ í™•ì¸"], housing_options: ["Matching homes shortlisted", "ì¡°ê±´ì— ë§žëŠ” ì£¼ê±° í›„ë³´"],
    area_comparison: ["Areas compared", "ì§€ì—­ ë¹„êµ"], documents: ["Required documents prepared", "í•„ìš” ì„œë¥˜ ì¤€ë¹„"],
    risks: ["Important risks identified", "ì£¼ìš” ìœ„í—˜ í™•ì¸"], lawyer_type: ["Relevant specialist identified", "ì í•©í•œ ì „ë¬¸ê°€ ìœ í˜• í™•ì¸"],
    process: ["Expected process outlined", "ì˜ˆìƒ ì ˆì°¨ ì •ë¦¬"], visa: ["Requirements prepared for verification", "í™•ì¸í•  ìš”ê±´ ì¤€ë¹„"],
    housing: ["Housing options prepared", "ì£¼ê±° ì˜µì…˜ ì¤€ë¹„"], shipping: ["Shipping options prepared", "ë°°ì†¡ ì˜µì…˜ ì¤€ë¹„"],
    banking: ["Banking setup prepared", "ì€í–‰ ì—…ë¬´ ì¤€ë¹„"], insurance: ["Insurance options prepared", "ë³´í—˜ ì˜µì…˜ ì¤€ë¹„"],
    schools: ["School options prepared", "í•™êµ ì˜µì…˜ ì¤€ë¹„"], registration: ["Registration steps prepared", "ë“±ë¡ ë‹¨ê³„ ì¤€ë¹„"],
    tax: ["Tax and accounting checklist prepared", "ì„¸ê¸ˆ·íšŒê³„ ì²´í¬ë¦¬ìŠ¤íŠ¸ ì¤€ë¹„"], brand: ["Brand and domain options prepared", "ë¸Œëžœë“œ·ë„ë©”ì¸ ì˜µì…˜ ì¤€ë¹„"],
    suppliers: ["Supplier shortlist prepared", "ê³µê¸‰ì—…ì²´ í›„ë³´ ì¤€ë¹„"], clinic: ["Clinic options shortlisted", "ë³‘ì› í›„ë³´ ì¤€ë¹„"],
    appointment: ["Appointment requirements prepared", "ì˜ˆì•½ ìš”ê±´ ì¤€ë¹„"], cost: ["Cost range estimated", "ì˜ˆìƒ ë¹„ìš© ë²”ìœ„ ì¤€ë¹„"],
    loan_options: ["Suitable options compared", "ì í•©í•œ ì˜µì…˜ ë¹„êµ"], rates: ["Rates prepared for comparison", "ê¸ˆë¦¬ ë¹„êµ ì¤€ë¹„"],
    targets: ["Targets shortlisted", "ëª©í‘œ í›„ë³´ ì¤€ë¹„"], resume: ["Resume plan prepared", "ì´ë ¥ì„œ ê³„íš ì¤€ë¹„"],
    interview: ["Interview plan prepared", "ë©´ì ‘ ê³„íš ì¤€ë¹„"], recruiters: ["Recruiter options prepared", "ë¦¬í¬ë£¨í„° í›„ë³´ ì¤€ë¹„"],
    vendors: ["Vendors shortlisted", "ì—…ì²´ í›„ë³´ ì¤€ë¹„"], timeline: ["Timeline prepared", "ì¼ì • ì¤€ë¹„"],
    budget: ["Estimated budget prepared", "ì˜ˆìƒ ì˜ˆì‚° ì¤€ë¹„"], reservations: ["Reservation options prepared", "ì˜ˆì•½ ì˜µì…˜ ì¤€ë¹„"],
    checklist: ["Action checklist prepared", "ì‹¤í–‰ ì²´í¬ë¦¬ìŠ¤íŠ¸ ì¤€ë¹„"], mission_plan: ["Mission plan structured", "ë¯¸ì…˜ ê³„íš êµ¬ì„±"],
    options: ["Relevant options prepared", "ê´€ë ¨ ì„ íƒì§€ ì¤€ë¹„"]
  };

  const serviceCards = Array.isArray(result.cards) ? result.cards.filter((card) => !card.removed) : [];
  serviceCards.forEach((card) => {
    const detail = detailLabels[card.id];
    const preparedText = detail
      ? detail[activeLanguage === "ko" ? 1 : 0]
      : (activeLanguage === "ko" ? "ê´€ë ¨ ì„ íƒì§€ë¥¼ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤" : "Relevant options prepared");
    missionGrid.appendChild(createListCard({
      id: card.id,
      title: localize(card.title) || card.title || card.id,
      label: activeLanguage === "ko" ? "ì¤€ë¹„ ì™„ë£Œ" : "Prepared",
      items: [preparedText, activeLanguage === "ko" ? "ìˆ˜ì • ë° ë¹„êµ ê°€ëŠ¥" : "Ready to customize and compare"],
      wide: false,
      editable: result.type !== "legal" && !["visa", "risks"].includes(card.id)
    }));
  });

  if (serviceCards.length === 0) missionGrid.appendChild(createListCard({
    id: "mission-steps",
    title: activeLanguage === "ko" ? "ë¯¸ì…˜ ë‹¨ê³„" : "Mission Steps",
    label: activeLanguage === "ko" ? "ì¤€ë¹„ë¨" : "Prepared",
    items: (result.steps || []).map((step) => step.title || step.label || step.id),
    wide: true
  }));

  missionGrid.appendChild(createListCard({
    id: "assumptions",
    title: activeLanguage === "ko" ? "ê³„íš ê¸°ì¤€" : "Planning Assumptions",
    label: activeLanguage === "ko" ? "í™•ì¸" : "Review",
    items: result.assumptions || [],
    wide: true
  }));

  missionGrid.appendChild(createListCard({
    id: "risks",
    title: activeLanguage === "ko" ? "í™•ì¸ ì‚¬í•­" : "Things to Check",
    label: activeLanguage === "ko" ? "ì¤‘ìš”" : "Important",
    items: result.risks || [],
    wide: true
  }));

  const learningResources = createPublicResourceCard(result, "learning_resources", activeLanguage === "ko" ? "ì¶”ì²œ í•™ìŠµ ìžë£Œ" : "Recommended Learning Resources", activeLanguage === "ko" ? "ë¬´ë£Œ ê³µê°œ ìžë£Œ" : "Free public resources");
  if (learningResources) missionGrid.appendChild(learningResources);

  missionGrid.appendChild(createListCard({
    id: "information-sources",
    title: activeLanguage === "ko" ? "ì •ë³´ ì¶œì²˜" : "Information Sources",
    label: activeLanguage === "ko" ? "í”„ë¡œí† íƒ€ìž…" : "Prototype",
    items: (result.providerResults || result.providers || []).map((provider) => {
      const name = provider.provider || provider.name || provider.category;
      const status = provider.liveData
        ? (activeLanguage === "ko" ? "ì‹¤ì‹œê°„ ê³µê°œ ë°ì´í„°" : "Live public data")
        : (activeLanguage === "ko" ? "ë°ëª¨ìš© ì¤€ë¹„ ë°ì´í„°" : "Demo-ready data");
      return `${name} â€” ${status}`;
    }),
    wide: true,
    editable: false
  }));

};

const isExperienceMission = (result, context) => {
  if (result?.type === "experience" || result?.portableExperienceData) return true;
  const mission = String(result?.originalMission || result?.rawInput || result?.mission || "");
  if (context?.providerEligibility?.experience === false || context?.requiresInternationalTravel) return false;
  return context?.purpose?.value === "romance" || /date|ë°ì´íŠ¸|ê¸°ë…ì¼|anniversary|weekend.{0,12}(?:plan|outing)|ì£¼ë§.{0,12}(?:ë°ì´íŠ¸|ë‚˜ë“¤ì´|ì—¬í–‰)|hangout|ë‚˜ë“¤ì´|salida romÃ¡ntica|cita/i.test(mission);
};

const renderGeneratedExperienceMission = (result) => {
  const mission = result?.originalMission || result?.rawInput || result?.mission || (activeLanguage === "ko" ? "ìƒˆë¡œìš´ ê²½í—˜" : "New experience");
  missionTitle.textContent = mission;
  missionGrid.innerHTML = "";
  const memoryEnabled = missionMemoryEnabled();
  const previousExperiences = memoryEnabled ? readMissionMemories().flatMap((row) => row.preferences || row.favoriteLocations || []).map(String) : [];
  currentExperienceReview = buildExperienceIntelligence({ mission, goal: mission, language: activeLanguage, budget: result?.budget?.total, memoryEnabled, previousExperiences, context: result.missionContext });
  const generated = currentExperienceReview.generatedExperience;
  const one = generated.onePick;
  const local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
  const previewProfile = profileForResult(result, destination);
  if (previewProfile?.journeys?.length) {
    return rotateList(previewProfile.journeys, seed).map((item, index) => ({
      id: `v23-preview-journey-${previewProfile.id}-${index}`,
      name: local(item[0], item[1], item[2]),
      purpose: local(item[3], item[4], item[3]),
      tags: item[5] || [],
      reason: local(
        "This option is built from curated destination highlights and the current mission context.",
        "현재 미션과 실제 목적지 하이라이트를 기준으로 구성했습니다.",
        "Esta opción usa puntos reales del destino y el contexto de la misión."
      ),
      duration,
      tone: ["balanced", "culture", "food", "local"][index] || "balanced",
      comfort: local("Practical", "실용적", "Práctico"),
      budget: getTravelBudgetLabel(result, index === 2 ? "food" : "balanced"),
      timeline: item[5] || [],
      selected: index === 0,
      details: {
        flight: local("Round-trip options are compared after approval for live price and schedule.", "왕복 항공권은 승인 후 실시간 가격과 일정을 확인합니다.", "Vuelos ida y vuelta se comparan tras aprobación."),
        hotel: local("Hotel candidates are matched to the route, walking load, and room count.", "숙소 후보는 동선, 도보 부담, 객실 수에 맞춰 비교합니다.", "Hoteles según ruta, caminata y habitaciones."),
        transport: local("Daily movement is grouped by neighborhood to avoid unnecessary backtracking.", "불필요한 왕복 이동을 줄이도록 날마다 지역을 묶습니다.", "Se agrupa por zonas para evitar traslados inútiles."),
        food: local("Food candidates are placed near the day route instead of as a random list.", "맛집 후보는 무작위 목록이 아니라 그날 동선 근처로 배치합니다.", "Comida cerca de la ruta del día."),
        entry: local("Entry and document rules are rechecked through official sources before action.", "입국·서류 요건은 실행 전 공식 출처로 다시 확인합니다.", "Requisitos se verifican con fuentes oficiales."),
        insurance: local("Insurance and cancellation rules are prepared for review before booking.", "예약 전 보험과 취소 규정을 검토할 수 있게 준비합니다.", "Seguro y cancelación se preparan antes de reservar.")
      },
      sourceStates: {
        flight: getScenarioSourceState(result, "flight", "estimated"),
        hotel: getScenarioSourceState(result, "hotel", "estimated"),
        transport: getScenarioSourceState(result, "transport", "placeholder"),
        food: getScenarioSourceState(result, "food", "cached_public"),
        entry: getScenarioSourceState(result, "entry", "unavailable"),
        insurance: getScenarioSourceState(result, "insurance", "placeholder")
      }
    }));
  }
  const disclosure = document.querySelector(".prototype-disclosure");
  if (disclosure) disclosure.textContent = local("Prototype · personalized experience plan · no booking made", "í”„ë¡œí† íƒ€ìž… · ë§žì¶¤ ê²½í—˜ ê³„íš · ì‹¤ì œ ì˜ˆì•½ ì•„ë‹˜", "Prototipo · experiencia personalizada · sin reservas");

  const conversationCard = createNaturalConversationCard(result, result.missionContext);
  if (conversationCard) missionGrid.appendChild(conversationCard);

  missionGrid.appendChild(createMissionCard({
    id: "generated-one-pick",
    title: local("Your experience", "ë‹¹ì‹ ì„ ìœ„í•œ ê²½í—˜", "Tu experiencia"),
    label: "â­ ONE Pick",
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
    title: local("The story of your day", "í•˜ë£¨ì˜ ì´ì•¼ê¸°", "La historia del dÃ­a"),
    label: local("Created for you", "ë§žì¶¤ êµ¬ì„±", "Creado para ti"),
    items: one.timeline.map((item) => `${item.time} · ${item.title}`),
    wide: true,
    editable: true
  }));
  missionGrid.appendChild(createListCard({
    id: "generated-food",
    title: local("Food moments", "ìŒì‹ê³¼ ë””ì €íŠ¸", "Momentos gastronÃ³micos"),
    label: local("Balanced variety", "ë‹¤ì–‘í•˜ê²Œ êµ¬ì„±", "Variedad equilibrada"),
    items: one.foods,
    wide: true,
    editable: true
  }));
  missionGrid.appendChild(createMissionCard({
    id: "generated-transport",
    title: local("Getting around", "ì´ë™ ë°©ë²•", "CÃ³mo moverse"),
    label: "ONE Pick",
    value: one.transportation,
    reason: result.missionContext.nearbyFirst ? local("Less transit, more time together.", "ì´ë™ì€ ì¤„ì´ê³  í•¨ê»˜í•˜ëŠ” ì‹œê°„ì„ ëŠ˜ë ¸ì–´ìš”.", "Menos traslado y mÃ¡s tiempo juntos.") : local("Balanced for distance and time.", "ê±°ë¦¬ì™€ ì‹œê°„ì„ í•¨ê»˜ ê³ ë ¤í–ˆì–´ìš”.", "Equilibrado segÃºn distancia y tiempo."),
    options: result.missionContext.transport.map((option, index) => makeOptionRow(option, "", {
      index,
      label: option,
      selected: normalizeOptionLabel(option) === normalizeOptionLabel(one.transportation)
    })),
    editable: true
  }));
  missionGrid.appendChild(createListCard({
    id: "generated-rain-plan",
    title: local("If the weather changes", "ë¹„ê°€ ì˜¤ê±°ë‚˜ ë‚ ì”¨ê°€ ë°”ë€Œë©´", "Si cambia el clima"),
    label: local("Backup ready", "ëŒ€ì•ˆ ì¤€ë¹„", "Alternativa lista"),
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
  const cleanedGoal = rawGoal.toLowerCase().replace(/\b(?:trip|travel|vacation|visit|to|in|plan|please)\b/gi, " ").replace(/(?:ì—¬í–‰|ì¶œìž¥|ê°€ì¤˜|ê°€ê³  ì‹¶ì–´|ê³„íší•´ì¤˜)/g, " ").replace(/\s+/g, " ").trim();
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
    ? normalizedTravelGoal || (ko ? "ì—¬í–‰" : "Trip")
    : currentResult?.title?.[activeLanguage] || currentResult?.title?.en || rawGoal || (ko ? "ì¤€ë¹„ëœ ë¯¸ì…˜" : "Prepared mission");
  const prepared = experienceMission
    ? (ko ? ["ë§žì¶¤ ê²½í—˜", "ì‹œê°„ë³„ ì¼ì •", "ìŒì‹", "ì´ë™", "ë‚ ì”¨ ëŒ€ì•ˆ"] : es ? ["Experiencia", "Horario", "Comida", "Transporte", "Plan alternativo"] : ["Experience", "Timeline", "Food", "Transportation", "Weather backup"])
    : currentResult?.type === "travel"
    ? (ko ? ["í•­ê³µíŽ¸", "í˜¸í…”", "êµí†µ", "ë‚ ì”¨", "ì˜ˆì‚°", "ì²´í¬ë¦¬ìŠ¤íŠ¸"] : es ? ["Vuelos", "Hotel", "Transporte", "Clima", "Presupuesto", "Lista"] : ["Flights", "Hotel", "Transportation", "Weather", "Budget", "Checklist"])
    : currentResult?.resolutionPlan
    ? (domainPresentation(currentResult).prepared?.[activeLanguage] || domainPresentation(currentResult).prepared?.en || [])
    : [ko ? "ì¶”ì²œ í•´ê²°" : es ? "SoluciÃ³n" : "Solution", ko ? "ëŒ€ì•ˆ" : es ? "Alternativas" : "Alternatives", ko ? "ì¤€ë¹„ ìƒíƒœ" : es ? "Preparado" : "Prepared", ko ? "ìŠ¹ì¸ ë³´í˜¸" : es ? "AprobaciÃ³n" : "Approval"];
  missionUnderstoodGoal.innerHTML = `<span>${ko ? "ëª©í‘œ" : es ? "Objetivo" : "Goal"}</span><strong>${escapeSummaryText(title)}</strong>`;
  missionUnderstoodItems.innerHTML = prepared.map((item) => `<span>âœ“ ${item}</span>`).join("");
  const heading = document.getElementById("missionUnderstoodTitle");
  const summary = document.querySelector("#missionUnderstood .eyebrow");
  const timing = document.querySelector("#missionUnderstood .mission-understood-time");
  if (heading) heading.textContent = ko ? "ì´ë ‡ê²Œ ì¤€ë¹„í–ˆì–´ìš”." : es ? "Esto es lo que preparÃ© para ti." : "Hereâ€™s what I prepared for you.";
  if (summary) summary.textContent = ko ? "ë¯¸ì…˜ ìš”ì•½" : es ? "Resumen de la misiÃ³n" : "Mission Summary";
  if (timing) timing.textContent = ko ? "1ë¶„ ì´ë‚´ì— ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤." : es ? "Preparado en menos de un minuto." : "Prepared in under a minute.";
  const stages = ko ? { mission: "ë¯¸ì…˜", planning: "ê³„íš", review: "ê²€í† ", approval: "ìŠ¹ì¸", execution: "ì‹¤í–‰", complete: "ì™„ë£Œ" } : { mission: "Mission", planning: "Planning", review: "Review", approval: "Approval", execution: "Execution", complete: "Complete" };
  document.querySelectorAll("[data-stage]").forEach((item) => { item.textContent = stages[item.dataset.stage] || item.textContent; });
};

const organizeProgressiveResults = () => {
  if (currentResult?.v22DomainLayout || currentResult?.v22TravelPackages || currentResult?.v23TravelExperience) return;
  const nodes = [...missionGrid.children];
  const nodeIds = new Set(nodes.map((node) => node.dataset?.cardId || (node.id === "additionalServicesForm" ? "additional-services" : "")));
  const groups = [
    { title: "1. â­ ONE Pick", open: true, match: () => true },
    { title: activeLanguage === "ko" ? "2. ì¤‘ìš” ì •ë³´" : "2. Important Information", ids: new Set(["visa", "checklist", "information-sources"]) },
    { title: activeLanguage === "ko" ? "3. ë‚ ì”¨" : "3. Weather", ids: new Set(["weather"]) },
    { title: activeLanguage === "ko" ? "4. í™˜ìœ¨" : "4. Currency", ids: new Set(["exchange-rate"]) },
    { title: activeLanguage === "ko" ? "5. ë¯¸ì…˜ ìˆ˜ì •" : activeLanguage === "es" ? "5. RevisiÃ³n" : "5. Revision", ids: new Set(["additional-services"]) },
    { title: activeLanguage === "ko" ? "6. ìŠ¹ì¸" : "6. Approval", open: true, ids: new Set(["approval-protection"]) }
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
    detail.querySelector("summary span").textContent = detail.open ? "âˆ’" : "+";
  }));
  details.forEach((detail) => {
    detail.querySelector("summary span").textContent = detail.open ? "âˆ’" : "+";
  });
};

const renderRevisionAdditionNote = () => {
  if (!additionalServiceList) return;
  const note = currentResult?.alpha15LastAddition;
  if (!note?.text) {
    additionalServiceList.innerHTML = "";
    return;
  }
  const label = v22Local("Added to this mission", "ë¯¸ì…˜ì— ì¶”ê°€ë¨", "AÃ±adido a la misiÃ³n");
  const body = v22Local(
    note.summary || "ONE updated only the affected mission parts. Live provider checks still happen only after approval.",
    note.summary || "ONEì´ ì˜í–¥ë°›ì€ ë¯¸ì…˜ ë¶€ë¶„ë§Œ ì—…ë°ì´íŠ¸í–ˆìŠµë‹ˆë‹¤. ì‹¤ì‹œê°„ ì œê³µì—…ì²´ í™•ì¸ì€ ìŠ¹ì¸ í›„ì—ë§Œ ì§„í–‰ë©ë‹ˆë‹¤.",
    note.summary || "ONE actualizÃ³ solo las partes afectadas. La verificaciÃ³n en vivo solo ocurre tras aprobar."
  );
  const affected = Array.isArray(note.affectedSections) && note.affectedSections.length
    ? note.affectedSections.map((section) => `<span>${escapeSummaryText(section)}</span>`).join("")
    : "";
  const undo = note.previousResult ? `<button type="button" class="revision-undo-button" data-mission-undo="last">${escapeSummaryText(v22Local("Undo", "ë˜ëŒë¦¬ê¸°", "Deshacer"))}</button>` : "";
  additionalServiceList.innerHTML = `
    <div class="revision-added-note">
      <span>${escapeSummaryText(label)}</span>
      <strong>${escapeSummaryText(note.text)}</strong>
      <p>${escapeSummaryText(body)}</p>
      ${affected ? `<div class="revision-affected-parts">${affected}</div>` : ""}
      ${undo}
    </div>
  `;
};

const renderCompleteMissionRevisionState = () => {
  if (!additionalServiceList) return;
  const note = currentResult?.alpha15LastAddition;
  const state = missionExperienceState();
  if (!note?.text && !state.history.length) return;
  const affected = Array.isArray(note?.affectedSections) && note.affectedSections.length
    ? note.affectedSections.map((section) => `<span>${escapeSummaryText(section)}</span>`).join("")
    : "";
  const undo = state.undoStack.length || note?.previousResult
    ? `<button type="button" class="revision-undo-button" data-mission-undo="last">${escapeSummaryText(completeMissionLocal("Undo", "ë˜ëŒë¦¬ê¸°", "Deshacer"))}</button>`
    : "";
  const redo = state.redoStack.length
    ? `<button type="button" class="revision-undo-button" data-mission-redo="last">${escapeSummaryText(completeMissionLocal("Redo", "ë‹¤ì‹œ ì ìš©", "Rehacer"))}</button>`
    : "";
  const history = state.history.length ? `
    <details class="mission-change-history">
      <summary>${escapeSummaryText(completeMissionLocal("Change history", "ë³€ê²½ ê¸°ë¡", "Historial de cambios"))}</summary>
      <ol>${state.history.slice(0, 5).map((item) => `<li><strong>${escapeSummaryText(item.command)}</strong><span>${escapeSummaryText(item.summary || item.affectedSections?.join(", ") || "")}</span></li>`).join("")}</ol>
    </details>
  ` : "";
  additionalServiceList.innerHTML = `
    <div class="revision-added-note complete-mission-revision-state">
      <span>${escapeSummaryText(completeMissionLocal("Latest change", "ìµœê·¼ ë³€ê²½", "Ãšltimo cambio"))}</span>
      <strong>${escapeSummaryText(note?.text || state.history[0]?.command || completeMissionLocal("Mission updated", "ë¯¸ì…˜ ì—…ë°ì´íŠ¸", "MisiÃ³n actualizada"))}</strong>
      <p>${escapeSummaryText(note?.summary || state.history[0]?.summary || completeMissionLocal("ONE updated only the affected parts. Nothing external happened.", "ONEì´ ì˜í–¥ë°›ì€ ë¶€ë¶„ë§Œ ì—…ë°ì´íŠ¸í–ˆìŠµë‹ˆë‹¤. ì™¸ë¶€ ì‹¤í–‰ì€ ì—†ì—ˆìŠµë‹ˆë‹¤.", "ONE actualizÃ³ solo las partes afectadas. No hubo acciÃ³n externa."))}</p>
      ${affected ? `<div class="revision-affected-parts">${affected}</div>` : ""}
      <div class="mission-history-actions">${undo}${redo}</div>
      ${history}
    </div>
  `;
};

const createAIDecisionPanel = (result) => {
  if (!isTravelResult(result) || isFounderDiagnosticsMode()) return null;
  const key = decisionMemoryKey(result);
  let memory = {};
  try {
    memory = JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    memory = {};
  }
  const layer = createAIDecisionLayer(result, { language: activeLanguage, memory });
  result.aiDecisionLayer = layer;
  if (!layer.visibleRecommendations.length) return null;
  const panel = document.createElement("section");
  panel.className = "mission-card is-full ai-decision-panel";
  panel.dataset.cardId = "ai-decision-engine";
  const copy = {
    title: v22Local("ONE noticed something better", "ONEì´ ë” ë‚˜ì€ ì„ íƒì„ ì°¾ì•˜ì–´ìš”", "ONE encontrÃ³ una mejor opciÃ³n"),
    lead: v22Local("These are suggestions only. ONE will not change confirmed choices unless you accept.", "ì œì•ˆì¼ ë¿ìž…ë‹ˆë‹¤. ìŠ¹ì¸í•œ ì„ íƒì€ ì‚¬ìš©ìžê°€ ìˆ˜ë½í•˜ê¸° ì „ì—ëŠ” ë°”ê¾¸ì§€ ì•ŠìŠµë‹ˆë‹¤.", "Son sugerencias. ONE no cambia decisiones confirmadas sin tu aceptaciÃ³n."),
    health: v22Local("Mission condition", "ë¯¸ì…˜ ìƒíƒœ", "Estado de la misiÃ³n"),
    accept: v22Local("Accept", "ì ìš©", "Aceptar"),
    dismiss: v22Local("Dismiss", "ë‹«ê¸°", "Descartar"),
    why: v22Local("Ask ONE why", "ì™œì¸ì§€ ë³´ê¸°", "Preguntar por quÃ©")
  };
  panel.innerHTML = `
    <div class="card-top">
      <h2 class="card-title">${escapeSummaryText(copy.title)}</h2>
      <span class="ai-decision-health">${escapeSummaryText(copy.health)} · ${escapeSummaryText(layer.statusLabel)}</span>
    </div>
    <p class="ai-decision-lead">${escapeSummaryText(copy.lead)}</p>
    <div class="ai-decision-list">
      ${layer.visibleRecommendations.map((item) => `
        <article class="ai-decision-card" data-decision-id="${escapeSummaryText(item.id)}">
          <strong>${escapeSummaryText(item.suggestion)}</strong>
          <p>${escapeSummaryText(item.reason)}</p>
          <span>${escapeSummaryText(item.expectedBenefit)}</span>
          <div class="ai-decision-actions">
            <button type="button" data-decision-action="accept" data-decision-id="${escapeSummaryText(item.id)}">${escapeSummaryText(copy.accept)}</button>
            <button type="button" data-decision-action="dismiss" data-decision-id="${escapeSummaryText(item.id)}">${escapeSummaryText(copy.dismiss)}</button>
            <button type="button" data-decision-action="why" data-decision-id="${escapeSummaryText(item.id)}">${escapeSummaryText(copy.why)}</button>
          </div>
          <p class="ai-decision-why" hidden>${escapeSummaryText((item.evidence || []).join(" · "))}</p>
        </article>
      `).join("")}
    </div>
  `;
  return panel;
};

const renderMission = () => {
  currentResult = normalizeStoredResult(getStoredResult());
  currentExperienceReview = null;
  document.body.classList.toggle("travel-premium-result-view", isTravelResult(currentResult));
  missionGrid.classList.remove("is-domain-layout", "is-travel-package-layout", "is-v23-travel-layout");
  delete missionGrid.dataset.domain;
  const disclosure = document.querySelector(".prototype-disclosure");
  if (disclosure) disclosure.hidden = false;
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
  if (isTravelResult(currentResult)) {
    currentResult.providerOrchestration = createProviderOrchestrationFromMissionData(currentResult);
  }

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
  if (!isTravelResult(currentResult) || isFounderDiagnosticsMode()) {
    missionGrid.insertBefore(pathwayOpportunityPanel, missionGrid.firstChild);
  } else {
    pathwayOpportunityPanel.hidden = true;
  }
  const decisionPanel = createAIDecisionPanel(currentResult);
  if (decisionPanel) missionGrid.appendChild(decisionPanel);
  missionGrid.appendChild(additionalServicesForm);
  renderRevisionAdditionNote();
  renderCompleteMissionRevisionState();
  missionGrid.appendChild(createMissionConfidenceCard(currentResult));
  missionGrid.appendChild(createApprovalCard(currentResult));
  if (!isTravelResult(currentResult) || isFounderDiagnosticsMode()) {
    attachMissionDirectorBrief(currentResult);
    attachProviderTrustBrief(currentResult);
    attachMissionMonitoringLayer(currentResult);
    attachLifeTimelineLayer(currentResult);
    attachExplainableIntelligenceLayer(currentResult);
  }
  const missionUnderstood = document.getElementById("missionUnderstood");
  if (missionUnderstood) missionUnderstood.hidden = isTravelResult(currentResult) && !isFounderDiagnosticsMode();
  renderMissionUnderstanding();
  renderMissionLifecycle(currentResult);
  enhanceEmptyStates();
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
    pathwayOpportunityTitle.textContent = local("ONE Recommendation", "ONE ì¶”ì²œ", "RecomendaciÃ³n de ONE");
    experienceReviewOpening.textContent = polishedDomainText(plan.desiredOutcome, localize(presentation.understood) || local("ONE prepared a domain-aware solution path.", "ONEì´ ë¶„ì•¼ì— ë§žëŠ” í•´ê²° ê²½ë¡œë¥¼ ì¤€ë¹„í–ˆì–´ìš”.", "ONE preparÃ³ una soluciÃ³n adecuada."));
    experienceReviewLabel.textContent = local("Why this fits", "ì´ ì„ íƒì´ ë§žëŠ” ì´ìœ ", "Por quÃ© encaja");
    const insights = [
      polishedDomainText(plan.recommendedPath?.expectedOutcome, local("The recommendation matches this mission and stays approval-first.", "ì¶”ì²œ ê²½ë¡œëŠ” ì´ ë¯¸ì…˜ì— ë§žê³  ìŠ¹ì¸ ìš°ì„  ì›ì¹™ì„ ì§€í‚µë‹ˆë‹¤.", "La recomendaciÃ³n encaja y mantiene aprobaciÃ³n primero.")),
      polishedDomainText(plan.nextBestAction, local("Review, adjust, then approve when ready.", "ê²€í† í•˜ê³  ìˆ˜ì •í•œ ë’¤ ì¤€ë¹„ë˜ë©´ ìŠ¹ì¸í•˜ì„¸ìš”.", "Revisa, ajusta y aprueba cuando quieras.")),
      local("No provider contact, booking, payment, submission, or signature happens before approval.", "ìŠ¹ì¸ ì „ì—ëŠ” ì œê³µì—…ì²´ ì—°ë½, ì˜ˆì•½, ê²°ì œ, ì œì¶œ, ì„œëª…ì´ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.", "No hay contacto, reserva, pago, envÃ­o ni firma sin aprobaciÃ³n.")
    ].filter(Boolean);
    experienceReviewInsights.replaceChildren(...insights.map((insight) => {
      const item = document.createElement("li");
      item.textContent = insight;
      return item;
    }));
    experienceReviewConfidence.textContent = local("Domain locked", "ë¶„ì•¼ ê³ ì •", "Dominio fijado");
    revisionLead.textContent = local("Use Modify to add constraints before approval.", "ìŠ¹ì¸ ì „ì— ìˆ˜ì •ì—ì„œ ì¡°ê±´ì„ ì¶”ê°€í•  ìˆ˜ ìžˆì–´ìš”.", "Usa Modificar para aÃ±adir condiciones antes de aprobar.");
    pathwayOpportunityList.replaceChildren(...(plan.solutionPaths || []).slice(0, 3).map((path) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pathway-opportunity-action";
      button.dataset.revisionCommand = polishedDomainText(path.title || "", local("Prepared path", "ì¤€ë¹„ëœ ê²½ë¡œ", "Ruta preparada"));
      button.setAttribute("role", "listitem");
      button.textContent = polishedDomainText(path.title || "", local("Prepared path", "ì¤€ë¹„ëœ ê²½ë¡œ", "Ruta preparada"));
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
    title: local("ONE Recommendation", "ONE ì¶”ì²œ", "RecomendaciÃ³n de ONE"),
    opening: local(`Travel options prepared specifically for ${destinationName || "your destination"}.`, `${destinationName || "ëª©ì ì§€"}ì— ë§žëŠ” ì—¬í–‰ ì„ íƒì§€ë§Œ ì¤€ë¹„í–ˆì–´ìš”.`, `Opciones preparadas especÃ­ficamente para ${destinationName || "tu destino"}.`),
    whyLabel: local("Why this fits", "ì´ ì„ íƒì´ ìž˜ ë§žëŠ” ì´ìœ ", "Por quÃ© encaja"),
    insights: [
      activeLanguage === "ko" ? recommendedFlight?.reasonKo || recommendedFlight?.reason : recommendedFlight?.reason,
      activeLanguage === "ko" ? recommendedHotel?.reasonKo || recommendedHotel?.reason : recommendedHotel?.reason,
      local("Every displayed travel option is restricted to the detected destination.", "í‘œì‹œë˜ëŠ” ì—¬í–‰ ì„ íƒì§€ëŠ” ê°ì§€ëœ ëª©ì ì§€ë¡œ ì œí•œë©ë‹ˆë‹¤.", "Todas las opciones se limitan al destino detectado.")
    ].filter(Boolean),
    confidence: local("Destination locked", "ëª©ì ì§€ ê³ ì •", "Destino fijado"),
    lead: local("Use Modify to compare destination-appropriate options before approval.", "ìŠ¹ì¸ ì „ì— ìˆ˜ì •ì—ì„œ ëª©ì ì§€ì— ë§žëŠ” ì„ íƒì§€ë¥¼ ë¹„êµí•  ìˆ˜ ìžˆì–´ìš”.", "Usa Modificar para comparar opciones antes de aprobar."),
    choices: [recommendedFlight && { text: getFlightName(recommendedFlight), command: local("Compare flight options", "í•­ê³µíŽ¸ ì„ íƒì§€ ë¹„êµ", "Comparar vuelos") }, recommendedHotel && { text: getHotelName(recommendedHotel), command: local("Compare hotel options", "í˜¸í…” ì„ íƒì§€ ë¹„êµ", "Comparar hoteles") }].filter(Boolean)
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
    option.querySelector(".option-key").textContent = "âœ“";
  });
  missionGrid.querySelectorAll(".exclusive-choice-card").forEach((card) => {
    const detail = card.querySelector(".option-list .selectable-option");
    if (!detail) return;
    detail.setAttribute("aria-pressed", "true");
    detail.classList.remove("is-excluded");
    detail.querySelector(".option-key").textContent = "âœ“";
  });
  ["restaurants", "budget", "checklist"].forEach((cardId) => {
    missionGrid.querySelectorAll(`[data-card-id="${cardId}"] .option-row.selectable-option`).forEach((option) => {
      option.setAttribute("aria-pressed", "true");
      option.classList.remove("is-excluded");
      option.querySelector(".option-key").textContent = "âœ“";
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
        if (check) check.textContent = selected ? "âœ“" : "+";
      });
    });
  });
};

const renderApprovalList = () => {
  const experienceSteps = activeLanguage === "ko"
    ? ["ì„ íƒí•œ ê²½í—˜ ì •ë¦¬ ì¤‘...", "ì‹œê°„ë³„ ì¼ì • ì¤€ë¹„ ì¤‘...", "ìŒì‹ê³¼ ì´ë™ ì„ íƒ ë°˜ì˜ ì¤‘...", "ë‚ ì”¨ ëŒ€ì•ˆ í™•ì¸ ì¤‘...", "ë¯¸ì…˜ì„ ìµœì¢… ì¤€ë¹„ ì¤‘..."]
    : activeLanguage === "es"
      ? ["Organizando la experiencia elegida...", "Preparando el horario...", "Aplicando comida y transporte...", "Comprobando el plan climÃ¡tico...", "Finalizando la misiÃ³n..."]
      : ["Organizing your selected experience...", "Preparing the timeline...", "Applying food and transportation choices...", "Checking the weather backup...", "Finalizing your mission..."];
  const steps = isExperienceMission(currentResult, currentResult?.missionContext)
    ? experienceSteps
    : currentResult?.executionSequence?.[activeLanguage] || t("executionSteps");

  approvalList.innerHTML = steps
    .map((step) => {
      return `
        <div class="approval-item">
          <span class="approval-check">â€¢</span>
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
  const previewProfile = profileForResult(result, destination);
  if (previewProfile?.journeys?.length) {
    return rotateList(previewProfile.journeys, seed).map((item, index) => ({
      id: `v23-preview-journey-${previewProfile.id}-${index}`,
      name: local(item[0], item[1], item[2]),
      purpose: local(item[3], item[4], item[3]),
      tags: item[5] || [],
      reason: local(
        "This option is built from curated destination highlights and the current mission context.",
        "현재 미션과 실제 목적지 하이라이트를 기준으로 구성했습니다.",
        "Esta opción usa puntos reales del destino y el contexto de la misión."
      ),
      duration,
      tone: ["balanced", "culture", "food", "local"][index] || "balanced",
      comfort: local("Practical", "실용적", "Práctico"),
      budget: getTravelBudgetLabel(result, index === 2 ? "food" : "balanced"),
      timeline: item[5] || [],
      selected: index === 0,
      details: {
        flight: local("Round-trip options are compared after approval for live price and schedule.", "왕복 항공권은 승인 후 실시간 가격과 일정을 확인합니다.", "Vuelos ida y vuelta se comparan tras aprobación."),
        hotel: local("Hotel candidates are matched to the route, walking load, and room count.", "숙소 후보는 동선, 도보 부담, 객실 수에 맞춰 비교합니다.", "Hoteles según ruta, caminata y habitaciones."),
        transport: local("Daily movement is grouped by neighborhood to avoid unnecessary backtracking.", "불필요한 왕복 이동을 줄이도록 날마다 지역을 묶습니다.", "Se agrupa por zonas para evitar traslados inútiles."),
        food: local("Food candidates are placed near the day route instead of as a random list.", "맛집 후보는 무작위 목록이 아니라 그날 동선 근처로 배치합니다.", "Comida cerca de la ruta del día."),
        entry: local("Entry and document rules are rechecked through official sources before action.", "입국·서류 요건은 실행 전 공식 출처로 다시 확인합니다.", "Requisitos se verifican con fuentes oficiales."),
        insurance: local("Insurance and cancellation rules are prepared for review before booking.", "예약 전 보험과 취소 규정을 검토할 수 있게 준비합니다.", "Seguro y cancelación se preparan antes de reservar.")
      },
      sourceStates: {
        flight: getScenarioSourceState(result, "flight", "estimated"),
        hotel: getScenarioSourceState(result, "hotel", "estimated"),
        transport: getScenarioSourceState(result, "transport", "placeholder"),
        food: getScenarioSourceState(result, "food", "cached_public"),
        entry: getScenarioSourceState(result, "entry", "unavailable"),
        insurance: getScenarioSourceState(result, "insurance", "placeholder")
      }
    }));
  }
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
  const qrMarkup = `<div class="execution-summary-item is-wide is-reference"><span class="execution-summary-label">${local("Prototype reference", "í”„ë¡œí† íƒ€ìž… ì°¸ì¡° ë²ˆí˜¸", "Referencia del prototipo")}</span><span class="execution-summary-value">${escapeSummaryText(reference)}</span><a href="${escapeSummaryText(portableUrl)}" aria-label="${local("Reopen this summary from the QR link", "QR ë§í¬ë¡œ ì´ ìš”ì•½ ë‹¤ì‹œ ì—´ê¸°", "Volver a abrir este resumen desde el QR")}"><img class="prototype-reference-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=900x900&amp;format=png&amp;ecc=L&amp;qzone=8&amp;data=${encodeURIComponent(portableUrl)}" alt="${local("Prototype summary QR code", "í”„ë¡œí† íƒ€ìž… ìš”ì•½ QR ì½”ë“œ", "CÃ³digo QR del resumen")}" width="320" height="320"></a><small class="prototype-reference-qr-help">${local("Scan with your phone camera to reopen this summary", "íœ´ëŒ€í° ì¹´ë©”ë¼ë¡œ ìŠ¤ìº”í•˜ë©´ ì´ ìš”ì•½ì„ ë‹¤ì‹œ ì—´ ìˆ˜ ìžˆìŠµë‹ˆë‹¤", "Escanea con la cÃ¡mara para volver a abrir el resumen")}</small><span class="execution-summary-detail">${local("Not a booking number", "ì‹¤ì œ ì˜ˆì•½ ë²ˆí˜¸ê°€ ì•„ë‹™ë‹ˆë‹¤", "No es un nÃºmero de reserva")}</span></div>`;
  const rows = [
    row(local("Your experience", "ë‹¹ì‹ ì„ ìœ„í•œ ê²½í—˜", "Tu experiencia"), recommendation, experience.reasoning, true),
    row(local("Timeline", "ì‹œê°„ë³„ ì¼ì •", "Horario"), timeline, "", true),
    row(local("Food", "ìŒì‹ê³¼ ë””ì €íŠ¸", "Comida"), foods),
    row(local("Transportation", "ì´ë™ ë°©ë²•", "Transporte"), experience.transportation),
    row(local("Weather backup", "ë‚ ì”¨ ëŒ€ì•ˆ", "Alternativa climÃ¡tica"), experience.rainPlan),
    row(local("Other ideas", "ë‹¤ë¥¸ ì„ íƒì§€", "Otras ideas"), alternatives)
  ];
  executionSummary.innerHTML = `<div class="execution-summary-head"><h4>${local("Approved experience summary", "ìŠ¹ì¸ëœ ê²½í—˜ ìš”ì•½", "Resumen de experiencia aprobado")}</h4><p>${local("Your selected experience is organized and ready to use. No booking, payment, or provider contact has occurred.", "ì„ íƒí•œ ê²½í—˜ì„ ë°”ë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆë„ë¡ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤. ì˜ˆì•½, ê²°ì œ ë˜ëŠ” ì œê³µì—…ì²´ ì—°ë½ì€ ì§„í–‰ë˜ì§€ ì•Šì•˜ìŠµë‹ˆë‹¤.", "Tu experiencia estÃ¡ organizada y lista. No se realizÃ³ ninguna reserva, pago ni contacto con proveedores.")}</p><span class="execution-summary-status">${local("Prototype · Plan ready · Nothing booked", "í”„ë¡œí† íƒ€ìž… · ê³„íš ì¤€ë¹„ ì™„ë£Œ · ì‹¤ì œ ì˜ˆì•½ ì•„ë‹˜", "Prototipo · Plan listo · Sin reservas")}</span></div><div class="execution-summary-grid">${rows.join("")}${qrMarkup}</div><a class="all-in-slogan" href="index.html" aria-label="${local("Return home", "í™ˆìœ¼ë¡œ ëŒì•„ê°€ê¸°", "Volver al inicio")}"><span>All in</span><span class="all-in-one" aria-label="ONE"><img src="assets/one-final-circle.png?v=20260713-20" alt=""><strong>NE</strong></span></a>`;
  savePrototypeMission(reference);
};

const properCaseLocation = (value) => String(value || "").trim().toLowerCase().replace(/(^|[\s-])([a-zÃ -Ã¶Ã¸-Ã¿])/g, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);

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

const escapeSummaryText = (value) => String(value ?? "?").replace(/[&<>"\']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

const completeMissionLocal = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
const CHANGE_HISTORY_LIMIT = 8;

const missionExperienceState = () => {
  const state = currentResult?.completeMissionExperience || {};
  return {
    undoStack: Array.isArray(state.undoStack) ? state.undoStack : [],
    redoStack: Array.isArray(state.redoStack) ? state.redoStack : [],
    history: Array.isArray(state.history) ? state.history : []
  };
};

const persistMissionExperienceState = (patch = {}) => {
  if (!currentResult) return;
  currentResult.completeMissionExperience = {
    ...missionExperienceState(),
    ...patch,
    updatedAt: new Date().toISOString()
  };
  sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
};

const pushMissionChangeHistory = ({ before, command, summary, affectedSections = [], source = "mission_edit" } = {}) => {
  if (!before || !command) return;
  const state = missionExperienceState();
  const entry = {
    id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    command: String(command).slice(0, 180),
    summary: String(summary || "").slice(0, 260),
    affectedSections: affectedSections.slice(0, 8),
    source,
    at: new Date().toISOString()
  };
  persistMissionExperienceState({
    undoStack: [...state.undoStack, before].slice(-CHANGE_HISTORY_LIMIT),
    redoStack: [],
    history: [entry, ...state.history].slice(0, CHANGE_HISTORY_LIMIT)
  });
};

const undoMissionEdit = () => {
  const state = missionExperienceState();
  const previous = state.undoStack[state.undoStack.length - 1] || currentResult?.alpha15LastAddition?.previousResult;
  if (!previous) return false;
  const redoSnapshot = JSON.parse(JSON.stringify(currentResult));
  currentResult = previous;
  currentResult.alpha15LastAddition = {
    text: completeMissionLocal("Undo applied", "ë˜ëŒë¦¬ê¸° ì ìš©", "Deshacer aplicado"),
    summary: completeMissionLocal("Restored the previous mission version.", "ì´ì „ ë¯¸ì…˜ ë²„ì „ìœ¼ë¡œ ë˜ëŒë ¸ìŠµë‹ˆë‹¤.", "Se restaurÃ³ la versiÃ³n anterior."),
    affectedSections: ["mission"],
    at: new Date().toISOString()
  };
  currentResult.completeMissionExperience = {
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, redoSnapshot].slice(-CHANGE_HISTORY_LIMIT),
    history: [{
      id: `undo-${Date.now()}`,
      command: completeMissionLocal("Undo", "ë˜ëŒë¦¬ê¸°", "Deshacer"),
      summary: completeMissionLocal("Restored the previous mission version.", "ì´ì „ ë¯¸ì…˜ ë²„ì „ìœ¼ë¡œ ë˜ëŒë ¸ìŠµë‹ˆë‹¤.", "Se restaurÃ³ la versiÃ³n anterior."),
      affectedSections: ["mission"],
      source: "undo",
      at: new Date().toISOString()
    }, ...state.history].slice(0, CHANGE_HISTORY_LIMIT)
  };
  sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
  return true;
};

const redoMissionEdit = () => {
  const state = missionExperienceState();
  const next = state.redoStack[state.redoStack.length - 1];
  if (!next) return false;
  const undoSnapshot = JSON.parse(JSON.stringify(currentResult));
  currentResult = next;
  currentResult.alpha15LastAddition = {
    text: completeMissionLocal("Redo applied", "ë‹¤ì‹œ ì ìš©", "Rehacer aplicado"),
    summary: completeMissionLocal("Reapplied the last mission change.", "ë§ˆì§€ë§‰ ë¯¸ì…˜ ë³€ê²½ì„ ë‹¤ì‹œ ì ìš©í–ˆìŠµë‹ˆë‹¤.", "Se volviÃ³ a aplicar el Ãºltimo cambio."),
    affectedSections: ["mission"],
    at: new Date().toISOString()
  };
  currentResult.completeMissionExperience = {
    undoStack: [...state.undoStack, undoSnapshot].slice(-CHANGE_HISTORY_LIMIT),
    redoStack: state.redoStack.slice(0, -1),
    history: [{
      id: `redo-${Date.now()}`,
      command: completeMissionLocal("Redo", "ë‹¤ì‹œ ì ìš©", "Rehacer"),
      summary: completeMissionLocal("Reapplied the last mission change.", "ë§ˆì§€ë§‰ ë¯¸ì…˜ ë³€ê²½ì„ ë‹¤ì‹œ ì ìš©í–ˆìŠµë‹ˆë‹¤.", "Se volviÃ³ a aplicar el Ãºltimo cambio."),
      affectedSections: ["mission"],
      source: "redo",
      at: new Date().toISOString()
    }, ...state.history].slice(0, CHANGE_HISTORY_LIMIT)
  };
  sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
  return true;
};

const missionLifecycleCopy = (result = currentResult) => {
  const travel = isTravelResult(result);
  const hasLiveProviders = Boolean(result?.providerOrchestration?.providers?.some?.((provider) => provider.status === "connected" || provider.sourceState === "live"));
  return [
    { id: "wish", label: completeMissionLocal("Wish", "ìš”ì²­", "Deseo"), detail: completeMissionLocal("ONE received the mission.", "ONEì´ ë¯¸ì…˜ì„ ë°›ì•˜ìŠµë‹ˆë‹¤.", "ONE recibiÃ³ la misiÃ³n."), status: "done" },
    { id: "understanding", label: completeMissionLocal("Understanding", "ì´í•´", "ComprensiÃ³n"), detail: completeMissionLocal("Goal, language, destination, and constraints are interpreted.", "ëª©í‘œ, ì–¸ì–´, ëª©ì ì§€, ì¡°ê±´ì„ í•´ì„í–ˆìŠµë‹ˆë‹¤.", "Se interpretan objetivo, idioma, destino y condiciones."), status: "done" },
    { id: "research", label: completeMissionLocal("Research", "ì¡°ì‚¬", "InvestigaciÃ³n"), detail: travel ? completeMissionLocal("Destination-locked travel structure is prepared.", "ëª©ì ì§€ì— ë§žì¶˜ ì—¬í–‰ êµ¬ì¡°ë¥¼ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤.", "Se preparÃ³ una estructura de viaje fijada al destino.") : completeMissionLocal("Relevant mission paths are prepared.", "ê´€ë ¨ ë¯¸ì…˜ ê²½ë¡œë¥¼ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤.", "Se prepararon rutas relevantes."), status: "done" },
    { id: "provider-search", label: completeMissionLocal("Provider search", "ì œê³µì—…ì²´ ê²€ìƒ‰", "BÃºsqueda de proveedores"), detail: hasLiveProviders ? completeMissionLocal("Provider-backed results are available.", "ì œê³µì—…ì²´ ê·¼ê±°ê°€ ìžˆëŠ” ê²°ê³¼ë¥¼ ì‚¬ìš©í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "Hay resultados respaldados por proveedor.") : completeMissionLocal("Search criteria are ready. Live provider checks require approval or setup.", "ê²€ìƒ‰ ì¡°ê±´ì€ ì¤€ë¹„ëìŠµë‹ˆë‹¤. ì‹¤ì‹œê°„ ì œê³µì—…ì²´ í™•ì¸ì€ ìŠ¹ì¸ ë˜ëŠ” ì„¤ì •ì´ í•„ìš”í•©ë‹ˆë‹¤.", "Los criterios estÃ¡n listos. La bÃºsqueda en vivo requiere aprobaciÃ³n o configuraciÃ³n."), status: hasLiveProviders ? "done" : "prepared" },
    { id: "assembly", label: completeMissionLocal("Mission assembly", "ë¯¸ì…˜ êµ¬ì„±", "Montaje"), detail: completeMissionLocal("Options, tradeoffs, and safe next steps are assembled.", "ì„ íƒì§€, ë¹„êµì , ì•ˆì „í•œ ë‹¤ìŒ ë‹¨ê³„ë¥¼ êµ¬ì„±í–ˆìŠµë‹ˆë‹¤.", "Se organizan opciones, comparaciones y prÃ³ximos pasos seguros."), status: "done" },
    { id: "review", label: completeMissionLocal("Review & edit", "ê²€í†  ë° ìˆ˜ì •", "RevisiÃ³n"), detail: completeMissionLocal("You can adjust the plan before approval.", "ìŠ¹ì¸ ì „ ê³„íšì„ ìˆ˜ì •í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "Puedes ajustar antes de aprobar."), status: "current" },
    { id: "approval", label: completeMissionLocal("Approval", "ìŠ¹ì¸", "AprobaciÃ³n"), detail: completeMissionLocal("No external action happens until you approve.", "ìŠ¹ì¸ ì „ì—ëŠ” ì™¸ë¶€ ì‹¤í–‰ì´ ì—†ìŠµë‹ˆë‹¤.", "No hay acciÃ³n externa sin aprobaciÃ³n."), status: "next" }
  ];
};

let lifecycleTimer = null;
const runMissionLifecycleProgress = (steps = []) => {
  if (!missionLifecycleLive) return;
  window.clearTimeout(lifecycleTimer);
  const messages = steps.filter((step) => step.status !== "next").map((step) => step.detail).concat(completeMissionLocal("Mission ready.", "ë¯¸ì…˜ ì¤€ë¹„ ì™„ë£Œ.", "MisiÃ³n lista."));
  let index = 0;
  const tick = () => {
    missionLifecycleLive.textContent = messages[index] || messages[messages.length - 1];
    index += 1;
    if (index < messages.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      lifecycleTimer = window.setTimeout(tick, 420);
    }
  };
  tick();
};

const renderMissionLifecycle = (result = currentResult) => {
  if (!missionLifecyclePanel || !missionLifecycleSteps) return;
  const steps = missionLifecycleCopy(result);
  if (missionLifecycleEyebrow) missionLifecycleEyebrow.textContent = completeMissionLocal("ONE Progress", "ONE ì§„í–‰ ìƒí™©", "Progreso de ONE");
  if (missionLifecycleTitle) missionLifecycleTitle.textContent = completeMissionLocal("Everything is being organized intentionally.", "í•„ìš”í•œ ê²ƒë§Œ ì°¨ë¶„ížˆ ì •ë¦¬í•˜ê³  ìžˆìŠµë‹ˆë‹¤.", "Todo se estÃ¡ organizando con intenciÃ³n.");
  missionLifecycleSteps.innerHTML = steps.map((step) => `
    <li class="mission-lifecycle-step is-${escapeSummaryText(step.status)}" data-lifecycle-step="${escapeSummaryText(step.id)}">
      <span class="mission-lifecycle-dot" aria-hidden="true"></span>
      <strong>${escapeSummaryText(step.label)}</strong>
      <small>${escapeSummaryText(step.detail)}</small>
    </li>
  `).join("");
  runMissionLifecycleProgress(steps);
};

const createMissionConfidenceCard = (result = currentResult) => {
  const schedule = result?.schedule || {};
  const budget = result?.budget?.estimatedTotal || result?.budget?.total || result?.budget || {};
  const destination = getTravelDestinationLabel(result) || result?.destination?.city || result?.destination?.country || result?.display?.destination || approvalMissionName();
  const limitations = [];
  if (!result?.providerOrchestration?.providers?.some?.((provider) => provider.status === "connected" || provider.sourceState === "live")) limitations.push(completeMissionLocal("Live provider confirmation is still required.", "ì‹¤ì‹œê°„ ì œê³µì—…ì²´ í™•ì¸ì´ ì•„ì§ í•„ìš”í•©ë‹ˆë‹¤.", "AÃºn falta confirmaciÃ³n en vivo del proveedor."));
  if (!schedule.startDate || !schedule.endDate) limitations.push(completeMissionLocal("Dates can be confirmed before approval.", "ë‚ ì§œëŠ” ìŠ¹ì¸ ì „ í™•ì¸í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "Las fechas pueden confirmarse antes de aprobar."));
  const rows = [
    [completeMissionLocal("Destination", "ëª©ì ì§€", "Destino"), destination || completeMissionLocal("Prepared mission", "ì¤€ë¹„ëœ ë¯¸ì…˜", "MisiÃ³n preparada")],
    [completeMissionLocal("Duration", "ê¸°ê°„", "DuraciÃ³n"), schedule.startDate && schedule.endDate ? `${schedule.startDate} â†’ ${schedule.endDate}` : completeMissionLocal("Flexible", "ìœ ë™ì ", "Flexible")],
    [completeMissionLocal("Budget", "ì˜ˆì‚°", "Presupuesto"), formatRange(budget) || completeMissionLocal("Flexible", "ìœ ë™ì ", "Flexible")],
    [completeMissionLocal("Transportation", "ì´ë™", "Transporte"), result?.airportTransfer?.recommended ? localize(result.airportTransfer.recommended) : completeMissionLocal("Prepared for comparison", "ë¹„êµ ì¤€ë¹„ë¨", "Preparado para comparar")],
    [completeMissionLocal("Accommodation", "ìˆ™ì†Œ", "Alojamiento"), result?.hotels?.[0] ? getHotelName(result.hotels[0]) : completeMissionLocal("Optional or pending", "ì„ íƒ ë˜ëŠ” í™•ì¸ í•„ìš”", "Opcional o pendiente")],
    [completeMissionLocal("Food", "ìŒì‹", "Comida"), result?.restaurants?.length ? `${result.restaurants.length} ${completeMissionLocal("options", "ê°œ í›„ë³´", "opciones")}` : completeMissionLocal("Can be expanded", "í™•ìž¥ ê°€ëŠ¥", "Se puede ampliar")],
    [completeMissionLocal("Known limitations", "ì•Œë ¤ì§„ ì œí•œ", "Limitaciones"), limitations.join(" ") || completeMissionLocal("No major issue found in the prepared plan.", "ì¤€ë¹„ëœ ê³„íšì—ì„œ í° ë¬¸ì œëŠ” ì—†ìŠµë‹ˆë‹¤.", "No se detectÃ³ un problema principal.")]
  ];
  const article = document.createElement("article");
  article.className = "mission-card is-full mission-confidence-card";
  article.dataset.cardId = "mission-confidence";
  article.innerHTML = `<div class="card-top"><h2 class="card-title">${escapeSummaryText(completeMissionLocal("Before approval", "ìŠ¹ì¸ ì „ í™•ì¸", "Antes de aprobar"))}</h2><span class="recommendation-label">${escapeSummaryText(completeMissionLocal("Confidence summary", "ì‹ ë¢° ìš”ì•½", "Resumen"))}</span></div><div class="mission-confidence-grid">${rows.map(([label, value]) => `<div><span>${escapeSummaryText(label)}</span><strong>${escapeSummaryText(value)}</strong></div>`).join("")}</div>`;
  return article;
};

const createIntelligentEmptyState = ({ title, detail, actions = [] } = {}) => {
  const wrapper = document.createElement("div");
  wrapper.className = "intelligent-empty-state";
  wrapper.innerHTML = `<strong>${escapeSummaryText(title || completeMissionLocal("Nothing to show yet", "ì•„ì§ í‘œì‹œí•  ì •ë³´ê°€ ì—†ìŠµë‹ˆë‹¤", "Nada que mostrar todavÃ­a"))}</strong><p>${escapeSummaryText(detail || completeMissionLocal("ONE can retry, expand the search, or keep the mission ready while you decide.", "ONEì´ ë‹¤ì‹œ ì‹œë„í•˜ê±°ë‚˜ ê²€ìƒ‰ ë²”ìœ„ë¥¼ ë„“ížˆê³ , ê²°ì • ì „ê¹Œì§€ ë¯¸ì…˜ì„ ì¤€ë¹„ ìƒíƒœë¡œ ìœ ì§€í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "ONE puede reintentar, ampliar la bÃºsqueda o mantener la misiÃ³n lista."))}</p>${actions.length ? `<div>${actions.map((action) => `<button type="button" data-revision-command="${escapeSummaryText(action.command || action)}">${escapeSummaryText(action.label || action)}</button>`).join("")}</div>` : ""}`;
  return wrapper;
};

const enhanceEmptyStates = () => {
  if (!missionGrid.children.length) {
    missionGrid.appendChild(createIntelligentEmptyState({
      title: completeMissionLocal("ONE has the mission, but needs a clean result surface.", "ONEì´ ë¯¸ì…˜ì„ ë°›ì•˜ì§€ë§Œ ê²°ê³¼ í‘œì‹œë¥¼ ì •ë¦¬í•´ì•¼ í•©ë‹ˆë‹¤.", "ONE tiene la misiÃ³n, pero necesita preparar la vista."),
      detail: completeMissionLocal("Try again or add one missing detail. No external action happened.", "ë‹¤ì‹œ ì‹œë„í•˜ê±°ë‚˜ í•„ìš”í•œ ì •ë³´ í•˜ë‚˜ë§Œ ì¶”ê°€í•´ ì£¼ì„¸ìš”. ì™¸ë¶€ ì‹¤í–‰ì€ ì—†ì—ˆìŠµë‹ˆë‹¤.", "Reintenta o aÃ±ade un dato. No hubo acciÃ³n externa.")
    }));
  }
  missionGrid.querySelectorAll(".option-list").forEach((list) => {
    if (list.children.length || list.dataset.emptyEnhanced === "true") return;
    list.dataset.emptyEnhanced = "true";
    list.appendChild(createIntelligentEmptyState({
      title: completeMissionLocal("No matching option yet", "ì•„ì§ ë§žëŠ” ì„ íƒì§€ê°€ ì—†ìŠµë‹ˆë‹¤", "AÃºn no hay opciÃ³n compatible"),
      detail: completeMissionLocal("ONE can expand the search radius, try another preference, or retry later.", "ê²€ìƒ‰ ë²”ìœ„ë¥¼ ë„“ížˆê±°ë‚˜ ë‹¤ë¥¸ ì„ í˜¸ ì¡°ê±´ìœ¼ë¡œ ë‹¤ì‹œ ë³¼ ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "ONE puede ampliar radio, probar otra preferencia o reintentar."),
      actions: [
        { label: completeMissionLocal("Expand search", "ê²€ìƒ‰ ë„“ížˆê¸°", "Ampliar bÃºsqueda"), command: completeMissionLocal("Expand the search radius", "ê²€ìƒ‰ ë²”ìœ„ë¥¼ ë„“í˜€ì¤˜", "AmplÃ­a el radio de bÃºsqueda") },
        { label: completeMissionLocal("Retry", "ë‹¤ì‹œ ì‹œë„", "Reintentar"), command: completeMissionLocal("Retry this section", "ì´ ë¶€ë¶„ ë‹¤ì‹œ í™•ì¸í•´ì¤˜", "Reintenta esta secciÃ³n") }
      ]
    }));
  });
};

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
    verified_live: v231Local("Verified live", "ì‹¤ì‹œê°„ í™•ì¸ë¨", "Verificado en vivo"),
    cached_public: v231Local("Recent public information", "ìµœê·¼ ê³µê°œ ì •ë³´ ê¸°ì¤€", "InformaciÃ³n pÃºblica reciente"),
    estimated: v231Local("Estimated information", "ì˜ˆìƒ ì •ë³´", "InformaciÃ³n estimada"),
    placeholder: v231Local("Search criteria prepared", "ê²€ìƒ‰ ì¡°ê±´ ì¤€ë¹„ë¨", "Criterios preparados"),
    unavailable: v231Local("Not retrieved yet", "ì•„ì§ ì¡°íšŒë˜ì§€ ì•ŠìŒ", "AÃºn no consultado")
  };
  return labels[normalized];
};

const simpleHash = (value) => [...String(value || "")].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
const rotateList = (items, seed) => {
  if (!items.length) return [];
  const offset = Math.abs(simpleHash(seed)) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
};

const buildJapanCreativeJourneys = (result, destination, duration) => {
  const ko = activeLanguage === "ko";
  const es = activeLanguage === "es";
  const raw = result.rawInput || result.mission || "";
  const { travelerCount, groupType } = getTravelPartyDetails(result);
  const seed = `${result.missionSeed || result.id || raw}-${result.schedule?.startDate || ""}-${travelerCount}`;
  const isSolo = groupType === "solo";
  const isFamily = /ê°€ì¡±|ì•„ì´|ì•„ì´ì™€|children|kids|family|familia/i.test(raw);
  const label = (en, koText, esText) => ko ? koText : es ? esText : en;
  const names = rotateList(isFamily
    ? [
        ["Japan family memory route", "ì¼ë³¸ ê°€ì¡± ì¶”ì–µ ì½”ìŠ¤", "JapÃ³n en familia"],
        ["Theme park + food Japan", "í…Œë§ˆíŒŒí¬ì™€ ë§›ì§‘ ì¼ë³¸", "JapÃ³n parques y comida"],
        ["Easy kids-friendly Japan", "ì•„ì´ì™€ íŽ¸í•œ ì¼ë³¸", "JapÃ³n fÃ¡cil con niÃ±os"],
        ["Nature + city Japan", "ìžì—°ê³¼ ë„ì‹œ ì¼ë³¸", "JapÃ³n naturaleza y ciudad"]
      ]
    : isSolo
      ? [
          ["Solo discovery Japan", "í˜¼ìž ì¦ê¸°ëŠ” ì¼ë³¸", "JapÃ³n solo discovery"],
          ["Food-photo Japan", "ë§›ì§‘·ì‚¬ì§„ ì¼ë³¸", "JapÃ³n comida y fotos"],
          ["Hidden cafe Japan", "ìˆ¨ì€ ì¹´íŽ˜ ì¼ë³¸", "JapÃ³n de cafÃ©s ocultos"],
          ["Slow healing Japan", "í˜¼í–‰ ížë§ ì¼ë³¸", "JapÃ³n tranquilo solo"]
        ]
      : [
          ["Creative Japan highlights", "ì°½ì˜ì ì¸ ì¼ë³¸ í•˜ì´ë¼ì´íŠ¸", "JapÃ³n creativo"],
          ["Food + night view Japan", "ë§›ì§‘ê³¼ ì•¼ê²½ ì¼ë³¸", "JapÃ³n comida y noche"],
          ["Kyoto-style memory trip", "êµí†  ê°ì„± ì¶”ì–µ ì—¬í–‰", "Viaje memorable estilo Kioto"],
          ["Skyline + hidden cafÃ©s", "ì „ë§ê³¼ ìˆ¨ì€ ì¹´íŽ˜ ì¼ë³¸", "Vistas y cafÃ©s ocultos"]
        ], seed);
  const timelinePool = rotateList([
    label(["Arrival setup", "Market lunch", "Skyline or night view", "Theme park / aquarium", "Kyoto-style walk", "Shopping and cafÃ©s", "Return prep"], ["ë„ì°©·ë™ë„¤ ì ì‘", "ì‹œìž¥ ì ì‹¬", "ì „ë§ëŒ€ ë˜ëŠ” ì•¼ê²½", "í…Œë§ˆíŒŒí¬/ìˆ˜ì¡±ê´€", "êµí†  ê°ì„± ì‚°ì±…", "ì‡¼í•‘·ì¹´íŽ˜", "ê·€êµ­ ì¤€ë¹„"], ["Llegada", "Mercado", "Vistas", "Parque/acuario", "Paseo estilo Kioto", "Compras y cafÃ©s", "Regreso"]),
    label(["First meal", "teamLab / exhibit", "Sushi or ramen", "Shrine and alleys", "Local experience", "Night dessert", "Souvenirs"], ["ì²« ì‹ì‚¬", "íŒ€ëž©/ì „ì‹œ", "ìŠ¤ì‹œ ë˜ëŠ” ë¼ë©˜", "ì‹ ì‚¬·ê³¨ëª© ì‚°ì±…", "í˜„ì§€ ì²´í—˜", "ì•¼ê²½ ë””ì €íŠ¸", "ê¸°ë…í’ˆ"], ["Primera comida", "teamLab/exposiciÃ³n", "Sushi o ramen", "Templo y callejones", "Experiencia local", "Postre nocturno", "Recuerdos"]),
    label(["Easy start", "Dotonbori / Shibuya", "Cooking class", "Onsen or spa", "CafÃ© tour", "Indoor mall", "Easy return"], ["ê°€ë²¼ìš´ ì‹œìž‘", "ë„í†¤ë³´ë¦¬/ì‹œë¶€ì•¼", "ì¿ í‚¹ í´ëž˜ìŠ¤", "ì˜¨ì²œ ë˜ëŠ” ìŠ¤íŒŒ", "ì¹´íŽ˜ íˆ¬ì–´", "ì‹¤ë‚´ ì‡¼í•‘ëª°", "ì—¬ìœ  ê·€êµ­"], ["Inicio fÃ¡cil", "Dotonbori/Shibuya", "Clase de cocina", "Onsen/spa", "CafÃ©s", "Centro comercial", "Regreso fÃ¡cil"])
  ], seed);
  return names.map((name, index) => ({
    id: `v23-japan-journey-${index}`,
    name: name[ko ? 1 : es ? 2 : 0],
    purpose: label("A fuller Japan plan built around one memorable moment each day.", "í•˜ë£¨ì— í•˜ë‚˜ì”© ê¸°ì–µì— ë‚¨ëŠ” ìˆœê°„ì„ ë„£ì€ ë” í’ì„±í•œ ì¼ë³¸ ì¼ì •ìž…ë‹ˆë‹¤.", "Un viaje a JapÃ³n con un momento memorable cada dÃ­a."),
    tags: isFamily ? label(["Family", "Aquarium", "Theme park", "Easy"], ["ê°€ì¡±", "ì•„ì¿ ì•„ë¦¬ì›€", "í…Œë§ˆíŒŒí¬", "íŽ¸í•œ ì´ë™"], ["Familia", "Acuario", "Parques", "FÃ¡cil"]) : isSolo ? label(["Solo", "Food", "Photo", "Flexible"], ["í˜¼í–‰", "ë§›ì§‘", "ì‚¬ì§„", "ìžìœ "], ["Solo", "Comida", "Fotos", "Flexible"]) : label(["Food", "Skyline", "Culture", "Indoor backup"], ["ë§›ì§‘", "ì „ë§", "ë¬¸í™”", "ì‹¤ë‚´ ëŒ€ì•ˆ"], ["Comida", "Vistas", "Cultura", "Interior"]),
    reason: label("This rotates iconic places, food, indoor backup, and recovery time so Japan does not feel repetitive.", "ëª…ì†Œ, ë§›ì§‘, ì‹¤ë‚´ ëŒ€ì•ˆ, íœ´ì‹ ì‹œê°„ì„ ë‹¤ì–‘í•˜ê²Œ ì„žì–´ ì¼ë³¸ ì¼ì •ì´ ë°˜ë³µì ìœ¼ë¡œ ëŠê»´ì§€ì§€ ì•Šê²Œ í–ˆìŠµë‹ˆë‹¤.", "Rota lugares icÃ³nicos, comida, planes interiores y descanso para no repetir."),
    duration,
    tone: ["balanced", "food", "value", "rest"][index],
    comfort: label(index === 2 ? "Efficient" : "Comfortable", index === 2 ? "ì‹¤ì†" : "íŽ¸ì•ˆí•¨", index === 2 ? "Eficiente" : "CÃ³modo"),
    budget: getTravelBudgetLabel(result, ["balanced", "food", "value", "rest"][index]),
    timeline: timelinePool[index % timelinePool.length],
    selected: index === 0,
    details: {
      flight: label("Compare round-trip flights from the selected departure airport.", "ì„ íƒí•œ ì¶œë°œ ê³µí•­ ê¸°ì¤€ ì™•ë³µ í•­ê³µíŽ¸ì„ ë¹„êµí•©ë‹ˆë‹¤.", "Comparar vuelos ida y vuelta desde el aeropuerto elegido."),
      hotel: label(`${destination} hotels are priced for the full stay and room count.`, `${destination} ìˆ™ì†ŒëŠ” ì „ì²´ ìˆ™ë°• ê¸°ê°„ê³¼ ê°ì‹¤ ìˆ˜ ê¸°ì¤€ìœ¼ë¡œ ê³„ì‚°í•©ë‹ˆë‹¤.`, `Hoteles en ${destination} calculados por duraciÃ³n completa y habitaciones.`),
      transport: label("Compare JR, subway, official airport transfer, and taxis by day.", "JR·ì§€í•˜ì² ·ê³µì‹ ê³µí•­ ì´ë™·íƒì‹œë¥¼ ì¼ì •ë³„ë¡œ ë¹„êµí•©ë‹ˆë‹¤.", "Comparar JR, metro, traslado oficial y taxi por dÃ­a."),
      food: label("Spread ramen, sushi, market food, cafÃ©s, and desserts across the trip.", "ë¼ë©˜, ìŠ¤ì‹œ, ì‹œìž¥ ìŒì‹, ì¹´íŽ˜, ë””ì €íŠ¸ë¥¼ ì¼ì •ë³„ë¡œ ë¶„ì‚°í•©ë‹ˆë‹¤.", "Distribuir ramen, sushi, mercados, cafÃ©s y postres."),
      entry: label("Re-check entry requirements through official channels before execution.", "ìž…êµ­ ìš”ê±´ì€ ì‹¤í–‰ ì „ ê³µì‹ ì±„ë„ë¡œ ë‹¤ì‹œ í™•ì¸í•©ë‹ˆë‹¤.", "Revisar requisitos oficiales antes de ejecutar."),
      insurance: label("Prepare insurance and schedule-change risk review.", "ì—¬í–‰ìž ë³´í—˜ê³¼ ì¼ì • ë³€ê²½ ë¦¬ìŠ¤í¬ë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤.", "Preparar seguro y riesgo de cambios.")
    },
    sourceStates: {
      flight: getScenarioSourceState(result, "flight", "estimated"),
      hotel: getScenarioSourceState(result, "hotel", "estimated"),
      transport: getScenarioSourceState(result, "transport", "placeholder"),
      food: getScenarioSourceState(result, "food", "placeholder"),
      entry: getScenarioSourceState(result, "entry", "unavailable"),
      insurance: getScenarioSourceState(result, "insurance", "placeholder")
    }
  }));
};

const getV231MissingTravelFields = () => {
  const schedule = currentResult?.schedule || {};
  const answers = currentResult?.followUp?.answers || {};
  const missing = [];
  if (!schedule.startDate) missing.push(v231Local("Outbound date", "ì¶œêµ­ ë‚ ì§œ", "Fecha de salida"));
  if (!schedule.endDate) missing.push(v231Local("Return date or trip length", "ê·€êµ­ ë‚ ì§œ ë˜ëŠ” ì—¬í–‰ ê¸°ê°„", "Fecha de regreso o duraciÃ³n"));
  if (!answers.adults && !currentResult?.travelerCount && !currentResult?.travelers) missing.push(v231Local("Number of travelers", "ì—¬í–‰ ì¸ì›", "NÃºmero de viajeros"));
  if (!answers.originAirport && !currentResult?.originAirport) missing.push(v231Local("Departure airport confirmation", "ì¶œë°œ ê³µí•­ í™•ì¸", "Aeropuerto de salida"));
  if (!answers.rooms && !currentResult?.rooms) missing.push(v231Local("Number of rooms", "ê°ì‹¤ ìˆ˜", "NÃºmero de habitaciones"));
  if (!currentResult?.budget?.preference && !currentResult?.budget?.userBudget && !currentResult?.budget?.estimatedTotal) missing.push(v231Local("Preferred budget range", "ì„ í˜¸ ì˜ˆì‚° ë²”ìœ„", "Rango de presupuesto preferido"));
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
    v231Local("Keep the selected journey direction", "ì„ íƒí•œ ì—¬í–‰ ë°©í–¥ ìœ ì§€", "Mantener el viaje elegido"),
    v231Local("Prepare live flight search criteria", "ì‹¤ì‹œê°„ í•­ê³µíŽ¸ ê²€ìƒ‰ ì¡°ê±´ ì¤€ë¹„", "Preparar criterios de vuelos en vivo"),
    v231Local("Prepare accommodation search criteria", "ìˆ™ì†Œ ê²€ìƒ‰ ì¡°ê±´ ì¤€ë¹„", "Preparar criterios de alojamiento"),
    v231Local("Organize transport, food, and activity criteria", "êµí†µ·ì‹ì‚¬·í™œë™ ì¡°ê±´ ì •ë¦¬", "Organizar transporte, comida y actividades"),
    v231Local("Prepare a final comparison plan", "ìµœì¢… ë¹„êµì•ˆ ì¤€ë¹„", "Preparar comparaciÃ³n final")
  ];
  const actionRows = [
    { title: v231Local("Flights", "í•­ê³µíŽ¸", "Vuelos"), body: journey.details?.flight || "â€”", state: source.flight || "unavailable" },
    { title: v231Local("Accommodation", "ìˆ™ì†Œ", "Alojamiento"), body: journey.details?.hotel || "â€”", state: source.hotel || "unavailable" },
    { title: v231Local("Local transportation", "í˜„ì§€ ì´ë™", "Transporte local"), body: journey.details?.transport || "â€”", state: source.transport || "placeholder" },
    { title: v231Local("Food and activities", "ì‹ì‚¬ì™€ í™œë™", "Comida y actividades"), body: journey.details?.food || "â€”", state: source.food || "placeholder" }
  ];
  const stillNeeded = missing.length
    ? missing
    : [v231Local("Nothing essential is missing for the next preparation step.", "ë‹¤ìŒ ì¤€ë¹„ ë‹¨ê³„ì— ê¼­ í•„ìš”í•œ ì •ë³´ëŠ” ì´ë¯¸ ìžˆìŠµë‹ˆë‹¤.", "No falta informaciÃ³n esencial para el siguiente paso.")];
  const providerNotice = state === "live_search_requested"
    ? v231Local(
        "Live provider search was approved, but no live provider adapter is connected in this prototype yet.",
        "ì‹¤ì‹œê°„ ì œê³µì—…ì²´ ì¡°íšŒëŠ” ìŠ¹ì¸ë˜ì—ˆì§€ë§Œ, ì´ í”„ë¡œí† íƒ€ìž…ì—ëŠ” ì•„ì§ ì—°ê²°ëœ ì‹¤ì‹œê°„ ì œê³µì—…ì²´ ì–´ëŒ‘í„°ê°€ ì—†ìŠµë‹ˆë‹¤.",
        "La bÃºsqueda en vivo fue aprobada, pero este prototipo aÃºn no tiene un adaptador de proveedor en vivo conectado."
      )
    : v231Local(
        "Provider search has not started yet. ONE only prepared the next step.",
        "ì œê³µì—…ì²´ ì¡°íšŒëŠ” ì•„ì§ ì‹œìž‘ë˜ì§€ ì•Šì•˜ìŠµë‹ˆë‹¤. ONEì€ ë‹¤ìŒ ë‹¨ê³„ë§Œ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤.",
        "La bÃºsqueda de proveedores aÃºn no comenzÃ³. ONE solo preparÃ³ el siguiente paso."
      );

  setV231CompletionHeader(
    v231Local("Next step prepared", "ë‹¤ìŒ ë‹¨ê³„ë¥¼ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤", "Siguiente paso preparado"),
    v231Local(
      `ONE organized the criteria needed to continue with â€œ${journey.name}â€.`,
      `ì„ íƒí•œ â€˜${journey.name}â€™ ì—¬í–‰ì„ ê¸°ì¤€ìœ¼ë¡œ ë‹¤ìŒ í™•ì¸ì— í•„ìš”í•œ ì¡°ê±´ì„ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤.`,
      `ONE organizÃ³ los criterios para continuar con â€œ${journey.name}â€.`
    )
  );

  executionSummary.innerHTML = `
    <section class="v231-continuation" data-stage="${escapeSummaryText(state)}">
      <div class="v231-stage-strip">${escapeSummaryText(v231Local("No booking, payment, ticketing, submission, or provider contact has occurred.", "ì•„ì§ ì˜ˆì•½, ê²°ì œ, ë°œê¶Œ, ì œì¶œ, ì œê³µì—…ì²´ ì—°ë½ì€ ì§„í–‰ë˜ì§€ ì•Šì•˜ìŠµë‹ˆë‹¤.", "TodavÃ­a no hay reserva, pago, emisiÃ³n, envÃ­o ni contacto con proveedores."))}</div>
      <article class="v231-selected-journey">
        <span class="v23-eyebrow">${escapeSummaryText(v231Local("Selected journey", "ì„ íƒí•œ ì—¬í–‰", "Viaje elegido"))}</span>
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
        <h4>${escapeSummaryText(v231Local("Scope approved", "ìŠ¹ì¸í•œ ë²”ìœ„", "Alcance aprobado"))}</h4>
        <ul>${approvedScope.map((item) => `<li>âœ“ ${escapeSummaryText(item)}</li>`).join("")}</ul>
      </article>
      <article class="v231-card">
        <h4>${escapeSummaryText(v231Local("What ONE will check next", "ONEì´ ë‹¤ìŒì— í™•ì¸í•  ë‚´ìš©", "Lo que ONE comprobarÃ¡ despuÃ©s"))}</h4>
        <div class="v231-action-grid">
          ${actionRows.map((item) => `
            <section>
              <strong>${escapeSummaryText(item.title)}</strong>
              <p>${escapeSummaryText(item.body)}</p>
              <small>${escapeSummaryText(v231Local("Current state", "í˜„ìž¬ ìƒíƒœ", "Estado actual"))}: ${escapeSummaryText(getV231SourceStateLabel(item.state))}</small>
            </section>
          `).join("")}
        </div>
        <p class="v231-provider-notice">${escapeSummaryText(providerNotice)}</p>
      </article>
      <article class="v231-card">
        <h4>${escapeSummaryText(v231Local("Information still needed", "ì•„ì§ í•„ìš”í•œ ì •ë³´", "InformaciÃ³n pendiente"))}</h4>
        <ul>${stillNeeded.map((item) => `<li>${escapeSummaryText(item)}</li>`).join("")}</ul>
      </article>
      <article class="v231-next-action">
        <strong>${escapeSummaryText(v231Local("One safe next action", "ì•ˆì „í•œ ë‹¤ìŒ ìž‘ì—… í•˜ë‚˜", "Una acciÃ³n segura siguiente"))}</strong>
        <button type="button" class="v231-primary" data-v231-live-search>${escapeSummaryText(v231Local("Approve live search only", "실시간 조회만 승인하기", "Aprobar solo búsqueda en vivo"))}</button>
        <p>${escapeSummaryText(v231Local(
          "This allows search and comparison only. Before any booking or payment, ONE must show exact options, price, provider, terms, and ask for separate approval.",
          "ì´ ìŠ¹ì¸ì€ ê²€ìƒ‰ê³¼ ë¹„êµê¹Œì§€ë§Œ í—ˆìš©í•©ë‹ˆë‹¤. ì˜ˆì•½ì´ë‚˜ ê²°ì œ ì „ì—ëŠ” ONEì´ ì •í™•í•œ ì˜µì…˜, ê¸ˆì•¡, ì œê³µì—…ì²´, ì¡°ê±´ì„ ë‹¤ì‹œ ë³´ì—¬ë“œë¦¬ê³  ë³„ë„ ìŠ¹ì¸ì„ ìš”ì²­í•´ì•¼ í•©ë‹ˆë‹¤.",
          "Esto permite solo bÃºsqueda y comparaciÃ³n. Antes de reservar o pagar, ONE debe mostrar opciones, precio, proveedor y condiciones exactas, y pedir otra aprobaciÃ³n."
        ))}</p>
      </article>
    </section>
  `;
};

const renderV231BlockedCompletionState = () => {
  if (!executionSummary) return;
  setV231CompletionHeader(
    v231Local("Completion requires evidence", "ì™„ë£Œì—ëŠ” í™•ì¸ ì¦ê±°ê°€ í•„ìš”í•©ë‹ˆë‹¤", "La finalizaciÃ³n requiere evidencia"),
    v231Local(
      "ONE did not open a completed booking screen because no verified provider result exists.",
      "í™•ì¸ëœ ì œê³µì—…ì²´ ê²°ê³¼ê°€ ì—†ê¸° ë•Œë¬¸ì— ì™„ë£Œëœ ì˜ˆì•½ í™”ë©´ì„ ì—´ì§€ ì•Šì•˜ìŠµë‹ˆë‹¤.",
      "ONE no abriÃ³ una pantalla de reserva completada porque no existe un resultado verificado del proveedor."
    )
  );
  executionSummary.innerHTML = `
    <section class="v231-continuation v231-blocked" data-stage="completion-blocked">
      <div class="v231-stage-strip">${escapeSummaryText(v231Local("No booking, payment, ticketing, submission, or provider contact has occurred.", "ì•„ì§ ì˜ˆì•½, ê²°ì œ, ë°œê¶Œ, ì œì¶œ, ì œê³µì—…ì²´ ì—°ë½ì€ ì§„í–‰ë˜ì§€ ì•Šì•˜ìŠµë‹ˆë‹¤.", "TodavÃ­a no hay reserva, pago, emisiÃ³n, envÃ­o ni contacto con proveedores."))}</div>
      <article class="v231-card">
        <h4>${escapeSummaryText(v231Local("Why this was blocked", "ì°¨ë‹¨ëœ ì´ìœ ", "Por quÃ© se bloqueÃ³"))}</h4>
        <p>${escapeSummaryText(v231Local(
          "A prototype reference or direct completion link cannot prove that a real provider completed anything.",
          "í”„ë¡œí† íƒ€ìž… ì°¸ì¡° ë²ˆí˜¸ë‚˜ ì§ì ‘ ì™„ë£Œ ë§í¬ëŠ” ì‹¤ì œ ì œê³µì—…ì²´ê°€ ë¬´ì–¸ê°€ë¥¼ ì™„ë£Œí–ˆë‹¤ëŠ” ì¦ê±°ê°€ ë  ìˆ˜ ì—†ìŠµë‹ˆë‹¤.",
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
      "ê²€ì¦ëœ ì™„ë£Œì—ëŠ” ì‹¤ì œ ì œê³µì—…ì²´ ì˜ìˆ˜ì¦ì´ í•„ìš”í•©ë‹ˆë‹¤. ì´ ë¯¸ë¦¬ë³´ê¸°ëŠ” ê°€ì§œ ì™„ë£Œ í™”ë©´ìœ¼ë¡œ ê°€ì§€ ì•ŠìŠµë‹ˆë‹¤.",
      "La finalizaciÃ³n verificada requiere un recibo real del proveedor. Esta vista previa no muestra una finalizaciÃ³n falsa."
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

  const local = completeMissionLocal;
  const alpha03Selections = currentResult.alpha03PreviewSelections || {};
  const flightIndex = typeof alpha03Selections.flights === "number" ? alpha03Selections.flights : selectedOptionIndex("flights");
  const flight = currentResult.flights?.[flightIndex] || currentResult.flights?.[0];
  const hotelIndex = typeof alpha03Selections.hotels === "number" ? alpha03Selections.hotels : selectedOptionIndex("hotel");
  const hotel = currentResult.hotels?.[hotelIndex] || currentResult.hotels?.[0];
  const transferIndex = typeof alpha03Selections.transport === "number" ? alpha03Selections.transport : selectedOptionIndex("airport-transfer");
  const transfer = currentResult.airportTransfer?.options?.[transferIndex] || currentResult.airportTransfer?.recommended;
  const selectedRestaurantButtons = [...missionGrid.querySelectorAll('[data-card-id="restaurants"] .selectable-option[aria-pressed="true"]')];
  const schedule = currentResult.schedule || {};
  const { tripNights } = calculateTripDayCounts(currentResult);
  const { rooms } = getTravelPartyDetails(currentResult);
  const dateRange = schedule.startDate && schedule.endDate
    ? `${schedule.startDate} → ${schedule.endDate}`
    : `${schedule.startDate || "—"} → ${schedule.endDate || "—"}`;
  const timeLabels = {
    any: local("Time to be confirmed", "ì‹œê°„ í™•ì¸ í•„ìš”", "Hora por confirmar"),
    morning: local("Morning", "ì˜¤ì „", "MaÃ±ana"),
    afternoon: local("Afternoon", "ì˜¤í›„", "Tarde"),
    evening: local("Evening", "ì €ë…", "Noche")
  };
  const selectedTime = timeLabels[schedule.timePreference] || timeLabels.any;
  const codes = { "Korean Air": "KE", "Asiana Airlines": "OZ", "Japan Airlines": "JL", "Delta Air Lines": "DL", "United Airlines": "UA", "American Airlines": "AA", "Avianca": "AV", "Aeromexico": "AM", "Copa Airlines": "CM", "Iberia": "IB", "LATAM Airlines": "LA", Lufthansa: "LH", "Air France": "AF", KLM: "KL", Emirates: "EK", "Qatar Airways": "QR", "Turkish Airlines": "TK" };
  const airlineName = flight ? getFlightName(flight) : local("Flight search criteria ready", "í•­ê³µíŽ¸ ê²€ìƒ‰ ì¡°ê±´ ì¤€ë¹„ë¨", "Criterios de vuelo listos");
  const flightCode = flight ? `${codes[flight?.provider] || "ONE"}-${(flightIndex + 1) * 101}` : local("Provider check needed", "ì œê³µì—…ì²´ í™•ì¸ í•„ìš”", "VerificaciÃ³n de proveedor necesaria");
  const returnFlightCode = flight ? `${codes[flight?.provider] || "ONE"}-${(flightIndex + 1) * 101 + 1}` : local("Provider check needed", "ì œê³µì—…ì²´ í™•ì¸ í•„ìš”", "VerificaciÃ³n de proveedor necesaria");
  const isRoundTrip = currentResult.tripType !== "one_way";
  const destinationName = activeLanguage === "ko"
    ? currentResult.destination?.cityKo || currentResult.destination?.countryKo || currentResult.destination?.city || currentResult.destination?.country || currentResult.title || currentResult.mission || "ONE"
    : currentResult.destination?.city || currentResult.destination?.country || currentResult.title || currentResult.mission || "ONE";
  const hotelName = hotel ? getHotelName(hotel) : local("Stay search criteria ready", "ìˆ™ì†Œ ê²€ìƒ‰ ì¡°ê±´ ì¤€ë¹„ë¨", "Criterios de alojamiento listos");
  const transferName = localize(transfer) || local("Local transfer criteria ready", "í˜„ì§€ ì´ë™ ì¡°ê±´ ì¤€ë¹„ë¨", "Criterios de transporte listos");
  const totalRange = currentResult.budget?.estimatedTotal || {};
  const foodRange = currentResult.budget?.food || {};
  const transportRange = currentResult.budget?.transport || {};
  const activitiesRange = currentResult.budget?.activities || {};
  const weatherItems = (findLiveProvider(currentResult, "weather")?.items || []).slice(0, 7).map((item) => [item.label || "", item.value || "", item.humidity || "", item.precipitation || ""]);
  const currencyItems = (findLiveProvider(currentResult, "currency")?.items || []).slice(0, 6).map((item) => [item.to || "", Number(item.rate || item.value) || 0]).filter(([to, rate]) => to && rate);
  const reference = `ONE-DEMO-${String(currentResult.id || Date.now()).replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase()}`;
  const selectedRestaurantNames = selectedRestaurantButtons.map((button) => {
    const restaurant = currentResult.restaurants?.[Number(button.dataset.optionIndex)] || {};
    return (activeLanguage === "ko" ? restaurant.venueNameKo : restaurant.venueName) || restaurant.venueName || restaurant.type || button.querySelector(".restaurant-name")?.textContent?.trim() || "Restaurant";
  }).filter(Boolean).slice(0, 6);
  const suggestedRestaurantNames = selectedRestaurantNames.length ? selectedRestaurantNames : (currentResult.restaurants || []).slice(0, 4).map((restaurant) => (activeLanguage === "ko" ? restaurant.venueNameKo : restaurant.venueName) || restaurant.venueName || restaurant.type).filter(Boolean);
  const portableCountry = activeLanguage === "ko"
    ? currentResult.destination?.countryKo || currentResult.destination?.country || ""
    : currentResult.destination?.country || "";
  const portableCity = activeLanguage === "ko"
    ? currentResult.destination?.cityKo || currentResult.destination?.city || ""
    : currentResult.destination?.city || "";
  const portableFlightName = airlineName;
  const portableHotelName = hotelName;
  const portableResult = {
    p: 1, r: reference, l: activeLanguage,
    d: [portableCountry, "", portableCity, ""],
    s: [schedule.startDate || "", schedule.endDate || "", schedule.timePreference || "any"],
    t: currentResult.tripType || "round_trip",
    f: flight ? [portableFlightName, "", flight.estimatedPrice?.min || 0, flight.estimatedPrice?.max || 0] : [],
    h: hotel ? [portableHotelName, "", hotel.estimatedNightlyPrice?.min || 0, hotel.estimatedNightlyPrice?.max || 0] : [],
    x: transferName || "", n: suggestedRestaurantNames,
    w: weatherItems, e: currencyItems, c: currentResult.exchangeRate?.to || currentResult.countryProfile?.currency || "USD",
    b: [foodRange.min || 0, foodRange.max || 0, transportRange.min || 0, transportRange.max || 0, activitiesRange.min || 0, activitiesRange.max || 0, totalRange.min || 0, totalRange.max || 0]
  };
  const portableUrl = `${location.origin}${location.pathname}?share=${encodeURIComponent(encodePortableShare(portableResult))}`;
  const completionSubtitle = completionMessage?.querySelector("p");
  if (completionSubtitle) {
    completionSubtitle.textContent = local(
      "Your mission pass is ready. Review the plan, scan the QR, then approve any real provider action separately.",
      "ë¯¸ì…˜ íŒ¨ìŠ¤ë¥¼ ì¤€ë¹„í–ˆìŠµë‹ˆë‹¤. ê³„íšê³¼ QRì„ í™•ì¸í•˜ê³ , ì‹¤ì œ ì œê³µì—…ì²´ ì‹¤í–‰ì€ ë³„ë„ë¡œ ìŠ¹ì¸í•˜ì„¸ìš”.",
      "Tu pase de misiÃ³n estÃ¡ listo. Revisa el plan, escanea el QR y aprueba cualquier acciÃ³n real por separado."
    );
  }

  const detailCard = (label, value, detail, icon = "âœ“", className = "") => `
    <article class="execution-summary-item mission-pass-card ${className}">
      <span class="mission-pass-icon" aria-hidden="true">${escapeSummaryText(icon)}</span>
      <span class="execution-summary-label">${escapeSummaryText(label)}</span>
      <span class="execution-summary-value">${escapeSummaryText(value)}</span>
      <span class="execution-summary-detail">${escapeSummaryText(detail)}</span>
    </article>`;
  const diningDetail = suggestedRestaurantNames.length
    ? suggestedRestaurantNames.join(" · ")
    : local("ONE will refresh restaurant options before any reservation step.", "ì˜ˆì•½ ë‹¨ê³„ ì „ ë ˆìŠ¤í† ëž‘ í›„ë³´ë¥¼ ë‹¤ì‹œ í™•ì¸í•©ë‹ˆë‹¤.", "ONE actualizarÃ¡ opciones de restaurantes antes de reservar.");
  const qrMarkup = `
    <article class="execution-summary-item is-wide is-reference mission-pass-reference">
      <span class="execution-summary-label">${escapeSummaryText(local("Mission pass reference", "ë¯¸ì…˜ íŒ¨ìŠ¤ ì°¸ì¡° ë²ˆí˜¸", "Referencia del pase de misiÃ³n"))}</span>
      <span class="execution-summary-value">${escapeSummaryText(reference)}</span>
      <a href="${escapeSummaryText(portableUrl)}" aria-label="${escapeSummaryText(local("Reopen this mission pass from the QR link", "QR ë§í¬ë¡œ ë¯¸ì…˜ íŒ¨ìŠ¤ ë‹¤ì‹œ ì—´ê¸°", "Volver a abrir este pase desde el QR"))}"><img class="prototype-reference-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=900x900&amp;format=png&amp;ecc=L&amp;qzone=8&amp;data=${encodeURIComponent(portableUrl)}" alt="${escapeSummaryText(local("Mission pass QR code", "ë¯¸ì…˜ íŒ¨ìŠ¤ QR ì½”ë“œ", "CÃ³digo QR del pase"))}" width="320" height="320"></a>
      <small class="prototype-reference-qr-help">${escapeSummaryText(local("Scan to reopen this exact prepared mission pass.", "ìŠ¤ìº”í•˜ë©´ ì¤€ë¹„ëœ ë¯¸ì…˜ íŒ¨ìŠ¤ë¥¼ ë‹¤ì‹œ ì—´ ìˆ˜ ìžˆìŠµë‹ˆë‹¤.", "Escanea para reabrir este pase preparado."))}</small>
      <span class="execution-summary-detail">${escapeSummaryText(local("Prototype reference only â€” not a booking number.", "í”„ë¡œí† íƒ€ìž… ì°¸ì¡°ìš© â€” ì‹¤ì œ ì˜ˆì•½ ë²ˆí˜¸ê°€ ì•„ë‹™ë‹ˆë‹¤.", "Solo referencia de prototipo â€” no es una reserva."))}</span>
    </article>`;
  const nextChecks = [
    local("Confirm live provider availability and final prices", "ì‹¤ì‹œê°„ ì œê³µì—…ì²´ ê°€ëŠ¥ ì—¬ë¶€ì™€ ìµœì¢… ê°€ê²© í™•ì¸", "Confirmar disponibilidad y precios finales"),
    local("Show exact terms before booking or payment", "ì˜ˆì•½·ê²°ì œ ì „ ì •í™•í•œ ì¡°ê±´ í‘œì‹œ", "Mostrar condiciones exactas antes de reservar o pagar"),
    local("Ask again before any external action", "ì™¸ë¶€ ì‹¤í–‰ ì „ ë‹¤ì‹œ ìŠ¹ì¸ ìš”ì²­", "Pedir aprobaciÃ³n antes de cualquier acciÃ³n externa")
  ];

  executionSummary.innerHTML = `
    <section class="mission-pass-summary" aria-label="${escapeSummaryText(local("Prepared mission pass", "ì¤€ë¹„ëœ ë¯¸ì…˜ íŒ¨ìŠ¤", "Pase de misiÃ³n preparado"))}">
      <div class="execution-summary-head mission-pass-head">
        <span class="execution-summary-status">${escapeSummaryText(local("Plan ready · Nothing booked yet", "ê³„íš ì¤€ë¹„ ì™„ë£Œ · ì•„ì§ ì˜ˆì•½ ì•„ë‹˜", "Plan listo · Nada reservado"))}</span>
        <h4>${escapeSummaryText(local("Your mission pass", "ë¯¸ì…˜ íŒ¨ìŠ¤", "Tu pase de misiÃ³n"))}</h4>
        <p>${escapeSummaryText(local("Useful details are organized here. Real booking, payment, ticketing, or provider contact still needs separate approval.", "í•„ìš”í•œ ì •ë³´ë§Œ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤. ì‹¤ì œ ì˜ˆì•½, ê²°ì œ, ë°œê¶Œ, ì œê³µì—…ì²´ ì—°ë½ì€ ë³„ë„ ìŠ¹ì¸ í›„ì—ë§Œ ì§„í–‰ë©ë‹ˆë‹¤.", "AquÃ­ estÃ¡ lo necesario. Reserva, pago, emisiÃ³n o contacto con proveedor requiere otra aprobaciÃ³n."))}</p>
      </div>
      <article class="execution-summary-item is-wide is-schedule mission-pass-route">
        <span class="execution-summary-label">${escapeSummaryText(local("Trip window", "ì—¬í–‰ ì¼ì •", "Fechas del viaje"))}</span>
        <span class="execution-summary-value schedule-summary-dates"><strong>${escapeSummaryText(schedule.startDate || "â€”")}</strong><i aria-hidden="true">â†’</i><strong>${escapeSummaryText(schedule.endDate || "â€”")}</strong></span>
        <span class="execution-summary-detail">${escapeSummaryText(`${destinationName} · ${tripNights || 0} ${local("nights", "ë°•", "noches")} · ${rooms} ${local("room(s)", "ê°ì‹¤", "habitaciÃ³n(es)")} · ${selectedTime}`)}</span>
      </article>
      <div class="execution-summary-grid mission-pass-grid">
        ${detailCard(local("Outbound", "ì¶œë°œ í•­ê³µ", "Ida"), flight ? `${airlineName} · ${flightCode}` : airlineName, `${schedule.startDate || dateRange} · ${formatRange(flight?.estimatedPrice) || local("Price check needed", "ê°€ê²© í™•ì¸ í•„ìš”", "Precio por confirmar")}`, "âœˆ")}
        ${isRoundTrip ? detailCard(local("Return", "ê·€êµ­ í•­ê³µ", "Vuelta"), flight ? `${airlineName} · ${returnFlightCode}` : airlineName, `${schedule.endDate || dateRange} · ${local("Return time requires final provider check", "ê·€êµ­ ì‹œê°„ì€ ìµœì¢… ì œê³µì—…ì²´ í™•ì¸ í•„ìš”", "La hora de regreso requiere verificaciÃ³n")}`, "â†©") : ""}
        ${detailCard(local("Stay", "ìˆ™ì†Œ", "Alojamiento"), hotelName, `${dateRange} · ${tripNights || 0} ${local("nights", "ë°•", "noches")} · ${formatRange(currentResult.budget?.hotel || hotel?.estimatedNightlyPrice) || local("Final price check needed", "ìµœì¢… ê°€ê²© í™•ì¸ í•„ìš”", "Precio final por confirmar")}`, "ðŸ¨")}
        ${detailCard(local("Local movement", "í˜„ì§€ ì´ë™", "Transporte local"), transferName, local("Route and licensed provider will be checked before execution.", "ì‹¤í–‰ ì „ ê²½ë¡œì™€ ê³µì‹ ì œê³µì—…ì²´ë¥¼ í™•ì¸í•©ë‹ˆë‹¤.", "La ruta y proveedor autorizado se verifican antes."), "ðŸš•")}
        ${detailCard(local("Dining", "ì‹ì‚¬", "Comida"), suggestedRestaurantNames.length ? local("Shortlist ready", "í›„ë³´ ì¤€ë¹„ë¨", "Lista preparada") : local("Needs final picks", "ìµœì¢… í›„ë³´ í•„ìš”", "Faltan opciones"), diningDetail, "ðŸ½", "is-restaurant")}
        ${detailCard(local("Budget", "ì˜ˆì‚°", "Presupuesto"), formatRange(totalRange) || local("Flexible", "ìœ ë™ì ", "Flexible"), local("Budget updates if you change flight, hotel, dining, or transport.", "í•­ê³µ·ìˆ™ì†Œ·ì‹ì‚¬·ì´ë™ì„ ë°”ê¾¸ë©´ ì˜ˆì‚°ë„ í•¨ê»˜ ì—…ë°ì´íŠ¸ë©ë‹ˆë‹¤.", "El presupuesto cambia si modificas vuelos, hotel, comida o transporte."), "â‚©")}
        ${qrMarkup}
      </div>
      <article class="execution-summary-item is-wide mission-pass-next">
        <span class="execution-summary-label">${escapeSummaryText(local("Before anything real happens", "ì‹¤ì œ ì‹¤í–‰ ì „ í™•ì¸", "Antes de cualquier acciÃ³n real"))}</span>
        <ul>${nextChecks.map((item) => `<li>${escapeSummaryText(item)}</li>`).join("")}</ul>
      </article>
      <a class="all-in-slogan" href="index.html" aria-label="${escapeSummaryText(local("Return home", "í™ˆìœ¼ë¡œ ëŒì•„ê°€ê¸°", "Volver al inicio"))}"><span>All in</span><span class="all-in-one" aria-label="ONE"><img src="assets/one-final-circle.png?v=20260713-20" alt=""><strong>NE</strong></span></a>
    </section>`;
  savePrototypeMission(reference);
};

const runApprovalSequence = () => {
  trackEvent("simulated_execution_started", { mission_type: currentResult?.type, language: activeLanguage, page: "results", status: "prototype_simulation" });
  const items = [...approvalList.querySelectorAll(".approval-item")];

  makeRealityButton.disabled = true;
  bottomActions.hidden = true;
  approvalPanel.hidden = false;
  if (missionLifecycleLive) missionLifecycleLive.textContent = completeMissionLocal("Approval received. Preparing the next step safely.", "ìŠ¹ì¸ì„ ë°›ì•˜ìŠµë‹ˆë‹¤. ë‹¤ìŒ ë‹¨ê³„ë¥¼ ì•ˆì „í•˜ê²Œ ì¤€ë¹„í•©ë‹ˆë‹¤.", "AprobaciÃ³n recibida. Preparando el siguiente paso con seguridad.");
  document.querySelector('[data-lifecycle-step="approval"]')?.classList.replace("is-next", "is-current");
  approvalPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  items.forEach((item, index) => {
    trackEvent("simulated_step_started", { mission_type: currentResult?.type, language: activeLanguage, page: "results", step: String(index + 1) });
    window.setTimeout(() => {
      item.classList.add("is-complete");
      item.querySelector(".approval-check").textContent = "âœ“";
      trackEvent("simulated_step_completed", { mission_type: currentResult?.type, language: activeLanguage, page: "results", step: String(index + 1), success: true });

      if (index === items.length - 1) {
        window.setTimeout(() => {
          const finalTitle = completionMessage.querySelector("h3");

          if (finalTitle) {
            finalTitle.textContent = localize(currentResult?.finalMessage) || t("finalMessage");
          }

          buildExecutionSummary();
          completionMessage.hidden = false;
          if (missionLifecycleLive) missionLifecycleLive.textContent = completeMissionLocal("Ready. Nothing external happened without provider confirmation.", "ì¤€ë¹„ ì™„ë£Œ. ì œê³µì—…ì²´ í™•ì¸ ì—†ì´ ì™¸ë¶€ ì‹¤í–‰ì€ ì—†ì—ˆìŠµë‹ˆë‹¤.", "Listo. No hubo acciÃ³n externa sin confirmaciÃ³n del proveedor.");
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
    value.textContent = activeLanguage === "ko" ? "ì œì£¼í•­ê³µ" : "Jeju Air";

    if (reason) {
      reason.textContent =
        activeLanguage === "ko"
          ? "ì˜ˆì‚°ì„ ì¤„ì´ê¸° ìœ„í•´ ì €ê°€ í•­ê³µ ì˜µì…˜ìœ¼ë¡œ ë³€ê²½í–ˆìŠµë‹ˆë‹¤. ì‹¤ì œ ì˜ˆì•½ì€ ìŠ¹ì¸ ì „ê¹Œì§€ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤."
          : "Changed to a lower-cost airline option to reduce budget. No booking will happen without approval.";
    }
  }

  if (cardId === "hotel" && value) {
    value.textContent = activeLanguage === "ko" ? "ë„í ìŠ¤í…Œì´ ì‹ ì£¼ì¿ " : "Tokyu Stay Shinjuku";

    if (reason) {
      reason.textContent =
        activeLanguage === "ko"
          ? "êµí†µ ì ‘ê·¼ì„±ê³¼ ì˜ˆì‚° ê· í˜•ì„ ìœ„í•´ ì‹¤ìš©ì ì¸ í˜¸í…” ì˜µì…˜ìœ¼ë¡œ ë³€ê²½í–ˆìŠµë‹ˆë‹¤."
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
          ? "ì˜ˆì‚° ì ˆê° ì˜µì…˜ ì ìš©ë¨"
          : "Budget-saving option applied";
    });
  }

  if (cardId === "airport-transfer" && value) {
    value.textContent = activeLanguage === "ko" ? "ê³µí•­ ë¦¬ë¬´ì§„ ë²„ìŠ¤" : "Airport Limousine Bus";

    if (reason) {
      reason.textContent =
        activeLanguage === "ko"
          ? "ìˆ˜í•˜ë¬¼ ì´ë™ê³¼ ë¹„ìš© ê· í˜•ì„ ê¸°ì¤€ìœ¼ë¡œ ê³µí•­ ë¦¬ë¬´ì§„ ì˜µì…˜ì„ ìš°ì„  ì ìš©í–ˆìŠµë‹ˆë‹¤."
          : "Prioritized airport limousine service for better luggage convenience and cost balance.";
    }
  }

  if (cardId === "checklist") {
    const list = card.querySelector(".option-list");

    if (list) {
      list.insertAdjacentHTML(
        "beforeend",
        makeOptionRow("âœ“", activeLanguage === "ko" ? "ë¡œë° / eSIM ê°€ê²© ë¹„êµ" : "Roaming / eSIM price comparison")
      );
    }
  }

  if (cardId === "visa" && reason) {
    reason.textContent =
      activeLanguage === "ko"
        ? "ë¹„ìž í™•ì¸ ìš”ì²­ì´ ì¶”ê°€ë˜ì—ˆìŠµë‹ˆë‹¤. ì‹¤í–‰ ì „ ì •ë¶€/ëŒ€ì‚¬ê´€ ë°ì´í„° ê¸°ì¤€ìœ¼ë¡œ í™•ì¸í•©ë‹ˆë‹¤."
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
      categoryToggle.textContent = included ? "âœ“" : "+";
      card?.classList.toggle("is-excluded", !included);
      trackEvent("option_selected", { mission_type: currentResult?.type, language: activeLanguage, page: "results", option_category: card?.dataset.cardId });
      if (["flights", "hotel", "airport-transfer", "restaurants"].includes(card?.dataset.cardId)) {
        updateTravelBudgetFromSelections();
      }
      return;
    }

    const previewOption = event.target.closest(".alpha03-preview-option");
    if (previewOption) {
      const group = previewOption.dataset.previewGroup;
      previewOption.closest(".alpha03-preview-group")?.querySelectorAll(".alpha03-preview-option").forEach((option) => {
        const selected = option === previewOption;
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-pressed", selected ? "true" : "false");
        const marker = option.querySelector("span");
        if (marker) marker.textContent = selected ? "âœ“" : "+";
      });
      currentResult.alpha03PreviewSelections = {
        ...(currentResult.alpha03PreviewSelections || {}),
        [group]: Number(previewOption.dataset.previewIndex || 0)
      };
      sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
      sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
      trackEvent("option_selected", { mission_type: currentResult?.type, language: activeLanguage, page: "results", option_category: group || "travel-preview" });
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
          option.querySelector(".option-key").textContent = selected ? "âœ“" : "+";
        });
        const optionIndex = Number(chosen?.dataset.optionIndex || 0);
        const chosenName = chosen?.dataset.optionLabel ? decodeURIComponent(chosen.dataset.optionLabel) : chosen?.querySelector(".option-value strong")?.textContent;
        const chosenPrice = chosen?.querySelector(".option-value > span")?.textContent;
        const recommendationValue = recommendation?.querySelector(".recommendation-value");
        if (recommendationValue && chosenName) {
          const suffix = card.dataset.cardId === "hotel" && chosenPrice
            ? `${chosenPrice} / ${activeLanguage === "ko" ? "1ë°•" : "night"}`
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
      selectable.querySelector(".option-key").textContent = included ? "âœ“" : "+";
      if (card?.dataset.cardId === "restaurants") updateTravelBudgetFromSelections();
      if (card?.dataset.cardId === "budget") {
        const budgetKey = selectable.dataset.budgetKey;
        if (budgetKey === "estimatedTotal") {
          selectable.setAttribute("aria-pressed", "true");
          selectable.classList.remove("is-excluded");
          selectable.querySelector(".option-key").textContent = "âœ“";
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
        list.insertAdjacentHTML("beforeend", `<button class="option-row selectable-option" type="button" aria-pressed="true"><span class="option-key">âœ“</span><span class="option-value">${optionName}</span></button>`);
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
      const hotelOptions = ["Four Seasons", "Rosewood", "Atlantis", "Lotte", "Shilla", "Le MÃ©ridien", "Sofitel", "Hyatt", "InterContinental", "JW Marriott", "Hilton", "APA Hotel"];
      const generalOptions = activeLanguage === "ko"
        ? ["â­ ONE Pick", "ì˜ˆì‚° ì¤‘ì‹¬", "í’ˆì§ˆ ì¤‘ì‹¬", "ê°€ê¹Œìš´ ìœ„ì¹˜", "í”„ë¦¬ë¯¸ì—„"]
        : ["â­ ONE Pick", "Budget", "Best quality", "Nearest", "Premium"];
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
    const beforeRevision = JSON.parse(JSON.stringify(currentResult));
    const result = applyMissionEdit(currentResult, value, { language: activeLanguage, provider: "OPENAI" });
    currentResult = result.mission;
    const baseMissionText = currentResult.rawInput || currentResult.mission || currentResult.originalMission || "";
    currentResult.rawInput = [baseMissionText, value].filter(Boolean).join(" · ");
    currentResult.mission = currentResult.rawInput;
    currentResult.alpha15LastAddition = {
      text: value,
      summary: result.summary,
      affectedSections: result.affectedSections,
      previousResult: result.mission?.missionOrchestration?.previousResult || null,
      at: new Date().toISOString()
    };
    pushMissionChangeHistory({
      before: beforeRevision,
      command: value,
      summary: result.summary,
      affectedSections: result.affectedSections,
      source: "mission_revision"
    });
    sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
    sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
    if (revisionStatus) revisionStatus.textContent = v22Local(
      `Updated ${result.affectedSections.length} parts of your mission.`,
      `ë¯¸ì…˜ ${result.affectedSections.length}ê³³ì„ ì—…ë°ì´íŠ¸í–ˆìŠµë‹ˆë‹¤.`,
      `Se actualizaron ${result.affectedSections.length} partes de la misiÃ³n.`
    );
    trackEvent("mission_revision_completed", { mission_type: currentResult?.type, language: activeLanguage, page: "results", revision_type: result.intent.type, approval_invalidated: result.affectedSections.includes("approval"), affected_sections: result.affectedSections.join("|"), provider: "MISSION_ORCHESTRATION_ENGINE" });
    additionalServiceInput.value = "";
    renderMission();
    renderRevisionAdditionNote();
    renderCompleteMissionRevisionState();
    additionalServiceInput.focus();
  } catch {
    if (revisionStatus) revisionStatus.textContent = completeMissionLocal(
      "I couldn't apply that change safely. Your current mission is still available.",
      "ê·¸ ë³€ê²½ì„ ì•ˆì „í•˜ê²Œ ì ìš©í•˜ì§€ ëª»í–ˆìŠµë‹ˆë‹¤. í˜„ìž¬ ë¯¸ì…˜ì€ ê·¸ëŒ€ë¡œ ì‚¬ìš©í•  ìˆ˜ ìžˆìŠµë‹ˆë‹¤.",
      "No pude aplicar ese cambio con seguridad. Tu misiÃ³n actual sigue disponible."
    );
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
  const completeUndoButton = event.target.closest?.("[data-mission-undo]");
  if (completeUndoButton && missionExperienceState().undoStack.length) {
    if (undoMissionEdit()) {
      if (revisionStatus) revisionStatus.textContent = completeMissionLocal("Undone.", "ë˜ëŒë ¸ìŠµë‹ˆë‹¤.", "Deshecho.");
      renderMission();
      trackEvent("mission_revision_undone", { mission_type: currentResult?.type, language: activeLanguage, page: "results" });
    }
    return;
  }
  const completeRedoButton = event.target.closest?.("[data-mission-redo]");
  if (completeRedoButton) {
    if (redoMissionEdit()) {
      if (revisionStatus) revisionStatus.textContent = completeMissionLocal("Redone.", "ë‹¤ì‹œ ì ìš©í–ˆìŠµë‹ˆë‹¤.", "Rehecho.");
      renderMission();
      trackEvent("mission_revision_redone", { mission_type: currentResult?.type, language: activeLanguage, page: "results" });
    }
    return;
  }
  const emptyStateAction = event.target.closest?.("[data-revision-command]");
  if (emptyStateAction && additionalServiceInput) {
    additionalServiceInput.value = emptyStateAction.dataset.revisionCommand || emptyStateAction.textContent.trim();
    additionalServiceInput.focus();
    return;
  }
  const decisionButton = event.target.closest?.("[data-decision-action]");
  if (decisionButton) {
    const action = decisionButton.dataset.decisionAction;
    const id = decisionButton.dataset.decisionId;
    const key = decisionMemoryKey(currentResult || {});
    const recommendation = currentResult?.aiDecisionLayer?.visibleRecommendations?.find((item) => item.id === id)
      || currentResult?.aiDecisionLayer?.recommendations?.find((item) => item.id === id);
    if (!recommendation) return;
    if (action === "why") {
      const card = decisionButton.closest(".ai-decision-card");
      const why = card?.querySelector(".ai-decision-why");
      if (why) why.hidden = !why.hidden;
      trackEvent("ai_decision_explained", { mission_type: currentResult?.type, language: activeLanguage, page: "results", decision_id: id });
      return;
    }
    if (action === "dismiss") {
      recordDecisionFeedback(localStorage, key, id, "dismissed");
      trackEvent("ai_decision_dismissed", { mission_type: currentResult?.type, language: activeLanguage, page: "results", decision_id: id });
      renderMission();
      return;
    }
    if (action === "accept") {
      const beforeDecision = JSON.parse(JSON.stringify(currentResult));
      const result = applyMissionEdit(currentResult, recommendation.command, { language: activeLanguage, provider: "AI_DECISION_ENGINE" });
      currentResult = result.mission;
      currentResult.aiDecisionAccepted = [
        ...(currentResult.aiDecisionAccepted || []),
        { id, command: recommendation.command, acceptedAt: new Date().toISOString() }
      ];
      currentResult.alpha15LastAddition = {
        text: recommendation.suggestion,
        summary: result.summary,
        affectedSections: result.affectedSections,
        previousResult: result.mission?.missionOrchestration?.previousResult || null,
        at: new Date().toISOString()
      };
      pushMissionChangeHistory({
        before: beforeDecision,
        command: recommendation.command,
        summary: result.summary,
        affectedSections: result.affectedSections,
        source: "ai_decision"
      });
      recordDecisionFeedback(localStorage, key, id, "accepted");
      sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
      sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
      if (revisionStatus) revisionStatus.textContent = v22Local(
        `Applied. Updated ${result.affectedSections.length} parts.`,
        `ì ìš©í–ˆìŠµë‹ˆë‹¤. ${result.affectedSections.length}ê³³ì„ ì—…ë°ì´íŠ¸í–ˆìŠµë‹ˆë‹¤.`,
        `Aplicado. Se actualizaron ${result.affectedSections.length} partes.`
      );
      trackEvent("ai_decision_accepted", { mission_type: currentResult?.type, language: activeLanguage, page: "results", decision_id: id, affected_sections: result.affectedSections.join("|") });
      renderMission();
      return;
    }
  }
  const undoButton = event.target.closest?.("[data-mission-undo]");
  if (undoButton) {
    const previous = currentResult?.alpha15LastAddition?.previousResult;
    if (previous) {
      currentResult = previous;
      currentResult.alpha15LastAddition = null;
      sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(currentResult));
      sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(currentResult));
      if (revisionStatus) revisionStatus.textContent = v22Local("Undone.", "ë˜ëŒë ¸ìŠµë‹ˆë‹¤.", "Deshecho.");
      renderMission();
      trackEvent("mission_revision_undone", { mission_type: currentResult?.type, language: activeLanguage, page: "results" });
    }
    return;
  }
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
    buildExecutionSummary();
    completionMessage.hidden = false;
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
      ? "ë¹„ìž ì‹ ì²­ ì¤€ë¹„ í•­ëª©ì´ ìµœì¢… ìŠ¹ì¸ ëª©ë¡ì— ì¶”ê°€ë˜ì—ˆìŠµë‹ˆë‹¤. ì•„ì§ ì œì¶œë˜ì§€ ì•Šì•˜ìŠµë‹ˆë‹¤."
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
      ? `${type === "passport" ? "ì—¬ê¶Œ" : "ë¹„ìž"} ë¬¸ì„œê°€ ì´ ì„¸ì…˜ì— ì¶”ê°€ë˜ì—ˆìŠµë‹ˆë‹¤.`
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

const enableTimelineDragScroll = () => {
  let dragState = null;

  document.addEventListener("pointerdown", (event) => {
    const strip = event.target.closest?.(".alpha03-timeline-strip");
    if (!strip || event.pointerType !== "mouse") return;
    event.preventDefault();
    dragState = {
      strip,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: strip.scrollLeft
    };
    strip.classList.add("is-dragging");
    strip.setPointerCapture?.(event.pointerId);
  });

  document.addEventListener("pointermove", (event) => {
    if (!dragState) return;
    dragState.strip.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX);
    event.preventDefault();
  }, { passive: false });

  const endDrag = () => {
    if (!dragState) return;
    dragState.strip.classList.remove("is-dragging");
    try {
      dragState.strip.releasePointerCapture?.(dragState.pointerId);
    } catch {
      // Some browsers release pointer capture automatically.
    }
    dragState = null;
  };

  document.addEventListener("pointerup", endDrag);
  document.addEventListener("pointercancel", endDrag);
};

returnHomeButton.addEventListener("click", returnHome);
makeRealityButton.addEventListener("click", () => {
  trackEvent("make_it_reality_clicked", { mission_type: currentResult?.type, language: activeLanguage, page: "results", schedule_used: Boolean(currentResult?.schedule?.startDate && currentResult?.schedule?.endDate) });
  const schedule = currentResult?.schedule || {};
  const flight = currentResult?.flights?.find?.((item) => item.recommended) || currentResult?.flights?.[0];
  const hotel = currentResult?.hotels?.find?.((item) => item.recommended) || currentResult?.hotels?.[0];
  const experienceMission = isExperienceMission(currentResult, currentResult?.missionContext);
  const experience = currentExperienceReview?.generatedExperience?.onePick;
  const local = (en, ko, es) => activeLanguage === "ko" ? ko : activeLanguage === "es" ? es : en;
  const previewProfile = profileForResult(result, destination);
  if (previewProfile?.journeys?.length) {
    return rotateList(previewProfile.journeys, seed).map((item, index) => ({
      id: `v23-preview-journey-${previewProfile.id}-${index}`,
      name: local(item[0], item[1], item[2]),
      purpose: local(item[3], item[4], item[3]),
      tags: item[5] || [],
      reason: local(
        "This option is built from curated destination highlights and the current mission context.",
        "현재 미션과 실제 목적지 하이라이트를 기준으로 구성했습니다.",
        "Esta opción usa puntos reales del destino y el contexto de la misión."
      ),
      duration,
      tone: ["balanced", "culture", "food", "local"][index] || "balanced",
      comfort: local("Practical", "실용적", "Práctico"),
      budget: getTravelBudgetLabel(result, index === 2 ? "food" : "balanced"),
      timeline: item[5] || [],
      selected: index === 0,
      details: {
        flight: local("Round-trip options are compared after approval for live price and schedule.", "왕복 항공권은 승인 후 실시간 가격과 일정을 확인합니다.", "Vuelos ida y vuelta se comparan tras aprobación."),
        hotel: local("Hotel candidates are matched to the route, walking load, and room count.", "숙소 후보는 동선, 도보 부담, 객실 수에 맞춰 비교합니다.", "Hoteles según ruta, caminata y habitaciones."),
        transport: local("Daily movement is grouped by neighborhood to avoid unnecessary backtracking.", "불필요한 왕복 이동을 줄이도록 날마다 지역을 묶습니다.", "Se agrupa por zonas para evitar traslados inútiles."),
        food: local("Food candidates are placed near the day route instead of as a random list.", "맛집 후보는 무작위 목록이 아니라 그날 동선 근처로 배치합니다.", "Comida cerca de la ruta del día."),
        entry: local("Entry and document rules are rechecked through official sources before action.", "입국·서류 요건은 실행 전 공식 출처로 다시 확인합니다.", "Requisitos se verifican con fuentes oficiales."),
        insurance: local("Insurance and cancellation rules are prepared for review before booking.", "예약 전 보험과 취소 규정을 검토할 수 있게 준비합니다.", "Seguro y cancelación se preparan antes de reservar.")
      },
      sourceStates: {
        flight: getScenarioSourceState(result, "flight", "estimated"),
        hotel: getScenarioSourceState(result, "hotel", "estimated"),
        transport: getScenarioSourceState(result, "transport", "placeholder"),
        food: getScenarioSourceState(result, "food", "cached_public"),
        entry: getScenarioSourceState(result, "entry", "unavailable"),
        insurance: getScenarioSourceState(result, "insurance", "placeholder")
      }
    }));
  }
  const journey = isV231TravelPreparationFlow() ? getV231SelectedJourney() : null;
  const reviewItems = journey
    ? [
        { label: local("Mission", "ë¯¸ì…˜", "MisiÃ³n"), value: approvalMissionName() },
        { label: local("Selected journey", "ì„ íƒí•œ ì—¬í–‰", "Viaje elegido"), value: journey.name },
        { label: local("Journey style", "ì—¬í–‰ ìŠ¤íƒ€ì¼", "Estilo de viaje"), value: `${journey.duration} · ${journey.comfort} · ${journey.budget}` },
        { label: local("Approved scope", "ìŠ¹ì¸ ë²”ìœ„", "Alcance aprobado"), value: local("Prepare search and comparison only", "ê²€ìƒ‰ê³¼ ë¹„êµ ì¤€ë¹„ê¹Œì§€ë§Œ ìŠ¹ì¸", "Solo preparar bÃºsqueda y comparaciÃ³n") },
        { label: local("Not approved", "ìŠ¹ì¸ë˜ì§€ ì•Šì€ ê²ƒ", "No aprobado"), value: local("No booking, payment, ticketing, submission, or provider contact", "ì˜ˆì•½, ê²°ì œ, ë°œê¶Œ, ì œì¶œ, ì œê³µì—…ì²´ ì—°ë½ ì—†ìŒ", "Sin reserva, pago, emisiÃ³n, envÃ­o ni contacto con proveedores") }
      ]
    : experienceMission && experience
    ? [
        { label: local("Mission", "ë¯¸ì…˜", "MisiÃ³n"), value: approvalMissionName() },
        { label: "ONE Pick", value: currentExperienceReview.recommendation },
        { label: local("Timeline", "ì‹œê°„ë³„ ì¼ì •", "Horario"), value: experience.timeline.map((item) => `${item.time} · ${item.title}`).join(" / ") },
        { label: local("Transportation", "ì´ë™ ë°©ë²•", "Transporte"), value: experience.transportation },
        { label: local("Weather backup", "ë‚ ì”¨ ëŒ€ì•ˆ", "Alternativa climÃ¡tica"), value: experience.rainPlan }
      ]
    : [
        { label: activeLanguage === "ko" ? "ë¯¸ì…˜" : "Mission", value: approvalMissionName() },
        { label: activeLanguage === "ko" ? "ì—¬í–‰ ë‚ ì§œ" : "Travel dates", value: schedule.startDate && schedule.endDate ? `${schedule.startDate} â†’ ${schedule.endDate}` : "" },
        { label: activeLanguage === "ko" ? "í•­ê³µíŽ¸ ì„¤ì •" : "Flight preference", value: flight?.provider || "" },
        { label: activeLanguage === "ko" ? "í˜¸í…” ì„¤ì •" : "Hotel preference", value: hotel?.name || "" }
      ];
  openApprovalInformationReview({
    language: activeLanguage,
    items: reviewItems,
    onApprove: runApprovalSequence
  });

});

activeLanguage = getLanguage();

document.documentElement.lang = activeLanguage;
document.title = activeLanguage === "ko" ? "Kastiz ONE â€” ë¯¸ì…˜ ì¤€ë¹„ ì™„ë£Œ" : "Kastiz ONE â€” Mission Ready";

setTheme();
updateTextContent();
updateLocation();
renderMission();
initializeOptionSelections();
renderApprovalList();
enableCustomization();
enableTimelineDragScroll();
if (isInvestorDemoMode(window.location)) {
  mountInvestorDemoResults({ result: currentResult, language: activeLanguage });
}
applyV231ManualApprovalScenario();
const requestedReference = new URLSearchParams(location.search).get("reference")?.toUpperCase();
if (/^ONE-DEMO-[A-Z0-9]{8}$/.test(requestedReference || "")) {
  document.body.classList.add("completion-blocked-view");
  renderV231BlockedCompletionState();
  bottomActions.hidden = true;
  approvalPanel.hidden = false;
  approvalList.hidden = true;
  document.title = activeLanguage === "ko" ? "Kastiz ONE â€” ì™„ë£Œ í™•ì¸ í•„ìš”" : activeLanguage === "es" ? "Kastiz ONE â€” FinalizaciÃ³n pendiente" : "Kastiz ONE â€” Completion Requires Evidence";
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
  document.title = activeLanguage === "ko" ? "Kastiz ONE â€” ì™„ë£Œëœ ì‹¤í–‰ ìš”ì•½" : "Kastiz ONE â€” Completed Summary";
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
}
trackEvent("page_visit", { page: "results", language: activeLanguage });
trackEvent("results_viewed", { page: "results", language: activeLanguage, mission_type: currentResult?.type });
