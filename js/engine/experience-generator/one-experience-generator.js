import { EXPERIENCE_INGREDIENTS, ingredientCount } from "./experience-ingredient-library.js";
import { buildExperienceVault } from "./experience-vault.js";

const hash = (value) => [...String(value)].reduce((total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);
const tagsFor = (context, input) => new Set([
  context.relationship?.value, context.purpose?.value, context.experienceStyle,
  ...(context.internal?.emotions || []), input.season, input.weather, ...(input.preferences || [])
].filter(Boolean).map((value) => String(value).toLowerCase()));
const score = (item, wanted) => (item.tags || []).reduce((total, tag) => total + (wanted.has(tag) ? 5 : 0), 0);
const pick = (items, wanted, seed, offset, vault) => {
  const ranked = items.map((item, index) => ({ item, value: score(item, wanted) + ((hash(`${seed}:${item.id}:${index}`) % 100) / 100) })).sort((a, b) => b.value - a.value);
  const available = ranked.filter(({ item }) => !vault.has(item.id));
  return (available.length ? available : ranked)[offset % Math.max(1, available.length || ranked.length)]?.item;
};
const LABELS = {
  ko: {
    river:"강변", beach:"해변", mountain:"산", forest:"숲", lake:"호수", downtown:"도심", "traditional-village":"전통 마을", island:"섬", countryside:"교외", rooftop:"루프탑", "hidden-alley":"숨은 골목", "theme-park":"테마파크", aquarium:"아쿠아리움", gallery:"갤러리", market:"시장", observatory:"전망대", temple:"사찰", hanok:"한옥",
    kayak:"카약", "rail-bike":"레일바이크", bowling:"볼링", vr:"VR 체험", "escape-room":"방탈출", "cooking-class":"쿠킹 클래스", pottery:"도자기 공방", painting:"페인팅 클래스", shopping:"쇼핑", "wine-tasting":"와인 테이스팅", jazz:"재즈 공연", "mini-golf":"미니 골프", camping:"캠핑", "photography-walk":"사진 산책", massage:"마사지", "bike-ride":"자전거 타기", picnic:"피크닉", arcade:"아케이드", "coin-karaoke":"코인 노래방", "flower-class":"플라워 클래스", "perfume-making":"향수 만들기", "sunset-ferry":"노을 페리",
    bbq:"바비큐", steak:"스테이크", italian:"이탈리안", japanese:"일식", chinese:"중식", thai:"태국 음식", french:"프렌치", mexican:"멕시칸", vegan:"비건 식사", dessert:"디저트", bakery:"베이커리", cafe:"카페", "makgeolli-jeon":"막걸리와 전", hotpot:"전골", "market-tasting":"시장 먹거리", "chef-tasting":"셰프 테이스팅",
    romantic:"로맨틱", healing:"힐링", luxury:"럭셔리", funny:"유쾌한", cute:"귀여운", adventure:"모험", hidden:"숨은 명소", instagram:"사진에 남는", classic:"클래식", traditional:"전통", elegant:"우아한", night:"밤의", sunset:"노을", rainy:"비 오는 날", cozy:"아늑한", energetic:"활기찬",
    walk:"도보", subway:"지하철", bike:"자전거", KTX:"KTX", SRT:"SRT", ITX:"ITX", bus:"버스", "rental-car":"렌터카", taxi:"택시", ferry:"페리"
  },
  es: {
    river:"Ribera", beach:"Playa", mountain:"Montaña", forest:"Bosque", lake:"Lago", downtown:"Centro", "traditional-village":"Pueblo tradicional", island:"Isla", countryside:"Campo", rooftop:"Azotea", "hidden-alley":"Callejón escondido", "theme-park":"Parque temático", aquarium:"Acuario", gallery:"Galería", market:"Mercado", observatory:"Mirador", temple:"Templo", hanok:"Casa tradicional",
    kayak:"Kayak", "rail-bike":"Bicicleta sobre rieles", bowling:"Bolos", vr:"Experiencia VR", "escape-room":"Escape room", "cooking-class":"Clase de cocina", pottery:"Taller de cerámica", painting:"Clase de pintura", shopping:"Compras", "wine-tasting":"Cata de vinos", jazz:"Jazz", "mini-golf":"Minigolf", camping:"Camping", "photography-walk":"Paseo fotográfico", massage:"Masaje", "bike-ride":"Paseo en bicicleta", picnic:"Pícnic", arcade:"Arcade", "coin-karaoke":"Karaoke", "flower-class":"Taller floral", "perfume-making":"Creación de perfume", "sunset-ferry":"Ferry al atardecer",
    bbq:"Barbacoa", steak:"Carne", italian:"Italiano", japanese:"Japonés", chinese:"Chino", thai:"Tailandés", french:"Francés", mexican:"Mexicano", vegan:"Vegano", dessert:"Postre", bakery:"Panadería", cafe:"Café", "makgeolli-jeon":"Makgeolli y jeon", hotpot:"Hotpot", "market-tasting":"Degustación de mercado", "chef-tasting":"Menú del chef",
    romantic:"Romántico", healing:"Relajante", luxury:"Lujoso", funny:"Divertido", cute:"Encantador", adventure:"Aventura", hidden:"Secreto", instagram:"Fotogénico", classic:"Clásico", traditional:"Tradicional", elegant:"Elegante", night:"Nocturno", sunset:"Atardecer", rainy:"Lluvioso", cozy:"Acogedor", energetic:"Energético"
  }
};
const label = (id, language = "en") => LABELS[language]?.[id] || String(id || "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const timeSlots = ["10:30", "12:00", "14:00", "16:30", "18:30", "20:30"];

export function buildExperienceGenerationPrompt(input = {}) {
  return Object.freeze({
    system: "You are ONE Experience Generator. Design a coherent, original, memorable real-world experience from ingredients and verified constraints. Never choose a predefined scenario. Never claim live availability. Optimize for the story the person will remember ten years from now. Return structured JSON only.",
    objective: "Create one complete experience with destination, timeline, transportation, food, activities, alternatives, rain plan, budget status, and concise reasoning.",
    context: input.context,
    preferences: input.preferences || [],
    dislikes: input.dislikes || [],
    completedExperienceSignatures: input.completedExperienceSignatures || [],
    rejectedExperienceSignatures: input.rejectedExperienceSignatures || [],
    constraints: { season: input.season || "unknown", weather: input.weather || "unknown", crowd: input.crowd || "unknown", budget: input.budget || null },
    rules: ["Do not repeat a complete itinerary", "Use only compatible ingredients", "Include a weather backup", "Keep approval separate from generation", "Label estimates and unknowns honestly"]
  });
}

export function generateExperience(input = {}) {
  const context = input.context || {};
  const language = ["en", "ko", "es"].includes(input.language) ? input.language : context.language || "en";
  const vault = buildExperienceVault({ previousExperiences: input.previousExperiences, completedExperiences: input.completedExperienceSignatures, rejectedExperiences: input.rejectedExperienceSignatures });
  const wanted = tagsFor(context, input);
  const generationIndex = Math.max(0, Number(input.generationIndex || vault.completed.length));
  const seed = `${input.mission || "experience"}|${context.destination?.id || "nearby"}|${generationIndex}|${vault.completed.join("|")}`;
  const location = pick(EXPERIENCE_INGREDIENTS.locations, wanted, seed, generationIndex, vault);
  const activities = [0, 1, 2, 3].map((offset) => pick(EXPERIENCE_INGREDIENTS.activities, wanted, seed, generationIndex + offset * 3, vault)).filter((item, index, list) => item && list.findIndex((other) => other.id === item.id) === index);
  const foods = [0, 1, 2, 3].map((offset) => pick(EXPERIENCE_INGREDIENTS.foods, wanted, seed, generationIndex + offset * 5, vault)).filter((item, index, list) => item && list.findIndex((other) => other.id === item.id) === index);
  const mood = pick(EXPERIENCE_INGREDIENTS.moods, wanted, seed, generationIndex, vault);
  const allowedTransport = EXPERIENCE_INGREDIENTS.transport.filter((item) => (context.transport || []).some((mode) => String(mode).toLowerCase().includes(item.id.toLowerCase())));
  const transport = pick(allowedTransport.length ? allowedTransport : EXPERIENCE_INGREDIENTS.transport, wanted, seed, generationIndex, vault);
  const rainActivity = EXPERIENCE_INGREDIENTS.activities.find((item) => item.tags.includes("rain") && !activities.some((chosen) => chosen.id === item.id));
  const ingredientIds = [location, mood, transport, ...activities, ...foods].filter(Boolean).map((item) => item.id);
  const signature = `ONE-XP-${hash(ingredientIds.join("|")) .toString(36).toUpperCase()}`;
  const timelineIngredients = [foods[0], activities[0], activities[1], foods[1], activities[2]].filter(Boolean);
  return Object.freeze({
    engine: "ONE_EXPERIENCE_GENERATOR_V1",
    source: input.modelOutput ? "MODEL_GENERATED" : "DETERMINISTIC_PREVIEW",
    provider: input.provider || "OPENAI",
    signature,
    ingredientIds: Object.freeze(ingredientIds),
    onePick: Object.freeze({
      destination: context.destination?.id || location.id,
      story: language === "ko" ? `${label(location.id, language)}에서 시작해 ${label(activities.at(-1)?.id, language)}, ${label(foods.at(-1)?.id, language)}로 마무리하는 기억에 남을 하루예요.` : language === "es" ? `Un día memorable que comienza en ${label(location.id, language)}, continúa con ${label(activities.at(-1)?.id, language)} y termina con ${label(foods.at(-1)?.id, language)}.` : `A memorable ${label(mood.id, language).toLowerCase()} experience that moves from ${label(location.id, language)} to ${label(activities.at(-1)?.id, language)} and ends with ${label(foods.at(-1)?.id, language)}.`,
      location: label(location.id, language), mood: label(mood.id, language), transportation: label(transport.id, language),
      activities: Object.freeze(activities.map((item) => label(item.id, language))), foods: Object.freeze(foods.map((item) => label(item.id, language))),
      timeline: Object.freeze(timelineIngredients.map((item, index) => Object.freeze({ time: timeSlots[index], title: label(item.id, language), type: EXPERIENCE_INGREDIENTS.foods.includes(item) ? "food" : "activity" }))),
      rainPlan: rainActivity ? label(rainActivity.id, language) : language === "ko" ? "실내 대안" : language === "es" ? "Alternativa interior" : "Indoor flexible alternative",
      budget: input.budget ? { status: "USER_LIMIT", amount: input.budget } : { status: "ESTIMATED_AFTER_SELECTION", amount: null },
      reasoning: language === "ko" ? (context.nearbyFirst ? "가까운 곳부터 이어 이동은 줄이고 함께하는 시간을 늘렸어요." : "이동, 휴식, 음식과 특별한 순간의 균형을 맞췄어요.") : language === "es" ? (context.nearbyFirst ? "Priorizamos lugares cercanos para compartir más y desplazarnos menos." : "La secuencia equilibra movimiento, descanso, comida y un recuerdo especial.") : context.nearbyFirst ? "Nearby-first pacing leaves more time for shared moments and less time in transit." : "The sequence balances movement, rest, food and one distinctive memory anchor."
    }),
    alternatives: Object.freeze(activities.slice(1).map((item) => label(item.id, language))),
    prompt: buildExperienceGenerationPrompt({ ...input, context }),
    combinatorialLibrarySize: Object.values(EXPERIENCE_INGREDIENTS).reduce((total, list) => total * list.length, 1),
    ingredientCount: ingredientCount(),
    approval: Object.freeze({ required: true, approved: false, externalExecution: false })
  });
}
