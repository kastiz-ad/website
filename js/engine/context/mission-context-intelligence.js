const text = (value) => String(value || "").normalize("NFKC").trim();

const LOCATIONS = [
  { id: "seoul", city: "Seoul", country: "KR", names: /seoul|서울/i, transport: ["subway", "bus", "walk", "taxi"] },
  { id: "busan", city: "Busan", country: "KR", names: /busan|부산/i, transport: ["KTX", "SRT", "bus", "subway"] },
  { id: "gapyeong", city: "Gapyeong", country: "KR", names: /gapyeong|가평/i, transport: ["ITX", "bus", "car"] },
  { id: "incheon", city: "Incheon", country: "KR", names: /incheon|인천/i, transport: ["subway", "bus", "taxi"] },
  { id: "jeju", city: "Jeju", country: "KR", names: /jeju|제주/i, transport: ["flight", "car", "bus"] },
  { id: "tokyo", city: "Tokyo", country: "JP", names: /tokyo|도쿄|東京/i, transport: ["rail", "subway", "walk"] },
  { id: "osaka", city: "Osaka", country: "JP", names: /osaka|오사카|大阪/i, transport: ["rail", "subway", "walk"] },
  { id: "new-york", city: "New York City", country: "US", names: /new york|nyc|뉴욕/i, transport: ["subway", "walk", "taxi"] },
  { id: "los-angeles", city: "Los Angeles", country: "US", names: /los angeles|\bla\b|로스앤젤레스|엘에이/i, transport: ["car", "public transit", "rideshare"] },
  { id: "paris", city: "Paris", country: "FR", names: /paris|파리/i, transport: ["metro", "walk"] },
  { id: "madrid", city: "Madrid", country: "ES", names: /madrid|마드리드/i, transport: ["metro", "walk"] },
  { id: "london", city: "London", country: "GB", names: /london|런던/i, transport: ["tube", "walk"] }
];

const COUNTRIES = [
  ["KR", /south korea|korea|대한민국|한국/i], ["JP", /japan|일본/i], ["US", /united states|usa|america|미국/i],
  ["FR", /france|프랑스/i], ["ES", /spain|스페인/i], ["GB", /united kingdom|britain|영국/i],
  ["IT", /italy|이탈리아/i], ["DE", /germany|독일/i], ["CA", /canada|캐나다/i], ["AU", /australia|호주/i]
];

const RELATIONSHIPS = [
  ["couple", /girlfriend|boyfriend|wife|husband|partner|couple|date|anniversary|여친|남친|여자친구|남자친구|아내|남편|연인|커플|데이트|기념일|novia|novio|pareja|cita/i],
  ["family", /family|parent|mother|father|child|kids|가족|부모|엄마|아빠|아이|자녀|familia|niñ/i],
  ["friends", /friend|friends|친구|amig/i], ["colleagues", /coworker|colleague|team|동료|직장|팀|colega|equipo/i],
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

const findLocation = (source) => LOCATIONS.find((rule) => rule.names.test(text(source)));
const findCountry = (source) => COUNTRIES.find(([, pattern]) => pattern.test(text(source)))?.[0] || null;
const infer = (source, rules, fallback) => {
  const hit = rules.find(([, pattern]) => pattern.test(source));
  return Object.freeze({ value: hit?.[0] || fallback, confidence: hit ? 0.94 : 0.42 });
};
const slug = (value) => text(value).toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "unspecified";

const resolveDestination = (missionSource, options, origin) => {
  const explicit = text(options.destination);
  const known = findLocation(explicit) || findLocation(missionSource);
  if (known) return { ...known, specified: true, confidence: 0.98 };
  const country = findCountry(explicit) || findCountry(missionSource);
  if (country) return { id: country.toLowerCase(), city: explicit || country, country, transport: ["public transit", "walk", "taxi"], specified: true, confidence: 0.86 };
  if (explicit && !/confirm|확인|unspecified/i.test(explicit)) {
    return { id: slug(explicit), city: explicit, country: text(options.destinationCountryCode || options.country) || origin.country, transport: ["public transit", "walk", "taxi"], specified: true, confidence: 0.78 };
  }
  return { ...origin, specified: false, confidence: 0.58 };
};

const inferDuration = (source, options) => {
  const supplied = Number(options.durationDays || options.duration);
  if (Number.isFinite(supplied) && supplied > 0) return Math.max(1, Math.round(supplied));
  const match = source.match(/(\d+)\s*(?:day|days|일|박)/i);
  if (match) return Math.max(1, Number(match[1]));
  return /weekend|주말|fin de semana/i.test(source) ? 2 : 1;
};

const classifyDistance = ({ origin, destination, durationDays, source }) => {
  if (/relocat|immigra|이주|이민/i.test(source) || durationDays >= 30) return "LONG_TERM";
  if (!destination.specified || destination.id === origin.id) return "LOCAL_CITY";
  if (origin.country !== destination.country) return "INTERNATIONAL";
  if (destination.id === "incheon" && origin.id === "seoul") return "LOCAL_METRO";
  if (durationDays <= 1) return "DAY_TRIP";
  if (durationDays <= 3) return "WEEKEND";
  return "DOMESTIC";
};

const relationshipProfile = (relationship) => ({
  couple: { prioritize: ["romantic", "sunset", "scenic walk", "thoughtful dining", "photo spot", "memorable ending"], avoid: ["business hotel", "industrial filler"] },
  family: { prioritize: ["comfort", "accessible pacing", "shared activity", "family dining"], avoid: ["late-night only", "unsafe transfer"] },
  friends: { prioritize: ["social", "interactive", "flexible", "shared food"], avoid: ["couple-only"] },
  solo: { prioritize: ["safe", "flexible", "local discovery"], avoid: ["group-only"] },
  colleagues: { prioritize: ["reliable", "time-efficient", "business appropriate"], avoid: ["romance-first"] }
}[relationship] || { prioritize: ["balanced", "locally appropriate"], avoid: ["unsupported assumptions"] });

const emotionProfile = (source, relationship, purpose) => {
  const values = new Set();
  if (relationship === "couple" || purpose === "romance") values.add("romance").add("connection");
  if (relationship === "family") values.add("family").add("comfort");
  if (purpose === "learning") values.add("growth").add("achievement");
  if (purpose === "relaxation") values.add("healing").add("relaxation");
  if (/surprise|깜짝|sorpresa/i.test(source)) values.add("surprise");
  if (!values.size) values.add("discovery").add("comfort");
  return Object.freeze([...values]);
};

const providerEligibility = ({ distance, source, durationDays }) => {
  const international = distance === "INTERNATIONAL" || distance === "LONG_TERM";
  const local = ["LOCAL_CITY", "LOCAL_METRO", "DAY_TRIP"].includes(distance);
  const requestedHotel = /hotel|stay|overnight|숙박|호텔|泊/i.test(source);
  return Object.freeze({
    experience: !international, flights: international || /flight|항공|비행기/i.test(source), airports: international,
    visa: international, passport: international, hotel: international || (!local && durationDays > 1) || requestedHotel,
    insurance: international, restaurants: true, localTransport: true, weather: true, currency: international
  });
};

export function buildMissionContext(rawInput, options = {}) {
  const mission = text(rawInput);
  const source = `${mission} ${text(options.goal)} ${text(options.relationship)}`.trim();
  const language = ["en", "ko", "es"].includes(options.language) ? options.language : /[가-힣]/.test(source) ? "ko" : "en";
  const relationship = infer(source, RELATIONSHIPS, "unspecified");
  const purpose = infer(source, PURPOSES, "general");
  const origin = findLocation(options.currentLocation) || LOCATIONS[0];
  const destination = resolveDestination(`${source} ${text(options.destination)}`, options, origin);
  const durationDays = inferDuration(source, options);
  const distanceClass = classifyDistance({ origin, destination, durationDays, source });
  const scope = ["INTERNATIONAL", "LONG_TERM"].includes(distanceClass) ? "international" : ["DOMESTIC", "WEEKEND"].includes(distanceClass) ? "domestic" : "local";
  const eligibility = providerEligibility({ distance: distanceClass, source, durationDays });
  const suppress = scope === "international" ? [] : ["airport", "passport", "embassy", "immigration", "departure-guide"];
  const context = {
    version: "MISSION_CONTEXT_INTELLIGENCE_V2", language,
    origin: Object.freeze({ id: origin.id, city: origin.city, country: origin.country }),
    destination: Object.freeze({ id: destination.id, city: destination.city, country: destination.country, specified: destination.specified, confidence: destination.confidence }),
    relationship, relationshipProfile: Object.freeze(relationshipProfile(relationship.value)), purpose, durationDays,
    availableTime: text(options.availableTime) || (durationDays === 1 ? "one-day" : `${durationDays}-days`), season: text(options.season) || "current", weather: text(options.weather) || "check-current",
    budget: options.budget || null, distanceClass, scope, transport: Object.freeze([...destination.transport]),
    experienceStyle: options.experienceStyle || (purpose.value === "romance" ? "personal" : "balanced"),
    nearbyFirst: ["LOCAL_CITY", "LOCAL_METRO", "DAY_TRIP"].includes(distanceClass), requiresInternationalTravel: scope === "international",
    providerEligibility: eligibility, suppress: Object.freeze(suppress),
    geographicConstraint: Object.freeze({ destinationId: destination.id, city: destination.city, country: destination.country, strict: destination.specified }),
    qualityRules: Object.freeze(["destination-only", "transport-continuity", "time-realism", "relationship-fit", "no-random-filler"]),
    map: Object.freeze({ enabled: true, mode: scope === "local" ? "local" : "destination", query: destination.city || destination.id })
  };
  Object.defineProperty(context, "internal", { enumerable: false, value: Object.freeze({ emotions: emotionProfile(source, relationship.value, purpose.value) }) });
  return Object.freeze(context);
}

export const isDomesticContext = (context) => context?.scope === "local" || context?.scope === "domestic";
export const isProviderEligible = (context, provider) => context?.providerEligibility?.[provider] !== false;
