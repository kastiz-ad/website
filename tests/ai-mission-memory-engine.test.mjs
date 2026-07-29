import test from "node:test";
import assert from "node:assert/strict";

import {
  MEMORY_LAYERS,
  buildMissionPersonalization,
  createAIMissionMemoryState,
  deleteAllMemory,
  deleteMemory,
  deleteMemoryCategory,
  expireTemporaryMissionContext,
  exportMemory,
  isSensitiveMemory,
  pauseMemory,
  recordMemoryUse,
  rememberMemory,
  resolveMemoryConflict,
  resumeMemory,
  suggestMemoryUse
} from "../js/profile/ai-mission-memory-engine.js";
import { buildUniversalMission } from "../js/engine/universal-mission-engine-v4.js";
import { createHOSKernel } from "../js/engine/kernel/hos-kernel-v16.js";

test("AI Mission Memory keeps the nine requested layers separate", () => {
  assert.deepEqual(MEMORY_LAYERS, [
    "permanentProfile",
    "travelPreferences",
    "foodPreferences",
    "accessibilityPreferences",
    "transportationPreferences",
    "budgetPreferences",
    "languagePreferences",
    "temporaryMissionContext",
    "sessionContext"
  ]);
  const state = createAIMissionMemoryState();
  for (const layer of MEMORY_LAYERS) assert.deepEqual(state.layers[layer], []);
  assert.equal(state.safety.storesChatHistory, false);
  assert.equal(state.safety.requiresExplicitPermanentConsent, true);
});

test("permanent memories require explicit consent before saving", () => {
  const blocked = rememberMemory({}, {
    layer: "travelPreferences",
    field: "preferredAirline",
    value: "ANA",
    source: "mission_user_statement"
  });
  assert.equal(blocked.saved, false);
  assert.equal(blocked.reason, "explicit_consent_required");
  assert.match(blocked.consentPrompt, /ANA/);

  const saved = rememberMemory({ consent: { permanentMemory: true } }, {
    layer: "travelPreferences",
    field: "preferredAirline",
    value: "ANA",
    source: "user_confirmed"
  }, { approved: true });
  assert.equal(saved.saved, true);
  assert.equal(saved.memory.value, "ANA");
  assert.equal(saved.memory.userConfirmed, true);
  assert.equal(saved.memory.source, "user_confirmed");
  assert.ok(saved.memory.createdAt);
  assert.ok(saved.memory.updatedAt);
  assert.equal(saved.memory.lastUsed, null);
  assert.ok(saved.memory.confidence > 0 && saved.memory.confidence < 1);
});

test("sensitive fields and values are rejected", () => {
  assert.equal(isSensitiveMemory({ field: "passportNumber", value: "M1234567" }), true);
  assert.equal(isSensitiveMemory({ field: "preferredAirline", value: "ANA" }), false);
  const unsafe = rememberMemory({ consent: { permanentMemory: true } }, {
    layer: "permanentProfile",
    field: "paymentCard",
    value: "4111111111111111"
  }, { approved: true });
  assert.equal(unsafe.saved, false);
  assert.equal(unsafe.reason, "unsafe_or_empty_memory");
});

test("conflicting preferences ask before overwrite and support one-time choices", () => {
  const first = rememberMemory({ consent: { permanentMemory: true } }, {
    layer: "travelPreferences",
    field: "preferredHotelStyle",
    value: "hotel"
  }, { approved: true });
  const conflict = rememberMemory(first.state, {
    layer: "travelPreferences",
    field: "preferredHotelStyle",
    value: "Airbnb"
  }, { approved: true });
  assert.equal(conflict.saved, false);
  assert.equal(conflict.reason, "memory_conflict");

  const oneTime = resolveMemoryConflict(first.state, conflict.conflict, "one_time");
  assert.equal(oneTime.saved, true);
  assert.equal(oneTime.memory.layer, "temporaryMissionContext");
  assert.equal(oneTime.memory.value, "Airbnb");

  const future = resolveMemoryConflict(first.state, conflict.conflict, "future_preference");
  assert.equal(future.saved, true);
  assert.equal(future.memory.layer, "travelPreferences");
  assert.equal(future.memory.value, "Airbnb");
});

test("mission-only memory expires after mission completion", () => {
  const saved = rememberMemory({}, {
    layer: "temporaryMissionContext",
    field: "dietaryPreference",
    value: "No seafood on this trip",
    sourceMissionId: "mission-1",
    expiresAt: "2099-01-01T00:00:00.000Z"
  });
  assert.equal(saved.saved, true);
  assert.equal(saved.state.layers.temporaryMissionContext.length, 1);
  const expired = expireTemporaryMissionContext(saved.state, { missionId: "mission-1", completedAt: "2026-07-30T00:00:00.000Z" });
  assert.equal(expired.layers.temporaryMissionContext.length, 0);
});

test("personalization applies confirmed memory but explicit instructions win", () => {
  let result = rememberMemory({ consent: { permanentMemory: true } }, {
    layer: "travelPreferences",
    field: "preferredAirport",
    value: "ICN"
  }, { approved: true });
  result = rememberMemory(result.state, {
    layer: "travelPreferences",
    field: "preferredAirline",
    value: "ANA"
  }, { approved: true });
  result = rememberMemory(result.state, {
    layer: "foodPreferences",
    field: "dislikedFoods",
    value: ["seafood"]
  }, { approved: true });
  const personalized = buildMissionPersonalization(result.state, {
    missionType: "travel",
    explicitInstructions: "Plan Japan trip but airline Korean Air",
    language: "en"
  });
  assert.equal(personalized.enabled, true);
  assert.ok(personalized.applied.some(memory => memory.field === "preferredAirport" && memory.value === "ICN"));
  assert.ok(personalized.applied.some(memory => memory.field === "dislikedFoods"));
  assert.ok(!personalized.applied.some(memory => memory.field === "preferredAirline"));
  assert.equal(personalized.safety.explicitInstructionsOverrideMemory, true);
});

test("suggestions are dismissible and memory use increases confidence safely", () => {
  const saved = rememberMemory({ consent: { permanentMemory: true } }, {
    layer: "budgetPreferences",
    field: "budgetPreference",
    value: "comfortable"
  }, { approved: true });
  const suggestions = suggestMemoryUse(saved.state, { missionType: "travel" });
  assert.equal(suggestions.length, 1);
  assert.equal(suggestions[0].dismissible, true);
  const used = recordMemoryUse(saved.state, [saved.memory.id], "2026-07-30T00:00:00.000Z");
  const record = used.layers.budgetPreferences[0];
  assert.equal(record.useCount, 1);
  assert.equal(record.lastUsed, "2026-07-30T00:00:00.000Z");
  assert.ok(record.confidence > saved.memory.confidence);
});

test("memory management supports delete, category delete, export, pause, and resume", () => {
  const saved = rememberMemory({ consent: { permanentMemory: true } }, {
    layer: "languagePreferences",
    field: "languagePreference",
    value: "ko"
  }, { approved: true });
  const exported = exportMemory(saved.state);
  assert.equal(exported.layers.languagePreferences.length, 1);
  assert.equal(pauseMemory(saved.state).paused, true);
  assert.equal(resumeMemory(pauseMemory(saved.state)).paused, false);
  assert.equal(deleteMemory(saved.state, saved.memory.id).layers.languagePreferences.length, 0);
  assert.equal(deleteMemoryCategory(saved.state, "languagePreferences").layers.languagePreferences.length, 0);
  assert.deepEqual(deleteAllMemory(saved.state).layers.languagePreferences, []);
});

test("Universal Mission Engine consumes AI mission memory context", () => {
  const saved = rememberMemory({ consent: { permanentMemory: true } }, {
    layer: "travelPreferences",
    field: "preferredAirport",
    value: "ICN"
  }, { approved: true });
  const mission = buildUniversalMission({
    mission: "Japan trip",
    language: "en",
    aiMissionMemory: saved.state
  });
  assert.equal(mission.aiMissionMemoryContext.enabled, true);
  assert.ok(mission.aiMissionMemoryContext.applied.some(memory => memory.field === "preferredAirport"));
});

test("HOS Kernel exposes AI mission memory without executing anything", () => {
  const saved = rememberMemory({ consent: { permanentMemory: true } }, {
    layer: "transportationPreferences",
    field: "transportPreference",
    value: "subway"
  }, { approved: true });
  const kernel = createHOSKernel();
  const result = kernel.run({
    mission: "Plan a Seoul date",
    language: "en",
    aiMissionMemory: saved.state
  });
  assert.equal(result.aiMissionMemoryContext.enabled, true);
  assert.ok(result.aiMissionMemoryContext.applied.some(memory => memory.field === "transportPreference"));
  assert.equal(result.kernelStatus.executed, false);
  assert.equal(result.approvalEnvelope.approvalRequired, true);
});
