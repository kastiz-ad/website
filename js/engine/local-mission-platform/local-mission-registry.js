export const LOCAL_MISSION_PIPELINE = Object.freeze([
  "Mission",
  "Classifier",
  "Mission Engine",
  "Provider Layer",
  "Approval Engine",
  "Execution Engine"
]);

export const LOCAL_MISSION_ENGINES = Object.freeze({
  education: {
    id: "education",
    labels: { en: "Education", ko: "교육", es: "Educación" },
    services: ["academy", "future tutor", "language school"],
    providerTypes: ["education", "tutoring", "language-school"],
    essentialQuestions: ["subject", "location", "schedule"],
    rankingSignals: ["goal match", "language support", "distance", "schedule fit", "trial availability", "price clarity"],
    nextStep: "Prepare shortlist, trial lesson questions, schedule window, and approval review."
  },
  healthcare: {
    id: "healthcare",
    labels: { en: "Healthcare", ko: "의료", es: "Salud" },
    services: ["clinic", "dentist", "hospital", "pharmacy", "university hospital"],
    providerTypes: ["clinic", "dentist", "hospital", "pharmacy"],
    essentialQuestions: ["care type", "location", "urgency"],
    rankingSignals: ["specialty fit", "license-sensitive caution", "language support", "accessibility", "distance", "hours"],
    nextStep: "Prepare clinic shortlist, visit checklist, documents, and safety disclaimer."
  },
  sports_wellness: {
    id: "sports_wellness",
    labels: { en: "Sports & Wellness", ko: "스포츠·웰니스", es: "Deporte y bienestar" },
    services: ["gym", "PT", "yoga", "pilates", "swimming", "tennis", "golf", "baseball", "bowling", "martial arts", "physical therapy", "rehabilitation", "acupuncture", "massage"],
    providerTypes: ["sports", "wellness", "rehabilitation"],
    essentialQuestions: ["activity", "location", "schedule"],
    rankingSignals: ["activity fit", "distance", "trainer availability", "facility quality", "membership flexibility", "price clarity"],
    nextStep: "Prepare class/provider shortlist, visit timing, estimated cost, and approval review."
  },
  beauty: {
    id: "beauty",
    labels: { en: "Beauty", ko: "뷰티", es: "Belleza" },
    services: ["hair salon", "skin clinic", "laser clinic", "plastic surgery", "cosmetic dentistry", "vision correction"],
    providerTypes: ["beauty", "clinic", "cosmetic-service"],
    essentialQuestions: ["service", "location", "date"],
    rankingSignals: ["service match", "style/specialty fit", "distance", "availability", "language support", "price clarity"],
    nextStep: "Prepare provider shortlist, style/service notes, estimated pricing, and approval review."
  },
  professionals: {
    id: "professionals",
    labels: { en: "Professionals", ko: "전문가", es: "Profesionales" },
    services: ["lawyer", "tax accountant", "patent attorney", "architect", "real estate agent", "translator", "interpreter", "financial advisor"],
    providerTypes: ["legal", "finance", "real-estate", "translation", "professional-service"],
    essentialQuestions: ["professional type", "location", "deadline"],
    rankingSignals: ["specialty fit", "language support", "credential needs", "deadline fit", "consultation method", "price clarity"],
    nextStep: "Prepare expert shortlist, documents needed, consultation questions, and approval review."
  },
  career: {
    id: "career",
    labels: { en: "Career", ko: "커리어", es: "Carrera" },
    services: ["job search", "employer hiring", "resume preparation", "interview preparation"],
    providerTypes: ["career", "recruiting", "resume", "interview-coaching"],
    essentialQuestions: ["role", "location", "timeline"],
    rankingSignals: ["role match", "industry fit", "language support", "timeline", "portfolio/resume readiness", "price clarity"],
    nextStep: "Prepare target role plan, provider shortlist, resume/interview checklist, and approval review."
  },
  government: {
    id: "government",
    labels: { en: "Government", ko: "정부·민원", es: "Gobierno" },
    services: ["passport", "driver's license", "immigration", "business registration", "resident services"],
    providerTypes: ["government", "document-prep", "identity-service"],
    essentialQuestions: ["service", "jurisdiction", "deadline"],
    rankingSignals: ["jurisdiction match", "document requirements", "deadline", "office hours", "appointment availability", "legal caution"],
    nextStep: "Prepare office/process checklist, required documents, and approval-protected next step."
  },
  home_services: {
    id: "home_services",
    labels: { en: "Home Services", ko: "생활 서비스", es: "Servicios del hogar" },
    services: ["cleaning", "moving", "repairs", "locksmith", "pest control"],
    providerTypes: ["home-services", "repair", "moving", "locksmith", "pest-control"],
    essentialQuestions: ["service", "address area", "timing"],
    rankingSignals: ["service match", "distance", "availability", "emergency fit", "review quality", "price clarity"],
    nextStep: "Prepare provider shortlist, timing, safety checklist, estimate, and approval review."
  }
});

export const LOCAL_MISSION_ENGINE_IDS = Object.freeze(Object.keys(LOCAL_MISSION_ENGINES));
