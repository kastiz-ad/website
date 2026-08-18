import test from "node:test";
import assert from "node:assert/strict";
import { classifyMission, missionCategoryFor } from "../js/engine/mission-classification.js";
import { createMission } from "../js/engine/mission-creation.js";
import { buildMissionBriefing, createWorkMissionFoundation, recordRehearsalAttempt } from "../js/engine/work-mission-foundation.js";

const cases = [
  ["Prepare me for tomorrow's presentation.", "presentation"],
  ["Prepare me for my investor meeting tomorrow.", "meeting"],
  ["I have an interview tomorrow. Prepare me.", "interview"],
  ["Help me pass TOPIK 4.", "learning"]
];

test("work missions classify before broad legacy categories", () => {
  for (const [input, expected] of cases) assert.equal(classifyMission(input), expected);
  assert.equal(missionCategoryFor("presentation"), "work");
  assert.equal(missionCategoryFor("learning"), "learning");
  assert.equal(classifyMission("Plan my trip to Tokyo."), "travel");
});

test("presentation mission prepares deliverables without external execution", () => {
  const mission = createWorkMissionFoundation("presentation", { rawInput: "Prepare my pitch", topic: "ONE", audience: "Investors", duration: "10 minutes" });
  assert.equal(mission.status, "Preparing");
  assert.equal(mission.executionState, "preparation-only");
  assert.equal(mission.approvalRequirements.length, 0);
  assert.ok(mission.preparedArtifacts.some((item) => item.name === "Speaker notes"));
  assert.equal(buildMissionBriefing(mission).primaryAction, "Start rehearsal");
});

test("missing inputs remain explicit and rehearsal progress is session-safe", () => {
  const mission = createWorkMissionFoundation("interview", { role: "Designer" });
  assert.deepEqual(mission.missingInputs, ["company", "interviewFormat"]);
  const next = recordRehearsalAttempt(mission.rehearsalState, { prompt: "Tell me about yourself", score: 4 });
  assert.equal(next.currentStep, 1);
  assert.equal(next.attempts.length, 1);
});

test("shared createMission adds work foundation while preserving travel", () => {
  const work = createMission("Prepare me for tomorrow's presentation.", { topic: "ONE", audience: "Investors", duration: "10 minutes" });
  assert.equal(work.missionCategory, "work");
  assert.equal(work.missionBriefing.status, "READY TO PRACTICE");
  const travel = createMission("Plan my Japan trip");
  assert.equal(travel.type, "travel");
  assert.equal(travel.missionFoundation, null);
});
