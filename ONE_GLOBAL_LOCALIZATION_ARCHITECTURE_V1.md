# ONE Global Localization Architecture V1

The browser registry owns reviewed UI resources. The protected server owns conversation detection and builds a language/location profile. Mission state stores locale-independent semantic values so switching the interface does not change ONE Pick, approvals, prices, currency, provider region, or execution state.

Fallback: retain the selected official UI, respond in the requested model-supported language, offer a subtle conversation-language control, and never claim full interface localization. Location selects local data/providers only with consent and never forces language.
