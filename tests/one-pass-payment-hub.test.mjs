import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const codeOf = fn => { try { fn(); } catch (error) { return error.code; } return "none"; };
const rejectCodeOf = async fn => { try { await fn(); } catch (error) { return error.code; } return "none"; };
import { validatePaymentMethodReference, publicPaymentMethod, paymentProviderCatalog, transitionPaymentState, createExactPaymentApprovalPackage, safePaymentMissionContext, verifyPaymentWebhook, assertNoRawPaymentRequest, assertPaymentIdempotencyReplay, dedupePaymentEvent, MockTossProvider } from "../functions/api/v1/_lib/one-pass-payments.js";

test("Payment Hub stores masked provider references only", () => {
  const ref = validatePaymentMethodReference({ method_category: "kakao_pay", provider: "mock_kakao_pay", masked_label: "Kakao Pay · setup required", supported_currencies: ["krw", "usd"] , provider_metadata: { brand: "Kakao", country: "KR" } });
  assert.equal(ref.provider_reference.startsWith("not-connected:"), true);
  assert.equal(ref.masked_label, "Kakao Pay · setup required");
  assert.deepEqual(ref.supported_currencies, ["KRW", "USD"]);
  assert.equal(ref.provider_metadata.country, "KR");
});

test("Payment Hub rejects client users and raw financial fields", () => {
  assert.equal(codeOf(() => validatePaymentMethodReference({ user_id: "user-b", method_category: "kakao_pay", masked_label: "Kakao" })), "client_user_id_rejected");
  assert.equal(codeOf(() => validatePaymentMethodReference({ method_category: "kakao_pay", masked_label: "Kakao", card_number: "4111111111111111" })), "raw_payment_secret_rejected");
  assert.equal(codeOf(() => validatePaymentMethodReference({ method_category: "kakao_pay", masked_label: "4111111111111111" })), "unsafe_payment_label_rejected");
  assert.equal(codeOf(() => validatePaymentMethodReference({ method_category: "kakao_pay", masked_label: "Kakao", provider_metadata: { cvv: "123" } })), "raw_payment_secret_rejected");
});

test("Public payment method output excludes provider references and marks unavailable states", () => {
  const publicRef = publicPaymentMethod({ id: "p1", provider: "mock", provider_reference: "not-connected:secret", masked_label: "Mock · ••••", method_category: "tokenized_card_reference", status: "connected", revoked_at: new Date().toISOString() });
  assert.equal(publicRef.provider_reference, undefined);
  assert.equal(publicRef.unavailable, true);
  assert.equal(publicRef.status, "revoked");
});

test("Payment providers are demo-only and fail closed in production", async () => {
  const provider = new MockTossProvider();
  assert.equal(provider.describe().live, false);
  assert.equal((await provider.createIntent({ production: false })).realMoney, false);
  assert.equal(await rejectCodeOf(() => provider.createIntent({ production: true })), "payment_provider_setup_required");
  assert.equal(paymentProviderCatalog({ production: true })[0].productionStatus, "setup_required");
});

test("Payment state machine rejects browser-declared success and illegal transitions", () => {
  assert.deepEqual(transitionPaymentState("APPROVED", "PAYMENT_INTENT_CREATED", { serverControlled: true }).to, "PAYMENT_INTENT_CREATED");
  assert.equal(codeOf(() => transitionPaymentState("PAYMENT_INTENT_CREATED", "CAPTURED")), "server_controlled_payment_state");
  assert.equal(codeOf(() => transitionPaymentState("DRAFT", "CAPTURED", { serverControlled: true })), "illegal_payment_transition");
  assert.equal(codeOf(() => transitionPaymentState("COMPLETED", "REFUND_REQUIRED", { serverControlled: true })), "payment_state_terminal");
});

test("Exact payment approval package binds amount, currency, method and hash", async () => {
  const method = publicPaymentMethod({ id: "pm1", provider: "mock", masked_label: "Toss · setup required", method_category: "toss_payments", status: "pending" });
  const approval = await createExactPaymentApprovalPackage({ missionId: "m1", merchant: "Hotel", product: "Reservation", amount: 100, taxes: 10, serviceFee: 2, providerFee: 3, oneFee: 1, currency: "usd", paymentMethodReferenceId: "pm1" }, { userId: "user-a", method });
  assert.equal(approval.total, 116);
  assert.equal(approval.currency, "USD");
  assert.equal(approval.paymentMethodReferenceId, "pm1");
  assert.match(approval.payloadHash, /^[a-f0-9]{64}$/);
  const changed = await createExactPaymentApprovalPackage({ missionId: "m1", merchant: "Hotel", product: "Reservation", amount: 101, currency: "usd" }, { userId: "user-a", method });
  assert.notEqual(changed.payloadHash, approval.payloadHash);
});

test("Payment mission context exposes derived signals only", () => {
  const context = safePaymentMissionContext({ methods: [publicPaymentMethod({ id: "pm1", provider: "mock", masked_label: "Mock", method_category: "kakao_pay", is_default: true })], providerCatalog: paymentProviderCatalog() });
  assert.equal(context.rawPaymentSecretsIncluded, false);
  assert.deepEqual(context.defaultPaymentCategories, ["kakao_pay"]);
  assert.doesNotMatch(JSON.stringify(context).replace("rawPaymentSecretsIncluded", "safeFlag"), /provider_reference|token|secret|card_number/i);
});

test("Payment webhook foundation verifies signatures, deduplicates by event id and excludes raw payloads", () => {
  const event = verifyPaymentWebhook({ provider: "mock", headers: { "x-one-pass-mock-signature": "mock-provider-signed" }, body: { providerEventId: "evt_1", eventType: "payment.authorized", status: "authorized" } });
  assert.equal(event.signatureVerified, true);
  assert.equal(event.providerEventId, "evt_1");
  assert.equal(codeOf(() => verifyPaymentWebhook({ provider: "mock", headers: {}, body: { providerEventId: "evt_2" } })), "payment_webhook_signature_invalid");
  assert.equal(codeOf(() => verifyPaymentWebhook({ provider: "mock", headers: { "x-one-pass-mock-signature": "mock-provider-signed" }, body: { providerEventId: "evt_3", access_token: "secret" } })), "raw_payment_secret_rejected");
});

test("Payment Hub API exposes safe endpoints and never trusts browser success", async () => {
  const api = await readFile(new URL("../functions/api/v1/one-pass/[[path]].js", import.meta.url), "utf8");
  assert.match(api, /validatePaymentMethodReference/);
  assert.match(api, /publicPaymentMethod/);
  assert.match(api, /payment-approvals/);
  assert.match(api, /payment-intents/);
  assert.match(api, /payment-webhooks/);
  assert.match(api, /flags\.production/);
  assert.match(api, /realMoney:false/);
  assert.doesNotMatch(api, /input\.user_id|input\.userId|card_number|cvv|provider_password/);
});

test("Payment Hub migration uses RLS, safe references, idempotency and no privilege escalation", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202608020004_one_pass_payment_hub.sql", import.meta.url), "utf8");
  assert.match(sql, /payment_method_references_safe_reference_chk/);
  assert.match(sql, /create table if not exists public\.payment_transactions/);
  assert.match(sql, /create table if not exists public\.payment_events/);
  assert.match(sql, /create table if not exists public\.payment_idempotency_records/);
  assert.match(sql, /unique\(user_id,idempotency_key\)/);
  assert.match(sql, /alter table public\.payment_transactions enable row level security/);
  assert.match(sql, /revoke insert,update,delete on public\.payment_transactions,public\.payment_events,public\.payment_idempotency_records from authenticated/);
  assert.doesNotMatch(sql, /security definer|drop table|truncate|raw_payload|card_number|cvv|provider_password/i);
});

test("Payment Hub UI is localized and has no raw card form", async () => {
  const html = await readFile(new URL("../one-pass.html", import.meta.url), "utf8");
  const js = await readFile(new URL("../one-pass.js", import.meta.url), "utf8");
  assert.match(html, /id="payment"/);
  assert.match(js, /Payment Hub/);
  assert.match(js, /결제 허브/);
  assert.match(js, /Centro de pagos/);
  assert.doesNotMatch(html, /name=["'](?:card|card_number|cvv|cvc|pin|password|provider_password|bank_password|account_number|otp|token)["']/i);
});

test("Payment request guard rejects query and header attempts but permits normal auth headers", () => {
  const safe = new Request("https://one.example/api/v1/one-pass/payments", { headers: { Authorization: "Bearer user-session", "X-CSRF-Token": "csrf" } });
  assert.doesNotThrow(() => assertNoRawPaymentRequest(safe));
  const query = new Request("https://one.example/api/v1/one-pass/payments?card-number=4111111111111111");
  assert.equal(codeOf(() => assertNoRawPaymentRequest(query)), "raw_payment_secret_rejected");
  const header = new Request("https://one.example/api/v1/one-pass/payments", { headers: { "x-provider-secret": "secret" } });
  assert.equal(codeOf(() => assertNoRawPaymentRequest(header)), "raw_payment_secret_rejected");
});

test("Payment approval hash changes for every material payment field", async () => {
  const method = publicPaymentMethod({ id: "pm1", provider: "mock", masked_label: "Toss · setup required", method_category: "toss_payments", status: "pending" });
  const base = { missionId: "m1", merchant: "Hotel", product: "Reservation", amount: 100, taxes: 10, serviceFee: 2, providerFee: 3, oneFee: 1, currency: "USD", provider: "mock", travelerRecipient: "CEO", cancellationRefundConditions: "Refundable until Friday", paymentMethodReferenceId: "pm1" };
  const first = await createExactPaymentApprovalPackage(base, { userId: "user-a", method });
  for (const patch of [{ amount: 101 }, { currency: "KRW" }, { provider: "other" }, { taxes: 11 }, { serviceFee: 3 }, { providerFee: 4 }, { oneFee: 2 }, { travelerRecipient: "guest" }, { cancellationRefundConditions: "Non-refundable" }]) {
    const changed = await createExactPaymentApprovalPackage({ ...base, ...patch }, { userId: "user-a", method });
    assert.notEqual(changed.payloadHash, first.payloadHash, `hash changed for ${Object.keys(patch)[0]}`);
  }
  const otherMethod = publicPaymentMethod({ id: "pm2", provider: "mock", masked_label: "Kakao · setup required", method_category: "kakao_pay", status: "pending" });
  const changedMethod = await createExactPaymentApprovalPackage({ ...base, paymentMethodReferenceId: "pm2" }, { userId: "user-a", method: otherMethod });
  assert.notEqual(changedMethod.payloadHash, first.payloadHash);
});

test("Payment approval rejects unavailable method, missing approval data and raw nested fields", async () => {
  const revoked = publicPaymentMethod({ id: "pm1", provider: "mock", masked_label: "Mock", method_category: "kakao_pay", status: "revoked", revoked_at: new Date().toISOString() });
  await assert.rejects(() => createExactPaymentApprovalPackage({ amount: 100, currency: "USD" }, { userId: "user-a", method: revoked }), error => error.code === "payment_method_unavailable");
  await assert.rejects(() => createExactPaymentApprovalPackage({ amount: 100, currency: "USD", nested: [{ CVC: "123" }] }, { userId: "user-a", method: publicPaymentMethod({ id: "pm2", provider: "mock", masked_label: "Mock" }) }), error => error.code === "raw_payment_secret_rejected");
});

test("Payment idempotency detects safe replay and rejects same key with different payload", () => {
  const existing = { idempotencyKey: "same", requestHash: "a", transaction: { id: "txn1" } };
  assert.deepEqual(assertPaymentIdempotencyReplay(existing, { idempotencyKey: "same", requestHash: "a" }), { replay: true, transaction: { id: "txn1" } });
  assert.equal(codeOf(() => assertPaymentIdempotencyReplay(existing, { idempotencyKey: "same", requestHash: "b" })), "idempotency_payload_mismatch");
  assert.deepEqual(assertPaymentIdempotencyReplay(existing, { idempotencyKey: "other", requestHash: "b" }), { replay: false });
});

test("Payment webhook rejects stale and unknown events and deduplicates accepted events", () => {
  const now = Date.now();
  assert.equal(codeOf(() => verifyPaymentWebhook({ provider: "mock", headers: { "x-one-pass-mock-signature": "mock-provider-signed" }, body: { providerEventId: "evt_stale", eventType: "payment.status", timestamp: new Date(now - 10 * 60 * 1000).toISOString() }, now })), "payment_webhook_timestamp_stale");
  assert.equal(codeOf(() => verifyPaymentWebhook({ provider: "mock", headers: { "x-one-pass-mock-signature": "mock-provider-signed" }, body: { providerEventId: "evt_bad", eventType: "payment.secret" }, now })), "payment_webhook_event_unknown");
  const seen = new Set();
  const event = verifyPaymentWebhook({ provider: "mock", headers: { "x-one-pass-mock-signature": "mock-provider-signed" }, body: { providerEventId: "evt_1", eventType: "payment.status", timestamp: new Date(now).toISOString() }, now });
  assert.deepEqual(dedupePaymentEvent(event, seen).duplicate, false);
  assert.deepEqual(dedupePaymentEvent(event, seen).duplicate, true);
});

test("Payment Hub changes preserve travel profile and loyalty route bodies", async () => {
  const api = await readFile(new URL("../functions/api/v1/one-pass/[[path]].js", import.meta.url), "utf8");
  assert.match(api, /body:\{\.\.\.data,user_id:user\.id\},prefer:"resolution=merge-duplicates,return=representation"\}\);await audit\(cfg,user,"travel_profile_saved"/);
  assert.match(api, /trustedDb\(cfg,"loyalty_accounts",\{body:\{\.\.\.data,user_id:user\.id\},prefer:"resolution=merge-duplicates,return=representation"\}\)/);
});