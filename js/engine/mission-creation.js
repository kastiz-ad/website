import { classifyMission, missionCategoryFor, normalizeMissionText } from "./mission-classification.js";
import { buildMissionBriefing, createWorkMissionFoundation } from "./work-mission-foundation.js";
import { approvalPolicy } from "./approval.js";
import { selectMissionPack } from "../providers/mission-router.js";
import { buildMissionContext } from "./context/mission-context-intelligence.js";

export function createMission(rawInput, options = {}) {
  const input = normalizeMissionText(rawInput);
  const language = ["en", "ko", "es"].includes(options.language) ? options.language : "en";
  const context = buildMissionContext(input, { ...options, language });
  const type = classifyMission(input);
  const missionPack = selectMissionPack(type);
  const foundation = createWorkMissionFoundation(type, { ...options, rawInput: input, desiredOutcome: input });
  return {
    id: `mission-${Date.now()}`,
    version: "V9_MISSION_ENGINE_FREE_API_MVP",
    rawInput: input,
    type,
    missionType: type,
    missionCategory: missionCategoryFor(type),
    missionPack: missionPack.id,
    requestedCapabilities: [...missionPack.capabilities],
    context,
    language,
    status: foundation?.status || "draft",
    missionFoundation: foundation,
    missionBriefing: buildMissionBriefing(foundation),
    approvalProtection: approvalPolicy(language),
    createdAt: new Date().toISOString()
  };
}


