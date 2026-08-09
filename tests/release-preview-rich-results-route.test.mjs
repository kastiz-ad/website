import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { previewTravelIntent, resolvePreviewDestination } from "../js/engine/world/preview-destination-intelligence.js";

const resultsPage = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
const resultsJs = readFileSync(new URL("../results.js", import.meta.url), "utf8");
const homepageHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const homepageCss = readFileSync(new URL("../style.css", import.meta.url), "utf8");

const routes = [
  ["/results?investorDemo=1&demo=1&demoScenario=travel&mission=trip%20to%20Tokyo&lang=ko", "Tokyo", "JP"],
  ["/results?mission=trip%20to%20Tokyo&lang=en", "Tokyo", "JP"],
  ["/results?mission=%EB%8F%84%EC%BF%84%20%EC%97%AC%ED%96%89&lang=ko", "Tokyo", "JP"],
  ["/results?mission=voyage%20%C3%A0%20Paris&lang=fr", "Paris", "FR"],
  ["/results?mission=viaje%20a%20Barcelona&lang=es", "Barcelona", "ES"]
];

test("release preview manual travel routes resolve destination-specific rich result inputs", () => {
  for (const [route, expectedCity, expectedCountryCode] of routes) {
    const url = new URL(route, "https://preview.local");
    const mission = url.searchParams.get("mission") || "";
    assert.equal(previewTravelIntent(mission), true, `${mission} should be treated as travel`);
    const resolved = resolvePreviewDestination(mission);
    assert.equal(resolved?.profile?.city, expectedCity);
    assert.equal(resolved?.profile?.countryCode, expectedCountryCode);
  }
});

test("results bootstrap hydrates manual/demo routes before the travel renderer", () => {
  assert.match(resultsPage, /previewTravelIntent/);
  assert.match(resultsPage, /resolvePreviewDestination/);
  assert.match(resultsPage, /hydrateManualTravelResultForPreview\(result, prompt, language, params, scenario\)/);
  assert.match(resultsPage, /type:\s*"travel"/);
  assert.match(resultsPage, /domain:\s*"travel"/);
  assert.match(resultsPage, /v23TravelExperience:\s*true/);
  assert.match(resultsPage, /durationDays/);
  assert.match(resultsPage, /travelerCount/);
  assert.match(resultsPage, /return adaptTravelResultToDestination\(result\)/);
});

test("legacy release preview URL without session storage falls back to rich Tokyo travel", () => {
  assert.match(resultsPage, /shouldUseReleasePreviewTravelFallback/);
  assert.match(resultsPage, /createReleasePreviewTravelFallback/);
  assert.match(resultsPage, /params\.get\("mission"\) \|\| params\.get\("q"\) \|\| "trip to Tokyo"/);
  assert.match(resultsPage, /\^202607\(\?:13\|22\|26\|29\|30\)/);
  assert.match(resultsPage, /if \(shouldUseReleasePreviewTravelFallback\(params\)\) return createReleasePreviewTravelFallback\(params\);/);
});

test("rich travel renderer still includes populated result sections", () => {
  const requiredPatterns = [
    /createTravelPackagesCard\(result, missionContext\)/,
    /createAlpha03ExperienceHtml\(journey, result\)/,
    /TRAVEL_OPTION_TARGETS = Object\.freeze\(\{\s*flights:\s*8,\s*hotels:\s*8,\s*restaurants:\s*12\s*\}\)/,
    /currentResult\.flights/,
    /currentResult\.hotels/,
    /currentResult\.restaurants/,
    /buildPreviewMapMarkers\(/,
    /osmEmbedUrlForProfile\(/,
    /alpha03-map-pin/,
    /<img src="\$\{escapeSummaryText\(image\.url\)\}"/,
    /openApprovalInformationReview\(/
  ];
  for (const pattern of requiredPatterns) assert.match(resultsPage, pattern);
});

test("public assets use the release cache buster for the rich preview fix", () => {
  assert.match(resultsHtml, /results\.css\?v=20260810-release-preview-fallback/);
  assert.match(resultsHtml, /results\.js\?v=20260810-release-preview-fallback/);
  assert.match(resultsJs, /results-page\.js\?v=20260810-release-preview-fallback/);
  assert.match(homepageHtml, /style\.css\?v=20260810-release-preview-fallback/);
  assert.match(homepageHtml, /script\.js\?v=20260810-release-preview-fallback/);
});

test("destination selector is centered and constrained on small screens", () => {
  assert.match(homepageCss, /\.destination-choice-modal\s*\{[^}]*width:\s*min\(560px, calc\(100dvw - 32px\)\)/);
  assert.match(homepageCss, /\.destination-choice-card\s*\{[^}]*box-sizing:\s*border-box[^}]*width:\s*100%[^}]*min-width:\s*0/);
  assert.match(homepageCss, /\.destination-choice-list strong, \.destination-choice-list span \{ overflow-wrap: anywhere; \}/);
});

test("language and theme controls do not use broken question-mark indicators", () => {
  assert.equal(homepageHtml.includes('<span class="nav-arrow">?</span>'), false);
  assert.equal(homepageHtml.includes("\uFFFD"), false);
  assert.equal((homepageHtml.match(/<span class="nav-arrow" aria-hidden="true"><\/span>/g) || []).length, 2);
  assert.match(homepageCss, /\.nav-text-trigger \.nav-arrow\s*\{[\s\S]*border-right:\s*1\.6px solid currentColor/);
  assert.match(homepageCss, /\.nav-dropdown\.is-open\s*>\s*\.nav-text-trigger \.nav-arrow\s*\{[\s\S]*rotate\(225deg\)/);
});
