import test from "node:test";
import assert from "node:assert/strict";
import {
  BUDGET_CATEGORIES,
  FINANCIAL_DATA_STATES,
  REFUND_STATES,
  ExchangeRateProvider,
  addMoney,
  convertMoney,
  createExchangeRateProviderResult,
  createFinancialIntelligenceEngine,
  createFinancialWarning,
  createMissionBudget,
  createPriceBreakdown,
  createRefundIntelligence,
  formatMoney,
  isIsoCurrency,
  majorAmount,
  moneyFromMajor
} from "../js/engine/finance/financial-intelligence-engine.js";

test("supports ISO-4217 currency validation and localized formatting", () => {
  assert.equal(isIsoCurrency("USD"), true);
  assert.equal(isIsoCurrency("KRW"), true);
  assert.equal(isIsoCurrency("JPY"), true);
  assert.equal(isIsoCurrency("XYZ"), true);
  assert.equal(isIsoCurrency("USDT"), false);
  assert.match(formatMoney(moneyFromMajor(18400, "JPY"), { locale: "ja-JP" }), /18,400/);
  assert.match(formatMoney(moneyFromMajor(124.4, "USD"), { locale: "en-US" }), /\$124\.40/);
});

test("price breakdown calculates explicit taxes and fees only", () => {
  const breakdown = createPriceBreakdown({
    basePrice: moneyFromMajor(100, "USD"),
    taxes: [{ label: "Sales tax", rate: 0.0825 }],
    serviceFee: { amount: moneyFromMajor(4.5, "USD") },
    providerFee: { label: "Provider fee" }
  });
  assert.equal(breakdown.currency, "USD");
  assert.equal(majorAmount(breakdown.estimatedTotal), 112.75);
  assert.equal(breakdown.dataState, FINANCIAL_DATA_STATES.PARTIAL_ESTIMATE);
  assert.equal(breakdown.taxesIncluded, "unknown_unless_provider_evidence");
});

test("mixed currencies cannot be added without exchange-rate conversion", () => {
  assert.throws(() => addMoney(moneyFromMajor(1000, "KRW"), moneyFromMajor(10, "USD")), /mixed currencies/i);
  const rates = createExchangeRateProviderResult({
    provider: "test-rates",
    status: FINANCIAL_DATA_STATES.VERIFIED_LIVE,
    rates: [{ from: "JPY", to: "USD", rate: 0.0067 }]
  });
  const converted = convertMoney(moneyFromMajor(18400, "JPY"), "USD", rates);
  assert.equal(converted.ok, true);
  assert.equal(converted.money.currency, "USD");
  assert.ok(majorAmount(converted.money) > 123);
});

test("exchange-rate failure is truthful and never invented", () => {
  const engine = createFinancialIntelligenceEngine({
    exchangeRateProvider: new ExchangeRateProvider({ providerId: "not-configured" })
  });
  const unavailable = convertMoney(moneyFromMajor(100, "EUR"), "KRW", null);
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.dataState, FINANCIAL_DATA_STATES.EXCHANGE_RATES_UNAVAILABLE);
  const sameCurrency = convertMoney(moneyFromMajor(100, "EUR"), "EUR", null);
  assert.equal(sameCurrency.ok, true);
  assert.equal(sameCurrency.rate, 1);
  assert.equal(engine.version.includes("global-financial-engine"), true);
});

test("mission budget tracks required categories and remaining budget", () => {
  const budget = createMissionBudget({
    currency: "KRW",
    totalBudget: 3000000,
    days: 5,
    categories: {
      flights: 900000,
      hotels: 800000,
      restaurants: 400000,
      transportation: 120000,
      buffer: 200000
    }
  });
  assert.deepEqual(budget.categories.map((row) => row.category), BUDGET_CATEGORIES);
  assert.equal(majorAmount(budget.estimatedSpent), 2420000);
  assert.equal(majorAmount(budget.remainingBudget), 580000);
  assert.equal(majorAmount(budget.dailyAverage), 484000);
});

test("financial warnings compare comparable totals", () => {
  const warning = createFinancialWarning({
    previousTotal: moneyFromMajor(500, "USD"),
    nextTotal: moneyFromMajor(572, "USD"),
    label: "Changing this hotel"
  });
  assert.equal(warning.type, "cost_increase");
  assert.match(warning.message, /\$72\.00/);
  assert.equal(createFinancialWarning({ previousTotal: moneyFromMajor(1, "USD"), nextTotal: moneyFromMajor(1, "KRW") }).type, "unavailable");
});

test("refund intelligence only displays provider-backed refund facts", () => {
  const unknown = createRefundIntelligence({ state: REFUND_STATES.REFUNDABLE });
  assert.equal(unknown.state, REFUND_STATES.PROVIDER_UNKNOWN);
  const backed = createRefundIntelligence({
    state: REFUND_STATES.PARTIALLY_REFUNDABLE,
    evidence: { provider: "hotel-provider", policyId: "policy-1" },
    amount: moneyFromMajor(60, "USD")
  });
  assert.equal(backed.state, REFUND_STATES.PARTIALLY_REFUNDABLE);
  assert.equal(backed.amount.currency, "USD");
});
