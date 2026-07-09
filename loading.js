const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  travelMission: "kastiz-one-travel-mission",
  results: "kastiz-one-results"
};

const missionName = document.getElementById("missionName");
const loadingMessage = document.getElementById("loadingMessage");
const progressBar = document.getElementById("progressBar");
const steps = [...document.querySelectorAll(".loading-step")];

const translations = {
  en: {
    preparing: "Preparing your mission",
    messages: {
      general: [
        "Understanding your dream...",
        "Exploring every possibility...",
        "Finding trusted providers...",
        "Preparing everything...",
        "Turning your idea into reality..."
      ],
      travel: [
        "Understanding your dream...",
        "Exploring every possibility...",
        "Finding trusted travel options...",
        "Preparing everything...",
        "Turning your idea into reality..."
      ]
    }
  },
  ko: {
    preparing: "미션을 준비하고 있습니다",
    messages: {
      general: [
        "당신의 목표를 이해하고 있어요...",
        "가능한 선택지를 살펴보고 있어요...",
        "신뢰할 수 있는 서비스를 찾고 있어요...",
        "필요한 것들을 준비하고 있어요...",
        "당신의 아이디어를 현실로 만들고 있어요..."
      ],
      travel: [
        "당신의 목표를 이해하고 있어요...",
        "가능한 선택지를 살펴보고 있어요...",
        "신뢰할 수 있는 여행 옵션을 찾고 있어요...",
        "필요한 것들을 준비하고 있어요...",
        "당신의 아이디어를 현실로 만들고 있어요..."
      ]
    }
  }
};

const loadTheme = () => {
  const theme = localStorage.getItem(STORAGE_KEYS.theme) || "light";

  document.documentElement.setAttribute("data-theme", theme);

  const colors = {
    light: "#ffffff",
    gray: "#f4f2ed",
    midnight: "#121315"
  };

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", colors[theme] || colors.light);
};

const getLanguage = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.language);

  if (saved === "ko" || saved === "en") {
    return saved;
  }

  return navigator.language?.toLowerCase().startsWith("ko") ? "ko" : "en";
};

const getMission = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.mission);

    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const localize = (value, language) => {
  if (typeof value === "string") return value;
  return value?.[language] ?? value?.en ?? "";
};

const cloneMission = (mission) => {
  return JSON.parse(JSON.stringify(mission));
};

const normalizeTravelResult = (mission, language) => {
  const result = cloneMission(mission);

  result.resultId = `result-${Date.now()}`;
  result.status = "mission-ready";
  result.generatedAt = new Date().toISOString();
  result.language = language;
  result.approvalRequired = true;

  result.display = {
    missionReady: language === "ko" ? "미션 준비 완료" : "Mission Ready",
    title:
      language === "ko"
        ? `${result.destination?.countryKo || "일본"} 여행`
        : `${result.destination?.country || "Japan"} Trip`,
    destination:
      language === "ko"
        ? result.destination?.countryKo || "일본"
        : result.destination?.country || "Japan",
    city:
      language === "ko"
        ? result.destination?.cityKo || "도쿄"
        : result.destination?.city || "Tokyo",
    approvalProtection:
      localize(result.approvalProtection, language) ||
      (language === "ko"
        ? "사용자가 명확히 승인하기 전까지 예약, 구매, 결제, 서명, 법적 약속은 절대 진행되지 않습니다."
        : "Nothing will be booked, purchased, reserved, signed, or legally committed until you explicitly approve.")
  };

  result.cards = [
    {
      id: "flights",
      type: "flights",
      title: {
        en: "Flights",
        ko: "항공권"
      },
      recommended: result.flights?.[0] || null,
      options: result.flights || [],
      modifyActions: ["change-airline", "reduce-budget", "upgrade-quality"],
      editable: true
    },
    {
      id: "hotel",
      type: "hotel",
      title: {
        en: "Hotel",
        ko: "호텔"
      },
      recommended: result.hotels?.[0] || null,
      options: result.hotels || [],
      modifyActions: ["change-hotel-type", "reduce-budget", "upgrade-quality"],
      editable: true
    },
    {
      id: "airport-transfer",
      type: "airportTransfer",
      title: {
        en: "Airport Transfer",
        ko: "공항 이동"
      },
      recommended: result.airportTransfer || null,
      options: result.airportTransfer?.options || [],
      modifyActions: ["change-transfer", "reduce-budget", "upgrade-quality"],
      editable: true
    },
    {
      id: "checklist",
      type: "checklist",
      title: {
        en: "Travel Checklist",
        ko: "여행 체크리스트"
      },
      items: result.checklist || [],
      modifyActions: ["remove-checklist-item", "add-checklist-item"],
      editable: true
    },
    {
      id: "visa",
      type: "visa",
      title: {
        en: "Visa",
        ko: "비자"
      },
      data: result.visa || null,
      modifyActions: ["verify-visa"],
      editable: true
    },
    {
      id: "restaurants",
      type: "restaurants",
      title: {
        en: "Restaurants",
        ko: "레스토랑"
      },
      items: result.restaurants || [],
      modifyActions: ["remove-restaurants", "upgrade-quality"],
      editable: true
    },
    {
      id: "budget",
      type: "budget",
      title: {
        en: "Budget",
        ko: "예산"
      },
      data: result.budget || null,
      modifyActions: ["reduce-budget", "upgrade-quality"],
      editable: true
    },
    {
      id: "approval-protection",
      type: "approval",
      title: {
        en: "Approval Protection",
        ko: "승인 보호"
      },
      message: result.approvalProtection,
      editable: false
    }
  ];

  result.executionSequence = {
    en: [
      "Preparing flight booking...",
      "Preparing hotel reservation...",
      "Preparing travel checklist...",
      "Preparing restaurant options...",
      "Preparing airport transfer...",
      "Finalizing your mission..."
    ],
    ko: [
      "항공권 예약 준비 중...",
      "호텔 예약 준비 중...",
      "여행 체크리스트 준비 중...",
      "레스토랑 옵션 준비 중...",
      "공항 이동 준비 중...",
      "미션을 최종 준비 중..."
    ]
  };

  result.finalMessage = {
    en: "Your future is now in motion.",
    ko: "당신의 미래가 움직이기 시작했습니다."
  };

  return result;
};

const normalizeGeneralResult = (mission, language) => {
  return {
    ...(mission || {}),
    resultId: `result-${Date.now()}`,
    type: "general",
    status: "mission-ready",
    language,
    generatedAt: new Date().toISOString(),
    approvalRequired: true
  };
};

const generateMissionResult = (mission, language) => {
  if (mission?.type === "travel") {
    const travelResult = normalizeTravelResult(mission, language);

    sessionStorage.setItem(STORAGE_KEYS.travelMission, JSON.stringify(travelResult));

    return travelResult;
  }

  return normalizeGeneralResult(mission, language);
};

const activateStep = (index, messages) => {
  steps.forEach((step, i) => {
    step.classList.remove("is-active");

    if (i < index) {
      step.classList.add("is-complete");
    } else {
      step.classList.remove("is-complete");
    }

    if (i === index) {
      step.classList.add("is-active");
    }
  });

  loadingMessage.textContent = messages[index];

  progressBar.style.width = `${((index + 1) / messages.length) * 100}%`;
};

loadTheme();

const language = getLanguage();
const mission = getMission();
const missionType = mission?.type === "travel" ? "travel" : "general";
const text = translations[language] || translations.en;
const messages = text.messages[missionType] || text.messages.general;

document.documentElement.lang = language;

missionName.textContent = mission?.mission || mission?.originalMission || text.preparing;

activateStep(0, messages);

let current = 0;

const interval = setInterval(() => {
  current++;

  if (current < messages.length) {
    activateStep(current, messages);
    return;
  }

  clearInterval(interval);

  const result = generateMissionResult(mission, language);

  sessionStorage.setItem(
    STORAGE_KEYS.results,
    JSON.stringify({
      ...result,
      completedAt: new Date().toISOString()
    })
  );

  document.body.style.opacity = "0";

  setTimeout(() => {
    window.location.href = "results.html";
  }, 450);
}, 1200);
