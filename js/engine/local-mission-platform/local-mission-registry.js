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
    services: ["English academy", "math academy", "science academy", "coding academy", "language institute", "music academy", "art academy", "sports academy"],
    keywords: ["academy", "school", "lesson", "english academy", "math academy", "science academy", "coding academy", "language institute", "music academy", "art academy", "학원", "수학 학원", "과학 학원", "코딩 학원", "어학원", "음악 학원", "미술 학원", "내신", "escuela", "academia", "inglés académico", "matemáticas"],
    providerTypes: ["education", "tutoring", "language-school"],
    essentialQuestions: ["subject", "location", "schedule"],
    rankingSignals: ["goal match", "language support", "distance", "schedule fit", "trial availability", "price clarity"],
    adapters: ["kakao-local:fallback", "naver-local:future", "education-marketplace:future"],
    nextStep: "Prepare shortlist, trial lesson questions, schedule window, and approval review."
  },
  healthcare: {
    id: "healthcare",
    labels: { en: "Healthcare", ko: "의료", es: "Salud" },
    services: ["dentist", "internal medicine", "surgery", "orthopedics", "dermatology", "pediatrics", "gynecology", "pharmacy", "emergency facility", "university hospital", "cancer center", "rehabilitation", "physical therapy", "manual therapy"],
    keywords: ["hospital", "clinic", "doctor", "dentist", "pharmacy", "emergency", "urgent", "orthopedic", "dermatology", "pediatric", "gynecology", "cancer", "rehabilitation", "physical therapy", "병원", "의원", "의사", "치과", "약국", "응급", "오늘", "정형외과", "피부과", "소아과", "산부인과", "암", "대학병원", "재활", "물리치료", "도수치료", "clínica", "hospital", "dentista", "farmacia", "urgencia"],
    providerTypes: ["clinic", "dentist", "hospital", "pharmacy"],
    essentialQuestions: ["care type", "location", "urgency"],
    rankingSignals: ["specialty fit", "license-sensitive caution", "language support", "accessibility", "distance", "hours"],
    adapters: ["hira:future", "public-health-data:future", "kakao-local:fallback", "emergency-directory:fallback"],
    safetyMode: "medical_navigation_only",
    nextStep: "Prepare clinic shortlist, visit checklist, documents, and safety disclaimer."
  },
  sports_wellness: {
    id: "sports_wellness",
    labels: { en: "Sports & Wellness", ko: "스포츠·웰니스", es: "Deporte y bienestar" },
    services: ["gym", "personal training", "yoga", "pilates", "swimming", "tennis", "golf", "baseball", "bowling", "climbing", "boxing", "martial arts", "dance", "rehabilitation", "physical therapy"],
    keywords: ["gym", "personal training", " pt ", "yoga", "pilates", "swimming", "tennis", "golf", "baseball", "bowling", "climbing", "boxing", "martial arts", "dance", "rehabilitation", "physical therapy", "헬스", "피티", "요가", "필라테스", "수영", "테니스", "골프", "야구", "볼링", "클라이밍", "복싱", "무술", "댄스", "재활", "물리치료", "gimnasio", "pilates", "natación"],
    providerTypes: ["sports", "wellness", "rehabilitation"],
    essentialQuestions: ["activity", "location", "schedule"],
    rankingSignals: ["activity fit", "distance", "trainer availability", "facility quality", "membership flexibility", "price clarity"],
    adapters: ["kakao-local:fallback", "naver-local:future", "classpass:future"],
    nextStep: "Prepare class/provider shortlist, visit timing, estimated cost, and approval review."
  },
  beauty: {
    id: "beauty",
    labels: { en: "Beauty", ko: "뷰티", es: "Belleza" },
    services: ["hair salon", "nail salon", "skin care", "dermatology", "laser treatment", "cosmetic dentistry", "plastic surgery", "cosmetic surgery", "vision correction", "weight-management clinic"],
    keywords: ["hair", "nails", "skin care", "dermatology", "laser", "cosmetic dentistry", "plastic surgery", "cosmetic surgery", "vision correction", "weight-management", "beauty", "미용실", "네일", "피부관리", "피부과", "레이저", "미용치과", "성형외과", "성형", "시력교정", "다이어트", "체중관리", "belleza", "piel", "láser"],
    providerTypes: ["beauty", "clinic", "cosmetic-service"],
    essentialQuestions: ["service", "location", "date"],
    rankingSignals: ["service match", "style/specialty fit", "distance", "availability", "language support", "price clarity"],
    adapters: ["kakao-local:fallback", "naver-booking:future", "beauty-marketplace:future"],
    nextStep: "Prepare provider shortlist, style/service notes, estimated pricing, and approval review."
  },
  professionals: {
    id: "professionals",
    labels: { en: "Professionals", ko: "전문가", es: "Profesionales" },
    services: ["lawyer by specialty", "immigration specialist", "patent attorney", "tax accountant", "CPA", "labor attorney", "real-estate agent", "architect", "interior designer", "translator", "interpreter", "photographer", "videographer", "financial professional", "insurance professional"],
    keywords: ["immigration lawyer", "immigration specialist", "patent attorney", "labor attorney", "real-estate", "architect", "interior designer", "translator", "interpreter", "financial advisor", "insurance professional", "이민 전문", "변리사", "노무사", "공인중개사", "건축사", "인테리어", "번역", "통역", "통역사", "재무상담", "보험 전문가", "traductor", "intérprete"],
    providerTypes: ["legal", "finance", "real-estate", "translation", "professional-service"],
    essentialQuestions: ["professional type", "location", "deadline"],
    rankingSignals: ["specialty fit", "language support", "credential needs", "deadline fit", "consultation method", "price clarity"],
    adapters: ["kakao-local:fallback", "professional-directory:future", "bar-association:future"],
    nextStep: "Prepare expert shortlist, documents needed, consultation questions, and approval review."
  },
  career: {
    id: "career",
    labels: { en: "Career", ko: "커리어", es: "Carrera" },
    services: ["job search", "employer hiring", "resume preparation", "interview preparation"],
    keywords: ["job", "career", "hiring", "candidate", "resume", "cv", "interview", "skills", "visa status", "salary", "experience", "일자리", "취업", "채용", "후보자", "이력서", "자기소개서", "면접", "기술", "비자", "연봉", "경력", "trabajo", "empleo", "currículum", "entrevista"],
    providerTypes: ["career", "recruiting", "resume", "interview-coaching"],
    essentialQuestions: ["role", "location", "timeline"],
    rankingSignals: ["role match", "industry fit", "language support", "timeline", "portfolio/resume readiness", "price clarity"],
    adapters: ["job-platforms:future", "linkedin:future", "saramin:future", "wanted:future"],
    nextStep: "Prepare target role plan, provider shortlist, resume/interview checklist, and approval review."
  },
  foreigner_korea: {
    id: "foreigner_korea",
    labels: { en: "Foreigner in Korea", ko: "외국인 한국 정착", es: "Extranjero en Corea" },
    services: ["move to Korea", "study in Korea", "find work in Korea", "start a business in Korea", "visa and immigration preparation", "housing", "banking", "phone and SIM", "health insurance", "Korean-language education", "government administration", "local settlement checklist"],
    keywords: ["study in korea", "work in korea", "start a business in korea", "foreigner in korea", "korea settlement", "korean visa", "alien registration", "health insurance korea", "sim in korea", "bank account korea", "한국 유학", "한국 취업", "외국인", "한국에서 회사", "한국 정착", "외국인등록", "건강보험", "은행 계좌", "휴대폰 개통", "extranjero en corea"],
    providerTypes: ["government", "housing", "finance", "education", "telecom", "professional-service"],
    essentialQuestions: ["status", "city", "timeline"],
    rankingSignals: ["visa/status fit", "city fit", "language support", "required documents", "deadline", "official-channel clarity"],
    adapters: ["hikorea:future", "government-portal:future", "kakao-local:fallback", "banking-directory:future"],
    nextStep: "Prepare settlement roadmap, official channels, document checklist, and approval review."
  },
  government: {
    id: "government",
    labels: { en: "Government", ko: "정부·민원", es: "Gobierno" },
    services: ["passport", "driver's license", "immigration", "resident services", "business registration", "required-document checklist", "official online channel", "fees", "deadlines", "eligibility", "next actions"],
    keywords: ["passport", "driver's license", "immigration", "resident services", "business registration", "documents", "fees", "deadline", "eligibility", "government", "여권", "운전면허", "출입국", "주민센터", "사업자등록", "필요서류", "수수료", "마감", "자격", "민원", "pasaporte", "licencia", "inmigración", "gobierno"],
    providerTypes: ["government", "document-prep", "identity-service"],
    essentialQuestions: ["service", "jurisdiction", "deadline"],
    rankingSignals: ["jurisdiction match", "document requirements", "deadline", "office hours", "appointment availability", "legal caution"],
    adapters: ["government-portal:future", "public-data-api:future", "official-office-directory:fallback"],
    nextStep: "Prepare office/process checklist, required documents, and approval-protected next step."
  },
  home_services: {
    id: "home_services",
    labels: { en: "Home Services", ko: "생활 서비스", es: "Servicios del hogar" },
    services: ["cleaning", "moving", "repairs", "plumbing", "electrical work", "boiler service", "air-conditioner service", "locksmith", "pest control", "appliance repair"],
    keywords: ["cleaning", "moving company", "plumbing", "electrical", "boiler", "air-conditioner", "locksmith", "pest control", "appliance repair", "leak", "sink leak", "청소", "이사업체", "배관", "전기", "보일러", "에어컨", "열쇠", "방역", "해충", "가전수리", "누수", "싱크대", "limpieza", "mudanza", "plomería"],
    providerTypes: ["home-services", "repair", "moving", "locksmith", "pest-control"],
    essentialQuestions: ["service", "address area", "timing"],
    rankingSignals: ["service match", "distance", "availability", "emergency fit", "review quality", "price clarity"],
    adapters: ["kakao-local:fallback", "naver-local:future", "service-marketplace:future"],
    nextStep: "Prepare provider shortlist, timing, safety checklist, estimate, and approval review."
  }
});

export const LOCAL_MISSION_ENGINE_IDS = Object.freeze(Object.keys(LOCAL_MISSION_ENGINES));
