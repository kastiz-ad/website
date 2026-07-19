const normalize = (value) => String(value || "").trim().toLowerCase();

export function buildExperienceVault(input = {}) {
  const completed = (input.completedExperiences || input.previousExperiences || []).map(normalize).filter(Boolean);
  const rejected = (input.rejectedExperiences || []).map(normalize).filter(Boolean);
  return Object.freeze({
    completed: Object.freeze([...new Set(completed)]),
    rejected: Object.freeze([...new Set(rejected)]),
    has(value) {
      const candidate = normalize(value);
      return [...completed, ...rejected].some((stored) => stored.includes(candidate) || candidate.includes(stored));
    }
  });
}

export function safeExperienceVaultRecord(experience = {}) {
  return Object.freeze({
    signature: String(experience.signature || ""),
    ingredientIds: Object.freeze((experience.ingredientIds || []).map(String)),
    completedAt: experience.completedAt || null,
    outcome: ["completed", "rejected"].includes(experience.outcome) ? experience.outcome : "completed"
  });
}
