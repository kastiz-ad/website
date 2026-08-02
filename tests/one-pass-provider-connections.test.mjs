import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  providerCatalog,
  assertNoProviderSecrets,
  assertNoProviderRequest,
  createOAuthAuthorizationRequest,
  validateOAuthCallback,
  createHandoffIntent,
  validateHandoffReturn,
  validateConfirmationReference,
  safeProviderConnection,
  safeProviderMissionContext,
  transitionConnectionState,
  transitionHandoffState,
  ProviderTokenVault,
  MockProviderAdapter
} from "../functions/api/v1/_lib/one-pass-providers.js";

const codeOf = fn => { try { fn(); } catch (error) { return error.code; } return "none"; };
const rejectCodeOf = async fn => { try { await fn(); } catch (error) { return error.code; } return "none"; };

test("provider catalog is explicit, truthful and forbids password collection", () => {
  const catalog = providerCatalog();
  assert.ok(catalog.length >= 12);
  const google = catalog.find(provider => provider.id === "google");
  const booking = catalog.find(provider => provider.id === "booking_com");
  assert.equal(google.oauthSupported, true);
  assert.equal(google.productionConfigurationStatus, "setup_required");
  assert.equal(booking.productionConfigurationStatus, "handoff_only");
  assert.equal(catalog.every(provider => provider.passwordCollectionAllowed === false), true);
  assert.equal(catalog.some(provider => provider.productionConfigurationStatus === "verified"), false);
});

test("provider secret guard rejects password, token, query and header leakage", () => {
  assert.equal(codeOf(() => assertNoProviderSecrets({ provider_password: "secret" })), "provider_secret_rejected");
  assert.equal(codeOf(() => assertNoProviderSecrets({ nested: { refresh_token: "secret" } })), "provider_secret_rejected");
  assert.equal(codeOf(() => assertNoProviderRequest(new Request("https://one.example/api/v1/one-pass/connections?access_token=secret"))), "provider_secret_rejected");
  assert.equal(codeOf(() => assertNoProviderRequest(new Request("https://one.example/api/v1/one-pass/connections", { headers: { "x-provider-secret": "secret" } }))), "provider_secret_rejected");
  assert.doesNotThrow(() => assertNoProviderRequest(new Request("https://one.example/api/v1/one-pass/connections", { headers: { Authorization: "Bearer session", "X-CSRF-Token": "csrf" } })));
});

test("OAuth foundation uses PKCE, server state, exact redirect and minimal scopes", async () => {
  const request = await createOAuthAuthorizationRequest({ providerId: "google", redirectUri: "https://one.example/one-pass.html", scopes: ["openid", "email"] }, { userId: "user-a", origin: "https://one.example" });
  assert.equal(request.connection_type, "oauth_pkce");
  assert.match(request.state, /^[0-9a-f-]{36}$/i);
  assert.match(request.nonce, /^[0-9a-f-]{36}$/i);
  assert.equal(request.code_challenge_method, "S256");
  assert.match(request.code_verifier_reference, /^demo-only:/);
  assert.match(request.authorization_url, /code_challenge=/);
  assert.equal(request.demo, true);
  await assert.rejects(() => createOAuthAuthorizationRequest({ providerId: "google", redirectUri: "https://evil.example/callback", scopes: ["openid"] }, { userId: "user-a", origin: "https://one.example" }), error => error.code === "redirect_not_allowed");
  await assert.rejects(() => createOAuthAuthorizationRequest({ providerId: "google", redirectUri: "https://one.example/one-pass.html", scopes: ["drive.full_access"] }, { userId: "user-a", origin: "https://one.example" }), error => error.code === "scope_not_allowed");
});

test("OAuth callback rejects wrong user, wrong provider, expired state and production token exchange", () => {
  const stateRecord = { user_id: "user-a", provider_id: "google", state: "state-1", expires_at: new Date(Date.now() + 60000).toISOString() };
  assert.equal(codeOf(() => validateOAuthCallback({ state: "state-1", code: "code" }, stateRecord, { userId: "user-b", providerId: "google" })), "provider_state_wrong_user");
  assert.equal(codeOf(() => validateOAuthCallback({ state: "state-1", code: "code" }, stateRecord, { userId: "user-a", providerId: "kakao" })), "provider_state_wrong_provider");
  assert.equal(codeOf(() => validateOAuthCallback({ state: "state-1", code: "code" }, { ...stateRecord, expires_at: new Date(Date.now() - 1).toISOString() }, { userId: "user-a", providerId: "google" })), "provider_state_expired");
  assert.equal(codeOf(() => validateOAuthCallback({ state: "state-1", code: "code" }, stateRecord, { userId: "user-a", providerId: "google", production: true })), "provider_token_exchange_not_configured");
  assert.equal(validateOAuthCallback({ state: "state-1", code: "code" }, { ...stateRecord, consumed_at: new Date().toISOString() }, { userId: "user-a", providerId: "google" }).duplicate, true);
});

test("connection and handoff state machines are server controlled", () => {
  assert.equal(codeOf(() => transitionConnectionState("NOT_CONNECTED", "CONNECTED")), "server_controlled_connection_state");
  assert.equal(codeOf(() => transitionConnectionState("NOT_CONNECTED", "CONNECTED", { serverControlled: true })), "illegal_connection_transition");
  assert.deepEqual(transitionConnectionState("AUTHORIZATION_PENDING", "CALLBACK_RECEIVED", { serverControlled: true }).to, "CALLBACK_RECEIVED");
  assert.equal(codeOf(() => transitionHandoffState("PREPARED", "CONFIRMED", { serverControlled: true })), "illegal_handoff_transition");
  assert.deepEqual(transitionHandoffState("RETURNED", "AWAITING_CONFIRMATION", { serverControlled: true }).to, "AWAITING_CONFIRMATION");
});

test("secure handoff rejects arbitrary URLs, sensitive URL params and return-as-confirmation", () => {
  const handoff = createHandoffIntent({ providerId: "booking_com", targetUrl: "https://www.booking.com/hotel/jp/demo.html", returnUrl: "https://one.example/one-pass.html", missionId: "m1", safeSummary: { demo: true, note: "safe" } }, { userId: "user-a", origin: "https://one.example" });
  assert.equal(handoff.status, "PREPARED");
  assert.equal(handoff.completion_requires_confirmation, true);
  assert.equal(handoff.sensitive_url_parameters_included, false);
  assert.equal(codeOf(() => createHandoffIntent({ providerId: "booking_com", targetUrl: "https://evil.example/", returnUrl: "https://one.example/one-pass.html" }, { userId: "user-a", origin: "https://one.example" })), "provider_url_not_allowed");
  assert.equal(codeOf(() => createHandoffIntent({ providerId: "booking_com", targetUrl: "https://booking.com/?payment_token=secret", returnUrl: "https://one.example/one-pass.html" }, { userId: "user-a", origin: "https://one.example" })), "provider_secret_rejected");
  const returned = validateHandoffReturn({ nonce: handoff.nonce }, handoff, { userId: "user-a", providerId: "booking_com" });
  assert.equal(returned.status, "AWAITING_CONFIRMATION");
  assert.equal(returned.confirmed, false);
});

test("handoff replay, wrong user/provider, expiry and confirmation reference validation fail safely", () => {
  const handoff = createHandoffIntent({ providerId: "airbnb", targetUrl: "https://www.airbnb.com/rooms/1", returnUrl: "https://one.example/one-pass.html" }, { userId: "user-a", origin: "https://one.example" });
  assert.equal(codeOf(() => validateHandoffReturn({ nonce: handoff.nonce }, handoff, { userId: "user-b", providerId: "airbnb" })), "handoff_wrong_user");
  assert.equal(codeOf(() => validateHandoffReturn({ nonce: handoff.nonce }, handoff, { userId: "user-a", providerId: "booking_com" })), "handoff_wrong_provider");
  assert.equal(codeOf(() => validateHandoffReturn({ nonce: handoff.nonce }, { ...handoff, consumed_at: new Date().toISOString() }, { userId: "user-a", providerId: "airbnb" })), "handoff_replayed");
  assert.equal(codeOf(() => validateHandoffReturn({ nonce: handoff.nonce }, { ...handoff, expires_at: new Date(Date.now() - 1).toISOString() }, { userId: "user-a", providerId: "airbnb" })), "handoff_expired");
  assert.equal(codeOf(() => validateConfirmationReference({ confirmationReference: "a" })), "confirmation_reference_invalid");
  assert.equal(validateConfirmationReference({ confirmationReference: "BK-1234-safe" }).status, "CONFIRMED");
});

test("token vault never stores real tokens in this checkpoint and fails closed in production", async () => {
  assert.equal(await rejectCodeOf(() => new ProviderTokenVault({ production: true }).retrieveForProviderCall()), "provider_token_vault_required");
  assert.equal(await rejectCodeOf(() => new ProviderTokenVault({ production: false }).storeTokenSet({ access_token: "real" })), "provider_secret_rejected");
  const stored = await new ProviderTokenVault({ production: false }).storeTokenSet({ fictional: true });
  assert.match(stored.provider_token_reference, /^demo-only:/);
  assert.equal(stored.plaintextStored, false);
});

test("safe connection and mission context exclude token references and AI-sensitive fields", () => {
  const safe = safeProviderConnection({ id: "c1", provider_id: "google", provider_token_reference: "demo-only:secret", scopes: ["openid", "drive.full_access"], status: "CONNECTED" });
  assert.equal(safe.token_reference_public, false);
  assert.deepEqual(safe.scopes, ["openid"]);
  assert.equal(JSON.stringify(safe).includes("demo-only:secret"), false);
  const context = safeProviderMissionContext({ connections: [safe] });
  assert.equal(context.rawProviderSecretsIncluded, false);
  assert.match(JSON.stringify(context.excludedSensitiveFields), /access_token/);
  assert.doesNotMatch(JSON.stringify(context.connectedProviders), /refresh_token|authorization_code|provider_token_reference|demo-only:secret/i);
});

test("mock provider adapters are visibly demo and disabled in production", async () => {
  const adapter = new MockProviderAdapter({ id: "booking_com", capabilities: ["handoff"] });
  assert.equal(adapter.describe().live, false);
  assert.equal((await adapter.execute({ approved: true })).executed, false);
  assert.equal(await rejectCodeOf(() => adapter.execute({ approved: true, production: true })), "mock_provider_disabled_in_production");
});

test("provider API routes expose safe endpoints and do not trust browser success", async () => {
  const api = await readFile(new URL("../functions/api/v1/one-pass/[[path]].js", import.meta.url), "utf8");
  assert.match(api, /provider-catalog/);
  assert.match(api, /connections/);
  assert.match(api, /handoffs/);
  assert.match(api, /assertNoProviderRequest/);
  assert.match(api, /provider_verification_not_configured/);
  assert.match(api, /Return navigation is not confirmation/);
  assert.doesNotMatch(api, /input\.user_id|input\.userId|provider_password|access_token\s*:/);
});

test("provider connection migration has RLS, ownership, uniqueness and no privilege escalation", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202608030001_one_pass_provider_connections.sql", import.meta.url), "utf8");
  for (const table of ["provider_connections", "provider_authorization_states", "provider_handoff_intents", "provider_connection_events", "provider_token_references"]) assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(sql, /references auth\.users\(id\) on delete cascade/);
  assert.match(sql, /unique\(user_id, provider_id, connection_type\)/);
  assert.match(sql, /unique\(user_id, provider_id, provider_token_reference\)/);
  assert.match(sql, /revoke insert,update,delete on public\.provider_connections/);
  assert.doesNotMatch(sql, /security definer|drop table|truncate/i);
  assert.doesNotMatch(sql, /\\b(access_token|refresh_token|client_secret|provider_password)\\b\\s+(text|jsonb|varchar|char)/i);
});

test("connections UI is localized and has no password/token inputs or storage", async () => {
  const html = await readFile(new URL("../one-pass.html", import.meta.url), "utf8");
  const js = await readFile(new URL("../one-pass.js", import.meta.url), "utf8");
  assert.match(html, /id="connections"/);
  assert.match(js, /Available provider paths/);
  assert.match(js, /사용 가능한 제공업체 경로/);
  assert.match(js, /Rutas de proveedor disponibles/);
  assert.doesNotMatch(html, /name=["'](?:password|provider_password|otp|token|access_token|refresh_token|client_secret|card_number|cvv)["']/i);
  assert.doesNotMatch(js, /localStorage\.setItem\([^)]*(token|password|secret)|sessionStorage\.setItem\([^)]*(token|password|secret)/i);
});

test("ONE Pass preview fallback works without Supabase, auth, providers or passkeys", async () => {
  const js = await readFile(new URL("../one-pass.js", import.meta.url), "utf8");
  assert.match(js, /function loadDemoPreview\(error\)/);
  assert.match(js, /demoPreview: true/);
  assert.match(js, /demoTravelProfile/);
  assert.match(js, /DEMO Airline Rewards/);
  assert.match(js, /DEMO Pay · setup required/);
  assert.match(js, /demoProviderCatalog/);
  assert.match(js, /connect\.disabled = !provider\.oauthSupported \|\| passState\.demoPreview/);
  assert.match(js, /handoff\.disabled = passState\.demoPreview/);
  assert.match(js, /Preview mode: demo data only/);
  assert.match(js, /미리보기 모드: 데모 데이터만 표시됩니다/);
  assert.match(js, /Modo de vista previa: solo datos demo/);
  assert.doesNotMatch(js, /DEMO-[0-9]{8,}|411111|passport_number|provider_password\s*:/i);
});