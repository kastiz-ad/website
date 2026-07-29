# KASTIZ ONE — Global Financial Engine

Version: `20260730-global-financial-engine-v1`

## Summary

Implemented a reusable Financial Intelligence Engine for mission-wide money handling. It supports ISO-4217 currency validation, localized formatting, explicit tax/fee breakdowns, mission budget tracking, exchange-rate provider integration, refund evidence states, and financial impact warnings.

This is a foundation layer only. It does not process payments, store cards, invent exchange rates, assume taxes, or fabricate provider-backed financial facts.

## Files changed

- `js/engine/finance/financial-intelligence-engine.js`
- `tests/global-financial-engine.test.mjs`
- `.env.example`
- `functions/api/v1/_lib/providers/provider-contracts.js`
- `js/engine/providers/live/provider-registry.js`
- `style.css`
- `results.css`
- `js/pages/home-page.js`
- `settings.js`

## Currencies supported

The architecture accepts valid ISO-4217-style three-letter currency codes through `Intl.NumberFormat`, including:

- USD
- KRW
- JPY
- EUR
- GBP
- CAD
- AUD
- CHF
- SGD
- HKD
- CNY
- TWD
- MXN
- BRL
- INR

Future ISO-4217 currencies are supported by the same formatting/validation path when the runtime supports them.

## Financial architecture

Core objects/functions:

- `moneyFromMajor`
- `moneyFromMinor`
- `formatMoney`
- `addMoney`
- `convertMoney`
- `createPriceBreakdown`
- `createMissionBudget`
- `createFinancialWarning`
- `createRefundIntelligence`
- `ExchangeRateProvider`
- `createFinancialIntelligenceEngine`

Provider truthfulness:

- A new provider type `financial` is registered.
- `exchange-rate-provider` remains `setup_required` unless credentials are configured.
- Missing exchange rates return `exchange_rates_unavailable`.
- Same-currency conversion uses rate `1` and does not require a provider.

## Price breakdown

Breakdowns support:

- Base price
- Taxes
- Service fee
- Provider fee
- Booking fee
- Estimated total
- Currency
- Timestamp

Taxes and fees are only calculated when supplied explicitly as a rate or amount. Unknown lines are preserved and make the breakdown a `partial_estimate`.

## Mission budget

Budget categories:

- Flights
- Hotels
- Restaurants
- Activities
- Transportation
- Shopping
- Buffer
- Emergency reserve

The engine calculates:

- Estimated spent
- Total budget
- Remaining budget
- Daily average
- Optional home-currency estimate when exchange rates are provider-backed

## Known limitations

- No live exchange-rate provider is connected by default.
- No tax jurisdiction database is connected.
- VAT/GST/sales-tax rules are modeled as explicit inputs only until a real tax provider is configured.
- Price history is future-ready but not persisted yet.
- Expense reports, corporate reimbursement, business invoices, and payment rails require future provider integrations.

## Future payment integrations

Prepared integration points for:

- Toss Payments
- Kakao Pay
- Naver Pay
- Apple Pay
- Google Pay
- Airline/hotel/restaurant provider payments
- Enterprise invoice and expense providers

No payment provider is treated as live unless valid credentials, authentication, provider response, and normalized evidence exist.

## Quality notes

- No fabricated exchange rates.
- No tax assumptions.
- Mixed currencies cannot be summed without conversion.
- Currency minor units are respected through `Intl`.
- Refund status requires provider evidence, otherwise it remains `provider_unknown`.
