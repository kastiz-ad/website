import { ApiError } from "../http.js";
import { fetchJsonWithTimeout, hasEnv, providerError, providerSuccess, setupRequired } from "./provider-contracts.js";

export const TOSS_REQUIRED_ENV = Object.freeze(["TOSS_CLIENT_KEY", "TOSS_SECRET_KEY"]);
const TOSS_CONFIRM_ENDPOINT = "https://api.tosspayments.com/v1/payments/confirm";
const SAFE_ORDER_ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;
const SENSITIVE_PAYMENT_PATTERN = /(cardNumber|card_number|cvv|cvc|password|otp|bankPassword|bank_password|residentRegistration|rrn|fullCard)/i;

const idempotencyMemory = new Map();

export function assertNoRawPaymentCredentials(input = {}) {
  const text = JSON.stringify(input);
  if (SENSITIVE_PAYMENT_PATTERN.test(text)) {
    throw new ApiError(400, "sensitive_payment_field_rejected", "Raw payment credentials must stay inside Toss Payments or another trusted payment surface.");
  }
}

export function createTossOrder({ missionId = "mission", amount, currency = "KRW", orderName = "KASTIZ ONE test payment", now = Date.now } = {}) {
  const numericAmount = Number(amount);
  if (!Number.isInteger(numericAmount) || numericAmount <= 0) {
    throw new ApiError(400, "invalid_amount", "A positive integer amount is required for a Toss test payment.");
  }
  const entropy = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
  const orderId = `ONE_${String(missionId).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 20) || "MISSION"}_${entropy}`.slice(0, 64);
  return {
    provider: "toss-payments-test",
    providerType: "payment",
    mode: "test",
    orderId,
    amount: numericAmount,
    currency,
    orderName,
    createdAt: new Date(now()).toISOString(),
    approvalStatus: "approval_required",
    executionStatus: "prepared",
    externalAuthenticationRequired: true,
    sensitiveInputsRequired: ["trusted_payment_surface"],
    minimumReturnedData: ["success/failure", "paymentKey", "orderId", "amount", "method", "approvedAt"]
  };
}

export async function createTossTestPaymentOrder(env = {}, request = {}) {
  if (!hasEnv(env, ["TOSS_CLIENT_KEY"]) || String(env.TOSS_MODE || "test").toLowerCase() !== "test") {
    return setupRequired("toss-payments-test", ["TOSS_CLIENT_KEY", "TOSS_MODE=test"], "Toss test client key is required before test payment UI can be prepared.");
  }
  try {
    assertNoRawPaymentCredentials(request);
    const order = createTossOrder(request);
    return providerSuccess("toss-payments-test", [order], {
      endpoint: "client_payment_widget",
      testMode: true,
      secretExposed: false
    });
  } catch (error) {
    return providerError("toss-payments-test", error);
  }
}

export async function confirmTossTestPayment(env = {}, request = {}) {
  if (!hasEnv(env, TOSS_REQUIRED_ENV) || String(env.TOSS_MODE || "test").toLowerCase() !== "test") {
    return setupRequired("toss-payments-test", [...TOSS_REQUIRED_ENV, "TOSS_MODE=test"], "Toss test secret and client keys are required before server confirmation can run.");
  }
  try {
    assertNoRawPaymentCredentials(request);
    const { paymentKey, orderId, amount } = request;
    if (!paymentKey || typeof paymentKey !== "string") throw new ApiError(400, "missing_payment_key", "paymentKey is required.");
    if (!SAFE_ORDER_ID_PATTERN.test(String(orderId || ""))) throw new ApiError(400, "invalid_order_id", "orderId must be 6–64 characters using letters, numbers, hyphen, or underscore.");
    if (!Number.isInteger(Number(amount)) || Number(amount) <= 0) throw new ApiError(400, "invalid_amount", "A positive integer amount is required.");
    const idempotencyKey = `toss:${orderId}:${amount}`;
    if (idempotencyMemory.has(idempotencyKey)) {
      return providerSuccess("toss-payments-test", [idempotencyMemory.get(idempotencyKey)], {
        endpoint: "payments/confirm",
        idempotencyKey,
        duplicatePrevented: true,
        testMode: true
      });
    }
    const authorization = typeof btoa === "function"
      ? btoa(`${env.TOSS_SECRET_KEY}:`)
      : Buffer.from(`${env.TOSS_SECRET_KEY}:`).toString("base64");
    const payload = await fetchJsonWithTimeout(TOSS_CONFIRM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authorization}`,
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) })
    }, { timeoutMs: Number(env.TOSS_PROVIDER_TIMEOUT_MS || 10000) });
    const minimumReceipt = {
      provider: "toss-payments-test",
      paymentKey: payload.paymentKey || paymentKey,
      orderId: payload.orderId || orderId,
      amount: payload.totalAmount || Number(amount),
      method: payload.method || null,
      status: payload.status || "UNKNOWN",
      approvedAt: payload.approvedAt || null,
      requestedAt: payload.requestedAt || null,
      card: payload.card?.number ? { number: payload.card.number } : undefined
    };
    if (minimumReceipt.card) delete minimumReceipt.card;
    idempotencyMemory.set(idempotencyKey, minimumReceipt);
    return providerSuccess("toss-payments-test", [minimumReceipt], {
      endpoint: "payments/confirm",
      idempotencyKey,
      testMode: true,
      minimumReturnedDataOnly: true
    });
  } catch (error) {
    return providerError("toss-payments-test", error);
  }
}

export function resetTossIdempotencyMemory() {
  idempotencyMemory.clear();
}
