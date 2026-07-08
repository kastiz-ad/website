const STORAGE_KEYS = {
  theme: "kastiz-one-theme",
  language: "kastiz-one-language"
};

const translations = {
  en: {
    upgrade: "Upgrade",
    settings: "Settings",
    welcomeBack: "Welcome back",
    loginSubtitle:
      "Sign in to continue completing real-world missions with ONE.",
    email: "Email",
    password: "Password",
    login: "Login",
    orContinue: "or continue with",
    noAccount: "Don't have an account?",
    createAccount: "Create one",
    signingIn: "Signing in..."
  },

  ko: {
    upgrade: "업그레이드",
    settings: "설정",
    welcomeBack: "다시 오신 것을 환영합니다",
    loginSubtitle:
      "ONE와 함께 현실의 미션을 계속 진행하려면 로그인하세요.",
    email: "이메일",
    password: "비밀번호",
    login: "로그인",
    orContinue: "또는",
    noAccount: "계정이 없으신가요?",
    createAccount: "회원가입",
    signingIn: "로그인 중..."
  }
};

const language =
  localStorage.getItem(STORAGE_KEYS.language) ||
  (navigator.language.startsWith("ko") ? "ko" : "en");

const theme =
  localStorage.getItem(STORAGE_KEYS.theme) || "light";

document.documentElement.dataset.theme = theme;
document.documentElement.lang = language;

const t = translations[language];

document.querySelectorAll("[data-i18n]").forEach((el) => {
  const key = el.dataset.i18n;

  if (t[key]) {
    el.textContent = t[key];
  }
});

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const button = loginForm.querySelector("button");

  button.disabled = true;
  button.textContent = t.signingIn;

  setTimeout(() => {
    window.location.href = "index.html";
  }, 1200);
});
