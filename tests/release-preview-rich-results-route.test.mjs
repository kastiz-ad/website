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
  assert.match(resultsPage, /const releasePreviewFallback = shouldUseReleasePreviewTravelFallback\(params\)/);
  assert.match(resultsPage, /const hasExplicitPreviewMission = Boolean/);
  assert.ok(resultsPage.indexOf('sessionStorage.getItem(STORAGE_KEYS.results)') < resultsPage.indexOf('if (releasePreviewFallback) return createReleasePreviewTravelFallback(params);'));
});

test("rich travel renderer still includes populated result sections", () => {
  const requiredPatterns = [
    /createTravelPackagesCard\(result, missionContext\)/,
    /createAlpha03ExperienceHtml\(journey, result\)/,
    /TRAVEL_OPTION_TARGETS = Object\.freeze\(\{\s*flights:\s*8,\s*hotels:\s*8,\s*restaurants:\s*12\s*\}\)/,
    /currentResult\.flights/,
    /currentResult\.hotels/,
    /currentResult\.restaurants/,
    /const getTravelDurationDays = \(result\) => calculateTripDayCounts\(result\)\.tripDays/,
    /buildPreviewMapMarkers\(/,
    /osmEmbedUrlForProfile\(/,
    /alpha03-map-pin/,
    /<img src="\$\{escapeSummaryText\(image\.url\)\}"/,
    /openApprovalInformationReview\(/
  ];
  for (const pattern of requiredPatterns) assert.match(resultsPage, pattern);
});

test("public assets use the release cache buster for the rich preview fix", () => {
  assert.match(resultsHtml, /results\.css\?v=20260811-results-localization-v1/);
  assert.match(resultsHtml, /results\.js\?v=20260811-results-localization-v1/);
  assert.match(resultsJs, /results-page\.js\?v=20260811-results-localization-v1/);
  assert.match(homepageHtml, /style\.css\?v=20260810-investor-demo-polish-2/);
  assert.match(homepageHtml, /script\.js\?v=20260811-results-localization-v1/);
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

test('airport selector uses a clean separator instead of a question-mark glyph', () => {
  assert.equal(/ICN \? Incheon/.test(homepageHtml), false);
  assert.equal(/ICN\s+.\s+Incheon/.test(homepageHtml), true);
});


test("investor demo non-travel samples are not forced through travel fallback", () => {
  assert.match(resultsPage, /INVESTOR_TRAVEL_FALLBACK_SCENARIOS = new Set\(\["travel", "business_trip", "family_vacation"\]\)/);
  assert.doesNotMatch(resultsPage, /INVESTOR_TRAVEL_FALLBACK_SCENARIOS = new Set\(\[[^\]]*restaurant_reservation/);
  assert.match(resultsPage, /if \(scenario && !INVESTOR_TRAVEL_FALLBACK_SCENARIOS\.has\(scenario\)\) return false;/);
  assert.match(resultsPage, /params\.get\("scenario"\) \|\| params\.get\("demoScenario"\)/);
});


test("investor medical appointment demo has a dedicated clean healthcare renderer", () => {
  assert.match(resultsPage, /isInvestorMedicalAppointmentDemo/);
  assert.match(resultsPage, /renderInvestorMedicalAppointmentMission/);
  assert.match(resultsPage, /investor-medical-clinic-grid/);
  assert.match(resultsPage, /data-open-approval-review/);
  assert.match(resultsPage, /Live healthcare provider APIs are not connected yet/);
});


test("investor medical appointment demo hides the shared mission summary panel", () => {
  assert.match(resultsPage, /shouldHideMissionUnderstanding = \(isTravelResult\(currentResult\) \|\| isInvestorMedicalAppointmentDemo\(currentResult\) \|\| isInvestorRestaurantReservationDemo\(currentResult\)\)/);
  assert.equal(resultsPage.includes("if (!shouldHideMissionUnderstanding) renderMissionUnderstanding();"), true);
});


test("investor restaurant reservation demo renders a one-meal focused flow", () => {
  assert.match(resultsPage, /isInvestorRestaurantReservationDemo/);
  assert.match(resultsPage, /renderInvestorRestaurantReservationMission/);
  assert.match(resultsPage, /Not a 7-day trip/);
  assert.match(resultsPage, /investor-restaurant-option-grid/);
  assert.match(resultsPage, /Approve one availability check/);
  assert.match(resultsPage, /isFocusedInvestorDemo/);
});


test("city-aware concierge and decision headings replace generic filler", () => {
  assert.match(resultsPage, /localDestinationConciergeTitle/);
  assert.match(resultsPage, /localDestinationConciergeLead/);
  assert.match(resultsPage, /NYC-specific upgrades only/);
  assert.match(resultsPage, /LA-specific upgrades only/);
  assert.match(resultsPage, /Japan-specific upgrades only/);
  assert.equal(resultsPage.includes("title: localDestinationDecisionTitle(result)"), true);
});
