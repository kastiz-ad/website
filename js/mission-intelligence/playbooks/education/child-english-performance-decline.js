import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "education/child-english-performance-decline", domain: "education", missionType: "child-performance-support",
  supportedIntents: ["english grades falling", "영어 성적", "child study support"], problemPatterns: ["성적", "english", "grades", "떨어"], outcomePatterns: ["improve performance", "study support"],
  essentialQuestions: ["Student grade level if unknown", "Exam goal or weak area if known"],
  questionsToAvoid: ["Do not ask child's full name.", "Do not ask every school detail before preparing paths."],
  providerCapabilityRequirements: ["grade support", "school exam focus", "homework level", "class size", "schedule", "travel time", "language support"],
  solutionPaths: ["study pattern review without diagnosis", "academy path", "tutor path", "four-week study plan", "teacher/school discussion"],
  recommendedDefaultPath: "study pattern review plus academy/tutor comparison", alternativePaths: ["academy path", "tutor path", "home-study plan"],
  forbiddenClaims: ["Do not diagnose learning or medical conditions."],
  completionCriteria: ["Support path selected and first learning checkpoint scheduled."], benchmarkScenarios: ["child-school-struggle"]
});
