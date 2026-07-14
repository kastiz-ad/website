import {
  PROFILE_CONSENT_VERSION,
  PROFILE_STORAGE_KEY,
  PROFILE_VERSION,
  SAMPLE_PROFILE_SESSION_KEY,
  profileMemoryEnabled
} from "../config/profile-memory.js";

const CATEGORIES = Object.freeze(["identity", "travel", "food", "shopping", "housing", "education", "business", "accessibility"]);
const ALLOWED_FIELDS = Object.freeze({
  identity: ["preferredName", "country", "nationality", "language", "timezone", "cityRegion"],
  travel: ["departureAirport", "airlines", "cabin", "seat", "maximumStops", "baggage", "hotelStyle", "room", "breakfast", "budgetStyle", "insurance", "transport", "loyaltyPrograms", "tripPace"],
  food: ["cuisines", "dislikedFoods", "dietaryPreferences", "allergyWarning", "partySize", "reservationTime", "distance", "budgetRange"],
  shopping: ["brands", "budgetStyle", "deliveryCountry", "deliverySpeed", "warranty", "priorities", "sizes"],
  housing: ["area", "housingType", "monthlyBudget", "commute", "furnished", "pets"],
  education: ["goals", "subject", "level", "format", "schedule", "lessonBudget", "teachingStyle"],
  business: ["companyName", "country", "industry", "role", "invoicePreference", "meetingLanguage", "meetingTime"],
  accessibility: ["interfacePreferences"]
});
const BLOCKED_KEY = /(passport|visa|national.?id|card|bank|health|medical|child|emergency|password|token|secret)/i;
const clean = (value) => String(value ?? "").replace(/[<>]/g, "").trim().slice(0, 240);
const emptyCategories = () => Object.fromEntries(CATEGORIES.map((category) => [category, {}]));
const emptyProfile = () => ({
  version: PROFILE_VERSION,
  userId: null,
  preferredName: "",
  language: localStorage.getItem("kastiz-one-language") || document.documentElement.lang || "en",
  locale: navigator.language || "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  country: "",
  profileConsent: { enabled: false, consentVersion: null, consentedAt: null },
  categories: emptyCategories(),
  updatedAt: new Date().toISOString()
});
const normalize = (input) => {
  const profile = emptyProfile();
  if (!input || typeof input !== "object") return profile;
  profile.profileConsent = {
    enabled: input.profileConsent?.enabled === true,
    consentVersion: input.profileConsent?.consentVersion || null,
    consentedAt: input.profileConsent?.consentedAt || null
  };
  CATEGORIES.forEach((category) => {
    const source = input.categories?.[category] || {};
    ALLOWED_FIELDS[category].forEach((key) => {
      const record = source[key];
      if (!record || BLOCKED_KEY.test(key)) return;
      const value = clean(typeof record === "object" ? record.value : record);
      if (!value) return;
      profile.categories[category][key] = {
        value,
        sourceMissionId: typeof record === "object" ? clean(record.sourceMissionId) : "",
        confidence: 1,
        userConfirmed: true,
        updatedAt: typeof record === "object" && record.updatedAt ? record.updatedAt : new Date().toISOString(),
        expiresAt: typeof record === "object" ? record.expiresAt || null : null,
        storage: "device-local"
      };
    });
  });
  profile.updatedAt = input.updatedAt || new Date().toISOString();
  return profile;
};
export const readProfile = () => {
  try { return normalize(JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || "null")); }
  catch { return emptyProfile(); }
};
const writeProfile = (profile) => {
  const safe = normalize(profile); safe.updatedAt = new Date().toISOString();
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(safe)); return safe;
};
export const setMemoryEnabled = (enabled) => {
  const profile = readProfile();
  profile.profileConsent = enabled ? { enabled: true, consentVersion: PROFILE_CONSENT_VERSION, consentedAt: new Date().toISOString() } : { ...profile.profileConsent, enabled: false };
  return writeProfile(profile);
};
export const getProfileForMission = (type) => {
  const profile = readProfile();
  if (!profileMemoryEnabled || !profile.profileConsent.enabled) return { enabled: false, category: {}, profile };
  const map = { tutoring: "education", language_exchange: "education", childcare: "identity", moving: "housing", general_mission: "identity" };
  return { enabled: true, category: profile.categories[map[type] || type] || {}, profile };
};
export const getSuggestedPrefill = (type) => {
  const { enabled, category } = getProfileForMission(type); if (!enabled) return {};
  const value = (key) => category[key]?.value || "";
  if (type === "travel") return { departure: value("departureAirport"), priority: value("tripPace")?.toLowerCase() || value("budgetStyle")?.toLowerCase(), preferences: [value("cabin"), value("seat"), value("hotelStyle")].filter(Boolean).join(" · ") };
  if (type === "tutoring" || type === "language_exchange") return { subject: value("subject"), level: value("level"), format: value("format"), schedule: value("schedule"), budget: value("lessonBudget") };
  if (type === "shopping") return { brands: value("brands"), budget: value("budgetStyle"), country: value("deliveryCountry"), priority: value("priorities") };
  return {};
};
export const getMissingMissionFields = (fields, suggested = {}) => fields.filter((field) => !suggested[field]);
export const saveApprovedPreference = (category, key, value, sourceMissionId = "") => {
  if (!CATEGORIES.includes(category) || !ALLOWED_FIELDS[category].includes(key) || BLOCKED_KEY.test(key)) return readProfile();
  const profile = readProfile(); if (!profile.profileConsent.enabled) return profile;
  const safeValue = clean(value); if (!safeValue) return profile;
  profile.categories[category][key] = { value: safeValue, sourceMissionId: clean(sourceMissionId), confidence: 1, userConfirmed: true, updatedAt: new Date().toISOString(), expiresAt: null, storage: "device-local" };
  return writeProfile(profile);
};
export const confirmProfileValue = saveApprovedPreference;
export const updatePreference = saveApprovedPreference;
export const deletePreference = (category, key) => { const profile = readProfile(); if (profile.categories[category]) delete profile.categories[category][key]; return writeProfile(profile); };
export const clearCategory = (category) => { const profile = readProfile(); if (CATEGORIES.includes(category)) profile.categories[category] = {}; return writeProfile(profile); };
export const clearProfile = () => { localStorage.removeItem(PROFILE_STORAGE_KEY); return emptyProfile(); };
export const exportProfileSummary = () => {
  const profile = readProfile();
  return CATEGORIES.flatMap((category) => Object.entries(profile.categories[category]).map(([key, record]) => ({ category, field: key, value: record.value, storage: "device-local", source: record.sourceMissionId || "Saved by user" })));
};
export const getSampleProfile = () => {
  try { return JSON.parse(sessionStorage.getItem(SAMPLE_PROFILE_SESSION_KEY) || "null"); } catch { return null; }
};
export const useSampleProfile = () => {
  const sample = { sample: true, travel: { departureAirport: "Incheon", cabin: "Economy", seat: "Aisle", maximumStops: "1", hotelStyle: "4-star", tripPace: "Balanced" }, food: { cuisines: "Korean / Japanese" }, shopping: { priorities: "Best value" } };
  sessionStorage.setItem(SAMPLE_PROFILE_SESSION_KEY, JSON.stringify(sample)); return sample;
};
export const clearSampleProfile = () => sessionStorage.removeItem(SAMPLE_PROFILE_SESSION_KEY);
