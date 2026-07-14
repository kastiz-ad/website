import assert from "node:assert/strict";
import { classifyMission } from "../js/engine/mission-classification.js";
import { approvalPolicy, IRREVERSIBLE_ACTIONS } from "../js/engine/approval.js";
import { executeAction } from "../js/engine/execution.js";
import { fetchProviderResult } from "../js/engine/providers.js";
import { authenticationEnabled } from "../js/config/authentication.js";
import { paymentsEnabled } from "../js/config/commerce.js";
import { documentVaultEnabled, externalAutofillEnabled, profileMemoryEnabled, providerDataSharingEnabled, sensitiveProfileEnabled } from "../js/config/profile-memory.js";
import { analyticsEnabled, cloudflareAnalyticsEnabled, founderDashboardEnabled, googleAnalyticsEnabled, rawMissionTextTracking, sensitiveAnalyticsTracking } from "../js/config/analytics.js";
import { DISCLOSURE_VERSION, DISCLOSURE_VERSION_KEY } from "../js/ui/disclosure.js";

assert.equal(classifyMission("Plan my Japan trip"), "travel");
assert.equal(classifyMission("일본 여행 계획해줘"), "travel");
assert.equal(classifyMission("Buy the best laptop"), "shopping");
assert.equal(classifyMission("Find me an English tutor."), "tutoring");
assert.equal(classifyMission("Find me a trusted babysitter nearby."), "childcare");
assert.equal(classifyMission("Find me an English language-exchange partner."), "language_exchange");
assert.equal(classifyMission("Help me move to Korea."), "moving");
assert.equal(classifyMission("영어 선생님을 찾아줘."), "tutoring");
assert.equal(classifyMission("가까운 곳에서 믿을 수 있는 베이비시터를 찾아줘."), "childcare");
assert.equal(classifyMission("한국에서 사업 시작을 도와줘."), "business");
assert.equal(paymentsEnabled, false);
assert.equal(profileMemoryEnabled, true);
assert.equal(sensitiveProfileEnabled, false);
assert.equal(documentVaultEnabled, false);
assert.equal(externalAutofillEnabled, false);
assert.equal(providerDataSharingEnabled, false);
assert.equal(analyticsEnabled, true);
assert.equal(googleAnalyticsEnabled, true);
assert.equal(cloudflareAnalyticsEnabled, false);
assert.equal(founderDashboardEnabled, true);
assert.equal(rawMissionTextTracking, false);
assert.equal(sensitiveAnalyticsTracking, false);
assert.equal(authenticationEnabled, false);
assert.equal(DISCLOSURE_VERSION, "1.0");
assert.equal(DISCLOSURE_VERSION_KEY, "kastiz-one-disclosure-version");

const fallback = await fetchProviderResult({ provider: "Test Provider", category: "test", url: "https://invalid.test", fallbackItems: [{ demo: true }], options: { retries: 0, fetchImpl: async () => { throw new Error("offline"); } } });
assert.equal(fallback.sourceStatus, "fallback_demo");
assert.equal(fallback.liveData, false);
assert.equal(fallback.items.length, 1);
assert.ok(fallback.retrievedAt);

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


