import test from "node:test";
import assert from "node:assert/strict";
import {
  buildLifeMemoryContext,
  clearLifeDomain,
  createLifeMemory,
  deleteLifeMemoryEntry,
  exportLifeMemorySummary,
  LIFE_DOMAINS,
  updateLifeMemory
} from "../js/profile/life-memory-engine.js";
import { buildUniversalMission } from "../js/engine/universal-mission-engine-v4.js";

test("V13 organizes memory into Life Domains instead of feature-specific storage", () => {
  const memory = createLifeMemory({ consent: { enabled: true } });

  for (const domain of ["travel", "healthcare", "education", "sports", "career", "family", "pets", "finance", "vehicles", "government"]) {
    assert.ok(LIFE_DOMAINS.includes(domain));
    assert.deepEqual(memory.domains[domain], {});
  }
});

test("V13 stores structured multilingual preferences and explains why they are used", () => {
  const saved = updateLifeMemory(createLifeMemory({ consent: { enabled: true } }), {
    domain: "travel",
    field: "seatPreference",
    value: { en: "Aisle", ko: "통로 좌석", es: "Pasillo" },
    language: "ko",
    sourceMissionId: "mission-1",
    reason: "User confirmed this travel preference."
  });

  assert.equal(saved.updated, true);
  const context = buildLifeMemoryContext({
    memory: saved.memory,
    missionType: "travel",
    language: "ko"
  });

  assert.equal(context.entriesUsed[0].value, "통로 좌석");
  assert.match(context.entriesUsed[0].whyUsed, /User confirmed|선호|질문/);
  assert.equal(context.approvalRequired, true);
  assert.equal(context.executionEnabled, false);
});

test("V13 memory is editable through update, delete and clear operations", () => {
  const initial = createLifeMemory({ consent: { enabled: true } });
  const first = updateLifeMemory(initial, { domain: "education", field: "subject", value: "English", consent: true }).memory;
  const second = updateLifeMemory(first, { domain: "education", field: "subject", value: "Math", consent: true }).memory;

  assert.equal(buildLifeMemoryContext({ memory: second, missionType: "education" }).entriesUsed[0].value, "Math");

  const deleted = deleteLifeMemoryEntry(second, "education", "subject");
  assert.equal(buildLifeMemoryContext({ memory: deleted, missionType: "education" }).entriesUsed.length, 0);

  const withTwo = updateLifeMemory(updateLifeMemory(deleted, { domain: "education", field: "level", value: "Middle school", consent: true }).memory, { domain: "education", field: "format", value: "Offline", consent: true }).memory;
  assert.equal(buildLifeMemoryContext({ memory: withTwo, missionType: "education" }).entriesUsed.length, 2);
  assert.equal(buildLifeMemoryContext({ memory: clearLifeDomain(withTwo, "education"), missionType: "education" }).entriesUsed.length, 0);
});

test("V13 never stores chat history or sensitive fields", () => {
  const memory = createLifeMemory({ consent: { enabled: true } });
  const passport = updateLifeMemory(memory, { domain: "travel", field: "passportNumber", value: "M123456", consent: true });
  const rawChat = updateLifeMemory(memory, { domain: "travel", field: "rawChatHistory", value: "full transcript", consent: true });
  const health = updateLifeMemory(memory, { domain: "healthcare", field: "diagnosis", value: "private medical detail", consent: true });

  assert.equal(passport.updated, false);
  assert.equal(rawChat.updated, false);
  assert.equal(health.updated, false);
  assert.equal(exportLifeMemorySummary(passport.memory).length, 0);
});

test("V13 memory never overrides explicit user instructions", () => {
  const memory = updateLifeMemory(createLifeMemory({ consent: { enabled: true } }), {
    domain: "travel",
    field: "seatPreference",
    value: "Aisle",
    consent: true
  }).memory;

  const context = buildLifeMemoryContext({
    memory,
    missionType: "travel",
    explicitInstructions: "Do not use my saved aisle seat preference this time.",
    language: "en"
  });

  assert.equal(context.explicitInstructionsOverrideMemory, true);
  assert.equal(context.entriesUsed.length, 0);
  assert.equal(context.entriesAvailable.length, 1);
});

test("V13 can be consumed by every Mission Engine through the Universal Mission Engine", () => {
  const lifeMemory = updateLifeMemory(createLifeMemory({ consent: { enabled: true } }), {
    domain: "education",
    field: "learningStyle",
    value: "gentle teacher, not too much homework",
    consent: true
  }).memory;

  const mission = buildUniversalMission({
    mission: "Find an English academy near Incheon this week",
    language: "en",
    lifeMemory
  });

  assert.equal(mission.lifeMemoryContext.version, "V13");
  assert.equal(mission.lifeMemoryContext.domain, "education");
  assert.equal(mission.lifeMemoryContext.entriesUsed.length, 1);
  assert.match(mission.lifeMemoryContext.entriesUsed[0].whyUsed, /Education preference|reduce unnecessary questions/i);
  assert.equal(mission.lifeMemoryContext.executionEnabled, false);
});

test("V13 requires consent before updating memory", () => {
  const result = updateLifeMemory(createLifeMemory(), {
    domain: "finance",
    field: "budgetStyle",
    value: "balanced"
  });

  assert.equal(result.updated, false);
  assert.equal(result.reason, "consent_required");
});
