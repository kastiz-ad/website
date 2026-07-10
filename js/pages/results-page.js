const root = document.documentElement;
const missionTitle = document.getElementById("missionTitle");
const missionGrid = document.getElementById("missionGrid");
const bottomActions = document.getElementById("bottomActions");
const makeRealityButton = document.getElementById("makeRealityButton");
const customizeButton = document.getElementById("customizeButton");
const approvalPanel = document.getElementById("approvalPanel");
const approvalList = document.getElementById("approvalList");
const completionMessage = document.getElementById("completionMessage");
const returnCountdown = document.getElementById("returnCountdown");
const returnHomeButton = document.getElementById("returnHomeButton");
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
    upgrade: "Upgrade",
    login: "Login",
    missionReady: "Mission Ready",
    preparedByOne: "Prepared by ONE",
    customize: "Customize",
    makeItReality: "Make It Reality",
    withOne: "with ONE",
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
    apiPlaceholder: "Prepared as API-ready placeholder",
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
    makeItReality: "현실로 만들기",
    withOne: "ONE과 함께",
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
    apiPlaceholder: "API 연결 준비용 placeholder",
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

    return result;
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
    <div class="option-row">
      <span class="option-key">${key}</span>
      <span class="option-value">${value}</span>
    </div>
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

  if (wide) {
    article.classList.add("is-wide");
  }

  article.innerHTML = `
    <div class="card-top">
      <h2 class="card-title">${title}</h2>
      <span class="card-label">${label}</span>
    </div>

    <div class="recommendation">
      <p class="recommendation-label">${t("recommended")}</p>
      <p class="recommendation-value">${value}</p>
    </div>

    <p class="recommendation-label">${t("reason")}</p>
    <p class="reason">${reason}</p>

    ${makeOptionList(options)}

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

  if (wide) {
    article.classList.add("is-wide");
  }

  article.innerHTML = `
    <div class="card-top">
      <h2 class="card-title">${title}</h2>
      <span class="card-label">${label}</span>
    </div>

    <div class="option-list">
      ${items.map((item) => makeOptionRow("✓", item)).join("")}
    </div>

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
      <h2 class="card-title">${activeLanguage === "ko" ? "예산" : "Budget"}</h2>
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

const renderTravelMission = (result) => {
  const recommendedFlight = result.flights?.[0];
  const recommendedHotel = result.hotels?.[0];
  const transfer = result.airportTransfer;
  const checklist = result.checklist || [];
  const restaurants = result.restaurants || [];

  missionTitle.textContent = result.display?.title || t("fallbackTitle");
  missionGrid.innerHTML = "";

  const flightOptions = (result.flights || [])
    .slice(1)
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
    .slice(1)
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
      options: (transfer?.options || []).map((option) => makeOptionRow("•", localize(option))),
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
      id: "visa",
      title: t("visa"),
      label: t("verifyVisa"),
      value: activeLanguage === "ko" ? "실행 전 확인 필요" : "Verification required",
      reason: localize(result.visa?.message),
      options: [],
      editable: true
    })
  );

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

  missionGrid.appendChild(
    createPlaceholderCard({
      id: "weather",
      title: t("weather"),
      message: result.weather?.message,
      status: result.weather?.status
    })
  );

  missionGrid.appendChild(
    createPlaceholderCard({
      id: "exchange-rate",
      title: t("exchangeRate"),
      message: result.exchangeRate?.message,
      status: result.exchangeRate?.status
    })
  );

  missionGrid.appendChild(createApprovalCard(result));
};

const renderGeneralMission = (result) => {
  missionTitle.textContent = result.display?.title || result.rawInput || (activeLanguage === "ko" ? "미션 계획" : "Mission Plan");
  missionGrid.innerHTML = "";

  missionGrid.appendChild(createListCard({
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
  customizeButton.disabled = true;
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
    const button = event.target.closest(".modify-button");

    if (!button) return;

    const card = button.closest(".mission-card");
    const cardId = button.getAttribute("data-card-action") || card?.dataset.cardId;

    if (!card || !cardId) return;

    applySimulatedModification(cardId, card, button);
  });

  customizeButton.addEventListener("click", () => {
    document.querySelector(".mission-card")?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });
};

returnHomeButton.addEventListener("click", returnHome);
makeRealityButton.addEventListener("click", runApprovalSequence);

activeLanguage = getLanguage();

document.documentElement.lang = activeLanguage;
document.title = activeLanguage === "ko" ? "Kastiz ONE — 미션 준비 완료" : "Kastiz ONE — Mission Ready";

setTheme();
updateTextContent();
updateLocation();
renderMission();
renderApprovalList();
enableCustomization();


