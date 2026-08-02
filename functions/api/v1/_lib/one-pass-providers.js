import { ApiError } from "./http.js";
import { payloadHash } from "./approval.js";

export const PROVIDER_MODE = Object.freeze({ DEMO: "demo", HANDOFF: "handoff", LIVE: "live" });
export const CONNECTION_STATES = Object.freeze(["NOT_CONNECTED", "AUTHORIZATION_PREPARED", "AUTHORIZATION_PENDING", "CALLBACK_RECEIVED", "TOKEN_VERIFICATION_REQUIRED", "CONNECTED", "REAUTH_REQUIRED", "EXPIRED", "REVOKE_PENDING", "REVOKED", "FAILED"]);
export const HANDOFF_STATES = Object.freeze(["DRAFT", "PREPARED", "OPENED", "RETURNED", "AWAITING_CONFIRMATION", "CONFIRMED", "FAILED", "EXPIRED", "CANCELLED"]);
const CONNECTION_TRANSITIONS = Object.freeze({
  NOT_CONNECTED: ["AUTHORIZATION_PREPARED", "FAILED"],
  AUTHORIZATION_PREPARED: ["AUTHORIZATION_PENDING", "EXPIRED", "FAILED", "REVOKED"],
  AUTHORIZATION_PENDING: ["CALLBACK_RECEIVED", "EXPIRED", "FAILED", "REVOKED"],
  CALLBACK_RECEIVED: ["TOKEN_VERIFICATION_REQUIRED", "FAILED", "EXPIRED"],
  TOKEN_VERIFICATION_REQUIRED: ["CONNECTED", "FAILED", "EXPIRED"],
  CONNECTED: ["REAUTH_REQUIRED", "EXPIRED", "REVOKE_PENDING", "REVOKED"],
  REAUTH_REQUIRED: ["AUTHORIZATION_PREPARED", "REVOKE_PENDING", "REVOKED", "EXPIRED"],
  EXPIRED: ["AUTHORIZATION_PREPARED", "REVOKED"],
  REVOKE_PENDING: ["REVOKED", "FAILED"],
  REVOKED: [],
  FAILED: ["AUTHORIZATION_PREPARED", "REVOKED"]
});
const HANDOFF_TRANSITIONS = Object.freeze({
  DRAFT: ["PREPARED", "CANCELLED"],
  PREPARED: ["OPENED", "EXPIRED", "CANCELLED"],
  OPENED: ["RETURNED", "AWAITING_CONFIRMATION", "FAILED", "EXPIRED", "CANCELLED"],
  RETURNED: ["AWAITING_CONFIRMATION", "FAILED", "EXPIRED", "CANCELLED"],
  AWAITING_CONFIRMATION: ["CONFIRMED", "FAILED", "EXPIRED", "CANCELLED"],
  CONFIRMED: [],
  FAILED: ["PREPARED", "CANCELLED"],
  EXPIRED: [],
  CANCELLED: []
});
const TOKEN_PATTERNS = [/access[_-]?token/i, /refresh[_-]?token/i, /id[_-]?token/i, /authorization[_-]?code/i, /client[_-]?secret/i, /provider[_-]?secret/i, /session[_-]?cookie/i, /password/i, /otp/i, /passport/i, /payment[_-]?token/i, /loyalty[_-]?number/i];
const SAFE_METADATA_KEYS = new Set(["locale", "country", "region", "accountHint", "device", "demo", "partnerRequired", "handoffReason", "note"]);
const SAFE_SCOPES = new Set(["openid", "profile", "email", "identity.read", "payment.capability", "travel.profile.read", "booking.handoff", "loyalty.reference.read"]);
const STATUS = Object.freeze({ INFORMATIONAL: "informational_only", HANDOFF: "handoff_only", PARTNER: "partner_application_required", DEVELOPMENT: "development_adapter", CONFIGURED: "configured", VERIFIED: "verified", REVOKED: "revoked", UNAVAILABLE: "unavailable", SETUP_REQUIRED: "setup_required" });

const providerEntries = [
  { id: "google", displayName: "Google", category: "identity_login", connectionMethod: "OIDC / OAuth 2.0", oauthSupported: true, officialPartnerApiRequired: false, secureHandoffSupported: true, readCapability: true, bookingCapability: false, paymentCapability: false, revocationCapability: true, testDemoAvailability: "development_adapter", productionConfigurationStatus: STATUS.SETUP_REQUIRED, requiredBusinessPartnerApproval: false, dataScopes: ["openid", "profile", "email"], localization: ["en", "ko", "es"], allowedDomains: ["accounts.google.com"], documentationStatusNotes: "Requires configured Google OAuth client and exact redirect URI allowlist." },
  { id: "kakao", displayName: "Kakao", category: "identity_login", connectionMethod: "OAuth 2.0 / secure app handoff", oauthSupported: true, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: true, bookingCapability: false, paymentCapability: false, revocationCapability: true, testDemoAvailability: "development_adapter", productionConfigurationStatus: STATUS.SETUP_REQUIRED, requiredBusinessPartnerApproval: true, dataScopes: ["profile", "email"], localization: ["ko", "en"], allowedDomains: ["kauth.kakao.com", "accounts.kakao.com"], documentationStatusNotes: "Production Kakao app credentials and review are required." },
  { id: "apple", displayName: "Apple", category: "identity_login", connectionMethod: "Sign in with Apple / device handoff", oauthSupported: true, officialPartnerApiRequired: false, secureHandoffSupported: true, readCapability: true, bookingCapability: false, paymentCapability: false, revocationCapability: true, testDemoAvailability: "development_adapter", productionConfigurationStatus: STATUS.SETUP_REQUIRED, requiredBusinessPartnerApproval: false, dataScopes: ["openid", "profile", "email"], localization: ["en", "ko", "es"], allowedDomains: ["appleid.apple.com"], documentationStatusNotes: "Requires Apple developer configuration and verified return URLs." },
  { id: "email_auth", displayName: "Email account authentication", category: "identity_login", connectionMethod: "Kastiz account session", oauthSupported: false, officialPartnerApiRequired: false, secureHandoffSupported: false, readCapability: true, bookingCapability: false, paymentCapability: false, revocationCapability: false, testDemoAvailability: "available", productionConfigurationStatus: STATUS.CONFIGURED, requiredBusinessPartnerApproval: false, dataScopes: ["profile"], localization: ["en", "ko", "es"], allowedDomains: [], documentationStatusNotes: "Uses the existing authenticated ONE Pass session; not an external provider connection." },
  { id: "toss_payments", displayName: "Toss Payments", category: "payment", connectionMethod: "Official merchant API / provider-hosted checkout", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: true, bookingCapability: false, paymentCapability: true, revocationCapability: true, testDemoAvailability: "development_adapter", productionConfigurationStatus: STATUS.PARTNER, requiredBusinessPartnerApproval: true, dataScopes: ["payment.capability"], localization: ["ko", "en"], allowedDomains: ["pay.toss.im", "api.tosspayments.com"], documentationStatusNotes: "No live merchant credentials are configured; demo adapter must fail closed in production." },
  { id: "kakao_pay", displayName: "Kakao Pay", category: "payment", connectionMethod: "Official partner API / app-to-app handoff", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: true, bookingCapability: false, paymentCapability: true, revocationCapability: true, testDemoAvailability: "development_adapter", productionConfigurationStatus: STATUS.PARTNER, requiredBusinessPartnerApproval: true, dataScopes: ["payment.capability"], localization: ["ko", "en"], allowedDomains: ["kakaopay.com", "online-pay.kakao.com"], documentationStatusNotes: "Partner approval and merchant keys are required before any live payment." },
  { id: "apple_pay", displayName: "Apple Pay", category: "payment", connectionMethod: "Device wallet / provider-hosted checkout", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: false, bookingCapability: false, paymentCapability: true, revocationCapability: false, testDemoAvailability: "device_capability_only", productionConfigurationStatus: STATUS.PARTNER, requiredBusinessPartnerApproval: true, dataScopes: ["payment.capability"], localization: ["en", "ko", "es"], allowedDomains: ["apple.com"], documentationStatusNotes: "ONE never receives raw card data; wallet processing requires approved payment processor setup." },
  { id: "expedia_rapid", displayName: "Expedia Rapid / Hotels.com ecosystem", category: "travel_inventory_booking", connectionMethod: "Official partner API", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: true, bookingCapability: true, paymentCapability: false, revocationCapability: false, testDemoAvailability: "partner_sandbox_required", productionConfigurationStatus: STATUS.PARTNER, requiredBusinessPartnerApproval: true, dataScopes: ["booking.handoff"], localization: ["en", "ko", "es"], allowedDomains: ["expedia.com", "hotels.com"], documentationStatusNotes: "Partner application is required. No public consumer booking API is claimed." },
  { id: "amadeus", displayName: "Amadeus approved flight provider", category: "travel_inventory_booking", connectionMethod: "Official flight inventory API", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: true, bookingCapability: true, paymentCapability: false, revocationCapability: false, testDemoAvailability: "partner_sandbox_required", productionConfigurationStatus: STATUS.PARTNER, requiredBusinessPartnerApproval: true, dataScopes: ["booking.handoff"], localization: ["en", "ko", "es"], allowedDomains: ["amadeus.com"], documentationStatusNotes: "Requires approved account, credentials, and fare/booking terms." },
  { id: "booking_com", displayName: "Booking.com", category: "consumer_platform_handoff", connectionMethod: "Secure handoff only unless partner access is approved", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: false, bookingCapability: false, paymentCapability: false, revocationCapability: false, testDemoAvailability: "handoff_demo", productionConfigurationStatus: STATUS.HANDOFF, requiredBusinessPartnerApproval: true, dataScopes: ["booking.handoff"], localization: ["en", "ko", "es"], allowedDomains: ["booking.com", "www.booking.com"], documentationStatusNotes: "Handoff does not confirm booking. User/provider confirmation is required." },
  { id: "agoda", displayName: "Agoda", category: "consumer_platform_handoff", connectionMethod: "Secure handoff only unless partner access is approved", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: false, bookingCapability: false, paymentCapability: false, revocationCapability: false, testDemoAvailability: "handoff_demo", productionConfigurationStatus: STATUS.HANDOFF, requiredBusinessPartnerApproval: true, dataScopes: ["booking.handoff"], localization: ["en", "ko", "es"], allowedDomains: ["agoda.com", "www.agoda.com"], documentationStatusNotes: "Handoff-only; no fake account verification." },
  { id: "airbnb", displayName: "Airbnb", category: "consumer_platform_handoff", connectionMethod: "Secure handoff only", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: false, bookingCapability: false, paymentCapability: false, revocationCapability: false, testDemoAvailability: "handoff_demo", productionConfigurationStatus: STATUS.HANDOFF, requiredBusinessPartnerApproval: true, dataScopes: ["booking.handoff"], localization: ["en", "ko", "es"], allowedDomains: ["airbnb.com", "www.airbnb.com"], documentationStatusNotes: "User completes login/checkout on Airbnb; ONE only tracks safe handoff state." },
  { id: "airline_direct", displayName: "Airline direct site/app", category: "consumer_platform_handoff", connectionMethod: "Secure app/site handoff", oauthSupported: false, officialPartnerApiRequired: false, secureHandoffSupported: true, readCapability: false, bookingCapability: false, paymentCapability: false, revocationCapability: false, testDemoAvailability: "handoff_demo", productionConfigurationStatus: STATUS.HANDOFF, requiredBusinessPartnerApproval: false, dataScopes: ["booking.handoff"], localization: ["en", "ko", "es"], allowedDomains: ["koreanair.com", "flyasiana.com", "ana.co.jp", "jal.co.jp", "delta.com", "united.com", "aa.com"], documentationStatusNotes: "Domain allowlist is required for every airline handoff." },
  { id: "hotel_direct", displayName: "Hotel direct site/app", category: "consumer_platform_handoff", connectionMethod: "Secure site handoff", oauthSupported: false, officialPartnerApiRequired: false, secureHandoffSupported: true, readCapability: false, bookingCapability: false, paymentCapability: false, revocationCapability: false, testDemoAvailability: "handoff_demo", productionConfigurationStatus: STATUS.HANDOFF, requiredBusinessPartnerApproval: false, dataScopes: ["booking.handoff"], localization: ["en", "ko", "es"], allowedDomains: ["hilton.com", "hyatt.com", "marriott.com", "ihg.com"], documentationStatusNotes: "Return navigation is not treated as confirmation." },
  { id: "restaurant_handoff", displayName: "Restaurant platforms", category: "consumer_platform_handoff", connectionMethod: "Secure platform handoff / manual reference import", oauthSupported: false, officialPartnerApiRequired: true, secureHandoffSupported: true, readCapability: false, bookingCapability: false, paymentCapability: false, revocationCapability: false, testDemoAvailability: "handoff_demo", productionConfigurationStatus: STATUS.HANDOFF, requiredBusinessPartnerApproval: true, dataScopes: ["booking.handoff"], localization: ["en", "ko", "es"], allowedDomains: ["opentable.com", "catchtable.net", "tablecheck.com"], documentationStatusNotes: "Reservations must be confirmed by official provider response or user-imported reference." }
];

const clone = value => JSON.parse(JSON.stringify(value));
const text = (value, max = 160) => typeof value === "string" && value.trim() && value.trim().length <= max ? value.trim() : null;
const uuidRef = prefix => `${prefix}:${crypto.randomUUID()}`;
const hasUnsafeKey = value => {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, nested]) => TOKEN_PATTERNS.some(pattern => pattern.test(key)) || (nested && typeof nested === "object" && hasUnsafeKey(nested)));
};
const safeMetadata = metadata => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  if (hasUnsafeKey(metadata)) throw new ApiError(400, "provider_secret_rejected", "Provider secrets, passwords, tokens, passport data, and payment tokens are not accepted.");
  return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => SAFE_METADATA_KEYS.has(key) && ["string", "number", "boolean"].includes(typeof value)).slice(0, 12));
};
export const providerCatalog = () => clone(providerEntries).map(entry => ({ ...entry, live: entry.productionConfigurationStatus === STATUS.VERIFIED, connected: false, passwordCollectionAllowed: false }));
export const providerCatalogEntry = providerId => providerCatalog().find(entry => entry.id === providerId) || null;
export const assertProviderAllowed = providerId => {
  const entry = providerCatalogEntry(providerId);
  if (!entry) throw new ApiError(404, "provider_not_supported", "This provider is not in the ONE Pass provider catalog.");
  return entry;
};
export function assertNoProviderSecrets(value) { if (hasUnsafeKey(value)) throw new ApiError(400, "provider_secret_rejected", "Provider secrets, passwords, tokens, passport data, and payment tokens are not accepted."); }
export function assertNoProviderRequest(request) { const url = new URL(request.url); assertNoProviderSecrets(Object.fromEntries(url.searchParams.entries())); for (const key of request.headers.keys()) { if (["authorization", "cookie", "x-csrf-token", "content-type", "accept", "user-agent", "cf-ray"].includes(key.toLowerCase())) continue; if (TOKEN_PATTERNS.some(pattern => pattern.test(key))) throw new ApiError(400, "provider_secret_rejected", "Provider secrets, passwords, tokens, passport data, and payment tokens are not accepted."); } }
export function safeProviderConnection(record = {}) {
  const entry = providerCatalogEntry(record.provider_id || record.provider);
  return { id: record.id || null, provider_id: record.provider_id || record.provider || entry?.id || null, display_name: entry?.displayName || record.safe_display_name || record.provider || "Provider", provider_category: record.provider_category || entry?.category || "unknown", connection_type: record.connection_type || entry?.connectionMethod || "secure_handoff", safe_display_name: record.safe_display_name || null, scopes: Array.isArray(record.scopes) ? record.scopes.filter(scope => SAFE_SCOPES.has(scope)) : [], status: record.revoked_at ? "REVOKED" : record.status || "NOT_CONNECTED", connected_at: record.connected_at || null, last_verified_at: record.last_verified_at || null, expires_at: record.expires_at || null, revoked_at: record.revoked_at || null, production_configuration_status: entry?.productionConfigurationStatus || STATUS.UNAVAILABLE, required_business_partner_approval: Boolean(entry?.requiredBusinessPartnerApproval), oauth_supported: Boolean(entry?.oauthSupported), secure_handoff_supported: Boolean(entry?.secureHandoffSupported), token_reference_public: false, password_collection_allowed: false };
}
export function transitionConnectionState(currentState, nextState, { serverControlled = false } = {}) {
  if (!serverControlled) throw new ApiError(403, "server_controlled_connection_state", "Connection state is controlled by ONE's server.");
  if (!CONNECTION_STATES.includes(currentState) || !CONNECTION_STATES.includes(nextState)) throw new ApiError(400, "unknown_connection_state", "Unknown provider connection state.");
  if (!CONNECTION_TRANSITIONS[currentState].includes(nextState)) throw new ApiError(409, "illegal_connection_transition", "This provider connection state transition is not allowed.");
  return { from: currentState, to: nextState };
}
export function transitionHandoffState(currentState, nextState, { serverControlled = false } = {}) {
  if (!serverControlled) throw new ApiError(403, "server_controlled_handoff_state", "Provider handoff state is controlled by ONE's server.");
  if (!HANDOFF_STATES.includes(currentState) || !HANDOFF_STATES.includes(nextState)) throw new ApiError(400, "unknown_handoff_state", "Unknown provider handoff state.");
  if (!HANDOFF_TRANSITIONS[currentState].includes(nextState)) throw new ApiError(409, "illegal_handoff_transition", "This provider handoff state transition is not allowed.");
  return { from: currentState, to: nextState };
}
export async function createOAuthAuthorizationRequest(input = {}, { userId, production = false, origin = "http://localhost" } = {}) {
  assertNoProviderSecrets(input);
  if (input.user_id || input.userId) throw new ApiError(400, "client_user_id_rejected", "Provider ownership is derived from the authenticated session.");
  const entry = assertProviderAllowed(text(input.providerId || input.provider_id || input.provider, 80));
  if (!entry.oauthSupported) throw new ApiError(409, "provider_oauth_unavailable", "This provider does not have a confirmed OAuth/OIDC connection path.");
  if (production && entry.productionConfigurationStatus !== STATUS.VERIFIED) throw new ApiError(503, "provider_setup_required", "Provider OAuth is not configured and verified for production.");
  const redirectUri = validateRedirectUri(input.redirectUri, { origin, production });
  const scopes = validateScopes(input.scopes || entry.dataScopes || []);
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  return { provider: entry.id, provider_category: entry.category, connection_type: "oauth_pkce", user_id: userId, state, nonce, state_hash: await payloadHash({ state, nonce, provider: entry.id, userId, redirectUri }), code_verifier_reference: uuidRef(production ? "vault" : "demo-only"), code_challenge: codeChallenge, code_challenge_method: "S256", redirect_uri: redirectUri, scopes, status: "AUTHORIZATION_PREPARED", expires_at: expiresAt, authorization_url: `https://${entry.allowedDomains[0]}/oauth/authorize?response_type=code&client_id=setup-required&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(" "))}&state=${encodeURIComponent(state)}&nonce=${encodeURIComponent(nonce)}&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256`, demo: !production, note: production ? "Provider setup required before redirect." : "DEMO authorization URL. No provider was contacted." };
}
export function validateOAuthCallback(input = {}, stateRecord = {}, { userId, providerId, production = false } = {}) {
  assertNoProviderSecrets(input);
  if (input.user_id || input.userId) throw new ApiError(400, "client_user_id_rejected", "Provider ownership is derived from the authenticated session.");
  if (!stateRecord || stateRecord.user_id !== userId) throw new ApiError(403, "provider_state_wrong_user", "Authorization state does not belong to this user.");
  if (stateRecord.provider_id !== providerId) throw new ApiError(403, "provider_state_wrong_provider", "Authorization state does not match this provider.");
  if (stateRecord.consumed_at) return { duplicate: true, status: "CALLBACK_RECEIVED" };
  if (new Date(stateRecord.expires_at) <= new Date()) throw new ApiError(409, "provider_state_expired", "Authorization state expired.");
  if (!input.state || input.state !== stateRecord.state) throw new ApiError(403, "provider_state_invalid", "Authorization state does not match.");
  if (!text(input.code, 400)) throw new ApiError(400, "authorization_code_required", "Authorization code is required.");
  if (production) throw new ApiError(503, "provider_token_exchange_not_configured", "Production provider token exchange is not configured.");
  return { duplicate: false, status: "CALLBACK_RECEIVED", nextStatus: "TOKEN_VERIFICATION_REQUIRED", tokenReference: uuidRef("demo-only") };
}
export function createHandoffIntent(input = {}, { userId, origin = "http://localhost" } = {}) {
  assertNoProviderSecrets(input);
  if (input.user_id || input.userId) throw new ApiError(400, "client_user_id_rejected", "Provider ownership is derived from the authenticated session.");
  const entry = assertProviderAllowed(text(input.providerId || input.provider_id || input.provider, 80));
  if (!entry.secureHandoffSupported) throw new ApiError(409, "handoff_unavailable", "This provider does not support secure handoff.");
  const targetUrl = validateProviderUrl(input.targetUrl, entry);
  const returnUrl = validateRedirectUri(input.returnUrl || origin, { origin, production: false });
  const nonce = crypto.randomUUID();
  return { user_id: userId, mission_id: text(input.missionId || input.mission_id, 80), provider_id: entry.id, provider_category: entry.category, selected_option_reference: text(input.selectedOptionReference || input.selected_option_reference, 180) || uuidRef("handoff-only"), target_url: targetUrl, return_url: returnUrl, nonce, state_hash: crypto.randomUUID(), status: "PREPARED", expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), safe_summary: safeMetadata(input.safeSummary || input.safe_summary || {}), sensitive_url_parameters_included: false, completion_requires_confirmation: true, note: "Opening or returning from a provider is not a booking, payment, or account confirmation." };
}
export function validateHandoffReturn(input = {}, handoff = {}, { userId, providerId } = {}) {
  assertNoProviderSecrets(input);
  if (!handoff || handoff.user_id !== userId) throw new ApiError(403, "handoff_wrong_user", "Handoff does not belong to this user.");
  if (handoff.provider_id !== providerId) throw new ApiError(403, "handoff_wrong_provider", "Handoff provider mismatch.");
  if (handoff.consumed_at) throw new ApiError(409, "handoff_replayed", "This handoff state has already been used.");
  if (new Date(handoff.expires_at) <= new Date()) throw new ApiError(409, "handoff_expired", "Provider handoff expired.");
  if (!input.nonce || input.nonce !== handoff.nonce) throw new ApiError(403, "handoff_nonce_invalid", "Provider handoff state does not match.");
  return { status: "AWAITING_CONFIRMATION", confirmed: false };
}
export function validateConfirmationReference(input = {}) {
  assertNoProviderSecrets(input);
  const reference = text(input.confirmationReference || input.confirmation_reference, 120);
  if (!reference || !/^[a-z0-9][a-z0-9._:-]{3,118}$/i.test(reference)) throw new ApiError(400, "confirmation_reference_invalid", "Enter a safe provider confirmation or reference.");
  return { confirmation_reference: reference, status: "CONFIRMED", safe_metadata: safeMetadata(input.safeMetadata || input.safe_metadata || {}) };
}
export function safeProviderMissionContext({ connections = [], catalog = providerCatalog() } = {}) {
  return { providerSignals: catalog.map(entry => ({ provider_id: entry.id, category: entry.category, status: entry.productionConfigurationStatus, secure_handoff_supported: entry.secureHandoffSupported, partner_required: entry.requiredBusinessPartnerApproval })).slice(0, 30), connectedProviders: connections.map(safeProviderConnection).filter(connection => connection.status === "CONNECTED").map(connection => ({ provider_id: connection.provider_id, category: connection.provider_category, status: connection.status, scopes: connection.scopes })), excludedSensitiveFields: ["access_token", "refresh_token", "authorization_code", "provider_secret", "session_cookie", "passport_data", "payment_token", "oauth_state", "oauth_nonce", "full_loyalty_number"], rawProviderSecretsIncluded: false };
}
export class ProviderTokenVault {
  constructor({ production = false, configured = false } = {}) { this.production = production; this.configured = configured; }
  assertUsable() { if (this.production && !this.configured) throw new ApiError(503, "provider_token_vault_required", "Production provider token vault/KMS is not configured."); }
  async storeTokenSet(tokenSet = {}) { assertNoProviderSecrets({ wrapper: tokenSet }); this.assertUsable(); if (this.production) throw new ApiError(503, "provider_token_storage_not_configured", "Production token storage is not configured."); return { provider_token_reference: uuidRef("demo-only"), token_key_version: "development-fictional", plaintextStored: false }; }
  async retrieveForProviderCall() { this.assertUsable(); throw new ApiError(503, "provider_token_unavailable", "Provider token retrieval is disabled until a production token vault is configured."); }
  async rotateToken() { this.assertUsable(); throw new ApiError(503, "provider_token_rotation_unavailable", "Provider token rotation requires a production token vault."); }
  async revokeToken() { return { revokedLocally: true, providerRevoked: false, status: "provider_revocation_unavailable" }; }
  async deleteTokenSet() { return { deleted: true, plaintextExposed: false }; }
  getSafeMetadata(reference = {}) { return { provider_token_reference: reference.provider_token_reference ? "protected" : null, token_key_version: reference.token_key_version || null }; }
  async recordAccess() { return { recorded: true, secretsLogged: false }; }
}
export class ProviderAdapter { constructor({ id, mode = PROVIDER_MODE.HANDOFF, capabilities = [] }) { this.id = id; this.mode = mode; this.capabilities = capabilities; } describe() { const entry = providerCatalogEntry(this.id); return { id: this.id, displayName: entry?.displayName || this.id, mode: this.mode, capabilities: this.capabilities, live: this.mode === PROVIDER_MODE.LIVE, handoffRequired: this.mode === PROVIDER_MODE.HANDOFF, passwordCollectionAllowed: false }; } async execute() { throw new ApiError(409, "secure_provider_handoff_required", "Secure provider handoff required."); } }
export class MockProviderAdapter extends ProviderAdapter { constructor(config) { super({ ...config, mode: PROVIDER_MODE.DEMO }); } async execute({ approved = false, production = false } = {}) { if (production) throw new ApiError(503, "mock_provider_disabled_in_production", "Demo provider adapters are disabled in production."); if (!approved) throw new ApiError(409, "approval_required", "Exact user approval is required."); return { mode: "demo", executed: false, status: "fictional_test_result", message: "DEMO only. No provider was contacted." }; } }
export class PaymentProvider extends ProviderAdapter { async authorize() { return this.execute(...arguments); } async capture() { return this.execute(...arguments); } async void() { return this.execute(...arguments); } async refund() { return this.execute(...arguments); } }
export class IdentityVerificationProvider extends ProviderAdapter { async requestVerification() { return this.execute(...arguments); } async verifyWebhook() { return this.execute(...arguments); } async deleteProviderData() { return this.execute(...arguments); } }
export class MobileIdentityProvider extends ProviderAdapter { async requestClaims() { return this.execute(...arguments); } }
export function validateRedirectUri(uri, { origin = "http://localhost", production = false } = {}) {
  const parsed = new URL(uri || origin);
  const expected = new URL(origin);
  if (production && parsed.protocol !== "https:") throw new ApiError(400, "https_redirect_required", "Provider redirects must use HTTPS in production.");
  if (parsed.origin !== expected.origin) throw new ApiError(400, "redirect_not_allowed", "Redirect URL is not allowlisted.");
  if (parsed.username || parsed.password) throw new ApiError(400, "redirect_not_allowed", "Redirect URL is not allowlisted.");
  return parsed.toString();
}
export function validateProviderUrl(uri, entry) {
  const parsed = new URL(uri || `https://${entry.allowedDomains[0]}/`);
  if (parsed.protocol !== "https:") throw new ApiError(400, "provider_url_not_allowed", "Provider handoff must use HTTPS.");
  const host = parsed.hostname.toLowerCase();
  if (!entry.allowedDomains.some(domain => host === domain || host.endsWith(`.${domain}`))) throw new ApiError(400, "provider_url_not_allowed", "Provider handoff URL is not allowlisted.");
  for (const [key] of parsed.searchParams) if (TOKEN_PATTERNS.some(pattern => pattern.test(key))) throw new ApiError(400, "provider_secret_rejected", "Sensitive provider data must not be placed in URLs.");
  return parsed.toString();
}
export function validateScopes(scopes = []) {
  const normalized = [...new Set((Array.isArray(scopes) ? scopes : String(scopes).split(/[,\s]+/)).map(scope => String(scope).trim()).filter(Boolean))];
  if (!normalized.length) throw new ApiError(400, "scope_required", "At least one provider scope is required.");
  const excessive = normalized.filter(scope => !SAFE_SCOPES.has(scope));
  if (excessive.length) throw new ApiError(400, "scope_not_allowed", "Requested provider scope is not allowlisted.");
  return normalized;
}
async function sha256Base64Url(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
