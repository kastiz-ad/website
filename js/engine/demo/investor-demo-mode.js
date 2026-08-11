export const INVESTOR_DEMO_VERSION = "20260730-investor-demo-mode-v1";
export const INVESTOR_DEMO_STORAGE_KEY = "kastiz-one-investor-demo-mode";

export const INVESTOR_DEMO_SCENARIOS = Object.freeze({
  travel: Object.freeze({
    id: "travel",
    category: "Travel",
    missionType: "travel",
    title: "Japan trip",
    mission: "Plan a 7 day Japan trip for one traveler with food, hotels, flights, weather backup, and approval protection.",
    highlight: "Shows multilingual travel planning, provider truthfulness, itinerary editing, approval, and execution-ready state."
  }),
  business_trip: Object.freeze({
    id: "business_trip",
    category: "Business trip",
    missionType: "travel",
    title: "Executive business trip",
    mission: "Prepare a business trip to New York for an executive with flights, hotel policy, calendar timing, and approval chain.",
    highlight: "Shows enterprise policies, budgets, approval chain thinking, and provider-safe execution preparation."
  }),
  family_vacation: Object.freeze({
    id: "family_vacation", category: "Family vacation", missionType: "travel", title: "7-day Hawaii family vacation",
    mission: "Plan a great 7 day Hawaii vacation for a family of four, with two adults and two children. Include beaches, culture, food, family activities, sensible pacing, weather backup, flights, and a family-friendly stay.",
    highlight: "Shows a complete family-aware Hawaii itinerary with pacing, food, weather alternatives, and approval protection."
  }),
  medical_appointment: Object.freeze({
    id: "medical_appointment",
    category: "Medical appointment",
    missionType: "healthcare",
    title: "Same-day dentist appointment",
    mission: "Prepare a same-day dentist appointment in Gangnam for tooth pain. Show clinic-style options, documents to bring, transport, pharmacy follow-up, emergency warning signs, and approval before any contact. Do not diagnose.",
    highlight: "Shows healthcare appointment navigation, safety boundaries, no diagnosis, and setup-required provider honesty."
  }),
  restaurant_reservation: Object.freeze({
    id: "restaurant_reservation",
    category: "Weekend date",
    missionType: "restaurant",
    title: "Plan weekend date",
    mission: "Plan a memorable 2 day weekend date in Seoul for two people with excellent restaurants, beautiful walks, culture, cafes, and a Korean jjimjilbang option. No hotel. Require approval before any reservation or contact.",
    highlight: "Shows a polished two-day Seoul date with real places, strong restaurants, route logic, and no hotel."
  })
});

export const INVESTOR_PRESENTATION_FLOW = Object.freeze([
  { id: "homepage", label: "Homepage", note: "A user states a natural-language mission." },
  { id: "mission-understanding", label: "Mission understanding", note: "ONE classifies the goal, context, language, destination, and missing information." },
  { id: "providers", label: "Live or demo providers", note: "Provider data is used when connected. Otherwise data is clearly labeled demonstration or setup-required." },
  { id: "mission-generation", label: "Mission generation", note: "ONE prepares a structured mission plan instead of a generic answer." },
  { id: "mission-editing", label: "Mission editing", note: "The user can ask ONE to change or add details before approval." },
  { id: "approval", label: "Approval", note: "Nothing is booked, paid, submitted, shared, or contacted without explicit approval." },
  { id: "execution-ready", label: "Execution-ready", note: "ONE prepares provider-safe next actions and truthful status." }
]);

export const INVESTOR_NOTE_TOPICS = Object.freeze({
  missionEngine: Object.freeze({
    title: "Mission Engine",
    body: "Turns natural language into a structured mission with domain, context, missing data, and success criteria."
  }),
  providerLayer: Object.freeze({
    title: "Provider Layer",
    body: "Normalizes providers without pretending unavailable APIs are connected. Demo data stays labeled as demo."
  }),
  approvalEngine: Object.freeze({
    title: "Approval Engine",
    body: "Keeps the user in control. Approval is required before provider contact, booking, payment, submission, or execution."
  }),
  memory: Object.freeze({
    title: "Memory",
    body: "Uses explicit, user-controlled preferences to reduce repeated work without storing everything like a chatbot."
  }),
  localization: Object.freeze({
    title: "Localization",
    body: "Preserves English, Korean, and Spanish presentation while keeping destination and provider truthfulness intact."
  }),
  execution: Object.freeze({
    title: "Execution",
    body: "Prepares provider-safe actions and status tracking. Execution remains external and approval-first."
  })
});

const getSearch = (locationLike = globalThis.location) => {
  try { return new URL(locationLike.href || String(locationLike)).searchParams; } catch { return new URLSearchParams(); }
};

const getStorage = (storage = globalThis.sessionStorage) => storage;
const safeParse = (value, fallback) => {
  try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
};

export function isInvestorDemoMode(locationLike = globalThis.location) {
  const params = getSearch(locationLike);
  return params.get("investorDemo") === "1" || params.get("demo") === "1";
}

export function getInvestorDemoScenario(id = "travel") {
  return INVESTOR_DEMO_SCENARIOS[id] || INVESTOR_DEMO_SCENARIOS.travel;
}

export function createInvestorDemoState({
  scenarioId = "travel",
  status = "ready",
  timerStartedAt = null,
  elapsedSeconds = 0,
  currentFlowIndex = 0,
  notesVisible = false,
  highlightedTopic = null
} = {}) {
  return Object.freeze({
    version: INVESTOR_DEMO_VERSION,
    enabled: true,
    scenarioId: getInvestorDemoScenario(scenarioId).id,
    status,
    timerStartedAt,
    elapsedSeconds: Math.max(0, Number(elapsedSeconds) || 0),
    currentFlowIndex: Math.min(Math.max(0, Number(currentFlowIndex) || 0), INVESTOR_PRESENTATION_FLOW.length - 1),
    notesVisible,
    highlightedTopic
  });
}

export function readInvestorDemoState(storage = getStorage()) {
  return createInvestorDemoState(safeParse(storage?.getItem?.(INVESTOR_DEMO_STORAGE_KEY), {}));
}

export function writeInvestorDemoState(state, storage = getStorage()) {
  const next = createInvestorDemoState(state);
  storage?.setItem?.(INVESTOR_DEMO_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function resetInvestorDemo(storage = getStorage()) {
  storage?.removeItem?.(INVESTOR_DEMO_STORAGE_KEY);
  storage?.removeItem?.("kastiz-one-results");
  storage?.removeItem?.("kastiz-one-current-mission");
  storage?.removeItem?.("kastiz-one-travel-mission");
  return createInvestorDemoState();
}

export function updateInvestorDemoState(state, action, { now = new Date() } = {}) {
  const current = createInvestorDemoState(state);
  if (action === "restart") {
    return createInvestorDemoState({ scenarioId: current.scenarioId, status: "running", timerStartedAt: now.toISOString(), elapsedSeconds: 0, currentFlowIndex: 0, notesVisible: current.notesVisible });
  }
  if (action === "pause") {
    const started = current.timerStartedAt ? new Date(current.timerStartedAt).getTime() : now.getTime();
    const elapsed = current.status === "running" ? current.elapsedSeconds + Math.max(0, Math.round((now.getTime() - started) / 1000)) : current.elapsedSeconds;
    return createInvestorDemoState({ ...current, status: "paused", timerStartedAt: null, elapsedSeconds: elapsed });
  }
  if (action === "resume") {
    return createInvestorDemoState({ ...current, status: "running", timerStartedAt: now.toISOString() });
  }
  if (action === "fast_forward") {
    return createInvestorDemoState({ ...current, currentFlowIndex: Math.min(current.currentFlowIndex + 1, INVESTOR_PRESENTATION_FLOW.length - 1) });
  }
  if (action === "toggle_notes") {
    return createInvestorDemoState({ ...current, notesVisible: !current.notesVisible });
  }
  return current;
}

export function buildInvestorDemoUrl(scenarioId = "travel", { language = "en", base = "results.html" } = {}) {
  const scenario = getInvestorDemoScenario(scenarioId);
  const params = new URLSearchParams({
    investorDemo: "1",
    demo: "1",
    demoScenario: scenario.id,
    mission: scenario.mission,
    lang: language,
    v: INVESTOR_DEMO_VERSION
  });
  if (scenario.id === "restaurant_reservation") params.set("destination", "Seoul");
  return `${base}?${params.toString()}`;
}

export function providerEvidenceStatus(result = {}) {
  const providers = Array.isArray(result.providerResults) ? result.providerResults : [];
  const liveProviders = providers.filter(provider => provider?.liveData === true || provider?.status === "live" || provider?.evidenceLevel === "live");
  if (liveProviders.length) {
    return Object.freeze({
      status: "live_provider_available",
      label: "Live provider data detected",
      disclosure: "This demo is using provider-backed information where available.",
      providers: Object.freeze(liveProviders.map(provider => provider.provider || provider.providerId || provider.category).filter(Boolean))
    });
  }
  return Object.freeze({
    status: "demonstration_data",
    label: "Demonstration data",
    disclosure: "Live providers are not connected for this view. Sample provider information is clearly labeled demonstration data.",
    providers: Object.freeze([])
  });
}

export function createInvestorPresentationSnapshot(result = {}, state = createInvestorDemoState()) {
  const scenario = getInvestorDemoScenario(state.scenarioId);
  const evidence = providerEvidenceStatus(result);
  return Object.freeze({
    version: INVESTOR_DEMO_VERSION,
    scenario,
    evidence,
    currentFlow: INVESTOR_PRESENTATION_FLOW[state.currentFlowIndex],
    controls: Object.freeze(["restart", "pause", "fast_forward", "reset", "notes"]),
    notes: INVESTOR_NOTE_TOPICS,
    truthfulDemoData: evidence.status === "demonstration_data"
  });
}

const createButton = (document, text, attributes = {}) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  Object.entries(attributes).forEach(([key, value]) => button.setAttribute(key, value));
  return button;
};

export function mountInvestorDemoHome({
  document = globalThis.document,
  window = globalThis.window,
  language = "en"
} = {}) {
  if (!document?.body || document.getElementById("investorDemoLauncher")) return null;
  const panel = document.createElement("section");
  panel.id = "investorDemoLauncher";
  panel.className = "investor-demo-launcher";
  panel.setAttribute("aria-label", "Investor demo mode");
  panel.innerHTML = `
    <div>
      <p>Investor Demo</p>
      <strong>Show ONE in one click.</strong>
      <span>Uses live providers when configured; otherwise clearly labeled demo data.</span>
    </div>
    <div class="investor-demo-samples"></div>
    <button type="button" class="investor-demo-reset">Reset Demo</button>
  `;
  const samples = panel.querySelector(".investor-demo-samples");
  Object.values(INVESTOR_DEMO_SCENARIOS).forEach((scenario) => {
    const button = createButton(document, scenario.category, { "data-investor-demo-scenario": scenario.id });
    button.addEventListener("click", () => {
      const state = writeInvestorDemoState({ scenarioId: scenario.id, status: "running", timerStartedAt: new Date().toISOString() }, window.sessionStorage);
      window.sessionStorage?.setItem?.(INVESTOR_DEMO_STORAGE_KEY, JSON.stringify(state));
      window.location.href = buildInvestorDemoUrl(scenario.id, { language, base: "results.html" });
    });
    samples.append(button);
  });
  panel.querySelector(".investor-demo-reset")?.addEventListener("click", () => {
    resetInvestorDemo(window.sessionStorage);
    window.location.href = "index.html";
  });
  document.body.append(panel);
  return panel;
}

export function mountInvestorDemoResults({
  document = globalThis.document,
  window = globalThis.window,
  result = {},
  language = "en"
} = {}) {
  if (!document?.body || document.getElementById("investorDemoControls")) return null;
  const params = getSearch(window.location);
  const state = writeInvestorDemoState({
    ...readInvestorDemoState(window.sessionStorage),
    scenarioId: params.get("demoScenario") || readInvestorDemoState(window.sessionStorage).scenarioId || "travel"
  }, window.sessionStorage);
  const snapshot = createInvestorPresentationSnapshot(result, state);
  const panel = document.createElement("aside");
  panel.id = "investorDemoControls";
  panel.className = "investor-demo-controls";
  panel.setAttribute("aria-label", "Investor presentation controls");
  panel.innerHTML = `
    <div class="investor-demo-control-head">
      <div>
        <p>Investor Demo Mode</p>
        <strong>${snapshot.scenario.category}</strong>
      </div>
      <span class="investor-demo-timer" data-demo-timer>00:00</span>
    </div>
    <p class="investor-demo-disclosure">${snapshot.evidence.disclosure}</p>
    <div class="investor-demo-flow" data-demo-flow></div>
    <div class="investor-demo-buttons">
      <button type="button" data-demo-action="restart">Restart</button>
      <button type="button" data-demo-action="pause">Pause</button>
      <button type="button" data-demo-action="fast_forward">Fast-forward</button>
      <button type="button" data-demo-action="notes">Investor Notes</button>
      <button type="button" data-demo-action="reset">Reset</button>
    </div>
    <div class="investor-demo-notes" data-demo-notes hidden></div>
  `;

  const renderFlow = (nextState) => {
    const flow = panel.querySelector("[data-demo-flow]");
    if (!flow) return;
    flow.innerHTML = INVESTOR_PRESENTATION_FLOW.map((item, index) => `
      <span class="${index === nextState.currentFlowIndex ? "is-current" : index < nextState.currentFlowIndex ? "is-complete" : ""}">
        ${index + 1}. ${item.label}
      </span>
    `).join("");
  };
  const renderNotes = (nextState) => {
    const notes = panel.querySelector("[data-demo-notes]");
    if (!notes) return;
    notes.hidden = !nextState.notesVisible;
    notes.innerHTML = Object.values(INVESTOR_NOTE_TOPICS).map((note) => `<article><strong>${note.title}</strong><p>${note.body}</p></article>`).join("");
  };
  const renderTimer = (nextState = readInvestorDemoState(window.sessionStorage)) => {
    const timer = panel.querySelector("[data-demo-timer]");
    if (!timer) return;
    const runningExtra = nextState.status === "running" && nextState.timerStartedAt
      ? Math.max(0, Math.round((Date.now() - new Date(nextState.timerStartedAt).getTime()) / 1000))
      : 0;
    const total = nextState.elapsedSeconds + runningExtra;
    timer.textContent = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };
  const persistAndRender = (nextState) => {
    writeInvestorDemoState(nextState, window.sessionStorage);
    renderFlow(nextState);
    renderNotes(nextState);
    renderTimer(nextState);
  };

  panel.addEventListener("click", (event) => {
    const action = event.target.closest("[data-demo-action]")?.dataset.demoAction;
    if (!action) return;
    if (action === "reset") {
      resetInvestorDemo(window.sessionStorage);
      window.location.href = "index.html?demo=1";
      return;
    }
    if (action === "notes") {
      persistAndRender(updateInvestorDemoState(readInvestorDemoState(window.sessionStorage), "toggle_notes"));
      return;
    }
    persistAndRender(updateInvestorDemoState(readInvestorDemoState(window.sessionStorage), action));
  });

  document.body.append(panel);
  document.body.classList.add("investor-demo-mode");
  persistAndRender(state);
  window.setInterval(() => renderTimer(), 1000);
  return panel;
}
