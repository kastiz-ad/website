import { getProfileForMission, getSampleProfile, getSuggestedPrefill, saveApprovedPreference, useSampleProfile } from "../profile/profile-memory-engine.js";
import { trackEvent } from "../analytics.js";

const CATEGORY_FIELDS = Object.freeze({
  tutoring: [
    ["subject", "Subject or language", "과목 또는 언어", "English", "text"],
    ["level", "Learner level", "학습자 수준", "Beginner / Intermediate / Advanced", "text"],
    ["format", "Online or offline", "온라인 또는 오프라인", "Online / Offline", "text"],
    ["area", "City or area", "도시 또는 지역", "Optional for online lessons", "text"],
    ["schedule", "Preferred schedule", "선호 일정", "Tue and Thu evenings", "text"],
    ["budget", "Monthly or per-session budget", "월 또는 회당 예산", "₩40,000 per session", "text"]
  ],
  childcare: [
    ["area", "Area", "지역", "Neighborhood or city", "text"],
    ["date", "Date", "날짜", "", "date"],
    ["startTime", "Start time", "시작 시간", "", "time"],
    ["endTime", "End time", "종료 시간", "", "time"],
    ["ageRange", "Child age range", "아이 연령", "3 and 6 years", "text"],
    ["children", "Number of children", "아이 수", "1", "number"],
    ["languagePreference", "Language preference", "언어 선호", "Korean / English / No preference", "text"],
    ["verificationPreference", "Certification or background-check preference", "자격 또는 신원 조회 선호", "Certification / background check", "text"],
    ["budget", "Budget", "예산", "₩25,000 per hour", "text"]
  ],
  shopping: [
    ["product", "Product type", "제품 유형", "Laptop", "text"],
    ["budget", "Budget", "예산", "₩2,000,000", "text"],
    ["useCase", "Main use", "주요 용도", "Design, coding, office work", "text"],
    ["priority", "Priority", "우선순위", "Performance, battery, value", "text"],
    ["country", "Purchase or delivery country", "구매 또는 배송 국가", "South Korea", "text"],
    ["brands", "Preferred brands", "선호 브랜드", "Optional", "text"]
  ],
  moving: [
    ["origin", "Current country or city", "현재 국가 또는 도시", "Origin", "text"],
    ["destination", "Destination", "목적지", "South Korea", "text"],
    ["targetDate", "Desired move date", "희망 이주일", "", "date"],
    ["household", "Household size", "가구 구성", "2 adults, 1 child", "text"],
    ["housingBudget", "Housing budget", "주거 예산", "Monthly or deposit range", "text"],
    ["services", "Required services", "필요 서비스", "Visa, housing, shipping", "text"]
  ],
  business: [
    ["country", "Country", "국가", "South Korea", "text"],
    ["businessType", "Business type", "사업 유형", "Software, retail, consulting", "text"],
    ["launchDate", "Desired launch date", "희망 시작일", "", "date"],
    ["budget", "Available budget", "가용 예산", "Setup budget", "text"],
    ["support", "Registration and support needs", "등록 및 지원 필요사항", "Registration, tax, suppliers", "text"]
  ],
  language_exchange: [
    ["language", "Target language", "목표 언어", "English", "text"],
    ["level", "Current level", "현재 수준", "Beginner / Intermediate / Advanced", "text"],
    ["format", "Online or nearby", "온라인 또는 근거리", "Online / Nearby", "text"],
    ["schedule", "Preferred schedule", "선호 일정", "Weekend afternoons", "text"]
  ],
  general_mission: [
    ["outcome", "What outcome would make this successful?", "어떤 결과가 나오면 성공인가요?", "Desired outcome", "text"],
    ["constraints", "What timing, budget or limits should ONE respect?", "ONE이 지켜야 할 일정, 예산 또는 제한은 무엇인가요?", "Optional", "text"]
  ]
});

const TRAVEL_STEPS = [
  { title: ["Where are you going?", "어디로 가시나요?"], fields: [["destination", "Destination", "목적지", "Japan", "text"]] },
  { title: ["When?", "언제 여행하시나요?"], fields: [["startDate", "Start date", "출국 날짜", "", "date"], ["endDate", "End date", "귀국 날짜", "", "date"]] },
  { title: ["Travelers", "여행 인원"], fields: [["adults", "Adults", "성인", "1", "number"], ["children", "Children", "어린이", "0", "number"]] },
  { title: ["Departure location", "출발지"], fields: [["departure", "City or airport", "도시 또는 공항", "Seoul / ICN", "text"]] },
  { title: ["Budget and priorities", "예산과 우선순위"], fields: [["budget", "Total budget", "총예산", "₩3,000,000", "text"], ["priority", "Priority", "우선순위", "Balanced", "select"], ["preferences", "Optional preferences", "선호 사항", "Airline, hotel or itinerary preferences", "text"]] }
];

const esc = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const iso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const inferTravelDestination = (mission = "") => {
  const text = String(mission).toLowerCase();
  const destinations = [
    ["New York", ["new york", "nyc", "뉴욕"]],
    ["Japan", ["japan", "tokyo", "일본", "도쿄"]],
    ["Madrid", ["madrid", "마드리드"]],
    ["Colombia", ["colombia", "bogota", "bogotá", "콜롬비아", "보고타"]],
    ["South Korea", ["south korea", "korea", "seoul", "대한민국", "한국", "서울"]],
    ["Paris", ["paris", "파리"]],
    ["London", ["london", "런던"]],
    ["Canada", ["canada", "캐나다"]],
    ["Thailand", ["thailand", "bangkok", "태국", "방콕"]],
    ["Singapore", ["singapore", "싱가포르"]],
    ["Australia", ["australia", "sydney", "호주", "시드니"]],
    ["Italy", ["italy", "rome", "이탈리아", "로마"]],
    ["Vietnam", ["vietnam", "hanoi", "베트남", "하노이"]]
  ];
  return destinations.find(([, aliases]) => aliases.some((alias) => text.includes(alias)))?.[0] || "";
};

const getDialog = () => {
  let dialog = document.getElementById("missionFollowUpDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "missionFollowUpDialog";
    dialog.className = "mission-followup-modal";
    dialog.setAttribute("aria-labelledby", "missionFollowUpTitle");
    document.body.append(dialog);
  }
  return dialog;
};

const renderField = ([name, en, ko, placeholder, type], language, required = true) => {
  const label = language === "ko" ? ko : en;
  if (type === "select") return `<label><span>${label}</span><select name="${name}" ${required ? "required" : ""}><option value="cheapest">${language === "ko" ? "최저가" : "Cheapest"}</option><option value="quality">${language === "ko" ? "최고 품질" : "Best quality"}</option><option value="fastest">${language === "ko" ? "최단 시간" : "Fastest"}</option><option value="balanced" selected>${language === "ko" ? "균형형" : "Balanced"}</option></select></label>`;
  const min = type === "number" ? ' min="0"' : "";
  const className = type === "date" ? ' class="mission-followup-date-field"' : "";
  return `<label${className}><span>${label}</span><input name="${name}" type="${type}" placeholder="${esc(placeholder)}"${min} ${required ? "required" : ""}></label>`;
};

export function openMissionFollowUp({ mission, type, language = "en", demoMode = false, restoreFocusTo, onComplete }) {
  const dialog = getDialog();
  const ko = language === "ko";
  const travel = type === "travel";
  const steps = travel ? TRAVEL_STEPS : [{ title: ["Mission details", "미션 세부 정보"], fields: CATEGORY_FIELDS[type] || CATEGORY_FIELDS.general_mission }];
  const savedProfile = getProfileForMission(type);
  const savedPrefill = getSuggestedPrefill(type);
  const sampleProfile = demoMode ? getSampleProfile() : null;
  const sampleTravel = sampleProfile?.travel || {};
  const suggested = travel ? { ...savedPrefill, ...(sampleTravel.departureAirport ? { departure: sampleTravel.departureAirport, priority: sampleTravel.tripPace?.toLowerCase(), preferences: [sampleTravel.cabin, sampleTravel.seat, sampleTravel.hotelStyle].filter(Boolean).join(" · ") } : {}) } : savedPrefill;
  const suggestedEntries = Object.entries(suggested).filter(([, value]) => value);
  trackEvent("followup_opened", { page: "home", language, mission_category: type, demo_mode: demoMode });
  if (suggestedEntries.length) trackEvent("saved_profile_suggestion_shown", { page: "home", language, mission_category: type, demo_mode: demoMode });
  let current = 0;

  dialog.innerHTML = `<form method="dialog" class="mission-followup-form" novalidate>
    <button class="schedule-modal-close" type="button" data-action="cancel" aria-label="${ko ? "닫기" : "Close"}">×</button>
    <p class="login-modal-kicker">KASTIZ ONE</p>
    <h2 id="missionFollowUpTitle">${ko ? "미션에 필요한 정보를 알려주세요" : "Help ONE prepare the mission"}</h2>
    <p class="mission-followup-mission">${esc(mission)}</p>
    ${suggestedEntries.length ? `<aside class="profile-prefill-summary" aria-label="${ko ? "저장된 설정" : "Saved preferences"}"><strong>${sampleProfile ? (ko ? "샘플 프로필" : "Sample profile") : (ko ? "저장된 설정 사용" : "Using saved preferences")}</strong><ul>${suggestedEntries.map(([key, value]) => `<li><span>${esc(key)}</span><b>${esc(value)}</b></li>`).join("")}</ul><p>${ko ? "필요하면 아래에서 언제든 변경할 수 있습니다." : "You can review and change these values below."}</p></aside>` : ""}
    ${demoMode && !sampleProfile && !savedProfile.enabled ? `<button type="button" class="profile-sample-button" data-action="sample">${ko ? "샘플 프로필 사용" : "Use sample profile"}</button>` : ""}
    <div class="mission-followup-progress" aria-live="polite"></div>
    ${steps.map((step, index) => `<section class="mission-followup-step" data-step="${index}" ${index ? "hidden" : ""}><h3>${ko ? step.title[1] : step.title[0]}</h3><div class="mission-followup-fields">${step.fields.map((field, fieldIndex) => renderField(field, language, field[0] !== "preferences" && field[0] !== "brands" && field[0] !== "constraints")).join("")}</div></section>`).join("")}
    <label class="profile-remember-row"><input type="checkbox" name="rememberPreferences"><span>${ko ? "다음 미션에도 이 설정을 사용하기" : "Save these preferences for future missions"}</span></label>
    <p class="profile-local-note">${ko ? "선택한 비민감 설정만 이 기기에 저장됩니다. 여권·결제·건강 정보는 저장하지 않습니다." : "Only selected non-sensitive preferences are stored on this device. Passport, payment and health data are not saved."}</p>
    <p class="mission-followup-error" role="alert" aria-live="assertive"></p>
    <div class="mission-followup-actions"><button type="button" class="mission-followup-back" data-action="back">${ko ? "이전" : "Back"}</button><button type="button" class="schedule-confirm" data-action="next"></button></div>
  </form>`;

  const form = dialog.querySelector("form");
  const error = form.querySelector(".mission-followup-error");
  const progress = form.querySelector(".mission-followup-progress");
  const back = form.querySelector('[data-action="back"]');
  const next = form.querySelector('[data-action="next"]');
  const sections = Array.from(form.querySelectorAll(".mission-followup-step"));

  if (travel) {
    const today = new Date();
    const end = new Date(today); end.setDate(end.getDate() + 6);
    const defaults = {
      destination: inferTravelDestination(mission) || (demoMode ? "Japan" : ""),
      startDate: iso(today),
      endDate: iso(end),
      adults: "1",
      children: "0",
      priority: "balanced"
    };
    Object.assign(defaults, suggested);
    if (demoMode) defaults.departure = "Seoul / ICN";
    Object.entries(defaults).forEach(([name, value]) => { const field = form.elements.namedItem(name); if (field && !field.value) field.value = value; });
    form.elements.startDate.min = iso(today);
    form.elements.endDate.min = form.elements.startDate.value;
  }

  form.addEventListener("click", (event) => {
    const dateField = event.target.closest(".mission-followup-date-field");
    if (!dateField) return;
    const input = dateField.querySelector('input[type="date"]');
    if (event.target !== input) event.preventDefault();
    input?.focus();
    input?.showPicker?.();
  });

  form.elements.startDate?.addEventListener("change", () => {
    form.elements.endDate.min = form.elements.startDate.value;
    if (form.elements.endDate.value < form.elements.startDate.value) {
      const estimate = new Date(`${form.elements.startDate.value}T12:00:00`);
      estimate.setDate(estimate.getDate() + 6);
      form.elements.endDate.value = iso(estimate);
    }
  });

  const render = () => {
    sections.forEach((section, index) => { section.hidden = index !== current; });
    progress.textContent = travel ? `${current + 1} / ${steps.length}` : "";
    back.hidden = current === 0;
    next.textContent = current === steps.length - 1 ? (ko ? "미션 준비하기" : "Prepare Mission") : (ko ? "계속" : "Continue");
    error.textContent = "";
    sections[current].querySelector("input, select")?.focus();
    trackEvent("followup_step_viewed", { page: "home", language, mission_category: type, step: String(current + 1) });
  };

  const validateStep = () => {
    const fields = Array.from(sections[current].querySelectorAll("input, select"));
    const invalid = fields.find((field) => !field.checkValidity());
    if (invalid) {
      error.textContent = ko ? "필수 정보를 입력해주세요." : "Please complete the required information.";
      invalid.focus();
      trackEvent("followup_validation_error", { page: "home", language, mission_category: type, error_code: "required_field" });
      return false;
    }
    if (travel && current === 1 && form.elements.endDate.value < form.elements.startDate.value) {
      error.textContent = ko ? "귀국 날짜는 출국 날짜 이후여야 합니다." : "End date must be on or after the start date.";
      form.elements.endDate.focus();
      trackEvent("followup_validation_error", { page: "home", language, mission_category: type, error_code: "invalid_date_range" });
      return false;
    }
    return true;
  };

  form.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "cancel") { trackEvent("followup_cancelled", { page: "home", language, mission_category: type }); dialog.close("cancel"); return; }
    if (action === "sample") { useSampleProfile(); trackEvent("sample_profile_used", { page: "home", language, mission_category: type, demo_mode: true }); dialog.close("sample"); openMissionFollowUp({ mission, type, language, demoMode, restoreFocusTo, onComplete }); return; }
    if (action === "back") { trackEvent("followup_back_clicked", { page: "home", language, mission_category: type, step: String(current + 1) }); current = Math.max(0, current - 1); render(); return; }
    if (action === "next") {
      if (!validateStep()) return;
      trackEvent("followup_step_completed", { page: "home", language, mission_category: type, step: String(current + 1) });
      if (current < steps.length - 1) { current += 1; render(); return; }
      const values = Object.fromEntries(new FormData(form).entries());
      if (values.rememberPreferences === "on") {
        const missionId = `mission-${Date.now()}`;
        if (!savedProfile.profile.profileConsent.enabled) {
          error.textContent = ko ? "먼저 프로필 페이지에서 메모리를 켜주세요." : "Turn on memory in Profile before saving preferences.";
          return;
        }
        if (travel) {
          saveApprovedPreference("travel", "departureAirport", values.departure, missionId);
          saveApprovedPreference("travel", "tripPace", values.priority, missionId);
        } else if (type === "tutoring" || type === "language_exchange") {
          saveApprovedPreference("education", "subject", values.subject || values.language, missionId);
          saveApprovedPreference("education", "level", values.level, missionId);
          saveApprovedPreference("education", "format", values.format, missionId);
          saveApprovedPreference("education", "schedule", values.schedule, missionId);
        } else if (type === "shopping") {
          saveApprovedPreference("shopping", "brands", values.brands, missionId);
          saveApprovedPreference("shopping", "priorities", values.priority, missionId);
          saveApprovedPreference("shopping", "deliveryCountry", values.country, missionId);
        }
        trackEvent("preference_saved", { page: "home", language, mission_category: type, success: true });
      } else {
        trackEvent("preference_declined", { page: "home", language, mission_category: type });
      }
      const schedule = travel ? { startDate: values.startDate, endDate: values.endDate, timePreference: "any" } : null;
      dialog.close("complete");
      trackEvent("followup_completed", { page: "home", language, mission_category: type, success: true });
      onComplete?.({ type, answers: values, schedule, completedAt: new Date().toISOString() });
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    next.click();
  });

  form.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing || event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    next.click();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    if (dialog.returnValue !== "complete") restoreFocusTo?.focus();
  }, { once: true });
  document.body.classList.add("modal-open");
  dialog.showModal();
  render();
}
