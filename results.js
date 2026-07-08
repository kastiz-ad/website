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
    finalMessage: "Turning your dream into reality.",
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
    modify: "Modify",
    editing: "Editing",
    approvalSteps: [
      "Booking flights...",
      "Reserving hotel...",
      "Preparing travel insurance...",
      "Checking visa...",
      "Building itinerary...",
      "Reserving restaurants...",
      "Preparing airport transfer..."
    ],
    fallbackMission: "Plan my Japan trip"
  },
  ko: {
    upgrade: "업그레이드",
    login: "로그인",
    missionReady: "미션 준비 완료",
    preparedByOne: "ONE이 준비했습니다",
    customize: "수정하기",
    makeItReality: "현실로 만들기",
    withOne: "with ONE",
    missionApproved: "미션 승인 완료",
    oneIsWorking: "ONE이 실행하고 있습니다.",
    finalMessage: "당신의 꿈이 현실이 되고 있습니다.",
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
    modify: "수정",
    editing: "수정 중",
    approvalSteps: [
      "항공권 예약 준비 중...",
      "호텔 예약 준비 중...",
      "여행자 보험 준비 중...",
      "비자 확인 중...",
      "여행 일정 구성 중...",
      "레스토랑 예약 준비 중...",
      "공항 이동 준비 중..."
    ],
    fallbackMission: "일본 여행 계획해줘"
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

const missionDataByType = {
  japan: [
    {
      title: { en: "Flights", ko: "항공권" },
      label: { en: "Recommended", ko: "추천" },
      value: { en: "Korean Air", ko: "대한항공" },
      reason: {
        en: "Best quality, direct routes, strong schedule reliability, and premium service for Korea to Japan travel.",
        ko: "한국에서 일본으로 이동할 때 직항, 일정 안정성, 서비스 품질의 균형이 가장 좋습니다."
      },
      options: [
        [{ en: "Best quality", ko: "최고 품질" }, { en: "Korean Air", ko: "대한항공" }],
        [{ en: "Cheapest", ko: "최저가" }, { en: "Jeju Air", ko: "제주항공" }],
        [{ en: "Best direct flight", ko: "최적 직항" }, { en: "Korean Air", ko: "대한항공" }]
      ]
    },
    {
      title: { en: "Hotels", ko: "호텔" },
      label: { en: "Recommended", ko: "추천" },
      value: { en: "Hilton Tokyo", ko: "힐튼 도쿄" },
      reason: {
        en: "Strong location, reliable service, airport access, and business-grade comfort.",
        ko: "위치, 서비스 안정성, 공항 접근성, 프리미엄 숙박 경험의 균형이 좋습니다."
      },
      options: [
        [{ en: "Best comfort", ko: "최고 편안함" }, { en: "Hilton Tokyo", ko: "힐튼 도쿄" }],
        [{ en: "Best value", ko: "가성비" }, { en: "JR Kyushu Hotel Blossom", ko: "JR 큐슈 호텔 블라썸" }],
        [{ en: "Best luxury", ko: "럭셔리" }, { en: "Aman Tokyo", ko: "아만 도쿄" }]
      ]
    },
    {
      title: { en: "Insurance", ko: "보험" },
      label: { en: "Protected", ko: "보호" },
      value: { en: "Travel medical + cancellation", ko: "여행자 의료 + 취소 보장" },
      reason: {
        en: "Covers medical emergencies, delays, baggage, and cancellation risks before execution.",
        ko: "의료 응급상황, 지연, 수하물, 취소 리스크를 실행 전에 대비합니다."
      },
      options: [
        [{ en: "Medical", ko: "의료" }, { en: "Included", ko: "포함" }],
        [{ en: "Baggage", ko: "수하물" }, { en: "Included", ko: "포함" }],
        [{ en: "Cancellation", ko: "취소" }, { en: "Recommended", ko: "추천" }]
      ]
    },
    {
      title: { en: "JR Pass", ko: "JR 패스" },
      label: { en: "Review", ko: "검토" },
      value: { en: "Route-based decision", ko: "동선 기준 결정" },
      reason: {
        en: "ONE checks your exact cities first because JR Pass only makes sense when long-distance rail exceeds pass cost.",
        ko: "JR 패스는 장거리 이동 비용이 패스 가격보다 높을 때만 의미가 있어 정확한 도시 동선을 먼저 확인합니다."
      },
      options: [
        [{ en: "Tokyo only", ko: "도쿄만" }, { en: "Skip", ko: "불필요" }],
        [{ en: "Tokyo + Kyoto", ko: "도쿄 + 교토" }, { en: "Compare", ko: "비교" }],
        [{ en: "Multi-city", ko: "다도시" }, { en: "Likely useful", ko: "유용 가능" }]
      ]
    },
    {
      title: { en: "Restaurants", ko: "레스토랑" },
      label: { en: "Curated", ko: "큐레이션" },
      value: { en: "Local + premium mix", ko: "로컬 + 프리미엄 조합" },
      reason: {
        en: "Balanced between famous reservations, local hidden spots, and convenient meals near your route.",
        ko: "유명 예약 식당, 현지 맛집, 동선에 맞는 편리한 식사를 균형 있게 준비합니다."
      },
      options: [
        [{ en: "Sushi", ko: "스시" }, { en: "Reservation-ready", ko: "예약 준비" }],
        [{ en: "Ramen", ko: "라멘" }, { en: "Local shortlist", ko: "현지 후보" }],
        [{ en: "Cafe", ko: "카페" }, { en: "Route matched", ko: "동선 맞춤" }]
      ]
    },
    {
      title: { en: "Airport Transfer", ko: "공항 이동" },
      label: { en: "Recommended", ko: "추천" },
      value: { en: "Airport limousine", ko: "공항 리무진" },
      reason: {
        en: "Best balance of comfort, luggage handling, cost, and direct access to major hotel zones.",
        ko: "편안함, 수하물 이동, 비용, 주요 호텔 지역 접근성의 균형이 좋습니다."
      },
      options: [
        [{ en: "Best comfort", ko: "최고 편안함" }, { en: "Private car", ko: "프라이빗 차량" }],
        [{ en: "Best value", ko: "가성비" }, { en: "Limousine bus", ko: "리무진 버스" }],
        [{ en: "Fastest", ko: "가장 빠름" }, { en: "Train", ko: "전철" }]
      ]
    },
    {
      title: { en: "Budget", ko: "예산" },
      label: { en: "Estimated", ko: "예상" },
      value: { en: "₩1.8M – ₩3.2M", ko: "180만 원 – 320만 원" },
      reason: {
        en: "Estimated for flights, hotel, meals, transport, insurance, and flexible activity spending.",
        ko: "항공권, 호텔, 식사, 교통, 보험, 활동 비용을 포함한 예상 범위입니다."
      },
      options: [
        [{ en: "Economy", ko: "이코노미" }, { en: "₩1.2M – ₩1.8M", ko: "120만 원 – 180만 원" }],
        [{ en: "Balanced", ko: "균형형" }, { en: "₩1.8M – ₩3.2M", ko: "180만 원 – 320만 원" }],
        [{ en: "Premium", ko: "프리미엄" }, { en: "₩3.2M+", ko: "320만 원 이상" }]
      ],
      wide: true
    },
    {
      title: { en: "Timeline", ko: "일정" },
      label: { en: "Ready", ko: "준비 완료" },
      value: { en: "5-day mission plan", ko: "5일 미션 플랜" },
      reason: {
        en: "Arrival, hotel check-in, restaurants, transport, shopping, and return route are structured into one editable plan.",
        ko: "도착, 호텔 체크인, 식당, 교통, 쇼핑, 귀국 동선을 하나의 수정 가능한 플랜으로 구성합니다."
      },
      options: [
        [{ en: "Day 1", ko: "1일차" }, { en: "Arrival + hotel + dinner", ko: "도착 + 호텔 + 저녁" }],
        [{ en: "Day 2–4", ko: "2–4일차" }, { en: "Core itinerary", ko: "핵심 일정" }],
        [{ en: "Day 5", ko: "5일차" }, { en: "Return + airport transfer", ko: "귀국 + 공항 이동" }]
      ],
      wide: true
    }
  ],
  default: [
    {
      title: { en: "Mission Plan", ko: "미션 플랜" },
      label: { en: "Recommended", ko: "추천" },
      value: { en: "Prepared execution path", ko: "실행 경로 준비" },
      reason: {
        en: "ONE breaks the mission into clear decisions, provider options, risks, budget, and next actions.",
        ko: "ONE이 미션을 결정 사항, 제공업체 옵션, 리스크, 예산, 다음 행동으로 나누어 준비합니다."
      },
      options: [
        [{ en: "Approach", ko: "방향" }, { en: "Best quality", ko: "최고 품질" }],
        [{ en: "Backup", ko: "대안" }, { en: "Lower cost", ko: "비용 절감" }],
        [{ en: "Execution", ko: "실행" }, { en: "User-approved", ko: "사용자 승인 기반" }]
      ]
    },
    {
      title: { en: "Trusted Providers", ko: "신뢰 가능한 제공업체" },
      label: { en: "Shortlist", ko: "후보" },
      value: { en: "Best-fit providers", ko: "최적 제공업체" },
      reason: {
        en: "ONE compares quality, price, reliability, location, service level, and approval requirements.",
        ko: "품질, 가격, 신뢰도, 위치, 서비스 수준, 승인 조건을 비교합니다."
      },
      options: [
        [{ en: "Premium", ko: "프리미엄" }, { en: "Best service", ko: "최고 서비스" }],
        [{ en: "Value", ko: "가성비" }, { en: "Best price", ko: "최적 가격" }],
        [{ en: "Fastest", ko: "최단 시간" }, { en: "Quickest start", ko: "빠른 시작" }]
      ]
    },
    {
      title: { en: "Budget", ko: "예산" },
      label: { en: "Estimated", ko: "예상" },
      value: { en: "Editable range", ko: "수정 가능한 범위" },
      reason: {
        en: "ONE prepares budget ranges before any spending so every decision stays under user control.",
        ko: "어떤 지출도 하기 전 예산 범위를 준비해 모든 결정권이 사용자에게 남아 있게 합니다."
      },
      options: [
        [{ en: "Low", ko: "낮음" }, { en: "Cost-saving", ko: "비용 절감" }],
        [{ en: "Balanced", ko: "균형형" }, { en: "Recommended", ko: "추천" }],
        [{ en: "Premium", ko: "프리미엄" }, { en: "Best quality", ko: "최고 품질" }]
      ]
    },
    {
      title: { en: "Timeline", ko: "일정" },
      label: { en: "Ready", ko: "준비 완료" },
      value: { en: "Step-by-step execution", ko: "단계별 실행" },
      reason: {
        en: "ONE sequences the mission so the user can approve, customize, and execute without mental overload.",
        ko: "사용자가 부담 없이 승인, 수정, 실행할 수 있도록 미션을 순서대로 구성합니다."
      },
      options: [
        [{ en: "Prepare", ko: "준비" }, { en: "Now", ko: "지금" }],
        [{ en: "Approve", ko: "승인" }, { en: "Before spending", ko: "지출 전" }],
        [{ en: "Execute", ko: "실행" }, { en: "After approval", ko: "승인 후" }]
      ]
    },
    {
      title: { en: "Risk Check", ko: "리스크 확인" },
      label: { en: "Protected", ko: "보호" },
      value: { en: "Approval-first execution", ko: "승인 우선 실행" },
      reason: {
        en: "ONE never commits, books, purchases, signs, or spends money until the user explicitly approves.",
        ko: "사용자가 명확히 승인하기 전에는 예약, 구매, 서명, 지출을 절대 진행하지 않습니다."
      },
      options: [
        [{ en: "Money", ko: "돈" }, { en: "Protected", ko: "보호됨" }],
        [{ en: "Contracts", ko: "계약" }, { en: "Approval needed", ko: "승인 필요" }],
        [{ en: "Changes", ko: "변경" }, { en: "Editable", ko: "수정 가능" }]
      ],
      wide: true
    },
    {
      title: { en: "Next Actions", ko: "다음 행동" },
      label: { en: "Mission Ready", ko: "미션 준비 완료" },
      value: { en: "Customize or approve", ko: "수정 또는 승인" },
      reason: {
        en: "Use Customize to edit every card or Make It Reality to begin the approved execution sequence.",
        ko: "수정하기로 각 카드를 조정하거나 현실로 만들기를 눌러 승인된 실행 흐름을 시작합니다."
      },
      options: [
        [{ en: "Edit", ko: "수정" }, { en: "Customize", ko: "수정하기" }],
        [{ en: "Approve", ko: "승인" }, { en: "Make It Reality", ko: "현실로 만들기" }],
        [{ en: "Control", ko: "통제권" }, { en: "Always yours", ko: "항상 사용자에게" }]
      ],
      wide: true
    }
  ]
};

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

  locationText.textContent = countryNamesByRegion[region] || t("unknownLocation");
};

const getMission = () => {
  try {
    const resultsRaw = sessionStorage.getItem(STORAGE_KEYS.results);
    const missionRaw = sessionStorage.getItem(STORAGE_KEYS.mission);
    const parsed = JSON.parse(resultsRaw || missionRaw);

    if (parsed?.mission) return parsed;
  } catch {}

  return {
    mission: t("fallbackMission"),
    slug: "plan-my-japan-trip",
    createdAt: new Date().toISOString()
  };
};

const getMissionType = (mission) => {
  const text = mission.toLowerCase();

  if (
    text.includes("japan") ||
    text.includes("tokyo") ||
    text.includes("kyoto") ||
    text.includes("trip") ||
    text.includes("travel") ||
    text.includes("일본") ||
    text.includes("여행")
  ) {
    return "japan";
  }

  return "default";
};

const createCard = (item, index) => {
  const article = document.createElement("article");
  article.className = "mission-card";

  if (item.wide) {
    article.classList.add("is-wide");
  }

  article.style.animationDelay = `${index * 55}ms`;

  const options = item.options
    .map(([key, value]) => {
      return `
        <div class="option-row">
          <span class="option-key">${localize(key)}</span>
          <span class="option-value">${localize(value)}</span>
        </div>
      `;
    })
    .join("");

  article.innerHTML = `
    <div class="card-top">
      <h2 class="card-title">${localize(item.title)}</h2>
      <span class="card-label">${localize(item.label)}</span>
    </div>

    <div class="recommendation">
      <p class="recommendation-label">${t("recommended")}</p>
      <p class="recommendation-value">${localize(item.value)}</p>
    </div>

    <p class="reason">${localize(item.reason)}</p>

    <div class="option-list">
      ${options}
    </div>

    <div class="card-actions">
      <button class="modify-button" type="button">${t("modify")}</button>
    </div>
  `;

  return article;
};

const renderMission = () => {
  const mission = getMission();
  const type = getMissionType(mission.mission);
  const cards = missionDataByType[type] || missionDataByType.default;

  missionTitle.textContent = mission.mission;
  missionGrid.innerHTML = "";

  cards.forEach((item, index) => {
    missionGrid.appendChild(createCard(item, index));
  });
};

const renderApprovalList = () => {
  approvalList.innerHTML = t("approvalSteps")
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
          completionMessage.hidden = false;
          startReturnCountdown();
        }, 650);
      }
    }, index * 760);
  });
};

const enableCustomization = () => {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".modify-button");

    if (!button) return;

    const card = button.closest(".mission-card");
    card.classList.toggle("is-editing");
    button.textContent = card.classList.contains("is-editing") ? t("editing") : t("modify");
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

setTheme();
updateTextContent();
updateLocation();
renderMission();
renderApprovalList();
enableCustomization();
