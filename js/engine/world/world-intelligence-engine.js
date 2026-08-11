const clean = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim();

const compact = (value) => clean(value).replaceAll(" ", "");

const destination = (id, city, country, countryCode, continent, currency, aliases, transport = ["public transit", "walk", "taxi"], hierarchy = {}) => Object.freeze({
  id,
  city,
  cityKo: hierarchy.cityKo || "",
  cityEs: hierarchy.cityEs || "",
  country,
  countryKo: hierarchy.countryKo || "",
  countryEs: hierarchy.countryEs || "",
  countryCode,
  continent,
  currency,
  aliases: Object.freeze([...new Set([
    city,
    hierarchy.cityKo,
    hierarchy.cityEs,
    country,
    hierarchy.countryKo,
    hierarchy.countryEs,
    `${city} ${country}`,
    `${hierarchy.cityKo || city} ${hierarchy.countryKo || country}`,
    `${hierarchy.cityEs || city} ${hierarchy.countryEs || country}`,
    ...aliases
  ].filter(Boolean).map(clean))]),
  transport: Object.freeze(transport),
  state: hierarchy.state || "",
  district: hierarchy.district || "",
  neighborhood: hierarchy.neighborhood || "",
  latitude: hierarchy.latitude,
  longitude: hierarchy.longitude,
  placeType: hierarchy.placeType || "city",
  importance: hierarchy.importance || 0.7
});

const CONTINENT_CODES = Object.freeze({
  Africa: "DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC ZA SS SD TZ TG TN UG ZM ZW".split(" "),
  Asia: "AF AM AZ BD BT BN KH CN GE IN ID JP KZ KG LA MY MV MN MM NP PK PH SG KR LK TJ TH TL TM UZ VN HK MO TW".split(" "),
  "Middle East": "BH CY IR IQ IL JO KW LB OM PS QA SA SY TR AE YE".split(" "),
  Europe: "AL AD AT BY BE BA BG HR CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA".split(" "),
  Oceania: "AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU".split(" "),
  "South America": "AR BO BR CL CO EC GY PY PE SR UY VE".split(" "),
  "Central America": "BZ CR SV GT HN NI PA".split(" "),
  Caribbean: "AG BS BB CU DM DO GD HT JM KN LC VC TT PR".split(" "),
  "North America": "CA MX US GL BM".split(" ")
});

const CODE_TO_CONTINENT = Object.freeze(Object.fromEntries(
  Object.entries(CONTINENT_CODES).flatMap(([continent, codes]) => codes.map((code) => [code, continent]))
));

const CURRENCY_BY_CODE = Object.freeze({
  AE: "AED", AR: "ARS", AU: "AUD", BR: "BRL", CA: "CAD", CH: "CHF", CL: "CLP", CN: "CNY", CO: "COP", CR: "CRC", CZ: "CZK", DE: "EUR",
  DK: "DKK", DO: "DOP", EG: "EGP", ES: "EUR", FR: "EUR", GB: "GBP", GT: "GTQ", HK: "HKD", HN: "HNL", HU: "HUF", ID: "IDR",
  IN: "INR", IS: "ISK", IT: "EUR", JP: "JPY", KH: "KHR", KR: "KRW", MA: "MAD", MX: "MXN", MY: "MYR", NI: "NIO", NL: "EUR",
  NO: "NOK", NZ: "NZD", PA: "PAB", PE: "PEN", PH: "PHP", PL: "PLN", PT: "EUR", SE: "SEK", SG: "SGD", SV: "USD", TH: "THB",
  TW: "TWD", US: "USD", VN: "VND", ZA: "ZAR"
});

const COUNTRY_ALIASES = Object.freeze({
  AR: ["Argentina", "아르헨티나", "Argentina"],
  AU: ["Australia", "호주", "Australia"],
  BR: ["Brazil", "브라질", "Brasil"],
  CA: ["Canada", "캐나다", "Canadá"],
  CL: ["Chile", "칠레", "Chile"],
  CO: ["Colombia", "콜롬비아", "Colombia"],
  DE: ["Germany", "독일", "Alemania"],
  ES: ["Spain", "스페인", "España"],
  FR: ["France", "프랑스", "Francia"],
  GB: ["United Kingdom", "UK", "Britain", "영국", "Reino Unido"],
  GT: ["Guatemala", "과테말라", "Guatemala"],
  ID: ["Indonesia", "인도네시아", "Indonesia"],
  IN: ["India", "인도", "India"],
  IT: ["Italy", "이탈리아", "Italia"],
  JP: ["Japan", "일본", "Japón", "日本"],
  KH: ["Cambodia", "캄보디아", "Camboya"],
  KR: ["South Korea", "Korea", "대한민국", "한국", "Corea del Sur"],
  MG: ["Madagascar", "마다가스카르", "Madagascar"],
  MX: ["Mexico", "멕시코", "México"],
  MY: ["Malaysia", "말레이시아", "Malasia"],
  NZ: ["New Zealand", "뉴질랜드", "Nueva Zelanda"],
  PE: ["Peru", "페루", "Perú"],
  PH: ["Philippines", "필리핀", "Filipinas"],
  PT: ["Portugal", "포르투갈", "Portugal"],
  SE: ["Sweden", "스웨덴", "Suecia"],
  SG: ["Singapore", "싱가포르", "Singapur"],
  TH: ["Thailand", "태국", "Tailandia"],
  TW: ["Taiwan", "대만", "Taiwán"],
  US: ["United States", "USA", "US", "America", "미국", "Estados Unidos"],
  VN: ["Vietnam", "베트남", "Vietnam"],
  ZA: ["South Africa", "남아프리카", "남아공", "Sudáfrica"]
});

const displayRegion = (code, locale = "en") => {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) || code;
  } catch {
    return COUNTRY_ALIASES[code]?.[0] || code;
  }
};

const countryDestination = (code) => {
  const country = displayRegion(code, "en");
  const ko = displayRegion(code, "ko");
  const es = displayRegion(code, "es");
  return destination(
    code.toLowerCase(),
    country,
    country,
    code,
    CODE_TO_CONTINENT[code] || "Other",
    CURRENCY_BY_CODE[code] || "",
    [country, ko, es, ...(COUNTRY_ALIASES[code] || [])],
    ["public transit", "walk", "taxi"],
    { placeType: "country", importance: 0.55, countryKo: ko, countryEs: es, cityKo: ko, cityEs: es }
  );
};

const MAJOR_DESTINATIONS = Object.freeze([
  destination("seoul", "Seoul", "South Korea", "KR", "Asia", "KRW", ["서울", "서울시", "ソウル", "Seúl"], ["subway", "bus", "walk", "taxi"], { latitude: 37.5665, longitude: 126.978, importance: 0.96 }),
  destination("busan", "Busan", "South Korea", "KR", "Asia", "KRW", ["부산", "부산시", "Busán"], ["KTX", "SRT", "subway", "bus"], { latitude: 35.1796, longitude: 129.0756 }),
  destination("jeju", "Jeju", "South Korea", "KR", "Asia", "KRW", ["Jeju Island", "제주", "제주도"], ["flight", "car", "bus"], { latitude: 33.4996, longitude: 126.5312, placeType: "island" }),
  destination("tokyo", "Tokyo", "Japan", "JP", "Asia", "JPY", ["東京", "도쿄", "Tokio"], ["rail", "subway", "walk"], { latitude: 35.6762, longitude: 139.6503, importance: 0.97 }),
  destination("osaka", "Osaka", "Japan", "JP", "Asia", "JPY", ["大阪", "오사카"], ["rail", "subway", "walk"], { latitude: 34.6937, longitude: 135.5023 }),
  destination("kyoto", "Kyoto", "Japan", "JP", "Asia", "JPY", ["京都", "교토", "Kioto"], ["rail", "bus", "walk"], { latitude: 35.0116, longitude: 135.7681 }),
  destination("ho-chi-minh-city", "Ho Chi Minh City", "Vietnam", "VN", "Asia", "VND", ["Ho Chi Minh", "Ho Chi Min", "Saigon", "HCMC", "호치민", "호찌민", "Ciudad Ho Chi Minh"], ["metro", "bus", "walk", "taxi"], { latitude: 10.8231, longitude: 106.6297 }),
  destination("sapa", "Sapa", "Vietnam", "VN", "Asia", "VND", ["Sa Pa", "사파", "사파 베트남", "Sapa Vietnam"], ["walk", "car", "bus"], { latitude: 22.3364, longitude: 103.8438 }),
  destination("hanoi", "Hanoi", "Vietnam", "VN", "Asia", "VND", ["Hà Nội", "하노이"], ["metro", "bus", "walk", "taxi"], { latitude: 21.0278, longitude: 105.8342 }),
  destination("singapore", "Singapore", "Singapore", "SG", "Asia", "SGD", ["싱가포르", "Singapur"], ["MRT", "bus", "walk", "taxi"], { latitude: 1.3521, longitude: 103.8198 }),
  destination("bangkok", "Bangkok", "Thailand", "TH", "Asia", "THB", ["กรุงเทพ", "방콕", "Bangkok Thailand"], ["BTS", "MRT", "boat", "taxi"], { latitude: 13.7563, longitude: 100.5018 }),
  destination("taipei", "Taipei", "Taiwan", "TW", "Asia", "TWD", ["台北", "타이베이", "타이페이"], ["MRT", "bus", "walk"], { latitude: 25.033, longitude: 121.5654 }),
  destination("hong-kong", "Hong Kong", "Hong Kong", "HK", "Asia", "HKD", ["香港", "홍콩"], ["MTR", "ferry", "walk"], { latitude: 22.3193, longitude: 114.1694 }),
  destination("lima", "Lima", "Peru", "PE", "South America", "PEN", ["리마", "Lima Peru"], ["bus", "walk", "taxi"], { latitude: -12.0464, longitude: -77.0428 }),
  destination("cusco", "Cusco", "Peru", "PE", "South America", "PEN", ["Cuzco", "쿠스코"], ["walk", "bus", "taxi"], { latitude: -13.5319, longitude: -71.9675 }),
  destination("machu-picchu", "Machu Picchu", "Peru", "PE", "South America", "PEN", ["마추픽추", "Machu Picchu Peru"], ["train", "bus", "walk"], { latitude: -13.1631, longitude: -72.545, placeType: "landmark" }),
  destination("new-york", "New York City", "United States", "US", "North America", "USD", ["New York", "NYC", "뉴욕", "Nueva York"], ["subway", "walk", "taxi"], { latitude: 40.7128, longitude: -74.006, importance: 0.98 }),
  destination("honolulu", "Honolulu", "United States", "US", "Oceania", "USD", ["Hawaii", "Oahu", "하와이", "호놀룰루"], ["bus", "walk", "car"], { latitude: 21.3069, longitude: -157.8583, placeType: "island" }),
  destination("los-angeles", "Los Angeles", "United States", "US", "North America", "USD", ["LA", "L.A.", "로스앤젤레스", "엘에이"], ["metro", "bus", "rideshare", "car"], { latitude: 34.0522, longitude: -118.2437 }),
  destination("london", "London", "United Kingdom", "GB", "Europe", "GBP", ["런던", "Londres"], ["tube", "walk", "bus"], { latitude: 51.5074, longitude: -0.1278, importance: 0.96 }),
  destination("paris", "Paris", "France", "FR", "Europe", "EUR", ["파리", "París"], ["metro", "walk", "bus"], { latitude: 48.8566, longitude: 2.3522, importance: 0.97 }),
  destination("rome", "Rome", "Italy", "IT", "Europe", "EUR", ["Roma", "로마"], ["metro", "walk", "bus"], { latitude: 41.9028, longitude: 12.4964 }),
  destination("barcelona", "Barcelona", "Spain", "ES", "Europe", "EUR", ["바르셀로나"], ["metro", "walk", "bus"], { latitude: 41.3874, longitude: 2.1686 }),
  destination("sydney", "Sydney", "Australia", "AU", "Oceania", "AUD", ["시드니", "Sídney"], ["train", "ferry", "walk", "bus"], { latitude: -33.8688, longitude: 151.2093 }),
  destination("melbourne", "Melbourne", "Australia", "AU", "Oceania", "AUD", ["멜버른", "Melbourne Australia"], ["tram", "train", "walk"], { latitude: -37.8136, longitude: 144.9631 }),
  destination("cape-town", "Cape Town", "South Africa", "ZA", "Africa", "ZAR", ["케이프타운", "Ciudad del Cabo"], ["bus", "walk", "taxi"], { latitude: -33.9249, longitude: 18.4241 }),
  destination("dubai", "Dubai", "United Arab Emirates", "AE", "Middle East", "AED", ["두바이", "Dubái"], ["metro", "walk", "taxi"], { latitude: 25.2048, longitude: 55.2708 }),
  destination("mexico-city", "Mexico City", "Mexico", "MX", "North America", "MXN", ["Ciudad de Mexico", "Ciudad de México", "CDMX", "멕시코시티", "멕시코 시티"], ["metro", "bus", "walk", "taxi"], { latitude: 19.4326, longitude: -99.1332 }),
  destination("santiago", "Santiago", "Chile", "CL", "South America", "CLP", ["Santiago Chile", "산티아고 칠레"], ["metro", "bus", "walk", "taxi"], { latitude: -33.4489, longitude: -70.6693 }),
  destination("reykjavik", "Reykjavik", "Iceland", "IS", "Europe", "ISK", ["Reykjavík", "레이캬비크"], ["bus", "walk", "car"], { latitude: 64.1466, longitude: -21.9426 }),
  destination("auckland", "Auckland", "New Zealand", "NZ", "Oceania", "NZD", ["오클랜드"], ["train", "ferry", "bus", "walk"], { latitude: -36.8509, longitude: 174.7645 }),
  destination("stockholm", "Stockholm", "Sweden", "SE", "Europe", "SEK", ["스톡홀름", "Estocolmo"], ["metro", "tram", "walk"], { latitude: 59.3293, longitude: 18.0686 }),
  destination("sao-paulo", "São Paulo", "Brazil", "BR", "South America", "BRL", ["Sao Paulo", "상파울루", "상파울로", "San Pablo"], ["metro", "bus", "walk", "taxi"], { latitude: -23.5558, longitude: -46.6396 }),
  destination("bogota", "Bogotá", "Colombia", "CO", "South America", "COP", ["Bogota", "보고타"], ["TransMilenio", "bus", "walk", "taxi"], { latitude: 4.711, longitude: -74.0721 }),
  destination("guatemala-city", "Guatemala City", "Guatemala", "GT", "Central America", "GTQ", ["Guatemala", "Guatemala City", "과테말라", "과테말라시티"], ["bus", "walk", "taxi"], { latitude: 14.6349, longitude: -90.5069 })
]);

export const WORLD_DESTINATIONS = Object.freeze([
  ...MAJOR_DESTINATIONS,
  ...Object.values(CONTINENT_CODES).flat().filter((code) => !MAJOR_DESTINATIONS.some((item) => item.countryCode === code && item.placeType === "country")).map(countryDestination)
]);

export const WORLD_AMBIGUOUS_DESTINATIONS = Object.freeze({
  santiago: Object.freeze([
    destination("santiago-cl", "Santiago", "Chile", "CL", "South America", "CLP", ["Santiago Chile", "산티아고 칠레"], ["metro", "bus", "walk"], { state: "Santiago Metropolitan Region", latitude: -33.4489, longitude: -70.6693, importance: 0.88 }),
    destination("santiago-es", "Santiago de Compostela", "Spain", "ES", "Europe", "EUR", ["Santiago Spain", "Santiago de Compostela", "산티아고 데 콤포스텔라"], ["walk", "bus", "train"], { state: "Galicia", latitude: 42.8782, longitude: -8.5448, importance: 0.72 }),
    destination("santiago-do", "Santiago de los Caballeros", "Dominican Republic", "DO", "Caribbean", "DOP", ["Santiago Dominican Republic"], ["bus", "taxi"], { state: "Santiago", latitude: 19.4517, longitude: -70.697, importance: 0.62 }),
    destination("santiago-mx", "Santiago", "Mexico", "MX", "North America", "MXN", ["Santiago Mexico"], ["bus", "taxi"], { state: "Nuevo León", latitude: 25.425, longitude: -100.152, importance: 0.35 }),
    destination("santiago-pa", "Santiago", "Panama", "PA", "Central America", "PAB", ["Santiago Panama"], ["bus", "taxi"], { state: "Veraguas", latitude: 8.1, longitude: -80.9833, importance: 0.42 })
  ]),
  paris: Object.freeze([
    destination("paris-fr", "Paris", "France", "FR", "Europe", "EUR", ["Paris France", "파리 프랑스"], ["metro", "walk", "bus"], { state: "Île-de-France", latitude: 48.8566, longitude: 2.3522, importance: 0.95 }),
    destination("paris-tx", "Paris", "United States", "US", "North America", "USD", ["Paris Texas"], ["car", "taxi"], { state: "Texas", latitude: 33.6609, longitude: -95.5555, importance: 0.38 }),
    destination("paris-on", "Paris", "Canada", "CA", "North America", "CAD", ["Paris Ontario"], ["car", "bus"], { state: "Ontario", latitude: 43.194, longitude: -80.3845, importance: 0.36 })
  ]),
  london: Object.freeze([
    destination("london-gb", "London", "United Kingdom", "GB", "Europe", "GBP", ["London England", "런던 영국"], ["tube", "walk", "bus"], { state: "England", latitude: 51.5074, longitude: -0.1278, importance: 0.94 }),
    destination("london-on", "London", "Canada", "CA", "North America", "CAD", ["London Ontario"], ["bus", "car"], { state: "Ontario", latitude: 42.9849, longitude: -81.2453, importance: 0.55 })
  ])
});

const AMBIGUOUS_ALIASES = Object.freeze({
  "산티아고": "santiago",
  "santiago": "santiago",
  "paris": "paris",
  "파리": "paris",
  "parís": "paris",
  "london": "london",
  "런던": "london",
  "londres": "london"
});
const EXTRA_DESTINATION_ALIASES = Object.freeze({
  seoul: ["서울", "서울시", "ソウル", "Seúl"],
  busan: ["부산", "부산시", "Busán"],
  jeju: ["제주", "제주도", "Jeju Island", "Isla de Jeju"],
  tokyo: ["도쿄", "東京", "Tokio"],
  osaka: ["오사카", "大阪"],
  kyoto: ["교토", "京都", "Kioto"],
  "ho-chi-minh-city": ["호치민", "호찌민", "Ho Chi Minh", "Saigon", "HCMC", "Ciudad Ho Chi Minh"],
  sapa: ["Sa Pa", "사파", "사파 베트남", "Sapa Vietnam"],
  hanoi: ["하노이", "Hà Nội", "Hanói"],
  singapore: ["싱가포르", "Singapur"],
  bangkok: ["방콕", "Bangkok Thailand"],
  taipei: ["타이베이", "타이페이", "台北", "Taipéi"],
  "hong-kong": ["홍콩", "香港", "Hong Kong"],
  lima: ["리마", "Lima Perú", "Lima Peru"],
  cusco: ["쿠스코", "Cuzco"],
  "machu-picchu": ["마추픽추", "Machu Picchu Perú", "Machu Picchu Peru"],
  "new-york": ["뉴욕", "New York", "NYC", "Nueva York"],
  honolulu: ["Hawaii", "Oahu", "하와이", "호놀룰루"],
  "los-angeles": ["로스앤젤레스", "엘에이", "LA", "L.A.", "Los Ángeles"],
  london: ["런던", "Londres"],
  paris: ["파리", "París"],
  rome: ["로마", "Roma"],
  barcelona: ["바르셀로나"],
  sydney: ["시드니", "Sídney"],
  melbourne: ["멜버른"],
  "cape-town": ["케이프타운", "Ciudad del Cabo"],
  dubai: ["두바이", "Dubái"],
  "mexico-city": ["멕시코시티", "멕시코 시티", "Ciudad de México", "CDMX"],
  santiago: ["산티아고", "Santiago de Chile", "Santiago Chile"],
  reykjavik: ["레이캬비크", "Reykjavík"],
  auckland: ["오클랜드"],
  stockholm: ["스톡홀름", "Estocolmo"],
  "sao-paulo": ["상파울루", "상파울로", "São Paulo", "Sao Paulo", "San Pablo"],
  bogota: ["보고타", "Bogotá", "Bogota"],
  "guatemala-city": ["과테말라", "과테말라시티", "Ciudad de Guatemala", "Guatemala City"],
  "paris-fr": ["Paris France", "París Francia", "파리 프랑스"],
  "santiago-cl": ["Santiago Chile", "Santiago de Chile", "산티아고 칠레"],
  "santiago-es": ["Santiago Spain", "Santiago de Compostela", "산티아고 데 콤포스텔라"],
  "london-gb": ["London England", "London United Kingdom", "런던 영국"],
  "london-on": ["London Ontario"]
});

const EXTRA_COUNTRY_ALIASES = Object.freeze({
  AR: ["아르헨티나", "Argentina"], AU: ["호주", "Australia"], BR: ["브라질", "Brasil", "Brazil"], CA: ["캐나다", "Canadá"],
  CL: ["칠레", "Chile"], CO: ["콜롬비아", "Colombia"], DE: ["독일", "Alemania"], ES: ["스페인", "España"],
  FR: ["프랑스", "Francia"], GB: ["영국", "Reino Unido", "UK", "Britain"], GT: ["과테말라", "Guatemala"],
  ID: ["인도네시아", "Indonesia"], IN: ["인도", "India"], IT: ["이탈리아", "Italia"], JP: ["일본", "日本", "Japón", "Japan"],
  KH: ["캄보디아", "Camboya"], KR: ["한국", "대한민국", "Corea del Sur", "South Korea", "Korea"], MG: ["마다가스카르", "Madagascar"],
  MX: ["멕시코", "México", "Mexico"], MY: ["말레이시아", "Malasia"], NZ: ["뉴질랜드", "Nueva Zelanda"], PE: ["페루", "Perú"],
  PH: ["필리핀", "Filipinas", "Philippines"], PT: ["포르투갈", "Portugal"], SE: ["스웨덴", "Suecia"], SG: ["싱가포르", "Singapur"],
  TH: ["태국", "Tailandia"], TW: ["대만", "Taiwán"], US: ["미국", "미합중국", "Estados Unidos", "USA", "America"],
  VN: ["베트남", "Vietnam"], ZA: ["남아프리카", "남아공", "Sudáfrica", "South Africa"], SV: ["엘살바도르", "살바도르", "El Salvador"],
  NI: ["니카라과", "Nicaragua"], PA: ["파나마", "Panamá", "Panama"], PG: ["파푸아뉴기니", "Papúa Nueva Guinea", "Papua New Guinea"],
  CG: ["콩고", "República del Congo"], CD: ["콩고민주공화국", "Democratic Republic of the Congo"]
});

const EXTRA_AMBIGUOUS_ALIASES = Object.freeze({
  "산티아고": "santiago",
  "santiago": "santiago",
  "paris": "paris",
  "파리": "paris",
  "parís": "paris",
  "london": "london",
  "런던": "london",
  "londres": "london"
});

const isUsableStoredAlias = (value) => !/[ÃÂêëìíîïð]/.test(String(value || ""));

const allCandidateAliases = (item) => Object.freeze([...new Set([
  ...(item?.aliases || []).filter(isUsableStoredAlias).filter((alias) => item?.placeType === "country" || clean(alias) !== clean(item?.country)),
  ...(EXTRA_DESTINATION_ALIASES[item?.id] || []),
  ...(item?.placeType === "country" ? (EXTRA_COUNTRY_ALIASES[String(item?.countryCode || "").toUpperCase()] || []) : [])
].filter(Boolean).map(clean))]);

export function detectMissionLanguage(value) {
  const source = String(value || "");
  if (/[가-힣]/u.test(source)) return Object.freeze({ value: "ko", confidence: 0.99 });
  if (/[¿¡ñáéíóúü]/iu.test(source) || /\b(?:viaje|viajar|fin de semana|novia|novio|pareja|luna de miel|negocios|dias|días)\b/i.test(source)) {
    return Object.freeze({ value: "es", confidence: 0.96 });
  }
  return Object.freeze({ value: "en", confidence: /[a-z]/i.test(source) ? 0.91 : 0.55 });
}

const boundaryIncludes = (source, alias) => {
  const normalized = ` ${clean(source)} `;
  return normalized.includes(` ${alias} `);
};

const phraseAmbiguityKey = (value) => {
  const compactValue = compact(value);
  const ambiguousAliases = { ...AMBIGUOUS_ALIASES, ...EXTRA_AMBIGUOUS_ALIASES };
  const exact = Object.entries(ambiguousAliases).find(([alias]) => compact(alias) === compactValue);
  if (exact) return exact[1];
  const normalized = clean(value);
  return Object.entries(ambiguousAliases).find(([alias]) => {
    const cleanedAlias = clean(alias);
    return normalized === cleanedAlias
      || normalized.startsWith(`${cleanedAlias} `)
      || normalized.includes(` ${cleanedAlias} `)
      || normalized.endsWith(` ${cleanedAlias}`);
  })?.[1] || "";
};

const qualifiedAmbiguousDestination = (value) => {
  const key = phraseAmbiguityKey(value);
  const matches = WORLD_AMBIGUOUS_DESTINATIONS[key] || [];
  if (!matches.length) return null;
  return matches.find((item) => allCandidateAliases(item).some((alias) => alias !== key && boundaryIncludes(value, alias))) || null;
};

const scoreDestination = (source, item) => {
  const normalizedSource = ` ${clean(source)} `;
  return Math.max(0, ...allCandidateAliases(item).map((alias) => {
    if (!alias) return 0;
    if (normalizedSource === ` ${alias} `) return 10000 + alias.length + Math.round((item.importance || 0) * 100);
    const index = normalizedSource.lastIndexOf(` ${alias} `);
    return index >= 0 ? ((item.placeType === "country" ? 1000 : 6000) + index + (alias.length * 10) + Math.round((item.importance || 0) * 100)) : 0;
  }));
};

export function ambiguousWorldDestinationMatches(value) {
  const key = phraseAmbiguityKey(value) || compact(value);
  const matches = WORLD_AMBIGUOUS_DESTINATIONS[key] || [];
  return qualifiedAmbiguousDestination(value) ? [] : matches;
}

export function resolveWorldDestination(value) {
  const qualifiedAmbiguous = qualifiedAmbiguousDestination(value);
  if (qualifiedAmbiguous) return qualifiedAmbiguous;
  const ambiguous = ambiguousWorldDestinationMatches(value);
  if (ambiguous.length > 1) return null;
  const matches = WORLD_DESTINATIONS
    .map((item) => ({ item, score: scoreDestination(value, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  if (matches[0]?.item) return matches[0].item;
  const compactSource = compact(value);
  const country = WORLD_DESTINATIONS.find((item) => item.placeType === "country" && allCandidateAliases(item).some((alias) => compact(alias) === compactSource));
  return country || null;
}

export function makeFallbackWorldDestination(value, fallback = {}) {
  const label = String(value || fallback.city || fallback.country || "Destination").normalize("NFKC").trim() || "Destination";
  const country = String(fallback.country || fallback.countryName || label).trim();
  const code = String(fallback.countryCode || fallback.code || "").toUpperCase();
  return Object.freeze({
    id: clean(`${label}-${country}`).replaceAll(" ", "-") || "destination-to-verify",
    city: label,
    country,
    countryCode: code,
    continent: fallback.continent || (code ? CODE_TO_CONTINENT[code] || "" : ""),
    currency: fallback.currency || (code ? CURRENCY_BY_CODE[code] || "" : ""),
    state: fallback.state || "",
    district: fallback.district || "",
    neighborhood: fallback.neighborhood || "",
    transport: Object.freeze(["public transit", "walk", "taxi"]),
    specified: true,
    confidence: 0.62,
    fallbackLevel: "AI_REASONING"
  });
}

export function normalizeResolvedDestination(item, fallback = {}) {
  const source = item || fallback;
  const city = String(source.city || source.name || fallback.city || "").trim();
  const country = String(source.country || fallback.country || "").trim();
  if (!city && !country && fallback.allowSynthetic !== false) return makeFallbackWorldDestination(fallback.city || fallback.name || "Destination", fallback);
  return Object.freeze({
    id: source.id || clean(city || country).replaceAll(" ", "-") || "unspecified",
    city: city || country,
    country: country || city,
    countryCode: String(source.countryCode || source.code || fallback.countryCode || fallback.code || "").toUpperCase(),
    continent: source.continent || fallback.continent || "",
    currency: source.currency || fallback.currency || "",
    state: source.state || fallback.state || "",
    district: source.district || fallback.district || "",
    neighborhood: source.neighborhood || fallback.neighborhood || "",
    latitude: Number.isFinite(Number(source.latitude)) ? Number(source.latitude) : undefined,
    longitude: Number.isFinite(Number(source.longitude)) ? Number(source.longitude) : undefined,
    transport: Object.freeze([...(source.transport || fallback.transport || ["public transit", "walk", "taxi"])])
  });
}

export function destinationMatchesRecommendation(item, destinationValue) {
  if (!destinationValue?.city && !destinationValue?.country) return false;
  const itemCity = clean(item?.city || item?.destination?.city);
  const itemCountry = clean(item?.country || item?.destination?.country);
  const city = clean(destinationValue.city);
  const country = clean(destinationValue.country);
  const code = String(item?.countryCode || item?.destination?.countryCode || "").toUpperCase();
  if (code && destinationValue.countryCode && code !== destinationValue.countryCode) return false;
  if (itemCity && city && itemCity !== city) return false;
  if (itemCountry && country && itemCountry !== country) return false;
  return Boolean(itemCity || code || itemCountry);
}

export function validateWorldMission(context, recommendations = [], sections = []) {
  const destinationValue = context?.destination;
  const explicit = Boolean(destinationValue?.specified);
  const invalid = explicit ? recommendations.filter((item) => !destinationMatchesRecommendation(item, destinationValue)) : [];
  const blankSections = sections.filter((section) => !section || (Array.isArray(section.items) && section.items.length === 0 && !section.value && !section.status));
  const placeholderSections = sections.filter((section) => /placeholder|undefined|null/i.test(JSON.stringify(section || {})));
  const checks = Object.freeze({
    languageDetected: Boolean(context?.missionLanguage?.value || context?.language),
    destinationResolved: !explicit || Boolean(destinationValue?.city && (destinationValue?.country || destinationValue?.countryCode)),
    explicitDestinationPreserved: !explicit || context?.origin?.id !== destinationValue?.id,
    recommendationsInDestination: invalid.length === 0,
    noBlankSections: blankSections.length === 0,
    noPlaceholderContent: placeholderSections.length === 0
  });
  return Object.freeze({ passed: Object.values(checks).every(Boolean), checks, invalid: Object.freeze(invalid), blankSections: Object.freeze(blankSections) });
}
