import { trackEvent } from "../analytics.js";
import { classifyMission } from "../engine/mission-classification.js?v=20260716-2";
import { openMissionFollowUp } from "../ui/mission-followup.js?v=20260716-3";
import { ensureDisclosureAcknowledged } from "../ui/disclosure.js";
import { isPresentationMode } from "../engine/demo-missions.js";
import { getProfileForMission } from "../profile/profile-memory-engine.js";

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
const scheduleSummary = document.getElementById("scheduleSummary");
let pendingMissionText = "";
let pendingFollowUp = null;

const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  travelMission: "kastiz-one-travel-mission",
  results: "kastiz-one-results",
  enrichedMission: "kastiz-one-enriched-mission",
  executionState: "kastiz-one-execution-state"
};

const supportedLanguages = ["en", "ko"];
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
    morning: "Morning · 06:00–12:00",
    afternoon: "Afternoon · 12:00–17:00",
    evening: "Evening · 17:00–22:00",
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
      ko: "한국어"
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
    description: "Kastiz ONE은 현실의 미션을 완성합니다.",
    siteNavigation: "Kastiz ONE 내비게이션",
    preferences: "설정",
    themeLabel: "테마",
    languageLabel: "언어",
    account: "계정",
    upgrade: "업그레이드",
    login: "로그인",
    loginWelcome: "Kastiz ONE에 오신 것을 환영합니다",
    loginComingSoon: "계정 기능은 곧 제공됩니다.",
    loginPriority: "초기 사용자에게 우선 이용 기회를 드립니다.",
    joinEarlyAccess: "얼리 액세스 참여",
    requestInvitation: "초대 요청",
    contactSupport: "고객 지원 문의",
    notifyMe: "알림 신청",
    notifyConfirmed: "우선 알림 목록에 등록되었습니다.",
    scheduleTitle: "날짜와 시간을 선택하세요",
    scheduleHelp: "필요한 날짜 범위를 선택하세요. 시간은 선택 사항입니다.",
    startDate: "시작 날짜",
    endDate: "종료 날짜",
    timePreference: "선호 시간",
    anyTime: "시간 무관 / 선호 없음",
    morning: "오전 · 06:00–12:00",
    afternoon: "오후 · 12:00–17:00",
    evening: "저녁 · 17:00–22:00",
    confirmSchedule: "확인 후 계속",
    searchLabel: "미션 입력",
    searchDefault: "일본 여행 계획해줘",
    missionTools: "미션 도구",
    microphone: "마이크 사용",
    uploadImage: "이미지 업로드",
    aiPowered: "AI 기반",
    startMission: "미션 시작",
    footer: "푸터",
    partners: "파트너",
    business: "비즈니스",
    developers: "개발자",
    poweredBy: "Kastiz 제공",
    privacy: "개인정보",
    terms: "약관",
    settings: "설정",
    unknownLocation: "알 수 없는 위치",
    themes: {
      light: "라이트",
      gray: "그레이",
      midnight: "미드나이트"
    },
    languages: {
      en: "English",
      ko: "한국어"
    },
    missions: [
      "일본 여행 계획해줘",
      "영어 선생님 찾아줘",
      "좋은 노트북 추천해줘",
      "캐나다 이주 도와줘",
      "아이 돌봄 서비스 찾아줘",
      "상표 등록 도와줘",
      "신혼여행 계획해줘",
      "돈을 절약할 방법 찾아줘",
      "최고의 이혼 전문 변호사 찾아줘",
      "중국에서 상품 수입 도와줘",
      "꿈의 PC 조립해줘",
      "해외 이주 준비해줘",
      "주택담보대출 비교해줘",
      "은퇴 계획 세워줘",
      "꿈의 휴가 예약 준비해줘"
    ]
  }
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
  ko: "사용자가 승인하기 전에는 예약, 결제, 구매, 서명, 제출 또는 법적 약속이 진행되지 않습니다."
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
    ko: ["여행", "출장", "해외출장", "업무출장", "일본", "도쿄", "오사카", "교토", "항공권", "호텔", "신혼여행", "공항"]
  },
  shopping: {
    subtype: "product_research",
    en: ["buy", "laptop", "phone", "iphone", "macbook", "product", "compare", "cheapest", "best deal"],
    ko: ["구매", "노트북", "핸드폰", "아이폰", "맥북", "제품", "비교", "최저가", "추천"]
  },
  housing: {
    subtype: "housing_search",
    en: ["home", "house", "apartment", "rent", "mortgage", "real estate", "property"],
    ko: ["집", "아파트", "전세", "월세", "부동산", "주택담보대출"]
  },
  legal: {
    subtype: "legal_service_preparation",
    en: ["lawyer", "legal", "attorney", "divorce", "contract", "lawsuit", "trademark"],
    ko: ["변호사", "법률", "이혼", "계약서", "소송", "상표"]
  },
  moving: {
    subtype: "relocation_preparation",
    en: ["move", "immigration", "visa", "overseas", "canada", "america", "relocation"],
    ko: ["이주", "이민", "비자", "해외", "캐나다", "미국"]
  },
  business: {
    subtype: "business_setup",
    en: ["business", "company", "startup", "register", "tax", "accountant", "supplier"],
    ko: ["사업", "창업", "회사", "법인", "세금", "회계사", "공급업체"]
  },
  healthcare: {
    subtype: "healthcare_search",
    en: ["doctor", "dentist", "hospital", "clinic", "checkup", "appointment"],
    ko: ["병원", "의사", "치과", "건강검진", "예약"]
  },
  finance: {
    subtype: "financial_comparison",
    en: ["loan", "mortgage", "savings", "credit card", "investment", "insurance"],
    ko: ["대출", "적금", "신용카드", "투자", "보험"]
  },
  career: {
    subtype: "career_search",
    en: ["job", "resume", "career", "interview", "salary", "recruiter", "tutor", "teacher", "lesson", "english teacher"],
    ko: ["취업", "이직", "이력서", "면접", "연봉", "선생님", "튜터", "과외", "영어 수업"]
  },
  lifestyle: {
    subtype: "lifestyle_planning",
    en: ["wedding", "restaurant", "event", "birthday", "party", "gym", "trainer"],
    ko: ["결혼식", "식당", "이벤트", "생일", "파티", "헬스장", "트레이너"]
  }
};

const countryProfiles = {
  JP: { code: "JP", name: "Japan", nameKo: "일본", currency: "JPY", capital: "Tokyo", capitalKo: "도쿄", latitude: 35.6762, longitude: 139.6503 },
  KR: { code: "KR", name: "South Korea", nameKo: "대한민국", currency: "KRW", capital: "Seoul", capitalKo: "서울", latitude: 37.5665, longitude: 126.978 },
  CA: { code: "CA", name: "Canada", nameKo: "캐나다", currency: "CAD", capital: "Ottawa", capitalKo: "오타와", latitude: 45.4215, longitude: -75.6972 },
  US: { code: "US", name: "United States", nameKo: "미국", currency: "USD", capital: "Washington, D.C.", capitalKo: "워싱턴 D.C.", latitude: 38.9072, longitude: -77.0369 },
  CN: { code: "CN", name: "China", nameKo: "중국", currency: "CNY", capital: "Beijing", capitalKo: "베이징", latitude: 39.9042, longitude: 116.4074 },
  ES: { code: "ES", name: "Spain", nameKo: "스페인", currency: "EUR", capital: "Madrid", capitalKo: "마드리드", latitude: 40.4168, longitude: -3.7038 },
  CO: { code: "CO", name: "Colombia", nameKo: "콜롬비아", currency: "COP", capital: "Bogotá", capitalKo: "보고타", latitude: 4.711, longitude: -74.0721 }
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
    "여행",
    "출장",
    "해외출장",
    "업무출장",
    "일본",
    "도쿄",
    "오사카",
    "교토",
    "항공권",
    "호텔",
    "신혼여행"
  ]
};

const destinationPatterns = [
  { destination: "United States", destinationKo: "미국", city: "New York", cityKo: "뉴욕", latitude: 40.7128, longitude: -74.006, aliases: ["new york", "nyc", "newyork", "뉴욕"] },
  { destination: "Spain", destinationKo: "스페인", city: "Madrid", cityKo: "마드리드", latitude: 40.4168, longitude: -3.7038, aliases: ["madrid", "spain", "마드리드", "스페인"] },
  { destination: "Colombia", destinationKo: "콜롬비아", city: "Bogotá", cityKo: "보고타", latitude: 4.711, longitude: -74.0721, aliases: ["colombia", "bogota", "bogotá", "콜롬비아", "보고타"] },
  {
    destination: "Japan",
    destinationKo: "일본",
    city: "Tokyo",
    cityKo: "도쿄",
    aliases: ["japan", "tokyo", "일본", "도쿄"]
  },
  {
    destination: "Japan",
    destinationKo: "일본",
    city: "Osaka",
    cityKo: "오사카",
    aliases: ["osaka", "오사카"]
  },
  {
    destination: "Japan",
    destinationKo: "일본",
    city: "Kyoto",
    cityKo: "교토",
    aliases: ["kyoto", "교토"]
  }
];

let activeLanguage = "en";
let activeMissionIndex = -1;
let rotatorInterval = null;
let aiModeEnabled = false;
let selectedImageFiles = [];

const getBrowserLanguage = () => {
  const browserLanguage = navigator.language || navigator.userLanguage || "en";
  return browserLanguage.toLowerCase().startsWith("ko") ? "ko" : "en";
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
  return translations[activeLanguage]?.[key] ?? translations.en[key] ?? "";
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

const updateThemeControls = () => {
  const themeLabels = getTranslation("themes");
  const currentTheme = root.getAttribute("data-theme") || "light";

  themeControlText.textContent = activeLanguage === "ko" ? "테마" : "Theme";

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
  updateThemeControls();
};

const updateLocation = () => {
  const locale = navigator.language || "en";
  const region = locale.includes("-") ? locale.split("-").pop().toUpperCase() : "";

  const usesPhoneFooter = window.matchMedia(
    "(max-width: 640px), (orientation: landscape) and (max-height: 500px) and (max-width: 950px)"
  ).matches;

  locationText.textContent = usesPhoneFooter
    ? (activeLanguage === "ko" ? "대한민국" : "South Korea")
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
};

const normalizeMission = (value) => {
  return value.replace(/\s+/g, " ").trim();
};

const createMissionSlug = (mission) => {
  return mission
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
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
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(mission) ? "ko" : activeLanguage;
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
    { code: "JP", keywords: ["japan", "tokyo", "osaka", "kyoto", "일본", "도쿄", "오사카", "교토"] },
    { code: "KR", keywords: ["korea", "seoul", "busan", "incheon", "한국", "서울", "부산", "인천"] },
    { code: "CA", keywords: ["canada", "toronto", "vancouver", "캐나다", "토론토", "밴쿠버"] },
    { code: "US", keywords: ["america", "usa", "united states", "new york", "nyc", "미국", "뉴욕"] },
    { code: "CN", keywords: ["china", "beijing", "shanghai", "중국", "베이징", "상하이"] },
    { code: "ES", keywords: ["spain", "madrid", "스페인", "마드리드"] },
    { code: "CO", keywords: ["colombia", "bogota", "bogotá", "콜롬비아", "보고타"] }
  ];

  const found = matches.find((item) => item.keywords.some((keyword) => text.includes(keyword.toLowerCase())));

  return found?.code || null;
};

const missionText = (en, ko) => {
  return activeLanguage === "ko" ? ko : en;
};

const buildIntent = (type) => {
  const map = {
    travel: missionText("Prepare a trip plan and compare practical options.", "여행 계획을 준비하고 실용적인 선택지를 비교합니다."),
    shopping: missionText("Prepare product options, prices, reviews, and a buying checklist.", "제품 후보, 가격, 리뷰, 구매 전 체크리스트를 준비합니다."),
    housing: missionText("Prepare housing options, budget assumptions, and a pre-contract checklist.", "주거 후보, 예산 가정, 계약 전 체크리스트를 준비합니다."),
    legal: missionText("Prepare legal service types, required documents, and questions to ask.", "법률 서비스 유형, 필요 서류, 상담 질문을 준비합니다."),
    moving: missionText("Prepare relocation steps, visa, housing, and shipping checklist.", "이주 단계, 비자, 주거, 배송 체크리스트를 준비합니다."),
    business: missionText("Prepare business setup, registration, tax, suppliers, and launch steps.", "사업 시작, 등록, 세금, 공급업체, 런칭 단계를 준비합니다."),
    healthcare: missionText("Prepare clinic options, appointment preparation, documents, and costs.", "병원 후보, 예약 준비, 필요 서류, 예상 비용을 준비합니다."),
    finance: missionText("Compare financial options, rates, documents, and risks.", "금융 옵션, 금리, 필요 서류, 리스크를 비교합니다."),
    career: missionText("Prepare job targets, resume, interview, and recruiter steps.", "채용 목표, 이력서, 면접, 리크루터 단계를 준비합니다."),
    lifestyle: missionText("Prepare vendors, timeline, budget, reservations, and checklist.", "업체, 일정, 예산, 예약, 체크리스트를 준비합니다."),
    general_mission: missionText("Turn the request into a structured mission plan.", "요청을 구조화된 미션 계획으로 정리합니다.")
  };

  return map[type] || map.general_mission;
};

const buildAssumptions = (type, country) => {
  const assumptions = [
    missionText("ONE prepares and compares only; real-world execution requires explicit approval.", "ONE은 준비와 비교만 수행하며 실제 실행은 명시적 승인 후에만 가능합니다."),
    missionText("When details are missing, ONE uses balanced recommendations by default.", "세부 조건이 부족하면 균형형 추천을 기본값으로 사용합니다.")
  ];

  if (type === "travel") {
    assumptions.push(missionText("If dates are missing, ONE assumes a 7-day trip.", "날짜가 없으면 7일 여행으로 가정합니다."));
  }

  if (country && countryProfiles[country]) {
    assumptions.push(
      activeLanguage === "ko"
        ? `국가 기준은 ${countryProfiles[country].nameKo}로 설정되었습니다.`
        : `Country context is set to ${countryProfiles[country].name}.`
    );
  }

  return assumptions;
};

const buildSteps = (type) => {
  const map = {
    travel: [["flights","Prepare flight options","항공권 옵션 준비"],["hotels","Prepare hotel options","숙소 옵션 준비"],["weather","Check weather","날씨 확인"],["currency","Check exchange rates","환율 확인"],["visa","Check visa / entry requirements","비자 / 입국 요건 확인"],["restaurants","Prepare restaurant options","식당 옵션 준비"],["airport_transfer","Prepare airport transfer","공항 이동 준비"],["checklist","Prepare travel checklist","여행 체크리스트 준비"]],
    shopping: [["recommended_product","Select recommended product","추천 제품 선정"],["alternatives","Compare alternative products","대안 제품 비교"],["price_comparison","Compare prices","가격 비교"],["where_to_buy","Prepare where to buy","구매처 준비"],["warranty","Check warranty","보증 확인"],["delivery","Prepare delivery options","배송 옵션 준비"],["checklist","Pre-purchase checklist","구매 전 체크리스트"]],
    housing: [["housing_options","Prepare housing options","주거 옵션 준비"],["area_comparison","Compare areas","지역 비교"],["budget","Prepare budget range","예산 범위 준비"],["documents","Prepare document checklist","서류 체크리스트 준비"],["risks","Check contract risks","계약 리스크 확인"]],
    legal: [["lawyer_type","Define lawyer type","필요한 변호사 유형 정리"],["documents","Prepare documents needed","필요 서류 준비"],["process","Outline estimated process","예상 절차 정리"],["risks","Identify risks","리스크 정리"],["questions","Prepare questions to ask","상담 질문 준비"],["checklist","Legal checklist","법률 체크리스트"]],
    moving: [["visa","Prepare visa","비자 준비"],["housing","Prepare housing","주거 준비"],["shipping","Prepare shipping","배송 준비"],["banking","Prepare banking","은행 준비"],["insurance","Prepare insurance","보험 준비"],["schools","Prepare schools","학교 정보 준비"],["checklist","Moving checklist","이주 체크리스트"]],
    business: [["registration","Prepare business registration","사업자 / 법인 등록 준비"],["tax","Prepare tax / accounting","세금 / 회계 준비"],["brand","Prepare brand / domain","브랜드 / 도메인 준비"],["suppliers","Prepare suppliers","공급업체 준비"],["budget","Prepare business budget","사업 예산 준비"],["checklist","Business checklist","사업 시작 체크리스트"]],
    healthcare: [["clinic","Prepare clinic / hospital options","병원 / 클리닉 후보 준비"],["appointment","Prepare appointment","예약 준비"],["documents","Prepare documents","필요 서류 준비"],["cost","Prepare cost estimate","예상 비용 준비"],["checklist","Healthcare checklist","진료 체크리스트"]],
    finance: [["loan_options","Prepare loan options","대출 옵션 준비"],["rates","Compare rates","금리 비교"],["documents","Prepare documents","필요 서류 준비"],["risks","Identify risks","리스크 정리"],["checklist","Finance checklist","금융 체크리스트"]],
    career: [["targets","Prepare job targets","채용 목표 정리"],["resume","Prepare resume","이력서 준비"],["interview","Prepare interview","면접 준비"],["recruiters","Prepare recruiters","리크루터 후보 준비"],["checklist","Career checklist","커리어 체크리스트"]],
    lifestyle: [["vendors","Prepare vendors","업체 후보 준비"],["timeline","Prepare timeline","일정 준비"],["budget","Prepare budget","예산 준비"],["reservations","Prepare reservations","예약 준비"],["checklist","Prepare checklist","체크리스트 준비"]],
    general_mission: [["understand","Understand request","요청 분석"],["options","Prepare options","선택지 준비"],["plan","Prepare action plan","실행 계획 준비"],["checklist","Prepare checklist","체크리스트 준비"]]
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
    travel: missionText("Prioritize a balanced itinerary, direct flights, and hotels with strong transport access.", "균형형 일정, 직항 중심 항공, 교통 편리한 숙소를 우선 추천합니다."),
    shopping: missionText("Recommend based on quality, warranty, delivery, reviews, and price balance.", "품질, 보증, 배송, 리뷰, 가격 균형을 기준으로 추천합니다."),
    housing: missionText("Compare location, monthly cost, contract risk, and transport access.", "위치, 월 비용, 계약 리스크, 교통 접근성을 비교합니다."),
    legal: missionText("Prepare the right lawyer type, documents, and consultation questions first.", "전문 분야가 맞는 변호사 유형, 서류, 상담 질문을 먼저 준비합니다."),
    moving: missionText("Prepare visa, housing, banking, insurance, and shipping in order.", "비자, 주거, 은행, 보험, 배송 순서로 준비합니다."),
    business: missionText("Prepare registration, tax, brand, suppliers, and starting budget.", "등록, 세금, 브랜드, 공급업체, 초기 예산을 준비합니다."),
    healthcare: missionText("Compare clinics by location, specialty, cost, and appointment availability.", "위치, 전문 분야, 비용, 예약 가능성을 기준으로 병원을 비교합니다."),
    finance: missionText("Compare total cost, risk, documents, and rates together.", "총 비용, 리스크, 필요 서류, 금리를 함께 비교합니다."),
    career: missionText("Prepare target roles, resume, interview, and recruiter outreach.", "목표 직무, 이력서, 면접, 리크루터 접근을 준비합니다."),
    lifestyle: missionText("Start with budget, timeline, vendors, and reservation risks.", "예산, 일정, 업체, 예약 리스크를 먼저 정리합니다."),
    general_mission: missionText("Break the request into executable steps and prepare only before approval.", "요청을 실행 가능한 단계로 나누고 승인 전까지 준비만 진행합니다.")
  };

  return [{
    id: "recommended-plan",
    title: missionText("Recommended plan", "추천 플랜"),
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
    missionText("Actual price and availability must be verified before real-world execution.", "실제 가격과 가능 여부는 최종 실행 전 다시 확인해야 합니다."),
    missionText("No contract, booking, submission, or payment happens before approval.", "승인 전에는 계약, 예약, 제출, 결제가 진행되지 않습니다.")
  ];

  const map = {
    travel: missionText("Flight and hotel prices can change quickly.", "항공권과 숙소 가격은 빠르게 변동될 수 있습니다."),
    shopping: missionText("Lowest-price products require delivery, warranty, and authenticity checks.", "최저가 제품은 배송, 보증, 정품 여부를 확인해야 합니다."),
    housing: missionText("Contract terms, deposit, fees, and registration details must be checked.", "계약 조건, 보증금, 관리비, 등기 사항 확인이 필요합니다."),
    legal: missionText("Legal information is for preparation only and requires professional review.", "법률 정보는 일반 준비용이며 최종 판단은 전문가 확인이 필요합니다."),
    moving: missionText("Visa and immigration requirements can change by country.", "비자와 이민 요건은 국가별로 바뀔 수 있습니다."),
    business: missionText("Business registration, taxes, and permits may differ by location.", "사업 등록, 세금, 허가 요건은 지역별로 다를 수 있습니다."),
    healthcare: missionText("For emergencies, use local emergency services, not ONE.", "응급 상황에서는 ONE이 아니라 현지 응급 서비스를 이용해야 합니다."),
    finance: missionText("Financial products can involve loss, interest, and fee risks.", "금융 상품은 손실, 이자, 수수료 리스크가 있습니다."),
    career: missionText("Company and role conditions must be checked before applying.", "지원서 제출 전 회사와 조건을 직접 확인해야 합니다."),
    lifestyle: missionText("Availability and cancellation rules must be checked.", "예약 가능 여부와 취소 규정을 확인해야 합니다.")
  };

  if (map[type]) risks.unshift(map[type]);
  return risks;
};

const buildCards = (type) => {
  const map = {
    travel: [["flights","Flights","항공권"],["hotels","Hotels","숙소"],["weather","Weather","날씨"],["currency","Currency","환율"],["visa","Visa","비자"],["restaurants","Restaurants","식당"],["airport_transfer","Airport Transfer","공항 이동"],["checklist","Checklist","체크리스트"]],
    shopping: [["recommended_product","Recommended Product","추천 제품"],["alternative_products","Alternative Products","대안 제품"],["price_comparison","Price Comparison","가격 비교"],["where_to_buy","Where to Buy","구매처"],["warranty","Warranty","보증"],["delivery","Delivery","배송"],["checklist","Checklist","체크리스트"]],
    housing: [["housing_options","Housing Options","주거 옵션"],["area_comparison","Area Comparison","지역 비교"],["budget","Budget","예산"],["documents","Documents","서류"],["risks","Risks","리스크"],["checklist","Checklist","체크리스트"]],
    legal: [["lawyer_type","Recommended Lawyer Type","추천 변호사 유형"],["documents","Documents Needed","필요 서류"],["process","Estimated Process","예상 절차"],["risks","Risks","리스크"],["questions","Questions to Ask","질문 리스트"],["checklist","Checklist","체크리스트"]],
    moving: [["visa","Visa","비자"],["housing","Housing","주거"],["shipping","Shipping","배송"],["banking","Banking","은행"],["insurance","Insurance","보험"],["schools","Schools","학교"],["checklist","Checklist","체크리스트"]],
    business: [["registration","Business Registration","사업자 / 법인 등록"],["tax","Tax / Accounting","세금 / 회계"],["brand","Brand / Domain","브랜드 / 도메인"],["suppliers","Suppliers","공급업체"],["budget","Budget","예산"],["checklist","Checklist","체크리스트"]],
    healthcare: [["clinic","Clinic / Hospital","병원 / 클리닉"],["appointment","Appointment Prep","예약 준비"],["documents","Documents","서류"],["cost","Cost Estimate","예상 비용"],["checklist","Checklist","체크리스트"]],
    finance: [["loan_options","Loan Options","대출 옵션"],["rates","Rates","금리"],["documents","Documents","서류"],["risks","Risks","리스크"],["checklist","Checklist","체크리스트"]],
    career: [["targets","Job Targets","채용 목표"],["resume","Resume","이력서"],["interview","Interview Prep","면접 준비"],["recruiters","Recruiters","리크루터"],["checklist","Checklist","체크리스트"]],
    lifestyle: [["vendors","Vendors","업체"],["timeline","Timeline","일정"],["budget","Budget","예산"],["reservations","Reservations","예약"],["checklist","Checklist","체크리스트"]],
    general_mission: [["mission_plan","Mission Plan","미션 플랜"],["options","Options","선택지"],["budget","Budget","예산"],["risks","Risks","리스크"],["checklist","Checklist","체크리스트"]]
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
  const isTutorMission = type === "tutoring" || (type === "career" && /tutor|teacher|lesson|선생님|튜터|과외|수업/i.test(cleanMission));
  const tutorSteps = [
    ["tutors", "Tutor shortlist", "튜터 후보"],
    ["style", "Teaching style", "수업 방식"],
    ["format", "Online / Offline", "온라인 / 오프라인"],
    ["experience", "Experience", "경력"],
    ["price", "Price", "가격"],
    ["languages", "Languages", "사용 언어"],
    ["availability", "Availability", "가능 시간"],
    ["questions", "Interview questions", "인터뷰 질문"],
    ["trial", "Trial lesson", "체험 수업"]
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
    title: activeLanguage === "ko" ? `${ko} 준비 완료` : `${en} prepared`,
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
        ? ["선택한 단계를 준비하고 있어요...", "최종 요구사항을 확인하고 있어요...", "제공자 실행 항목을 준비하고 있어요...", "승인 요약을 만들고 있어요...", "실제 실행 준비가 완료되었습니다."]
        : ["Preparing selected steps...", "Checking final requirements...", "Preparing provider actions...", "Creating approval summary...", "Ready for real-world execution."],
      finalMessage: "Your future is now in motion.\\n— ONE —"
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
    destinationKo: "확인이 필요한 목적지",
    city: "City to confirm",
    cityKo: "확인이 필요한 도시",
    aliases: []
  };
};

const detectDurationDays = (mission) => {
  const englishMatch = mission.match(/(\d+)\s*(day|days)/i);
  const koreanMatch = mission.match(/(\d+)\s*(일|박)/);

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
    "편도", "이민", "이주", "영구 이주"
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
      status: "provider_ready",
      message: {
        en: "Weather will be checked with a live weather API before execution.",
        ko: "실행 전 실시간 날씨 API로 날씨를 확인합니다."
      },
      providerCandidates: ["Open-Meteo API"]
    },
    exchangeRate: {
      status: "provider_ready",
      from: "KRW",
      to: "JPY",
      message: {
        en: "Exchange rate will be checked with a live currency API before execution.",
        ko: "실행 전 실시간 환율 API로 환율을 확인합니다."
      },
      providerCandidates: ["Frankfurter API"]
    },
    visa: {
      status: "requires-verification",
      message: {
        en: "For many travelers visa-free entry may apply, but ONE must verify before execution.",
        ko: "많은 여행자에게 무비자 입국이 가능할 수 있지만, 실행 전 ONE이 반드시 확인해야 합니다."
      },
      providerCandidates: ["Government embassy data", "Timatic-style API"]
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
    ]
  };
};

const buildGeneralMission = (mission) => {
  return buildMissionObject(mission);
};

const saveMission = (mission, schedule = null) => {
  const cleanMission = normalizeMission(mission);
  const missionType = classifyMission(cleanMission);
  const payload = missionType === "travel"
    ? buildTravelMission(cleanMission)
    : buildGeneralMission(cleanMission);

  payload.aiMode = aiModeEnabled;
  payload.schedule = schedule;
  payload.followUp = pendingFollowUp;
  const selectedDestination = pendingFollowUp?.answers;
  if (payload.type === "travel" && selectedDestination?.destination) {
    payload.destination = {
      ...payload.destination,
      country: selectedDestination.destinationCountry || payload.destination?.country,
      countryKo: selectedDestination.destinationCountry || payload.destination?.countryKo,
      city: selectedDestination.destination,
      cityKo: selectedDestination.destination,
      continent: selectedDestination.destinationContinent || "",
      latitude: Number(selectedDestination.destinationLatitude) || undefined,
      longitude: Number(selectedDestination.destinationLongitude) || undefined
    };
    if (selectedDestination.destinationCountryCode) {
      payload.country = selectedDestination.destinationCountryCode;
      const currencyByCountry = { JP: "JPY", ES: "EUR", US: "USD", CA: "CAD", FR: "EUR", IT: "EUR", GB: "GBP", DE: "EUR", AU: "AUD", TH: "THB", VN: "VND", CN: "CNY", KR: "KRW", CO: "COP", MX: "MXN", BZ: "BZD", CR: "CRC", SV: "USD", GT: "GTQ", HN: "HNL", NI: "NIO", PA: "PAB", SG: "SGD", AR: "ARS", BR: "BRL", PE: "PEN", CL: "CLP", PT: "EUR", NL: "EUR", GR: "EUR", AE: "AED", IN: "INR", ID: "IDR", MY: "MYR", NZ: "NZD", ZA: "ZAR", EG: "EGP", MA: "MAD" };
      payload.countryProfile = countryProfiles[selectedDestination.destinationCountryCode] || {
        code: selectedDestination.destinationCountryCode,
        name: selectedDestination.destinationCountry,
        nameKo: selectedDestination.destinationCountry,
        currency: selectedDestination.destinationCurrency || currencyByCountry[selectedDestination.destinationCountryCode] || payload.exchangeRate?.to || "USD",
        capital: selectedDestination.destination,
        capitalKo: selectedDestination.destination,
        continent: selectedDestination.destinationContinent || "",
        latitude: Number(selectedDestination.destinationLatitude) || undefined,
        longitude: Number(selectedDestination.destinationLongitude) || undefined
      };
      payload.exchangeRate = {
        ...payload.exchangeRate,
        to: selectedDestination.destinationCurrency || currencyByCountry[selectedDestination.destinationCountryCode] || payload.exchangeRate?.to
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
    announceMissionTool("Voice is not supported in this browser.", "이 브라우저에서는 음성을 지원하지 않습니다.");
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
  announceMissionTool("ONE is speaking.", "ONE이 음성으로 안내합니다.");
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
    aiModeEnabled ? "AI 어시스턴트 모드가 켜졌습니다." : "AI 어시스턴트 모드가 꺼졌습니다."
  );
  missionInput.focus();
});

microphoneButton?.addEventListener("click", speakWelcomeMessage);

imageUploadButton?.addEventListener("click", () => imageUploadInput?.click());
imageUploadInput?.addEventListener("change", () => {
  selectedImageFiles = [...(imageUploadInput.files || [])];
  imageUploadButton.classList.toggle("is-active", selectedImageFiles.length > 0);
  announceMissionTool(
    selectedImageFiles.length === 1 ? "1 image attached." : `${selectedImageFiles.length} images attached.`,
    `이미지 ${selectedImageFiles.length}개가 첨부되었습니다.`
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
  const outgoingLabel = activeLanguage === "ko" ? "출국 날짜" : "Outgoing date";
  const returningLabel = activeLanguage === "ko" ? "귀국 날짜" : "Returning date";
  const timeHeading = activeLanguage === "ko" ? "시간" : "Time";
  scheduleSummary.innerHTML = `
    <span class="schedule-summary-row"><strong>${outgoingLabel}</strong><span>${startLabel}</span></span>
    <span class="schedule-summary-row"><strong>${returningLabel}</strong><span>${endLabel}</span></span>
    <span class="schedule-summary-row"><strong>${timeHeading}</strong><span>${timeLabel}</span></span>
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
  updateScheduleSummary();
  if (typeof scheduleModal.showModal === "function") scheduleModal.showModal();
  else scheduleModal.setAttribute("open", "");
};

scheduleStartDate?.addEventListener("change", updateScheduleSummary);
scheduleEndDate?.addEventListener("change", updateScheduleSummary);
scheduleTimePreference?.addEventListener("change", updateScheduleSummary);
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
  const schedule = { startDate: scheduleStartDate.value, endDate: scheduleEndDate.value, timePreference: scheduleTimePreference.value };
  trackEvent("schedule_confirmed", {
    mission_type: detectMissionType(normalizeMission(pendingMissionText)),
    language: activeLanguage,
    page: "home",
    schedule_used: true
  });
  scheduleModal.close();
  startMission(pendingMissionText, schedule);
});

missionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const mission = normalizeMission(missionInput.value);
  if (!mission) { missionInput.focus(); return; }
  const type = classifyMission(mission);
  const openFollowUp = () => openMissionFollowUp({
    mission,
    type,
    language: activeLanguage,
    demoMode: isPresentationMode(),
    restoreFocusTo: missionInput,
    onComplete: (followUp) => {
      pendingFollowUp = followUp;
      startMission(mission, followUp.schedule || null);
    }
  });
  ensureDisclosureAcknowledged({
    language: activeLanguage,
    restoreFocusTo: missionInput,
    onAcknowledge: openFollowUp,
    onCancel: () => { missionInput.value = mission; syncInputState(); }
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


