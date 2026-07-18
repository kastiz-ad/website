import { openConsentSettings, trackEvent } from "./js/analytics.js";
import { mountSuggestionSettings } from "./js/intelligence/suggestion-settings.js";

const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  executionStyle: "kastiz-one-execution-style"
};

const root = document.documentElement;

const themeDropdown = document.getElementById("themeDropdown");
const languageDropdown = document.getElementById("languageDropdown");

const themeControl = document.getElementById("themeControl");
const languageControl = document.getElementById("languageControl");

const themeControlText = document.getElementById("themeControlText");
const languageControlText = document.getElementById("languageControlText");

const clearMissionButton = document.getElementById("clearMissionButton");
const executionStyleSelect = document.getElementById("executionStyleSelect");
const locationText = document.getElementById("locationText");

const supportedThemes = ["light", "gray", "midnight"];
const supportedLanguages = ["en", "ko"];

const translations = {
  en: {
    upgrade: "Upgrade",
    login: "Login",
    settings: "Settings",
    settingsTitle: "Control how ONE works for you.",
    appearance: "Appearance",
    appearanceCopy: "Choose the visual mode for Kastiz ONE.",
    language: "Language",
    languageCopy: "Choose the language used across the platform.",
    approvalProtection: "Approval Protection",
    approvalProtectionCopy: "ONE prepares everything but never spends, books or commits without your approval.",
    approvalRequired: "Approval required",
    missionMemory: "Mission Memory",
    missionMemoryCopy: "Store the latest mission between pages.",
    profileMemory: "Profile & Memory",
    profileMemoryCopy: "Review, export, pause or delete information you chose to save.",
    reviewProfile: "Review Saved Information",
    privacyChoices: "Privacy Choices",
    privacyChoicesCopy: "Review optional preferences, analytics and marketing consent.",
    manageConsent: "Manage Consent",
    clearMission: "Clear Current Mission",
    executionStyle: "Execution Style",
    executionStyleCopy: "Control recommendation strategy.",
    balanced: "Balanced",
    premium: "Best quality",
    saving: "Save money",
    speed: "Fastest execution",
    partners: "Partners",
    business: "Business",
    developers: "Developers",
    poweredBy: "Powered by Kastiz",
    privacy: "Privacy",
    terms: "Terms",
    unknownLocation: "Unknown Location",
    themes: {
      light: "Light",
      gray: "Gray",
      midnight: "Midnight"
    },
    languages: {
      en: "English",
      ko: "한국어"
    }
  },
  ko: {
    upgrade: "업그레이드",
    login: "로그인",
    settings: "설정",
    settingsTitle: "ONE의 동작 방식을 설정합니다.",
    appearance: "테마",
    appearanceCopy: "ONE의 화면 모드를 선택하세요.",
    language: "언어",
    languageCopy: "플랫폼 전체 언어를 선택하세요.",
    approvalProtection: "승인 보호",
    approvalProtectionCopy: "ONE은 사용자의 승인 없이 예약·구매·결제를 진행하지 않습니다.",
    approvalRequired: "승인 필요",
    missionMemory: "미션 저장",
    missionMemoryCopy: "최근 미션을 페이지 간 유지합니다.",
    profileMemory: "프로필 및 메모리",
    profileMemoryCopy: "저장을 선택한 정보를 검토, 내보내기, 일시 중지 또는 삭제합니다.",
    reviewProfile: "저장된 정보 검토",
    privacyChoices: "개인정보 선택",
    privacyChoicesCopy: "선택적 설정, 분석 및 마케팅 동의를 검토합니다.",
    manageConsent: "동의 관리",
    clearMission: "현재 미션 삭제",
    executionStyle: "실행 스타일",
    executionStyleCopy: "추천 방식을 선택하세요.",
    balanced: "균형형",
    premium: "최고 품질",
    saving: "비용 절약",
    speed: "가장 빠르게",
    partners: "파트너",
    business: "비즈니스",
    developers: "개발자",
    poweredBy: "Kastiz 제공",
    privacy: "개인정보",
    terms: "약관",
    unknownLocation: "알 수 없는 위치",
    themes: {
      light: "라이트",
      gray: "그레이",
      midnight: "미드나이트"
    },
    languages: {
      en: "English",
      ko: "한국어"
    }
  }
};

const countries = {
  KR: "South Korea",
  US: "United States",
  JP: "Japan",
  FR: "France",
  ES: "Spain",
  DE: "Germany",
  BR: "Brazil",
  CA: "Canada",
  GB: "United Kingdom"
};

let language =
  localStorage.getItem(STORAGE_KEYS.language) ||
  (navigator.language.startsWith("ko") ? "ko" : "en");

function t(key) {
  return translations[language][key];
}

function updateTexts() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (translations[language][key]) {
      el.textContent = translations[language][key];
    }
  });

  themeControlText.textContent =
    translations[language].themes[root.dataset.theme];

  languageControlText.textContent =
    translations[language].languages[language];

  document.querySelectorAll("[data-theme-option]").forEach((btn) => {
    btn.textContent = translations[language].themes[btn.dataset.themeOption];
    btn.classList.toggle(
      "is-active",
      btn.dataset.themeOption === root.dataset.theme
    );
  });

  document.querySelectorAll("[data-language-option]").forEach((btn) => {
    btn.textContent = translations[language].languages[btn.dataset.languageOption];
    btn.classList.toggle(
      "is-active",
      btn.dataset.languageOption === language
    );
  });
}

function applyTheme(theme) {
  if (!supportedThemes.includes(theme)) theme = "light";

  root.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  const colors = {
    light: "#ffffff",
    gray: "#3f4146",
    midnight: "#121315"
  };

  document
    .querySelector('meta[name="theme-color"]')
    .setAttribute("content", colors[theme]);

  updateTexts();
}

function updateLocation() {
  const locale = navigator.language;
  const region = locale.includes("-")
    ? locale.split("-").pop().toUpperCase()
    : "";

  locationText.textContent =
    countries[region] || t("unknownLocation");
}

function closeMenus() {
  themeDropdown.classList.remove("is-open");
  languageDropdown.classList.remove("is-open");
}

themeControl.onclick = (e) => {
  e.stopPropagation();
  languageDropdown.classList.remove("is-open");
  themeDropdown.classList.toggle("is-open");
};

languageControl.onclick = (e) => {
  e.stopPropagation();
  themeDropdown.classList.remove("is-open");
  languageDropdown.classList.toggle("is-open");
};

document.onclick = closeMenus;

document.querySelectorAll("[data-theme-option]").forEach((btn) => {
  btn.onclick = () => {
    applyTheme(btn.dataset.themeOption);
    closeMenus();
  };
});

document.querySelectorAll("[data-language-option]").forEach((btn) => {
  btn.onclick = () => {
    language = btn.dataset.languageOption;
    localStorage.setItem(STORAGE_KEYS.language, language);
    document.documentElement.lang = language;
    updateTexts();
    updateLocation();
    closeMenus();
  };
});

executionStyleSelect.value =
  localStorage.getItem(STORAGE_KEYS.executionStyle) || "balanced";

executionStyleSelect.onchange = () => {
  localStorage.setItem(
    STORAGE_KEYS.executionStyle,
    executionStyleSelect.value
  );
};

clearMissionButton.onclick = () => {
  sessionStorage.removeItem(STORAGE_KEYS.mission);
  clearMissionButton.textContent = "✓";
};

applyTheme(
  localStorage.getItem(STORAGE_KEYS.theme) || "light"
);

document.documentElement.lang = language;
updateTexts();
updateLocation();
document.getElementById("privacyChoicesButton")?.addEventListener("click", openConsentSettings);
trackEvent("page_view", { page: "settings", language });
document.getElementById("intelligenceSettingsCopy").textContent=language==="ko"?"승인한 활동에서 ONE이 학습하고 조용히 제안하는 방식을 관리합니다.":"Control quiet suggestions and learning from approved activity.";
mountSuggestionSettings({container:document.getElementById("intelligenceSettings"),language});
