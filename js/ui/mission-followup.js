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
  { title: ["We'll use your nearby airport", "현재 위치와 가까운 공항을 사용할게요"], fields: [["departure", "Departure airport (change if needed)", "출발 공항 (필요하면 변경)", "Current location", "text"]] },
  { title: ["Budget and priorities", "예산과 우선순위"], fields: [["budget", "Total budget", "총예산", "₩3,000,000", "text"], ["priority", "Priority", "우선순위", "Balanced", "select"], ["preferences", "Optional preferences", "선호 사항", "Airline, hotel or itinerary preferences", "text"]] }
];

const esc = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const iso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const inferDepartureFromDevice = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const region = (navigator.language || "").split("-")[1]?.toUpperCase() || "";
  const byTimezone = {
    "Asia/Seoul": "Incheon International Airport (ICN)",
    "Asia/Tokyo": "Tokyo Haneda Airport (HND)",
    "Europe/London": "London Heathrow Airport (LHR)",
    "Europe/Madrid": "Adolfo Suárez Madrid–Barajas Airport (MAD)",
    "Europe/Paris": "Paris Charles de Gaulle Airport (CDG)",
    "America/New_York": "John F. Kennedy International Airport (JFK)",
    "America/Los_Angeles": "Los Angeles International Airport (LAX)"
  };
  const byRegion = { KR: "Incheon International Airport (ICN)", JP: "Tokyo Haneda Airport (HND)", GB: "London Heathrow Airport (LHR)", ES: "Adolfo Suárez Madrid–Barajas Airport (MAD)", FR: "Paris Charles de Gaulle Airport (CDG)" };
  return byTimezone[timezone] || byRegion[region] || (region ? `Current location (${region})` : "Current location");
};

const TRAVEL_DESTINATION_CHOICES = [
  { country: "Japan", aliases: ["japan", "일본"], cities: ["Tokyo", "Osaka", "Kyoto", "Sapporo", "Fukuoka", "Okinawa"] },
  { country: "Spain", aliases: ["spain", "스페인"], cities: ["Madrid", "Barcelona", "Seville", "Valencia", "Málaga", "Bilbao"] },
  { country: "United States", aliases: ["united states", "usa", "u.s.", "america", "미국"], cities: ["New York", "Los Angeles", "Washington, D.C.", "San Francisco", "Chicago", "Miami"] },
  { country: "Canada", aliases: ["canada", "캐나다"], cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Quebec City"] },
  { country: "France", aliases: ["france", "프랑스"], cities: ["Paris", "Nice", "Lyon", "Marseille", "Bordeaux", "Strasbourg"] },
  { country: "Italy", aliases: ["italy", "이탈리아"], cities: ["Rome", "Milan", "Venice", "Florence", "Naples", "Bologna"] },
  { country: "United Kingdom", aliases: ["united kingdom", "uk", "britain", "영국"], cities: ["London", "Edinburgh", "Manchester", "Liverpool", "Oxford", "Bath"] },
  { country: "Germany", aliases: ["germany", "독일"], cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", "Dresden"] },
  { country: "Australia", aliases: ["australia", "호주"], cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"] },
  { country: "Thailand", aliases: ["thailand", "태국"], cities: ["Bangkok", "Chiang Mai", "Phuket", "Krabi", "Pattaya", "Koh Samui"] },
  { country: "Vietnam", aliases: ["vietnam", "베트남"], cities: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hoi An", "Nha Trang", "Phu Quoc"] },
  { country: "China", aliases: ["china", "중국"], cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Xi'an"] },
  { country: "South Korea", aliases: ["south korea", "korea", "대한민국", "한국"], cities: ["Seoul", "Busan", "Jeju", "Gyeongju", "Incheon", "Gangneung"] },
  { country: "Colombia", aliases: ["colombia", "콜롬비아"], cities: ["Bogotá", "Medellín", "Cartagena", "Cali", "Santa Marta", "Pereira"] },
  { country: "Mexico", aliases: ["mexico", "멕시코"], cities: ["Mexico City", "Cancún", "Los Cabos", "Oaxaca", "Guadalajara", "Puerto Vallarta"] },
  { country: "Singapore", aliases: ["singapore", "싱가포르"], cities: ["Singapore"] }
];
const TRAVEL_COUNTRY_CODES = { Japan: "JP", Spain: "ES", "United States": "US", Canada: "CA", France: "FR", Italy: "IT", "United Kingdom": "GB", Germany: "DE", Australia: "AU", Thailand: "TH", Vietnam: "VN", China: "CN", "South Korea": "KR", Colombia: "CO", Mexico: "MX", Singapore: "SG" };
const CITY_NAMES_KO = {
  Madrid: "마드리드", Barcelona: "바르셀로나", Seville: "세비야", Valencia: "발렌시아", "Málaga": "말라가", Bilbao: "빌바오",
  "New York": "뉴욕", "Los Angeles": "로스앤젤레스", "Washington, D.C.": "워싱턴 D.C.", "San Francisco": "샌프란시스코", Chicago: "시카고", Miami: "마이애미",
  Tokyo: "도쿄", Osaka: "오사카", Kyoto: "교토", Sapporo: "삿포로", Fukuoka: "후쿠오카", Okinawa: "오키나와",
  Paris: "파리", London: "런던", Rome: "로마", Milan: "밀라노", Venice: "베네치아", Florence: "피렌체",
  Bangkok: "방콕", Phuket: "푸껫", Hanoi: "하노이", "Ho Chi Minh City": "호찌민", "Da Nang": "다낭", Singapore: "싱가포르",
  Sydney: "시드니", Melbourne: "멜버른", Beijing: "베이징", Shanghai: "상하이", Seoul: "서울", Busan: "부산", Jeju: "제주"
};
const cityLabel = (city, language) => language === "ko" ? (CITY_NAMES_KO[city] || city) : city;
const FEATURED_TRAVEL_CITIES = [
  { city: "New York", en: "NYC", country: "United States" },
  { city: "Los Angeles", en: "LA", country: "United States" },
  { city: "Paris", en: "Paris", country: "France" },
  { city: "Tokyo", en: "Tokyo", country: "Japan" },
  { city: "Madrid", en: "Madrid", country: "Spain" },
  { city: "London", en: "London", country: "United Kingdom" },
  { city: "Sydney", en: "Sydney", country: "Australia" }
];

const countryForCity = (value, language) => {
  const normalized = String(value || "").trim().toLowerCase();
  const country = TRAVEL_DESTINATION_CHOICES.find((item) => item.cities.some((city) => {
    return city.toLowerCase() === normalized || cityLabel(city, language).toLowerCase() === normalized;
  }));
  return country ? { country: country.country, code: TRAVEL_COUNTRY_CODES[country.country] || "" } : null;
};

const inferTravelContext = (mission = "") => {
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
  const exactCity = destinations.find(([, aliases]) => aliases.some((alias) => text.includes(alias)))?.[0] || "";
  const countryMatch = TRAVEL_DESTINATION_CHOICES.find((item) =>
    item.aliases.some((alias) => text.includes(alias)) || item.cities.some((city) => text.includes(city.toLowerCase()) || text.includes(CITY_NAMES_KO[city] || "\u0000"))
  );
  if (countryMatch) {
    const city = countryMatch.cities.find((item) => text.includes(item.toLowerCase()) || text.includes(CITY_NAMES_KO[item] || "\u0000"));
    return { country: countryMatch.country, code: TRAVEL_COUNTRY_CODES[countryMatch.country] || "", value: city || exactCity || countryMatch.cities[0], cities: countryMatch.cities };
  }
  if (exactCity) return { country: exactCity, value: exactCity, cities: [exactCity] };
  const phrase = text.match(/(?:trip|travel|flight|vacation|holiday)\s+(?:to|in)\s+([a-z][a-z .'-]{1,40})/i)?.[1]
    ?.replace(/\b(?:for|from|with|on)\b.*$/i, "").trim();
  return phrase ? { country: phrase, value: phrase.replace(/\b\w/g, (letter) => letter.toUpperCase()), cities: [] } : { country: "", value: "", cities: [] };
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
  const destinationContext = travel ? inferTravelContext(mission) : null;
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
    ${suggestedEntries.length ? `<aside class="profile-prefill-summary" aria-label="${ko ? "저장된 설정" : "Saved preferences"}"><strong>${ko ? "다음 설정을 사용할게요" : "We'll use"}</strong><ul>${suggestedEntries.map(([key, value]) => `<li><span>${esc(key)}</span><b>${esc(value)}</b><em>${ko ? "사용" : "Use"}</em><button type="button" data-action="change-pref" data-pref-key="${esc(key)}">${ko ? "변경" : "Change"}</button></li>`).join("")}</ul></aside>` : ""}
    ${demoMode && !sampleProfile && !savedProfile.enabled ? `<button type="button" class="profile-sample-button" data-action="sample">${ko ? "샘플 프로필 사용" : "Use sample profile"}</button>` : ""}
    <div class="mission-followup-progress" aria-live="polite"></div>
    ${steps.map((step, index) => `<section class="mission-followup-step" data-step="${index}" ${index ? "hidden" : ""}><h3>${ko ? step.title[1] : step.title[0]}</h3>${step.fields.some((field) => field[0] === "departure") ? `<p class="mission-step-why">${ko ? "기기의 지역 설정을 기준으로 제안했습니다. 정확한 위치는 저장하지 않습니다." : "Suggested from your device region. ONE does not store your precise location."}</p>` : ""}<div class="mission-followup-fields">${step.fields.map((field, fieldIndex) => renderField(field, language, field[0] !== "preferences" && field[0] !== "brands" && field[0] !== "constraints")).join("")}</div></section>`).join("")}
    ${savedProfile.enabled ? `<label class="profile-remember-row"><input type="checkbox" name="rememberPreferences"><span>${ko ? "다음 미션에도 이 설정을 사용하기" : "Save these preferences for future missions"}</span></label><p class="profile-local-note">${ko ? "선택한 비민감 설정만 이 기기에 저장됩니다. 여권·결제·건강 정보는 저장하지 않습니다." : "Only selected non-sensitive preferences are stored on this device. Passport, payment and health data are not saved."}</p>` : ""}
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
      destination: destinationContext?.value ? cityLabel(destinationContext.value, language) : (demoMode ? cityLabel("Tokyo", language) : ""),
      startDate: iso(today),
      endDate: iso(end),
      adults: "1",
      children: "0",
      departure: inferDepartureFromDevice(),
      priority: "balanced"
    };
    Object.assign(defaults, suggested);
    if (demoMode && !defaults.departure) defaults.departure = "Incheon International Airport (ICN)";
    Object.entries(defaults).forEach(([name, value]) => { const field = form.elements.namedItem(name); if (field && !field.value) field.value = value; });
    const destinationInput = form.elements.namedItem("destination");
    if (destinationInput) {
      const hasDetectedCountry = Boolean(destinationContext?.country);
      const cityChoices = hasDetectedCountry
        ? destinationContext.cities.map((city) => ({ city, label: cityLabel(city, language), country: destinationContext.country }))
        : FEATURED_TRAVEL_CITIES.map((item) => ({ ...item, label: ko ? cityLabel(item.city, language) : item.en }));
      destinationInput.readOnly = hasDetectedCountry;
      destinationInput.placeholder = ko
        ? "뉴욕, LA, 파리, 도쿄, 마드리드, 런던, 시드니 또는 다른 도시"
        : "NYC, LA, Paris, Tokyo, Madrid, London, Sydney or another city";
      destinationInput.setAttribute("aria-label", ko ? "목적지" : "Destination");
      const choices = document.createElement("div");
      choices.className = "destination-choice-grid";
      choices.setAttribute("role", "group");
      choices.setAttribute("aria-label", hasDetectedCountry
        ? (ko ? `${destinationContext.country} 도시 선택` : `Choose a city in ${destinationContext.country}`)
        : (ko ? "인기 목적지 선택" : "Choose a popular destination"));
      choices.innerHTML = cityChoices.map((item) => {
        const value = cityLabel(item.city, language);
        return `<button type="button" class="destination-choice" data-city="${esc(value)}" data-country="${esc(item.country)}" aria-pressed="${value === destinationInput.value}">${esc(item.label)}</button>`;
      }).join("");
      if (cityChoices.length) destinationInput.closest("label")?.append(choices);
      choices.addEventListener("click", (event) => {
        const button = event.target.closest("[data-city]");
        if (!button) return;
        destinationInput.value = button.dataset.city;
        choices.querySelectorAll("[data-city]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      });
    }
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
    if (action === "change-pref") { const key = event.target.closest("[data-pref-key]")?.dataset.prefKey; const field = form.elements.namedItem(key); const target = field?.closest(".mission-followup-step"); const index = sections.indexOf(target); if (index >= 0) { current = index; render(); field.focus(); } return; }
    if (action === "back") { trackEvent("followup_back_clicked", { page: "home", language, mission_category: type, step: String(current + 1) }); current = Math.max(0, current - 1); render(); return; }
    if (action === "next") {
      if (!validateStep()) return;
      trackEvent("followup_step_completed", { page: "home", language, mission_category: type, step: String(current + 1) });
      if (current < steps.length - 1) { current += 1; render(); return; }
      const values = Object.fromEntries(new FormData(form).entries());
      if (travel) {
        const selectedCountry = destinationContext?.country
          ? { country: destinationContext.country, code: destinationContext.code || "" }
          : countryForCity(values.destination, language);
        if (selectedCountry) {
          values.destinationCountry = selectedCountry.country;
          values.destinationCountryCode = selectedCountry.code;
        }
      }
      if (values.rememberPreferences === "on") {
        const missionId = `mission-${Date.now()}`;
        if (savedProfile.profile.profileConsent.enabled && travel) {
          saveApprovedPreference("travel", "departureAirport", values.departure, missionId);
          saveApprovedPreference("travel", "tripPace", values.priority, missionId);
        } else if (savedProfile.profile.profileConsent.enabled && (type === "tutoring" || type === "language_exchange")) {
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
