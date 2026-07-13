const MEASUREMENT_ID = "G-21WTWG7WYG";
const ALLOWED_EVENTS = new Set(["mission_started", "schedule_confirmed", "results_generated", "option_selected", "customize_used", "approval_clicked", "execution_summary_shown"]);
let initialized = false;

const cleanParams = (params = {}) => {
  const allowed = ["mission_type", "language", "page", "option_category", "schedule_used"];
  return Object.fromEntries(allowed
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => [key, typeof params[key] === "string" ? params[key].slice(0, 80) : params[key]]));
};

const initializeAnalytics = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", MEASUREMENT_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    anonymize_ip: true
  });
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
};

export const trackEvent = (name, params = {}) => {
  if (!ALLOWED_EVENTS.has(name)) return;
  initializeAnalytics();
  window.gtag("event", name, cleanParams(params));
};

initializeAnalytics();
