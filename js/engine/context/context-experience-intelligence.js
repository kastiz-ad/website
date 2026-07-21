import { buildExperienceIntelligence as buildLegacyExperienceIntelligence } from "../experience-intelligence/experience-intelligence-engine.js";
import { buildMissionContext } from "./mission-context-intelligence.js";
import { generateExperience } from "../experience-generator/one-experience-generator.js?v=20260722-experience-expansion";

const COPY = {
  en: { title: "ONE Recommendation", opening: "Here is the plan I recommend for this moment.", why: "Why this fits", local: "I kept this nearby first, so more of your time goes into the experience—not transit.", wider: "I balanced travel time, comfort and flexibility before recommending this plan.", lead: "Ask ONE to change, remove or add anything before approval." },
  ko: { title: "ONE 추천", opening: "지금 상황에 가장 잘 맞는 계획을 준비했어요.", why: "이 선택이 잘 맞는 이유", local: "이동보다 경험에 시간을 쓸 수 있도록 가까운 곳부터 구성했어요.", wider: "이동 시간, 편안함, 일정 유연성을 함께 고려해 구성했어요.", lead: "승인하기 전에 ONE에게 변경, 삭제 또는 추가를 요청할 수 있어요." },
  es: { title: "Recomendación de ONE", opening: "Preparé el plan que mejor encaja con este momento.", why: "Por qué encaja", local: "Priorizé opciones cercanas para dedicar más tiempo a la experiencia y menos al traslado.", wider: "Equilibré tiempo de viaje, comodidad y flexibilidad.", lead: "Pide a ONE cualquier cambio antes de aprobar." }
};

export function buildContextualExperienceIntelligence(input = {}) {
  const language = ["en", "ko", "es"].includes(input.language) ? input.language : "en";
  const legacy = buildLegacyExperienceIntelligence({ ...input, language });
  const context = input.context || buildMissionContext(input.mission || input.goal, input);
  const copy = COPY[language];
  const generated = generateExperience({ ...input, context, provider: input.provider || "OPENAI" });
  const activities = generated.onePick.activities;
  const recommendation = `${generated.onePick.location} · ${activities[0]}`;
  const explanation = context.nearbyFirst ? copy.local : copy.wider;
  const alternatives = generated.alternatives;
  const command = (activity, replace = false) => language === "ko" ? `${activity}${replace ? "으로 바꿔줘" : "을 계획에 넣어줘"}` : language === "es" ? `${replace ? "Cambia a" : "Añade"} ${activity}` : `${replace ? "Switch to" : "Add"} ${activity}`;
  return {
    ...legacy, title: copy.title, opening: copy.opening, whyLabel: copy.why,
    insights: [generated.onePick.story, explanation, `${language === "ko" ? "비 오는 날 대안" : language === "es" ? "Plan de lluvia" : "Rain plan"}: ${generated.onePick.rainPlan}`],
    choices: [{ text: recommendation, command: command(recommendation), kind: "one-pick" }, ...alternatives.map((activity) => ({ text: activity, command: command(activity, true), kind: "alternative" }))],
    lead: copy.lead, recommendation, explanation,
    suggestedImprovements: [explanation, `${language === "ko" ? "비 오는 날 대안" : language === "es" ? "Plan de lluvia" : "Rain plan"}: ${generated.onePick.rainPlan}`],
    alternativeExperiences: alternatives,
    foodExperiences: generated.onePick.foods,
    generatedExperience: generated,
    timeline: generated.onePick.timeline,
    rainPlan: generated.onePick.rainPlan,
    story: generated.onePick.story,
    context, mapModel: context.map
  };
}
