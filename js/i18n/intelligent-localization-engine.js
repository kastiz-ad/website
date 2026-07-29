import { OFFICIAL_LOCALES, localeDateTimeOptions, normalizeInterfaceLocale } from "./locale-registry.js";

export const INTELLIGENT_LOCALIZATION_VERSION = "20260730-intelligent-localization-v1";

export const LOCALIZATION_STORAGE_KEYS = Object.freeze({
  selectedLanguage: "kastiz-one-language",
  autoDetectEnabled: "kastiz-one-language-auto-detect",
  followLocationEnabled: "kastiz-one-language-follow-location",
  lastDetectedCountry: "kastiz-one-last-detected-country",
  lastPromptedAt: "kastiz-one-location-language-prompted-at"
});

export const COUNTRY_LANGUAGE_MAP = Object.freeze({
  JP: "ja",
  KR: "ko",
  FR: "fr",
  DE: "de",
  ES: "es",
  BR: "pt",
  PT: "pt",
  IT: "it",
  MX: "es",
  TW: "zh-Hant",
  HK: "zh-Hant",
  MO: "zh-Hant",
  CN: "zh-Hans",
  SG: "zh-Hans",
  US: "en",
  GB: "en",
  AU: "en",
  NZ: "en"
});

const truthy = (value, fallback = false) => {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value) === "true";
};

export function languageForCountry(countryCode, browserLanguage = "en") {
  const country = String(countryCode || "").trim().toUpperCase();
  if (country === "CA") {
    return normalizeInterfaceLocale(String(browserLanguage || "").toLowerCase().startsWith("fr") ? "fr" : "en");
  }
  return COUNTRY_LANGUAGE_MAP[country] || null;
}

export function createLocalizationPreferences(storage = globalThis.localStorage) {
  const selected = storage?.getItem?.(LOCALIZATION_STORAGE_KEYS.selectedLanguage);
  return Object.freeze({
    selectedLanguage: OFFICIAL_LOCALES.includes(selected) ? selected : null,
    autoDetectEnabled: truthy(storage?.getItem?.(LOCALIZATION_STORAGE_KEYS.autoDetectEnabled), true),
    followLocationEnabled: truthy(storage?.getItem?.(LOCALIZATION_STORAGE_KEYS.followLocationEnabled), false),
    lastDetectedCountry: storage?.getItem?.(LOCALIZATION_STORAGE_KEYS.lastDetectedCountry) || null
  });
}

export function resolveInterfaceLanguage({
  userSelectedLanguage = null,
  deviceCountry = null,
  browserLanguage = "en",
  autoDetectEnabled = true,
  followLocationEnabled = false
} = {}) {
  const explicit = normalizeInterfaceLocale(userSelectedLanguage, "");
  if (explicit && OFFICIAL_LOCALES.includes(explicit)) {
    return Object.freeze({ language: explicit, source: "user_selected", confidence: 1, autoChanged: false });
  }
  const browser = normalizeInterfaceLocale(browserLanguage, "en");
  const locationLanguage = autoDetectEnabled ? languageForCountry(deviceCountry, browserLanguage) : null;
  if (locationLanguage) {
    return Object.freeze({ language: locationLanguage, source: "device_location", confidence: followLocationEnabled ? 0.94 : 0.88, autoChanged: Boolean(followLocationEnabled) });
  }
  return Object.freeze({ language: browser || "en", source: browser ? "browser_language" : "default_english", confidence: browser ? 0.78 : 0.5, autoChanged: false });
}

export function persistLocalizationPreferences({
  storage = globalThis.localStorage,
  selectedLanguage,
  autoDetectEnabled,
  followLocationEnabled,
  detectedCountry
} = {}) {
  if (!storage?.setItem) return false;
  if (selectedLanguage && OFFICIAL_LOCALES.includes(selectedLanguage)) storage.setItem(LOCALIZATION_STORAGE_KEYS.selectedLanguage, selectedLanguage);
  if (typeof autoDetectEnabled === "boolean") storage.setItem(LOCALIZATION_STORAGE_KEYS.autoDetectEnabled, String(autoDetectEnabled));
  if (typeof followLocationEnabled === "boolean") storage.setItem(LOCALIZATION_STORAGE_KEYS.followLocationEnabled, String(followLocationEnabled));
  if (detectedCountry) storage.setItem(LOCALIZATION_STORAGE_KEYS.lastDetectedCountry, String(detectedCountry).toUpperCase());
  return true;
}

export async function detectCountryWithPermission({
  geolocation = globalThis.navigator?.geolocation,
  reverseGeocode = null,
  timeoutMs = 3500
} = {}) {
  if (!geolocation || typeof reverseGeocode !== "function") {
    return Object.freeze({ ok: false, status: "location_unavailable", country: null });
  }
  const position = await new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    geolocation.getCurrentPosition(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 86400000 }
    );
  });
  if (!position?.coords) return Object.freeze({ ok: false, status: "permission_unavailable_or_denied", country: null });
  const country = await reverseGeocode(position.coords).catch(() => null);
  return country ? Object.freeze({ ok: true, status: "resolved", country: String(country).toUpperCase() }) : Object.freeze({ ok: false, status: "reverse_geocode_unavailable", country: null });
}

export function createIntelligentLocalizationEngine({ storage = globalThis.localStorage, browserLanguage = globalThis.navigator?.language || "en" } = {}) {
  return Object.freeze({
    version: INTELLIGENT_LOCALIZATION_VERSION,
    supportedLanguages: OFFICIAL_LOCALES,
    preferences() {
      return createLocalizationPreferences(storage);
    },
    resolve(input = {}) {
      const preferences = createLocalizationPreferences(storage);
      return resolveInterfaceLanguage({
        browserLanguage,
        autoDetectEnabled: preferences.autoDetectEnabled,
        followLocationEnabled: preferences.followLocationEnabled,
        userSelectedLanguage: input.userSelectedLanguage ?? preferences.selectedLanguage,
        deviceCountry: input.deviceCountry ?? preferences.lastDetectedCountry
      });
    },
    save(input = {}) {
      return persistLocalizationPreferences({ storage, ...input });
    },
    dateTime(locale) {
      return localeDateTimeOptions(locale);
    }
  });
}
