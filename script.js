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
  mission: "kastiz-one-current-mission"
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

const saveMission = (mission) => {
  const payload = {
    mission,
    slug: createMissionSlug(mission),
    language: activeLanguage,
    theme: root.getAttribute("data-theme") || "light",
    createdAt: new Date().toISOString(),
    source: "homepage"
  };

  sessionStorage.setItem(STORAGE_KEYS.mission, JSON.stringify(payload));
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

missionInput.addEventListener("input", () => {
  syncInputState();
  missionInput.classList.toggle("has-text", missionInput.value.trim().length > 0);
});

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
