# KASTIZ ONE — Global Localization & Intelligent Language Engine

Version: `20260730-intelligent-localization-v1`

## Summary

Implemented the foundation for native-feeling global localization without pretending the full product has been human-translated screen-by-screen.

This milestone fixes the central UTF-8 locale registry, expands the language switcher, adds intelligent language resolution, persists language preferences, prepares follow-location behavior, and adds regression tests for priority logic, encoding, language labels, and RTL readiness.

## Languages supported in the architecture

- English
- 한국어
- 日本語
- Español
- Français
- Deutsch
- Italiano
- Português
- 中文（简体）
- 中文（繁體）

## Files modified

- `js/i18n/locale-registry.js`
- `js/i18n/intelligent-localization-engine.js`
- `js/ui/page-ui.js`
- `js/pages/home-page.js`
- `index.html`
- `settings.html`
- `settings.js`
- `login.js`
- `tests/intelligent-localization-engine.test.mjs`

## Localization architecture

New engine:

- `createIntelligentLocalizationEngine`
- `resolveInterfaceLanguage`
- `languageForCountry`
- `persistLocalizationPreferences`
- `detectCountryWithPermission`

Priority order implemented:

1. User-selected language
2. Current device/location country when available
3. Browser preferred language
4. English

The engine never overrides explicit user preference. Follow-location is stored separately and defaults to disabled.

## Translation coverage

Completed:

- Central common keys
- Homepage core strings
- Results core strings
- Language labels
- Theme labels
- Settings language dropdown
- Homepage language dropdown
- Login basic labels routed through clean locale data

Not yet complete:

- Every historical alpha module string
- Every provider/fallback explanatory string
- Every legal/static page
- Every long-form generated mission card sentence

Those remaining strings need a staged translation audit before claiming full native coverage.

## Encoding fixes

The previous locale registry contained mojibake such as corrupted Korean and Spanish text. It has been replaced with UTF-8 strings and a regression test now blocks:

- `Ã`
- `Â`
- `â€`
- `â†`
- `�`
- common corrupted Korean byte patterns

## Responsive and layout readiness

The visible language switchers now include longer language labels. The architecture supports language expansion, but full mobile clipping validation for every screen remains a future visual QA task.

## RTL readiness

Prepared architecture metadata for future RTL languages:

- Arabic
- Hebrew

RTL languages are not enabled in the UI yet.

## Date, time, number, currency, and units

Added locale metadata through `localeDateTimeOptions`:

- Locale variant
- Text direction
- Week start
- Hour cycle
- Measurement system

The existing Global Financial Engine handles localized currency formatting separately.

## Missing translations

Known remaining gaps:

- Deep results modules created during earlier alpha milestones
- Some settings submodules
- Static policy pages
- Long-form mission generation copy
- Tooltips and minor helper text

## Remaining work

1. Run a full string extraction audit across all HTML/JS files.
2. Move remaining hardcoded UI text into localization keys.
3. Add visual snapshot checks for mobile/desktop language expansion.
4. Add user-profile synchronization after production auth is fully connected.
5. Add provider-driven localized place names only when providers officially return them.

## Truthfulness note

Do not claim every language is fully supported yet. The foundation and core visible controls are implemented, but full native coverage requires the remaining audit and human-quality translations.
