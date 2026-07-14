export const DEMO_MISSIONS = Object.freeze({
  travel: { en: "Plan my Japan trip.", ko: "일본 여행 계획해줘." },
  tutoring: { en: "Find me an English tutor.", ko: "영어 선생님을 찾아줘." },
  childcare: { en: "Find me a trusted babysitter nearby.", ko: "가까운 곳에서 믿을 수 있는 베이비시터를 찾아줘." },
  moving: { en: "Help me move to Korea.", ko: "한국 이주 준비를 도와줘." },
  shopping: { en: "Find the best laptop for my work.", ko: "업무용으로 가장 적합한 노트북을 찾아줘." },
  business: { en: "Help me start a business in Korea.", ko: "한국에서 사업 시작을 도와줘." },
  language_exchange: { en: "Find me an English language-exchange partner.", ko: "영어 언어교환 파트너를 찾아줘." },
  general_mission: { en: "Help me complete an important real-life task.", ko: "중요한 현실 미션을 완료하도록 도와줘." }
});
export const isPresentationMode = (locationLike = globalThis.location) => {
  try { return new URLSearchParams(locationLike.search).get("demo") === "1"; } catch { return false; }
};
export const getDemoMission = (type, language = "en") => DEMO_MISSIONS[type]?.[language === "ko" ? "ko" : "en"] || DEMO_MISSIONS.general_mission[language === "ko" ? "ko" : "en"];
