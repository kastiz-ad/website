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

const KASTIZ_ONE_VERSION = "V9_MISSION_ENGINE_FREE_API_MVP";

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

const missionTypes = {
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

const approvalMessages = {
  en: "Nothing will be booked, purchased, reserved, signed, submitted, paid for, or legally committed until you approve.",
  ko: "사용자가 승인하기 전에는 예약, 결제, 구매, 서명, 제출 또는 법적 약속이 진행되지 않습니다."
};

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
    code: "JP",
    name: "Japan",
    nameKo: "일본",
    currency: "JPY",
    capital: "Tokyo",
    capitalKo: "도쿄",
    latitude: 35.6762,
    longitude: 139.6503
  },
  KR: {
    code: "KR",
    name: "South Korea",
    nameKo: "대한민국",
    currency: "KRW",
    capital: "Seoul",
    capitalKo: "서울",
    latitude: 37.5665,
    longitude: 126.978
  },
  CA: {
    code: "CA",
    name: "Canada",
    nameKo: "캐나다",
    currency: "CAD",
    capital: "Ottawa",
    capitalKo: "오타와",
    latitude: 45.4215,
    longitude: -75.6972
  },
  US: {
    code: "US",
    name: "United States",
    nameKo: "미국",
    currency: "USD",
    capital: "Washington, D.C.",
    capitalKo: "워싱턴 D.C.",
    latitude: 38.9072,
    longitude: -77.0369
  }
};

const classifierKeywords = {
  travel: {
    en: ["travel", "trip", "vacation", "honeymoon", "flight", "hotel", "japan", "tokyo", "osaka", "kyoto", "airport"],
    ko: ["여행", "일본", "도쿄", "오사카", "교토", "항공권", "호텔", "신혼여행", "공항"],
    subtype: "trip_planning"
  },
  shopping: {
    en: ["buy", "laptop", "phone", "iphone", "macbook", "product", "compare", "cheapest", "best deal"],
    ko: ["구매", "노트북", "핸드폰", "아이폰", "맥북", "제품", "비교", "최저가", "추천"],
    subtype: "product_research"
  },
  housing: {
    en: ["home", "house", "apartment", "rent", "mortgage", "real estate", "property"],
    ko: ["집", "아파트", "전세", "월세", "부동산", "주택담보대출"],
    subtype: "housing_search"
  },
  legal: {
    en: ["lawyer", "legal", "attorney", "divorce", "contract", "lawsuit", "trademark"],
    ko: ["변호사", "법률", "이혼", "계약서", "소송", "상표"],
    subtype: "legal_service_preparation"
  },
  moving: {
    en: ["move", "immigration", "visa", "overseas", "canada", "america", "relocation"],
    ko: ["이주", "이민", "비자", "해외", "캐나다", "미국"],
    subtype: "relocation_preparation"
  },
  business: {
    en: ["business", "company", "startup", "register", "tax", "accountant", "supplier"],
    ko: ["사업", "창업", "회사", "법인", "세금", "회계사", "공급업체"],
    subtype: "business_setup"
  },
  healthcare: {
    en: ["doctor", "dentist", "hospital", "clinic", "checkup", "appointment"],
    ko: ["병원", "의사", "치과", "건강검진", "예약"],
    subtype: "healthcare_search"
  },
  finance: {
    en: ["loan", "mortgage", "savings", "credit card", "investment", "insurance"],
    ko: ["대출", "적금", "신용카드", "투자", "보험"],
    subtype: "financial_comparison"
  },
  career: {
    en: ["job", "resume", "career", "interview", "salary", "recruiter"],
    ko: ["취업", "이직", "이력서", "면접", "연봉"],
    subtype: "career_search"
  },
  lifestyle: {
    en: ["wedding", "restaurant", "event", "birthday", "party", "gym", "trainer"],
    ko: ["결혼식", "식당", "이벤트", "생일", "파티", "헬스장", "트레이너"],
    subtype: "lifestyle_planning"
  }
};

const providerCatalog = {
  travel: [
    provider("Open-Meteo", "weather", "free_live_api", true, false, false),
    provider("Frankfurter", "currency", "free_live_api", true, false, false),
    provider("REST Countries", "country", "free_live_api", true, false, false),
    provider("OpenStreetMap Nominatim", "maps", "free_live_api", true, false, false),
    provider("Wikipedia", "destination_info", "free_live_api", true, false, false),
    provider("Flight Provider Interface", "flights", "prototype_adapter", false, false, true),
    provider("Hotel Provider Interface", "hotels", "prototype_adapter", false, false, true),
    provider("Restaurant Provider Interface", "restaurants", "prototype_adapter", false, false, true)
  ],
  shopping: [
    provider("Product Search Interface", "products", "prototype_adapter", false, false, true),
    provider("Review Provider Interface", "reviews", "prototype_adapter", false, false, true),
    provider("Price Comparison Interface", "price_comparison", "prototype_adapter", false, false, true),
    provider("Retail Availability Interface", "availability", "prototype_adapter", false, false, true)
  ],
  housing: [
    provider("Housing Search Interface", "housing", "prototype_adapter", false, false, true),
    provider("OpenStreetMap Nominatim", "maps", "free_live_api", true, false, false),
    provider("Mortgage Comparison Interface", "mortgage", "prototype_adapter", false, false, true)
  ],
  legal: [
    provider("Legal Service Interface", "lawyer_search", "prototype_adapter", false, false, true),
    provider("Government Resources Interface", "documents", "prototype_adapter", false, false, false)
  ],
  moving: [
    provider("REST Countries", "country", "free_live_api", true, false, false),
    provider("Immigration Resource Interface", "visa", "prototype_adapter", false, false, true),
    provider("Housing Search Interface", "housing", "prototype_adapter", false, false, true),
    provider("Shipping Provider Interface", "shipping", "prototype_adapter", false, false, true)
  ],
  business: [
    provider("Business Registration Interface", "registration", "prototype_adapter", false, false, false),
    provider("Tax / Accounting Interface", "tax", "prototype_adapter", false, false, true),
    provider("Supplier Search Interface", "suppliers", "prototype_adapter", false, false, true),
    provider("Domain / Brand Interface", "brand", "prototype_adapter", false, false, true)
  ],
  healthcare: [
    provider("Clinic Search Interface", "clinic", "prototype_adapter", false, false, true),
    provider("Hospital Search Interface", "hospital", "prototype_adapter", false, false, true),
    provider("Appointment Interface", "appointment", "prototype_adapter", false, false, true),
    provider("OpenStreetMap Nominatim", "maps", "free_live_api", true, false, false)
  ],
  finance: [
    provider("Loan Comparison Interface", "loans", "prototype_adapter", false, false, true),
    provider("Rate Provider Interface", "rates", "prototype_adapter", false, false, true),
    provider("Document Checklist Engine", "documents", "prototype_adapter", false, false, false)
  ],
  career: [
    provider("Job Search Interface", "jobs", "prototype_adapter", false, false, true),
    provider("Resume Engine", "resume", "prototype_adapter", false, false, false),
    provider("Recruiter Interface", "recruiters", "prototype_adapter", false, false, true)
  ],
  lifestyle: [
    provider("Vendor Search Interface", "vendors", "prototype_adapter", false, false, true),
    provider("Timeline Engine", "timeline", "prototype_adapter", false, false, false),
    provider("Budget Engine", "budget", "prototype_adapter", false, false, false),
    provider("Reservation Interface", "reservations", "prototype_adapter", false, false, true)
  ],
  general_mission: [
    provider("Mission Planning Engine", "planning", "prototype_adapter", false, false, false),
    provider("Checklist Engine", "checklist", "prototype_adapter", false, false, false)
  ]
};

let activeLanguage = "en";
let activeMissionIndex = -1;
let rotatorInterval = null;
let firstRotationTimeout = null;

function provider(providerName, category, sourceStatus, liveData, requiresKey, requiresPartnerAccess) {
  return {
    provider: providerName,
    category,
    sourceStatus,
    liveData,
    requiresKey,
    requiresPartnerAccess,
    items: [],
    error: null
  };
}

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

const createMissionId = (type) => {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const detectInputLanguage = (mission) => {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(mission) ? "ko" : activeLanguage;
};

const detectMissionType = (mission) => {
  const text = normalizeForDetection(mission);

  const scores = Object.entries(classifierKeywords).map(([type, config]) => {
    const keywords = [...config.en, ...config.ko];
    const score = keywords.reduce((total, keyword) => {
      return text.includes(keyword.toLowerCase()) ? total + keyword.length : total;
    }, 0);

    return {
      type,
      score
    };
  });

  scores.sort((a, b) => b.score - a.score);

  return scores[0] && scores[0].score > 0 ? scores[0].type : missionTypes.general;
};

const detectSubtype = (type) => {
  return classifierKeywords[type]?.subtype || "general_preparation";
};

const detectCountry = (mission, type) => {
  const text = normalizeForDetection(mission);

  const countryMatches = [
    {
      code: "JP",
      keywords: ["japan", "tokyo", "osaka", "kyoto", "일본", "도쿄", "오사카", "교토"]
    },
    {
      code: "KR",
      keywords: ["korea", "seoul", "busan", "incheon", "한국", "서울", "부산", "인천"]
    },
    {
      code: "CA",
      keywords: ["canada", "toronto", "vancouver", "캐나다", "토론토", "밴쿠버"]
    },
    {
      code: "US",
      keywords: ["america", "usa", "united states", "new york", "미국", "뉴욕"]
    }
  ];

  const matched = countryMatches.find((item) => {
    return item.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });

  if (matched) {
    return matched.code;
  }

  if (type === missionTypes.travel) {
    return "JP";
  }

  return null;
};

const detectIntent = (mission, type) => {
  const ko = activeLanguage === "ko";

  const intentMap = {
    travel: ko ? "여행 계획을 준비하고 비교 옵션을 제안합니다." : "Prepare a trip plan and compare practical options.",
    shopping: ko ? "제품 후보, 가격, 구매 전 체크리스트를 준비합니다." : "Prepare product options, price comparison, and a buying checklist.",
    housing: ko ? "주거 후보, 예산, 계약 전 체크리스트를 준비합니다." : "Prepare housing options, budget assumptions, and a pre-contract checklist.",
    legal: ko ? "법률 서비스 유형, 필요 서류, 질문 리스트를 준비합니다." : "Prepare legal service types, required documents, and questions to ask.",
    moving: ko ? "이주 준비 단계, 비자, 주거, 배송 체크리스트를 준비합니다." : "Prepare relocation steps, visa, housing, and shipping checklist.",
    business: ko ? "사업 시작 단계, 등록, 세금, 공급업체 준비를 구조화합니다." : "Structure business setup, registration, tax, and supplier preparation.",
    healthcare: ko ? "의료기관 후보, 예약 준비, 필요 서류를 준비합니다." : "Prepare clinic options, appointment preparation, and required documents.",
    finance: ko ? "금융 옵션, 필요 서류, 리스크를 비교합니다." : "Compare financial options, documents, and risks.",
    career: ko ? "채용 목표, 이력서, 면접 준비를 구조화합니다." : "Structure job targets, resume, and interview preparation.",
    lifestyle: ko ? "이벤트, 일정, 예산, 예약 준비를 구조화합니다." : "Structure event planning, timeline, budget, and reservation preparation.",
    general_mission: ko ? "요청을 분석하고 실행 가능한 미션 계획으로 정리합니다." : "Analyze the request and structure it into an executable mission plan."
  };

  return intentMap[type] || intentMap.general_mission;
};

const buildAssumptions = (type, country) => {
  const ko = activeLanguage === "ko";

  const common = [
    ko ? "ONE은 준비와 비교만 수행하며 명시적 승인 전에는 실제 실행하지 않습니다." : "ONE prepares and compares only; real-world execution requires explicit approval.",
    ko ? "세부 조건이 없는 경우 균형형 추천을 기본값으로 사용합니다." : "When details are missing, balanced recommendations are used as the default."
  ];

  if (type === missionTypes.travel) {
    common.push(ko ? "정확한 출발일이 없으면 7일 일정으로 가정합니다." : "If dates are missing, ONE assumes a 7-day trip.");
    common.push(ko ? "목적지가 불명확하면 일본 도쿄를 기본 예시로 사용합니다." : "If destination is unclear, Tokyo, Japan is used as the default example.");
  }

  if (type === missionTypes.shopping) {
    common.push(ko ? "예산이 없으면 가성비와 품질의 균형을 우선합니다." : "If budget is missing, ONE prioritizes balanced value and quality.");
  }

  if (type === missionTypes.housing || type === missionTypes.finance) {
    common.push(ko ? "실제 금리와 계약 조건은 최종 단계에서 다시 확인해야 합니다." : "Actual rates and contract terms must be verified before final action.");
  }

  if (country && countryProfiles[country]) {
    common.push(
      ko
        ? `국가 기준은 ${countryProfiles[country].nameKo}로 설정되었습니다.`
        : `Country context is set to ${countryProfiles[country].name}.`
    );
  }

  return common;
};

const buildSteps = (type) => {
  const ko = activeLanguage === "ko";

  const steps = {
    travel: [
      ["flights", ko ? "항공권 옵션 준비" : "Prepare flight options"],
      ["hotels", ko ? "숙소 옵션 준비" : "Prepare hotel options"],
      ["weather", ko ? "날씨 확인" : "Check weather"],
      ["currency", ko ? "환율 확인" : "Check exchange rates"],
      ["visa", ko ? "비자 / 입국 요건 확인" : "Check visa / entry requirements"],
      ["restaurants", ko ? "식당 옵션 준비" : "Prepare restaurant options"],
      ["airport_transfer", ko ? "공항 이동 준비" : "Prepare airport transfer"],
      ["checklist", ko ? "여행 체크리스트 준비" : "Prepare travel checklist"]
    ],
    shopping: [
      ["recommended_product", ko ? "추천 제품 선정" : "Select recommended product"],
      ["alternatives", ko ? "대안 제품 비교" : "Compare alternative products"],
      ["price_comparison", ko ? "가격 비교" : "Compare prices"],
      ["where_to_buy", ko ? "구매처 준비" : "Prepare where to buy"],
      ["warranty", ko ? "보증 확인" : "Check warranty"],
      ["delivery", ko ? "배송 옵션 준비" : "Prepare delivery options"],
      ["checklist", ko ? "구매 전 체크리스트" : "Pre-purchase checklist"]
    ],
    housing: [
      ["requirements", ko ? "주거 조건 정리" : "Define housing requirements"],
      ["areas", ko ? "지역 후보 비교" : "Compare areas"],
      ["budget", ko ? "예산 범위 준비" : "Prepare budget range"],
      ["documents", ko ? "계약 서류 체크리스트" : "Contract document checklist"],
      ["risks", ko ? "계약 리스크 확인" : "Check contract risks"]
    ],
    legal: [
      ["lawyer_type", ko ? "필요한 변호사 유형 정리" : "Define lawyer type"],
      ["documents", ko ? "필요 서류 준비" : "Prepare documents needed"],
      ["process", ko ? "예상 절차 정리" : "Outline estimated process"],
      ["risks", ko ? "리스크 정리" : "Identify risks"],
      ["questions", ko ? "상담 질문 준비" : "Prepare questions to ask"],
      ["checklist", ko ? "법률 체크리스트" : "Legal checklist"]
    ],
    moving: [
      ["visa", ko ? "비자 준비" : "Prepare visa"],
      ["housing", ko ? "주거 옵션 준비" : "Prepare housing"],
      ["shipping", ko ? "배송 옵션 준비" : "Prepare shipping"],
      ["banking", ko ? "은행 준비" : "Prepare banking"],
      ["insurance", ko ? "보험 준비" : "Prepare insurance"],
      ["schools", ko ? "학교 정보 준비" : "Prepare schools"],
      ["checklist", ko ? "이주 체크리스트" : "Moving checklist"]
    ],
    business: [
      ["registration", ko ? "사업자 / 법인 등록 준비" : "Prepare business registration"],
      ["tax", ko ? "세금 / 회계 준비" : "Prepare tax / accounting"],
      ["brand", ko ? "브랜드 / 도메인 준비" : "Prepare brand / domain"],
      ["suppliers", ko ? "공급업체 후보 준비" : "Prepare suppliers"],
      ["budget", ko ? "사업 예산 준비" : "Prepare business budget"],
      ["checklist", ko ? "사업 시작 체크리스트" : "Business checklist"]
    ],
    healthcare: [
      ["clinic", ko ? "병원 / 클리닉 후보 준비" : "Prepare clinic / hospital options"],
      ["appointment", ko ? "예약 준비" : "Prepare appointment"],
      ["documents", ko ? "필요 서류 준비" : "Prepare documents"],
      ["cost", ko ? "예상 비용 준비" : "Prepare cost estimate"],
      ["checklist", ko ? "진료 체크리스트" : "Healthcare checklist"]
    ],
    finance: [
      ["loan_options", ko ? "대출 옵션 준비" : "Prepare loan options"],
      ["rates", ko ? "금리 비교" : "Compare rates"],
      ["documents", ko ? "필요 서류 준비" : "Prepare documents"],
      ["risks", ko ? "리스크 정리" : "Identify risks"],
      ["checklist", ko ? "금융 체크리스트" : "Finance checklist"]
    ],
    career: [
      ["targets", ko ? "채용 목표 정리" : "Prepare job targets"],
      ["resume", ko ? "이력서 준비" : "Prepare resume"],
      ["interview", ko ? "면접 준비" : "Prepare interview"],
      ["recruiters", ko ? "리크루터 후보 준비" : "Prepare recruiters"],
      ["checklist", ko ? "커리어 체크리스트" : "Career checklist"]
    ],
    lifestyle: [
      ["vendors", ko ? "업체 후보 준비" : "Prepare vendors"],
      ["timeline", ko ? "일정 준비" : "Prepare timeline"],
      ["budget", ko ? "예산 준비" : "Prepare budget"],
      ["reservations", ko ? "예약 준비" : "Prepare reservations"],
      ["checklist", ko ? "체크리스트 준비" : "Prepare checklist"]
    ],
    general_mission: [
      ["understand", ko ? "요청 분석" : "Understand request"],
      ["options", ko ? "선택지 준비" : "Prepare options"],
      ["plan", ko ? "실행 계획 준비" : "Prepare action plan"],
      ["checklist", ko ? "체크리스트 준비" : "Prepare checklist"]
    ]
  };

  return (steps[type] || steps.general_mission).map(([id, title], index) => ({
    id,
    title,
    order: index + 1,
    status: "pending",
    editable: true,
    removable: true,
    priority: "Balanced",
    approved: false
  }));
};

const buildRecommendations = (type) => {
  const ko = activeLanguage === "ko";

  const recommendationMap = {
    travel: ko ? "균형형 일정, 직항 중심 항공, 교통 편리한 숙소를 우선 추천합니다." : "Prioritize a balanced itinerary, direct flights, and hotels with strong transport access.",
    shopping: ko ? "최저가만 보지 말고 성능, 보증, 배송, 리뷰 균형을 기준으로 추천합니다." : "Recommend based on performance, warranty, delivery, reviews, and price balance.",
    housing: ko ? "위치, 월 비용, 계약 리스크, 교통 접근성을 함께 비교합니다." : "Compare location, monthly cost, contract risk, and transport access together.",
    legal: ko ? "전문 분야가 맞는 변호사 유형과 상담 전 질문 리스트를 먼저 준비합니다." : "Prepare the right lawyer type and consultation questions first.",
    moving: ko ? "비자, 주거, 은행, 보험, 배송 순서로 준비하는 것이 안전합니다." : "Prepare visa, housing, banking, insurance, and shipping in order.",
    business: ko ? "등록, 세금, 브랜드, 공급업체, 초기 예산 순서로 준비합니다." : "Prepare registration, tax, brand, suppliers, and starting budget in order.",
    healthcare: ko ? "위치, 전문 분야, 비용, 예약 가능성을 기준으로 병원을 비교합니다." : "Compare clinics by location, specialty, cost, and appointment availability.",
    finance: ko ? "금리뿐 아니라 총 비용, 리스크, 필요 서류를 함께 비교합니다." : "Compare total cost, risk, and required documents, not only rates.",
    career: ko ? "목표 직무, 이력서, 면접 준비, 리크루터 접근 순서로 준비합니다." : "Prepare target roles, resume, interview, and recruiter outreach in order.",
    lifestyle: ko ? "예산, 일정, 업체, 예약 리스크를 먼저 정리합니다." : "Start with budget, timeline, vendors, and reservation risks.",
    general_mission: ko ? "요청을 실행 가능한 단계로 나누고 승인 전까지 준비만 진행합니다." : "Break the request into executable steps and prepare only before approval."
  };

  return [
    {
      id: "primary-recommendation",
      title: ko ? "추천 플랜" : "Recommended plan",
      summary: recommendationMap[type] || recommendationMap.general_mission,
      priority: "Balanced",
      editable: true,
      removable: false
    }
  ];
};

const buildBudget = (type) => {
  const budgets = {
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

  return budgets[type] || budgets.general_mission;
};

const buildRisks = (type) => {
  const ko = activeLanguage === "ko";

  const common = [
    ko ? "실제 가격과 가능 여부는 최종 실행 전 다시 확인해야 합니다." : "Actual price and availability must be verified before real-world execution.",
    ko ? "승인 전에는 어떤 계약이나 결제도 진행되지 않습니다." : "No contract or payment happens before approval."
  ];

  const riskMap = {
    travel: ko ? "항공권과 숙소 가격은 빠르게 변동될 수 있습니다." : "Flight and hotel prices can change quickly.",
    shopping: ko ? "최저가 제품은 배송, 보증, 정품 여부를 확인해야 합니다." : "Lowest-price products require delivery, warranty, and authenticity checks.",
    housing: ko ? "계약 조건, 보증금, 관리비, 등기 사항 확인이 필요합니다." : "Contract terms, deposit, fees, and registration details must be checked.",
    legal: ko ? "법률 정보는 일반 준비용이며 최종 판단은 전문가 확인이 필요합니다." : "Legal information is for preparation only and requires professional review.",
    moving: ko ? "비자와 이민 요건은 국가별로 바뀔 수 있습니다." : "Visa and immigration requirements can change by country.",
    business: ko ? "사업 등록, 세금, 허가 요건은 지역별로 다를 수 있습니다." : "Business registration, taxes, and permits may differ by location.",
    healthcare: ko ? "응급 상황에서는 ONE이 아니라 현지 응급 서비스를 이용해야 합니다." : "For emergencies, use local emergency services, not ONE.",
    finance: ko ? "금융 상품은 손실, 이자, 수수료 리스크가 있습니다." : "Financial products can involve loss, interest, and fee risks.",
    career: ko ? "지원서 제출 전 회사와 조건을 직접 확인해야 합니다." : "Company and role conditions must be checked before applying.",
    lifestyle: ko ? "예약 가능 여부와 취소 규정을 확인해야 합니다." : "Availability and cancellation rules must be checked."
  };

  if (riskMap[type]) {
    common.unshift(riskMap[type]);
  }

  return common;
};

const buildMissionCards = (type) => {
  const ko = activeLanguage === "ko";

  const cards = {
    travel: ["Flights", "Hotels", "Weather", "Currency", "Visa", "Restaurants", "Airport Transfer", "Checklist"],
    shopping: ["Recommended Product", "Alternative Products", "Price Comparison", "Where to Buy", "Warranty", "Delivery", "Checklist"],
    housing: ["Housing Options", "Area Comparison", "Budget", "Documents", "Risks", "Checklist"],
    legal: ["Recommended Lawyer Type", "Documents Needed", "Estimated Process", "Risks", "Questions to Ask", "Checklist"],
    business: ["Business Registration", "Tax / Accounting", "Brand / Domain", "Suppliers", "Budget", "Checklist"],
    moving: ["Visa", "Housing", "Shipping", "Banking", "Insurance", "Schools", "Checklist"],
    healthcare: ["Clinic / Hospital", "Appointment Prep", "Documents", "Cost Estimate", "Checklist"],
    finance: ["Loan Options", "Rates", "Documents", "Risks", "Checklist"],
    career: ["Job Targets", "Resume", "Interview Prep", "Recruiters", "Checklist"],
    lifestyle: ["Vendors", "Timeline", "Budget", "Reservations", "Checklist"],
    general_mission: ["Mission Plan", "Options", "Budget", "Risks", "Checklist"]
  };

  const koreanTitles = {
    "Flights": "항공권",
    "Hotels": "숙소",
    "Weather": "날씨",
    "Currency": "환율",
    "Visa": "비자",
    "Restaurants": "식당",
    "Airport Transfer": "공항 이동",
    "Checklist": "체크리스트",
    "Recommended Product": "추천 제품",
    "Alternative Products": "대안 제품",
    "Price Comparison": "가격 비교",
    "Where to Buy": "구매처",
    "Warranty": "보증",
    "Delivery": "배송",
    "Housing Options": "주거 옵션",
    "Area Comparison": "지역 비교",
    "Budget": "예산",
    "Documents": "서류",
    "Risks": "리스크",
    "Recommended Lawyer Type": "추천 변호사 유형",
    "Documents Needed": "필요 서류",
    "Estimated Process": "예상 절차",
    "Questions to Ask": "질문 리스트",
    "Business Registration": "사업자 / 법인 등록",
    "Tax / Accounting": "세금 / 회계",
    "Brand / Domain": "브랜드 / 도메인",
    "Suppliers": "공급업체",
    "Shipping": "배송",
    "Banking": "은행",
    "Insurance": "보험",
    "Schools": "학교",
    "Clinic / Hospital": "병원 / 클리닉",
    "Appointment Prep": "예약 준비",
    "Cost Estimate": "예상 비용",
    "Loan Options": "대출 옵션",
    "Rates": "금리",
    "Job Targets": "채용 목표",
    "Resume": "이력서",
    "Interview Prep": "면접 준비",
    "Recruiters": "리크루터",
    "Vendors": "업체",
    "Timeline": "일정",
    "Reservations": "예약",
    "Mission Plan": "미션 플랜",
    "Options": "선택지"
  };

  return (cards[type] || cards.general_mission).map((title, index) => ({
    id: createMissionSlug(title) || `card-${index + 1}`,
    title: ko ? koreanTitles[title] || title : title,
    originalTitle: title,
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

const buildMissionObject = (rawInput) => {
  const cleanMission = normalizeMission(rawInput);
  const language = detectInputLanguage(cleanMission);

  if (language !== activeLanguage) {
    activeLanguage = language;
    localStorage.setItem(STORAGE_KEYS.language, activeLanguage);
  }

  const type = detectMissionType(cleanMission);
  const country = detectCountry(cleanMission, type);
  const theme = root.getAttribute("data-theme") || "light";

  return {
    id: createMissionId(type),
    version: KASTIZ_ONE_VERSION,
    rawInput: cleanMission,
    type,
    subtype: detectSubtype(type),
    language,
    theme,
    country,
    countryProfile: country ? countryProfiles[country] || null : null,
    createdAt: new Date().toISOString(),
    status: "mission_created",
    approvalRequired: true,
    intent: detectIntent(cleanMission, type),
    assumptions: buildAssumptions(type, country),
    providers: providerCatalog[type] || providerCatalog.general_mission,
    providerResults: [],
    steps: buildSteps(type),
    recommendations: buildRecommendations(type),
    budget: buildBudget(type),
    risks: buildRisks(type),
    cards: buildMissionCards(type),
    priority: "Balanced",
    approvalProtection: {
      required: true,
      message: language === "ko" ? approvalMessages.ko : approvalMessages.en
    },
    executionSimulation: {
      status: "not_started",
      messages: language === "ko"
        ? [
            "선택한 단계를 준비하고 있어요...",
            "최종 요구사항을 확인하고 있어요...",
            "제공자 실행 항목을 준비하고 있어요...",
            "승인 요약을 만들고 있어요...",
            "실제 실행 준비가 완료되었습니다."
          ]
        : [
            "Preparing selected steps...",
            "Checking final requirements...",
            "Preparing provider actions...",
            "Creating approval summary...",
            "Ready for real-world execution."
          ]
    }
  };
};

const saveMission = (mission) => {
  const payload = buildMissionObject(mission);

  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(payload));

  if (payload.type === missionTypes.travel) {
    sessionStorage.setItem(STORAGE_KEYS.travelMission, JSON.stringify(payload));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.travelMission);
  }

  sessionStorage.removeItem(STORAGE_KEYS.results);
  sessionStorage.removeItem(STORAGE_KEYS.enrichedMission);
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
  classifierKeywords,
  providerCatalog,
  buildMissionObject,
  detectMissionType,
  saveMission,
  setTheme,
  setLanguage
};

setTheme(getInitialTheme());
setLanguage(getInitialLanguage());
syncInputState();
