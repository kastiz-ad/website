import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "healthcare/cancer-center-navigation", domain: "healthcare", missionType: "cancer-center-navigation",
  supportedIntents: ["cancer center", "암 진료", "university hospital"], problemPatterns: ["암", "cancer", "university hospital", "대학병원"], outcomePatterns: ["cancer care navigation"],
  essentialQuestions: ["Cancer type only if it changes department routing", "Diagnosis/second opinion/treatment/transfer intent if unclear"],
  providerCapabilityRequirements: ["university hospital capability", "cancer center capability", "specialty department", "referral requirements", "document requirements", "language support"],
  solutionPaths: ["university hospital navigation", "second-opinion path", "treatment-transfer path"],
  recommendedDefaultPath: "university hospital navigation", alternativePaths: ["second-opinion path", "treatment-transfer path"],
  forbiddenClaims: ["Do not rank hospitals as best without evidence.", "Do not diagnose."],
  completionCriteria: ["Hospital navigation path and required documents prepared."], benchmarkScenarios: ["cancer-center-navigation"]
});
