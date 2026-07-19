const text = (value) => String(value || "").trim();
const lower = (value) => text(value).toLocaleLowerCase();

const LOCATION_RULES = [
  { id: "seoul", country: "KR", names: /seoul|서울/i, transport: ["subway", "bus", "walk", "taxi"] },
  { id: "busan", country: "KR", names: /busan|부산/i, transport: ["KTX", "SRT", "bus", "subway"] },
  { id: "gapyeong", country: "KR", names: /gapyeong|가평/i, transport: ["ITX", "bus", "car"] },
  { id: "incheon", country: "KR", names: /incheon|인천/i, transport: ["subway", "airport railroad", "bus"] },
  { id: "jeju", country: "KR", names: /jeju|제주/i, transport: ["flight", "car", "bus"] },
  { id: "tokyo", country: "JP", names: /tokyo|도쿄|東京/i, transport: ["flight", "rail", "subway", "walk"] },
  { id: "osaka", country: "JP", names: /osaka|오사카|大阪/i, transport: ["flight", "rail", "subway", "walk"] },
  { id: "new-york", country: "US", names: /new york|nyc|뉴욕/i, transport: ["flight", "subway", "walk"] },
  { id: "los-angeles", country: "US", names: /los angeles|\bla\b|로스앤젤레스|엘에이/i, transport: ["flight", "car", "rideshare"] },
  { id: "paris", country: "FR", names: /paris|파리/i, transport: ["flight", "metro", "walk"] },
  { id: "madrid", country: "ES", names: /madrid|마드리드/i, transport: ["flight", "metro", "walk"] }
];

const COUNTRY_RULES = [
  ["KR", /korea|south korea|한국|대한민국/i], ["JP", /japan|일본/i], ["US", /usa|united states|america|미국/i],
  ["FR", /france|프랑스/i], ["ES", /spain|스페인/i], ["GB", /united kingdom|britain|영국/i],
  ["IT", /italy|이탈리아/i], ["DE", /germany|독일/i], ["CA", /canada|캐나다/i], ["AU", /australia|호주/i]
];

const RELATIONSHIPS = [
  ["couple", /girlfriend|boyfriend|wife|husband|partner|couple|date|anniversary|여친|남친|여자친구|남자친구|아내|남편|연인|커플|데이트|기념일|novia|novio|pareja|cita/i],
  ["family", /family|parent|mother|father|child|kids|가족|부모|엄마|아빠|아이|자녀|familia|niñ/i],
  ["friends", /friend|friends|친구|amig/i],
  ["colleagues", /coworker|colleague|team|동료|직장|팀|colega|equipo/i],
  ["solo", /solo|alone|혼자|나홀로|solitario/i]
];

const PURPOSES = [
  ["romance", /date|anniversary|romantic|데이트|기념일|로맨틱|cita|románt/i],
  ["business", /business|work|conference|출장|사업|업무|negocio|trabajo/i],
  ["learning", /learn|study|tutor|class|배우|공부|튜터|수업|aprender|estudi/i],
  ["relaxation", /relax|heal|rest|휴식|힐링|쉬고|descans|relaj/i],
  ["celebration", /birthday|celebrate|생일|축하|cumpleaños|celebr/i],
  ["exploration", /trip|travel|visit|여행|관광|가고 싶|viaj|visitar/i]
];

const findRule = (source) => LOCATION_RULES.find((rule) => rule.names.test(source));
const findCountry = (source) => COUNTRY_RULES.find(([, pattern]) => pattern.test(source))?.[0] || null;
const inferPair = (source, rules, fallback) => {
  const hit = rules.find(([, pattern]) => pattern.test(source));
  return { value: hit?.[0] || fallback, confidence: hit ? 0.94 : 0.42 };
};

const distanceClass = ({ origin, destination, durationDays, purpose }) => {
  if (purpose === "relocation") return "RELOCATION";
  if (durationDays >= 30) return "LONG_TERM";
  if (!destination || destination.id === origin.id) return "LOCAL_CITY";
  if (origin.country === destination.country) {
    if (destination.id === "gapyeong" || durationDays <= 1) return "DAY_TRIP";
    if (durationDays <= 3) return "WEEKEND";
    return "DOMESTIC";
  }
  return "INTERNATIONAL";
};

const emotionProfile = (source, relationship, purpose) => {
  const values = new Set();
  if (relationship === "couple" || purpose === "romance") values.add("romance").add("connection");
  if (relationship === "family") values.add("family").add("comfort");
  if (purpose === "learning") values.add("growth").add("achievement");
  if (purpose === "relaxation") values.add("healing").add("relaxation");
  if (/surprise|깜짝|sorpresa/i.test(source)) values.add("surprise");
  if (!values.size) values.add("discovery").add("comfort");
  return [...values];
};

export function buildMissionContext(rawInput, options = {}) {
  const mission = text(rawInput);
  const source = `${mission} ${text(options.goal)} ${text(options.destination)} ${text(options.relationship)}`;
  const language = ["en", "ko", "es"].includes(options.language) ? options.language : /[가-힣]/.test(source) ? "ko" : "en";
  const relationship = inferPair(source, RELATIONSHIPS, "unspecified");
  const purpose = inferPair(source, PURPOSES, "general");
  const origin = findRule(text(options.currentLocation)) || LOCATION_RULES[0];
  const destination = findRule(source) || (() => { const country = findCountry(source); return country ? { id: country.toLowerCase(), country, transport: ["flight", "public transit", "walk"] } : origin; })();
  const durationDays = Math.max(1, Number(options.durationDays || options.duration || 1));
  const distance = distanceClass({ origin, destination, durationDays, purpose: purpose.value });
  const domestic = destination.country === origin.country;
  const context = {
    version: "MISSION_CONTEXT_INTELLIGENCE_V1",
    language,
    origin: { id: origin.id, country: origin.country },
    destination: { id: destination.id, country: destination.country },
    relationship,
    purpose,
    durationDays,
    distanceClass: distance,
    budget: options.budget || null,
    transport: [...destination.transport],
    experienceStyle: options.experienceStyle || (purpose.value === "romance" ? "personal" : "balanced"),
    scope: domestic ? (distance === "LOCAL_CITY" ? "local" : "domestic") : "international",
    nearbyFirst: distance === "LOCAL_CITY" || distance === "LOCAL_METRO",
    requiresInternationalTravel: !domestic,
    suppress: domestic ? ["airport", "passport", "embassy", "immigration", "departure-guide"] : [],
    map: { enabled: true, mode: domestic ? "local" : "destination", query: destination.id }
  };
  Object.defineProperty(context, "internal", { enumerable: false, value: Object.freeze({ emotions: emotionProfile(source, relationship.value, purpose.value) }) });
  return Object.freeze(context);
}

export const isDomesticContext = (context) => context?.scope === "local" || context?.scope === "domestic";
