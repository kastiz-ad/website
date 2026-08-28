import test from "node:test";
import assert from "node:assert/strict";
import { applyTravelConstraints, parseTravelConstraints } from "../js/engine/travel/travel-constraint-parser.js";
import { buildOneFreeProviderHandoff } from "../js/ui/one-free-customer-journey.js";

const now = new Date(2026, 7, 29, 12);

test("extracts English duration, travelers, and a runtime-relative next-month range", () => {
  const parsed = parseTravelConstraints("Plan a 3-day trip to Tokyo for 2 people next month.", { now });
  assert.equal(parsed.durationDays, 3);
  assert.equal(parsed.travelerCount, 2);
  assert.equal(parsed.dateIntent.kind, "next_month");
  assert.equal(parsed.startDate, "2026-09-01");
  assert.equal(parsed.endDate, "2026-09-03");
});

test("extracts common English day and night variants", () => {
  assert.deepEqual(parseTravelConstraints("Plan 5 days in Paris for 3 people.", { now }), {
    durationDays: 5, durationNights: 4, source: "explicit", travelerCount: 3, dateIntent: null, startDate: null, endDate: null
  });
  const nights = parseTravelConstraints("A 4-night trip to Bangkok for two.", { now });
  assert.equal(nights.durationDays, 5);
  assert.equal(nights.durationNights, 4);
  assert.equal(nights.travelerCount, 2);
  assert.equal(parseTravelConstraints("a week in Madrid for my wife and me", { now }).travelerCount, 2);
  assert.equal(parseTravelConstraints("A trip for 2 nights", { now }).travelerCount, null);
  assert.equal(parseTravelConstraints("Tokyo for 3.", { now }).travelerCount, 3);
});

test("extracts existing Korean and Spanish travel language paths", () => {
  const korean = parseTravelConstraints("다음 달 서울 3일 여행 2명", { now });
  assert.equal(korean.durationDays, 3);
  assert.equal(korean.travelerCount, 2);
  assert.equal(korean.startDate, "2026-09-01");
  const spanish = parseTravelConstraints("Viaje de cinco días a París para tres personas", { now });
  assert.equal(spanish.durationDays, 5);
  assert.equal(spanish.travelerCount, 3);
});

test("initial NLP beats generated fallback values", () => {
  const normalized = applyTravelConstraints({ durationDays: 7, travelerCount: 1, schedule: {} }, "Plan a 3-day trip to Tokyo for 2 people next month.", { now });
  assert.equal(normalized.durationDays, 3);
  assert.equal(normalized.travelerCount, 2);
  assert.equal(normalized.travelers, 2);
  assert.deepEqual(normalized.schedule, { startDate: "2026-09-01", endDate: "2026-09-03", durationDays: 3, dateIntent: normalized.dateIntent });
  assert.deepEqual(JSON.parse(JSON.stringify(normalized)), normalized);
});

test("untouched inferred modal values survive Continue without becoming defaults", () => {
  const prompt = "Plan a 3-day trip to Tokyo for 2 people next month.";
  const submitted = applyTravelConstraints({
    durationDays: 7, travelerCount: 1,
    schedule: {
      source: "inferred_or_default",
      fieldSources: { startDate: "inferred", endDate: "inferred", travelerCount: "inferred", roomCount: "derived" },
      startDate: "2026-09-01", endDate: "2026-09-03", travelerCount: 2, travelers: 2, adults: 2, rooms: 1
    }
  }, prompt, { now });
  assert.deepEqual([submitted.durationDays, submitted.travelerCount, submitted.schedule.startDate, submitted.schedule.endDate], [3, 2, "2026-09-01", "2026-09-03"]);
  assert.equal(submitted.schedule.fieldSources.travelerCount, "inferred");
});

test("manual confirmation beats earlier inferred natural-language constraints", () => {
  const prompt = "Plan a 3-day trip to Tokyo for 2 people next month.";
  const inferred = applyTravelConstraints({ durationDays: 7, travelerCount: 1, schedule: {} }, prompt, { now });
  const confirmed = applyTravelConstraints({
    ...inferred,
    schedule: {
      source: "mixed", fieldSources: { startDate: "manual", endDate: "manual", travelerCount: "manual" },
      startDate: "2026-09-10", endDate: "2026-09-14",
      travelerCount: 3, travelers: 3, adults: 3
    }
  }, prompt, { now });
  assert.equal(confirmed.durationDays, 5);
  assert.equal(confirmed.travelerCount, 3);
  assert.equal(confirmed.schedule.startDate, "2026-09-10");
  assert.equal(confirmed.schedule.endDate, "2026-09-14");
  assert.equal(confirmed.dateIntent, undefined);
});

test("independent manual date, duration, and traveler changes remain authoritative", () => {
  const prompt = "Plan a 3-day trip to Tokyo for 2 people next month.";
  const confirmed = (schedule) => applyTravelConstraints({ durationDays: 3, travelerCount: 2, travelers: 2, schedule: { source: "mixed", ...schedule } }, prompt, { now });
  const datesOnly = confirmed({ fieldSources: { startDate: "manual", endDate: "manual", travelerCount: "inferred" }, startDate: "2026-09-10", endDate: "2026-09-12", travelerCount: 2 });
  assert.deepEqual([datesOnly.schedule.startDate, datesOnly.schedule.endDate, datesOnly.durationDays, datesOnly.travelerCount], ["2026-09-10", "2026-09-12", 3, 2]);
  const durationOnly = confirmed({ fieldSources: { startDate: "inferred", endDate: "manual", travelerCount: "inferred" }, startDate: "2026-09-01", endDate: "2026-09-05", travelerCount: 2 });
  assert.deepEqual([durationOnly.durationDays, durationOnly.travelerCount], [5, 2]);
  const travelersOnly = confirmed({ fieldSources: { startDate: "inferred", endDate: "inferred", travelerCount: "manual" }, startDate: "2026-09-01", endDate: "2026-09-03", travelerCount: 3 });
  assert.deepEqual([travelersOnly.durationDays, travelersOnly.travelerCount], [3, 3]);
});

test("saved manual values remain authoritative after restore and provider handoff", () => {
  const prompt = "Plan a 3-day trip to Tokyo for 2 people next month.";
  const saved = JSON.parse(JSON.stringify({
    durationDays: 5, travelerCount: 3, travelers: 3,
    destination: { city: "Tokyo" },
    schedule: { source: "mixed", fieldSources: { startDate: "manual", endDate: "manual", travelerCount: "manual" }, startDate: "2026-09-10", endDate: "2026-09-14", travelerCount: 3 }
  }));
  const restored = applyTravelConstraints(saved, prompt, { now });
  assert.equal(restored.durationDays, 5);
  assert.equal(restored.travelerCount, 3);
  assert.equal(restored.schedule.startDate, "2026-09-10");
  const handoff = buildOneFreeProviderHandoff({ destination: restored.destination, dates: restored.schedule, travelers: restored.travelerCount });
  const queries = handoff.links.map((link) => new URL(link.url).searchParams.get("q") || "").join(" ");
  assert.match(queries, /2026-09-10/);
  assert.match(queries, /2026-09-14/);
  assert.match(queries, /3 travelers/);
});
