import { canAcceptPayments, paymentsEnabled } from "./js/config/commerce.js";
import { trackEvent } from "./js/analytics.js";

const storedLanguage = localStorage.getItem("kastiz-one-language");
const language = ["en", "ko", "es"].includes(storedLanguage) ? storedLanguage : navigator.language.startsWith("ko") ? "ko" : navigator.language.startsWith("es") ? "es" : "en";
const theme = localStorage.getItem("kastiz-one-theme") || "light";
document.documentElement.dataset.theme = theme;
document.documentElement.lang = language;

const copy = {
  en: {
    login:"Login",settings:"Settings",premium:"KASTIZ ONE PLANS",headline:"Choose how ONE supports your mission.",subtitle:"Start with planning today. Plus and Pro remain early-access promises until their systems are production-safe.",available:"PUBLIC BETA",earlyAccess:"EARLY ACCESS",planned:"PLANNED",freePromise:"Plan it for me",plusPromise:"Help me complete it",proPromise:"Do it for me",comingSoon:"Coming Soon",
    free1:"Research, organize, and compare trip options",free2:"Build an itinerary and prepare decisions",free3:"Manual external provider handoff",free4:"Save the trip on this device",free5:"You complete every purchase or booking",startFree:"Start with ONE Free",
    plus1:"Deeper personalization and preferences",plus2:"Persistent missions and ONE Pass",plus3:"Enhanced provider handoff",plus4:"Mission monitoring and higher limits",plus5:"No autonomous booking or payment",joinPlus:"Join Plus Early Access",
    pro1:"Future approval-to-execution experience",pro2:"Future booking, payment, and confirmation",pro3:"Future recovery and provider coordination",pro4:"Available only after production safety validation",pro5:"Not operational today",joinPro:"Request Pro Early Access",
    foundingLabel:"FOUNDING MEMBER INTEREST",foundingTitle:"Help shape ONE with the first 100 users",foundingCopy:"Join the early-access list. No subscription or payment is taken today.",apply:"Register interest",important:"Important",disclosure:"ONE Free prepares decisions and opens external provider searches. You complete every purchase, booking, payment, reservation, or provider contact yourself.",disabled:"ONE Plus and ONE Pro are not operational. Payments and autonomous execution remain disabled.",status:"Payments are not enabled. Early-access requests only."
  },
  ko: {
    login:"로그인",settings:"설정",premium:"KASTIZ ONE 플랜",headline:"ONE이 미션을 지원하는 방식을 선택하세요.",subtitle:"지금은 계획부터 시작하세요. Plus와 Pro는 운영 안전성이 검증될 때까지 얼리 액세스로만 제공됩니다.",available:"공개 베타",earlyAccess:"얼리 액세스",planned:"준비 중",freePromise:"계획해 줘",plusPromise:"완료를 도와줘",proPromise:"대신 해 줘",comingSoon:"출시 예정",
    free1:"여행 선택지 조사·정리·비교",free2:"일정 구성과 의사결정 준비",free3:"외부 제공업체로 직접 이동",free4:"이 기기에 여행 저장",free5:"구매와 예약은 사용자가 직접 완료",startFree:"ONE Free 시작하기",
    plus1:"더 깊은 개인화와 선호 설정",plus2:"지속 미션과 ONE Pass",plus3:"향상된 제공업체 연결",plus4:"미션 모니터링과 확대된 한도",plus5:"자동 예약·결제는 포함하지 않음",joinPlus:"Plus 얼리 액세스 신청",
    pro1:"향후 승인 후 실행 경험",pro2:"향후 예약·결제·확정",pro3:"향후 복구와 제공업체 조율",pro4:"운영 안전성 검증 후에만 제공",pro5:"현재는 작동하지 않음",joinPro:"Pro 얼리 액세스 요청",
    foundingLabel:"파운딩 사용자 모집",foundingTitle:"첫 100명의 사용자와 ONE을 만듭니다",foundingCopy:"얼리 액세스 관심 등록만 받습니다. 현재 구독이나 결제는 없습니다.",apply:"관심 등록",important:"중요",disclosure:"ONE Free는 결정을 준비하고 외부 제공업체 검색을 엽니다. 구매, 예약, 결제, 제공업체 연락은 사용자가 직접 완료합니다.",disabled:"ONE Plus와 ONE Pro는 아직 작동하지 않습니다. 결제와 자율 실행은 비활성화되어 있습니다.",status:"결제가 활성화되지 않았습니다. 얼리 액세스 요청만 가능합니다."
  },
  es: {
    login:"Iniciar sesión",settings:"Configuración",premium:"PLANES KASTIZ ONE",headline:"Elige cómo ONE apoya tu misión.",subtitle:"Empieza hoy con la planificación. Plus y Pro seguirán en acceso anticipado hasta que sean seguros para producción.",available:"BETA PÚBLICA",earlyAccess:"ACCESO ANTICIPADO",planned:"PLANIFICADO",freePromise:"Planifícalo por mí",plusPromise:"Ayúdame a completarlo",proPromise:"Hazlo por mí",comingSoon:"Próximamente",
    free1:"Investiga, organiza y compara opciones",free2:"Crea el itinerario y prepara decisiones",free3:"Acceso manual a proveedores externos",free4:"Guarda el viaje en este dispositivo",free5:"Tú completas cada compra o reserva",startFree:"Empezar con ONE Free",
    plus1:"Personalización y preferencias más profundas",plus2:"Misiones persistentes y ONE Pass",plus3:"Mejor acceso a proveedores",plus4:"Monitoreo y límites ampliados",plus5:"Sin reservas ni pagos autónomos",joinPlus:"Solicitar acceso a Plus",
    pro1:"Futura ejecución después de aprobar",pro2:"Futuras reservas, pagos y confirmaciones",pro3:"Futura recuperación y coordinación",pro4:"Solo tras validar la seguridad en producción",pro5:"No funciona actualmente",joinPro:"Solicitar acceso a Pro",
    foundingLabel:"INTERÉS DE FUNDADORES",foundingTitle:"Ayuda a crear ONE con los primeros 100 usuarios",foundingCopy:"Únete a la lista. Hoy no se cobra ninguna suscripción ni pago.",apply:"Registrar interés",important:"Importante",disclosure:"ONE Free prepara decisiones y abre búsquedas externas. Tú completas cada compra, reserva, pago o contacto con proveedores.",disabled:"ONE Plus y ONE Pro no están operativos. Los pagos y la ejecución autónoma siguen desactivados.",status:"Los pagos no están habilitados. Solo solicitudes de acceso anticipado."
  }
};

const t = copy[language];
document.querySelectorAll("[data-i18n]").forEach((element) => { if (t[element.dataset.i18n]) element.textContent = t[element.dataset.i18n]; });
const paymentStatus = document.getElementById("paymentStatus");
if (paymentStatus) paymentStatus.textContent = t.status;
document.body.dataset.paymentsEnabled = String(paymentsEnabled && canAcceptPayments());
document.querySelectorAll(".logo img").forEach((image) => image.classList.toggle("light-logo", theme === "light"));
trackEvent("page_visit", { page:"pricing", language, status:"payments_disabled" });
