import test from "node:test";
import assert from "node:assert/strict";
import { createHOSKernel, HOS_KERNEL_STAGES, HOS_KERNEL_VERSION } from "../js/engine/kernel/hos-kernel-v16.js";

test("V16 registers every required orchestration stage", () => {
  const kernel = createHOSKernel();
  const validation = kernel.validateRegistry();
  assert.equal(kernel.version, HOS_KERNEL_VERSION);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.missingStages, []);
  assert.deepEqual(HOS_KERNEL_STAGES, [
    "reasoning",
    "memory",
    "context",
    "prediction",
    "mission-routing",
    "solution",
    "provider-routing",
    "approval",
    "execution-preparation"
  ]);
});

test("V16 coordinates V12, V13, V14, V15 and mission routing without execution", () => {
  const kernel = createHOSKernel();
  const result = kernel.run({
    mission: "Passport renewal before family trip",
    language: "en",
    lifeMemory: {
      consent: { enabled: true },
      domains: {
        government: { renewalMonth: { value: { en: "2026-09" }, userConfirmed: true } },
        travel: { departureAirport: { value: { en: "ICN" }, userConfirmed: true } },
        healthcare: { preferredArea: { value: { en: "Gangnam" }, userConfirmed: true } },
        education: { level: { value: { en: "elementary school" }, userConfirmed: true } }
      }
    },
    calendarEvents: ["Dad birthday", "School registration"],
    vehicle: { inspectionDue: "2026-08-01" },
    business: { renewalDue: "2026-09-10" },
    previousMissions: [{ type: "travel", destination: "Japan", international: true }]
  });

  assert.equal(result.kernelStatus.orchestrationOnly, true);
  assert.equal(result.kernelStatus.executed, false);
  assert.equal(result.classification.providerType, "government");
  assert.ok(result.humanReasoning);
  assert.ok(result.lifeMemoryContext);
  assert.ok(result.contextObject);
  assert.ok(result.futureMissionSuggestions.suggestions.some((item) => item.type === "passport-renewal"));
  assert.equal(result.approvalEnvelope.executionEnabled, false);
  assert.equal(result.executionPreparation.executionEnabled, false);
});

test("V16 kernel accepts future domain engines by registration instead of redesign", () => {
  const kernel = createHOSKernel({
    engines: [{
      id: "future-pet-domain",
      stage: "context",
      version: "future",
      description: "Example future life-domain context",
      handler(state) {
        return { futurePetDomainSeen: state.input?.petName || "not-set" };
      }
    }]
  });

  const result = kernel.run({ mission: "Find a vet", petName: "Mochi" });
  assert.equal(result.futurePetDomainSeen, "Mochi");
  assert.equal(kernel.validateRegistry().valid, true);
});

test("V16 rejects unsafe or unknown kernel registrations", () => {
  const kernel = createHOSKernel();
  assert.throws(() => kernel.registerEngine({
    id: "bad-stage",
    stage: "random",
    handler() {}
  }), /kernel_unknown_stage/);
  assert.throws(() => kernel.registerEngine({
    id: "missing-handler",
    stage: "context"
  }), /kernel_engine_handler_required/);
});

test("V16 keeps approval-first routing in Korean and Spanish missions", () => {
  const ko = createHOSKernel().run({ mission: "여권 갱신 준비", language: "ko" });
  const es = createHOSKernel().run({ mission: "Preparar viaje a Lima", language: "es" });
  assert.equal(ko.approvalEnvelope.approvalRequired, true);
  assert.equal(es.approvalEnvelope.approvalRequired, true);
  assert.equal(ko.executionPreparation.state, "prepared_only");
  assert.equal(es.executionPreparation.state, "prepared_only");
});
