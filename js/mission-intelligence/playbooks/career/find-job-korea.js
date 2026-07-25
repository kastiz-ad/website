import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "career/find-job-korea", domain: "career", missionType: "korea-job-search",
  supportedIntents: ["find job korea", "한국에서 일자리", "trabajo en corea"], problemPatterns: ["job", "일자리", "취업", "career"], outcomePatterns: ["job search prepared"],
  essentialQuestions: ["Visa status, target role, language level, and salary only if unknown"],
  providerCapabilityRequirements: ["role fit", "skills", "language", "location", "visa status", "salary", "resume", "job platform"],
  solutionPaths: ["resume/profile path", "job platform shortlist", "interview preparation"],
  actionTemplates: ["Map skills, visa, language, salary, and location constraints", "Prepare Resume/Profile path", "Shortlist Job platform channels", "Prepare Interview sequence", "approval review"],
  recommendedDefaultPath: "resume/profile path", alternativePaths: ["job platform shortlist", "interview preparation"],
  completionCriteria: ["Application plan prepared and approved before applying."], benchmarkScenarios: ["job-search"]
});
