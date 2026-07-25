import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "home-services/sink-leak", domain: "home-services", missionType: "urgent-plumbing",
  supportedIntents: ["sink leak", "싱크대 물이 새", "plumbing leak"], problemPatterns: ["sink", "leak", "싱크", "누수", "물이 새"], outcomePatterns: ["leak stopped", "repair scheduled"],
  essentialQuestions: ["Severity and service area only if not inferable"],
  safetyRules: ["Turn off nearby valve if safe.", "Move electronics and valuables.", "Document damage."],
  providerCapabilityRequirements: ["plumbing category", "emergency response", "service area", "quote method", "license/certification where relevant", "warranty/follow-up"],
  solutionPaths: ["immediate damage control", "plumber provider path", "landlord/building manager fallback"],
  recommendedDefaultPath: "immediate damage control", alternativePaths: ["plumber provider path", "building manager fallback"],
  completionCriteria: ["Leak contained and repair completed or scheduled."], benchmarkScenarios: ["urgent-home-repair"]
});
