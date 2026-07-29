export const GLOBAL_FINANCIAL_ENGINE_VERSION = "20260730-global-financial-engine-v1";

export const FINANCIAL_DATA_STATES = Object.freeze({
  VERIFIED_LIVE: "verified_live",
  SETUP_REQUIRED: "setup_required",
  EXCHANGE_RATES_UNAVAILABLE: "exchange_rates_unavailable",
  PARTIAL_ESTIMATE: "partial_estimate",
  ESTIMATED_FROM_INPUTS: "estimated_from_inputs",
  UNAVAILABLE: "unavailable"
});

export const BUDGET_CATEGORIES = Object.freeze([
  "flights",
  "hotels",
  "restaurants",
  "activities",
  "transportation",
  "shopping",
  "buffer",
  "emergencyReserve"
]);

export const REFUND_STATES = Object.freeze({
  REFUNDABLE: "refundable",
  PARTIALLY_REFUNDABLE: "partially_refundable",
  NON_REFUNDABLE: "non_refundable",
  PROVIDER_UNKNOWN: "provider_unknown"
});

const ISO_4217_PATTERN = /^[A-Z]{3}$/;
const round = (value) => Math.round(Number(value || 0));
const cleanCurrency = (currency) => String(currency || "").trim().toUpperCase();
const nowIso = () => new Date().toISOString();

export function isIsoCurrency(currency) {
  const code = cleanCurrency(currency);
  if (!ISO_4217_PATTERN.test(code)) return false;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code }).format(1);
    return true;
  } catch {
    return false;
  }
}

export function currencyMinorUnit(currency) {
  const code = cleanCurrency(currency);
  try {
    const parts = new Intl.NumberFormat("en", { style: "currency", currency: code }).resolvedOptions();
    return Number(parts.maximumFractionDigits ?? 2);
  } catch {
    return 2;
  }
}

export function moneyFromMajor(amount, currency, { source = "input", timestamp = nowIso() } = {}) {
  const code = cleanCurrency(currency);
  if (!isIsoCurrency(code)) throw new TypeError(`Unsupported ISO-4217 currency: ${currency}`);
  const scale = 10 ** currencyMinorUnit(code);
  return Object.freeze({
    currency: code,
    minor: round(Number(amount) * scale),
    source,
    timestamp
  });
}

export function moneyFromMinor(minor, currency, { source = "input", timestamp = nowIso() } = {}) {
  const code = cleanCurrency(currency);
  if (!isIsoCurrency(code)) throw new TypeError(`Unsupported ISO-4217 currency: ${currency}`);
  return Object.freeze({
    currency: code,
    minor: round(minor),
    source,
    timestamp
  });
}

export function majorAmount(money) {
  if (!money || !isIsoCurrency(money.currency)) return null;
  return Number(money.minor || 0) / (10 ** currencyMinorUnit(money.currency));
}

export function formatMoney(money, { locale = "en", fallback = "—" } = {}) {
  const value = majorAmount(money);
  if (value === null) return fallback;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: cleanCurrency(money.currency),
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: currencyMinorUnit(money.currency)
  }).format(value);
}

export function addMoney(...items) {
  const values = items.filter(Boolean);
  if (!values.length) return null;
  const currency = values[0].currency;
  if (!values.every((item) => item.currency === currency)) {
    throw new TypeError("Cannot add mixed currencies without an exchange-rate conversion.");
  }
  return moneyFromMinor(values.reduce((sum, item) => sum + round(item.minor), 0), currency, {
    source: values.map((item) => item.source).filter(Boolean).join("+") || "calculated",
    timestamp: nowIso()
  });
}

export function createExchangeRateProviderResult({ provider = "unconfigured", rates = [], status = FINANCIAL_DATA_STATES.SETUP_REQUIRED, retrievedAt = nowIso(), evidence = null } = {}) {
  const normalizedRates = Array.isArray(rates) ? rates.map((rate) => ({
    from: cleanCurrency(rate.from),
    to: cleanCurrency(rate.to),
    rate: Number(rate.rate),
    retrievedAt: rate.retrievedAt || retrievedAt,
    provider: rate.provider || provider
  })).filter((rate) => isIsoCurrency(rate.from) && isIsoCurrency(rate.to) && Number.isFinite(rate.rate) && rate.rate > 0) : [];
  return Object.freeze({
    ok: status === FINANCIAL_DATA_STATES.VERIFIED_LIVE && normalizedRates.length > 0,
    provider,
    dataState: normalizedRates.length ? status : FINANCIAL_DATA_STATES.EXCHANGE_RATES_UNAVAILABLE,
    rates: Object.freeze(normalizedRates),
    evidence: evidence || (normalizedRates.length ? { provider, retrievedAt } : null),
    retrievedAt
  });
}

export class ExchangeRateProvider {
  constructor({ providerId = "exchange-rate-provider", enabled = false, fetchRates = null } = {}) {
    this.providerId = providerId;
    this.enabled = Boolean(enabled);
    this.fetchRates = fetchRates;
  }

  async getRates(request = {}) {
    if (!this.enabled || typeof this.fetchRates !== "function") {
      return createExchangeRateProviderResult({
        provider: this.providerId,
        status: FINANCIAL_DATA_STATES.SETUP_REQUIRED,
        evidence: null
      });
    }
    const result = await this.fetchRates(request);
    return createExchangeRateProviderResult({
      provider: this.providerId,
      rates: result?.rates || [],
      status: FINANCIAL_DATA_STATES.VERIFIED_LIVE,
      evidence: result?.evidence,
      retrievedAt: result?.retrievedAt || nowIso()
    });
  }
}

export function convertMoney(money, targetCurrency, exchangeRatesResult) {
  const target = cleanCurrency(targetCurrency);
  if (!money || !isIsoCurrency(money.currency) || !isIsoCurrency(target)) {
    return Object.freeze({
      ok: false,
      dataState: FINANCIAL_DATA_STATES.UNAVAILABLE,
      message: "Currency conversion unavailable."
    });
  }
  if (money.currency === target) {
    return Object.freeze({
      ok: true,
      dataState: FINANCIAL_DATA_STATES.ESTIMATED_FROM_INPUTS,
      money,
      rate: 1,
      evidence: { provider: "same_currency", retrievedAt: money.timestamp }
    });
  }
  const rate = (exchangeRatesResult?.rates || []).find((item) => item.from === money.currency && item.to === target);
  if (!rate) {
    return Object.freeze({
      ok: false,
      dataState: FINANCIAL_DATA_STATES.EXCHANGE_RATES_UNAVAILABLE,
      message: "Exchange rates unavailable.",
      from: money.currency,
      to: target
    });
  }
  return Object.freeze({
    ok: true,
    dataState: exchangeRatesResult.dataState,
    money: moneyFromMajor(majorAmount(money) * rate.rate, target, { source: `exchange:${rate.provider}`, timestamp: rate.retrievedAt }),
    rate: rate.rate,
    evidence: { provider: rate.provider, retrievedAt: rate.retrievedAt, from: rate.from, to: rate.to }
  });
}

export function createPriceBreakdown({
  basePrice,
  taxes = [],
  serviceFee = null,
  providerFee = null,
  bookingFee = null,
  currency = basePrice?.currency,
  timestamp = nowIso()
} = {}) {
  const code = cleanCurrency(currency);
  if (!basePrice || !isIsoCurrency(code) || basePrice.currency !== code) throw new TypeError("Base price with valid currency is required.");
  const normalizeLine = (line, type) => {
    if (!line) return null;
    if (line.amount) return { type, label: line.label || type, amount: line.amount, evidence: line.evidence || null };
    if (Number.isFinite(Number(line.rate))) {
      return {
        type,
        label: line.label || type,
        amount: moneyFromMinor(round(basePrice.minor * Number(line.rate)), code, { source: `${type}:rate`, timestamp }),
        rate: Number(line.rate),
        evidence: line.evidence || null
      };
    }
    return { type, label: line.label || type, amount: null, unknown: true, evidence: line.evidence || null };
  };
  const lines = [
    { type: "base", label: "Base price", amount: basePrice, evidence: basePrice.evidence || null },
    ...taxes.map((tax) => normalizeLine(tax, "tax")),
    normalizeLine(serviceFee, "service_fee"),
    normalizeLine(providerFee, "provider_fee"),
    normalizeLine(bookingFee, "booking_fee")
  ].filter(Boolean);
  const known = lines.filter((line) => line.amount).map((line) => line.amount);
  const hasUnknown = lines.some((line) => line.unknown);
  return Object.freeze({
    currency: code,
    lines: Object.freeze(lines),
    estimatedTotal: addMoney(...known),
    dataState: hasUnknown ? FINANCIAL_DATA_STATES.PARTIAL_ESTIMATE : FINANCIAL_DATA_STATES.ESTIMATED_FROM_INPUTS,
    taxesIncluded: "unknown_unless_provider_evidence",
    timestamp
  });
}

export function createMissionBudget({ currency, categories = {}, totalBudget = null, days = null, exchangeRates = null, homeCurrency = null, locale = "en" } = {}) {
  const code = cleanCurrency(currency);
  if (!isIsoCurrency(code)) throw new TypeError("Mission budget currency must be ISO-4217.");
  const rows = BUDGET_CATEGORIES.map((category) => {
    const value = categories[category];
    const money = value?.currency ? value : Number.isFinite(Number(value)) ? moneyFromMajor(Number(value), code, { source: `budget:${category}` }) : null;
    return Object.freeze({ category, money, formatted: money ? formatMoney(money, { locale }) : null });
  });
  const spent = addMoney(...rows.map((row) => row.money).filter(Boolean)) || moneyFromMinor(0, code);
  const budget = totalBudget?.currency ? totalBudget : Number.isFinite(Number(totalBudget)) ? moneyFromMajor(Number(totalBudget), code, { source: "mission_budget" }) : null;
  const remaining = budget ? moneyFromMinor(budget.minor - spent.minor, code, { source: "budget_remaining" }) : null;
  const dailyAverage = Number(days) > 0 ? moneyFromMinor(round(spent.minor / Number(days)), code, { source: "daily_average" }) : null;
  const home = homeCurrency ? convertMoney(spent, homeCurrency, exchangeRates) : null;
  return Object.freeze({
    currency: code,
    categories: Object.freeze(rows),
    estimatedSpent: spent,
    totalBudget: budget,
    remainingBudget: remaining,
    dailyAverage,
    homeCurrencyEstimate: home,
    exchangeRateState: home ? home.dataState : null,
    formatted: Object.freeze({
      estimatedSpent: formatMoney(spent, { locale }),
      totalBudget: budget ? formatMoney(budget, { locale }) : null,
      remainingBudget: remaining ? formatMoney(remaining, { locale }) : null,
      dailyAverage: dailyAverage ? formatMoney(dailyAverage, { locale }) : null
    })
  });
}

export function createFinancialWarning({ previousTotal, nextTotal, label = "Selection", locale = "en" } = {}) {
  if (!previousTotal || !nextTotal || previousTotal.currency !== nextTotal.currency) {
    return Object.freeze({ type: "unavailable", message: "Financial warning unavailable without comparable totals." });
  }
  const delta = nextTotal.minor - previousTotal.minor;
  if (delta === 0) return Object.freeze({ type: "no_change", delta: moneyFromMinor(0, nextTotal.currency), message: "No budget change." });
  const formatted = formatMoney(moneyFromMinor(Math.abs(delta), nextTotal.currency), { locale });
  return Object.freeze({
    type: delta > 0 ? "cost_increase" : "cost_saving",
    delta: moneyFromMinor(delta, nextTotal.currency),
    message: delta > 0 ? `${label} increases the estimated total by ${formatted}.` : `${label} saves approximately ${formatted}.`
  });
}

export function createRefundIntelligence({ state = REFUND_STATES.PROVIDER_UNKNOWN, evidence = null, amount = null, deadline = null } = {}) {
  const safeState = Object.values(REFUND_STATES).includes(state) && evidence ? state : REFUND_STATES.PROVIDER_UNKNOWN;
  return Object.freeze({
    state: safeState,
    amount: evidence && amount ? amount : null,
    deadline: evidence ? deadline : null,
    evidence: evidence || null
  });
}

export function createFinancialIntelligenceEngine({ exchangeRateProvider = new ExchangeRateProvider(), locale = "en" } = {}) {
  return Object.freeze({
    version: GLOBAL_FINANCIAL_ENGINE_VERSION,
    async getExchangeRates(request) {
      return exchangeRateProvider.getRates(request);
    },
    format(money, options = {}) {
      return formatMoney(money, { locale, ...options });
    },
    createBreakdown: createPriceBreakdown,
    createBudget: (input) => createMissionBudget({ locale, ...input }),
    convert: convertMoney,
    warning: (input) => createFinancialWarning({ locale, ...input }),
    refund: createRefundIntelligence
  });
}
