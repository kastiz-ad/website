import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "events/date-plan", domain: "events", missionType: "date-plan",
  supportedIntents: ["date plan", "주말 데이트", "plan de cita"], problemPatterns: ["date", "데이트", "girlfriend", "boyfriend", "여친"], outcomePatterns: ["complete date plan"],
  essentialQuestions: ["Location only if not inferable", "Hard budget only if necessary"],
  providerCapabilityRequirements: ["location fit", "weather backup", "transport", "food preferences", "reservation requirement", "prior context"],
  solutionPaths: ["complete time-sequenced date plan", "rainy-day indoor path", "reservation-light path"],
  recommendedDefaultPath: "complete time-sequenced date plan", alternativePaths: ["rainy-day indoor path", "reservation-light path"],
  completionCriteria: ["Date plan selected and reservation actions approved if needed."], benchmarkScenarios: ["date-planning"]
});
