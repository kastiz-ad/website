const STATUS = Object.freeze({
  understanding: "Understanding", planning: "Planning", preparing: "Preparing",
  review: "Ready for Review", approval: "Awaiting Approval", executing: "Executing",
  practice: "Practice", completed: "Completed", blocked: "Blocked"
});

const TEMPLATES = Object.freeze({
  presentation: {
    objective: "Be fully ready to deliver the presentation successfully.",
    steps: ["Understand topic and audience", "Gather source material", "Define the key message", "Prepare slide structure", "Prepare speaker notes", "Prepare short and full versions", "Predict questions and objections", "Prepare opening and closing", "Create rehearsal and memory cues"],
    artifacts: ["Presentation structure", "Slide outline", "Speaker notes", "Key messages", "Opening statement", "Closing statement", "Short version", "Full version", "Audience Q&A", "Suggested answers", "Objection responses", "Memory cards", "Rehearsal plan"],
    completionCriteria: ["Materials reviewed", "Rehearsal completed", "Weak answers retried"]
  },
  meeting: {
    objective: "Enter the meeting with a clear goal, evidence, talking points, and follow-up plan.",
    steps: ["Clarify meeting objective", "Review attendees and context", "Prepare agenda", "Prepare talking points and key numbers", "Predict questions and objections", "Prepare questions to ask", "Prepare materials and checklist", "Prepare follow-up actions"],
    artifacts: ["Meeting brief", "Background briefing", "Agenda", "Talking points", "Key numbers", "Likely questions", "Objection responses", "Questions to ask", "Closing statement", "Meeting checklist", "Follow-up draft"],
    completionCriteria: ["Brief reviewed", "Questions practiced", "Materials confirmed"]
  },
  interview: {
    objective: "Be ready to answer clearly and confidently in the interview.",
    steps: ["Identify role and interview format", "Review background", "Predict questions", "Prepare concise and detailed answers", "Identify weak areas", "Create memory keywords", "Run mock interview", "Repeat weak questions", "Prepare final checklist"],
    artifacts: ["Interview brief", "Question set", "Concise answers", "Detailed answers", "Difficult questions", "Response strategy", "Questions to ask", "Closing statement", "Memory cues", "Mock interview", "Final checklist"],
    completionCriteria: ["Mock interview completed", "Weak answers improved", "Final checklist reviewed"]
  },
  learning: {
    objective: "Reach the stated learning outcome with an adaptive, trackable plan.",
    steps: ["Assess current level", "Confirm target and deadline", "Estimate available study time", "Identify weak skills", "Create study plan", "Prepare lessons and practice", "Track progress", "Adjust weekly"],
    artifacts: ["Level assessment", "Study plan", "Practice schedule", "Learning materials", "Progress checkpoints"],
    completionCriteria: ["Target assessment completed", "Required practice completed", "Final readiness reviewed"]
  }
});

const INPUTS = Object.freeze({
  presentation: ["topic", "audience", "duration"],
  meeting: ["meetingGoal", "attendees", "deadline"],
  interview: ["company", "role", "interviewFormat"],
  learning: ["target", "currentLevel", "deadline", "weeklyTime"]
});

export function createWorkMissionFoundation(type, input = {}) {
  const template = TEMPLATES[type];
  if (!template) return null;
  const requiredInputs = INPUTS[type];
  const missingInputs = requiredInputs.filter((field) => !input[field]);
  return Object.freeze({
    missionType: type,
    missionCategory: type === "learning" ? "learning" : "work",
    objective: input.objective || template.objective,
    desiredOutcome: input.desiredOutcome || input.rawInput || "",
    status: missingInputs.length ? STATUS.understanding : STATUS.preparing,
    requiredInputs: [...requiredInputs], missingInputs,
    plan: template.steps.map((title, index) => ({ id: `${type}-${index + 1}`, title, status: "pending" })),
    preparedArtifacts: template.artifacts.map((name) => ({ name, status: "demo", externalAction: false })),
    externalActions: [], approvalRequirements: [],
    rehearsalState: ["presentation", "interview"].includes(type) ? { mode: "full", currentStep: 0, completedSteps: [], attempts: [] } : null,
    completionCriteria: [...template.completionCriteria],
    executionState: "preparation-only",
    progress: 0
  });
}

export function buildMissionBriefing(mission) {
  if (!mission) return null;
  return Object.freeze({
    title: `${mission.missionType[0].toUpperCase()}${mission.missionType.slice(1)} Mission`,
    objective: mission.objective,
    prepared: mission.preparedArtifacts,
    status: mission.missingInputs.length ? STATUS.understanding : (mission.rehearsalState ? "READY TO PRACTICE" : STATUS.review),
    primaryAction: mission.rehearsalState ? "Start rehearsal" : "Review preparation",
    externalExecution: false
  });
}

export function recordRehearsalAttempt(state = {}, attempt = {}) {
  return Object.freeze({ ...state, attempts: [...(state.attempts || []), { ...attempt }], currentStep: Number(state.currentStep || 0) + 1 });
}

export { STATUS as WORK_MISSION_STATUS };
