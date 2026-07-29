import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "professional-services/immigration-lawyer", domain: "professional-services", missionType: "immigration-lawyer",
  supportedIntents: ["immigration lawyer", "이민 전문 변호사", "abogado de inmigración"], problemPatterns: ["immigration lawyer", "이민", "변호사", "lawyer"], outcomePatterns: ["consultation prepared"],
  essentialQuestions: ["Jurisdiction and matter only if not inferable"],
  providerCapabilityRequirements: ["legal specialty", "jurisdiction", "language support", "consultation method", "verified professional status", "fee structure when supported", "conflict-check"],
  solutionPaths: ["consultation preparation", "provider comparison", "official/professional verification"],
  recommendedDefaultPath: "consultation preparation", alternativePaths: ["provider comparison"],
  forbiddenClaims: ["Do not invent rankings.", "No legal certainty."],
  completionCriteria: ["Consultation path selected and contact approved."], benchmarkScenarios: ["immigration-lawyer"]
});
