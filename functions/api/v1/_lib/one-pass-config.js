import { ApiError } from "./http.js";
const enabled=(value)=>String(value).toLowerCase()==="true";
export function onePassConfig(env){
  const production=env.APP_ENV==="production";
  const cfg={enabled:enabled(env.ONE_PASS_ENABLED),identityVaultEnabled:enabled(env.IDENTITY_VAULT_ENABLED),passportPersistenceEnabled:enabled(env.PASSPORT_PERSISTENCE_ENABLED),passkeyReauthEnabled:enabled(env.PASSKEY_REAUTH_ENABLED),realBookingEnabled:enabled(env.REAL_BOOKING_ENABLED),realPaymentsEnabled:enabled(env.REAL_PAYMENTS_ENABLED),vaultProvider:env.IDENTITY_VAULT_PROVIDER||"disabled",rpId:env.WEBAUTHN_RP_ID||"",rpOrigin:env.WEBAUTHN_ORIGIN||"",challengeTtl:Number(env.WEBAUTHN_CHALLENGE_TTL_SECONDS||300),production};
  if(production&&(cfg.vaultProvider==="development"||cfg.passportPersistenceEnabled&&!env.PRODUCTION_VAULT_KEY_REFERENCE))throw new ApiError(503,"unsafe_vault_configuration","Production Identity Vault configuration is incomplete.");
  if((cfg.realBookingEnabled||cfg.realPaymentsEnabled)&&!cfg.passkeyReauthEnabled)throw new ApiError(503,"unsafe_execution_configuration","Sensitive-action reauthentication must be enabled.");
  return Object.freeze(cfg);
}
