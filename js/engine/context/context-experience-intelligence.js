import { buildExperienceIntelligence as buildLegacyExperienceIntelligence, selectNovelExperiences } from "../experience-intelligence/experience-intelligence-engine.js";
import { buildMissionContext } from "./mission-context-intelligence.js";

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
  const activities = selectNovelExperiences(input);
  const recommendation = activities[0];
  const explanation = context.nearbyFirst ? copy.local : copy.wider;
  const alternatives = activities.slice(1, 4);
  const command = (activity, replace = false) => language === "ko" ? `${activity}${replace ? "으로 바꿔줘" : "을 계획에 넣어줘"}` : language === "es" ? `${replace ? "Cambia a" : "Añade"} ${activity}` : `${replace ? "Switch to" : "Add"} ${activity}`;
  return {
    ...legacy, title: copy.title, opening: copy.opening, whyLabel: copy.why,
    insights: [explanation, ...legacy.insights.slice(1, 3)],
    choices: [{ text: recommendation, command: command(recommendation), kind: "one-pick" }, ...alternatives.map((activity) => ({ text: activity, command: command(activity, true), kind: "alternative" }))],
    lead: copy.lead, recommendation, explanation,
    suggestedImprovements: [explanation, ...legacy.insights.slice(1, 3)],
    alternativeExperiences: alternatives,
    foodExperiences: context.relationship.value === "couple" ? ["chef tasting", "neighborhood favorite", "dessert stop", "late café"] : ["local specialty", "market tasting", "neighborhood favorite", "casual café"],
    context, mapModel: context.map
  };
}
