import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateTravelProfile, validateLoyaltyRecord, maskMembershipNumber, compareTravelOptions, safeTravelPlanningContext, LOYALTY_CATALOG } from "../functions/api/v1/_lib/one-pass-travel.js";

const profile = {
  preferred_name: "CEO",
  home_city_region: "Seoul",
  departure_airports: ["icn", "gmp"],
  arrival_airports: "hnd,nrt",
  airlines: ["korean_air"],
  avoided_airlines: ["slow_air"],
  hotel_brands: ["hilton"],
  dietary_restrictions: ["vegetarian", "no seafood"],
  accessibility_requirements: ["step-free route"],
  preferred_currencies: ["krw", "usd", "jpy"],
  seat_location: "window",
  cabin_preference: "business",
  direct_flight_preference: "prefer_direct",
  maximum_stopovers: 0,
  price_points_strategy: "best_balance"
};

test("Travel Profile validates expanded ordinary preferences and normalizes identifiers", () => {
  const out = validateTravelProfile(profile);
  assert.deepEqual(out.departure_airports, ["ICN", "GMP"]);
  assert.deepEqual(out.arrival_airports, ["HND", "NRT"]);
  assert.equal(out.seat_preference, "window");
  assert.equal(out.budget_preference, "best_balance");
  assert.equal(out.checkin_preferences.direct_flight, "prefer_direct");
  assert.equal(out.checkin_preferences.maximum_stopovers, 0);
});

test("Travel Profile rejects client ownership and excessive or invalid values", () => {
  assert.throws(() => validateTravelProfile({ user_id: "user-b" }), /ownership/);
  assert.throws(() => validateTravelProfile({ departure_airports: ["not-an-airport"] }), /airport/);
  assert.throws(() => validateTravelProfile({ preferred_currencies: ["USDX"] }), /currency/);
  assert.throws(() => validateTravelProfile({ maximum_stopovers: 9 }), /stopovers/);
  assert.throws(() => validateTravelProfile({ airlines: Array.from({ length: 13 }, (_, i) => `A${i}`) }), /Too many/);
});

test("Dietary and accessibility preferences are optional, limited, and health-adjacent safe", () => {
  assert.throws(() => validateTravelProfile({ dietary_restrictions: Array.from({ length: 7 }, (_, i) => `food${i}`) }), /Too many/);
  assert.throws(() => validateTravelProfile({ accessibility_requirements: ["x".repeat(121)] }), /text value/);
  const context = safeTravelPlanningContext({ travelProfile: validateTravelProfile({ dietary_restrictions: ["vegetarian", "rare medical diagnosis detail"], accessibility_requirements: ["wheelchair access"] }) });
  const serialized = JSON.stringify(context);
  assert.match(serialized, /Requests vegetarian meal/);
  assert.match(serialized, /Has dietary preference/);
  assert.match(serialized, /Needs accessible room or route/);
  assert.doesNotMatch(serialized, /rare medical diagnosis detail|wheelchair access/);
});

test("Loyalty Wallet stores only masked references and rejects passwords", () => {
  const record = validateLoyaltyRecord({ provider: "korean_air", program: "Korean Air SKYPASS", program_category: "airline", membership_number: "1234567890", member_name: "CEO", preferred_usage: "maximum_points" });
  assert.equal(record.masked_membership_number.endsWith("7890"), true);
  assert.equal(record.protected_membership_reference.startsWith("masked-only:"), true);
  assert.equal(JSON.stringify(record).includes("1234567890"), false);
  assert.equal(record.program_category, "airline");
  assert.equal(record.preferred_usage, "maximum_points");
  assert.throws(() => validateLoyaltyRecord({ ...record, password: "never" }), /passwords/);
  assert.throws(() => validateLoyaltyRecord({ ...record, security_answer: "never" }), /security answers/);
  assert.throws(() => validateLoyaltyRecord({ ...record, oauth_token: "never" }), /tokens/);
  assert.throws(() => validateLoyaltyRecord({ ...record, user_id: "user-b" }), /ownership/);
  assert.equal(maskMembershipNumber("ABCD1234"), "****1234");
});

test("Loyalty catalog is informational and covers requested starter programs", () => {
  const names = LOYALTY_CATALOG.map(item => item.program).join(" | ");
  for (const name of ["Korean Air SKYPASS", "Asiana Club", "ANA Mileage Club", "Japan Airlines Mileage Bank", "Marriott Bonvoy", "Hilton Honors", "World of Hyatt", "Booking.com Genius", "Agoda membership", "Expedia One Key"]) assert.match(names, new RegExp(name.replace(/[.]/g, "\\.")));
  assert.equal(LOYALTY_CATALOG.every(item => !item.live && !item.oauthUrl), true);
});

test("Travel comparison returns cheapest, points, and balanced choices deterministically", () => {
  const options = [
    { id: "cheap", provider: "ana", basePrice: 300, taxesAndFees: 50, stopovers: 1, durationMinutes: 700, estimatedPoints: 1000 },
    { id: "points", provider: "korean_air", basePrice: 420, taxesAndFees: 70, stopovers: 0, durationMinutes: 500, estimatedPoints: 6000, refundability: "refundable" },
    { id: "ota", kind: "hotel", channel: "ota", provider: "booking", basePrice: 250, taxesAndFees: 40 }
  ];
  const comparison = compareTravelOptions(options, { travelProfile: validateTravelProfile(profile), loyaltyAccounts: [{ provider: "korean_air", program: "Korean Air SKYPASS", program_category: "airline", preferred_usage: "maximum_points" }] });
  assert.equal(comparison.bestPriceOption.id, "ota");
  assert.equal(comparison.bestPointsOption.id, "points");
  assert.equal(comparison.bestBalancedOption.id, "points");
  assert.match(comparison.compared.find(item => item.id === "ota").importantWarnings.join(" "), /OTA hotel bookings/);
  assert.match(comparison.note, /Fictional demonstration only/);
  assert.equal(comparison.demo, undefined);
  assert.deepEqual(comparison.compared.map(item => item.id), compareTravelOptions(options, { travelProfile: validateTravelProfile(profile), loyaltyAccounts: [{ provider: "korean_air", program: "Korean Air SKYPASS", program_category: "airline" }] }).compared.map(item => item.id));
});

test("Comparison rejects unsafe HTML in user-controlled option labels", () => {
  assert.throws(() => compareTravelOptions([{ id: "<script>", label: "<img onerror=alert(1)>", provider: "ana", basePrice: 1 }]), /text value/);
});

test("Safe mission and AI context exclude raw and masked loyalty membership numbers", () => {
  const context = safeTravelPlanningContext({ travelProfile: validateTravelProfile(profile), loyaltyAccounts: [{ provider: "korean_air", program: "Korean Air SKYPASS", program_category: "airline", protected_membership_reference: "masked-only:local", masked_membership_number: "******7890" }] });
  assert.equal(JSON.stringify(context).includes("1234567890"), false);
  assert.equal(JSON.stringify(context).includes("******7890"), false);
  assert.equal(JSON.stringify(context).includes("step-free route"), false);
  assert.equal(context.loyaltyPrograms[0].program, "Korean Air SKYPASS");
  assert.deepEqual(context.dietaryPreferenceSignals, ["Requests vegetarian meal", "Has seafood-related dining preference"]);
  assert.deepEqual(context.accessibilityPreferenceSignals, ["Needs accessible room or route"]);
});

test("ONE Pass API exposes travel, loyalty, comparison and reveal routes safely", async () => {
  const api = await readFile(new URL("../functions/api/v1/one-pass/[[path]].js", import.meta.url), "utf8");
  assert.match(api, /validateTravelProfile/);
  assert.match(api, /validateLoyaltyRecord/);
  assert.match(api, /section==="loyalty-catalog"/);
  assert.match(api, /section==="comparison"&&id==="evaluate"/);
  assert.match(api, /section==="mission-context"&&id==="travel"/);
  assert.match(api, /sensitive:reveal-loyalty-membership/);
  assert.match(api, /rawMembershipNumbersIncluded:false/);
  assert.match(api, /full_membership_not_stored/);
  assert.doesNotMatch(api, /membershipNumber:record\.protected_membership_reference/);
  assert.match(api, /id=eq\.\$\{id\}&user_id=eq\.\$\{user\.id\}/);
  assert.doesNotMatch(api, /input\.user_id|input\.userId|provider_password|password:/i);
});

test("Travel context and comparison endpoints use allowlisted safe selects", async () => {
  const api = await readFile(new URL("../functions/api/v1/one-pass/[[path]].js", import.meta.url), "utf8");
  const contextLine = api.split("section===\"mission-context\"")[1].split("section===\"comparison\"")[0];
  assert.match(contextLine, /select=provider,program,program_category,tier,preferred_usage,verification_status/);
  assert.doesNotMatch(contextLine, /protected_membership_reference|masked_membership_number|payment_method|passport|token/i);
});

test("Travel and loyalty migration extends existing tables with RLS and no SECURITY DEFINER", async () => {
  const sql = await readFile(new URL("../supabase/migrations/202608020003_one_pass_travel_profile_loyalty.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.travel_preferences add column if not exists preferred_name/);
  assert.match(sql, /alter table public\.loyalty_accounts add column if not exists program_category/);
  assert.match(sql, /alter table public\.travel_preferences enable row level security/);
  assert.match(sql, /alter table public\.loyalty_accounts enable row level security/);
  assert.match(sql, /revoke insert,update,delete on public\.loyalty_accounts from authenticated/);
  assert.match(sql, /revoke all on public\.loyalty_accounts from anon/);
  assert.match(sql, /create index if not exists loyalty_accounts_user_provider_idx/);
  assert.match(sql, /loyalty_accounts_protected_reference_safe_prefix/);
  assert.doesNotMatch(sql, /security definer|drop table|truncate|create view|create function/i);
});

test("ONE Pass frontend has expanded localized profile and wallet UX without sensitive password collection", async () => {
  const html = await readFile(new URL("../one-pass.html", import.meta.url), "utf8");
  const js = await readFile(new URL("../one-pass.js", import.meta.url), "utf8");
  assert.match(html, /name="preferred_name"/);
  assert.match(html, /name="membership_number"/);
  assert.match(html, /id="comparisonResults"/);
  assert.match(html + js, /optional personal preferences|Ã¬â€žÂ Ã­Æ’Â Ã¬Å¾â€¦Ã«Â Â¥Ã¬ÂÂ¸ ÃªÂ°Å“Ã¬ÂÂ¸ Ã¬â€žÂ Ã­ËœÂ¸|preferencias personales opcionales/);
  assert.match(html + js, /masked reference only|Ã«Â§Ë†Ã¬Å Â¤Ã­â€šÂ¹Ã«ÂÅ“ Ã­Å¡Å’Ã¬â€ºÂ Ã¬Â°Â¸Ã¬Â¡Â°|referencias enmascaradas/);
  assert.match(js, /loyaltyForm/);
  assert.match(js, /Run fictional comparison|ÃªÂ°â‚¬Ã¬Æ’Â Ã«Â¹â€žÃªÂµÂ Ã¬â€¹Â¤Ã­â€“â€°|Ejecutar comparaciÃƒÂ³n ficticia/);
  assert.match(js, /ko:\s*\{/);
  assert.match(js, /es:\s*\{/);
  assert.doesNotMatch(html + js, /name=["'](?:passport|passport_number|card|card_number|cvv|provider_password|password)["']/i);
  assert.doesNotMatch(html + js, /sessionStorage|localStorage\.setItem\([^)]*membership|localStorage\.setItem\([^)]*loyalty/i);
  assert.doesNotMatch(html + js, /ÃƒÆ’|Ãƒâ€š|ÃƒÂ¯Ã‚Â¿Ã‚Â½|ÃƒÂ­Ã¢â‚¬Â¢Ã…â€œ|ÃƒÂ¬Ã¢â‚¬â€Ã‚Â¬|ÃƒÂ«Ã‚Â¡Ã…â€œ/);
});
