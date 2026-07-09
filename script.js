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

const KASTIZ_ONE_VERSION = "V9_MASTER_ARCHITECTURE";

const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  travelMission: "kastiz-one-travel-mission",
  results: "kastiz-one-results",
  missionHistory: "kastiz-one-mission-history",
  executionState: "kastiz-one-execution-state",
  providerState: "kastiz-one-provider-state"
};

const supportedLanguages = ["en", "ko"];
const supportedThemes = ["light", "gray", "midnight"];

const missionTypes = {
  travel: "travel",
  shopping: "shopping",
  legal: "legal",
  healthcare: "healthcare",
  education: "education",
  finance: "finance",
  career: "career",
  moving: "moving",
  business: "business",
  government: "government",
  lifestyle: "lifestyle",
  general: "general"
};

const protectedActions = [
  "book",
  "purchase",
  "reserve",
  "sign",
  "pay",
  "submit",
  "apply",
  "commit",
  "confirm",
  "예약",
  "구매",
  "결제",
  "서명",
  "제출",
  "신청",
  "확정"
];

const translations = {
  en: {
    description: "Kastiz ONE completes real-life missions.",
    siteNavigation: "Kastiz ONE navigation",
    preferences: "Preferences",
    themeLabel: "Theme",
    languageLabel: "Language",
    account: "Account",
    upgrade: "Upgrade",
    login: "Login",
    searchLabel: "Enter your mission",
    searchDefault: "What mission should ONE complete?",
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
    missionPrepared: "Mission prepared",
    approvalProtection: "Nothing will be booked, purchased, reserved, signed, paid, submitted, or legally committed until you explicitly approve.",
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
    searchLabel: "미션 입력",
    searchDefault: "ONE이 어떤 미션을 완성할까요?",
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
    missionPrepared: "미션 준비 완료",
    approvalProtection: "사용자가 명확히 승인하기 전까지 예약, 구매, 결제, 서명, 제출, 신청, 법적 약속은 절대 진행되지 않습니다.",
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
      "내 첫 집 찾아줘",
      "사업 시작 도와줘",
      "캐나다 이주 준비해줘",
      "최고의 노트북 찾아줘",
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

const countryProfiles = {
  JP: {
    country: "Japan",
    countryKo: "일본",
    currency: "JPY",
    capital: "Tokyo",
    capitalKo: "도쿄"
  },
  KR: {
    country: "South Korea",
    countryKo: "대한민국",
    currency: "KRW",
    capital: "Seoul",
    capitalKo: "서울"
  },
  US: {
    country: "United States",
    countryKo: "미국",
    currency: "USD",
    capital: "Washington, D.C.",
    capitalKo: "워싱턴 D.C."
  },
  CA: {
    country: "Canada",
    countryKo: "캐나다",
    currency: "CAD",
    capital: "Ottawa",
    capitalKo: "오타와"
  },
  CN: {
    country: "China",
    countryKo: "중국",
    currency: "CNY",
    capital: "Beijing",
    capitalKo: "베이징"
  },
  HK: {
    country: "Hong Kong",
    countryKo: "홍콩",
    currency: "HKD",
    capital: "Hong Kong",
    capitalKo: "홍콩"
  },
  MO: {
    country: "Macao",
    countryKo: "마카오",
    currency: "MOP",
    capital: "Macao",
    capitalKo: "마카오"
  },
  PH: {
    country: "Philippines",
    countryKo: "필리핀",
    currency: "PHP",
    capital: "Manila",
    capitalKo: "마닐라"
  }
};

const missionKeywordMap = {
  travel: {
    subtype: "trip_planning",
    en: ["travel", "trip", "vacation", "honeymoon", "flight", "hotel", "itinerary", "visa", "restaurant", "tour", "japan", "tokyo", "osaka", "kyoto", "book my dream vacation"],
    ko: ["여행", "일본", "도쿄", "오사카", "교토", "항공권", "호텔", "숙소", "일정", "비자", "맛집", "신혼여행", "휴가", "예약 준비"]
  },
  shopping: {
    subtype: "product_research",
    en: ["buy", "shop", "shopping", "product", "laptop", "phone", "pc", "computer", "review", "price", "availability", "compare"],
    ko: ["구매", "쇼핑", "제품", "노트북", "핸드폰", "폰", "컴퓨터", "pc", "리뷰", "가격", "재고", "비교"]
  },
  legal: {
    subtype: "legal_preparation",
    en: ["legal", "lawyer", "attorney", "contract", "lawsuit", "divorce", "trademark", "agreement", "rights", "terms"],
    ko: ["법률", "변호사", "계약", "소송", "이혼", "상표", "등록", "합의서", "권리", "약관"]
  },
  healthcare: {
    subtype: "healthcare_search",
    en: ["doctor", "hospital", "clinic", "dentist", "appointment", "medicine", "health", "childcare"],
    ko: ["병원", "의사", "치과", "진료", "예약", "건강", "약", "아이 돌봄", "돌봄"]
  },
  education: {
    subtype: "learning_plan",
    en: ["school", "course", "lesson", "student", "study", "class", "worksheet", "test", "education", "university"],
    ko: ["학교", "코스", "수업", "학생", "공부", "학습", "시험", "교육", "대학교", "워크시트"]
  },
  finance: {
    subtype: "financial_preparation",
    en: ["bank", "loan", "mortgage", "investment", "stock", "budget", "insurance", "finance", "tax", "save me money", "retirement"],
    ko: ["은행", "대출", "주택담보대출", "투자", "주식", "예산", "보험", "금융", "세금", "돈", "절약", "은퇴"]
  },
  career: {
    subtype: "career_growth",
    en: ["job", "career", "resume", "cv", "interview", "apply", "hire", "work"],
    ko: ["직업", "커리어", "이력서", "면접", "지원", "취업", "채용", "일"]
  },
  moving: {
    subtype: "relocation",
    en: ["move", "moving", "relocate", "apartment", "housing", "shipping", "immigration", "first home", "overseas"],
    ko: ["이사", "이민", "집", "아파트", "주거", "배송", "해외 이주", "첫 집"]
  },
  business: {
    subtype: "business_operations",
    en: ["business", "company", "startup", "register company", "taxes", "launch", "market", "import products"],
    ko: ["사업", "회사", "창업", "법인", "등록", "런칭", "시장", "상품 수입", "수입"]
  },
  government: {
    subtype: "government_services",
    en: ["government", "permit", "license", "form", "document", "embassy", "immigration office"],
    ko: ["정부", "허가", "면허", "서류", "문서", "대사관", "출입국", "관공서"]
  },
  lifestyle: {
    subtype: "life_planning",
    en: ["routine", "gym", "fitness", "restaurant", "cafe", "date", "hobby", "plan my day", "childcare"],
    ko: ["루틴", "헬스", "운동", "카페", "데이트", "취미", "하루 계획", "맛집"]
  }
};

const destinationPatterns = [
  {
    code: "JP",
    destination: "Japan",
    destinationKo: "일본",
    city: "Tokyo",
    cityKo: "도쿄",
    aliases: ["japan", "tokyo", "일본", "도쿄"]
  },
  {
    code: "JP",
    destination: "Japan",
    destinationKo: "일본",
    city: "Osaka",
    cityKo: "오사카",
    aliases: ["osaka", "오사카"]
  },
  {
    code: "JP",
    destination: "Japan",
    destinationKo: "일본",
    city: "Kyoto",
    cityKo: "교토",
    aliases: ["kyoto", "교토"]
  },
  {
    code: "CA",
    destination: "Canada",
    destinationKo: "캐나다",
    city: "Toronto",
    cityKo: "토론토",
    aliases: ["canada", "toronto", "vancouver", "캐나다", "토론토", "밴쿠버"]
  },
  {
    code: "US",
    destination: "United States",
    destinationKo: "미국",
    city: "New York",
    cityKo: "뉴욕",
    aliases: ["usa", "america", "united states", "new york", "la", "미국", "뉴욕", "로스앤젤레스"]
  },
  {
    code: "HK",
    destination: "Hong Kong",
    destinationKo: "홍콩",
    city: "Hong Kong",
    cityKo: "홍콩",
    aliases: ["hong kong", "홍콩"]
  },
  {
    code: "MO",
    destination: "Macao",
    destinationKo: "마카오",
    city: "Macao",
    cityKo: "마카오",
    aliases: ["macao", "macau", "마카오"]
  },
  {
    code: "PH",
    destination: "Philippines",
    destinationKo: "필리핀",
    city: "Manila",
    cityKo: "마닐라",
    aliases: ["philippines", "manila", "cebu", "필리핀", "마닐라", "세부"]
  }
];

const providerCatalog = {
  flights: {
    id: "flights-interface",
    name: "Flight Provider Interface",
    category: "flights",
    missionTypes: ["travel"],
    status: "interface-ready",
    requiresApiKey: true,
    requiresCommercialApproval: true,
    freePrototype: false,
    providers: ["Amadeus API", "Skyscanner API", "Google Flights alternatives"],
    capabilities: ["flight_search", "fare_compare", "booking_handoff"],
    executionPolicy: "prepare_only_until_approval"
  },
  hotels: {
    id: "hotels-interface",
    name: "Hotel Provider Interface",
    category: "hotels",
    missionTypes: ["travel", "moving"],
    status: "interface-ready",
    requiresApiKey: true,
    requiresCommercialApproval: true,
    freePrototype: false,
    providers: ["Booking.com Partner API", "Expedia Rapid API", "Agoda Partner API"],
    capabilities: ["hotel_search", "availability_check", "reservation_handoff"],
    executionPolicy: "prepare_only_until_approval"
  },
  restaurants: {
    id: "restaurants-interface",
    name: "Restaurant Provider Interface",
    category: "restaurants",
    missionTypes: ["travel", "lifestyle"],
    status: "interface-ready",
    requiresApiKey: true,
    requiresCommercialApproval: false,
    freePrototype: false,
    providers: ["Google Places API", "Naver Places", "Tabelog", "OpenTable"],
    capabilities: ["restaurant_search", "rating_compare", "reservation_handoff"],
    executionPolicy: "prepare_only_until_approval"
  },
  weather: {
    id: "openweather-adapter",
    name: "OpenWeather Adapter",
    category: "weather",
    missionTypes: ["travel", "moving", "lifestyle"],
    status: "adapter-ready",
    requiresApiKey: true,
    requiresCommercialApproval: false,
    freePrototype: true,
    providers: ["OpenWeather API", "WeatherAPI"],
    capabilities: ["current_weather", "forecast", "seasonal_context"],
    executionPolicy: "read_only"
  },
  currency: {
    id: "exchange-rate-adapter",
    name: "ExchangeRate Adapter",
    category: "currency",
    missionTypes: ["travel", "finance", "business"],
    status: "adapter-ready",
    requiresApiKey: false,
    requiresCommercialApproval: false,
    freePrototype: true,
    providers: ["ExchangeRate API"],
    capabilities: ["currency_conversion", "budget_estimation"],
    executionPolicy: "read_only"
  },
  maps: {
    id: "maps-provider-layer",
    name: "Maps Provider Layer",
    category: "maps",
    missionTypes: ["travel", "moving", "healthcare", "education", "business", "lifestyle"],
    status: "adapter-ready",
    requiresApiKey: false,
    requiresCommercialApproval: false,
    freePrototype: true,
    providers: ["OpenStreetMap Nominatim", "Google Maps Interface", "Naver Maps Interface"],
    capabilities: ["geocoding", "place_search", "area_context", "routing_handoff"],
    executionPolicy: "read_only"
  },
  visa: {
    id: "visa-resources-interface",
    name: "Visa Resource Interface",
    category: "visa",
    missionTypes: ["travel", "moving", "government"],
    status: "interface-ready",
    requiresApiKey: false,
    requiresCommercialApproval: false,
    freePrototype: true,
    providers: ["Government embassy data", "REST Countries", "Timatic-style commercial API interface"],
    capabilities: ["visa_checklist", "entry_requirements", "document_preparation"],
    executionPolicy: "prepare_only_until_approval"
  },
  products: {
    id: "products-interface",
    name: "Product Provider Interface",
    category: "products",
    missionTypes: ["shopping"],
    status: "interface-ready",
    requiresApiKey: true,
    requiresCommercialApproval: true,
    freePrototype: false,
    providers: ["Product Search API", "Retailer APIs", "Review Provider Interface"],
    capabilities: ["product_search", "reviews", "price_comparison", "availability"],
    executionPolicy: "prepare_only_until_approval"
  },
  legal: {
    id: "legal-resources-interface",
    name: "Legal Resource Interface",
    category: "legal",
    missionTypes: ["legal", "business", "government"],
    status: "interface-ready",
    requiresApiKey: false,
    requiresCommercialApproval: false,
    freePrototype: true,
    providers: ["Government resources", "Lawyer directory interface"],
    capabilities: ["lawyer_search", "government_resources", "document_checklist"],
    executionPolicy: "prepare_only_until_approval"
  },
  healthcare: {
    id: "healthcare-interface",
    name: "Healthcare Provider Interface",
    category: "healthcare",
    missionTypes: ["healthcare"],
    status: "interface-ready",
    requiresApiKey: true,
    requiresCommercialApproval: true,
    freePrototype: false,
    providers: ["Hospital search interface", "Clinic search interface", "Appointment provider interface"],
    capabilities: ["hospital_search", "appointment_handoff", "clinic_compare"],
    executionPolicy: "prepare_only_until_approval"
  },
  career: {
    id: "career-interface",
    name: "Career Provider Interface",
    category: "career",
    missionTypes: ["career"],
    status: "interface-ready",
    requiresApiKey: true,
    requiresCommercialApproval: true,
    freePrototype: false,
    providers: ["Jobs API Interface", "Resume Engine", "Application Provider Interface"],
    capabilities: ["job_search", "resume_preparation", "application_handoff"],
    executionPolicy: "prepare_only_until_approval"
  },
  education: {
    id: "education-interface",
    name: "Education Provider Interface",
    category: "education",
    missionTypes: ["education"],
    status: "interface-ready",
    requiresApiKey: false,
    requiresCommercialApproval: false,
    freePrototype: true,
    providers: ["Course catalogs", "School search interface", "Learning plan engine"],
    capabilities: ["school_search", "course_search", "learning_plan"],
    executionPolicy: "prepare_only_until_approval"
  },
  finance: {
    id: "finance-interface",
    name: "Finance Provider Interface",
    category: "finance",
    missionTypes: ["finance"],
    status: "interface-ready",
    requiresApiKey: true,
    requiresCommercialApproval: true,
    freePrototype: false,
    providers: ["Bank interface", "Loan interface", "Budget engine"],
    capabilities: ["bank_compare", "loan_compare", "budget_plan"],
    executionPolicy: "prepare_only_until_approval"
  },
  business: {
    id: "business-interface",
    name: "Business Provider Interface",
    category: "business",
    missionTypes: ["business"],
    status: "interface-ready",
    requiresApiKey: false,
    requiresCommercialApproval: false,
    freePrototype: true,
    providers: ["Company registration resources", "Tax checklist resources", "Launch planning engine"],
    capabilities: ["company_registration", "tax_checklist", "launch_plan"],
    executionPolicy: "prepare_only_until_approval"
  },
  moving: {
    id: "moving-interface",
    name: "Moving Provider Interface",
    category: "moving",
    missionTypes: ["moving"],
    status: "interface-ready",
    requiresApiKey: true,
    requiresCommercialApproval: true,
    freePrototype: false,
    providers: ["Immigration resources", "Shipping provider interface", "Housing provider interface"],
    capabilities: ["immigration_checklist", "shipping_compare", "housing_search"],
    executionPolicy: "prepare_only_until_approval"
  }
};

let activeLanguage = "en";
let activeMissionIndex = -1;
let rotatorInterval = null;
let firstRotationTimeout = null;

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
    gray: "#f4f2ed",
    midnight: "#121315"
  };

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", colors[theme] || colors.light);
};

const updateThemeControls = () => {
  const themeLabels = getTranslation("themes");
  const currentTheme = root.getAttribute("data-theme") || "light";

  if (themeControlText) {
    themeControlText.textContent = themeLabels[currentTheme] || themeLabels.light;
  }

  document.querySelectorAll("[data-theme-option]").forEach((button) => {
    const value = button.getAttribute("data-theme-option");
    button.textContent = themeLabels[value] || value;
    button.classList.toggle("is-active", value === currentTheme);
    button.setAttribute("aria-selected", String(value === currentTheme));
  });
};

const updateLanguageControls = () => {
  const languageLabels = getTranslation("languages");

  if (languageControlText) {
    languageControlText.textContent = languageLabels[activeLanguage] || "English";
  }

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
  if (!locationText) {
    return;
  }

  const locale = navigator.language || "en";
  const region = locale.includes("-") ? locale.split("-").pop().toUpperCase() : "";

  locationText.textContent = countryNamesByRegion[region] || getTranslation("unknownLocation");
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
  if (!missionRotator || !missionRotatorText) {
    return;
  }

  missionRotator.classList.add("is-fading");

  window.setTimeout(() => {
    missionRotatorText.textContent = text;
    missionRotator.classList.remove("is-fading");
  }, 260);
};

const resetMissionRotator = () => {
  window.clearInterval(rotatorInterval);
  window.clearTimeout(firstRotationTimeout);

  if (!missionRotatorText) {
    return;
  }

  activeMissionIndex = -1;
  missionRotatorText.textContent = getTranslation("searchDefault");

  firstRotationTimeout = window.setTimeout(() => {
    rotateMission();

    rotatorInterval = window.setInterval(() => {
      rotateMission();
    }, 5000);
  }, 10000);
};

const rotateMission = () => {
  const missions = getTranslation("missions");

  if (!Array.isArray(missions) || missions.length === 0) {
    return;
  }

  activeMissionIndex = (activeMissionIndex + 1) % missions.length;
  fadeRotatorTo(missions[activeMissionIndex]);
};

const setLanguage = (language) => {
  activeLanguage = supportedLanguages.includes(language) ? language : "en";

  root.setAttribute("lang", activeLanguage);
  root.setAttribute("data-language", activeLanguage);
  document.documentElement.lang = activeLanguage;
  localStorage.setItem(STORAGE_KEYS.language, activeLanguage);

  updateTextContent();
  updateThemeControls();
  updateLanguageControls();
  updateLocation();
  resetMissionRotator();
};

const normalizeMission = (value) => {
  return String(value || "").replace(/\s+/g, " ").trim();
};

const normalizeForDetection = (value) => {
  return normalizeMission(value).toLowerCase();
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

const createId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const detectMissionType = (mission) => {
  const text = normalizeForDetection(mission);

  const scoredTypes = Object.keys(missionKeywordMap).map((type) => {
    const keywords = [
      ...(missionKeywordMap[type].en || []),
      ...(missionKeywordMap[type].ko || [])
    ];

    const score = keywords.reduce((total, keyword) => {
      return text.includes(keyword.toLowerCase()) ? total + keyword.length : total;
    }, 0);

    return {
      type,
      score,
      subtype: missionKeywordMap[type].subtype
    };
  });

  scoredTypes.sort((a, b) => b.score - a.score);

  return scoredTypes[0] && scoredTypes[0].score > 0 ? scoredTypes[0].type : missionTypes.general;
};

const detectMissionSubtype = (type) => {
  return missionKeywordMap[type]?.subtype || "general_preparation";
};

const detectDestination = (mission) => {
  const text = normalizeForDetection(mission);

  const matched = destinationPatterns.find((destination) => {
    return destination.aliases.some((alias) => text.includes(alias.toLowerCase()));
  });

  if (matched) {
    return matched;
  }

  return {
    code: "JP",
    destination: "Japan",
    destinationKo: "일본",
    city: "Tokyo",
    cityKo: "도쿄",
    aliases: ["japan", "tokyo", "일본", "도쿄"]
  };
};

const detectCountryCode = (mission, type) => {
  if (type === missionTypes.travel || type === missionTypes.moving) {
    return detectDestination(mission).code;
  }

  const text = normalizeForDetection(mission);
  const matched = destinationPatterns.find((destination) => {
    return destination.aliases.some((alias) => text.includes(alias.toLowerCase()));
  });

  return matched?.code || null;
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

const getProvidersForMissionType = (type) => {
  return Object.values(providerCatalog)
    .filter((provider) => provider.missionTypes.includes(type))
    .map((provider) => ({
      id: provider.id,
      name: provider.name,
      category: provider.category,
      status: provider.status,
      requiresApiKey: provider.requiresApiKey,
      requiresCommercialApproval: provider.requiresCommercialApproval,
      freePrototype: provider.freePrototype,
      providers: provider.providers,
      capabilities: provider.capabilities,
      executionPolicy: provider.executionPolicy
    }));
};

const buildProviderResult = (provider, mission) => {
  const ko = mission.language === "ko";

  return {
    id: createId("provider-result"),
    providerId: provider.id,
    name: provider.name,
    category: provider.category,
    status: provider.requiresCommercialApproval ? "demo-data-until-commercial-approval" : "prepared",
    executionBlocked: provider.executionPolicy !== "read_only",
    summary: ko
      ? `${provider.name}가 준비되었습니다. 승인 전에는 실제 예약, 구매, 제출 또는 결제를 실행하지 않습니다.`
      : `${provider.name} is prepared. ONE will not book, purchase, submit, reserve, or pay before approval.`,
    capabilities: provider.capabilities,
    requiresApiKey: provider.requiresApiKey,
    requiresCommercialApproval: provider.requiresCommercialApproval,
    generatedAt: new Date().toISOString()
  };
};

const createExecutionSteps = (type, language) => {
  const ko = language === "ko";

  const stepTemplates = {
    travel: [
      ["prepare-flights", ko ? "항공권 옵션 준비" : "Prepare flight options", "flights"],
      ["prepare-hotels", ko ? "숙소 옵션 준비" : "Prepare hotel options", "hotels"],
      ["prepare-weather", ko ? "날씨 확인 준비" : "Prepare weather check", "weather"],
      ["prepare-currency", ko ? "환율 확인 준비" : "Prepare currency check", "currency"],
      ["prepare-maps", ko ? "지도와 동선 준비" : "Prepare maps and routes", "maps"],
      ["prepare-visa", ko ? "비자 체크리스트 준비" : "Prepare visa checklist", "visa"],
      ["prepare-restaurants", ko ? "식당 옵션 준비" : "Prepare restaurant options", "restaurants"],
      ["prepare-checklist", ko ? "체크리스트 준비" : "Prepare checklist", "checklist"]
    ],
    shopping: [
      ["prepare-products", ko ? "제품 옵션 준비" : "Prepare product options", "products"],
      ["compare-reviews", ko ? "리뷰 비교" : "Compare reviews", "reviews"],
      ["compare-prices", ko ? "가격 비교" : "Compare prices", "price_comparison"],
      ["check-availability", ko ? "재고 확인 준비" : "Prepare availability check", "availability"]
    ],
    legal: [
      ["identify-legal-need", ko ? "법률 이슈 정리" : "Identify legal need", "legal"],
      ["prepare-resources", ko ? "공공 리소스 준비" : "Prepare government resources", "government_resources"],
      ["prepare-lawyer-search", ko ? "변호사 검색 준비" : "Prepare lawyer search", "lawyer_search"],
      ["prepare-document-checklist", ko ? "문서 체크리스트 준비" : "Prepare document checklist", "documents"]
    ],
    healthcare: [
      ["clarify-healthcare-need", ko ? "의료 니즈 정리" : "Clarify healthcare need", "healthcare"],
      ["prepare-hospital-search", ko ? "병원 검색 준비" : "Prepare hospital search", "hospital_search"],
      ["prepare-appointment-options", ko ? "예약 옵션 준비" : "Prepare appointment options", "appointment_handoff"]
    ],
    education: [
      ["define-learning-goal", ko ? "학습 목표 정리" : "Define learning goal", "education"],
      ["prepare-course-search", ko ? "코스 검색 준비" : "Prepare course search", "course_search"],
      ["prepare-learning-plan", ko ? "학습 계획 준비" : "Prepare learning plan", "learning_plan"]
    ],
    finance: [
      ["define-finance-goal", ko ? "금융 목표 정리" : "Define finance goal", "finance"],
      ["compare-finance-options", ko ? "금융 옵션 비교" : "Compare finance options", "bank_compare"],
      ["prepare-risk-checklist", ko ? "리스크 체크리스트 준비" : "Prepare risk checklist", "risk_checklist"]
    ],
    career: [
      ["define-career-goal", ko ? "커리어 목표 정리" : "Define career goal", "career"],
      ["prepare-job-search", ko ? "채용 검색 준비" : "Prepare job search", "job_search"],
      ["prepare-resume", ko ? "이력서 준비" : "Prepare resume", "resume_preparation"],
      ["prepare-application-review", ko ? "지원 검토 준비" : "Prepare application review", "application_handoff"]
    ],
    moving: [
      ["define-moving-scope", ko ? "이사 범위 정리" : "Define moving scope", "moving"],
      ["prepare-housing-search", ko ? "주거 검색 준비" : "Prepare housing search", "housing_search"],
      ["prepare-shipping-compare", ko ? "배송 비교 준비" : "Prepare shipping comparison", "shipping_compare"],
      ["prepare-immigration-checklist", ko ? "이민 체크리스트 준비" : "Prepare immigration checklist", "immigration_checklist"]
    ],
    business: [
      ["define-business-goal", ko ? "사업 목표 정리" : "Define business goal", "business"],
      ["prepare-registration", ko ? "회사 등록 체크리스트 준비" : "Prepare company registration checklist", "company_registration"],
      ["prepare-tax-checklist", ko ? "세금 체크리스트 준비" : "Prepare tax checklist", "tax_checklist"],
      ["prepare-launch-plan", ko ? "런칭 계획 준비" : "Prepare launch plan", "launch_plan"]
    ],
    government: [
      ["identify-government-service", ko ? "필요한 공공 서비스 확인" : "Identify government service", "government"],
      ["prepare-forms", ko ? "서류 준비" : "Prepare forms", "forms"],
      ["prepare-submission-review", ko ? "제출 전 검토 준비" : "Prepare submission review", "submission_review"]
    ],
    lifestyle: [
      ["define-preferences", ko ? "선호도 정리" : "Define preferences", "lifestyle"],
      ["compare-options", ko ? "옵션 비교" : "Compare options", "compare"],
      ["prepare-plan", ko ? "실행 계획 준비" : "Prepare plan", "plan"]
    ],
    general: [
      ["understand-mission", ko ? "미션 분석" : "Understand mission", "general"],
      ["prepare-options", ko ? "옵션 준비" : "Prepare options", "options"],
      ["prepare-plan", ko ? "실행 계획 준비" : "Prepare plan", "plan"]
    ]
  };

  const selectedSteps = stepTemplates[type] || stepTemplates.general;

  return [
    ...selectedSteps.map(([key, label, providerCategory]) => ({
      id: createId("step"),
      key,
      label,
      providerCategory,
      status: "pending",
      approvalRequired: false,
      protectedAction: false,
      editable: true,
      removable: true,
      replaceable: true,
      expandable: true,
      approvable: false
    })),
    {
      id: createId("step"),
      key: "final-review",
      label: ko ? "최종 검토 준비" : "Prepare final review",
      providerCategory: "approval",
      status: "pending",
      approvalRequired: false,
      protectedAction: false,
      editable: false,
      removable: false,
      replaceable: false,
      expandable: true,
      approvable: false
    },
    {
      id: createId("step"),
      key: "await-approval",
      label: ko ? "사용자 승인 대기" : "Await user approval",
      providerCategory: "approval",
      status: "pending",
      approvalRequired: true,
      protectedAction: true,
      editable: false,
      removable: false,
      replaceable: false,
      expandable: true,
      approvable: true
    }
  ];
};

const buildUniversalMissionShell = (mission, type) => {
  const language = activeLanguage;
  const theme = root.getAttribute("data-theme") || "light";
  const country = detectCountryCode(mission, type);
  const providers = getProvidersForMissionType(type);
  const steps = createExecutionSteps(type, language);

  const shell = {
    id: createId(type === "travel" ? "travel" : "mission"),
    version: KASTIZ_ONE_VERSION,
    type,
    subtype: detectMissionSubtype(type),
    status: "prepared",
    originalMission: mission,
    mission,
    slug: createMissionSlug(mission),
    language,
    country,
    countryProfile: country ? countryProfiles[country] || null : null,
    theme,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvalRequired: true,
    approval: {
      status: "review_required",
      explicitApprovalOnly: true,
      approvedAt: null,
      approvalFlow: ["customize", "review", "approve", "execution"],
      blockedActions: protectedActions
    },
    approvalProtection: {
      en: translations.en.approvalProtection,
      ko: translations.ko.approvalProtection
    },
    steps,
    providers,
    providerResults: providers.map((provider) => buildProviderResult(provider, { language })),
    recommendations: [],
    executionPlan: {
      id: createId("execution-plan"),
      mode: "prepare_only_until_approval",
      status: "ready_for_review",
      steps,
      timeline: steps.map((step) => ({
        id: step.id,
        key: step.key,
        label: step.label,
        status: "pending",
        approvalRequired: step.approvalRequired,
        protectedAction: step.protectedAction
      })),
      blockedWithoutApproval: protectedActions,
      canRunWithoutApproval: ["search", "compare", "prepare", "draft", "explain"],
      finalStatus: "awaiting_user_approval"
    },
    resultCards: [],
    architecture: {
      ui: "homepage",
      engine: "universal_mission_engine",
      providerLayer: "provider_registry",
      adapters: providers.map((provider) => provider.id),
      approvalEngine: "explicit_approval_required",
      executionPipeline: "modular_timeline"
    }
  };

  shell.recommendations = buildMissionRecommendations(shell);
  shell.resultCards = buildResultCards(shell);

  return shell;
};

const buildMissionRecommendations = (payload) => {
  const ko = payload.language === "ko";

  return [
    {
      id: createId("recommendation"),
      title: ko ? "ONE 추천 실행 방향" : "ONE recommended direction",
      category: "strategy",
      summary: ko
        ? "먼저 준비와 비교를 완료한 뒤, 최종 검토 화면에서 승인 여부를 결정하는 방식이 가장 안전합니다."
        : "The safest path is to complete preparation and comparison first, then decide approval from the final review screen.",
      confidence: payload.type === "general" ? 0.55 : 0.86,
      editable: true,
      removable: false,
      replaceable: true,
      expandable: true,
      approvable: true
    },
    {
      id: createId("recommendation"),
      title: ko ? "승인 보호 규칙" : "Approval protection rule",
      category: "approval",
      summary: ko
        ? "ONE은 명시적 승인 없이 예약, 구매, 결제, 서명, 제출, 신청을 실행하지 않습니다."
        : "ONE will not book, purchase, pay, sign, reserve, apply, or submit anything without explicit approval.",
      confidence: 1,
      editable: false,
      removable: false,
      replaceable: false,
      expandable: true,
      approvable: false
    }
  ];
};

const buildResultCards = (payload) => {
  return payload.steps.map((step) => ({
    id: createId("card"),
    stepId: step.id,
    key: step.key,
    title: step.label,
    category: step.providerCategory,
    status: "prepared",
    modified: false,
    removed: false,
    approved: false,
    editable: step.editable,
    removable: step.removable,
    replaceable: step.replaceable,
    expandable: step.expandable,
    approvable: step.approvable
  }));
};

const buildTravelMission = (mission) => {
  const payload = buildUniversalMissionShell(mission, missionTypes.travel);
  const destination = detectDestination(mission);
  const durationDays = detectDurationDays(mission);
  const departureCountry = detectDepartureCountry();

  return {
    ...payload,
    destination: {
      country: destination.destination,
      countryKo: destination.destinationKo,
      city: destination.city,
      cityKo: destination.cityKo,
      code: destination.code
    },
    durationDays,
    departureCountry,
    apiReadiness: {
      flights: providerCatalog.flights,
      hotels: providerCatalog.hotels,
      restaurants: providerCatalog.restaurants,
      weather: providerCatalog.weather,
      currency: providerCatalog.currency,
      maps: providerCatalog.maps,
      visa: providerCatalog.visa
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
      editable: true,
      removable: true,
      replaceable: true,
      expandable: true,
      approvable: true,
      executionBlocked: true
    },
    weather: {
      status: "provider-ready",
      message: {
        en: "Weather provider adapter is ready. A live API key can connect OpenWeather before execution.",
        ko: "날씨 제공자 어댑터가 준비되었습니다. 실행 전 OpenWeather API 키를 연결할 수 있습니다."
      },
      providerCandidates: ["OpenWeather API", "WeatherAPI"],
      editable: true,
      expandable: true
    },
    exchangeRate: {
      status: "provider-ready",
      from: "KRW",
      to: countryProfiles[destination.code]?.currency || "JPY",
      message: {
        en: "Currency provider adapter is ready for live exchange-rate checks.",
        ko: "실시간 환율 확인을 위한 환율 제공자 어댑터가 준비되었습니다."
      },
      providerCandidates: ["ExchangeRate API"],
      editable: true,
      expandable: true
    },
    visa: {
      status: "requires-verification",
      message: {
        en: "Entry requirements must be verified before final execution.",
        ko: "최종 실행 전 입국 요건을 반드시 확인해야 합니다."
      },
      providerCandidates: ["Government embassy data", "REST Countries", "Timatic-style API"],
      editable: true,
      expandable: true,
      executionBlocked: true
    },
    checklist: [
      {
        id: "passport",
        en: "Passport",
        ko: "여권",
        required: true,
        editable: true,
        removable: false,
        approved: false
      },
      {
        id: "travel-insurance",
        en: "Travel insurance",
        ko: "여행자 보험",
        required: true,
        editable: true,
        removable: true,
        approved: false
      },
      {
        id: "sim-esim",
        en: "SIM / eSIM",
        ko: "SIM / eSIM",
        required: false,
        editable: true,
        removable: true,
        approved: false
      },
      {
        id: "currency",
        en: "Currency",
        ko: "환전",
        required: true,
        editable: true,
        removable: true,
        approved: false
      },
      {
        id: "transit-card",
        en: "Transit card",
        ko: "교통카드",
        required: false,
        editable: true,
        removable: true,
        approved: false
      },
      {
        id: "hotel-confirmation",
        en: "Hotel confirmation",
        ko: "호텔 예약 확인서",
        required: true,
        editable: true,
        removable: false,
        approved: false
      },
      {
        id: "emergency-contacts",
        en: "Emergency contacts",
        ko: "비상 연락처",
        required: true,
        editable: true,
        removable: false,
        approved: false
      }
    ],
    restaurants: [
      {
        id: "sushi",
        type: "Sushi",
        typeKo: "스시",
        recommendation: "Reservation-ready sushi options near your route.",
        recommendationKo: "동선 근처 예약 가능한 스시 옵션을 준비합니다.",
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
      },
      {
        id: "ramen",
        type: "Ramen",
        typeKo: "라멘",
        recommendation: "Local ramen shortlist based on location and wait time.",
        recommendationKo: "위치와 대기 시간을 기준으로 현지 라멘 후보를 준비합니다.",
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
      },
      {
        id: "wagyu",
        type: "Wagyu",
        typeKo: "와규",
        recommendation: "Premium wagyu options for one special meal.",
        recommendationKo: "특별한 식사를 위한 프리미엄 와규 옵션을 준비합니다.",
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
      },
      {
        id: "izakaya",
        type: "Izakaya",
        typeKo: "이자카야",
        recommendation: "Casual evening options near hotel or station.",
        recommendationKo: "호텔이나 역 근처의 캐주얼한 저녁 옵션을 준비합니다.",
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
      },
      {
        id: "cafe",
        type: "Cafe",
        typeKo: "카페",
        recommendation: "Premium cafes and quiet stops along the itinerary.",
        recommendationKo: "일정 중 들르기 좋은 프리미엄 카페와 조용한 장소를 준비합니다.",
        editable: true,
        removable: true,
        replaceable: true,
        expandable: true,
        approvable: true,
        executionBlocked: true
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
      editable: true,
      expandable: true
    },
    recommendedOption: {
      level: "balanced",
      en: "Balanced quality plan",
      ko: "균형형 품질 플랜",
      reason: {
        en: "Best overall mix of comfort, price control, transport access, and reliable providers.",
        ko: "편안함, 가격 통제, 교통 접근성, 신뢰 가능한 제공업체의 균형이 가장 좋습니다."
      },
      editable: true,
      approvable: true
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

const buildCategoryMission = (mission, type) => {
  const payload = buildUniversalMissionShell(mission, type);
  const ko = payload.language === "ko";

  return {
    ...payload,
    categorySummary: {
      title: ko ? "미션 구조 준비 완료" : "Mission architecture prepared",
      description: ko
        ? "이 미션은 제공자 레이어, 승인 엔진, 실행 파이프라인을 통해 준비됩니다."
        : "This mission is prepared through the provider layer, approval engine, and execution pipeline."
    },
    primaryOptions: payload.providers.map((provider) => ({
      id: createId("option"),
      providerId: provider.id,
      title: provider.name,
      category: provider.category,
      status: provider.requiresCommercialApproval ? "structured-demo-data" : "ready",
      description: ko
        ? "실제 실행 없이 구조화된 준비 데이터를 제공합니다."
        : "Provides structured preparation data without real-world execution.",
      editable: true,
      removable: true,
      replaceable: true,
      expandable: true,
      approvable: true,
      executionBlocked: provider.executionPolicy !== "read_only"
    }))
  };
};

const buildGeneralMission = (mission) => {
  return buildCategoryMission(mission, missionTypes.general);
};

const approvalEngine = {
  requiresApproval(action) {
    const text = normalizeForDetection(action);
    return protectedActions.some((protectedAction) => text.includes(protectedAction.toLowerCase()));
  },
  canExecute(action, mission) {
    if (!this.requiresApproval(action)) {
      return true;
    }

    return mission?.approval?.status === "approved";
  },
  guard(action, mission) {
    const allowed = this.canExecute(action, mission);

    return {
      allowed,
      reason: allowed
        ? "Approved"
        : mission?.language === "ko"
          ? "명시적 승인 전에는 예약, 구매, 결제, 서명, 제출, 신청을 실행할 수 없습니다."
          : "Explicit approval is required before booking, purchasing, paying, signing, reserving, applying, or submitting."
    };
  },
  approve(mission) {
    return {
      ...mission,
      status: "approved_for_execution",
      approval: {
        ...mission.approval,
        status: "approved",
        approvedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };
  }
};

const executionPipeline = {
  create(mission) {
    return {
      id: createId("execution"),
      missionId: mission.id,
      status: "ready",
      startedAt: null,
      completedAt: null,
      timeline: mission.executionPlan.timeline.map((step) => ({
        ...step,
        status: "pending"
      }))
    };
  },
  start(mission) {
    const execution = this.create(mission);
    const nextExecution = {
      ...execution,
      status: "running",
      startedAt: new Date().toISOString()
    };

    sessionStorage.setItem(STORAGE_KEYS.executionState, JSON.stringify(nextExecution));
    return nextExecution;
  },
  updateStep(execution, stepId, status) {
    const nextExecution = {
      ...execution,
      timeline: execution.timeline.map((step) => {
        return step.id === stepId ? { ...step, status } : step;
      })
    };

    if (nextExecution.timeline.every((step) => ["complete", "blocked"].includes(step.status))) {
      nextExecution.status = "awaiting_approval";
      nextExecution.completedAt = new Date().toISOString();
    }

    sessionStorage.setItem(STORAGE_KEYS.executionState, JSON.stringify(nextExecution));
    return nextExecution;
  }
};

const saveMission = (mission) => {
  const cleanMission = normalizeMission(mission);
  const missionType = detectMissionType(cleanMission);
  const payload = missionType === missionTypes.travel
    ? buildTravelMission(cleanMission)
    : missionType === missionTypes.general
      ? buildGeneralMission(cleanMission)
      : buildCategoryMission(cleanMission, missionType);

  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(payload));
  sessionStorage.setItem(STORAGE_KEYS.providerState, JSON.stringify(payload.providerResults));

  const history = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.missionHistory) || "[]");
  const nextHistory = [
    {
      id: payload.id,
      type: payload.type,
      subtype: payload.subtype,
      mission: payload.mission,
      language: payload.language,
      createdAt: payload.createdAt,
      status: payload.status
    },
    ...history.filter((item) => item.id !== payload.id)
  ].slice(0, 12);

  sessionStorage.setItem(STORAGE_KEYS.missionHistory, JSON.stringify(nextHistory));

  if (payload.type === "travel") {
    sessionStorage.setItem(STORAGE_KEYS.travelMission, JSON.stringify(payload));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.travelMission);
  }

  sessionStorage.removeItem(STORAGE_KEYS.results);
  sessionStorage.removeItem(STORAGE_KEYS.executionState);

  return payload;
};

const startMission = (mission) => {
  const cleanMission = normalizeMission(mission);

  if (!cleanMission) {
    missionInput.focus();
    return;
  }

  saveMission(cleanMission);
  body.classList.add("is-transitioning");

  window.setTimeout(() => {
    window.location.href = "loading.html";
  }, 360);
};

const syncInputState = () => {
  if (!missionForm || !missionInput) {
    return;
  }

  const searchBox = missionForm.querySelector(".search-box");

  if (searchBox) {
    searchBox.classList.toggle("has-value", missionInput.value.trim().length > 0);
  }

  if (missionInput.value.trim().length > 0) {
    missionInput.classList.add("has-text");
  } else {
    missionInput.classList.remove("has-text");
  }
};

const closeDropdowns = () => {
  themeDropdown?.classList.remove("is-open");
  languageDropdown?.classList.remove("is-open");
  themeControl?.setAttribute("aria-expanded", "false");
  languageControl?.setAttribute("aria-expanded", "false");
};

const toggleDropdown = (dropdown, control) => {
  if (!dropdown || !control) {
    return;
  }

  const isOpen = dropdown.classList.contains("is-open");

  closeDropdowns();

  if (!isOpen) {
    dropdown.classList.add("is-open");
    control.setAttribute("aria-expanded", "true");
  }
};

themeControl?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleDropdown(themeDropdown, themeControl);
});

languageControl?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleDropdown(languageDropdown, languageControl);
});

document.querySelectorAll("[data-theme-option]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setTheme(button.getAttribute("data-theme-option"));
    closeDropdowns();
  });
});

document.querySelectorAll("[data-language-option]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    setLanguage(button.getAttribute("data-language-option"));
    closeDropdowns();
  });
});

document.addEventListener("click", closeDropdowns);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDropdowns();
  }
});

missionInput?.addEventListener("input", syncInputState);

missionForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  startMission(missionInput.value);
});

window.addEventListener("pageshow", () => {
  body.classList.remove("is-transitioning");
});

window.KastizONE = {
  version: KASTIZ_ONE_VERSION,
  storageKeys: STORAGE_KEYS,
  missionTypes,
  providerCatalog,
  approvalEngine,
  executionPipeline,
  detectMissionType,
  buildTravelMission,
  buildCategoryMission,
  buildGeneralMission,
  saveMission,
  setTheme,
  setLanguage
};

setTheme(getInitialTheme());
setLanguage(getInitialLanguage());
syncInputState();
