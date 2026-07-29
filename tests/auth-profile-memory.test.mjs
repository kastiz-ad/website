import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { authenticationEnabled, authenticationStatus, canAuthenticate } from "../js/config/authentication.js";
import { oauthSignInUrl } from "../functions/api/v1/_lib/auth.js";
import { memoryRecord, profileUpdate, registration } from "../functions/api/v1/_lib/schemas.js";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("authentication is implemented but production-gated", () => {
  assert.equal(authenticationEnabled, true);
  assert.equal(authenticationStatus.implementation, "real_auth_ready");
  assert.equal(authenticationStatus.provider, "supabase_auth");
  assert.equal(authenticationStatus.passwordStorage, "external_provider_hash_only");
  assert.equal(canAuthenticate(), false);
});

test("registration accepts all official UI languages and enforces password strength", () => {
  assert.doesNotThrow(() => registration.parse({ email:"user@example.com", password:"Password123", displayName:"Founder", language:"es" }));
  assert.throws(() => registration.parse({ email:"user@example.com", password:"password", displayName:"Founder", language:"en" }), /Validation failed/);
});

test("OAuth URL supports Google and Apple only through Supabase auth", () => {
  const cfg = { supabaseUrl:"https://example.supabase.co", appOrigin:"https://kastiz.com" };
  assert.match(oauthSignInUrl(cfg, "google"), /\/auth\/v1\/authorize\?provider=google/);
  assert.match(oauthSignInUrl(cfg, "apple"), /\/auth\/v1\/authorize\?provider=apple/);
  assert.throws(() => oauthSignInUrl(cfg, "kakao"), /not supported/);
});

test("profile schema supports requested travel profile fields", () => {
  const profile = {
    display_name:"CEO",
    preferred_language:"ko",
    timezone:"Asia/Seoul",
    country:"South Korea",
    city:"Seoul",
    preferred_airport:"ICN",
    preferred_airlines:["Korean Air","Asiana"],
    preferred_hotel_types:["hotel","ryokan"],
    seat_preference:"window",
    travel_style:"comfortable",
    dietary_preferences:["vegetarian"],
    accessibility_preferences:["walk less"],
    favorite_cuisines:["Korean","Japanese"],
    disliked_foods:["seafood"],
    budget_preference:"balanced",
    time_format:"24h",
    currency_preference:"KRW",
    emergency_contact:{ label:"Family contact", userSupplied:true },
    memory_enabled:true
  };
  assert.deepEqual(profileUpdate.parse(profile), profile);
});

test("permanent memory requires explicit user confirmation and rejects sensitive keys", () => {
  assert.doesNotThrow(() => memoryRecord.parse({
    domain:"travel",
    memory_key:"seatPreference",
    memory_value:"window",
    memory_type:"permanent_profile",
    source_mission_id:null,
    explanation:"User saved this preference from profile.",
    user_confirmed:true,
    expires_at:null
  }));
  assert.throws(() => memoryRecord.parse({
    domain:"travel",
    memory_key:"seatPreference",
    memory_value:"window",
    memory_type:"permanent_profile",
    source_mission_id:null,
    explanation:"Single mission observation.",
    user_confirmed:false,
    expires_at:null
  }), /Validation failed/);
  assert.throws(() => memoryRecord.parse({
    domain:"identity",
    memory_key:"passportNumber",
    memory_value:"M123456",
    memory_type:"permanent_profile",
    source_mission_id:null,
    explanation:"Unsafe",
    user_confirmed:true,
    expires_at:null
  }), /Validation failed/);
});

test("database migration adds RLS-protected profile and memory persistence", async () => {
  const sql = await read("../supabase/migrations/202607300001_auth_profile_memory.sql");
  for (const field of ["preferred_airport", "preferred_airlines", "preferred_hotel_types", "seat_preference", "travel_style", "dietary_preferences", "accessibility_preferences", "favorite_cuisines", "disliked_foods", "budget_preference", "currency_preference", "emergency_contact", "memory_enabled"]) {
    assert.match(sql, new RegExp(field));
  }
  assert.match(sql, /create table if not exists public\.user_memories/);
  assert.match(sql, /alter table public\.user_memories enable row level security/);
  assert.match(sql, /user_id=auth\.uid\(\)/);
});

test("frontend account code never exposes service role secrets or stores plaintext passwords", async () => {
  for (const path of ["../login.js", "../js/auth/account-client.js", "../js/pages/profile-page.js", "../js/config/authentication.js"]) {
    const source = await read(path);
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY|service_role/i);
    assert.doesNotMatch(source, /localStorage\.setItem\([^)]*password/i);
  }
});

test("profile page exposes user-owned export, deletion, logout and memory controls", async () => {
  const html = await read("../profile.html");
  assert.match(html, /id="memoryEnabled"/);
  assert.match(html, /id="exportAccount"/);
  assert.match(html, /id="deleteAccount"/);
  assert.match(html, /id="logoutAccount"/);
  assert.match(html, /name="seatPreference"/);
  assert.match(html, /name="currencyPreference"/);
});
