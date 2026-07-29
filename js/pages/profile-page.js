import { clearCategory, clearProfile, deletePreference, exportProfileSummary, readProfile, setMemoryEnabled, updatePreference } from "../profile/profile-memory-engine.js";
import { trackEvent } from "../analytics.js";
import { exportAccountData, getAccountProfile, getSession, logout, requestAccountDeletion, updateAccountProfile } from "../auth/account-client.js";

const copy = {
  en: {
    settings:"Settings", privacy:"Privacy", profile:"PROFILE", title:"Information you choose to save.", intro:"ONE remembers only what you choose to save. Non-sensitive preferences stay on this device unless you sign in and sync.", local:"Device-local · Account sync when signed in", starterTitle:"Help ONE understand you.", starterCopy:"Save optional preferences to make future missions faster and more personal.", optional:"Optional", preferredName:"Preferred name", country:"Country", cityRegion:"City or region", languagePreference:"Preferred language", departureAirport:"Usual departure airport", airlines:"Airline preferences", hotelStyle:"Hotel preferences", seatPreference:"Seat preference", tripPace:"Travel style", budgetPreference:"Budget preference", timeFormat:"Time format", currencyPreference:"Currency", cuisines:"Favorite cuisines", dislikedFoods:"Foods you dislike", dietaryPreferences:"Dietary preferences", accessibilityPreferences:"Accessibility preferences", emergencyContact:"Emergency contact optional", starterSafety:"Do not enter passwords, passport scans, payment cards, government IDs, medical records, sensitive documents or provider passwords.", saveProfile:"Save preferences", profileSaved:"Preferences saved. ONE can suggest them in future missions.", accountSaved:"Saved to your ONE account.", memory:"Memory", memoryCopy:"ONE can remember information you explicitly choose to save so future missions require fewer steps.", enabled:"Memory enabled", export:"Export profile summary", exportAccount:"Export account data", logout:"Sign out", deleteAccount:"Request account deletion", clearAll:"Clear all saved preferences", privacyMemory:"Privacy and Memory", safety:"Passport scans, government IDs, payment cards, medical records, sensitive documents and provider passwords are not stored here. Nothing is shared with a provider before review and explicit approval.", details:"Read profile privacy details", edit:"Edit", delete:"Delete", clear:"Clear category", empty:"Nothing saved yet.", source:"Saved by you", paused:"Memory is paused. Saved values remain until you delete them.", on:"Memory is on.", confirmDelete:"Delete this saved preference?", confirmClear:"Clear this entire category?", confirmAll:"Clear every saved preference?", confirmAccountDelete:"Request account deletion? This records a request but does not instantly erase provider/legal records.", exported:"Profile summary downloaded.", accountExported:"Account data downloaded.", signedOut:"Signed out.", newValue:"Enter the updated preference", guest:"Not signed in. Saving on this device.", account:"Signed in. Profile can sync to your ONE account.", setup:"Account backend is not configured on this preview."
  },
  ko: {
    settings:"설정", privacy:"개인정보", profile:"프로필", title:"저장할 정보를 직접 선택하세요.", intro:"ONE은 사용자가 선택한 정보만 기억합니다. 로그인하면 안전한 계정에 동기화할 수 있습니다.", local:"기기 저장 · 로그인 시 계정 동기화", starterTitle:"ONE이 당신을 더 잘 이해하도록 알려주세요.", starterCopy:"선택한 선호 정보를 저장하면 다음 미션을 더 빠르고 자연스럽게 준비할 수 있습니다.", optional:"선택 사항", preferredName:"선호 이름", country:"국가", cityRegion:"도시 또는 지역", languagePreference:"선호 언어", departureAirport:"주로 이용하는 출발 공항", airlines:"선호 항공사", hotelStyle:"선호 숙소 유형", seatPreference:"좌석 선호", tripPace:"여행 스타일", budgetPreference:"예산 선호", timeFormat:"시간 표시", currencyPreference:"통화", cuisines:"좋아하는 음식", dislikedFoods:"싫어하는 음식", dietaryPreferences:"식단 선호", accessibilityPreferences:"접근성 선호", emergencyContact:"비상 연락처 선택", starterSafety:"비밀번호, 여권 스캔, 결제 카드, 정부 ID, 의료 기록, 민감 문서, 제공업체 비밀번호는 입력하지 마세요.", saveProfile:"선호 정보 저장", profileSaved:"선호 정보를 저장했습니다. 다음 미션부터 ONE이 이 설정을 제안합니다.", accountSaved:"ONE 계정에 저장했습니다.", memory:"메모리", memoryCopy:"ONE은 사용자가 명시적으로 저장한 정보만 기억해 다음 미션을 더 간단하게 준비합니다.", enabled:"메모리 사용", export:"프로필 요약 내보내기", exportAccount:"계정 데이터 내보내기", logout:"로그아웃", deleteAccount:"계정 삭제 요청", clearAll:"저장된 설정 모두 삭제", privacyMemory:"개인정보 및 메모리", safety:"여권 스캔, 정부 ID, 결제 카드, 의료 기록, 민감 문서, 제공업체 비밀번호는 여기에 저장하지 않습니다. 검토와 명시적 승인 전에는 제공업체와 정보를 공유하지 않습니다.", details:"프로필 개인정보 안내", edit:"수정", delete:"삭제", clear:"카테고리 비우기", empty:"아직 저장된 정보가 없습니다.", source:"사용자가 저장", paused:"메모리가 일시 중지되었습니다. 삭제하기 전까지 저장된 값은 유지됩니다.", on:"메모리가 켜졌습니다.", confirmDelete:"이 저장된 설정을 삭제할까요?", confirmClear:"이 카테고리를 모두 비울까요?", confirmAll:"저장된 설정을 모두 삭제할까요?", confirmAccountDelete:"계정 삭제를 요청할까요? 제공업체/법적 보존 기록은 즉시 삭제되지 않을 수 있습니다.", exported:"프로필 요약을 내려받았습니다.", accountExported:"계정 데이터를 내려받았습니다.", signedOut:"로그아웃했습니다.", newValue:"변경할 설정을 입력하세요", guest:"로그인하지 않았습니다. 이 기기에 저장합니다.", account:"로그인되었습니다. 프로필을 ONE 계정에 동기화할 수 있습니다.", setup:"이 미리보기에는 계정 백엔드가 설정되지 않았습니다."
  },
  es: {
    settings:"Ajustes", privacy:"Privacidad", profile:"PERFIL", title:"Elige qué información guardar.", intro:"ONE recuerda solo lo que decides guardar. Al iniciar sesión puede sincronizarse con tu cuenta.", local:"Guardado local · Sincronización al iniciar sesión", starterTitle:"Ayuda a ONE a entenderte.", starterCopy:"Guardar preferencias opcionales hace que las próximas misiones sean más rápidas y personales.", optional:"Opcional", preferredName:"Nombre preferido", country:"País", cityRegion:"Ciudad o región", languagePreference:"Idioma preferido", departureAirport:"Aeropuerto habitual", airlines:"Aerolíneas preferidas", hotelStyle:"Tipo de hotel", seatPreference:"Asiento preferido", tripPace:"Estilo de viaje", budgetPreference:"Presupuesto", timeFormat:"Formato de hora", currencyPreference:"Moneda", cuisines:"Comidas favoritas", dislikedFoods:"Comidas que no quieres", dietaryPreferences:"Preferencias alimentarias", accessibilityPreferences:"Accesibilidad", emergencyContact:"Contacto de emergencia opcional", starterSafety:"No introduzcas contraseñas, pasaportes escaneados, tarjetas, IDs oficiales, historiales médicos, documentos sensibles o contraseñas de proveedores.", saveProfile:"Guardar preferencias", profileSaved:"Preferencias guardadas. ONE podrá sugerirlas en futuras misiones.", accountSaved:"Guardado en tu cuenta ONE.", memory:"Memoria", memoryCopy:"ONE recuerda solo información que apruebas explícitamente para reducir pasos en futuras misiones.", enabled:"Memoria activada", export:"Exportar resumen", exportAccount:"Exportar datos de cuenta", logout:"Cerrar sesión", deleteAccount:"Solicitar eliminación", clearAll:"Borrar preferencias", privacyMemory:"Privacidad y memoria", safety:"No se guardan pasaportes escaneados, IDs oficiales, tarjetas, historiales médicos, documentos sensibles ni contraseñas de proveedores. Nada se comparte antes de revisión y aprobación explícita.", details:"Leer privacidad del perfil", edit:"Editar", delete:"Eliminar", clear:"Vaciar categoría", empty:"Nada guardado todavía.", source:"Guardado por ti", paused:"Memoria pausada. Los valores quedan hasta que los elimines.", on:"Memoria activada.", confirmDelete:"¿Eliminar esta preferencia?", confirmClear:"¿Vaciar esta categoría?", confirmAll:"¿Eliminar todas las preferencias?", confirmAccountDelete:"¿Solicitar eliminación de cuenta? Se registra una solicitud; no borra al instante registros legales/proveedor.", exported:"Resumen descargado.", accountExported:"Datos de cuenta descargados.", signedOut:"Sesión cerrada.", newValue:"Introduce el nuevo valor", guest:"No has iniciado sesión. Guardando en este dispositivo.", account:"Sesión iniciada. El perfil puede sincronizarse con tu cuenta ONE.", setup:"El backend de cuentas no está configurado en esta vista previa."
  }
};

const categoryNames = { identity:["General","일반","General"], travel:["Travel","여행","Viajes"], food:["Food","음식","Comida"], shopping:["Shopping","쇼핑","Compras"], housing:["Housing","주거","Vivienda"], education:["Education","교육","Educación"], business:["Business","비즈니스","Negocios"], accessibility:["Accessibility","접근성","Accesibilidad"] };
const starterFields = {
  preferredName:["identity","preferredName"], country:["identity","country"], cityRegion:["identity","cityRegion"], language:["identity","language"], departureAirport:["travel","departureAirport"], airlines:["travel","preferredAirlines"], hotelStyle:["travel","preferredHotelTypes"], seatPreference:["travel","seatPreference"], tripPace:["travel","travelStyle"], budgetPreference:["travel","budgetPreference"], timeFormat:["identity","timeFormat"], currencyPreference:["identity","currencyPreference"], cuisines:["food","favoriteCuisines"], dislikedFoods:["food","dislikedFoods"], dietaryPreferences:["food","dietaryPreferences"], accessibilityPreferences:["accessibility","accessibilityPreferences"], emergencyContact:["identity","emergencyContact"]
};
let language = localStorage.getItem("kastiz-one-language") || (navigator.language.startsWith("ko") ? "ko" : navigator.language.startsWith("es") ? "es" : "en");
const langIndex = () => language === "ko" ? 1 : language === "es" ? 2 : 0;
const t = key => copy[language]?.[key] || copy.en[key] || key;
const status = document.getElementById("profileStatus");
const container = document.getElementById("profileCategories");
const toggle = document.getElementById("memoryEnabled");
const starterForm = document.getElementById("starterProfileForm");
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
const splitValues = value => String(value || "").split(",").map(item => item.trim()).filter(Boolean);
const download = (filename, text, type = "text/plain") => {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([text], { type }));
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
};

const render = () => {
  const profile = readProfile();
  toggle.checked = profile.profileConsent.enabled;
  document.documentElement.lang = language;
  document.querySelectorAll("[data-copy]").forEach(element => { element.textContent = t(element.dataset.copy); });
  document.getElementById("profileLanguage").textContent = language === "ko" ? "English" : language === "es" ? "한국어" : "Español";
  container.innerHTML = Object.entries(categoryNames).map(([category, names]) => {
    const fields = Object.entries(profile.categories[category]);
    return `<article class="category-card" data-category="${category}"><div class="category-head"><h2>${names[langIndex()]}</h2><button class="clear-category" type="button" data-clear="${category}">${t("clear")}</button></div>${fields.length ? fields.map(([key,record]) => `<div class="profile-field"><div><span class="field-value">${escapeHtml(record.value)}</span><div class="field-meta">${t("source")} · ${escapeHtml(key)}</div></div><div class="field-actions"><button type="button" data-edit="${category}:${key}">${t("edit")}</button><button type="button" data-delete="${category}:${key}">${t("delete")}</button></div></div>`).join("") : `<p class="empty">${t("empty")}</p>`}</article>`;
  }).join("");
};

const populateStarterForm = () => {
  const profile = readProfile();
  Object.entries(starterFields).forEach(([name,[category,key]]) => {
    const input = starterForm.elements.namedItem(name);
    if (input) input.value = profile.categories[category]?.[key]?.value || "";
  });
};

const accountProfilePayload = () => ({
  display_name: starterForm.elements.namedItem("preferredName")?.value.trim() || null,
  preferred_language: language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul",
  country: starterForm.elements.namedItem("country")?.value.trim() || null,
  city: starterForm.elements.namedItem("cityRegion")?.value.trim() || null,
  preferred_airport: starterForm.elements.namedItem("departureAirport")?.value.trim() || null,
  preferred_airlines: splitValues(starterForm.elements.namedItem("airlines")?.value),
  preferred_hotel_types: splitValues(starterForm.elements.namedItem("hotelStyle")?.value),
  seat_preference: starterForm.elements.namedItem("seatPreference")?.value.trim() || null,
  travel_style: starterForm.elements.namedItem("tripPace")?.value.trim() || null,
  dietary_preferences: splitValues(starterForm.elements.namedItem("dietaryPreferences")?.value),
  accessibility_preferences: splitValues(starterForm.elements.namedItem("accessibilityPreferences")?.value),
  favorite_cuisines: splitValues(starterForm.elements.namedItem("cuisines")?.value),
  disliked_foods: splitValues(starterForm.elements.namedItem("dislikedFoods")?.value),
  budget_preference: starterForm.elements.namedItem("budgetPreference")?.value.trim() || null,
  time_format: ["12h","24h"].includes(starterForm.elements.namedItem("timeFormat")?.value.trim()) ? starterForm.elements.namedItem("timeFormat")?.value.trim() : null,
  currency_preference: /^[A-Za-z]{3}$/.test(starterForm.elements.namedItem("currencyPreference")?.value.trim() || "") ? starterForm.elements.namedItem("currencyPreference")?.value.trim().toUpperCase() : null,
  emergency_contact: starterForm.elements.namedItem("emergencyContact")?.value.trim() ? { label: starterForm.elements.namedItem("emergencyContact").value.trim().slice(0, 180), userSupplied: true } : {},
  memory_enabled: toggle.checked
});

starterForm.addEventListener("submit", async event => {
  event.preventDefault();
  setMemoryEnabled(true);
  Object.entries(starterFields).forEach(([name,[category,key]]) => {
    const value = starterForm.elements.namedItem(name)?.value.trim();
    if (value) updatePreference(category,key,value,"profile-onboarding");
  });
  status.textContent = t("profileSaved");
  try {
    const session = await getSession();
    if (session.authenticated) {
      await updateAccountProfile(accountProfilePayload());
      status.textContent = t("accountSaved");
    } else if (session.setupRequired) {
      status.textContent = t("setup");
    }
  } catch {
    status.textContent = t("profileSaved");
  }
  trackEvent("preference_saved", { page:"profile", language, mission_category:"profile", success:true });
  render();
});

toggle.addEventListener("change", async () => {
  setMemoryEnabled(toggle.checked);
  status.textContent = toggle.checked ? t("on") : t("paused");
  try { await updateAccountProfile({ memory_enabled: toggle.checked }); } catch {}
  trackEvent(toggle.checked ? "memory_enabled" : "memory_disabled", { page:"profile", language });
  render();
});
container.addEventListener("click", event => {
  const edit = event.target.dataset.edit, deletion = event.target.dataset.delete, categoryToClear = event.target.dataset.clear;
  if (edit) { const [category,key] = edit.split(":"), current = readProfile().categories[category]?.[key]?.value || "", value = prompt(t("newValue"), current); if (value !== null && value.trim()) { updatePreference(category, key, value, "profile-page"); trackEvent("profile_field_updated", { page:"profile", language, mission_category:category }); render(); populateStarterForm(); } }
  if (deletion && confirm(t("confirmDelete"))) { const [category,key] = deletion.split(":"); deletePreference(category, key); trackEvent("profile_field_deleted", { page:"profile", language, mission_category:category }); render(); populateStarterForm(); }
  if (categoryToClear && confirm(t("confirmClear"))) { clearCategory(categoryToClear); trackEvent("profile_category_cleared", { page:"profile", language, mission_category:categoryToClear }); render(); populateStarterForm(); }
});
document.getElementById("clearProfile").addEventListener("click", () => { if (confirm(t("confirmAll"))) { clearProfile(); render(); populateStarterForm(); } });
document.getElementById("exportProfile").addEventListener("click", () => {
  const rows = exportProfileSummary(), text = ["Kastiz ONE profile summary", t("local"), "", ...rows.map(row => `${row.category} · ${row.field}: ${row.value}`)].join("\n");
  download("kastiz-one-profile-summary.txt", text);
  status.textContent = t("exported");
  trackEvent("profile_export_requested", { page:"profile", language });
});
document.getElementById("exportAccount").addEventListener("click", async () => {
  try {
    const data = await exportAccountData();
    download("kastiz-one-account-export.json", JSON.stringify(data, null, 2), "application/json");
    status.textContent = t("accountExported");
  } catch (error) { status.textContent = error.message || t("guest"); }
});
document.getElementById("deleteAccount").addEventListener("click", async () => {
  if (!confirm(t("confirmAccountDelete"))) return;
  try { const result = await requestAccountDeletion(); status.textContent = result.message || t("deleteAccount"); }
  catch (error) { status.textContent = error.message || t("guest"); }
});
document.getElementById("logoutAccount").addEventListener("click", async () => {
  try { await logout(); status.textContent = t("signedOut"); }
  catch { status.textContent = t("signedOut"); }
});
document.getElementById("profileLanguage").addEventListener("click", () => {
  language = language === "ko" ? "en" : language === "en" ? "es" : "ko";
  localStorage.setItem("kastiz-one-language", language);
  trackEvent("language_changed", { page:"profile", language });
  render();
});

getSession().then(async session => {
  status.textContent = session.authenticated ? t("account") : session.setupRequired ? t("setup") : t("guest");
  if (session.authenticated) {
    try {
      const account = await getAccountProfile();
      if (account.profile?.memory_enabled === false) setMemoryEnabled(false);
    } catch {}
  }
});
trackEvent("profile_viewed", { page:"profile", language });
render();
populateStarterForm();
