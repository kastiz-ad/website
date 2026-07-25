import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "business/start-company-korea", domain: "business", missionType: "company-formation-korea",
  supportedIntents: ["start company korea", "한국에서 회사", "foreign founder korea"], problemPatterns: ["회사", "사업자", "법인", "company", "business"], outcomePatterns: ["company formation prepared"],
  essentialQuestions: ["Founder residency/visa status", "Business structure if known"],
  providerCapabilityRequirements: ["official registration", "tax/accounting", "banking via trusted systems", "office/address", "professional support", "immigration dependency"],
  solutionPaths: ["official registration path", "tax/accounting provider path", "foreign-founder dependency path"],
  recommendedDefaultPath: "official registration path", alternativePaths: ["professional-assisted path", "visa-first path"],
  forbiddenClaims: ["No unsupported legal certainty."],
  completionCriteria: ["Official channel and professional-support steps separated and approved."], benchmarkScenarios: ["korean-company-formation"]
});
