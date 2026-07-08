const STORAGE_KEY = "kastiz-one-theme";
const MISSION_KEY = "kastiz-one-current-mission";

const missionName = document.getElementById("missionName");
const loadingMessage = document.getElementById("loadingMessage");
const progressBar = document.getElementById("progressBar");
const steps = [...document.querySelectorAll(".loading-step")];

const messages = [
  "Understanding your dream...",
  "Exploring every possibility...",
  "Finding trusted providers...",
  "Preparing everything...",
  "Turning your idea into reality..."
];

const loadTheme = () => {
  const savedTheme = localStorage.getItem(STORAGE_KEY) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeColor =
    savedTheme === "midnight"
      ? "#211f1c"
      : "#f7f5f0";

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", themeColor);
};

const loadMission = () => {
  try {
    const raw = sessionStorage.getItem(MISSION_KEY);

    if (!raw) {
      missionName.textContent = "Preparing your mission";
      return null;
    }

    const mission = JSON.parse(raw);

    missionName.textContent = mission.mission;

    return mission;
  } catch {
    missionName.textContent = "Preparing your mission";
    return null;
  }
};

const activateStep = (index) => {
  steps.forEach((step, i) => {
    step.classList.remove("is-active");

    if (i < index) {
      step.classList.add("is-complete");
    } else {
      step.classList.remove("is-complete");
    }

    if (i === index) {
      step.classList.add("is-active");
    }
  });

  loadingMessage.textContent = messages[index];

  const percent = ((index + 1) / messages.length) * 100;

  progressBar.style.width = `${percent}%`;
};

const finishMission = (mission) => {
  if (mission) {
    sessionStorage.setItem(
      "kastiz-one-results",
      JSON.stringify({
        ...mission,
        completedAt: new Date().toISOString()
      })
    );
  }

  document.body.style.opacity = "0";

  setTimeout(() => {
    window.location.href = "results.html";
  }, 450);
};

loadTheme();

const mission = loadMission();

activateStep(0);

let current = 0;

const interval = setInterval(() => {
  current++;

  if (current < messages.length) {
    activateStep(current);
    return;
  }

  clearInterval(interval);

  progressBar.style.width = "100%";

  setTimeout(() => {
    finishMission(mission);
  }, 800);

}, 1200);
