import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  ALPHA07_PERSONAL_MISSION_MEMORY_VERSION,
  applyPersonalMissionMemory,
  createMemoryCandidate,
  createPersonalMissionMemory,
  deleteMissionMemory,
  disableMissionMemory,
  editMissionMemory,
  exportPersonalMissionMemory,
  isSensitiveMissionMemory,
  rememberMissionPreference,
  seedFounderPreviewMemory
} from "../js/profile/personal-mission-memory-alpha07.js";

test("ALPHA-07 stores mission preferences, not chat history or sensitive data", () => {
  assert.equal(isSensitiveMissionMemory({ category: "travel", key: "passportNumber", value: "M1234567" }), true);
  assert.equal(isSensitiveMissionMemory({ category: "finance", key: "card", value: "4111111111111111" }), true);
  assert.equal(isSensitiveMissionMemory({ category: "lifestyle", key: "chat transcript", value: "private conversation" }), true);
  assert.equal(isSensitiveMissionMemory({ category: "travel", key: "seatPreference", value: "aisle" }), false);

  const blocked = rememberMissionPreference(createPersonalMissionMemory(), {
    category: "travel",
    key: "passportNumber",
    value: "M1234567",
    source: "explicit_user_preference"
  }, { confirm: true });

  assert.equal(blocked.saved, false);
  assert.equal(blocked.reason, "sensitive_or_empty");
  assert.equal(blocked.memory.records.length, 0);
});

test("single mission observations require confirmation before becoming permanent", () => {
  const candidate = createMemoryCandidate({
    category: "hotels",
    key: "hotelLocation",
    value: "near train stations",
    sourceType: "single_mission"
  });

  assert.equal(candidate.accepted, false);
  assert.equal(candidate.reason, "confirmation_required");
  assert.equal(candidate.candidate.requiresConfirmation, true);

  const unsaved = rememberMissionPreference(createPersonalMissionMemory(), candidate.candidate);
  assert.equal(unsaved.saved, false);
  assert.equal(unsaved.reason, "confirmation_required");
});

test("explicit preferences save, duplicate memories merge, and confidence increases", () => {
  let memory = createPersonalMissionMemory();
  const first = rememberMissionPreference(memory, {
    category: "travel",
    key: "seatPreference",
    value: "aisle",
    source: "explicit_user_preference"
  }, { confirm: true });
  memory = first.memory;
  const originalConfidence = memory.records[0].confidence;
  const second = rememberMissionPreference(memory, {
    category: "travel",
    key: "seatPreference",
    value: "aisle",
    source: "mission_confirmation"
  }, { confirm: true });

  assert.equal(second.reason, "merged");
  assert.equal(second.memory.records.length, 1);
  assert.ok(second.memory.records[0].confidence > originalConfidence);
  assert.ok(second.memory.records[0].confirmations >= 2);
});

test("user edits override learned behavior and deleted memories never apply", () => {
  let memory = rememberMissionPreference(createPersonalMissionMemory(), {
    category: "food",
    key: "dislikedFood",
    value: "seafood",
    source: "explicit_user_preference"
  }, { confirm: true }).memory;
  const id = memory.records[0].id;

  memory = editMissionMemory(memory, id, { value: "spicy food" });
  assert.equal(exportPersonalMissionMemory(memory).records[0].value, "spicy food");
  assert.ok(memory.records[0].overrides >= 1);

  memory = deleteMissionMemory(memory, id);
  const applied = applyPersonalMissionMemory(memory, { domain: "travel", language: "en" });
  assert.equal(applied.applied.length, 0);
});

test("disabled memories and explicit conflicting instructions do not influence missions", () => {
  let memory = rememberMissionPreference(createPersonalMissionMemory(), {
    category: "hotels",
    key: "hotelLocation",
    value: "near train stations",
    source: "explicit_user_preference"
  }, { confirm: true }).memory;
  const id = memory.records[0].id;
  assert.equal(applyPersonalMissionMemory(memory, { domain: "travel" }).applied.length, 1);

  memory = disableMissionMemory(memory, id);
  assert.equal(applyPersonalMissionMemory(memory, { domain: "travel" }).applied.length, 0);

  const enabledAgain = rememberMissionPreference(createPersonalMissionMemory(), {
    category: "hotels",
    key: "hotelLocation",
    value: "near train stations",
    source: "explicit_user_preference"
  }, { confirm: true }).memory;
  const explicit = applyPersonalMissionMemory(enabledAgain, {
    domain: "travel",
    explicitInstructions: "do not choose hotels near stations"
  });
  assert.equal(explicit.applied.length, 0);
  assert.equal(explicit.explicitInstructionsOverrideMemory, true);
});

test("memory explanations are transparent and localized", () => {
  const memory = seedFounderPreviewMemory();
  const appliedKo = applyPersonalMissionMemory(memory, { domain: "travel", language: "ko" });
  assert.ok(appliedKo.applied.length >= 3);
  assert.ok(appliedKo.applied.some((entry) => /기억/.test(entry.explanation)));
  assert.ok(appliedKo.applied.every((entry) => entry.explanation && entry.source));
});

test("ALPHA-07 management page and result integration are wired and noindexed", () => {
  const resultsSource = readFileSync(new URL("../js/pages/results-page.js", import.meta.url), "utf8");
  const resultsCss = readFileSync(new URL("../results.css", import.meta.url), "utf8");
  const resultsHtml = readFileSync(new URL("../results.html", import.meta.url), "utf8");
  const resultsEntry = readFileSync(new URL("../results.js", import.meta.url), "utf8");
  const page = readFileSync(new URL("../personal-mission-memory.html", import.meta.url), "utf8");
  const pageJs = readFileSync(new URL("../personal-mission-memory.js", import.meta.url), "utf8");
  const pageCss = readFileSync(new URL("../personal-mission-memory.css", import.meta.url), "utf8");

  assert.match(resultsSource, /createPersonalMissionMemoryCard/);
  assert.match(resultsSource, /readPersonalMissionMemoryFromBrowser/);
  assert.match(resultsCss, /\.alpha07-memory-card/);
  assert.match(resultsHtml, /20260729-alpha08-multi-agent-collaboration/);
  assert.match(resultsEntry, /20260729-alpha08-multi-agent-collaboration/);
  assert.match(page, /noindex,nofollow/);
  assert.match(page, /personal-mission-memory\.js/);
  assert.match(pageJs, /seedFounderPreviewMemory/);
  assert.match(pageCss, /memory-card/);
});

test("ALPHA-07 exports editable user-controlled memory records", () => {
  const memory = seedFounderPreviewMemory();
  const exported = exportPersonalMissionMemory(memory, { language: "es" });
  assert.equal(exported.version, ALPHA07_PERSONAL_MISSION_MEMORY_VERSION);
  assert.ok(exported.records.length >= 6);
  assert.ok(exported.records.every((record) => record.whyExists && record.howUsed));
  assert.ok(memory.safety.userControlled);
  assert.equal(memory.safety.storesSensitiveCredentials, false);
});
