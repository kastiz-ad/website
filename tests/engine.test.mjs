import assert from "node:assert/strict";
import { classifyMission } from "../js/engine/mission-classification.js";
import { approvalPolicy, IRREVERSIBLE_ACTIONS } from "../js/engine/approval.js";
import { executeAction } from "../js/engine/execution.js";

assert.equal(classifyMission("Plan my Japan trip"), "travel");
assert.equal(classifyMission("일본 여행 계획해줘"), "travel");
assert.equal(classifyMission("Buy the best laptop"), "shopping");

for (const action of IRREVERSIBLE_ACTIONS) {
  let called = false;
  await assert.rejects(
    executeAction({ action, approval: approvalPolicy("en"), perform: () => { called = true; } }),
    /Approval required/
  );
  assert.equal(called, false, `${action} must not run before approval`);
}

let performed = false;
await executeAction({
  action: "pay",
  approval: { required: true, approved: true },
  perform: () => { performed = true; }
});
assert.equal(performed, true);
console.log("engine checks passed");


