export const authenticationEnabled = true;
export const authenticationReadiness = Object.freeze({
  secureBackendConfigured: "environment_required",
  emailPasswordConfigured: "supabase_auth_required",
  googleConfigured: "oauth_provider_required",
  appleConfigured: "oauth_provider_required",
  kakaoConfigured: false,
  privacyReviewComplete: "required_before_production"
});
export const canAuthenticate = () => false;
export const authenticationStatus = Object.freeze({
  implementation: "real_auth_ready",
  provider: "supabase_auth",
  passwordStorage: "external_provider_hash_only",
  sessionStorage: "secure_http_only_cookies",
  productionState: "setup_required"
});
