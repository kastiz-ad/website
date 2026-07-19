import { classifyMission, normalizeMissionText } from "./mission-classification.js";
import { approvalPolicy } from "./approval.js";
import { selectMissionPack } from "../providers/mission-router.js";
import { buildMissionContext } from "./context/mission-context-intelligence.js";

export function createMission(rawInput, options = {}) {
  const input = normalizeMissionText(rawInput);
  const language = ["en", "ko", "es"].includes(options.language) ? options.language : "en";
  const context = buildMissionContext(input, { ...options, language });
  const type = classifyMission(input);
  const missionPack = selectMissionPack(type);
  return {
    id: `mission-${Date.now()}`,
    version: "V9_MISSION_ENGINE_FREE_API_MVP",
    rawInput: input,
    type,
    missionPack: missionPack.id,
    requestedCapabilities: [...missionPack.capabilities],
    context,
    language,
    status: "draft",
    approvalProtection: approvalPolicy(language),
    createdAt: new Date().toISOString()
  };
}


