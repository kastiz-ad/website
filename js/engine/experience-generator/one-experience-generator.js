import { EXPERIENCE_INGREDIENTS, SEOUL_EXPERIENCE_CLUSTERS, ingredientCount } from "./experience-ingredient-library.js?v=20260722-experience-expansion-4";
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
    river:"강변", beach:"해변", mountain:"산", forest:"숲", lake:"호수", downtown:"도심", "traditional-village":"전통 마을", island:"섬", countryside:"교외", rooftop:"루프탑", "hidden-alley":"숨은 골목", "theme-park":"테마파크", aquarium:"아쿠아리움", gallery:"갤러리", market:"시장", observatory:"전망대", temple:"사찰", hanok:"한옥", "han-river":"한강", jamsil:"잠실", hongdae:"홍대", myeongdong:"명동", gangnam:"강남", seongsu:"성수", ikseondong:"익선동", namsan:"남산", bukchon:"북촌", yeouido:"여의도", yeonnam:"연남동", "seokchon-lake":"석촌호수",
    kayak:"카약", "rail-bike":"레일바이크", bowling:"볼링", vr:"VR 체험", "escape-room":"방탈출", "cooking-class":"쿠킹 클래스", pottery:"도자기 공방", painting:"페인팅 클래스", shopping:"쇼핑", "wine-tasting":"와인 테이스팅", jazz:"재즈 공연", "mini-golf":"미니 골프", camping:"캠핑", "photography-walk":"사진 산책", massage:"마사지", "bike-ride":"자전거 타기", picnic:"피크닉", arcade:"아케이드", "coin-karaoke":"코인 노래방", "flower-class":"플라워 클래스", "perfume-making":"향수 만들기", "sunset-ferry":"노을 페리", "han-river-ramen":"한강에서 라면 끓여 먹기", "han-river-picnic":"한강 피크닉", "lotte-aquarium":"롯데월드 아쿠아리움", "seoul-sky":"롯데월드타워 서울스카이", "seokchon-lake-walk":"석촌호수 산책", "lotte-world":"롯데월드", "hongdae-street-date":"홍대 거리 데이트", "hongdae-live-music":"홍대 라이브 음악", "yeonnam-park-walk":"연남동 경의선숲길 산책", "photo-booth":"커플 포토부스", "myeongdong-street-food":"명동 길거리 음식", "myeongdong-shopping":"명동 쇼핑", "namsan-cable-car":"남산 케이블카", "n-seoul-tower":"N서울타워 야경", "gangnam-cafe-date":"강남 카페 데이트", "coex-starfield-library":"코엑스 별마당도서관", "coex-aquarium":"코엑스 아쿠아리움", "seongsu-pop-up-tour":"성수 팝업스토어 투어", "seongsu-cafe-hopping":"성수 카페 투어", "ikseondong-hanok-cafe":"익선동 한옥 카페", "bukchon-photo-walk":"북촌 사진 산책", "palace-night-walk":"고궁 야간 산책", "board-game-cafe":"보드게임 카페", "comic-book-cafe":"만화 카페", "indoor-climbing":"실내 클라이밍", "ice-skating":"아이스 스케이트", "river-cruise":"한강 유람선", "rooftop-cinema":"루프탑 영화", "traditional-tea":"전통 찻집", "couple-ring-making":"커플링 만들기",
    bbq:"바비큐", steak:"스테이크", italian:"이탈리안", japanese:"일식", chinese:"중식", thai:"태국 음식", french:"프렌치", mexican:"멕시칸", vegan:"비건 식사", dessert:"디저트", bakery:"베이커리", cafe:"카페", "makgeolli-jeon":"막걸리와 전", hotpot:"전골", "market-tasting":"시장 먹거리", "chef-tasting":"셰프 테이스팅", "han-river-ramen-meal":"한강 라면", "tteokbokki-sundae":"떡볶이와 순대", "korean-bbq-date":"한식 바비큐", "pasta-tiramisu":"파스타와 티라미수", omakase:"오마카세", bingsu:"빙수", "croffle-coffee":"크로플과 커피", "rooftop-dinner":"루프탑 디너",
    romantic:"로맨틱", healing:"힐링", luxury:"럭셔리", funny:"유쾌한", cute:"귀여운", adventure:"모험", hidden:"숨은 명소", instagram:"사진에 남는", classic:"클래식", traditional:"전통", elegant:"우아한", night:"밤의", sunset:"노을", rainy:"비 오는 날", cozy:"아늑한", energetic:"활기찬",
    walk:"도보", subway:"지하철", bike:"자전거", KTX:"KTX", SRT:"SRT", ITX:"ITX", bus:"버스", "rental-car":"렌터카", taxi:"택시", ferry:"페리"
  },
  es: {
    river:"Ribera", beach:"Playa", mountain:"Montaña", forest:"Bosque", lake:"Lago", downtown:"Centro", "traditional-village":"Pueblo tradicional", island:"Isla", countryside:"Campo", rooftop:"Azotea", "hidden-alley":"Callejón escondido", "theme-park":"Parque temático", aquarium:"Acuario", gallery:"Galería", market:"Mercado", observatory:"Mirador", temple:"Templo", hanok:"Casa tradicional", "han-river":"Río Han", jamsil:"Jamsil", hongdae:"Hongdae", myeongdong:"Myeongdong", gangnam:"Gangnam", seongsu:"Seongsu", ikseondong:"Ikseondong", namsan:"Namsan", bukchon:"Bukchon", yeouido:"Yeouido", yeonnam:"Yeonnam-dong", "seokchon-lake":"Lago Seokchon",
    kayak:"Kayak", "rail-bike":"Bicicleta sobre rieles", bowling:"Bolos", vr:"Experiencia VR", "escape-room":"Escape room", "cooking-class":"Clase de cocina", pottery:"Taller de cerámica", painting:"Clase de pintura", shopping:"Compras", "wine-tasting":"Cata de vinos", jazz:"Jazz", "mini-golf":"Minigolf", camping:"Camping", "photography-walk":"Paseo fotográfico", massage:"Masaje", "bike-ride":"Paseo en bicicleta", picnic:"Pícnic", arcade:"Arcade", "coin-karaoke":"Karaoke", "flower-class":"Taller floral", "perfume-making":"Creación de perfume", "sunset-ferry":"Ferry al atardecer", "han-river-ramen":"Cocinar ramen junto al río Han", "han-river-picnic":"Pícnic en el río Han", "lotte-aquarium":"Acuario Lotte World", "seoul-sky":"Mirador Seoul Sky", "seokchon-lake-walk":"Paseo por el lago Seokchon", "lotte-world":"Lotte World", "hongdae-street-date":"Cita por Hongdae", "hongdae-live-music":"Música en vivo en Hongdae", "yeonnam-park-walk":"Paseo por Yeonnam", "photo-booth":"Fotomatón en pareja", "myeongdong-street-food":"Comida callejera en Myeongdong", "myeongdong-shopping":"Compras en Myeongdong", "namsan-cable-car":"Teleférico de Namsan", "n-seoul-tower":"N Seoul Tower de noche", "gangnam-cafe-date":"Cita de café en Gangnam", "coex-starfield-library":"Biblioteca Starfield COEX", "coex-aquarium":"Acuario COEX", "seongsu-pop-up-tour":"Pop-ups de Seongsu", "seongsu-cafe-hopping":"Ruta de cafés de Seongsu", "ikseondong-hanok-cafe":"Café hanok en Ikseondong", "bukchon-photo-walk":"Paseo fotográfico por Bukchon", "palace-night-walk":"Paseo nocturno por el palacio", "board-game-cafe":"Café de juegos de mesa", "comic-book-cafe":"Café de cómics", "indoor-climbing":"Escalada interior", "ice-skating":"Patinaje sobre hielo", "river-cruise":"Crucero por el río Han", "rooftop-cinema":"Cine en azotea", "traditional-tea":"Casa de té tradicional", "couple-ring-making":"Crear anillos en pareja",
    bbq:"Barbacoa", steak:"Carne", italian:"Italiano", japanese:"Japonés", chinese:"Chino", thai:"Tailandés", french:"Francés", mexican:"Mexicano", vegan:"Vegano", dessert:"Postre", bakery:"Panadería", cafe:"Café", "makgeolli-jeon":"Makgeolli y jeon", hotpot:"Hotpot", "market-tasting":"Degustación de mercado", "chef-tasting":"Menú del chef", "han-river-ramen-meal":"Ramen junto al río Han", "tteokbokki-sundae":"Tteokbokki y sundae", "korean-bbq-date":"Barbacoa coreana", "pasta-tiramisu":"Pasta y tiramisú", omakase:"Omakase", bingsu:"Bingsu", "croffle-coffee":"Croffle y café", "rooftop-dinner":"Cena en azotea",
    romantic:"Romántico", healing:"Relajante", luxury:"Lujoso", funny:"Divertido", cute:"Encantador", adventure:"Aventura", hidden:"Secreto", instagram:"Fotogénico", classic:"Clásico", traditional:"Tradicional", elegant:"Elegante", night:"Nocturno", sunset:"Atardecer", rainy:"Lluvioso", cozy:"Acogedor", energetic:"Energético"
  }
};
const label = (id, language = "en") => LABELS[language]?.[id] || String(id || "").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const timeSlots = ["10:30", "12:30", "14:30", "17:00", "19:00", "20:30"];
const MAX_VISIBLE_ACTIVITY_ALTERNATIVES = 12;
const INDOOR_RAIN_PRIORITY = ["lotte-aquarium", "coex-aquarium", "coex-starfield-library", "myeongdong-shopping", "seongsu-cafe-hopping", "ikseondong-hanok-cafe", "traditional-tea", "board-game-cafe", "escape-room", "pottery", "photo-booth"];
const byId = (items, ids) => ids.map((id) => items.find((item) => item.id === id)).filter(Boolean);
const isSeoulExperience = (_input, context) => context.destination?.id === "seoul";
const belongsToDestination = (item, context) => context.destination?.id === "seoul" || !(item?.tags || []).includes("seoul");
const rotate = (items, offset) => items.length ? items.map((_, index) => items[(index + offset) % items.length]) : [];

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
  const seoulMode = isSeoulExperience(input, context);
  const cluster = seoulMode ? SEOUL_EXPERIENCE_CLUSTERS[hash(`${seed}:cluster`) % SEOUL_EXPERIENCE_CLUSTERS.length] : null;
  const eligibleLocations = EXPERIENCE_INGREDIENTS.locations.filter((item) => belongsToDestination(item, context));
  const eligibleActivities = EXPERIENCE_INGREDIENTS.activities.filter((item) => belongsToDestination(item, context));
  const eligibleFoods = EXPERIENCE_INGREDIENTS.foods.filter((item) => belongsToDestination(item, context));
  const location = cluster ? EXPERIENCE_INGREDIENTS.locations.find((item) => item.id === cluster.location) : pick(eligibleLocations, wanted, seed, generationIndex, vault);
  const clusterActivities = cluster ? rotate(byId(EXPERIENCE_INGREDIENTS.activities, cluster.activities), hash(`${seed}:activities`) % cluster.activities.length) : [];
  const clusterFoods = cluster ? rotate(byId(EXPERIENCE_INGREDIENTS.foods, cluster.foods), hash(`${seed}:foods`) % cluster.foods.length) : [];
  const activities = cluster ? clusterActivities.slice(0, 4) : [0, 1, 2, 3].map((offset) => pick(eligibleActivities, wanted, seed, generationIndex + offset * 3, vault)).filter((item, index, list) => item && list.findIndex((other) => other.id === item.id) === index);
  const foods = cluster ? clusterFoods.slice(0, 4) : [0, 1, 2, 3].map((offset) => pick(eligibleFoods, wanted, seed, generationIndex + offset * 5, vault)).filter((item, index, list) => item && list.findIndex((other) => other.id === item.id) === index);
  const mood = pick(EXPERIENCE_INGREDIENTS.moods, wanted, seed, generationIndex, vault);
  const allowedTransport = EXPERIENCE_INGREDIENTS.transport.filter((item) => (context.transport || []).some((mode) => String(mode).toLowerCase().includes(item.id.toLowerCase())));
  const transport = pick(allowedTransport.length ? allowedTransport : EXPERIENCE_INGREDIENTS.transport, wanted, seed, generationIndex, vault);
  const rainCandidates = byId(eligibleActivities, INDOOR_RAIN_PRIORITY);
  const rainActivity = rainCandidates.find((item) => cluster?.activities.includes(item.id) && !activities.some((chosen) => chosen.id === item.id))
    || rainCandidates.find((item) => cluster?.activities.includes(item.id))
    || rainCandidates.find((item) => !activities.some((chosen) => chosen.id === item.id));
  const ingredientIds = [location, mood, transport, ...activities, ...foods].filter(Boolean).map((item) => item.id);
  const signature = `ONE-XP-${hash(ingredientIds.join("|")) .toString(36).toUpperCase()}`;
  const timelineIngredients = [activities[0], foods[0], activities[1], activities[2], foods[1]].filter(Boolean);
  const broadAlternatives = cluster
    ? [...clusterActivities.slice(1), ...SEOUL_EXPERIENCE_CLUSTERS.filter((item) => item.id !== cluster.id).flatMap((item) => byId(EXPERIENCE_INGREDIENTS.activities, item.activities).slice(0, 2))]
      .filter((item, index, list) => item && !activities.slice(0, 1).some((chosen) => chosen.id === item.id) && list.findIndex((other) => other.id === item.id) === index)
      .slice(0, MAX_VISIBLE_ACTIVITY_ALTERNATIVES)
    : activities.slice(1);
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
      timeline: Object.freeze(timelineIngredients.map((item, index) => Object.freeze({ time: timeSlots[index], title: label(item.id, language), type: EXPERIENCE_INGREDIENTS.foods.includes(item) ? "food" : "activity", phase: ["beginning", "build", "highlight", "relax", "memory"][index] }))),
      rainPlan: rainActivity ? label(rainActivity.id, language) : language === "ko" ? "실내 대안" : language === "es" ? "Alternativa interior" : "Indoor flexible alternative",
      budget: input.budget ? { status: "USER_LIMIT", amount: input.budget } : { status: "ESTIMATED_AFTER_SELECTION", amount: null },
      reasoning: language === "ko" ? (context.nearbyFirst ? "가까운 곳부터 이어 이동은 줄이고 함께하는 시간을 늘렸어요." : "이동, 휴식, 음식과 특별한 순간의 균형을 맞췄어요.") : language === "es" ? (context.nearbyFirst ? "Priorizamos lugares cercanos para compartir más y desplazarnos menos." : "La secuencia equilibra movimiento, descanso, comida y un recuerdo especial.") : context.nearbyFirst ? "Nearby-first pacing leaves more time for shared moments and less time in transit." : "The sequence balances movement, rest, food and one distinctive memory anchor."
    }),
    alternatives: Object.freeze(broadAlternatives.map((item) => label(item.id, language))),
    visibleAlternativeLimit: MAX_VISIBLE_ACTIVITY_ALTERNATIVES,
    experienceCluster: cluster?.id || null,
    prompt: buildExperienceGenerationPrompt({ ...input, context }),
    combinatorialLibrarySize: Object.values(EXPERIENCE_INGREDIENTS).reduce((total, list) => total * list.length, 1),
    ingredientCount: ingredientCount(),
    quality: Object.freeze({ passed: ingredientIds.every((id) => {
      const item = [...EXPERIENCE_INGREDIENTS.locations, ...EXPERIENCE_INGREDIENTS.activities, ...EXPERIENCE_INGREDIENTS.foods].find((candidate) => candidate.id === id);
      return !item || belongsToDestination(item, context);
    }), checks: Object.freeze(["destination-only", "coherent-story", "transport-continuity", "relationship-fit", "weather-backup"]) }),
    approval: Object.freeze({ required: true, approved: false, externalExecution: false })
  });
}
