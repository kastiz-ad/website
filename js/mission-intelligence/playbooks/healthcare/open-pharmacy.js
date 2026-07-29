import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "healthcare/open-pharmacy", domain: "healthcare", missionType: "open-pharmacy-navigation",
  supportedIntents: ["open pharmacy tonight", "문 연 약국", "farmacia abierta"], problemPatterns: ["pharmacy", "약국", "문 연", "tonight"], outcomePatterns: ["pharmacy route"],
  essentialQuestions: ["Current location if unknown"],
  officialSourceRequirements: ["Opening hours require live or official evidence."],
  providerCapabilityRequirements: ["verified opening hours", "service area", "emergency alternative", "official source"],
  solutionPaths: ["official open-pharmacy check", "emergency pharmacy fallback", "nearby hospital pharmacy fallback"],
  recommendedDefaultPath: "official open-pharmacy check", alternativePaths: ["emergency pharmacy fallback"],
  forbiddenClaims: ["Never invent open status."],
  completionCriteria: ["Open status verified or emergency fallback selected."], benchmarkScenarios: ["open-pharmacy"]
});
