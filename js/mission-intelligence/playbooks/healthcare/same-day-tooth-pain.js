import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "healthcare/same-day-tooth-pain", domain: "healthcare", missionType: "urgent-dental-navigation",
  supportedIntents: ["tooth pain today", "이가 너무 아픈데", "dolor dental"], problemPatterns: ["tooth", "이가", "치과", "dental", "아픈"], outcomePatterns: ["same-day dental care navigation"],
  essentialQuestions: ["Emergency warning signs only", "Service area if unknown"],
  urgencyRules: ["Classify routine, urgent, or emergency.", "Escalate swelling, fever, breathing/swallowing trouble, uncontrollable bleeding."],
  safetyRules: ["Do not diagnose.", "Emergency warning signs require emergency care guidance."],
  providerCapabilityRequirements: ["dental specialty", "same-day availability only if verified", "emergency capability", "language support", "insurance handling", "accessibility"],
  solutionPaths: ["same-day dental navigation", "urgent/emergency escalation", "after-hours fallback"],
  recommendedDefaultPath: "same-day dental navigation", alternativePaths: ["urgent/emergency escalation", "after-hours fallback"],
  forbiddenClaims: ["Do not invent current openings.", "Do not diagnose."],
  completionCriteria: ["Care route selected or emergency escalation completed."], benchmarkScenarios: ["same-day-dental-pain"]
});
