import { trackEvent } from "../analytics.js";
import { classifyMission } from "../engine/mission-classification.js?v=20260720-korean-date-fix";
import { detectWorldwideTravelDestination } from "../ui/mission-followup.js?v=20260722-mobile-country-fallback-1";
import { ensureDisclosureAcknowledged } from "../ui/disclosure.js";
import { isPresentationMode } from "../engine/demo-missions.js";
import { getProfileForMission } from "../profile/profile-memory-engine.js";
import { OFFICIAL_LOCALES, localeSection, normalizeInterfaceLocale } from "../i18n/locale-registry.js";
import { ambiguousWorldDestinationMatches, detectMissionLanguage, resolveWorldDestination } from "../engine/world/world-intelligence-engine.js";
import { createHOSKernel } from "../engine/kernel/hos-kernel-v16.js?v=20260726-v21-1";
import { dedupePreviewDestinations, previewTravelIntent, resolvePreviewDestination } from "../engine/world/preview-destination-intelligence.js?v=20260803-preview-qa";
import { mountInvestorDemoHome } from "../engine/demo/investor-demo-mode.js?v=20260730-investor-demo-mode";

const root = document.documentElement;
const body = document.body;
const themeDropdown = document.getElementById("themeDropdown");
const languageDropdown = document.getElementById("languageDropdown");
const themeControl = document.getElementById("themeControl");
const languageControl = document.getElementById("languageControl");
const themeControlText = document.getElementById("themeControlText");
const languageControlText = document.getElementById("languageControlText");
const missionForm = document.getElementById("missionForm");
const missionInput = document.getElementById("missionInput");
const missionRotator = document.getElementById("missionRotator");
const missionRotatorText = document.getElementById("missionRotatorText");
const locationText = document.getElementById("locationText");
const microphoneButton = document.getElementById("microphoneButton");
const imageUploadButton = document.getElementById("imageUploadButton");
const imageUploadInput = document.getElementById("imageUploadInput");
const aiModeButton = document.getElementById("aiModeButton");
const missionToolStatus = document.getElementById("missionToolStatus");
const oneLogoText = document.querySelector(".one-logo-text");
const loginButton = document.getElementById("loginButton");
const loginModal = document.getElementById("loginModal");
const loginModalClose = document.getElementById("loginModalClose");
const loginNotifyButton = document.getElementById("loginNotifyButton");
const loginNotifyStatus = document.getElementById("loginNotifyStatus");
const scheduleModal = document.getElementById("scheduleModal");
const scheduleModalClose = document.getElementById("scheduleModalClose");
const scheduleForm = document.getElementById("scheduleForm");
const scheduleStartDate = document.getElementById("scheduleStartDate");
const scheduleEndDate = document.getElementById("scheduleEndDate");
const scheduleStartDateValue = document.getElementById("scheduleStartDateValue");
const scheduleEndDateValue = document.getElementById("scheduleEndDateValue");
const scheduleTimePreference = document.getElementById("scheduleTimePreference");
const scheduleTravelerCount = document.getElementById("scheduleTravelerCount");
const scheduleRoomCount = document.getElementById("scheduleRoomCount");
const scheduleDepartureAirport = document.getElementById("scheduleDepartureAirport");
const scheduleSummary = document.getElementById("scheduleSummary");
let pendingMissionText = "";
let pendingFollowUp = null;
let pendingDetectedDestination = null;
let pendingDestinationMatches = [];

const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  travelMission: "kastiz-one-travel-mission",
  results: "kastiz-one-results",
  enrichedMission: "kastiz-one-enriched-mission",
  executionState: "kastiz-one-execution-state"
};
const PROTOTYPE_MISSION_ARCHIVE_KEY = "kastiz-one-prototype-mission-archive";

const reopenPrototypeMission = (reference) => {
  try {
    const archive = JSON.parse(localStorage.getItem(PROTOTYPE_MISSION_ARCHIVE_KEY) || "[]");
    const record = archive.find((item) => item?.reference === reference);
    if (!record?.result?.type) return false;
    sessionStorage.setItem(STORAGE_KEYS.results, JSON.stringify(record.result));
    sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(record.result));
    if (record.result.type === "travel") sessionStorage.setItem(STORAGE_KEYS.travelMission, JSON.stringify(record.result));
    location.href = `results.html?reference=${encodeURIComponent(reference)}`;
    return true;
  } catch {
    return false;
  }
};

const detectPrototypeReferenceInImage = async (file) => {
  if (!file || typeof createImageBitmap !== "function") return "";
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (typeof window.BarcodeDetector === "function") {
      const codes = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(bitmap);
      const qrValues = codes.map((code) => code.rawValue || "").filter(Boolean);
      const portableUrl = qrValues.find((value) => {
        try {
          const url = new URL(value);
          return (url.hostname === "kastiz.com" || url.hostname.endsWith(".pages.dev")) && /\/results(?:\.html)?$/.test(url.pathname) && url.searchParams.has("share");
        } catch { return false; }
      });
      if (portableUrl) return portableUrl;
      const qrReference = qrValues.join(" ").toUpperCase().match(/ONE-DEMO-[A-Z0-9]{8}/)?.[0];
      if (qrReference) return qrReference;
    }
    if (typeof window.TextDetector === "function") {
      const blocks = await new window.TextDetector().detect(bitmap);
      return blocks.map((block) => block.rawValue || "").join(" ").toUpperCase().match(/ONE-DEMO-[A-Z0-9]{8}/)?.[0] || "";
    }
    return "";
  } catch {
    return "";
  } finally {
    bitmap?.close?.();
  }
};

const supportedLanguages = OFFICIAL_LOCALES;
const supportedThemes = ["light", "gray", "midnight"];

const translations = {
  en: {
    description: "Kastiz ONE structures real-world goals into approval-ready missions using public information and clearly labeled prototype recommendations.",
    siteNavigation: "Kastiz ONE navigation",
    preferences: "Preferences",
    themeLabel: "Theme",
    languageLabel: "Language",
    account: "Account",
    upgrade: "Upgrade",
    login: "Login",
    loginWelcome: "Welcome to Kastiz ONE",
    loginComingSoon: "Account access is being released gradually.",
    loginPriority: "Join early access or request an invitation. No account or password is created on this prototype.",
    joinEarlyAccess: "Join Early Access",
    requestInvitation: "Request Invitation",
    contactSupport: "Contact Support",
    notifyMe: "Notify Me",
    notifyConfirmed: "You're on the priority list.",
    scheduleTitle: "Choose dates and time",
    scheduleHelp: "Select the required date range. Time is optional.",
    startDate: "Start date",
    endDate: "End date",
    timePreference: "Time preference",
    anyTime: "Any time / No preference",
    morning: "Morning Â· 06:00â€“12:00",
    afternoon: "Afternoon Â· 12:00â€“17:00",
    evening: "Evening Â· 17:00â€“22:00",
    travelerCount: "Travelers",
    roomCount: "Rooms",
    departureAirport: "Departure airport",
    confirmSchedule: "Confirm and Continue",
    searchLabel: "Enter your mission",
    searchDefault: "Plan my Japan trip.",
    missionTools: "Mission tools",
    microphone: "Use microphone",
    uploadImage: "Upload image",
    aiPowered: "AI powered",
    startMission: "Start mission",
    footer: "Footer",
    partners: "Partners",
    business: "Business",
    developers: "Developers",
    poweredBy: "Powered by Kastiz",
    privacy: "Privacy",
    terms: "Terms",
    settings: "Settings",
    unknownLocation: "Unknown Location",
    themes: {
      light: "Light",
      gray: "Gray",
      midnight: "Midnight"
    },
    languages: {
      en: "English",
      ko: "í•œêµ­ì–´"
    },
    missions: [
      "Plan my Japan trip.",
      "Find my first home.",
      "Start a business.",
      "Move to Canada.",
      "Buy the best laptop.",
      "Find childcare.",
      "Register my trademark.",
      "Plan my honeymoon.",
      "Save me money.",
      "Find the best divorce lawyer.",
      "Import products from China.",
      "Build my dream PC.",
      "Move overseas.",
      "Compare mortgages.",
      "Plan my retirement.",
      "Book my dream vacation."
    ]
  },
  ko: {
    description: "Kastiz ONEì€ í˜„ì‹¤ì˜ ë¯¸ì…˜ì„ ì™„ì„±í•©ë‹ˆë‹¤.",
    siteNavigation: "Kastiz ONE ë‚´ë¹„ê²Œì´ì…˜",
    preferences: "ì„¤ì •",
    themeLabel: "í…Œë§ˆ",
    languageLabel: "ì–¸ì–´",
    account: "ê³„ì •",
    upgrade: "ì—…ê·¸ë ˆì´ë“œ",
    login: "ë¡œê·¸ì¸",
    loginWelcome: "Kastiz ONEì— ì˜¤ì‹  ê²ƒì„ í™˜ì˜í•©ë‹ˆë‹¤",
    loginComingSoon: "ê³„ì • ê¸°ëŠ¥ì€ ê³§ ì œê³µë©ë‹ˆë‹¤.",
    loginPriority: "ì´ˆê¸° ì‚¬ìš©ìžì—ê²Œ ìš°ì„  ì´ìš© ê¸°íšŒë¥¼ ë“œë¦½ë‹ˆë‹¤.",
    joinEarlyAccess: "ì–¼ë¦¬ ì•¡ì„¸ìŠ¤ ì°¸ì—¬",
    requestInvitation: "ì´ˆëŒ€ ìš”ì²­",
    contactSupport: "ê³ ê° ì§€ì› ë¬¸ì˜",
    notifyMe: "ì•Œë¦¼ ì‹ ì²­",
    notifyConfirmed: "ìš°ì„  ì•Œë¦¼ ëª©ë¡ì— ë“±ë¡ë˜ì—ˆìŠµë‹ˆë‹¤.",
    scheduleTitle: "ë‚ ì§œì™€ ì‹œê°„ì„ ì„ íƒí•˜ì„¸ìš”",
    scheduleHelp: "í•„ìš”í•œ ë‚ ì§œ ë²”ìœ„ë¥¼ ì„ íƒí•˜ì„¸ìš”. ì‹œê°„ì€ ì„ íƒ ì‚¬í•­ìž…ë‹ˆë‹¤.",
    startDate: "ì‹œìž‘ ë‚ ì§œ",
    endDate: "ì¢…ë£Œ ë‚ ì§œ",
    timePreference: "ì„ í˜¸ ì‹œê°„",
    anyTime: "ì‹œê°„ ë¬´ê´€ / ì„ í˜¸ ì—†ìŒ",
    morning: "ì˜¤ì „ Â· 06:00â€“12:00",
    afternoon: "ì˜¤í›„ Â· 12:00â€“17:00",
    evening: "ì €ë… Â· 17:00â€“22:00",
    travelerCount: "ì—¬í–‰ ì¸ì›",
    roomCount: "ê°ì‹¤ ìˆ˜",
    departureAirport: "ì¶œë°œ ê³µí•­",
    confirmSchedule: "í™•ì¸ í›„ ê³„ì†",
    searchLabel: "ë¯¸ì…˜ ìž…ë ¥",
    searchDefault: "ì¼ë³¸ ì—¬í–‰ ê³„íší•´ì¤˜",
    missionTools: "ë¯¸ì…˜ ë„êµ¬",
    microphone: "ë§ˆì´í¬ ì‚¬ìš©",
    uploadImage: "ì´ë¯¸ì§€ ì—…ë¡œë“œ",
    aiPowered: "AI ê¸°ë°˜",
    startMission: "ë¯¸ì…˜ ì‹œìž‘",
    footer: "í‘¸í„°",
    partners: "íŒŒíŠ¸ë„ˆ",
    business: "ë¹„ì¦ˆë‹ˆìŠ¤",
    developers: "ê°œë°œìž",
    poweredBy: "Kastiz ì œê³µ",
    privacy: "ê°œì¸ì •ë³´",
    terms: "ì•½ê´€",
    settings: "ì„¤ì •",
    unknownLocation: "ì•Œ ìˆ˜ ì—†ëŠ” ìœ„ì¹˜",
    themes: {
      light: "ë¼ì´íŠ¸",
      gray: "ê·¸ë ˆì´",
      midnight: "ë¯¸ë“œë‚˜ì´íŠ¸"
    },
    languages: {
      en: "English",
      ko: "í•œêµ­ì–´"
    },
    missions: [
      "ì¼ë³¸ ì—¬í–‰ ê³„íší•´ì¤˜",
      "ì˜ì–´ ì„ ìƒë‹˜ ì°¾ì•„ì¤˜",
      "ì¢‹ì€ ë…¸íŠ¸ë¶ ì¶”ì²œí•´ì¤˜",
      "ìºë‚˜ë‹¤ ì´ì£¼ ë„ì™€ì¤˜",
      "ì•„ì´ ëŒë´„ ì„œë¹„ìŠ¤ ì°¾ì•„ì¤˜",
      "ìƒí‘œ ë“±ë¡ ë„ì™€ì¤˜",
      "ì‹ í˜¼ì—¬í–‰ ê³„íší•´ì¤˜",
      "ëˆì„ ì ˆì•½í•  ë°©ë²• ì°¾ì•„ì¤˜",
      "ìµœê³ ì˜ ì´í˜¼ ì „ë¬¸ ë³€í˜¸ì‚¬ ì°¾ì•„ì¤˜",
      "ì¤‘êµ­ì—ì„œ ìƒí’ˆ ìˆ˜ìž… ë„ì™€ì¤˜",
      "ê¿ˆì˜ PC ì¡°ë¦½í•´ì¤˜",
      "í•´ì™¸ ì´ì£¼ ì¤€ë¹„í•´ì¤˜",
      "ì£¼íƒë‹´ë³´ëŒ€ì¶œ ë¹„êµí•´ì¤˜",
      "ì€í‡´ ê³„íš ì„¸ì›Œì¤˜",
      "ê¿ˆì˜ íœ´ê°€ ì˜ˆì•½ ì¤€ë¹„í•´ì¤˜"
    ]
  }
};

translations.es = {
  ...localeSection("es", "home"),
  travelerCount: localeSection("es", "home").travelerCount || "Viajeros",
  roomCount: localeSection("es", "home").roomCount || "Habitaciones",
  departureAirport: localeSection("es", "home").departureAirport || "Aeropuerto de salida"
};

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

const KASTIZ_ONE_VERSION = "V9_MISSION_ENGINE_FREE_API_MVP";

const approvalProtectionMessages = {
  en: "Nothing will be booked, purchased, reserved, signed, submitted, paid for, or legally committed until you approve.",
  ko: "ì‚¬ìš©ìžê°€ ìŠ¹ì¸í•˜ê¸° ì „ì—ëŠ” ì˜ˆì•½, ê²°ì œ, êµ¬ë§¤, ì„œëª…, ì œì¶œ ë˜ëŠ” ë²•ì  ì•½ì†ì´ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤."
};

const universalMissionTypes = {
  travel: "travel",
  shopping: "shopping",
  housing: "housing",
  legal: "legal",
  moving: "moving",
  business: "business",
  healthcare: "healthcare",
  finance: "finance",
  career: "career",
  lifestyle: "lifestyle",
  general: "general_mission"
};

const missionKeywordMap = {
  travel: {
    subtype: "trip_planning",
    en: ["travel", "trip", "vacation", "honeymoon", "flight", "hotel", "japan", "tokyo", "osaka", "kyoto", "airport"],
    ko: ["ì—¬í–‰", "ì¶œìž¥", "í•´ì™¸ì¶œìž¥", "ì—…ë¬´ì¶œìž¥", "ì¼ë³¸", "ë„ì¿„", "ì˜¤ì‚¬ì¹´", "êµí† ", "í•­ê³µê¶Œ", "í˜¸í…”", "ì‹ í˜¼ì—¬í–‰", "ê³µí•­"]
  },
  shopping: {
    subtype: "product_research",
    en: ["buy", "laptop", "phone", "iphone", "macbook", "product", "compare", "cheapest", "best deal"],
    ko: ["êµ¬ë§¤", "ë…¸íŠ¸ë¶", "í•¸ë“œí°", "ì•„ì´í°", "ë§¥ë¶", "ì œí’ˆ", "ë¹„êµ", "ìµœì €ê°€", "ì¶”ì²œ"]
  },
  housing: {
    subtype: "housing_search",
    en: ["home", "house", "apartment", "rent", "mortgage", "real estate", "property"],
    ko: ["ì§‘", "ì•„íŒŒíŠ¸", "ì „ì„¸", "ì›”ì„¸", "ë¶€ë™ì‚°", "ì£¼íƒë‹´ë³´ëŒ€ì¶œ"]
  },
  legal: {
    subtype: "legal_service_preparation",
    en: ["lawyer", "legal", "attorney", "divorce", "contract", "lawsuit", "trademark"],
    ko: ["ë³€í˜¸ì‚¬", "ë²•ë¥ ", "ì´í˜¼", "ê³„ì•½ì„œ", "ì†Œì†¡", "ìƒí‘œ"]
  },
  moving: {
    subtype: "relocation_preparation",
    en: ["move", "immigration", "visa", "overseas", "canada", "america", "relocation"],
    ko: ["ì´ì£¼", "ì´ë¯¼", "ë¹„ìž", "í•´ì™¸", "ìºë‚˜ë‹¤", "ë¯¸êµ­"]
  },
  business: {
    subtype: "business_setup",
    en: ["business", "company", "startup", "register", "tax", "accountant", "supplier"],
    ko: ["ì‚¬ì—…", "ì°½ì—…", "íšŒì‚¬", "ë²•ì¸", "ì„¸ê¸ˆ", "íšŒê³„ì‚¬", "ê³µê¸‰ì—…ì²´"]
  },
  healthcare: {
    subtype: "healthcare_search",
    en: ["doctor", "dentist", "hospital", "clinic", "checkup", "appointment"],
    ko: ["ë³‘ì›", "ì˜ì‚¬", "ì¹˜ê³¼", "ê±´ê°•ê²€ì§„", "ì˜ˆì•½"]
  },
  finance: {
    subtype: "financial_comparison",
    en: ["loan", "mortgage", "savings", "credit card", "investment", "insurance"],
    ko: ["ëŒ€ì¶œ", "ì ê¸ˆ", "ì‹ ìš©ì¹´ë“œ", "íˆ¬ìž", "ë³´í—˜"]
  },
  career: {
    subtype: "career_search",
    en: ["job", "resume", "career", "interview", "salary", "recruiter", "tutor", "teacher", "lesson", "english teacher"],
    ko: ["ì·¨ì—…", "ì´ì§", "ì´ë ¥ì„œ", "ë©´ì ‘", "ì—°ë´‰", "ì„ ìƒë‹˜", "íŠœí„°", "ê³¼ì™¸", "ì˜ì–´ ìˆ˜ì—…"]
  },
  lifestyle: {
    subtype: "lifestyle_planning",
    en: ["wedding", "restaurant", "event", "birthday", "party", "gym", "trainer", "date", "girlfriend", "boyfriend", "couple", "anniversary"],
    ko: ["ê²°í˜¼ì‹", "ì‹ë‹¹", "ì´ë²¤íŠ¸", "ìƒì¼", "íŒŒí‹°", "í—¬ìŠ¤ìž¥", "íŠ¸ë ˆì´ë„ˆ", "ë°ì´íŠ¸", "ì—¬ì¹œ", "ì—¬ìžì¹œêµ¬", "ë‚¨ì¹œ", "ë‚¨ìžì¹œêµ¬", "ì»¤í”Œ", "ê¸°ë…ì¼"]
  }
};

const countryProfiles = {
  JP: { code: "JP", name: "Japan", nameKo: "ì¼ë³¸", currency: "JPY", capital: "Tokyo", capitalKo: "ë„ì¿„", latitude: 35.6762, longitude: 139.6503 },
  KR: { code: "KR", name: "South Korea", nameKo: "ëŒ€í•œë¯¼êµ­", currency: "KRW", capital: "Seoul", capitalKo: "ì„œìš¸", latitude: 37.5665, longitude: 126.978 },
  CA: { code: "CA", name: "Canada", nameKo: "ìºë‚˜ë‹¤", currency: "CAD", capital: "Ottawa", capitalKo: "ì˜¤íƒ€ì™€", latitude: 45.4215, longitude: -75.6972 },
  US: { code: "US", name: "United States", nameKo: "ë¯¸êµ­", currency: "USD", capital: "Washington, D.C.", capitalKo: "ì›Œì‹±í„´ D.C.", latitude: 38.9072, longitude: -77.0369 },
  CN: { code: "CN", name: "China", nameKo: "ì¤‘êµ­", currency: "CNY", capital: "Beijing", capitalKo: "ë² ì´ì§•", latitude: 39.9042, longitude: 116.4074 },
  ES: { code: "ES", name: "Spain", nameKo: "ìŠ¤íŽ˜ì¸", currency: "EUR", capital: "Madrid", capitalKo: "ë§ˆë“œë¦¬ë“œ", latitude: 40.4168, longitude: -3.7038 },
  CO: { code: "CO", name: "Colombia", nameKo: "ì½œë¡¬ë¹„ì•„", currency: "COP", capital: "BogotÃ¡", capitalKo: "ë³´ê³ íƒ€", latitude: 4.711, longitude: -74.0721 }
};

const createProvider = (providerName, category, sourceStatus, liveData, requiresKey, requiresPartnerAccess) => ({
  provider: providerName,
  category,
  sourceStatus,
  liveData,
  requiresKey,
  requiresPartnerAccess,
  items: [],
  error: null
});

const providerCatalog = {
  travel: [
    createProvider("Open-Meteo", "weather", "free_live_api", true, false, false),
    createProvider("Frankfurter", "currency", "free_live_api", true, false, false),
    createProvider("CountriesNow", "country", "free_live_api", true, false, false),
    createProvider("OpenStreetMap Nominatim", "maps", "free_live_api", true, false, false),
    createProvider("Wikipedia", "destination_info", "free_live_api", true, false, false),
    createProvider("Flight Provider Interface", "flights", "prototype_adapter", false, false, true),
    createProvider("Hotel Provider Interface", "hotels", "prototype_adapter", false, false, true),
    createProvider("Restaurant Provider Interface", "restaurants", "prototype_adapter", false, false, true)
  ],
  shopping: [
    createProvider("Product Search Interface", "products", "prototype_adapter", false, false, true),
    createProvider("Review Provider Interface", "reviews", "prototype_adapter", false, false, true),
    createProvider("Price Comparison Interface", "price_comparison", "prototype_adapter", false, false, true),
    createProvider("Retail Availability Interface", "availability", "prototype_adapter", false, false, true)
  ],
  housing: [
    createProvider("Housing Search Interface", "housing", "prototype_adapter", false, false, true),
    createProvider("OpenStreetMap Nominatim", "maps", "free_live_api", true, false, false),
    createProvider("Mortgage Comparison Interface", "mortgage", "prototype_adapter", false, false, true)
  ],
  legal: [
    createProvider("Legal Service Interface", "lawyer_search", "prototype_adapter", false, false, true),
    createProvider("Government Resources Interface", "documents", "prototype_adapter", false, false, false)
  ],
  moving: [
    createProvider("CountriesNow", "country", "free_live_api", true, false, false),
    createProvider("Immigration Resource Interface", "visa", "prototype_adapter", false, false, true),
    createProvider("Housing Search Interface", "housing", "prototype_adapter", false, false, true),
    createProvider("Shipping Provider Interface", "shipping", "prototype_adapter", false, false, true)
  ],
  business: [
    createProvider("Business Registration Interface", "registration", "prototype_adapter", false, false, false),
    createProvider("Tax / Accounting Interface", "tax", "prototype_adapter", false, false, true),
    createProvider("Supplier Search Interface", "suppliers", "prototype_adapter", false, false, true),
    createProvider("Domain / Brand Interface", "brand", "prototype_adapter", false, false, true)
  ],
  healthcare: [
    createProvider("Clinic Search Interface", "clinic", "prototype_adapter", false, false, true),
    createProvider("Hospital Search Interface", "hospital", "prototype_adapter", false, false, true),
    createProvider("Appointment Interface", "appointment", "prototype_adapter", false, false, true),
    createProvider("OpenStreetMap Nominatim", "maps", "free_live_api", true, false, false)
  ],
  finance: [
    createProvider("Loan Comparison Interface", "loans", "prototype_adapter", false, false, true),
    createProvider("Rate Provider Interface", "rates", "prototype_adapter", false, false, true),
    createProvider("Document Checklist Engine", "documents", "prototype_adapter", false, false, false)
  ],
  career: [
    createProvider("Job Search Interface", "jobs", "prototype_adapter", false, false, true),
    createProvider("Resume Engine", "resume", "prototype_adapter", false, false, false),
    createProvider("Recruiter Interface", "recruiters", "prototype_adapter", false, false, true)
  ],
  lifestyle: [
    createProvider("Vendor Search Interface", "vendors", "prototype_adapter", false, false, true),
    createProvider("Timeline Engine", "timeline", "prototype_adapter", false, false, false),
    createProvider("Budget Engine", "budget", "prototype_adapter", false, false, false),
    createProvider("Reservation Interface", "reservations", "prototype_adapter", false, false, true)
  ],
  general_mission: [
    createProvider("Mission Planning Engine", "planning", "prototype_adapter", false, false, false),
    createProvider("Checklist Engine", "checklist", "prototype_adapter", false, false, false)
  ]
};


const travelKeywordMap = {
  en: [
    "travel",
    "trip",
    "vacation",
    "honeymoon",
    "flight",
    "hotel",
    "japan",
    "tokyo",
    "osaka",
    "kyoto"
  ],
  ko: [
    "ì—¬í–‰",
    "ì¶œìž¥",
    "í•´ì™¸ì¶œìž¥",
    "ì—…ë¬´ì¶œìž¥",
    "ì¼ë³¸",
    "ë„ì¿„",
    "ì˜¤ì‚¬ì¹´",
    "êµí† ",
    "í•­ê³µê¶Œ",
    "í˜¸í…”",
    "ì‹ í˜¼ì—¬í–‰"
  ]
};

const destinationPatterns = [
  { destination: "United States", destinationKo: "ë¯¸êµ­", city: "New York", cityKo: "ë‰´ìš•", latitude: 40.7128, longitude: -74.006, aliases: ["new york", "nyc", "newyork", "ë‰´ìš•"] },
  { destination: "Spain", destinationKo: "ìŠ¤íŽ˜ì¸", city: "Madrid", cityKo: "ë§ˆë“œë¦¬ë“œ", latitude: 40.4168, longitude: -3.7038, aliases: ["madrid", "spain", "ë§ˆë“œë¦¬ë“œ", "ìŠ¤íŽ˜ì¸"] },
  { destination: "Colombia", destinationKo: "ì½œë¡¬ë¹„ì•„", city: "BogotÃ¡", cityKo: "ë³´ê³ íƒ€", latitude: 4.711, longitude: -74.0721, aliases: ["colombia", "bogota", "bogotÃ¡", "ì½œë¡¬ë¹„ì•„", "ë³´ê³ íƒ€"] },
  {
    destination: "Japan",
    destinationKo: "ì¼ë³¸",
    city: "Tokyo",
    cityKo: "ë„ì¿„",
    aliases: ["japan", "tokyo", "ì¼ë³¸", "ë„ì¿„"]
  },
  {
    destination: "Japan",
    destinationKo: "ì¼ë³¸",
    city: "Osaka",
    cityKo: "ì˜¤ì‚¬ì¹´",
    aliases: ["osaka", "ì˜¤ì‚¬ì¹´"]
  },
  {
    destination: "Japan",
    destinationKo: "ì¼ë³¸",
    city: "Kyoto",
    cityKo: "êµí† ",
    aliases: ["kyoto", "êµí† "]
  }
];

let activeLanguage = "en";
let activeMissionIndex = -1;
let rotatorInterval = null;
let aiModeEnabled = false;
let selectedImageFiles = [];

const getBrowserLanguage = () => {
  const browserLanguage = navigator.language || navigator.userLanguage || "en";
  return normalizeInterfaceLocale(browserLanguage);
};

const getSavedLanguage = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.language);
  return supportedLanguages.includes(saved) ? saved : null;
};

const getSavedTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  return supportedThemes.includes(saved) ? saved : null;
};

const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "light";
};

const getInitialTheme = () => {
  return getSavedTheme() || getSystemTheme();
};

const getInitialLanguage = () => {
  return getSavedLanguage() || getBrowserLanguage();
};

const getTranslation = (key) => {
  return localeSection(activeLanguage, "home")[key] ?? translations[activeLanguage]?.[key] ?? translations.en[key] ?? "";
};

const setMetaThemeColor = (theme) => {
  const colors = {
    light: "#ffffff",
    gray: "#3f4146",
    midnight: "#121315"
  };

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", colors[theme] || colors.light);
};

const syncLogoTheme = (theme) => {
  const isLight = theme === "light";
  document.querySelectorAll(".header-mini-symbol,.one-symbol").forEach((image) => {
    image.style.filter = isLight
      ? "invert(1) drop-shadow(0 0 .65px currentColor)"
      : "drop-shadow(0 0 .65px currentColor)";
  });
};

const updateThemeControls = () => {
  const themeLabels = getTranslation("themes");
  const currentTheme = root.getAttribute("data-theme") || "light";

  themeControlText.textContent = getTranslation("themeLabel");

  document.querySelectorAll("[data-theme-option]").forEach((button) => {
    const value = button.getAttribute("data-theme-option");
    button.textContent = themeLabels[value] || value;
    button.classList.toggle("is-active", value === currentTheme);
    button.setAttribute("aria-selected", String(value === currentTheme));
  });
};

const updateLanguageControls = () => {
  const languageLabels = getTranslation("languages");

  languageControlText.textContent = languageLabels[activeLanguage] || "English";

  document.querySelectorAll("[data-language-option]").forEach((button) => {
    const value = button.getAttribute("data-language-option");
    button.textContent = languageLabels[value] || value;
    button.classList.toggle("is-active", value === activeLanguage);
    button.setAttribute("aria-selected", String(value === activeLanguage));
  });
};

const setTheme = (theme) => {
  const nextTheme = supportedThemes.includes(theme) ? theme : "light";

  root.setAttribute("data-theme", nextTheme);
  localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  setMetaThemeColor(nextTheme);
  syncLogoTheme(nextTheme);
  updateThemeControls();
};

const updateLocation = () => {
  const locale = navigator.language || "en";
  const region = locale.includes("-") ? locale.split("-").pop().toUpperCase() : "";

  const usesPhoneFooter = window.matchMedia(
    "(max-width: 640px), (orientation: landscape) and (max-height: 500px) and (max-width: 950px)"
  ).matches;

  locationText.textContent = usesPhoneFooter
    ? (activeLanguage === "ko" ? "ëŒ€í•œë¯¼êµ­" : activeLanguage === "es" ? "Corea del Sur" : "South Korea")
    : countryNamesByRegion[region] || getTranslation("unknownLocation");
};

const updateTextContent = () => {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    element.textContent = getTranslation(key);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const key = element.getAttribute("data-i18n-aria");
    element.setAttribute("aria-label", getTranslation(key));
  });

  document.querySelectorAll("[data-i18n-meta]").forEach((element) => {
    const key = element.getAttribute("data-i18n-meta");
    element.setAttribute("content", getTranslation(key));
  });
};

const fadeRotatorTo = (text) => {
  missionRotator.classList.add("is-fading");

  window.setTimeout(() => {
    missionRotatorText.textContent = text;
    missionRotator.classList.remove("is-fading");
  }, 260);
};

const resetMissionRotator = () => {
  window.clearInterval(rotatorInterval);

  const missions = getTranslation("missions");
  activeMissionIndex = 0;
  missionRotatorText.textContent = missions[activeMissionIndex];

  rotatorInterval = window.setInterval(() => {
    rotateMission();
  }, 5000);
};

const rotateMission = () => {
  const missions = getTranslation("missions");

  activeMissionIndex = (activeMissionIndex + 1) % missions.length;
  fadeRotatorTo(missions[activeMissionIndex]);
  trackEvent("mission_prompt_rotated", { page: "home", language: activeLanguage });
};

const setLanguage = (language) => {
  activeLanguage = supportedLanguages.includes(language) ? language : "en";

  root.setAttribute("lang", activeLanguage);
  document.documentElement.lang = activeLanguage;
  localStorage.setItem(STORAGE_KEYS.language, activeLanguage);

  updateTextContent();
  updateThemeControls();
  updateLanguageControls();
  updateLocation();
  resetMissionRotator();
  document.dispatchEvent(new CustomEvent("kastiz:language-changed", { detail: { language: activeLanguage } }));
};

const normalizeMission = (value) => {
  return value.replace(/\s+/g, " ").trim();
};

const createMissionSlug = (mission) => {
  return mission
    .toLowerCase()
    .replace(/[^a-z0-9\u3131-\uD79D\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
};

const normalizeForDetection = (value) => {
  return normalizeMission(value).toLowerCase();
};

const createMissionId = (type) => {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const detectInputLanguage = (mission) => {
  if (/[\u3131-\u318E\uAC00-\uD79D]/u.test(mission)) return "ko";
  if (/[¿¡ñáéíóúü]/i.test(mission)) return "es";
  return activeLanguage;
};

const detectMissionType = (mission) => {
  const text = normalizeForDetection(mission);

  const scores = Object.entries(missionKeywordMap).map(([type, config]) => {
    const keywords = [...config.en, ...config.ko];
    const score = keywords.reduce((total, keyword) => {
      return text.includes(keyword.toLowerCase()) ? total + keyword.length : total;
    }, 0);

    return { type, score };
  });

  scores.sort((a, b) => b.score - a.score);

  return scores[0] && scores[0].score > 0 ? scores[0].type : universalMissionTypes.general;
};

const detectSubtype = (type) => {
  return missionKeywordMap[type]?.subtype || "general_preparation";
};

const detectCountry = (mission, type) => {
  const text = normalizeForDetection(mission);

  const matches = [
    { code: "JP", keywords: ["japan", "tokyo", "osaka", "kyoto", "ì¼ë³¸", "ë„ì¿„", "ì˜¤ì‚¬ì¹´", "êµí† "] },
    { code: "KR", keywords: ["korea", "seoul", "busan", "incheon", "í•œêµ­", "ì„œìš¸", "ë¶€ì‚°", "ì¸ì²œ"] },
    { code: "CA", keywords: ["canada", "toronto", "vancouver", "ìºë‚˜ë‹¤", "í† ë¡ í† ", "ë°´ì¿ ë²„"] },
    { code: "US", keywords: ["america", "usa", "united states", "new york", "nyc", "ë¯¸êµ­", "ë‰´ìš•"] },
    { code: "CN", keywords: ["china", "beijing", "shanghai", "ì¤‘êµ­", "ë² ì´ì§•", "ìƒí•˜ì´"] },
    { code: "ES", keywords: ["spain", "madrid", "ìŠ¤íŽ˜ì¸", "ë§ˆë“œë¦¬ë“œ"] },
    { code: "CO", keywords: ["colombia", "bogota", "bogotÃ¡", "ì½œë¡¬ë¹„ì•„", "ë³´ê³ íƒ€"] }
  ];

  const found = matches.find((item) => item.keywords.some((keyword) => text.includes(keyword.toLowerCase())));

  return found?.code || null;
};

const missionText = (en, ko) => {
  return activeLanguage === "ko" ? ko : en;
};

const buildIntent = (type) => {
  const map = {
    travel: missionText("Prepare a trip plan and compare practical options.", "ì—¬í–‰ ê³„íšì„ ì¤€ë¹„í•˜ê³  ì‹¤ìš©ì ì¸ ì„ íƒì§€ë¥¼ ë¹„êµí•©ë‹ˆë‹¤."),
    shopping: missionText("Prepare product options, prices, reviews, and a buying checklist.", "ì œí’ˆ í›„ë³´, ê°€ê²©, ë¦¬ë·°, êµ¬ë§¤ ì „ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    housing: missionText("Prepare housing options, budget assumptions, and a pre-contract checklist.", "ì£¼ê±° í›„ë³´, ì˜ˆì‚° ê°€ì •, ê³„ì•½ ì „ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    legal: missionText("Prepare legal service types, required documents, and questions to ask.", "ë²•ë¥  ì„œë¹„ìŠ¤ ìœ í˜•, í•„ìš” ì„œë¥˜, ìƒë‹´ ì§ˆë¬¸ì„ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    moving: missionText("Prepare relocation steps, visa, housing, and shipping checklist.", "ì´ì£¼ ë‹¨ê³„, ë¹„ìž, ì£¼ê±°, ë°°ì†¡ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    business: missionText("Prepare business setup, registration, tax, suppliers, and launch steps.", "ì‚¬ì—… ì‹œìž‘, ë“±ë¡, ì„¸ê¸ˆ, ê³µê¸‰ì—…ì²´, ëŸ°ì¹­ ë‹¨ê³„ë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    healthcare: missionText("Prepare clinic options, appointment preparation, documents, and costs.", "ë³‘ì› í›„ë³´, ì˜ˆì•½ ì¤€ë¹„, í•„ìš” ì„œë¥˜, ì˜ˆìƒ ë¹„ìš©ì„ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    finance: missionText("Compare financial options, rates, documents, and risks.", "ê¸ˆìœµ ì˜µì…˜, ê¸ˆë¦¬, í•„ìš” ì„œë¥˜, ë¦¬ìŠ¤í¬ë¥¼ ë¹„êµí•©ë‹ˆë‹¤."),
    career: missionText("Prepare job targets, resume, interview, and recruiter steps.", "ì±„ìš© ëª©í‘œ, ì´ë ¥ì„œ, ë©´ì ‘, ë¦¬í¬ë£¨í„° ë‹¨ê³„ë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    lifestyle: missionText("Prepare vendors, timeline, budget, reservations, and checklist.", "ì—…ì²´, ì¼ì •, ì˜ˆì‚°, ì˜ˆì•½, ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    general_mission: missionText("Turn the request into a structured mission plan.", "ìš”ì²­ì„ êµ¬ì¡°í™”ëœ ë¯¸ì…˜ ê³„íšìœ¼ë¡œ ì •ë¦¬í•©ë‹ˆë‹¤.")
  };

  return map[type] || map.general_mission;
};

const buildAssumptions = (type, country) => {
  const assumptions = [
    missionText("ONE prepares and compares only; real-world execution requires explicit approval.", "ONEì€ ì¤€ë¹„ì™€ ë¹„êµë§Œ ìˆ˜í–‰í•˜ë©° ì‹¤ì œ ì‹¤í–‰ì€ ëª…ì‹œì  ìŠ¹ì¸ í›„ì—ë§Œ ê°€ëŠ¥í•©ë‹ˆë‹¤."),
    missionText("When details are missing, ONE uses balanced recommendations by default.", "ì„¸ë¶€ ì¡°ê±´ì´ ë¶€ì¡±í•˜ë©´ ê· í˜•í˜• ì¶”ì²œì„ ê¸°ë³¸ê°’ìœ¼ë¡œ ì‚¬ìš©í•©ë‹ˆë‹¤.")
  ];

  if (type === "travel") {
    assumptions.push(missionText("If dates are missing, ONE assumes a 7-day trip.", "ë‚ ì§œê°€ ì—†ìœ¼ë©´ 7ì¼ ì—¬í–‰ìœ¼ë¡œ ê°€ì •í•©ë‹ˆë‹¤."));
  }

  if (country && countryProfiles[country]) {
    assumptions.push(
      activeLanguage === "ko"
        ? `êµ­ê°€ ê¸°ì¤€ì€ ${countryProfiles[country].nameKo}ë¡œ ì„¤ì •ë˜ì—ˆìŠµë‹ˆë‹¤.`
        : `Country context is set to ${countryProfiles[country].name}.`
    );
  }

  return assumptions;
};

const buildSteps = (type) => {
  const map = {
    travel: [["flights","Prepare flight options","í•­ê³µê¶Œ ì˜µì…˜ ì¤€ë¹„"],["hotels","Prepare hotel options","ìˆ™ì†Œ ì˜µì…˜ ì¤€ë¹„"],["weather","Check weather","ë‚ ì”¨ í™•ì¸"],["currency","Check exchange rates","í™˜ìœ¨ í™•ì¸"],["visa","Check visa / entry requirements","ë¹„ìž / ìž…êµ­ ìš”ê±´ í™•ì¸"],["restaurants","Prepare restaurant options","ì‹ë‹¹ ì˜µì…˜ ì¤€ë¹„"],["airport_transfer","Prepare airport transfer","ê³µí•­ ì´ë™ ì¤€ë¹„"],["checklist","Prepare travel checklist","ì—¬í–‰ ì²´í¬ë¦¬ìŠ¤íŠ¸ ì¤€ë¹„"]],
    shopping: [["recommended_product","Select recommended product","ì¶”ì²œ ì œí’ˆ ì„ ì •"],["alternatives","Compare alternative products","ëŒ€ì•ˆ ì œí’ˆ ë¹„êµ"],["price_comparison","Compare prices","ê°€ê²© ë¹„êµ"],["where_to_buy","Prepare where to buy","êµ¬ë§¤ì²˜ ì¤€ë¹„"],["warranty","Check warranty","ë³´ì¦ í™•ì¸"],["delivery","Prepare delivery options","ë°°ì†¡ ì˜µì…˜ ì¤€ë¹„"],["checklist","Pre-purchase checklist","êµ¬ë§¤ ì „ ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    housing: [["housing_options","Prepare housing options","ì£¼ê±° ì˜µì…˜ ì¤€ë¹„"],["area_comparison","Compare areas","ì§€ì—­ ë¹„êµ"],["budget","Prepare budget range","ì˜ˆì‚° ë²”ìœ„ ì¤€ë¹„"],["documents","Prepare document checklist","ì„œë¥˜ ì²´í¬ë¦¬ìŠ¤íŠ¸ ì¤€ë¹„"],["risks","Check contract risks","ê³„ì•½ ë¦¬ìŠ¤í¬ í™•ì¸"]],
    legal: [["lawyer_type","Define lawyer type","í•„ìš”í•œ ë³€í˜¸ì‚¬ ìœ í˜• ì •ë¦¬"],["documents","Prepare documents needed","í•„ìš” ì„œë¥˜ ì¤€ë¹„"],["process","Outline estimated process","ì˜ˆìƒ ì ˆì°¨ ì •ë¦¬"],["risks","Identify risks","ë¦¬ìŠ¤í¬ ì •ë¦¬"],["questions","Prepare questions to ask","ìƒë‹´ ì§ˆë¬¸ ì¤€ë¹„"],["checklist","Legal checklist","ë²•ë¥  ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    moving: [["visa","Prepare visa","ë¹„ìž ì¤€ë¹„"],["housing","Prepare housing","ì£¼ê±° ì¤€ë¹„"],["shipping","Prepare shipping","ë°°ì†¡ ì¤€ë¹„"],["banking","Prepare banking","ì€í–‰ ì¤€ë¹„"],["insurance","Prepare insurance","ë³´í—˜ ì¤€ë¹„"],["schools","Prepare schools","í•™êµ ì •ë³´ ì¤€ë¹„"],["checklist","Moving checklist","ì´ì£¼ ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    business: [["registration","Prepare business registration","ì‚¬ì—…ìž / ë²•ì¸ ë“±ë¡ ì¤€ë¹„"],["tax","Prepare tax / accounting","ì„¸ê¸ˆ / íšŒê³„ ì¤€ë¹„"],["brand","Prepare brand / domain","ë¸Œëžœë“œ / ë„ë©”ì¸ ì¤€ë¹„"],["suppliers","Prepare suppliers","ê³µê¸‰ì—…ì²´ ì¤€ë¹„"],["budget","Prepare business budget","ì‚¬ì—… ì˜ˆì‚° ì¤€ë¹„"],["checklist","Business checklist","ì‚¬ì—… ì‹œìž‘ ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    healthcare: [["clinic","Prepare clinic / hospital options","ë³‘ì› / í´ë¦¬ë‹‰ í›„ë³´ ì¤€ë¹„"],["appointment","Prepare appointment","ì˜ˆì•½ ì¤€ë¹„"],["documents","Prepare documents","í•„ìš” ì„œë¥˜ ì¤€ë¹„"],["cost","Prepare cost estimate","ì˜ˆìƒ ë¹„ìš© ì¤€ë¹„"],["checklist","Healthcare checklist","ì§„ë£Œ ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    finance: [["loan_options","Prepare loan options","ëŒ€ì¶œ ì˜µì…˜ ì¤€ë¹„"],["rates","Compare rates","ê¸ˆë¦¬ ë¹„êµ"],["documents","Prepare documents","í•„ìš” ì„œë¥˜ ì¤€ë¹„"],["risks","Identify risks","ë¦¬ìŠ¤í¬ ì •ë¦¬"],["checklist","Finance checklist","ê¸ˆìœµ ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    career: [["targets","Prepare job targets","ì±„ìš© ëª©í‘œ ì •ë¦¬"],["resume","Prepare resume","ì´ë ¥ì„œ ì¤€ë¹„"],["interview","Prepare interview","ë©´ì ‘ ì¤€ë¹„"],["recruiters","Prepare recruiters","ë¦¬í¬ë£¨í„° í›„ë³´ ì¤€ë¹„"],["checklist","Career checklist","ì»¤ë¦¬ì–´ ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    lifestyle: [["vendors","Prepare vendors","ì—…ì²´ í›„ë³´ ì¤€ë¹„"],["timeline","Prepare timeline","ì¼ì • ì¤€ë¹„"],["budget","Prepare budget","ì˜ˆì‚° ì¤€ë¹„"],["reservations","Prepare reservations","ì˜ˆì•½ ì¤€ë¹„"],["checklist","Prepare checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸ ì¤€ë¹„"]],
    general_mission: [["understand","Understand request","ìš”ì²­ ë¶„ì„"],["options","Prepare options","ì„ íƒì§€ ì¤€ë¹„"],["plan","Prepare action plan","ì‹¤í–‰ ê³„íš ì¤€ë¹„"],["checklist","Prepare checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸ ì¤€ë¹„"]]
  };

  return (map[type] || map.general_mission).map(([id, en, ko], index) => ({
    id,
    title: activeLanguage === "ko" ? ko : en,
    order: index + 1,
    status: "pending",
    editable: true,
    removable: true,
    priority: "Balanced",
    approved: false
  }));
};

const buildRecommendations = (type) => {
  const map = {
    travel: missionText("Prioritize a balanced itinerary, direct flights, and hotels with strong transport access.", "ê· í˜•í˜• ì¼ì •, ì§í•­ ì¤‘ì‹¬ í•­ê³µ, êµí†µ íŽ¸ë¦¬í•œ ìˆ™ì†Œë¥¼ ìš°ì„  ì¶”ì²œí•©ë‹ˆë‹¤."),
    shopping: missionText("Recommend based on quality, warranty, delivery, reviews, and price balance.", "í’ˆì§ˆ, ë³´ì¦, ë°°ì†¡, ë¦¬ë·°, ê°€ê²© ê· í˜•ì„ ê¸°ì¤€ìœ¼ë¡œ ì¶”ì²œí•©ë‹ˆë‹¤."),
    housing: missionText("Compare location, monthly cost, contract risk, and transport access.", "ìœ„ì¹˜, ì›” ë¹„ìš©, ê³„ì•½ ë¦¬ìŠ¤í¬, êµí†µ ì ‘ê·¼ì„±ì„ ë¹„êµí•©ë‹ˆë‹¤."),
    legal: missionText("Prepare the right lawyer type, documents, and consultation questions first.", "ì „ë¬¸ ë¶„ì•¼ê°€ ë§žëŠ” ë³€í˜¸ì‚¬ ìœ í˜•, ì„œë¥˜, ìƒë‹´ ì§ˆë¬¸ì„ ë¨¼ì € ì¤€ë¹„í•©ë‹ˆë‹¤."),
    moving: missionText("Prepare visa, housing, banking, insurance, and shipping in order.", "ë¹„ìž, ì£¼ê±°, ì€í–‰, ë³´í—˜, ë°°ì†¡ ìˆœì„œë¡œ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    business: missionText("Prepare registration, tax, brand, suppliers, and starting budget.", "ë“±ë¡, ì„¸ê¸ˆ, ë¸Œëžœë“œ, ê³µê¸‰ì—…ì²´, ì´ˆê¸° ì˜ˆì‚°ì„ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    healthcare: missionText("Compare clinics by location, specialty, cost, and appointment availability.", "ìœ„ì¹˜, ì „ë¬¸ ë¶„ì•¼, ë¹„ìš©, ì˜ˆì•½ ê°€ëŠ¥ì„±ì„ ê¸°ì¤€ìœ¼ë¡œ ë³‘ì›ì„ ë¹„êµí•©ë‹ˆë‹¤."),
    finance: missionText("Compare total cost, risk, documents, and rates together.", "ì´ ë¹„ìš©, ë¦¬ìŠ¤í¬, í•„ìš” ì„œë¥˜, ê¸ˆë¦¬ë¥¼ í•¨ê»˜ ë¹„êµí•©ë‹ˆë‹¤."),
    career: missionText("Prepare target roles, resume, interview, and recruiter outreach.", "ëª©í‘œ ì§ë¬´, ì´ë ¥ì„œ, ë©´ì ‘, ë¦¬í¬ë£¨í„° ì ‘ê·¼ì„ ì¤€ë¹„í•©ë‹ˆë‹¤."),
    lifestyle: missionText("Start with budget, timeline, vendors, and reservation risks.", "ì˜ˆì‚°, ì¼ì •, ì—…ì²´, ì˜ˆì•½ ë¦¬ìŠ¤í¬ë¥¼ ë¨¼ì € ì •ë¦¬í•©ë‹ˆë‹¤."),
    general_mission: missionText("Break the request into executable steps and prepare only before approval.", "ìš”ì²­ì„ ì‹¤í–‰ ê°€ëŠ¥í•œ ë‹¨ê³„ë¡œ ë‚˜ëˆ„ê³  ìŠ¹ì¸ ì „ê¹Œì§€ ì¤€ë¹„ë§Œ ì§„í–‰í•©ë‹ˆë‹¤.")
  };

  return [{
    id: "recommended-plan",
    title: "â­ ONE Pick",
    summary: map[type] || map.general_mission,
    priority: "Balanced",
    editable: true,
    removable: false
  }];
};

const buildBudget = (type) => {
  const map = {
    travel: { currency: "KRW", min: 1800000, max: 5600000, confidence: "prototype_estimate" },
    shopping: { currency: "KRW", min: 800000, max: 3500000, confidence: "prototype_estimate" },
    housing: { currency: "KRW", min: 500000, max: 3000000, confidence: "monthly_or_initial_estimate" },
    legal: { currency: "KRW", min: 100000, max: 3000000, confidence: "consultation_and_process_estimate" },
    moving: { currency: "KRW", min: 3000000, max: 20000000, confidence: "prototype_estimate" },
    business: { currency: "KRW", min: 500000, max: 10000000, confidence: "startup_preparation_estimate" },
    healthcare: { currency: "KRW", min: 30000, max: 500000, confidence: "visit_estimate" },
    finance: { currency: "KRW", min: 0, max: 0, confidence: "comparison_required" },
    career: { currency: "KRW", min: 0, max: 500000, confidence: "preparation_estimate" },
    lifestyle: { currency: "KRW", min: 300000, max: 30000000, confidence: "event_estimate" },
    general_mission: { currency: "KRW", min: 0, max: 0, confidence: "needs_more_details" }
  };

  return map[type] || map.general_mission;
};

const buildRisks = (type) => {
  const risks = [
    missionText("Actual price and availability must be verified before real-world execution.", "ì‹¤ì œ ê°€ê²©ê³¼ ê°€ëŠ¥ ì—¬ë¶€ëŠ” ìµœì¢… ì‹¤í–‰ ì „ ë‹¤ì‹œ í™•ì¸í•´ì•¼ í•©ë‹ˆë‹¤."),
    missionText("No contract, booking, submission, or payment happens before approval.", "ìŠ¹ì¸ ì „ì—ëŠ” ê³„ì•½, ì˜ˆì•½, ì œì¶œ, ê²°ì œê°€ ì§„í–‰ë˜ì§€ ì•ŠìŠµë‹ˆë‹¤.")
  ];

  const map = {
    travel: missionText("Flight and hotel prices can change quickly.", "í•­ê³µê¶Œê³¼ ìˆ™ì†Œ ê°€ê²©ì€ ë¹ ë¥´ê²Œ ë³€ë™ë  ìˆ˜ ìžˆìŠµë‹ˆë‹¤."),
    shopping: missionText("Lowest-price products require delivery, warranty, and authenticity checks.", "ìµœì €ê°€ ì œí’ˆì€ ë°°ì†¡, ë³´ì¦, ì •í’ˆ ì—¬ë¶€ë¥¼ í™•ì¸í•´ì•¼ í•©ë‹ˆë‹¤."),
    housing: missionText("Contract terms, deposit, fees, and registration details must be checked.", "ê³„ì•½ ì¡°ê±´, ë³´ì¦ê¸ˆ, ê´€ë¦¬ë¹„, ë“±ê¸° ì‚¬í•­ í™•ì¸ì´ í•„ìš”í•©ë‹ˆë‹¤."),
    legal: missionText("Legal information is for preparation only and requires professional review.", "ë²•ë¥  ì •ë³´ëŠ” ì¼ë°˜ ì¤€ë¹„ìš©ì´ë©° ìµœì¢… íŒë‹¨ì€ ì „ë¬¸ê°€ í™•ì¸ì´ í•„ìš”í•©ë‹ˆë‹¤."),
    moving: missionText("Visa and immigration requirements can change by country.", "ë¹„ìžì™€ ì´ë¯¼ ìš”ê±´ì€ êµ­ê°€ë³„ë¡œ ë°”ë€” ìˆ˜ ìžˆìŠµë‹ˆë‹¤."),
    business: missionText("Business registration, taxes, and permits may differ by location.", "ì‚¬ì—… ë“±ë¡, ì„¸ê¸ˆ, í—ˆê°€ ìš”ê±´ì€ ì§€ì—­ë³„ë¡œ ë‹¤ë¥¼ ìˆ˜ ìžˆìŠµë‹ˆë‹¤."),
    healthcare: missionText("For emergencies, use local emergency services, not ONE.", "ì‘ê¸‰ ìƒí™©ì—ì„œëŠ” ONEì´ ì•„ë‹ˆë¼ í˜„ì§€ ì‘ê¸‰ ì„œë¹„ìŠ¤ë¥¼ ì´ìš©í•´ì•¼ í•©ë‹ˆë‹¤."),
    finance: missionText("Financial products can involve loss, interest, and fee risks.", "ê¸ˆìœµ ìƒí’ˆì€ ì†ì‹¤, ì´ìž, ìˆ˜ìˆ˜ë£Œ ë¦¬ìŠ¤í¬ê°€ ìžˆìŠµë‹ˆë‹¤."),
    career: missionText("Company and role conditions must be checked before applying.", "ì§€ì›ì„œ ì œì¶œ ì „ íšŒì‚¬ì™€ ì¡°ê±´ì„ ì§ì ‘ í™•ì¸í•´ì•¼ í•©ë‹ˆë‹¤."),
    lifestyle: missionText("Availability and cancellation rules must be checked.", "ì˜ˆì•½ ê°€ëŠ¥ ì—¬ë¶€ì™€ ì·¨ì†Œ ê·œì •ì„ í™•ì¸í•´ì•¼ í•©ë‹ˆë‹¤.")
  };

  if (map[type]) risks.unshift(map[type]);
  return risks;
};

const buildCards = (type) => {
  const map = {
    travel: [["flights","Flights","í•­ê³µê¶Œ"],["hotels","Hotels","ìˆ™ì†Œ"],["weather","Weather","ë‚ ì”¨"],["currency","Currency","í™˜ìœ¨"],["visa","Visa","ë¹„ìž"],["restaurants","Restaurants","ì‹ë‹¹"],["airport_transfer","Airport Transfer","ê³µí•­ ì´ë™"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    shopping: [["recommended_product","Recommended Product","ì¶”ì²œ ì œí’ˆ"],["alternative_products","Alternative Products","ëŒ€ì•ˆ ì œí’ˆ"],["price_comparison","Price Comparison","ê°€ê²© ë¹„êµ"],["where_to_buy","Where to Buy","êµ¬ë§¤ì²˜"],["warranty","Warranty","ë³´ì¦"],["delivery","Delivery","ë°°ì†¡"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    housing: [["housing_options","Housing Options","ì£¼ê±° ì˜µì…˜"],["area_comparison","Area Comparison","ì§€ì—­ ë¹„êµ"],["budget","Budget","ì˜ˆì‚°"],["documents","Documents","ì„œë¥˜"],["risks","Risks","ë¦¬ìŠ¤í¬"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    legal: [["lawyer_type","Recommended Lawyer Type","ì¶”ì²œ ë³€í˜¸ì‚¬ ìœ í˜•"],["documents","Documents Needed","í•„ìš” ì„œë¥˜"],["process","Estimated Process","ì˜ˆìƒ ì ˆì°¨"],["risks","Risks","ë¦¬ìŠ¤í¬"],["questions","Questions to Ask","ì§ˆë¬¸ ë¦¬ìŠ¤íŠ¸"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    moving: [["visa","Visa","ë¹„ìž"],["housing","Housing","ì£¼ê±°"],["shipping","Shipping","ë°°ì†¡"],["banking","Banking","ì€í–‰"],["insurance","Insurance","ë³´í—˜"],["schools","Schools","í•™êµ"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    business: [["registration","Business Registration","ì‚¬ì—…ìž / ë²•ì¸ ë“±ë¡"],["tax","Tax / Accounting","ì„¸ê¸ˆ / íšŒê³„"],["brand","Brand / Domain","ë¸Œëžœë“œ / ë„ë©”ì¸"],["suppliers","Suppliers","ê³µê¸‰ì—…ì²´"],["budget","Budget","ì˜ˆì‚°"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    healthcare: [["clinic","Clinic / Hospital","ë³‘ì› / í´ë¦¬ë‹‰"],["appointment","Appointment Prep","ì˜ˆì•½ ì¤€ë¹„"],["documents","Documents","ì„œë¥˜"],["cost","Cost Estimate","ì˜ˆìƒ ë¹„ìš©"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    finance: [["loan_options","Loan Options","ëŒ€ì¶œ ì˜µì…˜"],["rates","Rates","ê¸ˆë¦¬"],["documents","Documents","ì„œë¥˜"],["risks","Risks","ë¦¬ìŠ¤í¬"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    career: [["targets","Job Targets","ì±„ìš© ëª©í‘œ"],["resume","Resume","ì´ë ¥ì„œ"],["interview","Interview Prep","ë©´ì ‘ ì¤€ë¹„"],["recruiters","Recruiters","ë¦¬í¬ë£¨í„°"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    lifestyle: [["vendors","Vendors","ì—…ì²´"],["timeline","Timeline","ì¼ì •"],["budget","Budget","ì˜ˆì‚°"],["reservations","Reservations","ì˜ˆì•½"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]],
    general_mission: [["mission_plan","Mission Plan","ë¯¸ì…˜ í”Œëžœ"],["options","Options","ì„ íƒì§€"],["budget","Budget","ì˜ˆì‚°"],["risks","Risks","ë¦¬ìŠ¤í¬"],["checklist","Checklist","ì²´í¬ë¦¬ìŠ¤íŠ¸"]]
  };

  return (map[type] || map.general_mission).map(([id, en, ko]) => ({
    id,
    title: activeLanguage === "ko" ? ko : en,
    status: "prepared",
    priority: "Balanced",
    removed: false,
    editable: true,
    removable: true,
    replaceable: true,
    expandable: true,
    approved: false,
    items: []
  }));
};

const buildProviderResults = (providers) => {
  return providers.map((provider) => ({
    provider: provider.provider,
    category: provider.category,
    sourceStatus: provider.sourceStatus,
    liveData: provider.liveData,
    requiresKey: provider.requiresKey,
    requiresPartnerAccess: provider.requiresPartnerAccess,
    items: [],
    error: null
  }));
};

const buildMissionObject = (mission) => {
  const cleanMission = normalizeMission(mission);
  const detectedLanguage = detectInputLanguage(cleanMission);

  if (supportedLanguages.includes(detectedLanguage)) {
    activeLanguage = detectedLanguage;
    localStorage.setItem(STORAGE_KEYS.language, activeLanguage);
  }

  const type = classifyMission(cleanMission);
  const country = detectCountry(cleanMission, type);
  const theme = root.getAttribute("data-theme") || "light";
  const providers = providerCatalog[type] || providerCatalog.general_mission;
  const isTutorMission = type === "tutoring" || (type === "career" && /tutor|teacher|lesson|ì„ ìƒë‹˜|íŠœí„°|ê³¼ì™¸|ìˆ˜ì—…/i.test(cleanMission));
  const tutorSteps = [
    ["tutors", "Tutor shortlist", "íŠœí„° í›„ë³´"],
    ["style", "Teaching style", "ìˆ˜ì—… ë°©ì‹"],
    ["format", "Online / Offline", "ì˜¨ë¼ì¸ / ì˜¤í”„ë¼ì¸"],
    ["experience", "Experience", "ê²½ë ¥"],
    ["price", "Price", "ê°€ê²©"],
    ["languages", "Languages", "ì‚¬ìš© ì–¸ì–´"],
    ["availability", "Availability", "ê°€ëŠ¥ ì‹œê°„"],
    ["questions", "Interview questions", "ì¸í„°ë·° ì§ˆë¬¸"],
    ["trial", "Trial lesson", "ì²´í—˜ ìˆ˜ì—…"]
  ];
  const tutorCards = tutorSteps.map(([id, en, ko]) => ({
    id,
    title: activeLanguage === "ko" ? ko : en,
    status: "prepared",
    priority: "Balanced",
    removed: false,
    editable: true,
    removable: true,
    replaceable: true,
    expandable: true,
    approved: false,
    items: []
  }));
  const preparedTutorSteps = tutorSteps.map(([id, en, ko], index) => ({
    id,
    title: activeLanguage === "ko" ? `${ko} ì¤€ë¹„ ì™„ë£Œ` : `${en} prepared`,
    order: index + 1,
    status: "prepared",
    editable: true,
    removable: true,
    approved: false
  }));

  return {
    id: createMissionId(type),
    version: KASTIZ_ONE_VERSION,
    rawInput: cleanMission,
    originalMission: cleanMission,
    mission: cleanMission,
    slug: createMissionSlug(cleanMission),
    type,
    subtype: isTutorMission ? "tutor_search" : detectSubtype(type),
    language: activeLanguage,
    theme,
    country,
    countryProfile: country ? countryProfiles[country] || null : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "mission_created",
    approvalRequired: true,
    intent: buildIntent(type),
    assumptions: buildAssumptions(type, country),
    providers,
    providerResults: buildProviderResults(providers),
    steps: isTutorMission ? preparedTutorSteps : buildSteps(type),
    recommendations: buildRecommendations(type),
    budget: buildBudget(type),
    risks: buildRisks(type),
    cards: isTutorMission ? tutorCards : buildCards(type),
    priority: "Balanced",
    approvalProtection: {
      required: true,
      message: activeLanguage === "ko" ? approvalProtectionMessages.ko : approvalProtectionMessages.en
    },
    executionSimulation: {
      status: "not_started",
      messages: activeLanguage === "ko"
        ? ["ì„ íƒí•œ ë‹¨ê³„ë¥¼ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ìµœì¢… ìš”êµ¬ì‚¬í•­ì„ í™•ì¸í•˜ê³  ìžˆì–´ìš”...", "ì œê³µìž ì‹¤í–‰ í•­ëª©ì„ ì¤€ë¹„í•˜ê³  ìžˆì–´ìš”...", "ìŠ¹ì¸ ìš”ì•½ì„ ë§Œë“¤ê³  ìžˆì–´ìš”...", "ì‹¤ì œ ì‹¤í–‰ ì¤€ë¹„ê°€ ì™„ë£Œë˜ì—ˆìŠµë‹ˆë‹¤."]
        : ["Preparing selected steps...", "Checking final requirements...", "Preparing provider actions...", "Creating approval summary...", "Ready for real-world execution."],
      finalMessage: "Your future is now in motion.\\nâ€” ONE â€”"
    }
  };
};

const detectDestination = (mission, countryProfile = null) => {
  const text = mission.toLowerCase();

  const matched = destinationPatterns.find((destination) => {
    return destination.aliases.some((alias) => text.includes(alias.toLowerCase()));
  });

  if (matched) {
    return matched;
  }

  if (countryProfile) {
    return {
      destination: countryProfile.name,
      destinationKo: countryProfile.nameKo,
      city: countryProfile.capital,
      cityKo: countryProfile.capitalKo,
      aliases: []
    };
  }

  return {
    destination: "Destination to confirm",
    destinationKo: "í™•ì¸ì´ í•„ìš”í•œ ëª©ì ì§€",
    city: "City to confirm",
    cityKo: "í™•ì¸ì´ í•„ìš”í•œ ë„ì‹œ",
    aliases: []
  };
};

const detectDurationDays = (mission) => {
  const englishMatch = mission.match(/(\d+)\s*(day|days)/i);
  const koreanMatch = mission.match(/(\d+)\s*(ì¼|ë°•)/);

  if (englishMatch) {
    return Number(englishMatch[1]);
  }

  if (koreanMatch) {
    return Number(koreanMatch[1]);
  }

  return 7;
};

const detectDepartureCountry = () => {
  const locale = navigator.language || "en";
  const region = locale.includes("-") ? locale.split("-").pop().toUpperCase() : "";

  return {
    code: region || "UNKNOWN",
    name: countryNamesByRegion[region] || getTranslation("unknownLocation")
  };
};

const detectTripType = (mission) => {
  const text = normalizeForDetection(mission);
  const oneWayKeywords = [
    "one way", "one-way", "migrate", "migration", "immigrate", "immigration",
    "relocate", "relocation", "moving permanently", "permanent move",
    "íŽ¸ë„", "ì´ë¯¼", "ì´ì£¼", "ì˜êµ¬ ì´ì£¼"
  ];

  return oneWayKeywords.some((keyword) => text.includes(keyword)) ? "one_way" : "round_trip";
};

const buildTravelMission = (mission) => {
  const baseMission = buildMissionObject(mission);
  const destination = detectDestination(mission, baseMission.countryProfile);
  const durationDays = detectDurationDays(mission);
  const tripType = detectTripType(mission);
  const departureCountry = detectDepartureCountry();
  const language = activeLanguage;
  const theme = root.getAttribute("data-theme") || "light";

  return {
    ...baseMission,
    type: "travel",
    subtype: "trip_planning",
    status: "mission_created",
    originalMission: mission,
    mission,
    rawInput: mission,
    slug: createMissionSlug(mission),
    language,
    theme,
    updatedAt: new Date().toISOString(),
    approvalRequired: true,
    approvalProtection: {
      en: approvalProtectionMessages.en,
      ko: approvalProtectionMessages.ko
    },
    destination: {
      country: destination.destination,
      countryKo: destination.destinationKo,
      city: destination.city,
      cityKo: destination.cityKo,
      latitude: destination.latitude ?? baseMission.countryProfile?.latitude,
      longitude: destination.longitude ?? baseMission.countryProfile?.longitude
    },
    durationDays,
    tripType,
    departureCountry,
    apiReadiness: {
      flights: {
        providers: ["Amadeus API", "Skyscanner API", "Google Flights alternatives"],
        status: "mock-ready"
      },
      hotels: {
        providers: ["Booking.com Partner API", "Expedia Rapid API", "Agoda Partner API"],
        status: "mock-ready"
      },
      restaurants: {
        providers: ["Google Places API", "Naver Places", "Tabelog", "OpenTable"],
        status: "mock-ready"
      },
      weather: {
        providers: ["Open-Meteo API"],
        status: "provider_ready"
      },
      currency: {
        providers: ["Frankfurter API"],
        status: "provider_ready"
      },
      maps: {
        providers: ["Google Maps", "Naver Maps"],
        status: "provider_ready"
      },
      visa: {
        providers: ["Government embassy data", "Timatic-style API"],
        status: "provider_ready"
      }
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
      status: "provider_ready",
      message: {
        en: "Weather will be checked with a live weather API before execution.",
        ko: "ì‹¤í–‰ ì „ ì‹¤ì‹œê°„ ë‚ ì”¨ APIë¡œ ë‚ ì”¨ë¥¼ í™•ì¸í•©ë‹ˆë‹¤."
      },
      providerCandidates: ["Open-Meteo API"]
    },
    exchangeRate: {
      status: "provider_ready",
      from: "KRW",
      to: "JPY",
      message: {
        en: "Exchange rate will be checked with a live currency API before execution.",
        ko: "ì‹¤í–‰ ì „ ì‹¤ì‹œê°„ í™˜ìœ¨ APIë¡œ í™˜ìœ¨ì„ í™•ì¸í•©ë‹ˆë‹¤."
      },
      providerCandidates: ["Frankfurter API"]
    },
    visa: {
      status: "requires-verification",
      message: {
        en: "For many travelers visa-free entry may apply, but ONE must verify before execution.",
        ko: "ë§Žì€ ì—¬í–‰ìžì—ê²Œ ë¬´ë¹„ìž ìž…êµ­ì´ ê°€ëŠ¥í•  ìˆ˜ ìžˆì§€ë§Œ, ì‹¤í–‰ ì „ ONEì´ ë°˜ë“œì‹œ í™•ì¸í•´ì•¼ í•©ë‹ˆë‹¤."
      },
      providerCandidates: ["Government embassy data", "Timatic-style API"]
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
    ]
  };
};

const buildGeneralMission = (mission) => {
  const base = buildMissionObject(mission);
  try {
    const output = createHOSKernel().run({
      mission,
      language: activeLanguage,
      currentLocation: activeLanguage === "ko" ? "ì„œìš¸" : "Seoul"
    });
    const plan = output.resolutionPlan;
    return {
      ...base,
      type: plan?.domain || output.classification?.providerType || base.type,
      domain: plan?.domain || output.classification?.providerType || base.type,
      missionType: plan?.missionType || output.classification?.providerType || base.type,
      classification: output.classification,
      humanReasoning: output.humanReasoning,
      missionIntelligence: output.missionIntelligence,
      resolutionPlan: plan
    };
  } catch {
    return base;
  }
};

const saveMission = (mission, schedule = null) => {
  const cleanMission = normalizeMission(mission);
  const classifiedType = classifyMission(cleanMission);
  const destinationTravelIntent = Boolean(pendingDetectedDestination) && previewTravelIntent(cleanMission);
  const missionType = pendingFollowUp?.type === "travel" || classifiedType === "travel" || destinationTravelIntent
    ? "travel"
    : pendingFollowUp?.type || classifiedType;
  const payload = missionType === "travel"
    ? buildTravelMission(cleanMission)
    : buildGeneralMission(cleanMission);

  payload.aiMode = aiModeEnabled;
  payload.schedule = schedule;
  payload.followUp = pendingFollowUp;
  payload.missionSeed = payload.missionSeed || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (payload.type === "travel" && schedule) {
    const travelerCount = normalizeScheduleCount(schedule.travelerCount || schedule.travelers || schedule.adults, 1);
    const roomCount = normalizeScheduleCount(schedule.rooms || schedule.roomCount, Math.max(1, Math.ceil(travelerCount / 2)));
    const originAirport = schedule.originAirport || schedule.departureAirport || "ICN";
    payload.travelerCount = travelerCount;
    payload.travelers = travelerCount;
    payload.rooms = roomCount;
    payload.roomCount = roomCount;
    payload.originAirport = originAirport;
    payload.departureAirport = originAirport;
    payload.groupType = travelerCount <= 1 ? "solo" : travelerCount === 2 ? "couple" : travelerCount >= 4 ? "family_or_group" : "small_group";
    payload.followUp = {
      ...(pendingFollowUp || { type: "travel" }),
      type: "travel",
      answers: {
        ...(pendingFollowUp?.answers || {}),
        adults: travelerCount,
        travelers: travelerCount,
        rooms: roomCount,
        roomCount,
        originAirport,
        departureAirport: originAirport
      }
    };
  }
  payload.interfaceLanguage = activeLanguage;
  payload.missionLanguage = detectMissionLanguage(cleanMission).value;
  const selectedDestination = pendingFollowUp?.answers || (pendingDetectedDestination ? {
    destination: pendingDetectedDestination.city,
    destinationCountry: pendingDetectedDestination.country,
    destinationCountryCode: pendingDetectedDestination.countryCode || pendingDetectedDestination.code,
    destinationCurrency: pendingDetectedDestination.currency,
    destinationContinent: pendingDetectedDestination.continent,
    destinationLatitude: pendingDetectedDestination.latitude,
    destinationLongitude: pendingDetectedDestination.longitude,
    destinationState: pendingDetectedDestination.state
  } : null);
  if (payload.type === "travel" && selectedDestination?.destination) {
    payload.destination = {
      ...payload.destination,
      country: selectedDestination.destinationCountry || payload.destination?.country,
      countryKo: selectedDestination.destinationCountry || payload.destination?.countryKo,
      city: selectedDestination.destination,
      cityKo: selectedDestination.destination,
      continent: selectedDestination.destinationContinent || "",
      state: selectedDestination.destinationState || "",
      countryCode: selectedDestination.destinationCountryCode || "",
      latitude: Number(selectedDestination.destinationLatitude) || undefined,
      longitude: Number(selectedDestination.destinationLongitude) || undefined
    };
    if (selectedDestination.destinationCountryCode) {
      payload.country = selectedDestination.destinationCountryCode;
      const currencyByCountry = { JP: "JPY", ES: "EUR", US: "USD", CA: "CAD", FR: "EUR", IT: "EUR", GB: "GBP", DE: "EUR", AU: "AUD", TH: "THB", VN: "VND", CN: "CNY", KR: "KRW", CO: "COP", MX: "MXN", BZ: "BZD", CR: "CRC", SV: "USD", GT: "GTQ", HN: "HNL", NI: "NIO", PA: "PAB", SG: "SGD", AR: "ARS", BR: "BRL", PE: "PEN", CL: "CLP", PT: "EUR", NL: "EUR", GR: "EUR", AE: "AED", IN: "INR", ID: "IDR", MY: "MYR", NZ: "NZD", ZA: "ZAR", EG: "EGP", MA: "MAD", SE: "SEK", NO: "NOK", DK: "DKK", FI: "EUR", IS: "ISK", CH: "CHF", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN", HR: "EUR", BE: "EUR", AT: "EUR", IE: "EUR" };
      payload.countryProfile = countryProfiles[selectedDestination.destinationCountryCode] || {
        code: selectedDestination.destinationCountryCode,
        name: selectedDestination.destinationCountry,
        nameKo: selectedDestination.destinationCountry,
        currency: selectedDestination.destinationCurrency || currencyByCountry[selectedDestination.destinationCountryCode] || "USD",
        capital: selectedDestination.destination,
        capitalKo: selectedDestination.destination,
        continent: selectedDestination.destinationContinent || "",
        latitude: Number(selectedDestination.destinationLatitude) || undefined,
        longitude: Number(selectedDestination.destinationLongitude) || undefined
      };
      payload.exchangeRate = {
        ...payload.exchangeRate,
        to: selectedDestination.destinationCurrency || currencyByCountry[selectedDestination.destinationCountryCode] || "USD"
      };
    } else if (selectedDestination.destinationCountry) {
      payload.country = "";
      payload.countryProfile = {
        code: "",
        name: selectedDestination.destinationCountry,
        nameKo: selectedDestination.destinationCountry,
        currency: selectedDestination.destinationCurrency || "USD",
        capital: selectedDestination.destination,
        capitalKo: selectedDestination.destination
      };
      payload.exchangeRate = { ...payload.exchangeRate, to: selectedDestination.destinationCurrency || "USD" };
    }
  }
  payload.presentationMode = isPresentationMode();
  if (schedule?.startDate && schedule?.endDate) {
    payload.durationDays = Math.max(1, Math.round((new Date(`${schedule.endDate}T00:00:00`) - new Date(`${schedule.startDate}T00:00:00`)) / 86400000) + 1);
  }
  const profileContext = getProfileForMission(payload.type);
  payload.userPreferences = profileContext.enabled
    ? Object.fromEntries(Object.entries(profileContext.category).map(([key, record]) => [key, record.value]))
    : null;
  payload.attachments = selectedImageFiles.map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified
  }));

  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(payload));

  if (payload.type === "travel") {
    sessionStorage.setItem(STORAGE_KEYS.travelMission, JSON.stringify(payload));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.travelMission);
  }

  sessionStorage.removeItem(STORAGE_KEYS.results);
  sessionStorage.removeItem(STORAGE_KEYS.enrichedMission);
  pendingDetectedDestination = null;
  sessionStorage.removeItem(STORAGE_KEYS.executionState);

  return payload;
};

const startMission = (mission, schedule = null) => {
  const cleanMission = normalizeMission(mission);

  if (!cleanMission) {
    missionInput.focus();
    return;
  }

  const savedMission = saveMission(cleanMission, schedule);
  trackEvent("mission_started", {
    mission_type: savedMission.type,
    language: savedMission.language,
    page: "home",
    schedule_used: Boolean(schedule?.startDate && schedule?.endDate)
  });
  body.classList.add("is-transitioning");

  window.setTimeout(() => {
    window.location.href = "loading.html";
  }, 360);
};

const destinationFlag = (code = "") => String(code).toUpperCase().replace(/[A-Z]/g, (letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)));
const MISSION_AMBIGUITIES = Object.freeze([
  { aliases: ["paris", "parÃ­s", "\uD30C\uB9AC"], places: [
    { city: "Paris", state: "ÃŽle-de-France", country: "France", code: "FR", continent: "Europe", currency: "EUR", latitude: 48.8566, longitude: 2.3522 },
    { city: "Paris", state: "Texas", country: "United States", code: "US", continent: "North America", currency: "USD", latitude: 33.6609, longitude: -95.5555 },
    { city: "Paris", state: "Ontario", country: "Canada", code: "CA", continent: "North America", currency: "CAD", latitude: 43.194, longitude: -80.3845 }
  ]},
  { aliases: ["london", "londres", "\uB7F0\uB358"], places: [
    { city: "London", state: "England", country: "United Kingdom", code: "GB", continent: "Europe", currency: "GBP", latitude: 51.5074, longitude: -0.1278 },
    { city: "London", state: "Ontario", country: "Canada", code: "CA", continent: "North America", currency: "CAD", latitude: 42.9849, longitude: -81.2453 }
  ]},
  { aliases: ["surat", "\uC218\uB77C\uD2B8"], places: [
    { city: "Surat", state: "Gujarat", country: "India", code: "IN", continent: "Asia", currency: "INR", latitude: 21.1702, longitude: 72.8311 },
    { city: "Surat", state: "Puy-de-DÃ´me", country: "France", code: "FR", continent: "Europe", currency: "EUR", latitude: 45.965, longitude: 3.255 }
  ]},
  { aliases: ["santiago", "\uC0B0\uD2F0\uC544\uACE0"], places: [
    { city: "Santiago", state: "Santiago Metropolitan Region", country: "Chile", code: "CL", continent: "South America", currency: "CLP", latitude: -33.4489, longitude: -70.6693 },
    { city: "Santiago de Compostela", state: "Galicia", country: "Spain", code: "ES", continent: "Europe", currency: "EUR", latitude: 42.8782, longitude: -8.5448 },
    { city: "Santiago de los Caballeros", state: "Santiago", country: "Dominican Republic", code: "DO", continent: "North America", currency: "DOP", latitude: 19.4517, longitude: -70.697 }
  ]}
]);
const missionAmbiguityMatches = (mission) => {
  const shared = ambiguousWorldDestinationMatches(mission);
  if (shared.length > 1) return shared.map((place) => ({
    city: place.city,
    state: place.state,
    country: place.country,
    countryKo: place.country,
    countryEs: place.country,
    code: place.countryCode,
    continent: place.continent,
    currency: place.currency,
    latitude: place.latitude,
    longitude: place.longitude,
    description: [place.placeType || "Destination", place.state, place.country].filter(Boolean).join(" Â· ")
  }));
  const normalized = String(mission || "").normalize("NFKC").toLocaleLowerCase();
  const entry = MISSION_AMBIGUITIES.find(({ aliases }) => aliases.some((alias) => normalized.includes(alias)));
  if (!entry) return [];
  const explicitlyQualified = entry.places.some((place) => [place.country, place.state].filter(Boolean).some((qualifier) => normalized.includes(qualifier.toLocaleLowerCase())));
  return explicitlyQualified ? [] : entry.places;
};
const destinationDisplayName = (place) => {
  const country = activeLanguage === "ko" ? (place.countryKo || place.country) : activeLanguage === "es" ? (place.countryEs || place.country) : place.country;
  return [place.city, place.state, country].filter(Boolean).join(", ");
};
const openDestinationChoice = (mission, schedule) => {
  let dialog = document.getElementById("destinationChoiceModal");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "destinationChoiceModal";
    dialog.className = "schedule-modal destination-choice-modal";
    document.body.append(dialog);
  }
  const heading = activeLanguage === "ko" ? "어느 목적지를 말씀하셨나요?" : activeLanguage === "es" ? "¿Qué destino quisiste decir?" : "Which destination did you mean?";
  const detail = activeLanguage === "ko" ? "계획을 시작하기 전에 정확한 위치를 선택하세요." : activeLanguage === "es" ? "Elige la ubicación exacta antes de preparar el plan." : "Choose the exact location before ONE prepares the plan.";
  dialog.replaceChildren();
  const card = document.createElement("div");
  card.className = "schedule-modal-card destination-choice-card";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "schedule-modal-close";
  close.setAttribute("aria-label", "Close");
  close.textContent = "×";
  const kicker = document.createElement("p");
  kicker.className = "login-modal-kicker";
  kicker.textContent = "KASTIZ ONE";
  const title = document.createElement("h2");
  title.textContent = heading;
  const summary = document.createElement("p");
  summary.textContent = detail;
  const list = document.createElement("div");
  list.className = "destination-choice-list";
  pendingDestinationMatches.forEach((place, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.destinationIndex = String(index);
    const strong = document.createElement("strong");
    strong.textContent = `${destinationFlag(place.code)} ${destinationDisplayName(place)}`;
    button.append(strong);
    if (place.description) {
      const span = document.createElement("span");
      span.textContent = place.description;
      button.append(span);
    }
    button.addEventListener("click", () => {
      const selectedPlace = pendingDestinationMatches[Number(button.dataset.destinationIndex)];
      if (!selectedPlace) return;
      pendingDetectedDestination = {
        id: String(selectedPlace.city || selectedPlace.country || "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-"),
        city: selectedPlace.city,
        country: selectedPlace.country,
        countryCode: selectedPlace.code || selectedPlace.countryCode,
        continent: selectedPlace.continent,
        currency: selectedPlace.currency,
        state: selectedPlace.state,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude
      };
      pendingDestinationMatches = [];
      dialog.close();
      startMission(mission, schedule);
    });
    list.append(button);
  });
  close.addEventListener("click", () => dialog.close());
  card.append(close, kicker, title, summary, list);
  dialog.append(card);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
};

const syncInputState = () => {
  missionForm.querySelector(".search-box").classList.toggle("has-value", missionInput.value.trim().length > 0);

  if (missionInput.value.trim().length > 0) {
    missionInput.classList.add("has-text");
  } else {
    missionInput.classList.remove("has-text");
  }
};

const announceMissionTool = (english, korean) => {
  if (missionToolStatus) {
    missionToolStatus.textContent = activeLanguage === "ko" ? korean : english;
  }
};

const getCurrentLanguage = () => {
  const documentLanguage = document.documentElement.lang?.toLowerCase();
  const savedLanguage = localStorage.getItem(STORAGE_KEYS.language)?.toLowerCase();

  if (documentLanguage?.startsWith("ko") || savedLanguage?.startsWith("ko")) return "ko";
  return "en";
};

const getPreferredVoice = (language) => {
  const languagePrefix = language === "ko" ? "ko" : "en";
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix));
};

const speakWelcomeMessage = async () => {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    announceMissionTool("Voice is not supported in this browser.", "ì´ ë¸Œë¼ìš°ì €ì—ì„œëŠ” ìŒì„±ì„ ì§€ì›í•˜ì§€ ì•ŠìŠµë‹ˆë‹¤.");
    return;
  }

  window.speechSynthesis.cancel();
  const currentLanguage = getCurrentLanguage();
  const isKorean = currentLanguage === "ko";
  const message = new SpeechSynthesisUtterance(
    isKorean ? "\uC624\uB298 \uC5B4\uB5BB\uAC8C \uB3C4\uC640\uB4DC\uB9B4\uAE4C\uC694?" : "How can I make your day?"
  );
  message.lang = isKorean ? "ko-KR" : "en-US";

  let preferredVoice = getPreferredVoice(currentLanguage);

  if (!preferredVoice && window.speechSynthesis.getVoices().length === 0) {
    await new Promise((resolve) => {
      const timer = window.setTimeout(resolve, 800);
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        window.clearTimeout(timer);
        resolve();
      }, { once: true });
    });
    preferredVoice = getPreferredVoice(currentLanguage);
  }

  if (preferredVoice) {
    message.voice = preferredVoice;
  }
  message.rate = 0.96;
  message.pitch = 1;
  message.onstart = () => microphoneButton?.classList.add("is-active");
  message.onend = () => microphoneButton?.classList.remove("is-active");
  message.onerror = () => microphoneButton?.classList.remove("is-active");
  window.speechSynthesis.speak(message);
  announceMissionTool("ONE is speaking.", "ONEì´ ìŒì„±ìœ¼ë¡œ ì•ˆë‚´í•©ë‹ˆë‹¤.");
};

const closeDropdowns = () => {
  themeDropdown.classList.remove("is-open");
  languageDropdown.classList.remove("is-open");
  themeControl.setAttribute("aria-expanded", "false");
  languageControl.setAttribute("aria-expanded", "false");
};

const toggleDropdown = (dropdown, control) => {
  const isOpen = dropdown.classList.contains("is-open");

  closeDropdowns();

  if (!isOpen) {
    dropdown.classList.add("is-open");
    control.setAttribute("aria-expanded", "true");
  }
};

themeControl.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleDropdown(themeDropdown, themeControl);
});

languageControl.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleDropdown(languageDropdown, languageControl);
});

document.querySelectorAll("[data-theme-option]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const theme = button.getAttribute("data-theme-option");
    setTheme(theme);
    trackEvent("theme_selection", { page: "home", language: getInitialLanguage(), status: theme });
    closeDropdowns();
  });
});

document.querySelectorAll("[data-language-option]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const language = button.getAttribute("data-language-option");
    setLanguage(language);
    trackEvent("language_selection", { page: "home", language });
    closeDropdowns();
  });
});

document.addEventListener("click", closeDropdowns);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDropdowns();
  }
});

missionInput.addEventListener("input", syncInputState);
missionInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing || event.repeat) return;
  event.preventDefault();
  missionForm.requestSubmit();
});
const moveEmptyCaretToStart = () => {
  if (!missionInput.value && typeof missionInput.setSelectionRange === "function") {
    missionInput.setSelectionRange(0, 0);
  }
};

missionInput.addEventListener("focus", () => {
  missionForm.querySelector(".search-box").classList.add("is-input-focused");
  window.requestAnimationFrame(moveEmptyCaretToStart);
  trackEvent("search_focused", { page: "home", language: activeLanguage });
});
missionInput.addEventListener("blur", () => {
  missionForm.querySelector(".search-box").classList.remove("is-input-focused");
});
missionInput.addEventListener("click", () => {
  if (!missionInput.value) {
    window.requestAnimationFrame(moveEmptyCaretToStart);
  }
});

aiModeButton?.addEventListener("click", () => {
  aiModeEnabled = !aiModeEnabled;
  aiModeButton.setAttribute("aria-pressed", String(aiModeEnabled));
  announceMissionTool(
    aiModeEnabled ? "AI assistant mode is on." : "AI assistant mode is off.",
    aiModeEnabled ? "AI ì–´ì‹œìŠ¤í„´íŠ¸ ëª¨ë“œê°€ ì¼œì¡ŒìŠµë‹ˆë‹¤." : "AI ì–´ì‹œìŠ¤í„´íŠ¸ ëª¨ë“œê°€ êº¼ì¡ŒìŠµë‹ˆë‹¤."
  );
  missionInput.focus();
});

microphoneButton?.addEventListener("click", speakWelcomeMessage);

imageUploadButton?.addEventListener("click", () => imageUploadInput?.click());
imageUploadInput?.addEventListener("change", async () => {
  selectedImageFiles = [...(imageUploadInput.files || [])];
  imageUploadButton.classList.toggle("is-active", selectedImageFiles.length > 0);
  const detectedReference = await detectPrototypeReferenceInImage(selectedImageFiles[0]);
  if (detectedReference) {
    if (/^https:\/\//i.test(detectedReference)) {
      location.href = detectedReference;
      return;
    }
    missionInput.value = detectedReference;
    syncInputState();
    if (reopenPrototypeMission(detectedReference)) return;
    announceMissionTool("Reference detected, but it is not saved in this browser.", "ì°¸ì¡° ë²ˆí˜¸ë¥¼ ì°¾ì•˜ì§€ë§Œ ì´ ë¸Œë¼ìš°ì €ì— ì €ìž¥ëœ ê¸°ë¡ì´ ì—†ìŠµë‹ˆë‹¤.");
    return;
  }
  announceMissionTool(
    typeof window.BarcodeDetector === "function" || typeof window.TextDetector === "function" ? (selectedImageFiles.length === 1 ? "1 image attached. No saved reference or QR code was detected." : `${selectedImageFiles.length} images attached.`) : "Image attached. Copy the ONE-DEMO reference into the search box for lookup.",
    typeof window.BarcodeDetector === "function" || typeof window.TextDetector === "function" ? `ì´ë¯¸ì§€ ${selectedImageFiles.length}ê°œê°€ ì²¨ë¶€ë˜ì—ˆìŠµë‹ˆë‹¤. ì €ìž¥ëœ ì°¸ì¡° ë²ˆí˜¸ ë˜ëŠ” QR ì½”ë“œë¥¼ ì°¾ì§€ ëª»í–ˆìŠµë‹ˆë‹¤.` : "ì´ë¯¸ì§€ê°€ ì²¨ë¶€ë˜ì—ˆìŠµë‹ˆë‹¤. ì¡°íšŒí•˜ë ¤ë©´ ONE-DEMO ì°¸ì¡° ë²ˆí˜¸ë¥¼ ê²€ìƒ‰ì°½ì— ìž…ë ¥í•˜ì„¸ìš”."
  );
});

loginButton?.addEventListener("click", () => {
  loginNotifyStatus.textContent = "";
  if (typeof loginModal.showModal === "function") loginModal.showModal();
  else loginModal.setAttribute("open", "");
});

loginModalClose?.addEventListener("click", () => loginModal.close());
loginModal?.addEventListener("click", (event) => {
  if (event.target === loginModal) loginModal.close();
});
loginNotifyButton?.addEventListener("click", () => {
  loginNotifyStatus.textContent = getTranslation("notifyConfirmed");
  loginNotifyButton.disabled = true;
});

const toLocalIsoDate = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const normalizeScheduleCount = (value, fallback = 1) => {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.round(count) : fallback;
};

const scheduleAirportLabel = (value) => {
  const labels = {
    ICN: activeLanguage === "ko" ? "ì¸ì²œê³µí•­" : "Incheon",
    GMP: activeLanguage === "ko" ? "ê¹€í¬ê³µí•­" : "Gimpo",
    current: activeLanguage === "ko" ? "í˜„ìž¬ ìœ„ì¹˜ ê¸°ì¤€" : activeLanguage === "es" ? "UbicaciÃ³n actual" : "Current location",
    unsure: activeLanguage === "ko" ? "ë‚˜ì¤‘ì— í™•ì¸" : activeLanguage === "es" ? "Confirmar despuÃ©s" : "Confirm later"
  };
  return labels[value] || labels.ICN;
};

const collectScheduleDetails = () => ({
  startDate: scheduleStartDate.value,
  endDate: scheduleEndDate.value,
  timePreference: scheduleTimePreference.value,
  travelerCount: normalizeScheduleCount(scheduleTravelerCount?.value, 1),
  travelers: normalizeScheduleCount(scheduleTravelerCount?.value, 1),
  adults: normalizeScheduleCount(scheduleTravelerCount?.value, 1),
  rooms: normalizeScheduleCount(scheduleRoomCount?.value, 1),
  roomCount: normalizeScheduleCount(scheduleRoomCount?.value, 1),
  departureAirport: scheduleDepartureAirport?.value || "ICN",
  originAirport: scheduleDepartureAirport?.value || "ICN"
});

const updateScheduleSummary = () => {
  const start = scheduleStartDate.value;
  const end = scheduleEndDate.value;
  if (!start || !end) return;
  scheduleEndDate.min = start;
  if (end < start) scheduleEndDate.value = start;
  const finalEnd = scheduleEndDate.value;
  if (scheduleStartDateValue) scheduleStartDateValue.textContent = start;
  if (scheduleEndDateValue) scheduleEndDateValue.textContent = finalEnd;
  const startLabel = new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : "en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }).format(new Date(`${start}T00:00:00`));
  const endLabel = new Intl.DateTimeFormat(activeLanguage === "ko" ? "ko-KR" : "en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }).format(new Date(`${finalEnd}T00:00:00`));
  const timeLabel = scheduleTimePreference.options[scheduleTimePreference.selectedIndex]?.textContent || "";
  const outgoingLabel = activeLanguage === "ko" ? "ì¶œêµ­ ë‚ ì§œ" : "Outgoing date";
  const returningLabel = activeLanguage === "ko" ? "ê·€êµ­ ë‚ ì§œ" : "Returning date";
  const timeHeading = activeLanguage === "ko" ? "ì‹œê°„" : "Time";
  const details = collectScheduleDetails();
  scheduleSummary.innerHTML = `
    <span class="schedule-summary-row"><strong>${outgoingLabel}</strong><span>${startLabel}</span></span>
    <span class="schedule-summary-row"><strong>${returningLabel}</strong><span>${endLabel}</span></span>
    <span class="schedule-summary-row"><strong>${timeHeading}</strong><span>${timeLabel}</span></span>
    <span class="schedule-summary-row"><strong>${getTranslation("travelerCount")}</strong><span>${details.travelerCount}</span></span>
    <span class="schedule-summary-row"><strong>${getTranslation("roomCount")}</strong><span>${details.rooms}</span></span>
    <span class="schedule-summary-row"><strong>${getTranslation("departureAirport")}</strong><span>${scheduleAirportLabel(details.departureAirport)}</span></span>
  `;
  scheduleSummary.classList.add("has-valid-range");
};

const openScheduleModal = (mission) => {
  pendingMissionText = normalizeMission(mission);
  if (!pendingMissionText) { missionInput.focus(); return; }
  const today = new Date();
  const defaultEnd = new Date(today);
  defaultEnd.setDate(defaultEnd.getDate() + 6);
  scheduleStartDate.min = toLocalIsoDate(today);
  scheduleStartDate.value = toLocalIsoDate(today);
  scheduleEndDate.min = scheduleStartDate.value;
  scheduleEndDate.value = toLocalIsoDate(defaultEnd);
  scheduleTimePreference.value = "any";
  if (scheduleTravelerCount) scheduleTravelerCount.value = "1";
  if (scheduleRoomCount) scheduleRoomCount.value = "1";
  if (scheduleDepartureAirport) scheduleDepartureAirport.value = "ICN";
  updateScheduleSummary();
  if (typeof scheduleModal.showModal === "function") scheduleModal.showModal();
  else scheduleModal.setAttribute("open", "");
};

scheduleStartDate?.addEventListener("change", updateScheduleSummary);
scheduleEndDate?.addEventListener("change", updateScheduleSummary);
scheduleTimePreference?.addEventListener("change", updateScheduleSummary);
scheduleTravelerCount?.addEventListener("change", updateScheduleSummary);
scheduleRoomCount?.addEventListener("change", updateScheduleSummary);
scheduleDepartureAirport?.addEventListener("change", updateScheduleSummary);
scheduleModalClose?.addEventListener("click", () => scheduleModal.close());
scheduleModal?.addEventListener("click", (event) => { if (event.target === scheduleModal) scheduleModal.close(); });
scheduleModal?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing || event.repeat) return;
  event.preventDefault();
  if (scheduleForm?.requestSubmit) scheduleForm.requestSubmit();
  else scheduleForm?.querySelector('[type="submit"]')?.click();
});
scheduleForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!scheduleForm.reportValidity()) return;
  const schedule = collectScheduleDetails();
  trackEvent("schedule_confirmed", {
    mission_type: detectMissionType(normalizeMission(pendingMissionText)),
    language: activeLanguage,
    page: "home",
    schedule_used: true
  });
  scheduleModal.close();
  if (pendingDestinationMatches.length > 1) {
    openDestinationChoice(pendingMissionText, schedule);
    return;
  }
  startMission(pendingMissionText, schedule);
});

missionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const mission = normalizeMission(missionInput.value);
  if (!mission) { missionInput.focus(); return; }
  missionInput.setCustomValidity("");
  const prototypeReference = mission.toUpperCase().match(/^ONE-DEMO-[A-Z0-9]{8}$/)?.[0];
  if (prototypeReference) {
    if (reopenPrototypeMission(prototypeReference)) return;
    missionInput.setCustomValidity(activeLanguage === "ko" ? "ì´ ë¸Œë¼ìš°ì €ì— ì €ìž¥ëœ í”„ë¡œí† íƒ€ìž… ì°¸ì¡° ë²ˆí˜¸ë¥¼ ì°¾ì„ ìˆ˜ ì—†ìŠµë‹ˆë‹¤." : "This prototype reference is not saved in this browser.");
    missionInput.reportValidity();
    return;
  }
  let type = classifyMission(mission);
  if (previewTravelIntent(mission)) type = "travel";
  pendingDestinationMatches = [];
  const previewDestination = resolvePreviewDestination(mission);
  pendingDetectedDestination = previewDestination || resolveWorldDestination(mission);
  if (type === "travel" || type === "general_mission") {
    const knownAmbiguityMatches = missionAmbiguityMatches(mission);
    const rawDestinationMatches = knownAmbiguityMatches.length
      ? knownAmbiguityMatches
      : await Promise.race([
        detectWorldwideTravelDestination(mission, activeLanguage).catch(() => []),
        new Promise((resolve) => setTimeout(() => resolve([]), 4200))
      ]);
    const previewMatch = previewDestination ? [{
      city: previewDestination.city,
      country: previewDestination.country,
      countryKo: previewDestination.country,
      countryEs: previewDestination.country,
      code: previewDestination.countryCode,
      continent: previewDestination.continent,
      currency: previewDestination.currency,
      latitude: previewDestination.latitude,
      longitude: previewDestination.longitude,
      description: "Curated preview destination"
    }] : [];
    const destinationMatches = dedupePreviewDestinations([...previewMatch, ...rawDestinationMatches]);
    if (destinationMatches.length) {
      pendingDestinationMatches = destinationMatches;
      const detected = destinationMatches[0];
      pendingDetectedDestination = {
        id: String(detected.city || detected.country || "").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-"),
        city: detected.city,
        country: detected.country,
        countryCode: detected.code,
        continent: detected.continent,
        currency: detected.currency,
        state: detected.state,
        latitude: detected.latitude,
        longitude: detected.longitude
      };
    }
    if (destinationMatches.length) type = "travel";
  }
  const startOneFirstPass = () => {
    pendingFollowUp = {
      type,
      answers: {},
      schedule: null,
      skipped: true,
      source: "one_first_pass"
    };
    startMission(mission, null);
  };
  ensureDisclosureAcknowledged({
    language: activeLanguage,
    restoreFocusTo: missionInput,
    onAcknowledge: () => {
      if (type === "travel") {
        pendingFollowUp = null;
        openScheduleModal(mission);
        return;
      }
      startOneFirstPass();
    },
    onCancel: () => { pendingFollowUp = null; missionInput.value = mission; syncInputState(); }
  });
});

const restartOneAnimation = () => {
  if (!oneLogoText) return;
  oneLogoText.classList.remove("is-animating");
  void oneLogoText.offsetWidth;
  window.requestAnimationFrame(() => oneLogoText.classList.add("is-animating"));
};

window.addEventListener("pageshow", () => {
  body.classList.remove("is-transitioning");
  restartOneAnimation();
});

window.KastizONE = {
  version: KASTIZ_ONE_VERSION,
  storageKeys: STORAGE_KEYS,
  missionTypes: universalMissionTypes,
  classifier: missionKeywordMap,
  providerCatalog,
  approvalProtection: approvalProtectionMessages,
  detectMissionType,
  buildMissionObject,
  buildTravelMission,
  buildGeneralMission,
  saveMission,
  setTheme,
  setLanguage
};

setTheme(getInitialTheme());
trackEvent("page_visit", { page: "home", language: getInitialLanguage() });
trackEvent("homepage_loaded", { page: "home", language: getInitialLanguage() });
setLanguage(getInitialLanguage());
syncInputState();
mountInvestorDemoHome({ language: getInitialLanguage() });

