import { trackEvent } from "./js/analytics.js";
const language=localStorage.getItem("kastiz-one-language")||(navigator.language.startsWith("ko")?"ko":"en");
const theme=localStorage.getItem("kastiz-one-theme")||"light";
document.documentElement.lang=language;document.documentElement.dataset.theme=theme;
const copy={en:{pricing:"Pricing",settings:"Settings",status:"EARLY ACCESS · ACCOUNTS NOT CONNECTED",title:"Early Access Login Coming Soon",copy:"Account interfaces are being prepared. No account will be created and no password is collected on this prototype page.",waitlist:"Join waitlist",request:"Request early access",support:"Contact support",forgot:"Forgot password placeholder",privacy:"Privacy request",deletion:"Account deletion & data export",preferences:"Mission history, notification, language & theme settings",providerPending:"{provider} sign-in is not connected yet. Join early access to be notified when secure accounts open."},ko:{pricing:"요금제",settings:"설정",status:"얼리 액세스 · 계정 미연동",title:"얼리 액세스 로그인이 곧 제공됩니다",copy:"계정 인터페이스를 준비 중입니다. 이 프로토타입 페이지에서는 계정을 만들거나 비밀번호를 수집하지 않습니다.",waitlist:"대기 명단 참여",request:"얼리 액세스 요청",support:"지원 문의",forgot:"비밀번호 찾기 준비 중",privacy:"개인정보 요청",deletion:"계정 삭제 및 데이터 내보내기",preferences:"미션 기록, 알림, 언어 및 테마 설정",providerPending:"{provider} 로그인은 아직 연결되지 않았습니다. 안전한 계정 기능이 열리면 안내받을 수 있도록 얼리 액세스를 신청하세요."}}[language];
document.querySelectorAll("[data-i18n]").forEach(el=>{if(copy[el.dataset.i18n])el.textContent=copy[el.dataset.i18n]});
document.querySelectorAll(".logo img,.one-logo img").forEach(img=>img.classList.toggle("light-logo",theme==="light"));
const providerStatus=document.getElementById("providerStatus");
document.querySelectorAll("[data-provider]").forEach(button=>button.addEventListener("click",()=>{
  providerStatus.textContent=copy.providerPending.replace("{provider}",button.dataset.provider);
  trackEvent("login_provider_selected",{page:"login",language,provider:button.dataset.provider.toLowerCase(),status:"not_connected"});
  const destination=new URL("profile.html",location.href);
  destination.searchParams.set("mode","prototype");
  destination.searchParams.set("provider",button.dataset.provider.toLowerCase());
  location.href=destination.href;
}));
trackEvent("page_visit",{page:"login",language});
