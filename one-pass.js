const SUPPORTED_LANGUAGES = ["en", "ko", "es"];
const savedLanguage = localStorage.getItem("kastiz-one-language");
const browserLanguage = navigator.language?.slice(0, 2);
const language = SUPPORTED_LANGUAGES.includes(savedLanguage) ? savedLanguage : SUPPORTED_LANGUAGES.includes(browserLanguage) ? browserLanguage : "en";
document.documentElement.lang = language;

const translations = {
  en: {
    profile: "Profile", settings: "Settings", tagline: "Set up once. ONE handles the details.", checking: "Checking secure account…",
    identity: "Identity Pass", travel: "Travel Profile", loyalty: "Loyalty Wallet", payment: "Payment Hub", connections: "Connections", security: "Security & Activity",
    notSetup: "Not set up", handoff: "Secure handoff only", passkeyOff: "Passkey not enabled", sensitive: "Sensitive", editable: "Editable",
    identityCopy: "Passport storage remains disabled until an approved production vault and identity-verification provider are configured.",
    neverImages: "No passport image, NFC data, or biometric is stored.", identityDisabled: "Identity setup unavailable in this environment",
    travelCopy: "Save ordinary travel preferences separately from sensitive identity.", airports: "Departure airports", airlines: "Preferred airlines", hotels: "Hotel brands", seat: "Seat preference",
    window: "Window", aisle: "Aisle", priority: "Permanent priority", balance: "Best balance", lowest: "Lowest total price", points: "Maximum points/miles", brands: "Preferred brands first", save: "Save Travel Profile",
    loyaltyCopy: "Membership references only. ONE never asks for loyalty-program passwords.", connectLater: "Secure connection required",
    paymentCopy: "Only provider-managed payment references may be stored. Card numbers and CVV are never collected here.", paymentsDisabled: "Payments disabled",
    connectionCopy: "OAuth, official APIs, app handoff, or secure deep links only. Provider passwords are never accepted.",
    securityCopy: "Passkeys confirm cryptographic device authentication. Kastiz never receives your face or fingerprint.", passkeyPending: "Passkey configuration required", export: "Export ONE Pass data",
    deleteIdentity: "Delete Identity Pass", deleteOnePass: "Request ONE Pass deletion", deleteNotice: "Deletion and sensitive reveal require signed-in ownership and recent device confirmation.",
    login: "Sign in to use ONE Pass.", unavailable: "ONE Pass secure backend is not configured on this preview.", saved: "Travel Profile saved.", ready: "Ready to approve", setup: "Setup in progress", complete: "Complete", programs: "programs", methods: "methods", nextLanguage: "한국어"
  },
  ko: {
    profile: "프로필", settings: "설정", tagline: "한 번만 설정하면, 필요한 세부 정보는 ONE이 안전하게 준비합니다.", checking: "안전한 계정 확인 중…",
    identity: "Identity Pass", travel: "여행 프로필", loyalty: "로열티 지갑", payment: "결제 허브", connections: "연결", security: "보안 및 활동",
    notSetup: "설정 안 됨", handoff: "안전한 제공업체 연결만 가능", passkeyOff: "패스키 미설정", sensitive: "민감 정보", editable: "수정 가능",
    identityCopy: "승인된 운영용 금고와 신원 확인 제공업체가 구성될 때까지 여권 저장은 비활성화됩니다.",
    neverImages: "여권 이미지, NFC 데이터, 생체정보는 저장하지 않습니다.", identityDisabled: "이 환경에서는 신원 정보 저장을 사용할 수 없습니다",
    travelCopy: "민감한 신원 정보와 분리해서 일반 여행 선호도를 저장합니다.", airports: "출발 공항", airlines: "선호 항공사", hotels: "선호 호텔 브랜드", seat: "좌석 선호",
    window: "창가", aisle: "통로", priority: "상시 우선순위", balance: "가격과 품질의 균형", lowest: "최저 총액", points: "포인트·마일 최대", brands: "선호 브랜드 우선", save: "여행 프로필 저장",
    loyaltyCopy: "회원 참조 정보만 저장합니다. ONE은 로열티 프로그램 비밀번호를 묻지 않습니다.", connectLater: "안전한 연결 필요",
    paymentCopy: "제공업체가 관리하는 결제 참조만 저장할 수 있습니다. 카드번호와 CVV는 수집하지 않습니다.", paymentsDisabled: "결제 비활성화",
    connectionCopy: "OAuth, 공식 API, 앱 연결, 안전한 딥링크만 사용합니다. 제공업체 비밀번호는 받지 않습니다.",
    securityCopy: "패스키는 기기의 암호학적 인증을 확인합니다. Kastiz는 얼굴이나 지문 정보를 받지 않습니다.", passkeyPending: "패스키 설정 필요", export: "ONE Pass 데이터 내보내기",
    deleteIdentity: "Identity Pass 삭제", deleteOnePass: "ONE Pass 삭제 요청", deleteNotice: "삭제와 민감 정보 확인은 로그인된 소유자와 최근 기기 확인이 필요합니다.",
    login: "ONE Pass를 사용하려면 로그인하세요.", unavailable: "이 미리보기에는 ONE Pass 보안 백엔드가 설정되지 않았습니다.", saved: "여행 프로필을 저장했습니다.", ready: "승인 준비 완료", setup: "설정 진행 중", complete: "완료", programs: "개 프로그램", methods: "개 수단", nextLanguage: "Español"
  },
  es: {
    profile: "Perfil", settings: "Ajustes", tagline: "Configúralo una vez. ONE prepara los detalles.", checking: "Comprobando cuenta segura…",
    identity: "Identity Pass", travel: "Perfil de viaje", loyalty: "Cartera de fidelidad", payment: "Centro de pagos", connections: "Conexiones", security: "Seguridad y actividad",
    notSetup: "Sin configurar", handoff: "Solo transferencia segura", passkeyOff: "Passkey no activada", sensitive: "Información sensible", editable: "Editable",
    identityCopy: "El almacenamiento de pasaporte permanece desactivado hasta configurar una bóveda de producción y un proveedor de verificación aprobado.",
    neverImages: "No se guardan imágenes del pasaporte, datos NFC ni biometría.", identityDisabled: "Configuración de identidad no disponible en este entorno",
    travelCopy: "Guarda preferencias normales de viaje separadas de la identidad sensible.", airports: "Aeropuertos de salida", airlines: "Aerolíneas preferidas", hotels: "Marcas de hotel", seat: "Preferencia de asiento",
    window: "Ventana", aisle: "Pasillo", priority: "Prioridad permanente", balance: "Mejor equilibrio", lowest: "Precio total más bajo", points: "Máximos puntos/millas", brands: "Marcas preferidas primero", save: "Guardar perfil de viaje",
    loyaltyCopy: "Solo referencias de membresía. ONE nunca pide contraseñas de programas de fidelidad.", connectLater: "Conexión segura requerida",
    paymentCopy: "Solo se guardan referencias gestionadas por el proveedor. Aquí nunca se recogen números de tarjeta ni CVV.", paymentsDisabled: "Pagos desactivados",
    connectionCopy: "Solo OAuth, APIs oficiales, transferencia de app o enlaces profundos seguros. Nunca se aceptan contraseñas de proveedores.",
    securityCopy: "Las passkeys confirman autenticación criptográfica del dispositivo. Kastiz nunca recibe tu cara ni huella.", passkeyPending: "Configuración de passkey requerida", export: "Exportar datos de ONE Pass",
    deleteIdentity: "Eliminar Identity Pass", deleteOnePass: "Solicitar eliminación de ONE Pass", deleteNotice: "Eliminar o revelar datos sensibles requiere cuenta verificada y confirmación reciente del dispositivo.",
    login: "Inicia sesión para usar ONE Pass.", unavailable: "El backend seguro de ONE Pass no está configurado en esta vista previa.", saved: "Perfil de viaje guardado.", ready: "Listo para aprobar", setup: "Configuración en curso", complete: "Completo", programs: "programas", methods: "métodos", nextLanguage: "English"
  }
};
const t = translations[language] || translations.en;
const copy = key => t[key] || translations.en[key] || key;

document.querySelectorAll("[data-copy]").forEach(element => {
  const value = copy(element.dataset.copy);
  if (value) element.textContent = value;
});
const languageButton = document.getElementById("passLanguage");
languageButton.textContent = copy("nextLanguage");
languageButton.addEventListener("click", () => {
  const next = language === "en" ? "ko" : language === "ko" ? "es" : "en";
  localStorage.setItem("kastiz-one-language", next);
  location.reload();
});

const status = document.getElementById("pageStatus");
const csrf = () => document.cookie.split(";").map(value => value.trim()).find(value => value.startsWith("kastiz_csrf="))?.split("=").slice(1).join("=") || "";
async function api(path, options = {}) {
  const response = await fetch(`/api/v1/one-pass${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(csrf() ? { "X-CSRF-Token": decodeURIComponent(csrf()) } : {}), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error(copy("login"));
  if (!response.ok) throw new Error(data.error?.message || copy("unavailable"));
  return data;
}
const split = value => String(value || "").split(",").map(item => item.trim()).filter(Boolean);

async function load() {
  try {
    const data = await api("");
    document.getElementById("identityStatus").textContent = data.status.identity?.status || copy("notSetup");
    document.getElementById("travelStatus").textContent = data.status.travelProfile ? copy("complete") : copy("notSetup");
    document.getElementById("loyaltyStatus").textContent = `${data.status.loyaltyPrograms} ${copy("programs")}`;
    document.getElementById("paymentStatus").textContent = `${data.status.paymentMethods} ${copy("methods")}`;
    document.getElementById("securityStatus").textContent = data.status.passkeyEnabled ? copy("complete") : copy("passkeyOff");
    document.getElementById("readyStatus").textContent = data.status.ready ? copy("ready") : copy("setup");
    document.querySelector(".pass-readiness").classList.toggle("ready", Boolean(data.status.ready));
    if (data.status.identity?.passportNumber) document.getElementById("maskedPassport").textContent = data.status.identity.passportNumber;

    const travel = await api("/travel-profile");
    if (travel.travelProfile) {
      for (const field of document.getElementById("travelForm").elements) {
        const value = travel.travelProfile[field.name];
        if (field.name && value !== undefined) field.value = Array.isArray(value) ? value.join(", ") : value || "";
      }
    }

    const activity = await api("/activity");
    const list = document.getElementById("activityList");
    list.textContent = "";
    activity.events.forEach(event => {
      const li = document.createElement("li");
      const label = document.createElement("span");
      const time = document.createElement("time");
      label.textContent = String(event.event_type || "activity").replaceAll("_", " ");
      time.textContent = new Date(event.created_at).toLocaleString(language);
      li.append(label, time);
      list.append(li);
    });
  } catch (error) {
    status.textContent = error.message;
  }
}

document.getElementById("travelForm").addEventListener("submit", async event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  for (const key of ["departure_airports", "airlines", "hotel_brands"]) data[key] = split(data[key]);
  try {
    await api("/travel-profile", { method: "POST", body: JSON.stringify(data) });
    status.textContent = copy("saved");
    document.getElementById("travelStatus").textContent = copy("complete");
  } catch (error) {
    status.textContent = error.message;
  }
});

load();
