"use strict";

const KASTIZ_ONE_VERSION = "V9_MASTER_ARCHITECTURE";

const STORAGE_KEYS = Object.freeze({
  THEME: "kastiz.theme",
  LANGUAGE: "kastiz.language",
  ACTIVE_MISSION: "kastiz.activeMission",
  MISSION_HISTORY: "kastiz.missionHistory",
  EXECUTION_STATE: "kastiz.executionState"
});

const SUPPORTED_LANGUAGES = Object.freeze({
  en: {
    code: "en",
    label: "English",
    locale: "en-US"
  },
  ko: {
    code: "ko",
    label: "한국어",
    locale: "ko-KR"
  }
});

const SUPPORTED_THEMES = Object.freeze(["light", "gray", "midnight"]);

const MISSION_TYPES = Object.freeze({
  TRAVEL: "travel",
  SHOPPING: "shopping",
  LEGAL: "legal",
  HEALTHCARE: "healthcare",
  EDUCATION: "education",
  FINANCE: "finance",
  CAREER: "career",
  MOVING: "moving",
  BUSINESS: "business",
  GOVERNMENT: "government",
  LIFESTYLE: "lifestyle",
  GENERAL: "general"
});

const APPROVAL_ACTIONS = Object.freeze([
  "book",
  "purchase",
  "reserve",
  "sign",
  "pay",
  "submit",
  "apply",
  "commit",
  "confirm"
]);

const I18N = Object.freeze({
  en: {
    appName: "ONE",
    heroEyebrow: "Kastiz ONE",
    heroTitle: "Tell ONE what you need.",
    heroSubtitle: "ONE prepares the mission, compares options, explains the plan, and waits for your approval before taking action.",
    inputPlaceholder: "Plan my Japan trip",
    submitLabel: "Start",
    loadingLabel: "Preparing",
    customizeLabel: "Customize",
    makeRealityLabel: "Make It Reality",
    approvalRequired: "Approval required",
    missionReady: "Mission ready",
    languageLabel: "Language",
    themeLabel: "Theme",
    lightTheme: "Light",
    grayTheme: "Gray",
    midnightTheme: "Midnight",
    examples: [
      "Plan my Japan trip",
      "Find a better apartment near work",
      "Compare laptops for design work",
      "Prepare a business launch checklist",
      "Find English courses for my student",
      "Prepare documents for a visa question"
    ],
    safety: {
      approval: "ONE will prepare everything, but will not book, purchase, reserve, sign, pay, or submit anything without your explicit approval."
    }
  },
  ko: {
    appName: "ONE",
    heroEyebrow: "Kastiz ONE",
    heroTitle: "필요한 일을 ONE에게 말하세요.",
    heroSubtitle: "ONE이 미션을 준비하고, 선택지를 비교하고, 계획을 설명한 뒤 승인 전까지 실행하지 않습니다.",
    inputPlaceholder: "일본 여행 계획해줘",
    submitLabel: "시작",
    loadingLabel: "준비 중",
    customizeLabel: "맞춤 설정",
    makeRealityLabel: "현실로 만들기",
    approvalRequired: "승인 필요",
    missionReady: "미션 준비 완료",
    languageLabel: "언어",
    themeLabel: "테마",
    lightTheme: "라이트",
    grayTheme: "그레이",
    midnightTheme: "미드나잇",
    examples: [
      "일본 여행 계획해줘",
      "회사 근처 좋은 집 찾아줘",
      "디자인 작업용 노트북 비교해줘",
      "사업 시작 체크리스트 준비해줘",
      "학생에게 맞는 영어 코스 찾아줘",
      "비자 관련 서류 준비 도와줘"
    ],
    safety: {
      approval: "ONE은 모든 것을 준비하지만, 명시적 승인 없이 예약, 구매, 서명, 결제, 제출을 하지 않습니다."
    }
  }
});

const ProviderRegistry = (() => {
  const providers = new Map();

  function register(provider) {
    if (!provider || !provider.id || !provider.category || typeof provider.prepare !== "function") {
      throw new Error("Invalid provider adapter.");
    }

    providers.set(provider.id, Object.freeze(provider));
  }

  function byCategory(category) {
    return Array.from(providers.values()).filter((provider) => provider.category === category);
  }

  function byMissionType(type) {
    return Array.from(providers.values()).filter((provider) => provider.missionTypes.includes(type));
  }

  function all() {
    return Array.from(providers.values());
  }

  return {
    register,
    byCategory,
    byMissionType,
    all
  };
})();

class ProviderAdapter {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.category = config.category;
    this.missionTypes = config.missionTypes || [];
    this.requiresApiKey = Boolean(config.requiresApiKey);
    this.requiresCommercialApproval = Boolean(config.requiresCommercialApproval);
    this.capabilities = config.capabilities || [];
    this.prepare = config.prepare;
  }
}

function createDemoResult({ providerId, providerName, category, title, summary, items = [], executionBlocked = false }) {
  return {
    id: cryptoSafeId("provider_result"),
    providerId,
    providerName,
    category,
    title,
    summary,
    items,
    executionBlocked,
    status: executionBlocked ? "interface_ready_demo_data" : "ready",
    generatedAt: new Date().toISOString()
  };
}

function registerProviders() {
  const adapters = [
    new ProviderAdapter({
      id: "openweather",
      name: "OpenWeather",
      category: "weather",
      missionTypes: [MISSION_TYPES.TRAVEL, MISSION_TYPES.MOVING, MISSION_TYPES.LIFESTYLE],
      requiresApiKey: true,
      capabilities: ["forecast", "current_weather", "travel_weather"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "openweather",
          providerName: "OpenWeather",
          category: "weather",
          title: t("weatherPrepared", mission.language, "Weather check prepared"),
          summary: mission.language === "ko" ? "API 키 연결 시 목적지 날씨와 여행 시기별 기온을 확인합니다." : "Connect an API key to check destination weather and seasonal conditions.",
          items: [
            { label: "Interface", value: "WeatherProvider.getForecast()" },
            { label: "Approval", value: "No booking or payment" }
          ],
          executionBlocked: true
        })
    }),
    new ProviderAdapter({
      id: "exchangerate",
      name: "ExchangeRate Provider",
      category: "currency",
      missionTypes: [MISSION_TYPES.TRAVEL, MISSION_TYPES.FINANCE, MISSION_TYPES.BUSINESS],
      requiresApiKey: false,
      capabilities: ["currency_conversion", "budget_estimation"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "exchangerate",
          providerName: "ExchangeRate Provider",
          category: "currency",
          title: mission.language === "ko" ? "환율 준비" : "Currency prepared",
          summary: mission.language === "ko" ? "예산 계산과 통화 변환을 위한 환율 모듈이 준비되었습니다." : "Currency conversion is prepared for budget and cost comparison.",
          items: [
            { label: "Base", value: inferCurrencyBase(mission) },
            { label: "Mode", value: "Read-only estimate" }
          ]
        })
    }),
    new ProviderAdapter({
      id: "restcountries",
      name: "REST Countries",
      category: "country",
      missionTypes: [MISSION_TYPES.TRAVEL, MISSION_TYPES.MOVING, MISSION_TYPES.GOVERNMENT, MISSION_TYPES.BUSINESS],
      requiresApiKey: false,
      capabilities: ["country_profile", "capital", "currency", "region"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "restcountries",
          providerName: "REST Countries",
          category: "country",
          title: mission.language === "ko" ? "국가 정보 준비" : "Country profile prepared",
          summary: mission.language === "ko" ? "국가, 통화, 지역, 기본 정보를 구조화할 수 있습니다." : "Country, currency, region, and basic profile data can be structured.",
          items: [
            { label: "Country", value: mission.country || "Auto-detect" },
            { label: "Usage", value: "Mission context" }
          ]
        })
    }),
    new ProviderAdapter({
      id: "nominatim",
      name: "OpenStreetMap Nominatim",
      category: "maps",
      missionTypes: [MISSION_TYPES.TRAVEL, MISSION_TYPES.MOVING, MISSION_TYPES.HEALTHCARE, MISSION_TYPES.EDUCATION, MISSION_TYPES.BUSINESS, MISSION_TYPES.LIFESTYLE],
      requiresApiKey: false,
      capabilities: ["geocoding", "place_search", "area_context"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "nominatim",
          providerName: "OpenStreetMap Nominatim",
          category: "maps",
          title: mission.language === "ko" ? "지도 검색 준비" : "Map search prepared",
          summary: mission.language === "ko" ? "장소 검색, 지역 분석, 거리 계산을 위한 지도 어댑터가 준비되었습니다." : "Map adapter is ready for place search, area context, and location matching.",
          items: [
            { label: "Search", value: "Provider interface only from UI" },
            { label: "Execution", value: "Read-only" }
          ]
        })
    }),
    new ProviderAdapter({
      id: "wikipedia",
      name: "Wikipedia",
      category: "knowledge",
      missionTypes: [MISSION_TYPES.TRAVEL, MISSION_TYPES.EDUCATION, MISSION_TYPES.BUSINESS, MISSION_TYPES.GOVERNMENT, MISSION_TYPES.LIFESTYLE],
      requiresApiKey: false,
      capabilities: ["background_research", "destination_context", "education_context"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "wikipedia",
          providerName: "Wikipedia",
          category: "knowledge",
          title: mission.language === "ko" ? "배경 정보 준비" : "Background research prepared",
          summary: mission.language === "ko" ? "목적지, 기관, 주제에 대한 기본 배경 정보를 준비합니다." : "Prepares background context for destinations, institutions, and topics.",
          items: [
            { label: "Mission", value: mission.type },
            { label: "Mode", value: "Research only" }
          ]
        })
    }),
    new ProviderAdapter({
      id: "google_maps_interface",
      name: "Google Maps Interface",
      category: "maps",
      missionTypes: [MISSION_TYPES.TRAVEL, MISSION_TYPES.MOVING, MISSION_TYPES.HEALTHCARE, MISSION_TYPES.EDUCATION, MISSION_TYPES.BUSINESS, MISSION_TYPES.LIFESTYLE],
      requiresApiKey: true,
      capabilities: ["premium_places", "distance_matrix", "routing"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "google_maps_interface",
          providerName: "Google Maps Interface",
          category: "maps",
          title: mission.language === "ko" ? "Google Maps 인터페이스 준비" : "Google Maps interface prepared",
          summary: mission.language === "ko" ? "API 키 연결 전까지 실제 Google Maps 호출은 하지 않습니다." : "No Google Maps request is made until an API key is connected.",
          items: [
            { label: "API key", value: "Required" },
            { label: "Status", value: "Adapter ready" }
          ],
          executionBlocked: true
        })
    }),
    new ProviderAdapter({
      id: "flights_interface",
      name: "Flight Provider Interface",
      category: "flights",
      missionTypes: [MISSION_TYPES.TRAVEL],
      requiresCommercialApproval: true,
      capabilities: ["flight_search", "fare_compare", "booking_handoff"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "flights_interface",
          providerName: "Flight Provider Interface",
          category: "flights",
          title: mission.language === "ko" ? "항공권 준비" : "Flights prepared",
          summary: mission.language === "ko" ? "항공권 검색 구조는 준비되었지만 실제 예약은 승인 전까지 실행하지 않습니다." : "Flight search architecture is ready, but no booking is executed without approval.",
          items: [
            { label: "Provider", value: "Commercial adapter required" },
            { label: "Action", value: "Prepare only" }
          ],
          executionBlocked: true
        })
    }),
    new ProviderAdapter({
      id: "hotels_interface",
      name: "Hotel Provider Interface",
      category: "hotels",
      missionTypes: [MISSION_TYPES.TRAVEL, MISSION_TYPES.MOVING],
      requiresCommercialApproval: true,
      capabilities: ["hotel_search", "availability", "reservation_handoff"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "hotels_interface",
          providerName: "Hotel Provider Interface",
          category: "hotels",
          title: mission.language === "ko" ? "숙소 준비" : "Hotels prepared",
          summary: mission.language === "ko" ? "숙소 비교 구조는 준비되었지만 실제 예약은 승인 전까지 실행하지 않습니다." : "Hotel comparison is prepared, but no reservation is made without approval.",
          items: [
            { label: "Booking", value: "Blocked until approval" },
            { label: "Data", value: "Structured demo until provider approval" }
          ],
          executionBlocked: true
        })
    }),
    new ProviderAdapter({
      id: "products_interface",
      name: "Product Provider Interface",
      category: "products",
      missionTypes: [MISSION_TYPES.SHOPPING],
      requiresCommercialApproval: true,
      capabilities: ["product_search", "reviews", "price_compare", "availability"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "products_interface",
          providerName: "Product Provider Interface",
          category: "products",
          title: mission.language === "ko" ? "제품 비교 준비" : "Product comparison prepared",
          summary: mission.language === "ko" ? "제품, 리뷰, 가격 비교 구조가 준비되었습니다. 구매는 승인 전까지 차단됩니다." : "Products, reviews, and price comparison are prepared. Purchase is blocked until approval.",
          items: [
            { label: "Purchase", value: "Requires explicit approval" },
            { label: "Status", value: "Provider interface ready" }
          ],
          executionBlocked: true
        })
    }),
    new ProviderAdapter({
      id: "legal_resources_interface",
      name: "Legal Resource Interface",
      category: "legal",
      missionTypes: [MISSION_TYPES.LEGAL, MISSION_TYPES.GOVERNMENT, MISSION_TYPES.BUSINESS],
      requiresCommercialApproval: false,
      capabilities: ["lawyer_search", "government_resources", "document_checklist"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "legal_resources_interface",
          providerName: "Legal Resource Interface",
          category: "legal",
          title: mission.language === "ko" ? "법률 리소스 준비" : "Legal resources prepared",
          summary: mission.language === "ko" ? "법률 정보와 체크리스트를 준비합니다. 법률 문서 제출이나 서명은 승인 전까지 하지 않습니다." : "Legal resources and checklists are prepared. No legal submission or signature occurs without approval.",
          items: [
            { label: "Submission", value: "Blocked" },
            { label: "Role", value: "Information and preparation" }
          ]
        })
    }),
    new ProviderAdapter({
      id: "healthcare_interface",
      name: "Healthcare Provider Interface",
      category: "healthcare",
      missionTypes: [MISSION_TYPES.HEALTHCARE],
      requiresCommercialApproval: true,
      capabilities: ["hospital_search", "clinic_search", "appointment_handoff"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "healthcare_interface",
          providerName: "Healthcare Provider Interface",
          category: "healthcare",
          title: mission.language === "ko" ? "의료 검색 준비" : "Healthcare search prepared",
          summary: mission.language === "ko" ? "병원과 진료 옵션을 준비합니다. 예약은 승인 전까지 실행하지 않습니다." : "Hospital and care options are prepared. Appointments are not made without approval.",
          items: [
            { label: "Appointment", value: "Requires approval" },
            { label: "Emergency", value: "Use local emergency services" }
          ],
          executionBlocked: true
        })
    }),
    new ProviderAdapter({
      id: "jobs_interface",
      name: "Career Provider Interface",
      category: "career",
      missionTypes: [MISSION_TYPES.CAREER],
      requiresCommercialApproval: true,
      capabilities: ["job_search", "resume_review", "application_handoff"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "jobs_interface",
          providerName: "Career Provider Interface",
          category: "career",
          title: mission.language === "ko" ? "커리어 준비" : "Career mission prepared",
          summary: mission.language === "ko" ? "채용 공고, 이력서, 지원 준비 구조가 준비되었습니다. 지원서 제출은 승인 전까지 하지 않습니다." : "Jobs, resume, and application preparation are ready. No application is submitted without approval.",
          items: [
            { label: "Apply", value: "Approval required" },
            { label: "Resume", value: "Editable card" }
          ],
          executionBlocked: true
        })
    }),
    new ProviderAdapter({
      id: "education_interface",
      name: "Education Provider Interface",
      category: "education",
      missionTypes: [MISSION_TYPES.EDUCATION],
      requiresCommercialApproval: false,
      capabilities: ["school_search", "course_search", "learning_plan"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "education_interface",
          providerName: "Education Provider Interface",
          category: "education",
          title: mission.language === "ko" ? "교육 미션 준비" : "Education mission prepared",
          summary: mission.language === "ko" ? "학교, 코스, 학습 계획을 구조화합니다." : "Schools, courses, and learning plans are structured.",
          items: [
            { label: "Plan", value: "Editable" },
            { label: "Enrollment", value: "Approval required" }
          ]
        })
    }),
    new ProviderAdapter({
      id: "finance_interface",
      name: "Finance Provider Interface",
      category: "finance",
      missionTypes: [MISSION_TYPES.FINANCE],
      requiresCommercialApproval: true,
      capabilities: ["bank_compare", "loan_compare", "budget_plan"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "finance_interface",
          providerName: "Finance Provider Interface",
          category: "finance",
          title: mission.language === "ko" ? "금융 미션 준비" : "Finance mission prepared",
          summary: mission.language === "ko" ? "은행, 대출, 예산 비교 구조를 준비합니다. 신청이나 결제는 승인 전까지 하지 않습니다." : "Banking, loan, and budget comparison are prepared. No application or payment is submitted without approval.",
          items: [
            { label: "Financial action", value: "Blocked until approval" },
            { label: "Mode", value: "Preparation only" }
          ],
          executionBlocked: true
        })
    }),
    new ProviderAdapter({
      id: "business_interface",
      name: "Business Provider Interface",
      category: "business",
      missionTypes: [MISSION_TYPES.BUSINESS],
      requiresCommercialApproval: false,
      capabilities: ["company_registration_checklist", "tax_checklist", "launch_plan"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "business_interface",
          providerName: "Business Provider Interface",
          category: "business",
          title: mission.language === "ko" ? "비즈니스 미션 준비" : "Business mission prepared",
          summary: mission.language === "ko" ? "회사 설립, 세금, 런칭 체크리스트를 준비합니다. 제출은 승인 전까지 차단됩니다." : "Company registration, tax, and launch checklists are prepared. Submission is blocked until approval.",
          items: [
            { label: "Submit forms", value: "Approval required" },
            { label: "Checklist", value: "Ready" }
          ]
        })
    }),
    new ProviderAdapter({
      id: "moving_interface",
      name: "Moving Provider Interface",
      category: "moving",
      missionTypes: [MISSION_TYPES.MOVING],
      requiresCommercialApproval: true,
      capabilities: ["immigration_checklist", "shipping_compare", "housing_search"],
      prepare: async (mission) =>
        createDemoResult({
          providerId: "moving_interface",
          providerName: "Moving Provider Interface",
          category: "moving",
          title: mission.language === "ko" ? "이사 미션 준비" : "Moving mission prepared",
          summary: mission.language === "ko" ? "이민, 배송, 주거 검색 구조를 준비합니다. 계약과 결제는 승인 전까지 하지 않습니다." : "Immigration, shipping, and housing search are prepared. Contracts and payment are blocked until approval.",
          items: [
            { label: "Contract", value: "Blocked" },
            { label: "Housing", value: "Compare only" }
          ],
          executionBlocked: true
        })
    })
  ];

  adapters.forEach((adapter) => ProviderRegistry.register(adapter));
}

const MissionClassifier = (() => {
  const patterns = [
    {
      type: MISSION_TYPES.TRAVEL,
      subtype: "trip_planning",
      keywords: [
        "trip",
        "travel",
        "flight",
        "hotel",
        "itinerary",
        "visa",
        "restaurant",
        "vacation",
        "tour",
        "japan",
        "korea",
        "hong kong",
        "macao",
        "여행",
        "항공",
        "호텔",
        "숙소",
        "일정",
        "비자",
        "맛집",
        "일본",
        "한국"
      ]
    },
    {
      type: MISSION_TYPES.SHOPPING,
      subtype: "product_research",
      keywords: [
        "buy",
        "shop",
        "product",
        "laptop",
        "phone",
        "compare price",
        "review",
        "availability",
        "구매",
        "쇼핑",
        "제품",
        "노트북",
        "핸드폰",
        "가격",
        "리뷰",
        "비교"
      ]
    },
    {
      type: MISSION_TYPES.LEGAL,
      subtype: "legal_preparation",
      keywords: [
        "legal",
        "lawyer",
        "contract",
        "lawsuit",
        "rights",
        "agreement",
        "terms",
        "법률",
        "변호사",
        "계약",
        "소송",
        "권리",
        "합의서"
      ]
    },
    {
      type: MISSION_TYPES.HEALTHCARE,
      subtype: "healthcare_search",
      keywords: [
        "doctor",
        "hospital",
        "clinic",
        "dentist",
        "appointment",
        "medicine",
        "health",
        "병원",
        "의사",
        "치과",
        "진료",
        "예약",
        "건강",
        "약"
      ]
    },
    {
      type: MISSION_TYPES.EDUCATION,
      subtype: "learning_plan",
      keywords: [
        "school",
        "course",
        "lesson",
        "student",
        "study",
        "class",
        "worksheet",
        "test",
        "education",
        "학교",
        "코스",
        "수업",
        "학생",
        "공부",
        "학습",
        "시험",
        "교육"
      ]
    },
    {
      type: MISSION_TYPES.FINANCE,
      subtype: "financial_preparation",
      keywords: [
        "bank",
        "loan",
        "investment",
        "stock",
        "budget",
        "insurance",
        "finance",
        "tax",
        "은행",
        "대출",
        "투자",
        "주식",
        "예산",
        "보험",
        "금융",
        "세금"
      ]
    },
    {
      type: MISSION_TYPES.CAREER,
      subtype: "career_growth",
      keywords: [
        "job",
        "career",
        "resume",
        "cv",
        "interview",
        "apply",
        "hire",
        "work",
        "직업",
        "커리어",
        "이력서",
        "면접",
        "지원",
        "취업",
        "채용"
      ]
    },
    {
      type: MISSION_TYPES.MOVING,
      subtype: "relocation",
      keywords: [
        "move",
        "moving",
        "relocate",
        "apartment",
        "housing",
        "shipping",
        "immigration",
        "이사",
        "이민",
        "집",
        "아파트",
        "배송",
        "주거",
        "거주"
      ]
    },
    {
      type: MISSION_TYPES.BUSINESS,
      subtype: "business_operations",
      keywords: [
        "business",
        "company",
        "startup",
        "register company",
        "taxes",
        "launch",
        "market",
        "사업",
        "회사",
        "창업",
        "법인",
        "등록",
        "런칭",
        "시장"
      ]
    },
    {
      type: MISSION_TYPES.GOVERNMENT,
      subtype: "government_services",
      keywords: [
        "government",
        "permit",
        "license",
        "form",
        "document",
        "embassy",
        "immigration office",
        "정부",
        "허가",
        "면허",
        "서류",
        "문서",
        "대사관",
        "출입국"
      ]
    },
    {
      type: MISSION_TYPES.LIFESTYLE,
      subtype: "life_planning",
      keywords: [
        "routine",
        "gym",
        "fitness",
        "restaurant",
        "cafe",
        "date",
        "hobby",
        "plan my day",
        "루틴",
        "헬스",
        "운동",
        "카페",
        "데이트",
        "취미",
        "하루 계획"
      ]
    }
  ];

  function classify(input, language) {
    const normalized = normalizeText(input);
    const scored = patterns.map((pattern) => {
      const score = pattern.keywords.reduce((total, keyword) => {
        return normalized.includes(normalizeText(keyword)) ? total + keyword.length : total;
      }, 0);

      return {
        type: pattern.type,
        subtype: pattern.subtype,
        score
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];

    if (!best || best.score === 0) {
      return {
        type: MISSION_TYPES.GENERAL,
        subtype: "general_preparation",
        confidence: 0.35,
        language
      };
    }

    return {
      type: best.type,
      subtype: best.subtype,
      confidence: Math.min(0.96, 0.5 + best.score / 80),
      language
    };
  }

  return {
    classify
  };
})();

const MissionSchema = (() => {
  function create({ input, language }) {
    const classification = MissionClassifier.classify(input, language);
    const country = inferCountry(input);
    const type = classification.type;
    const providers = ProviderRegistry.byMissionType(type).map((provider) => ({
      id: provider.id,
      name: provider.name,
      category: provider.category,
      requiresApiKey: provider.requiresApiKey,
      requiresCommercialApproval: provider.requiresCommercialApproval,
      capabilities: provider.capabilities
    }));

    const steps = createMissionSteps(type, language);
    const executionPlan = createExecutionPlan(type, language, steps);

    return {
      id: cryptoSafeId("mission"),
      version: KASTIZ_ONE_VERSION,
      originalInput: input,
      type,
      subtype: classification.subtype,
      language,
      country,
      approvalRequired: true,
      approval: {
        status: "awaiting_review",
        requiredBefore: APPROVAL_ACTIONS,
        explicitApprovalOnly: true,
        approvedAt: null
      },
      classifier: {
        confidence: classification.confidence,
        engine: "kastiz-one-universal-classifier"
      },
      steps,
      providers,
      recommendations: [],
      executionPlan,
      status: "created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function validate(mission) {
    return Boolean(
      mission &&
        mission.id &&
        mission.type &&
        mission.language &&
        Array.isArray(mission.steps) &&
        Array.isArray(mission.providers) &&
        Array.isArray(mission.recommendations) &&
        mission.executionPlan &&
        mission.approvalRequired === true
    );
  }

  return {
    create,
    validate
  };
})();

const MissionEngine = (() => {
  async function createMission(input, options = {}) {
    const language = options.language || getCurrentLanguage();
    const cleanInput = String(input || "").trim();

    if (!cleanInput) {
      throw new Error("Mission input is required.");
    }

    const mission = MissionSchema.create({
      input: cleanInput,
      language
    });

    mission.status = "preparing";
    mission.updatedAt = new Date().toISOString();

    const providerResults = await prepareProviders(mission);

    mission.recommendations = createRecommendations(mission, providerResults);
    mission.executionPlan.providerResults = providerResults;
    mission.status = "ready_for_review";
    mission.updatedAt = new Date().toISOString();

    persistMission(mission);

    return mission;
  }

  async function prepareProviders(mission) {
    const providers = ProviderRegistry.byMissionType(mission.type);

    const results = [];

    for (const provider of providers) {
      try {
        const result = await provider.prepare(mission);
        results.push(result);
      } catch (error) {
        results.push({
          id: cryptoSafeId("provider_error"),
          providerId: provider.id,
          providerName: provider.name,
          category: provider.category,
          title: "Provider unavailable",
          summary: error.message || "Provider failed safely.",
          items: [],
          executionBlocked: true,
          status: "error",
          generatedAt: new Date().toISOString()
        });
      }
    }

    return results;
  }

  function customizeMission(mission, updates = {}) {
    const nextMission = {
      ...mission,
      ...updates,
      updatedAt: new Date().toISOString(),
      status: "customized"
    };

    persistMission(nextMission);
    return nextMission;
  }

  function approveMission(mission) {
    const nextMission = {
      ...mission,
      approval: {
        ...mission.approval,
        status: "approved_for_preparation",
        approvedAt: new Date().toISOString()
      },
      status: "approved_for_execution",
      updatedAt: new Date().toISOString()
    };

    persistMission(nextMission);
    return nextMission;
  }

  return {
    createMission,
    customizeMission,
    approveMission
  };
})();

const ApprovalEngine = (() => {
  function requiresApproval(action) {
    const normalized = normalizeText(action);
    return APPROVAL_ACTIONS.some((blockedAction) => normalized.includes(blockedAction));
  }

  function canExecute(action, mission) {
    if (!requiresApproval(action)) {
      return true;
    }

    return Boolean(mission && mission.approval && mission.approval.status === "approved_for_preparation");
  }

  function guard(action, mission) {
    if (!canExecute(action, mission)) {
      return {
        allowed: false,
        reason:
          mission.language === "ko"
            ? "명시적 승인 전에는 예약, 구매, 서명, 결제, 제출을 실행할 수 없습니다."
            : "Explicit approval is required before booking, purchasing, signing, paying, reserving, or submitting."
      };
    }

    return {
      allowed: true,
      reason: "Approved"
    };
  }

  return {
    requiresApproval,
    canExecute,
    guard
  };
})();

const ExecutionPipeline = (() => {
  function createTimeline(mission) {
    const baseSteps = mission.executionPlan.steps.map((step) => ({
      id: step.id,
      label: step.label,
      status: "pending",
      protectedAction: Boolean(step.protectedAction),
      approvalRequired: Boolean(step.approvalRequired)
    }));

    return {
      id: cryptoSafeId("execution"),
      missionId: mission.id,
      status: "ready",
      steps: baseSteps,
      startedAt: null,
      completedAt: null
    };
  }

  function start(mission) {
    const timeline = createTimeline(mission);
    timeline.status = "running";
    timeline.startedAt = new Date().toISOString();

    sessionStorage.setItem(STORAGE_KEYS.EXECUTION_STATE, JSON.stringify(timeline));

    return timeline;
  }

  function markStep(timeline, stepId, status) {
    const nextTimeline = {
      ...timeline,
      steps: timeline.steps.map((step) => (step.id === stepId ? { ...step, status } : step))
    };

    if (nextTimeline.steps.every((step) => step.status === "complete" || step.status === "blocked")) {
      nextTimeline.status = "awaiting_final_approval";
      nextTimeline.completedAt = new Date().toISOString();
    }

    sessionStorage.setItem(STORAGE_KEYS.EXECUTION_STATE, JSON.stringify(nextTimeline));

    return nextTimeline;
  }

  return {
    createTimeline,
    start,
    markStep
  };
})();

function createMissionSteps(type, language) {
  const ko = language === "ko";

  const commonFinal = [
    {
      id: cryptoSafeId("step"),
      key: "final_review",
      label: ko ? "최종 검토 준비" : "Prepare final review",
      status: "pending",
      approvalRequired: false,
      protectedAction: false
    },
    {
      id: cryptoSafeId("step"),
      key: "await_approval",
      label: ko ? "사용자 승인 대기" : "Await user approval",
      status: "pending",
      approvalRequired: true,
      protectedAction: true
    }
  ];

  const stepsByType = {
    [MISSION_TYPES.TRAVEL]: [
      { key: "prepare_flights", label: ko ? "항공권 옵션 준비" : "Prepare flight options" },
      { key: "prepare_hotels", label: ko ? "숙소 옵션 준비" : "Prepare hotel options" },
      { key: "prepare_weather", label: ko ? "날씨 확인 준비" : "Prepare weather check" },
      { key: "prepare_restaurants", label: ko ? "식당 옵션 준비" : "Prepare restaurant options" },
      { key: "prepare_visa", label: ko ? "비자 체크리스트 준비" : "Prepare visa checklist" },
      { key: "prepare_itinerary", label: ko ? "일정표 준비" : "Prepare itinerary" }
    ],
    [MISSION_TYPES.SHOPPING]: [
      { key: "prepare_products", label: ko ? "제품 옵션 준비" : "Prepare product options" },
      { key: "compare_reviews", label: ko ? "리뷰 비교" : "Compare reviews" },
      { key: "compare_prices", label: ko ? "가격 비교" : "Compare prices" },
      { key: "check_availability", label: ko ? "재고 확인 준비" : "Prepare availability check" }
    ],
    [MISSION_TYPES.LEGAL]: [
      { key: "identify_issue", label: ko ? "법률 이슈 정리" : "Identify legal issue" },
      { key: "prepare_resources", label: ko ? "공공 리소스 준비" : "Prepare public resources" },
      { key: "prepare_checklist", label: ko ? "서류 체크리스트 준비" : "Prepare document checklist" },
      { key: "lawyer_search", label: ko ? "변호사 검색 준비" : "Prepare lawyer search" }
    ],
    [MISSION_TYPES.HEALTHCARE]: [
      { key: "clarify_need", label: ko ? "의료 니즈 정리" : "Clarify healthcare need" },
      { key: "hospital_search", label: ko ? "병원 검색 준비" : "Prepare hospital search" },
      { key: "appointment_options", label: ko ? "예약 옵션 준비" : "Prepare appointment options" }
    ],
    [MISSION_TYPES.EDUCATION]: [
      { key: "define_goal", label: ko ? "학습 목표 정리" : "Define learning goal" },
      { key: "course_search", label: ko ? "코스 검색 준비" : "Prepare course search" },
      { key: "learning_plan", label: ko ? "학습 계획 준비" : "Prepare learning plan" }
    ],
    [MISSION_TYPES.FINANCE]: [
      { key: "define_budget", label: ko ? "예산 기준 정리" : "Define budget criteria" },
      { key: "compare_options", label: ko ? "금융 옵션 비교" : "Compare finance options" },
      { key: "risk_checklist", label: ko ? "리스크 체크리스트 준비" : "Prepare risk checklist" }
    ],
    [MISSION_TYPES.CAREER]: [
      { key: "career_goal", label: ko ? "커리어 목표 정리" : "Define career goal" },
      { key: "job_search", label: ko ? "채용 검색 준비" : "Prepare job search" },
      { key: "resume_prepare", label: ko ? "이력서 준비" : "Prepare resume" },
      { key: "application_review", label: ko ? "지원 검토 준비" : "Prepare application review" }
    ],
    [MISSION_TYPES.MOVING]: [
      { key: "moving_scope", label: ko ? "이사 범위 정리" : "Define moving scope" },
      { key: "housing_search", label: ko ? "주거 검색 준비" : "Prepare housing search" },
      { key: "shipping_compare", label: ko ? "배송 비교 준비" : "Prepare shipping comparison" },
      { key: "immigration_checklist", label: ko ? "이민 체크리스트 준비" : "Prepare immigration checklist" }
    ],
    [MISSION_TYPES.BUSINESS]: [
      { key: "business_goal", label: ko ? "사업 목표 정리" : "Define business goal" },
      { key: "registration_checklist", label: ko ? "회사 등록 체크리스트 준비" : "Prepare registration checklist" },
      { key: "tax_checklist", label: ko ? "세금 체크리스트 준비" : "Prepare tax checklist" },
      { key: "launch_plan", label: ko ? "런칭 계획 준비" : "Prepare launch plan" }
    ],
    [MISSION_TYPES.GOVERNMENT]: [
      { key: "identify_form", label: ko ? "필요 서류 확인" : "Identify required forms" },
      { key: "prepare_documents", label: ko ? "문서 준비" : "Prepare documents" },
      { key: "submission_review", label: ko ? "제출 전 검토 준비" : "Prepare submission review" }
    ],
    [MISSION_TYPES.LIFESTYLE]: [
      { key: "define_preference", label: ko ? "선호도 정리" : "Define preferences" },
      { key: "compare_options", label: ko ? "옵션 비교" : "Compare options" },
      { key: "prepare_plan", label: ko ? "실행 계획 준비" : "Prepare plan" }
    ],
    [MISSION_TYPES.GENERAL]: [
      { key: "understand_request", label: ko ? "요청 분석" : "Understand request" },
      { key: "prepare_options", label: ko ? "옵션 준비" : "Prepare options" },
      { key: "prepare_plan", label: ko ? "계획 준비" : "Prepare plan" }
    ]
  };

  const selected = stepsByType[type] || stepsByType[MISSION_TYPES.GENERAL];

  return [
    ...selected.map((step) => ({
      id: cryptoSafeId("step"),
      key: step.key,
      label: step.label,
      status: "pending",
      approvalRequired: false,
      protectedAction: false
    })),
    ...commonFinal
  ];
}

function createExecutionPlan(type, language, steps) {
  return {
    id: cryptoSafeId("plan"),
    type,
    language,
    mode: "prepare_only_until_approval",
    canExecuteWithoutApproval: ["search", "compare", "prepare", "explain", "draft"],
    blockedWithoutApproval: APPROVAL_ACTIONS,
    steps,
    providerResults: [],
    finalStatus: "awaiting_approval"
  };
}

function createRecommendations(mission, providerResults) {
  const ko = mission.language === "ko";

  const primary = {
    id: cryptoSafeId("recommendation"),
    title: ko ? "ONE 추천 실행 방향" : "ONE recommended direction",
    category: "strategy",
    summary: ko
      ? "먼저 안전하게 비교와 준비를 끝낸 뒤, 최종 검토 화면에서 승인 여부를 결정하는 방식이 가장 안전합니다."
      : "The safest path is to complete preparation and comparison first, then decide approval from the final review screen.",
    confidence: mission.classifier.confidence,
    editable: true,
    removable: false,
    approvable: true,
    sourceProviderIds: providerResults.map((result) => result.providerId)
  };

  const safety = {
    id: cryptoSafeId("recommendation"),
    title: ko ? "승인 보호 규칙" : "Approval protection rule",
    category: "approval",
    summary: ko
      ? "ONE은 예약, 구매, 결제, 서명, 제출을 명시적 승인 없이 실행하지 않습니다."
      : "ONE will not book, purchase, pay, sign, reserve, or submit anything without explicit approval.",
    confidence: 1,
    editable: false,
    removable: false,
    approvable: false,
    sourceProviderIds: []
  };

  return [primary, safety];
}

function persistMission(mission) {
  sessionStorage.setItem(STORAGE_KEYS.ACTIVE_MISSION, JSON.stringify(mission));

  const history = safeJsonParse(sessionStorage.getItem(STORAGE_KEYS.MISSION_HISTORY), []);
  const nextHistory = [mission, ...history.filter((item) => item.id !== mission.id)].slice(0, 12);
  sessionStorage.setItem(STORAGE_KEYS.MISSION_HISTORY, JSON.stringify(nextHistory));
}

function getActiveMission() {
  return safeJsonParse(sessionStorage.getItem(STORAGE_KEYS.ACTIVE_MISSION), null);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, " ")
    .trim();
}

function inferLanguageFromInput(input) {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(String(input || "")) ? "ko" : getCurrentLanguage();
}

function inferCountry(input) {
  const normalized = normalizeText(input);

  const countries = [
    { match: ["japan", "tokyo", "osaka", "kyoto", "일본", "도쿄", "오사카", "교토"], value: "JP" },
    { match: ["korea", "seoul", "busan", "incheon", "한국", "서울", "부산", "인천"], value: "KR" },
    { match: ["usa", "america", "new york", "los angeles", "미국", "뉴욕"], value: "US" },
    { match: ["china", "beijing", "shanghai", "중국", "베이징", "상하이"], value: "CN" },
    { match: ["hong kong", "홍콩"], value: "HK" },
    { match: ["macao", "macau", "마카오"], value: "MO" },
    { match: ["canada", "toronto", "vancouver", "캐나다"], value: "CA" },
    { match: ["mexico", "멕시코"], value: "MX" },
    { match: ["guatemala", "과테말라"], value: "GT" },
    { match: ["philippines", "필리핀"], value: "PH" }
  ];

  const found = countries.find((country) => country.match.some((keyword) => normalized.includes(normalizeText(keyword))));

  return found ? found.value : null;
}

function inferCurrencyBase(mission) {
  if (mission.country === "KR") return "KRW";
  if (mission.country === "JP") return "JPY";
  if (mission.country === "US") return "USD";
  if (mission.country === "HK") return "HKD";
  if (mission.country === "MO") return "MOP";
  return "KRW";
}

function cryptoSafeId(prefix) {
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}_${random}`;
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getCurrentLanguage() {
  const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
  if (stored && SUPPORTED_LANGUAGES[stored]) return stored;

  const htmlLanguage = document.documentElement.dataset.language;
  if (htmlLanguage && SUPPORTED_LANGUAGES[htmlLanguage]) return htmlLanguage;

  return "en";
}

function setLanguage(language) {
  const nextLanguage = SUPPORTED_LANGUAGES[language] ? language : "en";
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, nextLanguage);
  document.documentElement.lang = nextLanguage === "ko" ? "ko" : "en";
  document.documentElement.dataset.language = nextLanguage;
  applyTranslations(nextLanguage);
  updateMissionRotator(nextLanguage);
}

function getCurrentTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  return SUPPORTED_THEMES.includes(stored) ? stored : "light";
}

function setTheme(theme) {
  const nextTheme = SUPPORTED_THEMES.includes(theme) ? theme : "light";
  localStorage.setItem(STORAGE_KEYS.THEME, nextTheme);
  document.documentElement.dataset.theme = nextTheme;
}

function t(key, language = getCurrentLanguage(), fallback = "") {
  const keys = key.split(".");
  let current = I18N[language] || I18N.en;

  for (const part of keys) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return fallback || key;
    }

    current = current[part];
  }

  return typeof current === "string" ? current : fallback || key;
}

function applyTranslations(language = getCurrentLanguage()) {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = t(element.dataset.i18n, language);
    if (value) element.textContent = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const value = t(element.dataset.i18nPlaceholder, language);
    if (value) element.setAttribute("placeholder", value);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const value = t(element.dataset.i18nAria, language);
    if (value) element.setAttribute("aria-label", value);
  });
}

function updateMissionRotator(language = getCurrentLanguage()) {
  const rotator = document.querySelector("[data-mission-rotator]");
  if (!rotator) return;

  const examples = I18N[language]?.examples || I18N.en.examples;
  let index = Number(rotator.dataset.index || 0);

  rotator.textContent = examples[index % examples.length];
  rotator.dataset.index = String((index + 1) % examples.length);
}

function bindThemeControls() {
  const controls = document.querySelectorAll("[data-theme-option], [data-theme-select]");

  controls.forEach((control) => {
    if (control.matches("select")) {
      control.value = getCurrentTheme();
      control.addEventListener("change", () => setTheme(control.value));
      return;
    }

    control.addEventListener("click", () => {
      const theme = control.dataset.themeOption;
      setTheme(theme);
    });
  });
}

function bindLanguageControls() {
  const controls = document.querySelectorAll("[data-language-option], [data-language-select]");

  controls.forEach((control) => {
    if (control.matches("select")) {
      control.value = getCurrentLanguage();
      control.addEventListener("change", () => setLanguage(control.value));
      return;
    }

    control.addEventListener("click", () => {
      const language = control.dataset.languageOption;
      setLanguage(language);
    });
  });
}

function bindMissionForm() {
  const forms = document.querySelectorAll("[data-mission-form]");

  forms.forEach((form) => {
    const input = form.querySelector("[data-mission-input]");
    const button = form.querySelector("[data-mission-submit]");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const value = input ? input.value.trim() : "";
      if (!value) {
        input?.focus();
        return;
      }

      const detectedLanguage = inferLanguageFromInput(value);
      setLanguage(detectedLanguage);

      if (button) {
        button.disabled = true;
        button.dataset.originalText = button.textContent || "";
        button.textContent = t("loadingLabel", detectedLanguage, "Preparing");
      }

      try {
        const mission = await MissionEngine.createMission(value, {
          language: detectedLanguage
        });

        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_MISSION, JSON.stringify(mission));
        document.body.classList.add("is-leaving");

        window.setTimeout(() => {
          window.location.href = "loading.html";
        }, 260);
      } catch (error) {
        console.error(error);
        if (button) {
          button.disabled = false;
          button.textContent = button.dataset.originalText || t("submitLabel", detectedLanguage, "Start");
        }
      }
    });
  });
}

function bindExampleMissions() {
  document.querySelectorAll("[data-example-mission]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.querySelector("[data-mission-input]");
      const value = button.dataset.exampleMission || button.textContent.trim();

      if (input) {
        input.value = value;
        input.focus();
      }
    });
  });
}

function bindNavigationTransitions() {
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");

    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      return;
    }

    link.addEventListener("click", (event) => {
      const target = link.getAttribute("target");
      if (target === "_blank") return;

      event.preventDefault();
      document.body.classList.add("is-leaving");

      window.setTimeout(() => {
        window.location.href = href;
      }, 220);
    });
  });
}

function exposeArchitecture() {
  window.KastizONE = Object.freeze({
    version: KASTIZ_ONE_VERSION,
    MissionEngine,
    MissionClassifier,
    MissionSchema,
    ProviderRegistry,
    ApprovalEngine,
    ExecutionPipeline,
    storageKeys: STORAGE_KEYS,
    missionTypes: MISSION_TYPES,
    getActiveMission,
    setTheme,
    setLanguage
  });
}

function initializeApp() {
  registerProviders();

  setTheme(getCurrentTheme());
  setLanguage(getCurrentLanguage());

  bindThemeControls();
  bindLanguageControls();
  bindMissionForm();
  bindExampleMissions();
  bindNavigationTransitions();
  exposeArchitecture();

  updateMissionRotator(getCurrentLanguage());

  window.setInterval(() => {
    updateMissionRotator(getCurrentLanguage());
  }, 2800);

  document.body.classList.remove("is-leaving");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
