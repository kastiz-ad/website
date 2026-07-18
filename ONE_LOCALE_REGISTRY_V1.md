# ONE Locale Registry V1

`js/i18n/locale-registry.js` is the configuration source for official locales `en`, `ko`, and `es`, with prepared variants `en-US`, `en-GB`, `ko-KR`, `es-ES`, `es-MX`, and `es-US`. Resources use shared keys, section resources, English fallback, locale normalization, and parity validation. Mission, approval, wallet, subscription, provider, and execution logic consume locale values rather than making business decisions from language.

Missing-key validation must pass before a new official locale is enabled. Future locale order is configuration-driven, not fixed in mission code.
