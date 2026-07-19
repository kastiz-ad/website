# ONE Language Strategy V1

Revision commands, diff summaries, loading/error states, and approval-invalidation explanations are equivalent in English, Korean, and Spanish. A display-only language change preserves semantic mission state and approval when no authorized action changes.

English, Korean, and Spanish are the reviewed interface locales. `interfaceLocale`, `conversationLanguage`, `contentLanguage`, country, region, time zone, currency, formats, provider region, and payment region are independent. Manual interface choice wins; conversation language follows an explicit request, current message, saved preference, recent conversation, interface, then browser. Location is only a weak fallback.

OpenAI generates directly in the conversation language. Papago and Google Translate are not core dependencies. High-stakes contracts, medical instructions, government forms, and financial disclosures require specialist review. A supported conversational language does not imply a fully localized interface.
