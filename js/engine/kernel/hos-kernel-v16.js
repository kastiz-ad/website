import { buildUniversalMission, classifyUniversalMission } from "../universal-mission-engine-v4.js";
import { buildHumanReasoningObject } from "../human-reasoning/human-reasoning-engine.js";
import { buildContextObject } from "../context/context-intelligence-engine-v14.js";
import { generateFutureMissionSuggestions } from "../prediction/prediction-engine-v15.js";
import { buildResolutionPlan } from "../solution/solution-operating-layer-v17.js";
import { buildTrustedActionGatewayPackage } from "../action/trusted-action-gateway-v18.js";
import { buildMissionProgress } from "../completion/mission-completion-loop-v19.js";
import { selectMissionPlaybook } from "../../mission-intelligence/mission-intelligence-registry-v21.js";
import { buildLifeMemoryContext } from "../../profile/life-memory-engine.js";

export const HOS_KERNEL_VERSION = "V16";

export const HOS_KERNEL_STAGES = Object.freeze([
  "reasoning",
  "memory",
  "context",
  "mission-intelligence",
  "prediction",
  "mission-routing",
  "solution",
  "provider-routing",
  "approval",
  "trusted-action-gateway",
  "mission-completion-loop",
  "execution-preparation"
]);

const DEFAULT_CAPABILITIES = Object.freeze({
  businessLogic: false,
  orchestrationOnly: true,
  approvalFirst: true,
  executionEnabled: false,
  externalCallsEnabled: false
});

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
const normalizeStage = (stage) => String(stage || "").trim().toLowerCase();
const normalizeEngineId = (id) => String(id || "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");

function assertHandler(handler) {
  if (typeof handler !== "function") throw new TypeError("kernel_engine_handler_required");
}

function createRegistry() {
  const engines = new Map();
  const stageIndex = new Map(HOS_KERNEL_STAGES.map((stage) => [stage, []]));

  function registerEngine(definition = {}) {
    const id = normalizeEngineId(definition.id);
    const stage = normalizeStage(definition.stage);
    if (!id) throw new Error("kernel_engine_id_required");
    if (!HOS_KERNEL_STAGES.includes(stage)) throw new Error(`kernel_unknown_stage:${stage || "missing"}`);
    assertHandler(definition.handler);
    if (engines.has(id)) throw new Error(`kernel_duplicate_engine:${id}`);

    const record = Object.freeze({
      id,
      stage,
      version: definition.version || "unversioned",
      description: definition.description || "",
      ownsBusinessLogic: definition.ownsBusinessLogic === true,
      canExecute: definition.canExecute === true,
      handler: definition.handler
    });

    engines.set(id, record);
    stageIndex.get(stage).push(record);
    return record;
  }

  return {
    registerEngine,
    getEngine(id) {
      return engines.get(normalizeEngineId(id)) || null;
    },
    enginesForStage(stage) {
      return [...(stageIndex.get(normalizeStage(stage)) || [])];
    },
    listEngines() {
      return [...engines.values()].map(({ handler, ...safe }) => safe);
    }
  };
}

function appendKernelEvent(state, event) {
  return {
    ...state,
    kernelTrace: Object.freeze([
      ...(state.kernelTrace || []),
      Object.freeze({
        at: "DEMO_TIMESTAMP",
        ...event
      })
    ])
  };
}

function mergeStageOutput(state, output = {}) {
  if (!output || typeof output !== "object") return state;
  const { kernelTrace, ...safeOutput } = output;
  return { ...state, ...safeOutput };
}

function buildApprovalEnvelope(state) {
  const mission = state.mission || {};
  return Object.freeze({
    state: "awaiting_explicit_approval",
    approvalRequired: true,
    executionEnabled: false,
    externalCallsEnabled: false,
    protectedActions: Object.freeze(["book", "buy", "reserve", "pay", "submit", "sign", "provider-contact"]),
    missionId: mission.id || state.input?.missionId || null,
    selectedMission: state.classification?.providerType || mission.providerType || null
  });
}

function buildExecutionPreparation(state) {
  return Object.freeze({
    state: "prepared_only",
    executionEnabled: false,
    readyForApprovalReview: true,
    handoffTargets: Object.freeze([
      "mission-engine",
      "provider-layer",
      "approval-engine",
      "future-execution-engine"
    ]),
    note: "V16 prepares the execution package only; it never performs external actions."
  });
}

function defaultEngines() {
  return [
    {
      id: "human-reasoning-v12",
      stage: "reasoning",
      version: "V12",
      description: "Creates a reusable reasoning object before mission routing.",
      handler(state) {
        const classification = state.classification || classifyUniversalMission(state.input?.mission);
        return {
          classification,
          humanReasoning: state.humanReasoning || buildHumanReasoningObject({
            ...state.input,
            mission: classification.mission,
            classification,
            language: state.language
          })
        };
      }
    },
    {
      id: "life-memory-v13",
      stage: "memory",
      version: "V13",
      description: "Builds structured life-domain memory context.",
      handler(state) {
        return {
          lifeMemoryContext: state.lifeMemoryContext || buildLifeMemoryContext({
            memory: state.input?.lifeMemory,
            missionType: state.classification?.providerType,
            explicitInstructions: state.classification?.mission || state.input?.mission,
            language: state.language
          })
        };
      }
    },
    {
      id: "context-intelligence-v14",
      stage: "context",
      version: "V14",
      description: "Builds one context object for downstream engines.",
      handler(state) {
        return {
          contextObject: state.contextObject || buildContextObject({
            ...state.input,
            mission: state.classification?.mission || state.input?.mission,
            classification: state.classification,
            providerType: state.classification?.providerType,
            missionType: state.classification?.providerType,
            language: state.language
          })
        };
      }
    },
    {
      id: "mission-intelligence-library-v21",
      stage: "mission-intelligence",
      version: "V21",
      description: "Selects a structured operational playbook without replacing reasoning or mission engines.",
      handler(state) {
        return {
          missionIntelligence: selectMissionPlaybook({
            ...state.input,
            mission: state.classification?.mission || state.input?.mission,
            classification: state.classification,
            humanReasoning: state.humanReasoning,
            lifeMemoryContext: state.lifeMemoryContext,
            contextObject: state.contextObject,
            language: state.language
          })
        };
      }
    },
    {
      id: "prediction-v15",
      stage: "prediction",
      version: "V15",
      description: "Prepares future mission suggestions without executing.",
      handler(state) {
        return {
          futureMissionSuggestions: state.futureMissionSuggestions || generateFutureMissionSuggestions({
            ...state.input,
            mission: state.classification?.mission || state.input?.mission,
            classification: state.classification,
            providerType: state.classification?.providerType,
            missionType: state.classification?.providerType,
            language: state.language,
            contextObject: state.contextObject
          })
        };
      }
    },
    {
      id: "universal-mission-engine-v4",
      stage: "mission-routing",
      version: "V4",
      description: "Routes to the existing Universal Mission Engine and independent mission engines.",
      ownsBusinessLogic: false,
      handler(state) {
        const mission = buildUniversalMission({
          ...state.input,
          language: state.language
        });
        return {
          mission,
          providerType: mission.providerType,
          classification: mission.classification,
          humanReasoning: mission.humanReasoning || state.humanReasoning,
          lifeMemoryContext: mission.lifeMemoryContext || state.lifeMemoryContext,
          contextObject: mission.contextObject || state.contextObject,
          futureMissionSuggestions: mission.futureMissionSuggestions || state.futureMissionSuggestions
        };
      }
    },
    {
      id: "provider-router",
      stage: "provider-routing",
      version: "V16",
      description: "Selects provider routing metadata without making external calls.",
      handler(state) {
        return {
          providerRouting: Object.freeze({
            providerType: state.providerType || state.classification?.providerType || "unknown",
            candidateCount: Array.isArray(state.mission?.providers) ? state.mission.providers.length : 0,
            liveCallsEnabled: false,
            fallbackAllowed: true
          })
        };
      }
    },
    {
      id: "solution-operating-layer-v17",
      stage: "solution",
      version: "V17",
      description: "Converts the routed mission into a reusable ResolutionPlan without execution.",
      handler(state) {
        return {
          resolutionPlan: buildResolutionPlan({
            ...state.input,
            userProblem: state.classification?.mission || state.input?.mission,
            classification: state.classification,
            missionObject: state.mission,
            humanReasoning: state.humanReasoning,
            lifeMemoryContext: state.lifeMemoryContext,
            contextObject: state.contextObject,
            futureMissionSuggestions: state.futureMissionSuggestions,
            missionIntelligence: state.missionIntelligence
          })
        };
      }
    },
    {
      id: "approval-orchestrator",
      stage: "approval",
      version: "V16",
      description: "Adds approval envelope and protected action policy.",
      handler(state) {
        return { approvalEnvelope: buildApprovalEnvelope(state) };
      }
    },
    {
      id: "trusted-action-gateway-v18",
      stage: "trusted-action-gateway",
      version: "V18",
      description: "Converts approved ResolutionPlan actions into provider-safe ActionRequests without live execution.",
      handler(state) {
        return {
          trustedActionGateway: buildTrustedActionGatewayPackage({
            resolutionPlan: state.resolutionPlan,
            actions: state.resolutionPlan?.approvalRequiredActions
          })
        };
      }
    },
    {
      id: "mission-completion-loop-v19",
      stage: "mission-completion-loop",
      version: "V19",
      description: "Tracks mission progress, detects failures, and prepares recovery without falsely marking completion.",
      handler(state) {
        return {
          missionProgress: buildMissionProgress({
            resolutionPlan: state.resolutionPlan,
            trustedActionGateway: state.trustedActionGateway,
            events: state.input?.missionEvents || [],
            now: state.input?.now
          })
        };
      }
    },
    {
      id: "execution-preparation-orchestrator",
      stage: "execution-preparation",
      version: "V16",
      description: "Prepares execution package only after approval review remains pending.",
      handler(state) {
        return { executionPreparation: buildExecutionPreparation(state) };
      }
    }
  ];
}

export function createHOSKernel(options = {}) {
  const registry = createRegistry();
  const config = Object.freeze({
    version: HOS_KERNEL_VERSION,
    stages: HOS_KERNEL_STAGES,
    capabilities: DEFAULT_CAPABILITIES,
    allowBusinessLogicInKernel: false,
    maxFutureDomains: options.maxFutureDomains || 500
  });

  for (const engine of defaultEngines()) registry.registerEngine(engine);
  for (const engine of options.engines || []) registry.registerEngine(engine);

  function registerEngine(definition) {
    return registry.registerEngine(definition);
  }

  function validateRegistry() {
    const engines = registry.listEngines();
    const missingStages = HOS_KERNEL_STAGES.filter((stage) => registry.enginesForStage(stage).length === 0);
    const unsafeEngines = engines.filter((engine) => engine.canExecute || engine.ownsBusinessLogic && engine.stage !== "mission-routing");
    return Object.freeze({
      valid: missingStages.length === 0 && unsafeEngines.length === 0,
      missingStages: Object.freeze(missingStages),
      unsafeEngines: Object.freeze(unsafeEngines),
      engineCount: engines.length
    });
  }

  function run(input = {}) {
    const language = ["en", "ko", "es"].includes(input.language) ? input.language : "en";
    let state = Object.freeze({
      kernel: Object.freeze(config),
      input: clone(input),
      language,
      kernelTrace: Object.freeze([])
    });

    for (const stage of HOS_KERNEL_STAGES) {
      const engines = registry.enginesForStage(stage);
      state = appendKernelEvent(state, { stage, event: "stage_started", engineCount: engines.length });
      for (const engine of engines) {
        const output = engine.handler(state) || {};
        state = mergeStageOutput(state, output);
        state = appendKernelEvent(state, {
          stage,
          engineId: engine.id,
          version: engine.version,
          event: "engine_completed"
        });
      }
      state = appendKernelEvent(state, { stage, event: "stage_completed" });
    }

    return Object.freeze({
      ...state,
      kernelStatus: Object.freeze({
        state: "prepared",
        orchestrationOnly: true,
        approvalFirst: true,
        executed: false,
        registry: validateRegistry()
      })
    });
  }

  return Object.freeze({
    version: HOS_KERNEL_VERSION,
    config,
    registerEngine,
    validateRegistry,
    listEngines: registry.listEngines,
    run
  });
}

export const HOSKernel = createHOSKernel();
