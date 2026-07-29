import { createMissionPlaybook } from "../playbook-factory-v21.js";

export default createMissionPlaybook({
  playbookId: "education/child-english-performance-decline",
  domain: "education",
  missionType: "child-english-performance-decline",
  supportedIntents: [
    "child english weakness",
    "english grades falling",
    "child study support",
    "영어 부족",
    "영어 성적",
    "아이 영어",
    "자녀 영어"
  ],
  problemPatterns: [
    "아이", "자녀", "학생", "영어", "부족", "어려", "성적", "떨어",
    "child", "student", "english", "grades", "weak"
  ],
  outcomePatterns: [
    "Improve the child's English performance with the least stressful effective support.",
    "영어가 부족한 이유를 확인하고 학원, 과외, 가정 학습 중 맞는 길을 고릅니다."
  ],
  essentialQuestions: [
    "Student grade level if unknown",
    "Weak area or exam goal if known"
  ],
  questionsToAvoid: [
    "Do not ask the child's full name.",
    "Do not ask every school detail before preparing safe paths.",
    "Do not diagnose learning or medical conditions."
  ],
  providerCapabilityRequirements: [
    "grade-appropriate English support",
    "school exam focus when needed",
    "homework load",
    "class size",
    "trial lesson",
    "schedule",
    "travel time",
    "parent feedback rhythm"
  ],
  solutionPaths: [
    "English level and study-pattern review",
    "English academy comparison path",
    "Private tutor path",
    "Eight-week home-study routine",
    "Teacher or school discussion path"
  ],
  recommendedDefaultPath: "English level review plus academy/tutor comparison",
  alternativePaths: [
    "English academy comparison path",
    "Private tutor path",
    "Eight-week home-study routine"
  ],
  forbiddenClaims: [
    "Do not diagnose learning or medical conditions.",
    "Do not claim guaranteed grade improvement.",
    "Do not invent live academy availability or rankings."
  ],
  completionCriteria: [
    "Support path selected.",
    "First learning checkpoint or consultation prepared.",
    "No academy, tutor, or school contact occurs before approval."
  ],
  benchmarkScenarios: ["child-school-struggle"]
});
