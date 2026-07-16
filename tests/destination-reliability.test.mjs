import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const followup = readFileSync(new URL("../js/ui/mission-followup.js", import.meta.url), "utf8");
const loading = readFileSync(new URL("../js/pages/loading-page.js", import.meta.url), "utf8");
const results = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");

assert.match(followup, /GT:\s*"GTQ"|Guatemala:\s*"GT"/);
assert.match(followup, /"Central America":\s*"BZ CR SV GT HN NI PA"/);
for (const code of ["PH", "CG", "CD", "ZA", "KH", "MY", "TW", "PG"]) {
  assert.match(followup, new RegExp(`\\b${code}\\b`), `${code} must exist in the offline worldwide country catalog`);
}
assert.match(followup, /buildStaticWorldwideCountries/);
assert.match(followup, /Promise\.allSettled/);
assert.match(followup, /searchWorldwideDestinations/);
assert.match(followup, /dedupe=0&limit=10/);
assert.match(followup, /data-destination-matches/);
assert.match(followup, /Several places share this name/);
assert.match(followup, /destinationCandidateLabel/);
assert.doesNotMatch(followup, /restcountries\.com\/v3/);
assert.match(loading, /countriesnow\.space\/api\/v0\.1\/countries\/capital/);
assert.match(loading, /open\.er-api\.com\/v6\/latest/);
assert.match(loading, /bounded=1&viewbox=/);
assert.match(loading, /encodeURIComponent\("hotel"\)/);
assert.match(loading, /encodeURIComponent\("restaurant"\)/);
assert.match(results, /GT:\s*\[\["Aeromexico"/);
assert.match(results, /GT:\s*\[\[2300000, 3900000\]/);
assert.match(results, /liveHotelNames/);
assert.match(results, /liveRestaurantPlaces/);

console.log("destination reliability checks passed");
