const baseForbidden = Object.freeze([
  "Do not claim live availability unless verified.",
  "Do not invent prices, rankings, government requirements, medical diagnosis, legal certainty, or provider capabilities.",
  "Do not request raw card, CVV, bank, password, OTP, or unrestricted authentication data."
]);

export function createMissionPlaybook(config = {}) {
  return Object.freeze({
    version: "V21",
    supportedLanguages: Object.freeze(["en", "ko", "es"]),
    regionScope: Object.freeze({ levels: Object.freeze(["global"]), countries: Object.freeze(["*"]) }),
    prerequisites: Object.freeze(["Use V12 reasoning, V13 memory, V14 context, V17 ResolutionPlan, V18 approval-safe ActionRequests."]),
    knownContextFields: Object.freeze(["currentLocation", "language", "budget", "schedule", "memory", "previousMissions"]),
    optionalContextFields: Object.freeze(["weather", "calendar", "family", "travelState", "providerData"]),
    essentialQuestions: Object.freeze([]),
    questionsToAvoid: Object.freeze(["Do not ask for information already supplied.", "Do not ask low-value preferences before preparing a provisional solution."]),
    urgencyRules: Object.freeze(["Classify routine, time-sensitive, urgent, or emergency where relevant."]),
    safetyRules: Object.freeze(["Escalate safety-critical cases. Do not provide diagnosis or legal certainty."]),
    officialSourceRequirements: Object.freeze(["Use official or provider-verified sources when requirements, opening hours, or regulated actions matter."]),
    providerRequirements: Object.freeze(["Provider facts must be labeled live, verified, official, cached, estimated, fallback, mock, or unavailable."]),
    providerCapabilityRequirements: Object.freeze(["service area", "verified capability", "availability evidence", "language support where relevant"]),
    solutionPaths: Object.freeze([]),
    recommendedDefaultPath: "",
    alternativePaths: Object.freeze([]),
    dependencies: Object.freeze(["explicit approval before external commitment"]),
    actionTemplates: Object.freeze(["prepare", "compare", "approval-review"]),
    approvalBoundaries: Object.freeze(["booking", "purchase", "payment", "provider contact", "application", "submission", "signature"]),
    authenticationBoundaries: Object.freeze(["Trusted provider handles authentication, payment, official login, and regulated transactions."]),
    evidenceRequirements: Object.freeze(["availability:unavailable unless verified", "price:estimated unless verified", "provider:mock/fallback unless connected"]),
    dataFreshnessRequirements: Object.freeze(["live", "verified", "official", "cached", "estimated", "fallback", "mock", "unavailable"]),
    fallbackRules: Object.freeze(["If provider path fails, use approved fallback or ask one essential decision."]),
    recoveryRules: Object.freeze(["Do not restart mission; preserve completed steps and recover failed component."]),
    completionCriteria: Object.freeze(["User intended outcome is verified or user explicitly closes the mission."]),
    userEffortReductionRules: Object.freeze(["Prepare a provisional solution before asking optional questions.", "Bundle essential decisions."]),
    responseCompressionRules: Object.freeze(["Lead with prepared solution.", "Avoid long explanations and generic chatbot filler."]),
    forbiddenClaims: baseForbidden,
    benchmarkScenarios: Object.freeze([]),
    maintenanceMetadata: Object.freeze({ owner: "Kastiz ONE", lastReviewed: "2026-07-26", reviewCycle: "monthly" }),
    ...config,
    supportedIntents: Object.freeze(config.supportedIntents || []),
    problemPatterns: Object.freeze(config.problemPatterns || []),
    outcomePatterns: Object.freeze(config.outcomePatterns || []),
    solutionPaths: Object.freeze(config.solutionPaths || []),
    alternativePaths: Object.freeze(config.alternativePaths || []),
    providerCapabilityRequirements: Object.freeze(config.providerCapabilityRequirements || ["service area", "verified capability", "availability evidence"]),
    benchmarkScenarios: Object.freeze(config.benchmarkScenarios || []),
    forbiddenClaims: Object.freeze([...(config.forbiddenClaims || []), ...baseForbidden])
  });
}
