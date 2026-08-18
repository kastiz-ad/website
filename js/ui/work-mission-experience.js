import { buildMissionBriefing, createWorkMissionFoundation, recordRehearsalAttempt } from "../engine/work-mission-foundation.js";

const TYPES = new Set(["presentation", "meeting", "interview"]);
const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const locale = (value) => ["en", "ko", "es"].includes(value) ? value : "en";
const pick = (language, en, ko, es) => language === "ko" ? ko : language === "es" ? es : en;

const COPY = {
  presentation: {
    title: ["Presentation Mission", "발표 미션", "Misión de presentación"],
    name: ["Investor Presentation", "투자자 발표", "Presentación para inversores"],
    objective: ["Deliver a clear presentation that shows how ONE closes the gap between AI answers and real-world action.", "AI의 답변과 현실의 실행 사이의 간극을 ONE이 어떻게 해결하는지 명확하게 전달합니다.", "Explicar con claridad cómo ONE cierra la brecha entre las respuestas de IA y la acción real."],
    primary: ["START REHEARSAL", "리허설 시작", "INICIAR ENSAYO"]
  },
  meeting: {
    title: ["Meeting Preparation", "미팅 준비", "Preparación de reunión"],
    name: ["Investor Meeting", "투자자 미팅", "Reunión con inversores"],
    objective: ["Enter the meeting with a clear objective, concise talking points, strong questions, and a useful follow-up plan.", "명확한 목표, 핵심 논점, 좋은 질문과 후속 계획을 갖고 미팅에 들어갑니다.", "Llegar a la reunión con un objetivo claro, argumentos concisos, buenas preguntas y un plan de seguimiento."],
    primary: ["START PREPARATION", "준비 시작", "INICIAR PREPARACIÓN"]
  },
  interview: {
    title: ["Interview Preparation", "면접 준비", "Preparación de entrevista"],
    name: ["Interview Preparation", "면접 준비", "Preparación de entrevista"],
    objective: ["Answer clearly, connect experience to the role, and handle difficult questions without over-explaining.", "경험을 직무와 연결해 명확히 답하고 어려운 질문에도 과하게 설명하지 않도록 준비합니다.", "Responder con claridad, conectar la experiencia con el puesto y afrontar preguntas difíciles sin extenderse demasiado."],
    primary: ["START MOCK INTERVIEW", "모의 면접 시작", "INICIAR ENTREVISTA SIMULADA"]
  }
};

const PRESENTATION_SLIDES = [
  ["ONE", "Opening", "AI answers. ONE executes.", ["AI already gives us answers", "Users still organize and execute everything", "ONE closes that execution gap"], ["AI already gives us answers.", "[pause]", "But the user still has to do everything.", "Search. Compare. Decide. Act.", "ONE closes that gap."], 45],
  ["The execution gap", "Problem", "Useful answers still leave the user with operational work.", ["Fragmented tools", "Repeated decisions", "No protected handoff to action"], ["The problem is not access to information.", "It is the work left after the answer.", "ONE turns that remaining work into a mission."], 55],
  ["How ONE works", "Solution", "ONE understands, prepares, asks for approval, and helps complete the mission.", ["Understand the goal", "Prepare the path", "Protect sensitive actions", "Track readiness"], ["ONE begins with the desired outcome.", "It asks only what is necessary.", "Preparation happens first; external action stays approval-protected."], 65],
  ["Travel is the first category", "Proof", "A complete mission experience proves the shared engine.", ["Itinerary", "Flights and hotels", "Restaurants", "Trust and approval"], ["Travel makes the execution gap visible.", "The same mission architecture extends beyond travel."], 50],
  ["Beyond travel", "Expansion", "The shared engine supports work and personal preparation missions.", ["Presentations", "Meetings", "Interviews", "Learning"], ["These are not separate chatbots.", "They are category modules using the same ONE mission engine."], 45],
  ["Trust by design", "Differentiation", "The user remains the final decision-maker.", ["Preparation before approval", "No hidden execution", "Clear source state", "Private session progress"], ["ONE does not confuse preparation with permission.", "That boundary makes execution useful and trustworthy."], 55],
  ["Business model", "Business", "Free preparation creates a path to trusted premium execution.", ["ONE Free", "Future Plus and Pro", "Provider handoff", "Enterprise controls"], ["The public beta focuses on preparation and manual handoff.", "Future execution requires verified integrations and explicit approval."], 55],
  ["Why now", "Timing", "AI capability is rising faster than users' ability to operationalize it.", ["Better reasoning", "More connected services", "Higher demand for safe action"], ["The opportunity is to become the layer between intent and completion."], 40],
  ["What exists today", "Evidence", "ONE already prepares destination-specific missions with approval protection.", ["Shared mission engine", "Localized results", "Trust states", "Protected handoff"], ["The MVP is not autonomous booking.", "It is a reliable preparation experience that users can inspect and control."], 55],
  ["The ask", "Closing", "Help ONE prove that goal-oriented AI can become a daily execution layer.", ["Public beta learning", "Provider readiness", "Focused iteration"], ["GPT provides answers.", "ONE achieves goals.", "We are building the bridge between the two."], 40]
];

const QA = [
  ["What problem does ONE solve?", "ONE removes the operational work that remains after an AI answer by turning a goal into a prepared, approval-protected mission.", "The execution gap after the answer.", ["Outcome first", "Preparation", "Approval protection"]],
  ["Why can't ChatGPT do this?", "General assistants can explain tasks. ONE is designed around persistent mission state, preparation stages, trust signals, and explicit action boundaries.", "ONE is a mission system, not only a response.", ["Mission state", "Readiness", "Controlled handoff"]],
  ["What's defensible?", "The defensibility comes from mission architecture, destination and provider intelligence, trusted state transitions, and the accumulated product workflow—not a single prompt.", "The workflow and trusted mission state compound.", ["Architecture", "Trust", "Workflow data"]],
  ["How will ONE make money?", "ONE Free proves demand through preparation and manual provider handoff. Paid tiers can add higher limits, verified integrations, collaboration, and enterprise controls when launch-ready.", "Free preparation; paid trusted capability.", ["Free beta", "Plus/Pro later", "Enterprise"]],
  ["What's the MVP today?", "A public beta that turns travel goals into structured, localized plans with recommendations, trust labels, approval protection, and manual provider links.", "Prepared missions with manual completion.", ["Travel", "Trust", "Manual handoff"]],
  ["Why now?", "Reasoning models are strong, but users still stitch together the real workflow. The missing product layer is safe preparation toward completion.", "Intelligence improved; execution UX did not.", ["Timing", "Workflow gap", "Safety"]],
  ["What stops a platform company from building this?", "Large platforms can build features, but ONE can focus on a neutral mission layer, cross-domain continuity, and user-controlled provider choice.", "Focused neutral orchestration.", ["Neutral layer", "Cross-domain", "User control"]]
];

const localizedArtifact = (name, language) => {
  const map = {
    "Presentation structure": ["Presentation structure", "발표 구조", "Estructura de presentación"], "Slide outline": ["Slide outline", "슬라이드 개요", "Esquema de diapositivas"],
    "Slide structure": ["Slide structure", "발표 구성", "Estructura"], "Speaker notes": ["Speaker notes", "발표자 노트", "Notas del orador"], "Key messages": ["Key messages", "핵심 메시지", "Mensajes clave"], "Suggested answers": ["Suggested answers", "추천 답변", "Respuestas sugeridas"],
    "Short version": ["3-minute version", "3분 버전", "Versión de 3 minutos"], "Full version": ["Full version", "전체 버전", "Versión completa"],
    "Audience Q&A": ["Likely questions", "예상 질문", "Preguntas probables"], "Objection responses": ["Objection responses", "반론 대응", "Respuestas a objeciones"],
    "Opening statement": ["Opening", "오프닝", "Apertura"], "Closing statement": ["Closing", "클로징", "Cierre"],
    "Rehearsal plan": ["Rehearsal plan", "리허설 계획", "Plan de ensayo"], "Memory cards": ["Memory cues", "암기 단서", "Claves de memoria"],
    "Meeting brief": ["Meeting objective", "미팅 목표", "Objetivo de reunión"], "Background briefing": ["Background briefing", "배경 브리핑", "Contexto"], "Agenda": ["Agenda", "아젠다", "Agenda"],
    "Talking points": ["Talking points", "핵심 논점", "Puntos clave"], "Key numbers": ["Key numbers", "핵심 수치", "Cifras clave"],
    "Likely questions": ["Likely questions", "예상 질문", "Preguntas probables"], "Questions to ask": ["Questions to ask", "질문 목록", "Preguntas para hacer"],
    "Meeting checklist": ["Meeting checklist", "미팅 체크리스트", "Lista de reunión"], "Follow-up draft": ["Follow-up checklist", "후속 체크리스트", "Seguimiento"],
    "Interview brief": ["Self introduction", "자기소개", "Presentación personal"], "Question set": ["Likely questions", "예상 질문", "Preguntas probables"], "Difficult questions": ["Difficult questions", "어려운 질문", "Preguntas difíciles"],
    "Concise answers": ["Quick answers", "짧은 답변", "Respuestas breves"], "Detailed answers": ["Full answers", "전체 답변", "Respuestas completas"],
    "Response strategy": ["Weak-area review", "약점 점검", "Revisión de puntos débiles"], "Memory cues": ["Memory keywords", "암기 키워드", "Palabras clave"],
    "Mock interview": ["Mock interview", "모의 면접", "Entrevista simulada"], "Final checklist": ["Final checklist", "최종 체크리스트", "Lista final"]
  };
  const values = map[name] || [name, name, name];
  return values[language === "ko" ? 1 : language === "es" ? 2 : 0];
};

export function isWorkMissionExperience(result = {}) {
  return TYPES.has(result.type) || TYPES.has(result.missionType);
}

export function buildWorkMissionViewModel(result = {}, languageInput = "en") {
  const language = locale(languageInput);
  const type = TYPES.has(result.type) ? result.type : TYPES.has(result.missionType) ? result.missionType : "presentation";
  const base = result.missionFoundation || createWorkMissionFoundation(type, { rawInput: result.rawInput || result.mission || "" });
  const briefing = result.missionBriefing || buildMissionBriefing(base);
  const copy = COPY[type];
  const idx = language === "ko" ? 1 : language === "es" ? 2 : 0;
  const raw = String(result.rawInput || result.mission || "");
  const tomorrow = /tomorrow|내일|mañana/i.test(raw);
  return {
    type, language, title: copy.title[idx], name: copy.name[idx], objective: copy.objective[idx], primary: copy.primary[idx],
    timing: tomorrow ? pick(language, "Tomorrow · duration to confirm", "내일 · 발표 시간 확인 필요", "Mañana · duración por confirmar") : pick(language, "Schedule to confirm", "일정 확인 필요", "Horario por confirmar"),
    status: base?.missingInputs?.length ? pick(language, "NEEDS ONE DETAIL", "한 가지 확인 필요", "FALTA UN DATO") : (briefing?.status || "READY TO PRACTICE"),
    clarification: type === "presentation" ? pick(language, "Do you already have slides, or should ONE prepare them from scratch?", "기존 슬라이드가 있나요, 아니면 ONE이 처음부터 준비할까요?", "¿Ya tienes diapositivas o debe ONE prepararlas desde cero?") : null,
    artifacts: (base?.preparedArtifacts || []).map((item) => ({ ...item, label: localizedArtifact(item.name, language) })),
    slides: type === "presentation" ? PRESENTATION_SLIDES.map((slide, index) => ({ slideNumber:index + 1, title:slide[0], purpose:slide[1], mainMessage:slide[2], bulletPoints:slide[3], speakerNotes:slide[4], estimatedSpeakingTime:slide[5] })) : [],
    qa: type === "presentation" ? QA.map(([question, answer, shortAnswer, keyPoints], index) => ({ id:`q-${index + 1}`, question, answer, shortAnswer, keyPoints })) : [],
    preparationNotice: pick(language, "Prepared locally for review. No email, calendar event, file upload, or external action occurred.", "검토할 수 있도록 로컬에서 준비했습니다. 이메일, 캘린더 등록, 파일 업로드 또는 외부 실행은 진행되지 않았습니다.", "Preparado localmente para revisión. No se envió correo, no se creó ningún evento ni se subió ningún archivo."),
    externalLabel: pick(language, "Requires integration", "외부 연동 필요", "Requiere integración")
  };
}

const slideHtml = (slide) => `<article class="work-slide-card"><span>SLIDE ${slide.slideNumber}</span><h3>${esc(slide.title)}</h3><small>${esc(slide.purpose)} · ${slide.estimatedSpeakingTime}s</small><strong>${esc(slide.mainMessage)}</strong><ul>${slide.bulletPoints.map((point) => `<li>${esc(point)}</li>`).join("")}</ul><details><summary>Speaker notes</summary>${slide.speakerNotes.map((note) => `<p>${esc(note)}</p>`).join("")}</details></article>`;

export function renderWorkMissionExperience(result = {}, languageInput = "en", { onStateChange } = {}) {
  const model = buildWorkMissionViewModel(result, languageInput);
  const root = document.createElement("section");
  root.className = "work-mission-experience";
  root.dataset.workMissionType = model.type;
  const labels = {
    overview: pick(model.language,"Overview","개요","Resumen"), slides: pick(model.language,"Slides","슬라이드","Diapositivas"), notes: pick(model.language,"Speaker Notes","발표자 노트","Notas"), messages: pick(model.language,"Key Messages","핵심 메시지","Mensajes clave"),
    qa: "Q&A", practice: pick(model.language,"Practice","연습","Práctica"), checklist: pick(model.language,"Checklist","체크리스트","Lista"),
    review: pick(model.language,"REVIEW PRESENTATION","발표 검토","REVISAR PRESENTACIÓN"), memorize: pick(model.language,"MEMORIZE","암기","MEMORIZAR"), short: pick(model.language,"SHORT VERSION","짧은 버전","VERSIÓN CORTA"), edit: pick(model.language,"EDIT MISSION","미션 수정","EDITAR MISIÓN")
  };
  const stages = [
    pick(model.language,"Understanding","이해","Comprensión"), pick(model.language,"Planning","계획","Planificación"),
    pick(model.language,"Preparing","준비","Preparación"), pick(model.language,"Ready to Review","검토 준비","Listo para revisar"),
    pick(model.language,"Ready to Practice","연습 준비","Listo para practicar"), pick(model.language,"Completed","완료","Completado")
  ];
  root.innerHTML = `
    <header class="work-mission-hero"><p>${esc(model.title)}</p><h2>${esc(model.name)}</h2><span>${esc(model.timing)}</span><strong>${esc(model.status)}</strong><p class="work-objective">${esc(model.objective)}</p></header>
    <ol class="work-mission-stages" aria-label="${esc(pick(model.language,"Preparation progress","준비 진행 상태","Progreso de preparación"))}">${stages.map((stage,index)=>`<li class="${index < 3 ? "is-complete" : index === 3 ? "is-current" : ""}">${esc(stage)}</li>`).join("")}</ol>
    ${model.clarification ? `<aside class="work-clarification"><span>${esc(pick(model.language,"One critical detail","필수 정보 한 가지","Un dato esencial"))}</span><p>${esc(model.clarification)}</p><div><button type="button" data-clarify="existing">${esc(pick(model.language,"I have slides","슬라이드가 있어요","Tengo diapositivas"))}</button><button type="button" data-clarify="scratch">${esc(pick(model.language,"Prepare from scratch","처음부터 준비","Preparar desde cero"))}</button></div></aside>` : ""}
    <nav class="work-mission-tabs" aria-label="Mission views">${["overview","slides","notes","messages","qa","practice","checklist"].map((id,index)=>`<button type="button" data-work-tab="${id}" class="${index===0?"is-active":""}">${esc(labels[id])}</button>`).join("")}</nav>
    <div class="work-mission-view" data-work-view="overview">
      <section class="work-prepared"><h3>${esc(pick(model.language,"Prepared by ONE","ONE이 준비한 내용","Preparado por ONE"))}</h3><div>${model.artifacts.map((item,index)=>`<button type="button" data-artifact-index="${index}"><span>✓</span>${esc(item.label)}</button>`).join("")}</div></section>
      <div class="work-primary-actions"><button type="button" data-work-action="rehearsal" class="is-primary">${esc(model.primary)}</button><button type="button" data-work-action="review">${esc(labels.review)}</button><button type="button" data-work-action="qa">Q&A</button><button type="button" data-work-action="memory">${esc(labels.memorize)}</button><button type="button" data-work-action="short">${esc(labels.short)}</button><button type="button" data-work-action="edit">${esc(labels.edit)}</button></div>
      <p class="work-demo-notice"><strong>${esc(pick(model.language,"Prepared","준비됨","Preparado"))}</strong> · ${esc(model.preparationNotice)} <span>${esc(model.externalLabel)}</span></p>
    </div>
    <div class="work-mission-view" data-work-view="slides" hidden><div class="work-version-switch"><button type="button" data-version="full" class="is-active">10 MIN</button><button type="button" data-version="short">3 MIN</button><button type="button" data-version="emergency">60 SEC</button></div><div class="work-slide-list">${model.slides.map(slideHtml).join("") || `<p>${esc(model.preparationNotice)}</p>`}</div></div>
    <div class="work-mission-view" data-work-view="notes" hidden><div class="work-notes-list">${model.slides.map((slide)=>`<article><span>SLIDE ${slide.slideNumber}</span><h3>${esc(slide.title)}</h3>${slide.speakerNotes.map((note)=>`<p>${esc(note)}</p>`).join("")}</article>`).join("") || `<p>${esc(model.preparationNotice)}</p>`}</div></div>
    <div class="work-mission-view" data-work-view="messages" hidden><div class="work-notes-list">${model.slides.map((slide)=>`<article><span>SLIDE ${slide.slideNumber}</span><h3>${esc(slide.title)}</h3><strong>${esc(slide.mainMessage)}</strong><ul>${slide.bulletPoints.slice(0,3).map((point)=>`<li>${esc(point)}</li>`).join("")}</ul></article>`).join("") || `<p>${esc(model.preparationNotice)}</p>`}</div></div>
    <div class="work-mission-view" data-work-view="qa" hidden><div class="work-qa-list">${model.qa.map((item)=>`<article data-question-id="${item.id}"><h3>${esc(item.question)}</h3><div class="work-answer" hidden><strong>${esc(item.shortAnswer)}</strong><p>${esc(item.answer)}</p><ul>${item.keyPoints.map((p)=>`<li>${esc(p)}</li>`).join("")}</ul></div><div><button type="button" data-qa-action="toggle">${esc(pick(model.language,"Show answer","답변 보기","Ver respuesta"))}</button><button type="button" data-qa-action="practice">${esc(pick(model.language,"Practice answer","답변 연습","Practicar"))}</button><button type="button" data-qa-action="difficult">${esc(pick(model.language,"Mark difficult","어려움 표시","Marcar difícil"))}</button></div></article>`).join("") || `<p>${esc(model.preparationNotice)}</p>`}</div></div>
    <div class="work-mission-view" data-work-view="practice" hidden><div class="work-practice"><div class="work-practice-modes">${["FULL REHEARSAL","SLIDE BY SLIDE","RAPID Q&A","DIFFICULT QUESTIONS","OPENING ONLY","CLOSING ONLY"].map((mode,index)=>`<button type="button" data-practice-mode="${mode}" class="${index===0?"is-active":""}">${mode}</button>`).join("")}</div><h3>${esc(pick(model.language,"Deliver your opening.","오프닝을 말해보세요.","Presenta tu apertura."))}</h3><p>${esc(pick(model.language,"ONE evaluates the text transcript only—not vocal tone.","ONE은 음성 톤이 아니라 입력된 텍스트만 평가합니다.","ONE evalúa únicamente el texto, no el tono de voz."))}</p><textarea rows="5" data-rehearsal-input></textarea><button type="button" data-work-action="evaluate">${esc(pick(model.language,"GET COACHING","코칭 받기","RECIBIR COACHING"))}</button><div class="work-coaching" role="status"></div></div></div>
    <div class="work-mission-view" data-work-view="checklist" hidden><div class="work-checklist">${model.artifacts.slice(0,5).map((item,index)=>`<label><input type="checkbox" data-readiness-index="${index}"><span>${esc(item.label)}</span></label>`).join("")}<strong data-readiness-status>${esc(pick(model.language,"Keep practicing","연습을 계속하세요","Sigue practicando"))}</strong></div></div>
    <dialog class="work-memory-dialog"><button type="button" data-memory-close aria-label="Close">×</button><span data-memory-counter></span><h3 data-memory-title></h3><p data-memory-idea></p><strong data-memory-cue></strong><div><button type="button" data-memory-prev>←</button><button type="button" data-memory-shuffle>${esc(pick(model.language,"Shuffle","섞기","Mezclar"))}</button><button type="button" data-memory-learned>${esc(pick(model.language,"Mark learned","학습 완료","Aprendido"))}</button><button type="button" data-memory-next>→</button></div></dialog>`;

  let memoryIndex = 0;
  const store = () => { try { sessionStorage.setItem(`kastiz-one-work-mission-${result.id || model.type}`, JSON.stringify(result.workMissionState || {})); } catch {} onStateChange?.(result); };
  const showTab = (id) => { root.querySelectorAll("[data-work-tab]").forEach((b)=>b.classList.toggle("is-active",b.dataset.workTab===id)); root.querySelectorAll("[data-work-view]").forEach((v)=>v.hidden=v.dataset.workView!==id); };
  root.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-work-tab]"); if (tab) showTab(tab.dataset.workTab);
    const action = event.target.closest("[data-work-action]")?.dataset.workAction;
    if (action === "rehearsal" || action === "review") showTab(action === "review" ? "slides" : "practice");
    if (action === "qa") showTab("qa");
    if (action === "edit") document.getElementById("additionalServiceInput")?.focus();
    if (action === "short") { showTab("slides"); root.querySelector('[data-version="short"]')?.click(); }
    if (action === "memory") { memoryIndex=0; updateMemory(); root.querySelector(".work-memory-dialog")?.showModal(); }
    if (action === "evaluate") {
      const text = root.querySelector("[data-rehearsal-input]")?.value.trim() || "";
      const coaching = root.querySelector(".work-coaching");
      const coverage = /ONE/i.test(text) && /answer|execute|실행|답변|respuesta|ejecut/i.test(text);
      coaching.innerHTML = text ? `<strong>${esc(pick(model.language,"Coaching","코칭","Consejos"))}</strong><p>${esc(coverage ? pick(model.language,"Strong contrast between answers and execution. Keep the opening concise and pause before introducing ONE.","답변과 실행의 대비가 명확합니다. 오프닝을 간결하게 유지하고 ONE을 소개하기 전에 잠시 멈추세요.","El contraste entre respuestas y ejecución es claro. Mantén la apertura concisa y haz una pausa antes de presentar ONE.") : pick(model.language,"Introduce ONE earlier and state the answer-to-execution gap in one sentence.","ONE을 더 일찍 소개하고 답변과 실행 사이의 간극을 한 문장으로 말해보세요.","Presenta ONE antes y explica la brecha entre respuesta y ejecución en una frase."))}</p>` : `<p>${esc(pick(model.language,"Add a transcript to receive text-based coaching.","텍스트를 입력하면 코칭을 받을 수 있습니다.","Añade un texto para recibir consejos."))}</p>`;
      result.workMissionState = { ...(result.workMissionState||{}), rehearsal: recordRehearsalAttempt(result.workMissionState?.rehearsal || result.missionFoundation?.rehearsalState || {}, { textLength:text.length, keyMessageCovered:coverage }) }; store();
    }
    const version = event.target.closest("[data-version]"); if (version) { root.querySelectorAll("[data-version]").forEach((b)=>b.classList.toggle("is-active",b===version)); const limit=version.dataset.version==="emergency"?1:version.dataset.version==="short"?3:model.slides.length; root.querySelectorAll(".work-slide-card").forEach((card,index)=>card.hidden=index>=limit); }
    const qaAction = event.target.closest("[data-qa-action]"); if (qaAction) { const card=qaAction.closest("article"), answer=card.querySelector(".work-answer"); if(qaAction.dataset.qaAction==="toggle") answer.hidden=!answer.hidden; if(qaAction.dataset.qaAction==="difficult"){card.classList.toggle("is-difficult"); result.workMissionState={...(result.workMissionState||{}),difficultQuestions:[...new Set([...(result.workMissionState?.difficultQuestions||[]),card.dataset.questionId])]};store();} if(qaAction.dataset.qaAction==="practice") showTab("practice"); }
    if (event.target.closest("[data-memory-close]")) root.querySelector(".work-memory-dialog")?.close();
    if (event.target.closest("[data-memory-prev]")) { memoryIndex=(memoryIndex-1+model.slides.length)%model.slides.length;updateMemory(); }
    if (event.target.closest("[data-memory-next]")) { memoryIndex=(memoryIndex+1)%model.slides.length;updateMemory(); }
    if (event.target.closest("[data-memory-shuffle]")) { memoryIndex=(memoryIndex*7+3)%model.slides.length;updateMemory(); }
    if (event.target.closest("[data-memory-learned]")) { result.workMissionState={...(result.workMissionState||{}),learnedSlides:[...new Set([...(result.workMissionState?.learnedSlides||[]),memoryIndex+1])]};store(); root.querySelector("[data-memory-learned]").classList.add("is-learned"); }
    const clarify = event.target.closest("[data-clarify]"); if(clarify){result.workMissionState={...(result.workMissionState||{}),slideSource:clarify.dataset.clarify};store();clarify.closest(".work-clarification").remove();root.querySelector(".work-mission-hero>strong").textContent=pick(model.language,"READY TO PRACTICE","연습 준비 완료","LISTO PARA PRACTICAR");root.querySelectorAll(".work-mission-stages li").forEach((item,index)=>{item.classList.toggle("is-complete",index<5);item.classList.toggle("is-current",index===4);});}
  });
  root.addEventListener("change", (event)=>{ if(!event.target.matches("[data-readiness-index]")) return; const checks=[...root.querySelectorAll("[data-readiness-index]")]; const done=checks.filter(x=>x.checked).length; root.querySelector("[data-readiness-status]").textContent=done===checks.length?pick(model.language,"MISSION READY","미션 준비 완료","MISIÓN LISTA"):`${done}/${checks.length}`; result.workMissionState={...(result.workMissionState||{}),readiness:checks.map(x=>x.checked)};store(); });
  const updateMemory = () => { const slide=model.slides[memoryIndex]||model.slides[0]; if(!slide)return; root.querySelector("[data-memory-counter]").textContent=`${memoryIndex+1} / ${model.slides.length}`;root.querySelector("[data-memory-title]").textContent=slide.title;root.querySelector("[data-memory-idea]").textContent=`KEY IDEA: ${slide.mainMessage}`;root.querySelector("[data-memory-cue]").textContent=`MEMORY CUE: ${slide.bulletPoints[0]}`; };
  return root;
}
