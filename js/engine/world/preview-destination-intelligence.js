const normalizeText = (value = "") => String(value)
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const localized = (language, en, ko = en, es = en) => language === "ko" ? ko : language === "es" ? es : en;

const asRichItems = (names, city, type) => names.map((name, index) => ({
  icon: type === "restaurant" ? ["food", "noodle", "coffee", "dessert", "dinner", "local"][index % 6] : ["pin", "view", "culture", "shopping", "nature", "show"][index % 6],
  name,
  tags: [],
  source: "curated_preview",
  advice: {
    en: type === "restaurant"
      ? `A strong ${city} food stop; ONE will verify the best dish and timing before action.`
      : `A real ${city} highlight; ONE connects it with route timing, nearby food, and weather backup.`,
    ko: type === "restaurant"
      ? `${city}에서 넣을 만한 식사 후보입니다. 실행 전 대표 메뉴와 시간을 확인합니다.`
      : `${city} 일정에 넣을 만한 실제 장소입니다. 동선, 주변 식사, 날씨 대안과 함께 확인합니다.`,
    es: type === "restaurant"
      ? `Buena parada gastronomica en ${city}; ONE verifica plato y horario antes de actuar.`
      : `Lugar real de ${city}; ONE lo conecta con ruta, comida cercana y clima.`
  }
}));

const baseProfiles = {
  tokyo: {
    city: "Tokyo", country: "Japan", countryCode: "JP", currency: "JPY", continent: "Asia", latitude: 35.6762, longitude: 139.6503,
    aliases: ["tokyo", "tokio", "도쿄", "東京", "東京都", "japan", "japon", "japón", "japonia", "일본"],
    hero: { icon: "torii", className: "is-japan", line: ["City lights, food alleys, quiet rituals.", "도시의 불빛, 골목 맛집, 조용한 순간.", "Luces, comida y momentos tranquilos."] },
    journeys: [
      ["Tokyo food, skyline and neighborhoods", "도쿄 미식·전망·동네 산책", "Tokio: comida, vistas y barrios", "Shibuya, Tsukiji/Toyosu, teamLab, Ginza, and a night view with realistic pacing.", "시부야, 츠키지/도요스, 팀랩, 긴자, 야경을 무리 없이 묶은 구성입니다.", ["Shibuya Sky", "Tsukiji sushi", "teamLab", "Ginza"]],
      ["Classic Tokyo first trip", "처음 가는 도쿄 핵심", "Tokio esencial", "Asakusa, Harajuku, Akihabara, ramen, cafes, and one indoor backup.", "아사쿠사, 하라주쿠, 아키하바라, 라멘, 카페, 실내 대안을 함께 둡니다.", ["Asakusa", "Harajuku", "Akihabara", "Ramen"]],
      ["Tokyo plus a day escape", "도쿄와 하루 근교", "Tokio con escapada", "Keeps Tokyo easy but adds Hakone, Kamakura, or Yokohama when there is enough time.", "도쿄 동선은 편하게 두고 기간이 충분하면 하코네·가마쿠라·요코하마를 더합니다.", ["Hakone", "Kamakura", "Yokohama", "Onsen"]],
      ["Anime, shopping and late cafes", "애니·쇼핑·늦은 카페", "Anime, compras y cafes", "Akihabara, Nakano, Shinjuku, Harajuku, character cafes, and night snacks.", "아키하바라, 나카노, 신주쿠, 하라주쿠, 캐릭터 카페와 야식을 엮습니다.", ["Akihabara", "Nakano", "Shinjuku", "Cafe"]]
    ],
    restaurants: ["Tsukiji / Toyosu sushi counter", "Tokyo ramen alley", "Wagyu yakiniku table", "Uji matcha dessert stop", "Kissaten coffee break", "Ekiben train lunch"],
    places: ["Shibuya Sky and Scramble Crossing", "teamLab Planets / Borderless", "Asakusa Senso-ji and Nakamise", "Ginza / Harajuku shopping route", "Akihabara retro arcade", "Hakone onsen and Mt. Fuji view", "Sunshine Aquarium", "Tokyo Tower night view"]
  },
  newyork: {
    city: "New York City", country: "United States", countryCode: "US", currency: "USD", continent: "North America", latitude: 40.7128, longitude: -74.006,
    aliases: ["new york", "new york city", "nyc", "nueva york", "뉴욕"],
    hero: { icon: "liberty", className: "is-nyc", line: ["Skyline, food, Broadway, neighborhoods.", "스카이라인, 음식, 브로드웨이, 동네 감성.", "Skyline, comida, Broadway y barrios."] },
    journeys: [
      ["NYC first-timer essentials", "뉴욕 핵심 일정", "Nueva York esencial", "Manhattan icons, Brooklyn, food, shopping, and night views without rushing.", "맨해튼 대표 명소, 브루클린, 음식, 쇼핑, 야경을 날마다 나눕니다.", ["Statue of Liberty", "Broadway", "Central Park", "Brooklyn"]],
      ["Broadway, museums and skyline", "브로드웨이·미술관·전망", "Broadway, museos y vistas", "Culture, indoor options, and skyline moments with clean routes.", "공연, 미술관, 실내 대안, 전망대를 차분히 즐깁니다.", ["Broadway", "MoMA", "The Met", "Top of the Rock"]],
      ["Shopping and food New York", "쇼핑과 맛집 뉴욕", "Compras y comida", "SoHo, Fifth Avenue, Chelsea Market, bakeries, steak, pizza, and outlet time.", "소호, 5번가, 첼시마켓, 베이커리, 스테이크, 피자, 아울렛 선택지를 둡니다.", ["SoHo", "Macy's", "Chelsea Market", "Woodbury"]],
      ["Brooklyn and local neighborhoods", "브루클린과 로컬 동네", "Brooklyn y barrios", "More parks, cafes, photos, and less checklist pressure.", "체크리스트보다 동네 산책, 사진, 공원, 카페 시간을 살립니다.", ["DUMBO", "High Line", "Village", "Cafes"]]
    ],
    restaurants: ["Russ & Daughters", "Katz's Delicatessen", "Joe's Pizza", "Los Tacos No. 1", "Levain Bakery", "Keens Steakhouse"],
    places: ["Statue of Liberty and Ellis Island", "Central Park", "Brooklyn Bridge and DUMBO", "Broadway or Times Square", "Top of the Rock / Empire State", "Fifth Avenue and Macy's Herald Square", "B&H Photo Video", "Chelsea Market"]
  },
  losangeles: { city: "Los Angeles", country: "United States", countryCode: "US", currency: "USD", continent: "North America", latitude: 34.0522, longitude: -118.2437, aliases: ["los angeles", "la", "l a", "로스앤젤레스"], places: ["Griffith Observatory", "Santa Monica Pier", "The Getty Center", "Hollywood Bowl", "Grand Central Market", "Abbot Kinney"], restaurants: ["Grand Central Market", "Koreatown BBQ", "In-N-Out route stop", "Urth Caffe", "Arts District dinner", "Taco truck stop"] },
  paris: { city: "Paris", country: "France", countryCode: "FR", currency: "EUR", continent: "Europe", latitude: 48.8566, longitude: 2.3522, aliases: ["paris", "parís", "파리"], places: ["Eiffel Tower and Trocadero", "Louvre Museum", "Le Marais", "Montmartre", "Seine river walk", "Galeries Lafayette rooftop"], restaurants: ["Boulangerie breakfast", "Bistro steak frites", "Crepe stop", "Le Marais falafel", "Saint-Germain cafe", "Patisserie dessert route"] },
  london: { city: "London", country: "United Kingdom", countryCode: "GB", currency: "GBP", continent: "Europe", latitude: 51.5074, longitude: -0.1278, aliases: ["london", "londres", "런던"], places: ["Tower Bridge", "British Museum", "West End show", "Borough Market", "Notting Hill", "Sky Garden"], restaurants: ["Borough Market lunch", "Sunday roast", "Dishoom-style curry", "Afternoon tea", "Soho small plates", "Brick Lane bites"] },
  seoul: { city: "Seoul", country: "South Korea", countryCode: "KR", currency: "KRW", continent: "Asia", latitude: 37.5665, longitude: 126.978, aliases: ["seoul", "서울", "seúl"], places: ["Seoul Forest", "Han River ramen picnic", "Ikseon-dong", "Namsan Seoul Tower", "COEX Starfield Library", "Seongsu cafe street"], restaurants: ["Han River ramyeon", "Korean BBQ", "Gwangjang Market bindaetteok", "Seongsu dessert cafe", "Makgeolli and jeon", "Myeongdong street food"] },
  bangkok: { city: "Bangkok", country: "Thailand", countryCode: "TH", currency: "THB", continent: "Asia", latitude: 13.7563, longitude: 100.5018, aliases: ["bangkok", "방콕"], places: ["Grand Palace", "Wat Arun sunset", "Chatuchak Market", "ICONSIAM riverfront", "Chinatown Yaowarat", "Thai massage stop"], restaurants: ["Pad Thai stop", "Boat noodles", "Mango sticky rice", "Yaowarat street food", "Thai iced tea cafe", "Riverside dinner"] },
  singapore: { city: "Singapore", country: "Singapore", countryCode: "SG", currency: "SGD", continent: "Asia", latitude: 1.3521, longitude: 103.8198, aliases: ["singapore", "singapur", "싱가포르"], places: ["Gardens by the Bay", "Marina Bay Sands", "Jewel Changi", "Sentosa", "Haji Lane", "National Gallery Singapore"], restaurants: ["Hawker chicken rice", "Laksa stop", "Chili crab dinner", "Kaya toast breakfast", "Satay by the Bay", "Tiong Bahru cafe"] },
  rome: { city: "Rome", country: "Italy", countryCode: "IT", currency: "EUR", continent: "Europe", latitude: 41.9028, longitude: 12.4964, aliases: ["rome", "roma", "로마"], places: ["Colosseum", "Roman Forum", "Trevi Fountain", "Vatican Museums", "Trastevere", "Spanish Steps"], restaurants: ["Carbonara trattoria", "Suppli snack", "Gelato stop", "Cacio e pepe dinner", "Espresso bar", "Trastevere aperitivo"] },
  barcelona: { city: "Barcelona", country: "Spain", countryCode: "ES", currency: "EUR", continent: "Europe", latitude: 41.3874, longitude: 2.1686, aliases: ["barcelona", "바르셀로나"], places: ["Sagrada Familia", "Park Guell", "Gothic Quarter", "La Boqueria", "Casa Batllo", "Barceloneta"], restaurants: ["Tapas crawl", "Paella by the beach", "Churros and chocolate", "Boqueria market lunch", "Catalan seafood", "Vermouth bar"] },
  sydney: { city: "Sydney", country: "Australia", countryCode: "AU", currency: "AUD", continent: "Oceania", latitude: -33.8688, longitude: 151.2093, aliases: ["sydney", "시드니"], places: ["Sydney Opera House", "Harbour Bridge", "Bondi to Coogee walk", "The Rocks", "Manly ferry", "Darling Harbour"], restaurants: ["Harbour brunch", "Fish and chips by Bondi", "Asian fusion dinner", "Flat white cafe", "Seafood market", "Rooftop bar"] }
};

const enrichProfile = (id, profile) => Object.freeze({
  id,
  ...profile,
  hero: profile.hero || { icon: "star", className: "is-global", line: ["Local highlights, food, and simple movement.", "현지 하이라이트, 음식, 쉬운 동선.", "Lugares locales, comida y ruta simple."] },
  journeys: profile.journeys || [
    [`${profile.city} essentials`, `${profile.city} 핵심 일정`, `${profile.city} esencial`, `A balanced route through ${profile.city}'s most useful first-visit highlights.`, `${profile.city}의 첫 방문 핵심을 무리 없이 묶은 구성입니다.`, profile.places.slice(0, 4)],
    [`Food and neighborhoods in ${profile.city}`, `${profile.city} 맛집과 동네`, `Comida y barrios en ${profile.city}`, `Food, cafes, walking areas, and one flexible evening plan.`, `음식, 카페, 산책 구역과 저녁 선택지를 둡니다.`, profile.restaurants.slice(0, 4)],
    [`Culture and views in ${profile.city}`, `${profile.city} 문화와 전망`, `Cultura y vistas en ${profile.city}`, `Indoor culture, skyline moments, and weather-safe pacing.`, `실내 문화, 전망 포인트, 날씨 대안을 함께 둡니다.`, profile.places.slice(1, 5)],
    [`Slow local ${profile.city}`, `천천히 즐기는 ${profile.city}`, `${profile.city} local y tranquilo`, `A lighter route with fewer transfers and more time to enjoy each stop.`, `이동을 줄이고 각 장소를 더 여유 있게 즐기는 구성입니다.`, profile.places.slice(2, 6)]
  ],
  restaurants: asRichItems(profile.restaurants, profile.city, "restaurant"),
  places: asRichItems(profile.places, profile.city, "place")
});

export const PREVIEW_DESTINATION_PROFILES = Object.freeze(Object.fromEntries(
  Object.entries(baseProfiles).map(([id, profile]) => [id, enrichProfile(id, profile)])
));

export const previewTravelIntent = (mission = "") => /travel|trip|vacation|holiday|honeymoon|flight|hotel|airport|tour|visit|journey|viaje|viajar|vacaciones|vuelo|aeropuerto|turismo|voyage|voyager|vacances|sejour|séjour|vol|aeroport|aéroport|tourisme|여행|항공|호텔|공항|관광/i.test(String(mission || ""));

export const resolvePreviewDestination = (value = "") => {
  const text = normalizeText(value);
  if (!text) return null;
  return Object.values(PREVIEW_DESTINATION_PROFILES).find((profile) => profile.aliases.some((alias) => text.includes(normalizeText(alias)))) || null;
};

export const canonicalDestinationKey = (candidate = {}) => {
  const combined = [candidate.id, candidate.city, candidate.state, candidate.country, candidate.countryCode || candidate.code, candidate.description].filter(Boolean).join(" ");
  const profile = resolvePreviewDestination(combined);
  if (profile) return profile.id;
  const country = String(candidate.countryCode || candidate.code || candidate.country || "").toUpperCase();
  const city = normalizeText(candidate.city || candidate.name || candidate.displayName || "");
  const lat = Number(candidate.latitude);
  const lng = Number(candidate.longitude);
  const geo = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(1)},${lng.toFixed(1)}` : "";
  return [country, city, geo].filter(Boolean).join("|") || normalizeText(combined);
};

export const dedupePreviewDestinations = (candidates = []) => {
  const map = new Map();
  candidates.filter(Boolean).forEach((candidate) => {
    const key = canonicalDestinationKey(candidate);
    if (!key) return;
    const existing = map.get(key);
    const score = Number(Boolean(candidate.city)) + Number(Boolean(candidate.countryCode || candidate.code)) + Number(Boolean(candidate.latitude && candidate.longitude));
    const existingScore = Number(Boolean(existing?.city)) + Number(Boolean(existing?.countryCode || existing?.code)) + Number(Boolean(existing?.latitude && existing?.longitude));
    map.set(key, existing && existingScore >= score ? existing : candidate);
  });
  return [...map.values()];
};

export const profileForResult = (result = {}, fallbackDestination = "") => resolvePreviewDestination([
  result.destination?.city,
  result.destination?.country,
  result.countryProfile?.capital,
  result.countryProfile?.name,
  result.rawInput,
  result.mission,
  fallbackDestination
].filter(Boolean).join(" "));

export const previewItemAdvice = (item = {}, language = "en") => {
  if (item.advice) return localized(language, item.advice.en, item.advice.ko, item.advice.es);
  return "";
};

export const mapTileUrlForProfile = (profile) => {
  if (!profile?.latitude || !profile?.longitude) return "";
  const zoom = 11;
  const latRad = profile.latitude * Math.PI / 180;
  const n = 2 ** zoom;
  const x = Math.floor((profile.longitude + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
};

export const buildPreviewMapMarkers = (profile, places = [], restaurants = []) => {
  const source = [...(places || []), ...(restaurants || [])].slice(0, 8);
  return source.map((item, index) => ({
    label: item.name || profile?.city || "Destination",
    category: index < places.length ? "place" : "food",
    left: [47, 58, 38, 65, 52, 43, 70, 31][index % 8],
    top: [42, 48, 55, 35, 62, 33, 56, 45][index % 8]
  }));
};
