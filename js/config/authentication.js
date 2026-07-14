export const authenticationEnabled = false;
export const authenticationReadiness = Object.freeze({
  secureBackendConfigured: false,
  emailPasswordConfigured: false,
  googleConfigured: false,
  appleConfigured: false,
  kakaoConfigured: false,
  privacyReviewComplete: false
});
export const canAuthenticate = () => authenticationEnabled && Object.values(authenticationReadiness).every(Boolean);
