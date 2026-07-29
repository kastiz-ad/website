import test from "node:test";
import assert from "node:assert/strict";
import {
  LANGUAGE_LABELS,
  LOCALE_RESOURCES,
  OFFICIAL_LOCALES,
  RTL_READY_LOCALES,
  localeDateTimeOptions,
  localeSection,
  normalizeInterfaceLocale,
  validateLocaleParity
} from "../js/i18n/locale-registry.js";
import {
  createIntelligentLocalizationEngine,
  languageForCountry,
  persistLocalizationPreferences,
  resolveInterfaceLanguage
} from "../js/i18n/intelligent-localization-engine.js";

const storage = () => {
  const data = new Map();
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key)
  };
};

test("expanded locale registry supports requested language switcher labels", () => {
  assert.deepEqual(OFFICIAL_LOCALES, ["en", "ko", "ja", "es", "fr", "de", "it", "pt", "zh-Hans", "zh-Hant"]);
  for (const locale of OFFICIAL_LOCALES) {
    assert.ok(LOCALE_RESOURCES[locale]);
    assert.ok(localeSection(locale, "home").languages[locale]);
  }
  assert.equal(LANGUAGE_LABELS.ko, "한국어");
  assert.equal(LANGUAGE_LABELS.ja, "日本語");
  assert.equal(LANGUAGE_LABELS.es, "Español");
  assert.equal(validateLocaleParity(), true);
});

test("language priority respects explicit user choice before location and browser", () => {
  const result = resolveInterfaceLanguage({
    userSelectedLanguage: "es",
    deviceCountry: "JP",
    browserLanguage: "ko-KR",
    autoDetectEnabled: true,
    followLocationEnabled: true
  });
  assert.equal(result.language, "es");
  assert.equal(result.source, "user_selected");
});

test("country language mapping supports major requested markets and Canada browser preference", () => {
  assert.equal(languageForCountry("JP"), "ja");
  assert.equal(languageForCountry("KR"), "ko");
  assert.equal(languageForCountry("FR"), "fr");
  assert.equal(languageForCountry("DE"), "de");
  assert.equal(languageForCountry("BR"), "pt");
  assert.equal(languageForCountry("TW"), "zh-Hant");
  assert.equal(languageForCountry("CN"), "zh-Hans");
  assert.equal(languageForCountry("CA", "fr-CA"), "fr");
  assert.equal(languageForCountry("CA", "en-CA"), "en");
});

test("engine persists selected language and follow-location preference for guest users", () => {
  const fakeStorage = storage();
  persistLocalizationPreferences({
    storage: fakeStorage,
    selectedLanguage: "ja",
    autoDetectEnabled: true,
    followLocationEnabled: true,
    detectedCountry: "JP"
  });
  const engine = createIntelligentLocalizationEngine({ storage: fakeStorage, browserLanguage: "en-US" });
  assert.equal(engine.preferences().selectedLanguage, "ja");
  assert.equal(engine.preferences().followLocationEnabled, true);
  assert.equal(engine.resolve().language, "ja");
});

test("locale normalization and date-time metadata are future RTL-ready", () => {
  assert.equal(normalizeInterfaceLocale("zh-TW"), "zh-Hant");
  assert.equal(normalizeInterfaceLocale("zh-CN"), "zh-Hans");
  assert.equal(normalizeInterfaceLocale("pt-BR"), "pt");
  assert.equal(localeDateTimeOptions("ja").hourCycle, "h23");
  assert.ok(RTL_READY_LOCALES.includes("ar"));
  assert.ok(RTL_READY_LOCALES.includes("he"));
});

test("central locale registry contains no mojibake or replacement characters", () => {
  const text = JSON.stringify(LOCALE_RESOURCES);
  assert.doesNotMatch(text, /Ã|Â|â€|â†|�|í•|ì–|ë¯|ê³/);
  assert.match(text, /한국어/);
  assert.match(text, /日本語/);
  assert.match(text, /中文（繁體）/);
});
