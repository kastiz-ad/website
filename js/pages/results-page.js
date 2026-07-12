const root = document.documentElement;
const missionTitle = document.getElementById("missionTitle");
const missionGrid = document.getElementById("missionGrid");
const bottomActions = document.getElementById("bottomActions");
const makeRealityButton = document.getElementById("makeRealityButton");
const approvalPanel = document.getElementById("approvalPanel");
const approvalList = document.getElementById("approvalList");
const completionMessage = document.getElementById("completionMessage");
const returnCountdown = document.getElementById("returnCountdown");
const returnHomeButton = document.getElementById("returnHomeButton");
const locationText = document.getElementById("locationText");
const additionalServiceInput = document.getElementById("additionalServiceInput");
const addServiceButton = document.getElementById("addServiceButton");
const additionalServiceList = document.getElementById("additionalServiceList");
const additionalServicesForm = document.getElementById("additionalServicesForm");

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
    finalMessage: "Your future is now in motion.",
    returnHomeNow: "Return Home Now",
    returningHome: "Returning to Home in {seconds} seconds...",
    partners: "Partners",
    business: "Business",
    developers: "Developers",
    poweredBy: "Powered by Kastiz",
    privacy: "Privacy",
    terms: "Terms",
    settings: "Settings",
    unknownLocation: "Unknown Location",
    recommended: "Recommended:",
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
    preparedByOne: "ONE이 준비했습니다",
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
    finalMessage: "당신의 미래가 움직이기 시작했습니다.",
    returnHomeNow: "지금 홈으로 돌아가기",
    returningHome: "{seconds}초 후 홈으로 돌아갑니다...",
    partners: "파트너",
    business: "비즈니스",
    developers: "개발자",
    poweredBy: "Kastiz 제공",
    privacy: "개인정보",
    terms: "약관",
    settings: "설정",
    unknownLocation: "알 수 없는 위치",
    recommended: "추천:",
    reason: "추천 이유:",
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
let returnTimer = null;
let remainingSeconds = 60;
let currentResult = null;

const getLanguage = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.language);
  return supportedLanguages.includes(saved) ? saved : "en";
};

const getTheme = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  return supportedThemes.includes(saved) ? saved : "light";
};

const t = (key) => {
  return translations[activeLanguage]?.[key] ?? translations.en[key] ?? "";
};

const localize = (value) => {
  if (typeof value === "string") return value;
  return value?.[activeLanguage] ?? value?.en ?? "";
};

const formatKRW = (value) => {
  if (typeof value !== "number") return value;

  return activeLanguage === "ko"
    ? `${Math.round(value / 10000).toLocaleString("ko-KR")}만 원`
    : `₩${value.toLocaleString("en-US")}`;
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
    gray: "#f4f2ed",
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

const getStoredResult = () => {
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

const makeOptionRow = (key, value) => {
  return `
    <button class="option-row selectable-option" type="button" aria-pressed="true">
      <span class="option-key">✓</span>
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
  return activeLanguage === "ko" ? flight.providerKo || flight.provider : flight.provider;
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

const createMissionCard = ({ id, title, label, value, reason, options, wide = false, editable = true }) => {
  const article = document.createElement("article");
  article.className = "mission-card";
  article.dataset.cardId = id;
  if (editable) article.classList.add("exclusive-choice-card");

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

const createListCard = ({ id, title, label, items, wide = false, editable = true }) => {
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
      ${items.map((item, index) => editable ? `
        <button class="option-row selectable-option" type="button" data-option-index="${index}" aria-pressed="true">
          <span class="option-key">✓</span><span class="option-value">${item}</span>
        </button>
      ` : `<div class="option-row locked-option"><span class="option-key">•</span><span class="option-value">${item}</span></div>`).join("")}
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

  const rows = [
    makeOptionRow(t("budgetFlights"), formatRange(budget?.flights)),
    makeOptionRow(t("budgetHotel"), formatRange(budget?.hotel)),
    makeOptionRow(t("budgetFood"), formatRange(budget?.food)),
    makeOptionRow(t("budgetTransport"), formatRange(budget?.transport)),
    makeOptionRow(t("budgetActivities"), formatRange(budget?.activities)),
    makeOptionRow(t("estimatedTotal"), formatRange(budget?.estimatedTotal))
  ].join("");

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
    hotels: ["Lotte New York Palace", "Hilton New York Midtown", "Hyatt Grand Central New York", "Pod Times Square"],
    transfer: "AirTrain + subway or licensed airport transfer"
  },
  ES: {
    airlines: ["Korean Air", "Iberia", "Lufthansa", "Air France"],
    hotels: ["Hotel Riu Plaza España", "Hyatt Centric Gran Vía Madrid", "NH Collection Madrid", "Room Mate Macarena"],
    transfer: "Airport Express bus, Metro, or licensed airport transfer"
  },
  CO: {
    airlines: ["Avianca", "LATAM Airlines", "American Airlines", "United Airlines"],
    hotels: ["Grand Hyatt Bogotá", "Hilton Bogotá", "Sofitel Bogotá Victoria Regia", "GHL Hotel Capital"],
    transfer: "Authorized airport taxi or pre-arranged airport transfer"
  },
  JP: {
    airlines: ["Korean Air", "Asiana Airlines", "Jeju Air", "Japan Airlines"],
    hotels: ["Hotel Metropolitan Tokyo Marunouchi", "Hilton Tokyo", "Tokyu Stay Shinjuku", "APA Hotel"],
    transfer: "Narita Express or Airport Limousine Bus"
  }
};

function adaptTravelResultToDestination(result) {
  const code = result.country || result.countryProfile?.code || result.destination?.code;
  const profile = destinationPrototypeProfiles[code];
  if (!profile) return result;

  const city = result.destination?.city || result.countryProfile?.capital || "the destination";
  const cityKo = result.destination?.cityKo || result.countryProfile?.capitalKo || city;
  const flights = profile.airlines.map((provider, index) => ({
    ...(result.flights?.[index] || result.flights?.[0] || {}),
    id: `flight-${code.toLowerCase()}-${index + 1}`,
    provider,
    providerKo: provider,
    category: index === 0 ? "recommended" : "alternative",
    reason: index === 0 ? `Recommended prototype option for routes to ${city}.` : `Alternative prototype option for routes to ${city}.`,
    reasonKo: index === 0 ? `${cityKo} 노선의 프로토타입 추천 옵션입니다.` : `${cityKo} 노선의 프로토타입 대안입니다.`
  }));
  const hotels = profile.hotels.map((name, index) => ({
    ...(result.hotels?.[index] || result.hotels?.[0] || {}),
    id: `hotel-${code.toLowerCase()}-${index + 1}`,
    name,
    nameKo: name,
    category: index === 0 ? "recommended" : index === 1 ? "premium" : index === 2 ? "value" : "budget",
    reason: `Prototype accommodation option in ${city}; verify live price and availability before approval.`,
    reasonKo: `${cityKo}의 프로토타입 숙소 옵션이며 승인 전 실제 가격과 예약 가능 여부를 확인합니다.`
  }));

  return {
    ...result,
    flights,
    hotels,
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
  const destinationCode = result.exchangeRate?.to || result.countryProfile?.currency || "JPY";
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

const createScheduleCard = (result) => {
  const schedule = result.schedule;
  if (!schedule?.startDate || !schedule?.endDate) return null;
  const locale = activeLanguage === "ko" ? "ko-KR" : "en-US";
  const formatDate = (value) => new Intl.DateTimeFormat(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date(`${value}T00:00:00`));
  const timeLabels = activeLanguage === "ko"
    ? { any: "시간 무관", morning: "오전 06:00–12:00", afternoon: "오후 12:00–17:00", evening: "저녁 17:00–22:00" }
    : { any: "Any time / No preference", morning: "Morning 06:00–12:00", afternoon: "Afternoon 12:00–17:00", evening: "Evening 17:00–22:00" };
  return createListCard({ id: "schedule", title: activeLanguage === "ko" ? "선택 일정" : "Selected Schedule", label: activeLanguage === "ko" ? "확정" : "Confirmed", items: [
    `${activeLanguage === "ko" ? "시작" : "From"}: ${formatDate(schedule.startDate)}`,
    `${activeLanguage === "ko" ? "종료" : "To"}: ${formatDate(schedule.endDate)}`,
    `${activeLanguage === "ko" ? "시간" : "Time"}: ${timeLabels[schedule.timePreference] || timeLabels.any}`
  ], wide: true, editable: false });
};

const renderTravelMission = (result) => {
  const recommendedFlight = result.flights?.[0];
  const recommendedHotel = result.hotels?.[0];
  const transfer = result.airportTransfer;
  const checklist = result.checklist || [];
  const restaurants = result.restaurants || [];

  missionTitle.textContent = result.display?.title || t("fallbackTitle");
  missionGrid.innerHTML = "";
  const scheduleCard = createScheduleCard(result);
  if (scheduleCard) missionGrid.appendChild(scheduleCard);

  const flightOptions = (result.flights || [])
    .map((flight) => makeOptionRow(getFlightName(flight), formatRange(flight.estimatedPrice)));

  missionGrid.appendChild(
    createMissionCard({
      id: "flights",
      title: activeLanguage === "ko" ? "항공권" : "Flights",
      label: activeLanguage === "ko" ? "추천" : "Recommended",
      value: getFlightName(recommendedFlight),
      reason:
        activeLanguage === "ko"
          ? recommendedFlight?.reasonKo || recommendedFlight?.reason || ""
          : recommendedFlight?.reason || "",
      options: flightOptions,
      editable: true
    })
  );

  const hotelOptions = (result.hotels || [])
    .map((hotel) => makeOptionRow(getHotelName(hotel), formatRange(hotel.estimatedNightlyPrice)));

  missionGrid.appendChild(
    createMissionCard({
      id: "hotel",
      title: activeLanguage === "ko" ? "호텔" : "Hotel",
      label: activeLanguage === "ko" ? "추천" : "Recommended",
      value: getHotelName(recommendedHotel),
      reason:
        activeLanguage === "ko"
          ? recommendedHotel?.reasonKo || recommendedHotel?.reason || ""
          : recommendedHotel?.reason || "",
      options: hotelOptions,
      editable: true
    })
  );

  missionGrid.appendChild(
    createMissionCard({
      id: "airport-transfer",
      title: activeLanguage === "ko" ? "공항 이동" : "Airport Transfer",
      label: activeLanguage === "ko" ? "추천" : "Recommended",
      value: localize(transfer?.recommended),
      reason: localize(transfer?.reason),
      options: [...(transfer?.options || []), { en: "Keisei Skyliner", ko: "게이세이 스카이라이너" }].map((option) => makeOptionRow("•", localize(option))),
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
  missionGrid.appendChild(createVisaVerificationCard(result));

  missionGrid.appendChild(
    createListCard({
      id: "restaurants",
      title: activeLanguage === "ko" ? "레스토랑" : "Restaurants",
      label: activeLanguage === "ko" ? "큐레이션" : "Curated",
      items: restaurants.map((restaurant) => {
        return `${getRestaurantName(restaurant)} — ${getRestaurantRecommendation(restaurant)}`;
      }),
      wide: true,
      editable: true
    })
  );

  missionGrid.appendChild(createBudgetCard(result.budget));

  missionGrid.appendChild(createWeatherForecastCard(result));

  missionGrid.appendChild(createExchangeBudgetCard(result));

  missionGrid.appendChild(createApprovalCard(result));
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

  missionGrid.appendChild(createApprovalCard(result));
};

const renderMission = () => {
  currentResult = normalizeStoredResult(getStoredResult());

  if (currentResult.type === "travel") {
    renderTravelMission(currentResult);
    return;
  }

  renderGeneralMission(currentResult);
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
  const steps = currentResult?.executionSequence?.[activeLanguage] || t("executionSteps");

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

const startReturnCountdown = () => {
  remainingSeconds = 60;
  returnCountdown.textContent = t("returningHome").replace("{seconds}", remainingSeconds);

  returnTimer = window.setInterval(() => {
    remainingSeconds -= 1;
    returnCountdown.textContent = t("returningHome").replace("{seconds}", remainingSeconds);

    if (remainingSeconds <= 0) {
      window.clearInterval(returnTimer);
      returnHome();
    }
  }, 1000);
};

const returnHome = () => {
  document.body.classList.add("is-leaving");

  window.setTimeout(() => {
    window.location.href = "index.html";
  }, 420);
};

const runApprovalSequence = () => {
  const items = [...approvalList.querySelectorAll(".approval-item")];

  makeRealityButton.disabled = true;
  bottomActions.hidden = true;
  approvalPanel.hidden = false;
  approvalPanel.scrollIntoView({ behavior: "smooth", block: "start" });

  items.forEach((item, index) => {
    window.setTimeout(() => {
      item.classList.add("is-complete");
      item.querySelector(".approval-check").textContent = "✓";

      if (index === items.length - 1) {
        window.setTimeout(() => {
          const finalTitle = completionMessage.querySelector("h3");

          if (finalTitle) {
            finalTitle.textContent = localize(currentResult?.finalMessage) || t("finalMessage");
          }

          completionMessage.hidden = false;
          startReturnCountdown();
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
      return;
    }

    const selectable = event.target.closest(".selectable-option");
    if (selectable) {
      const card = selectable.closest(".mission-card");
      const exclusive = card?.classList.contains("exclusive-choice-card") && !card.classList.contains("is-editing");
      if (exclusive) {
        const recommendation = card.querySelector(".selectable-recommendation");
        const recommendedDetail = card.querySelector(".option-list .selectable-option");
        const choosingRecommended = selectable === recommendation || selectable === recommendedDetail;
        card.querySelectorAll(".selectable-option").forEach((option) => {
          const selected = choosingRecommended
            ? option === recommendation || option === recommendedDetail
            : option === selectable;
          option.setAttribute("aria-pressed", String(selected));
          option.classList.toggle("is-excluded", !selected);
          option.querySelector(".option-key").textContent = selected ? "✓" : "+";
        });
        return;
      }
      const included = selectable.getAttribute("aria-pressed") !== "true";
      selectable.setAttribute("aria-pressed", String(included));
      selectable.classList.toggle("is-excluded", !included);
      selectable.querySelector(".option-key").textContent = included ? "✓" : "+";
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

    const picker = card.querySelector("[data-alternatives-for]");
    if (picker && !picker.children.length) {
      const airlineOptions = ["Korean Air", "Asiana Airlines", "Delta Air Lines", "American Airlines", "United Airlines", "Japan Airlines"];
      const hotelOptions = ["Four Seasons", "Rosewood", "Atlantis", "Lotte", "Shilla", "Le Méridien", "Sofitel", "Hyatt", "InterContinental", "JW Marriott", "Hilton", "APA Hotel"];
      const generalOptions = activeLanguage === "ko"
        ? ["추천 옵션", "예산 중심", "품질 중심", "가까운 위치", "프리미엄"]
        : ["Recommended", "Budget", "Best quality", "Nearest", "Premium"];
      const options = cardId === "flights" ? airlineOptions : cardId === "hotel" ? hotelOptions : generalOptions;
      picker.innerHTML = options.map((option) => `<button class="alternative-choice" type="button">${option}</button>`).join("");
    }
    applySimulatedModification(cardId, card, button);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.placeholder = t(element.getAttribute("data-i18n-placeholder"));
  });
};

const addAdditionalService = () => {
  const value = additionalServiceInput?.value.trim();
  if (!value || !additionalServiceList) return;
  const option = document.createElement("button");
  option.className = "option-row selectable-option";
  option.type = "button";
  option.setAttribute("aria-pressed", "true");
  const check = document.createElement("span");
  check.className = "option-key";
  check.textContent = "✓";
  const label = document.createElement("span");
  label.className = "option-value";
  label.textContent = value;
  option.append(check, label);
  additionalServiceList.appendChild(option);
  const saved = JSON.parse(sessionStorage.getItem("kastiz-one-custom-services") || "[]");
  sessionStorage.setItem("kastiz-one-custom-services", JSON.stringify([...saved, value]));
  additionalServiceInput.value = "";
  additionalServiceInput.focus();
};

additionalServicesForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  addAdditionalService();
});

document.addEventListener("click", (event) => {
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
makeRealityButton.addEventListener("click", runApprovalSequence);

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


