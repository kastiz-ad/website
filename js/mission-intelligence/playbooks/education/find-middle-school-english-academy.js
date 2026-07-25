import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "education/find-middle-school-english-academy", domain: "education", missionType: "academy-finder",
  supportedIntents: ["find english academy", "중학생 영어 내신 학원", "academia de inglés"], problemPatterns: ["학원", "academy", "내신", "middle school"], outcomePatterns: ["academy shortlist"],
  essentialQuestions: ["Exact neighborhood only if not inferable", "Homework preference only if it materially changes shortlist"],
  providerCapabilityRequirements: ["student grade", "subject", "school-exam preparation", "class size", "homework level", "travel time", "schedule", "verified program type"],
  solutionPaths: ["nearby exam-focused academy shortlist", "lower-homework academy path", "tutor-plus-academy hybrid"],
  recommendedDefaultPath: "nearby exam-focused academy shortlist", alternativePaths: ["lower-homework academy path", "tutor-plus-academy hybrid"],
  completionCriteria: ["Academy path selected or trial consultation approved."], benchmarkScenarios: ["academy-selection"]
});
