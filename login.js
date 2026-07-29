import { trackEvent } from "./js/analytics.js";
import { getOAuthUrl, getSession, loginWithEmail, registerWithEmail, requestPasswordReset } from "./js/auth/account-client.js";

const language = localStorage.getItem("kastiz-one-language") || (navigator.language.startsWith("ko") ? "ko" : navigator.language.startsWith("es") ? "es" : "en");
const theme = localStorage.getItem("kastiz-one-theme") || "light";
document.documentElement.lang = language;
document.documentElement.dataset.theme = theme;

const copy = {
  en: {
    pricing:"Pricing", settings:"Settings", status:"SECURE ACCOUNT ACCESS", title:"Sign in to Kastiz ONE", copy:"Protect your profile, memory and future missions with your account.", email:"Email", password:"Password", displayName:"Display name", signIn:"Sign in", createAccount:"Create account", resetPassword:"Reset password", waitlist:"Join waitlist", request:"Request early access", support:"Contact support", forgot:"Forgot password", privacy:"Privacy request", deletion:"Account deletion & data export", preferences:"Mission history, notifications, language & theme settings", emailOpen:"Enter your email and password.", oauthPending:"Opening secure {provider} sign-in...", oauthSetup:"{provider} sign-in is not configured on this environment yet.", offline:"Secure accounts are not configured on this preview yet. No password was stored.", sent:"If the account exists, reset instructions were sent.", registered:"Check your email to verify the account before signing in.", registerHelp:"Enter name, email and password, then choose Create account again.", signedIn:"You are signed in. Opening your profile..."
  },
  ko: {
    pricing:"요금제", settings:"설정", status:"안전한 계정 액세스", title:"Kastiz ONE 로그인", copy:"프로필, 메모리, 다음 미션을 계정으로 안전하게 보호하세요.", email:"이메일", password:"비밀번호", displayName:"표시 이름", signIn:"로그인", createAccount:"계정 만들기", resetPassword:"비밀번호 재설정", waitlist:"대기 명단 참여", request:"얼리 액세스 요청", support:"지원 문의", forgot:"비밀번호 찾기", privacy:"개인정보 요청", deletion:"계정 삭제 및 데이터 내보내기", preferences:"미션 기록, 알림, 언어 및 테마 설정", emailOpen:"이메일과 비밀번호를 입력하세요.", oauthPending:"안전한 {provider} 로그인을 여는 중입니다...", oauthSetup:"이 환경에는 아직 {provider} 로그인이 설정되지 않았습니다.", offline:"이 미리보기에는 아직 안전한 계정이 설정되지 않았습니다. 비밀번호는 저장되지 않았습니다.", sent:"계정이 존재하면 재설정 안내를 전송했습니다.", registered:"로그인 전에 이메일에서 계정을 확인하세요.", registerHelp:"이름, 이메일, 비밀번호를 입력한 뒤 계정 만들기를 다시 누르세요.", signedIn:"로그인되어 있습니다. 프로필을 엽니다..."
  },
  es: {
    pricing:"Precios", settings:"Ajustes", status:"ACCESO SEGURO", title:"Iniciar sesión en Kastiz ONE", copy:"Protege tu perfil, memoria y próximas misiones con tu cuenta.", email:"Email", password:"Contraseña", displayName:"Nombre visible", signIn:"Iniciar sesión", createAccount:"Crear cuenta", resetPassword:"Restablecer contraseña", waitlist:"Unirse a la lista", request:"Solicitar acceso", support:"Soporte", forgot:"Olvidé mi contraseña", privacy:"Privacidad", deletion:"Eliminar cuenta y exportar datos", preferences:"Historial, notificaciones, idioma y tema", emailOpen:"Escribe tu email y contraseña.", oauthPending:"Abriendo inicio seguro con {provider}...", oauthSetup:"{provider} todavía no está configurado en este entorno.", offline:"Las cuentas seguras no están configuradas en esta vista previa. No se guardó ninguna contraseña.", sent:"Si la cuenta existe, se enviaron instrucciones.", registered:"Revisa tu email para verificar la cuenta antes de iniciar sesión.", registerHelp:"Escribe nombre, email y contraseña; luego pulsa Crear cuenta otra vez.", signedIn:"Ya iniciaste sesión. Abriendo tu perfil..."
  }
}[language] || {};

document.querySelectorAll("[data-i18n]").forEach(el => { if (copy[el.dataset.i18n]) el.textContent = copy[el.dataset.i18n]; });
document.querySelectorAll(".logo img,.one-logo img").forEach(img => img.classList.toggle("light-logo", theme === "light"));

const status = document.getElementById("providerStatus");
const form = document.getElementById("emailAuthForm");
const displayRow = document.getElementById("displayNameRow");
const emailInput = document.getElementById("authEmail");
const passwordInput = document.getElementById("authPassword");
const displayInput = document.getElementById("authDisplayName");
const buttons = () => [...form.querySelectorAll("button")];
const setStatus = message => { status.textContent = message; };

getSession().then(session => {
  if (session.authenticated) {
    setStatus(copy.signedIn);
    setTimeout(() => { location.href = new URL("profile.html",location.href).href; }, 500);
  }
});

document.querySelectorAll("[data-provider]").forEach(button => button.addEventListener("click", async () => {
  const provider = button.dataset.provider;
  trackEvent("login_provider_selected", { page:"login", language, provider:provider.toLowerCase(), status:provider === "Email" ? "form_opened" : "requested" });
  if (provider === "Email") {
    form.hidden = false;
    setStatus(copy.emailOpen);
    emailInput.focus();
    return;
  }
  if (!["Google", "Apple"].includes(provider)) {
    setStatus(copy.oauthSetup.replace("{provider}", provider));
    return;
  }
  try {
    setStatus(copy.oauthPending.replace("{provider}", provider));
    const result = await getOAuthUrl(provider.toLowerCase());
    location.href = result.url;
  } catch (error) {
    setStatus(error.code === "backend_not_configured" ? copy.offline : copy.oauthSetup.replace("{provider}", provider));
  }
}));

document.querySelector('[data-auth-action="register"]').addEventListener("click", async () => {
  if (form.dataset.mode !== "register") {
    displayRow.hidden = false;
    displayInput.required = true;
    form.dataset.mode = "register";
    setStatus(copy.registerHelp);
    return;
  }
  try {
    buttons().forEach(button => { button.disabled = true; });
    await registerWithEmail(emailInput.value, passwordInput.value, displayInput.value, language);
    setStatus(copy.registered);
  } catch (error) {
    setStatus(error.message || copy.offline);
  } finally {
    buttons().forEach(button => { button.disabled = false; });
  }
});

document.querySelector('[data-auth-action="reset"]').addEventListener("click", async () => {
  if (!emailInput.value) return emailInput.focus();
  try {
    await requestPasswordReset(emailInput.value);
    setStatus(copy.sent);
  } catch (error) {
    setStatus(error.message || copy.offline);
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  buttons().forEach(button => { button.disabled = true; });
  try {
    await loginWithEmail(emailInput.value, passwordInput.value);
    location.href = new URL("profile.html",location.href).href;
  } catch (error) {
    setStatus(error.message || copy.offline);
  } finally {
    buttons().forEach(button => { button.disabled = false; });
  }
});

trackEvent("page_view", { page:"login", language });
