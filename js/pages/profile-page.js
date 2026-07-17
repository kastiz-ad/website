import { clearCategory, clearProfile, deletePreference, exportProfileSummary, readProfile, setMemoryEnabled, updatePreference } from "../profile/profile-memory-engine.js";
import { trackEvent } from "../analytics.js";

const copy = {
  en: {
    settings:"Settings", privacy:"Privacy", profile:"PROFILE", title:"Information you choose to save.", intro:"ONE remembers only what you choose to save. Non-sensitive preferences stay on this device in the current prototype.", local:"Device-local · Not account-synced", starterTitle:"Help ONE understand you.", starterCopy:"Save optional preferences to make future missions faster and more personal.", optional:"Optional", preferredName:"Preferred name", cityRegion:"City or region", languagePreference:"Preferred language", departureAirport:"Usual departure airport", airlines:"Airline preferences", hotelStyle:"Hotel preferences", tripPace:"Travel style", cuisines:"Favorite cuisines", dislikedFoods:"Foods you dislike", dietaryPreferences:"Dietary preferences", starterSafety:"Do not enter a full address, payment information, passport, visa, health, child, password or emergency-contact data.", saveProfile:"Save preferences", profileSaved:"Preferences saved. ONE can now suggest them in future missions.", memory:"Memory", memoryCopy:"ONE can remember information you choose to save so future missions require fewer steps.", enabled:"Memory enabled", export:"Export profile summary", clearAll:"Clear all saved preferences", privacyMemory:"Privacy and Memory", safety:"Passport, visa, national ID, payment, health, child and emergency-contact data are not stored here. Nothing is shared with a provider before review and explicit approval.", details:"Read profile privacy details", edit:"Edit", delete:"Delete", clear:"Clear category", empty:"Nothing saved yet.", source:"Device-local · Saved by you", paused:"Memory is paused. Saved values remain until you delete them.", on:"Memory is on.", confirmDelete:"Delete this saved preference?", confirmClear:"Clear this entire category?", confirmAll:"Clear every saved preference?", exported:"Profile summary downloaded.", newValue:"Enter the updated preference"
  },
  ko: {
    settings:"설정", privacy:"개인정보", profile:"프로필", title:"사용자가 저장을 선택한 정보", intro:"ONE은 사용자가 저장을 허용한 정보만 기억합니다. 현재 프로토타입의 비민감 설정은 이 기기에만 저장됩니다.", local:"기기 저장 · 계정 동기화 안 됨", starterTitle:"ONE이 사용자를 이해하도록 알려주세요.", starterCopy:"선택한 선호 정보를 저장하면 다음 미션을 더 빠르고 자연스럽게 준비할 수 있습니다.", optional:"선택 사항", preferredName:"선호 이름", cityRegion:"도시 또는 지역", languagePreference:"선호 언어", departureAirport:"주로 이용하는 출발 공항", airlines:"선호 항공사", hotelStyle:"선호 호텔", tripPace:"여행 스타일", cuisines:"좋아하는 음식", dislikedFoods:"싫어하는 음식", dietaryPreferences:"식단 선호", starterSafety:"상세 주소, 결제 정보, 여권, 비자, 건강, 아동, 비밀번호 또는 비상 연락처 정보는 입력하지 마세요.", saveProfile:"선호 정보 저장", profileSaved:"선호 정보를 저장했습니다. 다음 미션부터 ONE이 이 설정을 제안합니다.", memory:"메모리", memoryCopy:"ONE은 사용자가 저장을 허용한 정보를 기억하여 다음 미션을 더 간단하게 준비할 수 있습니다.", enabled:"메모리 사용", export:"프로필 요약 내보내기", clearAll:"저장된 설정 모두 삭제", privacyMemory:"개인정보 및 메모리", safety:"여권, 비자, 주민등록 정보, 결제, 건강, 아동 및 비상연락처 정보는 여기에 저장하지 않습니다. 검토와 명시적 승인 전에는 제공업체와 정보를 공유하지 않습니다.", details:"프로필 개인정보 안내", edit:"수정", delete:"삭제", clear:"카테고리 비우기", empty:"아직 저장된 정보가 없습니다.", source:"기기 저장 · 사용자가 저장", paused:"메모리가 일시 중지되었습니다. 삭제하기 전까지 저장된 값은 유지됩니다.", on:"메모리가 켜졌습니다.", confirmDelete:"이 저장된 설정을 삭제할까요?", confirmClear:"이 카테고리를 모두 비울까요?", confirmAll:"저장된 설정을 모두 삭제할까요?", exported:"프로필 요약을 내려받았습니다.", newValue:"변경할 설정을 입력하세요"
  }
};

const categoryNames = { identity:["General","일반"], travel:["Travel","여행"], food:["Food","음식"], shopping:["Shopping","쇼핑"], housing:["Housing","주거"], education:["Education","교육"], business:["Business","비즈니스"], accessibility:["Accessibility","접근성"] };
const starterFields = {
  preferredName:["identity","preferredName"], cityRegion:["identity","cityRegion"], language:["identity","language"], departureAirport:["travel","departureAirport"], airlines:["travel","airlines"], hotelStyle:["travel","hotelStyle"], tripPace:["travel","tripPace"], cuisines:["food","cuisines"], dislikedFoods:["food","dislikedFoods"], dietaryPreferences:["food","dietaryPreferences"]
};
let language = localStorage.getItem("kastiz-one-language") || (navigator.language.startsWith("ko") ? "ko" : "en");
const ko = () => language === "ko";
const t = (key) => copy[language][key];
const status = document.getElementById("profileStatus");
const container = document.getElementById("profileCategories");
const toggle = document.getElementById("memoryEnabled");
const starterForm = document.getElementById("starterProfileForm");
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));

const render = () => {
  const profile = readProfile();
  toggle.checked = profile.profileConsent.enabled;
  document.documentElement.lang = language;
  document.querySelectorAll("[data-copy]").forEach((element) => { element.textContent = t(element.dataset.copy); });
  document.getElementById("profileLanguage").textContent = ko() ? "English" : "한국어";
  container.innerHTML = Object.entries(categoryNames).map(([category, names]) => {
    const fields = Object.entries(profile.categories[category]);
    return `<article class="category-card" data-category="${category}"><div class="category-head"><h2>${names[ko()?1:0]}</h2><button class="clear-category" type="button" data-clear="${category}">${t("clear")}</button></div>${fields.length ? fields.map(([key,record]) => `<div class="profile-field"><div><span class="field-value">${escapeHtml(record.value)}</span><div class="field-meta">${t("source")}</div></div><div class="field-actions"><button type="button" data-edit="${category}:${key}">${t("edit")}</button><button type="button" data-delete="${category}:${key}">${t("delete")}</button></div></div>`).join("") : `<p class="empty">${t("empty")}</p>`}</article>`;
  }).join("");
};

const populateStarterForm = () => {
  const profile = readProfile();
  Object.entries(starterFields).forEach(([name,[category,key]]) => {
    const input = starterForm.elements.namedItem(name);
    if (input) input.value = profile.categories[category]?.[key]?.value || "";
  });
};

starterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setMemoryEnabled(true);
  Object.entries(starterFields).forEach(([name,[category,key]]) => {
    const value = starterForm.elements.namedItem(name)?.value.trim();
    if (value) updatePreference(category,key,value,"profile-onboarding");
  });
  status.textContent = t("profileSaved");
  trackEvent("preference_saved",{page:"profile",language,mission_category:"profile",success:true});
  render();
});

toggle.addEventListener("change", () => { setMemoryEnabled(toggle.checked); status.textContent = toggle.checked ? t("on") : t("paused"); trackEvent(toggle.checked?"memory_enabled":"memory_disabled",{page:"profile",language}); render(); });
container.addEventListener("click", (event) => {
  const edit=event.target.dataset.edit, deletion=event.target.dataset.delete, categoryToClear=event.target.dataset.clear;
  if(edit){const [category,key]=edit.split(":"),current=readProfile().categories[category]?.[key]?.value||"",value=prompt(t("newValue"),current);if(value!==null&&value.trim()){updatePreference(category,key,value,"profile-page");trackEvent("profile_field_updated",{page:"profile",language,mission_category:category});render();populateStarterForm();}}
  if(deletion&&confirm(t("confirmDelete"))){const [category,key]=deletion.split(":");deletePreference(category,key);trackEvent("profile_field_deleted",{page:"profile",language,mission_category:category});render();populateStarterForm();}
  if(categoryToClear&&confirm(t("confirmClear"))){clearCategory(categoryToClear);trackEvent("profile_category_cleared",{page:"profile",language,mission_category:categoryToClear});render();populateStarterForm();}
});
document.getElementById("clearProfile").addEventListener("click",()=>{if(confirm(t("confirmAll"))){clearProfile();render();populateStarterForm();}});
document.getElementById("exportProfile").addEventListener("click",()=>{const rows=exportProfileSummary(),text=["Kastiz ONE profile summary",t("local"),"",...rows.map(row=>`${row.category} · ${row.field}: ${row.value}`)].join("\n"),anchor=document.createElement("a");anchor.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));anchor.download="kastiz-one-profile-summary.txt";anchor.click();URL.revokeObjectURL(anchor.href);status.textContent=t("exported");trackEvent("profile_export_requested",{page:"profile",language});});
document.getElementById("profileLanguage").addEventListener("click",()=>{language=ko()?"en":"ko";localStorage.setItem("kastiz-one-language",language);trackEvent("language_changed",{page:"profile",language});render();});
trackEvent("profile_viewed",{page:"profile",language});
render();
populateStarterForm();
