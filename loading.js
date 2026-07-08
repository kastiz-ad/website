const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language",
  mission: "kastiz-one-current-mission",
  results: "kastiz-one-results"
};

const missionName = document.getElementById("missionName");
const loadingMessage = document.getElementById("loadingMessage");
const progressBar = document.getElementById("progressBar");
const steps = [...document.querySelectorAll(".loading-step")];

const translations = {
  en: {
    preparing: "Preparing your mission",
    messages: [
      "Understanding your dream...",
      "Exploring every possibility...",
      "Finding trusted providers...",
      "Preparing everything...",
      "Turning your idea into reality..."
    ]
  },
  ko: {
    preparing: "미션을 준비하고 있습니다",
    messages: [
      "당신의 목표를 이해하는 중...",
      "가능한 모든 방법을 탐색하는 중...",
      "신뢰할 수 있는 서비스를 찾는 중...",
      "모든 준비를 마치는 중...",
      "당신의 아이디어를 현실로 만드는 중..."
    ]
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
  return localStorage.getItem(STORAGE_KEYS.language) || "en";
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

const language = getLanguage();
const text = translations[language] || translations.en;

loadTheme();

const mission = getMission();

missionName.textContent = mission?.mission || text.preparing;

const activateStep = (index) => {
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

  loadingMessage.textContent = text.messages[index];

  progressBar.style.width = `${((index + 1) / text.messages.length) * 100}%`;
};

activateStep(0);

let current = 0;

const interval = setInterval(() => {
  current++;

  if (current < text.messages.length) {
    activateStep(current);
    return;
  }

  clearInterval(interval);

  sessionStorage.setItem(
    STORAGE_KEYS.results,
    JSON.stringify({
      ...(mission || {}),
      language,
      completedAt: new Date().toISOString()
    })
  );

  document.body.style.opacity = "0";

  setTimeout(() => {
    window.location.href = "results.html";
  }, 450);

}, 1200);
