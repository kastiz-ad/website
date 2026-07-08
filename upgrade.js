const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language"
};

const translations = {
  en: {
    login: "Login",
    settings: "Settings",
    premium: "KASTIZ ONE PREMIUM",
    headline: "Your personal execution team.",
    subtitle:
      "ONE doesn't simply recommend. ONE prepares, compares, organizes and helps execute every important life mission.",

    free: "Free",
    free1: "Unlimited missions",
    free2: "Mission planning",
    free3: "Provider recommendations",
    free4: "Manual execution",

    currentPlan: "Current Plan",

    recommended: "Recommended",

    pro1: "Priority AI planning",
    pro2: "Unlimited saved missions",
    pro3: "Advanced comparisons",
    pro4: "Business integrations",
    pro5: "Premium support",

    upgradeNow: "Upgrade Now",

    ent1: "Team workspace",
    ent2: "Company missions",
    ent3: "Admin dashboard",
    ent4: "API access",

    contactSales: "Contact Sales",

    upgrading: "Preparing checkout..."
  },

  ko: {
    login: "로그인",
    settings: "설정",

    premium: "KASTIZ ONE PREMIUM",

    headline: "당신만의 실행 팀.",

    subtitle:
      "ONE은 단순히 추천하지 않습니다. 준비하고, 비교하고, 정리하고, 현실까지 실행하도록 도와드립니다.",

    free: "무료",

    free1: "무제한 미션",
    free2: "미션 계획",
    free3: "추천 서비스",
    free4: "수동 실행",

    currentPlan: "현재 플랜",

    recommended: "추천",

    pro1: "우선 AI 계획",
    pro2: "무제한 미션 저장",
    pro3: "고급 비교",
    pro4: "비즈니스 연동",
    pro5: "프리미엄 지원",

    upgradeNow: "업그레이드",

    ent1: "팀 워크스페이스",
    ent2: "회사 미션",
    ent3: "관리자 대시보드",
    ent4: "API 제공",

    contactSales: "문의하기",

    upgrading: "결제를 준비하는 중..."
  }
};

const theme =
  localStorage.getItem(STORAGE_KEYS.theme) || "light";

const language =
  localStorage.getItem(STORAGE_KEYS.language) ||
  (navigator.language.startsWith("ko") ? "ko" : "en");

document.documentElement.dataset.theme = theme;
document.documentElement.lang = language;

const t = translations[language];

document.querySelectorAll("[data-i18n]").forEach((element) => {
  const key = element.dataset.i18n;

  if (t[key]) {
    element.textContent = t[key];
  }
});

const upgradeButton = document.getElementById("upgradeButton");

upgradeButton.addEventListener("click", () => {
  upgradeButton.disabled = true;
  upgradeButton.textContent = t.upgrading;

  setTimeout(() => {
    alert(
      language === "ko"
        ? "Stripe 결제 페이지가 연결될 예정입니다."
        : "Stripe checkout will be connected here."
    );

    upgradeButton.disabled = false;
    upgradeButton.textContent = t.upgradeNow;
  }, 1000);
});
