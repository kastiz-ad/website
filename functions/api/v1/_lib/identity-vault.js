import { ApiError } from "./http.js";
const encoder=new TextEncoder(),decoder=new TextDecoder();
const b64=bytes=>btoa(String.fromCharCode(...bytes)),unb64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const mask=value=>value?`${"•".repeat(Math.max(4,value.length-4))}${value.slice(-4)}`:"Not stored";
export class IdentityVaultProvider{
  async storeEncryptedTravelerIdentity(){throw new ApiError(503,"vault_not_configured","Identity Vault is not configured.");}
  async retrieveForApprovedPurpose(){throw new ApiError(503,"vault_not_configured","Identity Vault is not configured.");}
}
export class DevelopmentIdentityVault extends IdentityVaultProvider{
  constructor({keyBase64,keyVersion="test-v1",production=false}={}){super();if(production)throw new ApiError(503,"development_vault_forbidden","Development vault cannot run in production.");if(!keyBase64)throw new ApiError(503,"development_vault_key_missing","Development vault test key is missing.");this.keyBytes=unb64(keyBase64);if(this.keyBytes.length!==32)throw new ApiError(503,"development_vault_key_invalid","Development vault requires a 32-byte test key.");this.keyVersion=keyVersion;}
  async key(){return crypto.subtle.importKey("raw",this.keyBytes,{name:"AES-GCM"},false,["encrypt","decrypt"]);}
  async storeEncryptedTravelerIdentity({userId,recordId,value}){const nonce=crypto.getRandomValues(new Uint8Array(12));const aad=encoder.encode(`${userId}:${recordId}:${this.keyVersion}`);const plaintext=encoder.encode(JSON.stringify(value));const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv:nonce,additionalData:aad},await this.key(),plaintext);return{ciphertext:b64(new Uint8Array(ciphertext)),nonce:b64(nonce),keyVersion:this.keyVersion,algorithm:"AES-256-GCM"};}
  async retrieveForApprovedPurpose({userId,recordId,envelope}){const aad=encoder.encode(`${userId}:${recordId}:${envelope.keyVersion}`);try{const plaintext=await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(envelope.nonce),additionalData:aad},await this.key(),unb64(envelope.ciphertext));return JSON.parse(decoder.decode(plaintext));}catch{throw new ApiError(403,"vault_decryption_failed","Identity record could not be unlocked for this purpose.");}}
}
export class ProductionIdentityVault extends IdentityVaultProvider{constructor({kms}={}){super();this.kms=kms;}async storeEncryptedTravelerIdentity(){if(!this.kms)throw new ApiError(503,"production_vault_not_configured","Managed KMS/HSM is required.");throw new ApiError(501,"production_vault_adapter_pending","Approved production vault adapter is not connected.");}}
export const revealMaskedIdentity=identity=>Object.freeze({displayName:identity.displayName||"",passportNumberMasked:mask(identity.passportNumber),expirationDate:identity.expirationDate||null,issuingCountry:identity.issuingCountry||null,verificationStatus:identity.verificationStatus||"unverified"});
export const selectIdentityFields=(identity,fields)=>Object.fromEntries(fields.filter(key=>["legalGivenNames","legalSurname","dateOfBirth","nationality","passportNumber","passportExpirationDate","issuingCountry"].includes(key)).map(key=>[key,identity[key]]));
