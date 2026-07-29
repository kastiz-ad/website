import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "immigration/move-to-korea", domain: "immigration", missionType: "korea-settlement",
  supportedIntents: ["move to korea", "한국으로 이사", "mudarse a corea"], problemPatterns: ["move to korea", "한국으로", "settle in korea"], outcomePatterns: ["settlement plan"],
  essentialQuestions: ["Nationality/visa status only because eligibility changes path"],
  providerCapabilityRequirements: ["visa support", "housing", "SIM/phone", "banking via trusted providers", "insurance", "resident administration", "language education"],
  solutionPaths: ["visa and immigration path", "housing and banking path", "settlement checklist"],
  recommendedDefaultPath: "staged settlement checklist", alternativePaths: ["visa-first path", "housing-first path"],
  forbiddenClaims: ["No legal certainty without official/professional verification."],
  completionCriteria: ["Settlement checklist staged and first approved action selected."], benchmarkScenarios: ["foreigner-settlement"]
});
