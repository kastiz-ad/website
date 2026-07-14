const QUESTIONS = Object.freeze({
  travel: [
    ["departure", "Departure location", "출발지", "e.g. Seoul / ICN"],
    ["travelers", "Travelers", "여행 인원", "e.g. 2 adults"],
    ["budget", "Total budget", "총예산", "e.g. ₩3,000,000"],
    ["preferences", "Airline and hotel preferences", "항공사 및 호텔 선호", "Optional"]
  ],
  tutoring: [
    ["level", "Learner level", "학습자 수준", "Beginner, intermediate, advanced"],
    ["format", "Online or offline", "온라인 또는 오프라인", "Online / Offline"],
    ["schedule", "Preferred schedule", "선호 일정", "e.g. Tue and Thu evenings"],
    ["budget", "Lesson budget", "수업 예산", "e.g. ₩40,000 per hour"]
  ],
  childcare: [
    ["location", "Location", "지역", "Neighborhood or city"],
    ["age", "Child age range", "아이 연령", "e.g. 3 and 6 years"],
    ["schedule", "Date, time and duration", "날짜, 시간 및 이용 시간", "e.g. Saturday 18:00–22:00"],
    ["requirements", "Language, certification or emergency needs", "언어, 자격 및 비상 요구사항", "Optional"]
  ],
  shopping: [
    ["useCase", "Primary use case", "주요 용도", "e.g. design, coding, office work"],
    ["budget", "Budget", "예산", "e.g. ₩2,000,000"],
    ["priority", "Top priority", "가장 중요한 기준", "Performance, battery, weight, value"],
    ["country", "Delivery country", "배송 국가", "e.g. South Korea"]
  ],
  moving: [
    ["origin", "Current country or city", "현재 국가 또는 도시", "Origin"],
    ["targetDate", "Target move date", "목표 이주일", "Approximate date"],
    ["family", "Household size", "가족 구성", "e.g. 2 adults, 1 child"],
    ["services", "Housing, visa and support needs", "주거, 비자 및 지원 필요사항", "Planning information only"]
  ],
  business: [
    ["industry", "Industry", "업종", "e.g. software, retail, consulting"],
    ["structure", "Preferred business structure", "희망 사업 형태", "Sole proprietor / corporation / unsure"],
    ["launchDate", "Target launch date", "목표 시작일", "Approximate date"],
    ["budget", "Setup budget and support needs", "설립 예산 및 지원 필요사항", "Planning information only"]
  ],
  language_exchange: [
    ["level", "Current language level", "현재 언어 수준", "Beginner, intermediate, advanced"],
    ["format", "Online or nearby", "온라인 또는 근거리", "Online / Nearby"],
    ["schedule", "Preferred schedule", "선호 일정", "e.g. Weekend afternoons"],
    ["interests", "Conversation interests", "대화 관심사", "Optional"]
  ],
  general_mission: [
    ["outcome", "What outcome would make this mission successful?", "어떤 결과가 나오면 미션이 성공인가요?", "Describe the desired outcome"],
    ["constraints", "What timing, budget or limits should ONE respect?", "ONE이 지켜야 할 일정, 예산 또는 제한은 무엇인가요?", "Optional"]
  ]
});

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

const ensureDialog = () => {
  let dialog = document.getElementById("missionFollowUpDialog");
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = "missionFollowUpDialog";
  dialog.className = "mission-followup-modal";
  dialog.setAttribute("aria-labelledby", "missionFollowUpTitle");
  document.body.append(dialog);
  return dialog;
};

export function openMissionFollowUp({ mission, type, language = "en", onComplete }) {
  const dialog = ensureDialog();
  const questions = QUESTIONS[type] || QUESTIONS.general_mission;
  const isKorean = language === "ko";
  dialog.innerHTML = `
    <form method="dialog" class="mission-followup-form" novalidate>
      <button class="schedule-modal-close" value="cancel" aria-label="${isKorean ? "닫기" : "Close"}">×</button>
      <p class="login-modal-kicker">KASTIZ ONE</p>
      <h2 id="missionFollowUpTitle">${isKorean ? "미션에 필요한 정보를 알려주세요" : "Help ONE prepare the mission"}</h2>
      <p class="schedule-help">${escapeHtml(mission)}</p>
      <div class="mission-followup-fields">${questions.map(([name, en, ko, placeholder], index) => `
        <label><span>${isKorean ? ko : en}</span><input name="${name}" placeholder="${escapeHtml(placeholder)}" ${index < 2 ? "required" : ""}></label>
      `).join("")}</div>
      <p class="mission-followup-error" role="alert" aria-live="assertive"></p>
      <button class="schedule-confirm" value="confirm" type="submit">${isKorean ? "확인 후 계속" : "Confirm and Continue"}</button>
    </form>`;
  const form = dialog.querySelector("form");
  form.addEventListener("submit", (event) => {
    if (event.submitter?.value === "cancel") return;
    event.preventDefault();
    if (!form.checkValidity()) {
      form.querySelector(".mission-followup-error").textContent = isKorean ? "필수 정보를 입력해주세요." : "Please complete the required information.";
      form.reportValidity();
      return;
    }
    const answers = Object.fromEntries(new FormData(form).entries());
    dialog.close("confirm");
    onComplete?.({ type, answers, completedAt: new Date().toISOString() });
  });
  dialog.showModal();
  dialog.querySelector("input")?.focus();
}
