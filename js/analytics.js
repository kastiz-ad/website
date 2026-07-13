const MEASUREMENT_ID = "G-21WTWG7WYG";
const ALLOWED_EVENTS = new Set([
  "page_visit", "language_selection", "theme_selection", "mission_started",
  "mission_category", "schedule_confirmed", "loading_complete", "results_generated",
  "results_viewed", "option_selected", "customize_used", "approval_clicked",
  "approval_requested", "approval_confirmed", "execution_summary_shown",
  "simulated_execution_completed", "return_home", "error_fallback",
  "early_access_request", "contact_submission", "partner_inquiry", "provider_inquiry"
]);
let initialized = false;

const cleanParams = (params = {}) => {
  const allowed = ["mission_type", "language", "page", "option_category", "schedule_used", "status", "provider_status"];
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
