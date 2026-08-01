import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server';
import { ApiError } from './http.js';

export const challengeBytes = () => crypto.getRandomValues(new Uint8Array(32));
export const challengeString = bytes => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
export const hasSimpleWebAuthnServer = Boolean(generateRegistrationOptions && verifyRegistrationResponse && generateAuthenticationOptions && verifyAuthenticationResponse);
export const hasWebAuthnVerifier = binding => Boolean(binding && typeof binding.verify === 'function');

const textEncoder = new TextEncoder();
const padBase64Url = value => String(value).replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(String(value).length / 4) * 4, '=');
export const bytesToBase64Url = value => btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
export const base64UrlToBytes = value => Uint8Array.from(atob(padBase64Url(value)), c => c.charCodeAt(0));

export function assertChallenge(record, { challenge, purpose, now = Date.now() }) {
  if (!record || record.consumed_at) throw new ApiError(409, 'challenge_replayed', 'This device challenge is no longer valid.');
  if (record.challenge !== challenge || record.purpose !== purpose) throw new ApiError(403, 'challenge_mismatch', 'Device challenge does not match this action.');
  if (new Date(record.expires_at).getTime() <= now) throw new ApiError(409, 'challenge_expired', 'Device challenge expired. Try again.');
}
export function assertWebAuthnContext({ expectedOrigin, actualOrigin, expectedRpId, actualRpId }) {
  if (!expectedOrigin || actualOrigin !== expectedOrigin) throw new ApiError(403, 'webauthn_origin_invalid', 'Device confirmation origin is invalid.');
  if (!expectedRpId || actualRpId !== expectedRpId) throw new ApiError(403, 'webauthn_rp_invalid', 'Device confirmation site identity is invalid.');
}

export function normalizeExpectedOrigins(value) {
  return String(value || '').split(',').map(origin => origin.trim()).filter(Boolean);
}
export function validateRpAndOrigins({ rpId, expectedOrigins, production = false }) {
  if (!rpId || typeof rpId !== 'string' || rpId.includes('*') || !/^[a-z0-9.-]+$/i.test(rpId)) throw new ApiError(503, 'webauthn_rp_invalid', 'Passkey RP ID must be explicitly configured.');
  if (production && /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(rpId)) throw new ApiError(503, 'webauthn_rp_invalid', 'Production passkey RP ID cannot be localhost.');
  if (!Array.isArray(expectedOrigins) || !expectedOrigins.length) throw new ApiError(503, 'webauthn_origin_invalid', 'At least one passkey origin must be explicitly configured.');
  for (const origin of expectedOrigins) {
    if (origin.includes('*')) throw new ApiError(503, 'webauthn_origin_invalid', 'Wildcard passkey origins are not allowed.');
    let parsed;
    try { parsed = new URL(origin); } catch { throw new ApiError(503, 'webauthn_origin_invalid', 'Passkey origin is malformed.'); }
    const localhost = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    if (production && localhost) throw new ApiError(503, 'webauthn_origin_invalid', 'Production passkey origin cannot be localhost.');
    if (production && parsed.protocol !== 'https:') throw new ApiError(503, 'webauthn_origin_invalid', 'Production passkey origin must use HTTPS.');
    if (!production && parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && localhost)) throw new ApiError(503, 'webauthn_origin_invalid', 'Development passkey origin must be HTTPS or localhost HTTP.');
  }
  return true;
}

export async function createRegistrationOptions({ flags, user, challenge, existingCredentials = [] }) {
  validateRpAndOrigins({ rpId: flags.rpId, expectedOrigins: flags.expectedOrigins, production: flags.production });
  return generateRegistrationOptions({
    rpName: flags.rpName,
    rpID: flags.rpId,
    userID: textEncoder.encode(user.id),
    userName: user.email || user.id,
    userDisplayName: user.user_metadata?.display_name || user.email || 'Kastiz user',
    challenge,
    timeout: flags.challengeTtl * 1000,
    attestationType: 'none',
    excludeCredentials: existingCredentials.map(credential => ({ id: credential.credential_id, transports: credential.transports || [] })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' },
    supportedAlgorithmIDs: [-7, -257]
  });
}
export async function createAuthenticationOptions({ flags, challenge, credentials = [] }) {
  validateRpAndOrigins({ rpId: flags.rpId, expectedOrigins: flags.expectedOrigins, production: flags.production });
  return generateAuthenticationOptions({
    rpID: flags.rpId,
    challenge,
    timeout: flags.challengeTtl * 1000,
    allowCredentials: credentials.map(credential => ({ id: credential.credential_id, transports: credential.transports || [] })),
    userVerification: 'required'
  });
}

export class SimpleWebAuthnServerVerifier {
  constructor({ server = { verifyRegistrationResponse, verifyAuthenticationResponse } } = {}) { this.server = server; }
  async verifyRegistration({ payload, expectedChallenge, expectedOrigins, expectedRpId }) {
    try {
      const verification = await this.server.verifyRegistrationResponse({
        response: payload,
        expectedChallenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: expectedRpId,
        requireUserPresence: true,
        requireUserVerification: true,
        supportedAlgorithmIDs: [-7, -257]
      });
      if (!verification?.verified || !verification.registrationInfo?.credential) throw new ApiError(403, 'passkey_verification_failed', 'Device registration could not be verified.');
      const info = verification.registrationInfo;
      return { verified: true, credential: { id: info.credential.id, publicKey: bytesToBase64Url(info.credential.publicKey), signCount: info.credential.counter || 0, transports: payload.response?.transports || info.credential.transports || [], algorithm: payload.response?.publicKeyAlgorithm || -7, credentialDeviceType: info.credentialDeviceType, credentialBackedUp: Boolean(info.credentialBackedUp), aaguid: info.aaguid, origin: info.origin, rpId: info.rpID || expectedRpId } };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(403, 'passkey_verification_failed', 'Device registration could not be verified.');
    }
  }
  async verifyAuthentication({ payload, credential, expectedChallenge, expectedOrigins, expectedRpId }) {
    try {
      const verification = await this.server.verifyAuthenticationResponse({
        response: payload,
        expectedChallenge,
        expectedOrigin: expectedOrigins,
        expectedRPID: expectedRpId,
        credential: { id: credential.credential_id, publicKey: base64UrlToBytes(credential.public_key), counter: Number(credential.sign_count || 0), transports: credential.transports || [] },
        requireUserVerification: true,
        advancedFIDOConfig: { userVerification: 'required' }
      });
      if (!verification?.verified || !verification.authenticationInfo?.userVerified) throw new ApiError(403, 'passkey_verification_failed', 'Device confirmation failed.');
      const info = verification.authenticationInfo;
      const oldCounter = Number(credential.sign_count || 0), nextCounter = Number(info.newCounter || 0);
      const multiDevice = info.credentialDeviceType === 'multiDevice' || Boolean(info.credentialBackedUp);
      if (!multiDevice && nextCounter < oldCounter) throw new ApiError(409, 'passkey_clone_risk', 'This passkey counter looks unsafe. Use another registered passkey.');
      return { verified: true, credentialId: info.credentialID || payload.id, signCount: nextCounter, userVerified: Boolean(info.userVerified), credentialDeviceType: info.credentialDeviceType, credentialBackedUp: Boolean(info.credentialBackedUp), origin: info.origin, rpId: info.rpID, counterAdvanced: nextCounter > oldCounter };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(403, 'passkey_verification_failed', 'Device confirmation failed.');
    }
  }
}

export class WebAuthnVerifier {
  constructor(binding) { this.binding = binding; this.real = new SimpleWebAuthnServerVerifier(); }
  async verify(request) {
    if (hasWebAuthnVerifier(this.binding) && request.allowInjectedVerifier === true) return this.binding.verify(request);
    if (request.kind === 'registration') return this.real.verifyRegistration(request);
    if (request.kind === 'authentication') return this.real.verifyAuthentication(request);
    throw new ApiError(503, 'passkey_verifier_not_configured', 'Passkey verification service is not configured.');
  }
}
