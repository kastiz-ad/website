import { createMissionPlaybook } from "../playbook-factory-v21.js";
export default createMissionPlaybook({
  playbookId: "travel/japan-trip", domain: "travel", missionType: "international-trip",
  supportedIntents: ["japan trip", "일본 여행", "viaje a japón"], problemPatterns: ["japan", "일본", "tokyo", "osaka", "kyoto"], outcomePatterns: ["travel prepared", "trip ready"],
  essentialQuestions: ["Dates only if not safely inferable", "Destination city only if ambiguous"],
  providerCapabilityRequirements: ["airline route", "hotel location", "cancellation policy", "local transport", "connectivity", "insurance option", "price-change evidence"],
  solutionPaths: ["balanced flight/hotel/itinerary path", "budget-first path", "comfort-first path"],
  recommendedDefaultPath: "balanced flight/hotel/itinerary path", alternativePaths: ["budget-first path", "comfort-first path"],
  dependencies: ["destination", "dates", "passport/visa verification", "provider price verification", "approval before booking"],
  actionTemplates: ["prepare flight options", "prepare hotel options", "prepare local transport", "prepare itinerary", "approval review"],
  recoveryRules: ["If flight price changes, require renewed approval.", "If hotel unavailable, keep trip plan and swap accommodation."],
  completionCriteria: ["Round-trip and stay verified or user closes travel mission."], benchmarkScenarios: ["family-trip"]
});
