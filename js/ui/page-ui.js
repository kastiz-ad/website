export const SUPPORTED_THEMES = Object.freeze(["light", "gray", "midnight"]);
export const SUPPORTED_LANGUAGES = Object.freeze(["en", "ko", "ja", "es", "fr", "de", "it", "pt", "zh-Hans", "zh-Hant"]);

export function readPreference(storage, key, supported, fallback) {
  const value = storage.getItem(key);
  return supported.includes(value) ? value : fallback;
}

export function applyDocumentPreferences({ theme, language }) {
  if (SUPPORTED_THEMES.includes(theme)) document.documentElement.dataset.theme = theme;
  if (SUPPORTED_LANGUAGES.includes(language)) document.documentElement.lang = language;
}


