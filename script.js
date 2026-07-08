const root = document.documentElement;
const body = document.body;
const themeToggle = document.getElementById("themeToggle");
const missionForm = document.getElementById("missionForm");
const missionInput = document.getElementById("missionInput");
const promptChips = document.querySelectorAll(".prompt-chip");

const STORAGE_KEY = "kastiz-one-theme";
const MISSION_KEY = "kastiz-one-current-mission";

const getSystemTheme = () => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "midnight" : "light";
};

const getSavedTheme = () => {
  return localStorage.getItem(STORAGE_KEY);
};

const setTheme = (theme) => {
  const nextTheme = theme === "midnight" ? "midnight" : "light";

  root.setAttribute("data-theme", nextTheme);
  themeToggle.setAttribute("aria-pressed", String(nextTheme === "midnight"));

  const themeColor = nextTheme === "midnight" ? "#211f1c" : "#f7f5f0";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);

  localStorage.setItem(STORAGE_KEY, nextTheme);
};

const initializeTheme = () => {
  const savedTheme = getSavedTheme();
  setTheme(savedTheme || getSystemTheme());
};

const normalizeMission = (value) => {
  return value.replace(/\s+/g, " ").trim();
};

const createMissionSlug = (mission) => {
  return mission
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
};

const saveMission = (mission) => {
  const payload = {
    mission,
    slug: createMissionSlug(mission),
    createdAt: new Date().toISOString(),
    source: "homepage"
  };

  sessionStorage.setItem(MISSION_KEY, JSON.stringify(payload));
};

const startMission = (mission) => {
  const cleanMission = normalizeMission(mission);

  if (!cleanMission) {
    missionInput.focus();
    return;
  }

  saveMission(cleanMission);
  body.classList.add("is-transitioning");

  window.setTimeout(() => {
    window.location.href = "loading.html";
  }, 360);
};

themeToggle.addEventListener("click", () => {
  const currentTheme = root.getAttribute("data-theme") || "light";
  setTheme(currentTheme === "midnight" ? "light" : "midnight");
});

missionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  startMission(missionInput.value);
});

promptChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const mission = normalizeMission(chip.textContent || "");
    missionInput.value = mission;
    startMission(mission);
  });
});

window.addEventListener("pageshow", () => {
  body.classList.remove("is-transitioning");
});

initializeTheme();
