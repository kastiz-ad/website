import { classifyMission, normalizeMissionText } from "./mission-classification.js";
import { approvalPolicy } from "./approval.js";

export function createMission(rawInput, options = {}) {
  const input = normalizeMissionText(rawInput);
  const language = options.language === "ko" ? "ko" : "en";
  return {
    id: `mission-${Date.now()}`,
    version: "V9_MISSION_ENGINE_FREE_API_MVP",
    rawInput: input,
    type: classifyMission(input),
    language,
    status: "draft",
    approvalProtection: approvalPolicy(language),
    createdAt: new Date().toISOString()
  };
}


