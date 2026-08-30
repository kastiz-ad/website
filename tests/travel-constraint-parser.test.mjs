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

test("resolves generic explicit calendar months with duration-safe local dates", () => {
  const october = parseTravelConstraints("Plan a 3-day trip to Tokyo for 2 people in October.", { now });
  assert.deepEqual([october.dateIntent.kind, october.dateIntent.month, october.dateIntent.year, october.startDate, october.endDate], ["explicit_month", 10, 2026, "2026-10-01", "2026-10-03"]);
  const thisOctober = parseTravelConstraints("Plan a 3-day trip to Tokyo for 2 people this October.", { now });
  assert.deepEqual([thisOctober.startDate, thisOctober.endDate], ["2026-10-01", "2026-10-03"]);
  const explicitYear = parseTravelConstraints("Plan a 3-day trip to Tokyo for 2 people in October 2026.", { now });
  assert.deepEqual([explicitYear.dateIntent.year, explicitYear.dateIntent.explicitYear, explicitYear.startDate, explicitYear.endDate], [2026, true, "2026-10-01", "2026-10-03"]);
  const november = parseTravelConstraints("Plan a 5-day trip to Paris in November.", { now });
  assert.deepEqual([november.durationDays, november.startDate, november.endDate], [5, "2026-11-01", "2026-11-05"]);
  const fiveOctoberDays = parseTravelConstraints("Plan a 5-day trip to Tokyo in October.", { now });
  assert.deepEqual([fiveOctoberDays.durationDays, fiveOctoberDays.startDate, fiveOctoberDays.endDate], [5, "2026-10-01", "2026-10-05"]);
  const twoNovemberDays = parseTravelConstraints("Plan a 2-day trip to Tokyo in November.", { now });
  assert.deepEqual([twoNovemberDays.durationDays, twoNovemberDays.startDate, twoNovemberDays.endDate], [2, "2026-11-01", "2026-11-02"]);
});

test("normalizes visually identical Unicode duration dashes before month resolution", () => {
  for (const dash of ["‑", "–", "—", "−", "﹣", "－"]) {
    const parsed = parseTravelConstraints(`Plan a 3${dash}day trip to Tokyo for 2 people in October.`, { now });
    assert.deepEqual([parsed.durationDays, parsed.travelerCount, parsed.startDate, parsed.endDate], [3, 2, "2026-10-01", "2026-10-03"]);
    assert.equal(parsed.dateIntent.kind, "explicit_month");
  }
});

test("rolls an already-passed implicit month forward but honors an explicit year", () => {
  const decemberNow = new Date(2026, 11, 15, 12);
  const implicit = parseTravelConstraints("Plan a trip in October.", { now: decemberNow });
  assert.deepEqual([implicit.startDate, implicit.endDate], ["2027-10-01", "2027-10-31"]);
  const explicit = parseTravelConstraints("Plan a trip in October 2026.", { now: decemberNow });
  assert.deepEqual([explicit.startDate, explicit.endDate], ["2026-10-01", "2026-10-31"]);
});

test("resolves Korean and Spanish explicit calendar months", () => {
  const korean = parseTravelConstraints("10월에 도쿄 3일 여행 2명", { now });
  assert.deepEqual([korean.durationDays, korean.travelerCount, korean.startDate, korean.endDate], [3, 2, "2026-10-01", "2026-10-03"]);
  const spanish = parseTravelConstraints("Viaje de cinco días a París en noviembre para dos personas", { now });
  assert.deepEqual([spanish.durationDays, spanish.travelerCount, spanish.startDate, spanish.endDate], [5, 2, "2026-11-01", "2026-11-05"]);
});

test("explicit month beats stale generated dates and normalizes the exact span", () => {
  const normalized = applyTravelConstraints({
    durationDays: 7, travelerCount: 1,
    schedule: { startDate: "2023-08-31", endDate: "2026-09-02", durationDays: 7, travelerCount: 1 }
  }, "Plan a 3-day trip to Tokyo for 2 people in October.", { now });
  assert.deepEqual([normalized.durationDays, normalized.travelerCount, normalized.schedule.startDate, normalized.schedule.endDate], [3, 2, "2026-10-01", "2026-10-03"]);
  assert.equal(normalized.dateIntent.kind, "explicit_month");
  assert.equal(normalized.schedule.dateIntent.kind, "explicit_month");
});

test("explicit month preserves independent manual traveler and date overrides", () => {
  const prompt = "Plan a 3-day trip to Tokyo for 2 people in October.";
  const travelerOverride = applyTravelConstraints({ schedule: {
    source: "mixed", fieldSources: { startDate: "inferred", endDate: "inferred", travelerCount: "manual" },
    startDate: "2026-10-01", endDate: "2026-10-03", travelerCount: 3
  } }, prompt, { now });
  assert.deepEqual([travelerOverride.durationDays, travelerOverride.travelerCount, travelerOverride.schedule.startDate, travelerOverride.schedule.endDate], [3, 3, "2026-10-01", "2026-10-03"]);
  const dateOverride = applyTravelConstraints({ schedule: {
    source: "mixed", fieldSources: { startDate: "manual", endDate: "manual", travelerCount: "inferred" },
    startDate: "2026-10-10", endDate: "2026-10-14", travelerCount: 2
  } }, prompt, { now });
  assert.deepEqual([dateOverride.durationDays, dateOverride.travelerCount, dateOverride.schedule.startDate, dateOverride.schedule.endDate], [5, 2, "2026-10-10", "2026-10-14"]);
  assert.equal(dateOverride.dateIntent, undefined);
});

test("explicit-month schedules survive save/restore and provider handoff", () => {
  const prompt = "Plan a 3-day trip to Tokyo for 2 people in October.";
  const saved = JSON.parse(JSON.stringify(applyTravelConstraints({ destination: { city: "Tokyo" }, schedule: {} }, prompt, { now })));
  const restored = applyTravelConstraints(saved, prompt, { now });
  assert.deepEqual([restored.durationDays, restored.schedule.startDate, restored.schedule.endDate], [3, "2026-10-01", "2026-10-03"]);
  const handoff = buildOneFreeProviderHandoff({ destination: restored.destination, dates: restored.schedule, travelers: restored.travelerCount });
  const queries = handoff.links.map((link) => new URL(link.url).searchParams.get("q") || "").join(" ");
  assert.match(queries, /2026-10-01/);
  assert.match(queries, /2026-10-03/);
  assert.match(queries, /2 travelers/);
});

test("invalid structured schedules cannot create malformed or reverse ranges", () => {
  const prompt = "Plan a 3-day trip to Tokyo for 2 people in October.";
  for (const schedule of [
    { startDate: "2026-13-01", endDate: "2026-10-03" },
    { startDate: "2026-10-10", endDate: "2026-10-01" },
    { startDate: "2023-08-31", endDate: "2026-09-02" }
  ]) {
    const normalized = applyTravelConstraints({ durationDays: 7, schedule }, prompt, { now });
    assert.deepEqual([normalized.durationDays, normalized.schedule.startDate, normalized.schedule.endDate], [3, "2026-10-01", "2026-10-03"]);
  }
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
