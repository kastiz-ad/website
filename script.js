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

const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  travelMission: "kastiz-one-travel-mission",
  results: "kastiz-one-results"
};

const supportedLanguages = ["en", "ko"];
const supportedThemes = ["light", "gray", "midnight"];

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

  themeControlText.textContent = themeLabels[currentTheme] || themeLabels.light;

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
  missionRotator.classList.add("is-fading");

  window.setTimeout(() => {
    missionRotatorText.textContent = text;
    missionRotator.classList.remove("is-fading");
  }, 260);
};

const resetMissionRotator = () => {
  window.clearInterval(rotatorInterval);
  window.clearTimeout(firstRotationTimeout);

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

  activeMissionIndex = (activeMissionIndex + 1) % missions.length;
  fadeRotatorTo(missions[activeMissionIndex]);
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

const detectMissionType = (mission) => {
  const text = mission.toLowerCase();

  const isTravel = [...travelKeywordMap.en, ...travelKeywordMap.ko].some((keyword) => {
    return text.includes(keyword.toLowerCase());
  });

  return isTravel ? "travel" : "general";
};

const detectDestination = (mission) => {
  const text = mission.toLowerCase();

  const matched = destinationPatterns.find((destination) => {
    return destination.aliases.some((alias) => text.includes(alias.toLowerCase()));
  });

  if (matched) {
    return matched;
  }

  return {
    destination: "Japan",
    destinationKo: "일본",
    city: "Tokyo",
    cityKo: "도쿄",
    aliases: ["japan", "tokyo", "일본", "도쿄"]
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

const buildTravelMission = (mission) => {
  const destination = detectDestination(mission);
  const durationDays = detectDurationDays(mission);
  const departureCountry = detectDepartureCountry();
  const language = activeLanguage;
  const theme = root.getAttribute("data-theme") || "light";

  return {
    id: `travel-${Date.now()}`,
    type: "travel",
    status: "prepared",
    originalMission: mission,
    mission,
    slug: createMissionSlug(mission),
    language,
    theme,
    createdAt: new Date().toISOString(),
    approvalRequired: true,
    approvalProtection: {
      en: "Nothing will be booked, purchased, reserved, signed, or legally committed until you explicitly approve.",
      ko: "사용자가 명확히 승인하기 전까지 예약, 구매, 결제, 서명, 법적 약속은 절대 진행되지 않습니다."
    },
    destination: {
      country: destination.destination,
      countryKo: destination.destinationKo,
      city: destination.city,
      cityKo: destination.cityKo
    },
    durationDays,
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
        providers: ["OpenWeather API", "WeatherAPI"],
        status: "placeholder"
      },
      currency: {
        providers: ["ExchangeRate API"],
        status: "placeholder"
      },
      maps: {
        providers: ["Google Maps", "Naver Maps"],
        status: "placeholder"
      },
      visa: {
        providers: ["Government embassy data", "Timatic-style API"],
        status: "placeholder"
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
      status: "placeholder",
      message: {
        en: "Weather will be checked with a live weather API before execution.",
        ko: "실행 전 실시간 날씨 API로 날씨를 확인합니다."
      },
      providerCandidates: ["OpenWeather API", "WeatherAPI"]
    },
    exchangeRate: {
      status: "placeholder",
      from: "KRW",
      to: "JPY",
      message: {
        en: "Exchange rate will be checked with a live currency API before execution.",
        ko: "실행 전 실시간 환율 API로 환율을 확인합니다."
      },
      providerCandidates: ["ExchangeRate API"]
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
  return {
    id: `mission-${Date.now()}`,
    type: "general",
    status: "prepared",
    mission,
    slug: createMissionSlug(mission),
    language: activeLanguage,
    theme: root.getAttribute("data-theme") || "light",
    createdAt: new Date().toISOString(),
    approvalRequired: true,
    approvalProtection: {
      en: "Nothing will be booked, purchased, reserved, signed, or legally committed until you explicitly approve.",
      ko: "사용자가 명확히 승인하기 전까지 예약, 구매, 결제, 서명, 법적 약속은 절대 진행되지 않습니다."
    }
  };
};

const saveMission = (mission) => {
  const cleanMission = normalizeMission(mission);
  const missionType = detectMissionType(cleanMission);
  const payload = missionType === "travel"
    ? buildTravelMission(cleanMission)
    : buildGeneralMission(cleanMission);

  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(payload));

  if (payload.type === "travel") {
    sessionStorage.setItem(STORAGE_KEYS.travelMission, JSON.stringify(payload));
  } else {
    sessionStorage.removeItem(STORAGE_KEYS.travelMission);
  }

  sessionStorage.removeItem(STORAGE_KEYS.results);
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
  missionForm.querySelector(".search-box").classList.toggle("has-value", missionInput.value.trim().length > 0);

  if (missionInput.value.trim().length > 0) {
    missionInput.classList.add("has-text");
  } else {
    missionInput.classList.remove("has-text");
  }
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

missionInput.addEventListener("input", syncInputState);

missionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startMission(missionInput.value);
});

window.addEventListener("pageshow", () => {
  body.classList.remove("is-transitioning");
});

setTheme(getInitialTheme());
setLanguage(getInitialLanguage());
syncInputState();
