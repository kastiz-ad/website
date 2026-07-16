import { getProfileForMission, getSampleProfile, getSuggestedPrefill, saveApprovedPreference, useSampleProfile } from "../profile/profile-memory-engine.js";
import { trackEvent } from "../analytics.js";

const CATEGORY_FIELDS = Object.freeze({
  tutoring: [
    ["subject", "Subject or language", "과목 또는 언어", "English", "text"],
    ["level", "Learner level", "학습자 수준", "Beginner / Intermediate / Advanced", "text"],
    ["format", "Online or offline", "온라인 또는 오프라인", "Online / Offline", "text"],
    ["area", "City or area", "도시 또는 지역", "Optional for online lessons", "text"],
    ["schedule", "Preferred schedule", "선호 일정", "Tue and Thu evenings", "text"],
    ["budget", "Monthly or per-session budget", "월 또는 회당 예산", "₩40,000 per session", "text"]
  ],
  childcare: [
    ["area", "Area", "지역", "Neighborhood or city", "text"],
    ["date", "Date", "날짜", "", "date"],
    ["startTime", "Start time", "시작 시간", "", "time"],
    ["endTime", "End time", "종료 시간", "", "time"],
    ["ageRange", "Child age range", "아이 연령", "3 and 6 years", "text"],
    ["children", "Number of children", "아이 수", "1", "number"],
    ["languagePreference", "Language preference", "언어 선호", "Korean / English / No preference", "text"],
    ["verificationPreference", "Certification or background-check preference", "자격 또는 신원 조회 선호", "Certification / background check", "text"],
    ["budget", "Budget", "예산", "₩25,000 per hour", "text"]
  ],
  shopping: [
    ["product", "Product type", "제품 유형", "Laptop", "text"],
    ["budget", "Budget", "예산", "₩2,000,000", "text"],
    ["useCase", "Main use", "주요 용도", "Design, coding, office work", "text"],
    ["priority", "Priority", "우선순위", "Performance, battery, value", "text"],
    ["country", "Purchase or delivery country", "구매 또는 배송 국가", "South Korea", "text"],
    ["brands", "Preferred brands", "선호 브랜드", "Optional", "text"]
  ],
  moving: [
    ["origin", "Current country or city", "현재 국가 또는 도시", "Origin", "text"],
    ["destination", "Destination", "목적지", "South Korea", "text"],
    ["targetDate", "Desired move date", "희망 이주일", "", "date"],
    ["household", "Household size", "가구 구성", "2 adults, 1 child", "text"],
    ["housingBudget", "Housing budget", "주거 예산", "Monthly or deposit range", "text"],
    ["services", "Required services", "필요 서비스", "Visa, housing, shipping", "text"]
  ],
  business: [
    ["country", "Country", "국가", "South Korea", "text"],
    ["businessType", "Business type", "사업 유형", "Software, retail, consulting", "text"],
    ["launchDate", "Desired launch date", "희망 시작일", "", "date"],
    ["budget", "Available budget", "가용 예산", "Setup budget", "text"],
    ["support", "Registration and support needs", "등록 및 지원 필요사항", "Registration, tax, suppliers", "text"]
  ],
  language_exchange: [
    ["language", "Target language", "목표 언어", "English", "text"],
    ["level", "Current level", "현재 수준", "Beginner / Intermediate / Advanced", "text"],
    ["format", "Online or nearby", "온라인 또는 근거리", "Online / Nearby", "text"],
    ["schedule", "Preferred schedule", "선호 일정", "Weekend afternoons", "text"]
  ],
  general_mission: [
    ["outcome", "What outcome would make this successful?", "어떤 결과가 나오면 성공인가요?", "Desired outcome", "text"],
    ["constraints", "What timing, budget or limits should ONE respect?", "ONE이 지켜야 할 일정, 예산 또는 제한은 무엇인가요?", "Optional", "text"]
  ]
});

const TRAVEL_STEPS = [
  { title: ["Where are you going?", "어디로 가시나요?"], fields: [["destination", "Destination", "목적지", "Japan", "text"]] },
  { title: ["When?", "언제 여행하시나요?"], fields: [["startDate", "Start date", "출국 날짜", "", "date"], ["endDate", "End date", "귀국 날짜", "", "date"]] },
  { title: ["Travelers", "여행 인원"], fields: [["adults", "Adults", "성인", "1", "number"], ["children", "Children", "어린이", "0", "number"]] },
  { title: ["We'll use your nearby airport", "현재 위치와 가까운 공항을 사용할게요"], fields: [["departure", "Departure airport (change if needed)", "출발 공항 (필요하면 변경)", "Current location", "text"]] },
  { title: ["Budget and priorities", "예산과 우선순위"], fields: [["budget", "Total budget", "총예산", "₩3,000,000", "text"], ["priority", "Priority", "우선순위", "Balanced", "select"], ["preferences", "Optional preferences", "선호 사항", "Airline, hotel or itinerary preferences", "text"]] }
];

const esc = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const iso = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const inferDepartureFromDevice = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const region = (navigator.language || "").split("-")[1]?.toUpperCase() || "";
  const byTimezone = {
    "Asia/Seoul": "Incheon International Airport (ICN)",
    "Asia/Tokyo": "Tokyo Haneda Airport (HND)",
    "Europe/London": "London Heathrow Airport (LHR)",
    "Europe/Madrid": "Adolfo Suárez Madrid–Barajas Airport (MAD)",
    "Europe/Paris": "Paris Charles de Gaulle Airport (CDG)",
    "America/New_York": "John F. Kennedy International Airport (JFK)",
    "America/Los_Angeles": "Los Angeles International Airport (LAX)"
  };
  const byRegion = { KR: "Incheon International Airport (ICN)", JP: "Tokyo Haneda Airport (HND)", GB: "London Heathrow Airport (LHR)", ES: "Adolfo Suárez Madrid–Barajas Airport (MAD)", FR: "Paris Charles de Gaulle Airport (CDG)" };
  return byTimezone[timezone] || byRegion[region] || (region ? `Current location (${region})` : "Current location");
};

const TRAVEL_DESTINATION_CHOICES = [
  { country: "Japan", aliases: ["japan", "일본"], cities: ["Tokyo", "Osaka", "Kyoto", "Sapporo", "Fukuoka", "Okinawa"] },
  { country: "Spain", aliases: ["spain", "스페인"], cities: ["Madrid", "Barcelona", "Seville", "Valencia", "Málaga", "Bilbao"] },
  { country: "United States", aliases: ["united states", "usa", "u.s.", "america", "미국"], cities: ["New York", "Los Angeles", "Washington, D.C.", "San Francisco", "Chicago", "Miami"] },
  { country: "Canada", aliases: ["canada", "캐나다"], cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Quebec City"] },
  { country: "France", aliases: ["france", "프랑스"], cities: ["Paris", "Nice", "Lyon", "Marseille", "Bordeaux", "Strasbourg"] },
  { country: "Italy", aliases: ["italy", "이탈리아"], cities: ["Rome", "Milan", "Venice", "Florence", "Naples", "Bologna"] },
  { country: "United Kingdom", aliases: ["united kingdom", "uk", "britain", "영국"], cities: ["London", "Edinburgh", "Manchester", "Liverpool", "Oxford", "Bath"] },
  { country: "Germany", aliases: ["germany", "독일"], cities: ["Berlin", "Munich", "Frankfurt", "Hamburg", "Cologne", "Dresden"] },
  { country: "Australia", aliases: ["australia", "호주"], cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"] },
  { country: "Thailand", aliases: ["thailand", "태국"], cities: ["Bangkok", "Chiang Mai", "Phuket", "Krabi", "Pattaya", "Koh Samui"] },
  { country: "Vietnam", aliases: ["vietnam", "베트남"], cities: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hoi An", "Nha Trang", "Phu Quoc"] },
  { country: "China", aliases: ["china", "중국"], cities: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu", "Xi'an"] },
  { country: "South Korea", aliases: ["south korea", "korea", "대한민국", "한국"], cities: ["Seoul", "Busan", "Jeju", "Gyeongju", "Incheon", "Gangneung"] },
  { country: "Colombia", aliases: ["colombia", "콜롬비아"], cities: ["Bogotá", "Medellín", "Cartagena", "Cali", "Santa Marta", "Pereira"] },
  { country: "Mexico", aliases: ["mexico", "멕시코"], cities: ["Mexico City", "Cancún", "Los Cabos", "Oaxaca", "Guadalajara", "Puerto Vallarta"] },
  { country: "Belize", aliases: ["belize", "벨리즈"], cities: ["Belize City", "Belmopan", "San Ignacio", "San Pedro"] },
  { country: "Costa Rica", aliases: ["costa rica", "코스타리카"], cities: ["San Jose", "Liberia", "Limon", "La Fortuna"] },
  { country: "El Salvador", aliases: ["el salvador", "salvador", "엘살바도르", "살바도르"], cities: ["San Salvador", "Santa Ana", "La Libertad", "Suchitoto"] },
  { country: "Guatemala", aliases: ["guatemala", "과테말라"], cities: ["Guatemala City", "Antigua Guatemala", "Flores", "Quetzaltenango"] },
  { country: "Honduras", aliases: ["honduras", "온두라스"], cities: ["Tegucigalpa", "San Pedro Sula", "La Ceiba", "Roatan"] },
  { country: "Nicaragua", aliases: ["nicaragua", "니카라과"], cities: ["Managua", "Granada", "Leon", "San Juan del Sur"] },
  { country: "Panama", aliases: ["panama", "파나마"], cities: ["Panama City", "Bocas del Toro", "Boquete", "Colon"] },
  { country: "Singapore", aliases: ["singapore", "싱가포르"], cities: ["Singapore"] },
  { country: "Argentina", aliases: ["argentina", "아르헨티나"], cities: ["Buenos Aires", "Mendoza", "Cordoba", "Bariloche"] },
  { country: "Brazil", aliases: ["brazil", "브라질"], cities: ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador"] },
  { country: "Peru", aliases: ["peru", "페루"], cities: ["Lima", "Cusco", "Arequipa", "Trujillo"] },
  { country: "Chile", aliases: ["chile", "칠레"], cities: ["Santiago", "Valparaiso", "Puerto Montt", "San Pedro de Atacama"] },
  { country: "Portugal", aliases: ["portugal", "포르투갈"], cities: ["Lisbon", "Porto", "Faro", "Coimbra"] },
  { country: "Netherlands", aliases: ["netherlands", "holland", "네덜란드"], cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht"] },
  { country: "Greece", aliases: ["greece", "그리스"], cities: ["Athens", "Thessaloniki", "Santorini", "Mykonos"] },
  { country: "United Arab Emirates", aliases: ["uae", "united arab emirates", "아랍에미리트"], cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { country: "India", aliases: ["india", "인도"], cities: ["Delhi", "Mumbai", "Bengaluru", "Jaipur"] },
  { country: "Indonesia", aliases: ["indonesia", "인도네시아"], cities: ["Bali", "Jakarta", "Yogyakarta", "Surabaya"] },
  { country: "Malaysia", aliases: ["malaysia", "말레이시아"], cities: ["Kuala Lumpur", "Penang", "Kota Kinabalu", "Malacca"] },
  { country: "New Zealand", aliases: ["new zealand", "뉴질랜드"], cities: ["Auckland", "Queenstown", "Wellington", "Christchurch"] },
  { country: "South Africa", aliases: ["south africa", "남아프리카공화국"], cities: ["Cape Town", "Johannesburg", "Durban", "Pretoria"] },
  { country: "Egypt", aliases: ["egypt", "이집트"], cities: ["Cairo", "Luxor", "Alexandria", "Sharm El Sheikh"] },
  { country: "Morocco", aliases: ["morocco", "모로코"], cities: ["Marrakesh", "Casablanca", "Fes", "Rabat"] }
];
const TRAVEL_COUNTRY_CODES = { Japan: "JP", Spain: "ES", "United States": "US", Canada: "CA", France: "FR", Italy: "IT", "United Kingdom": "GB", Germany: "DE", Australia: "AU", Thailand: "TH", Vietnam: "VN", China: "CN", "South Korea": "KR", Colombia: "CO", Mexico: "MX", Belize: "BZ", "Costa Rica": "CR", "El Salvador": "SV", Guatemala: "GT", Honduras: "HN", Nicaragua: "NI", Panama: "PA", Singapore: "SG", Argentina: "AR", Brazil: "BR", Peru: "PE", Chile: "CL", Portugal: "PT", Netherlands: "NL", Greece: "GR", "United Arab Emirates": "AE", India: "IN", Indonesia: "ID", Malaysia: "MY", "New Zealand": "NZ", "South Africa": "ZA", Egypt: "EG", Morocco: "MA" };
const CONTINENT_BY_COUNTRY = {
  "United States": "North America", Canada: "North America", Mexico: "North America",
  Belize: "Central America", "Costa Rica": "Central America", "El Salvador": "Central America", Guatemala: "Central America", Honduras: "Central America", Nicaragua: "Central America", Panama: "Central America",
  Colombia: "South America", Argentina: "South America", Brazil: "South America", Peru: "South America", Chile: "South America",
  Spain: "Europe", France: "Europe", Italy: "Europe", "United Kingdom": "Europe", Germany: "Europe", Portugal: "Europe", Netherlands: "Europe", Greece: "Europe",
  Japan: "Asia", Thailand: "Asia", Vietnam: "Asia", China: "Asia", "South Korea": "Asia", Singapore: "Asia", India: "Asia", Indonesia: "Asia", Malaysia: "Asia",
  Australia: "Oceania", "New Zealand": "Oceania",
  "United Arab Emirates": "Middle East", Egypt: "Middle East",
  "South Africa": "Africa", Morocco: "Africa"
};
const CONTINENT_NAMES_KO = { "North America": "북아메리카", "Central America": "중미", Caribbean: "카리브해", "South America": "남아메리카", Europe: "유럽", Asia: "아시아", Oceania: "오세아니아", "Middle East": "중동", Africa: "아프리카" };
const COUNTRY_NAMES_KO = { "United States": "미국", Canada: "캐나다", Mexico: "멕시코", Belize: "벨리즈", "Costa Rica": "코스타리카", "El Salvador": "엘살바도르", Guatemala: "과테말라", Honduras: "온두라스", Nicaragua: "니카라과", Panama: "파나마", Colombia: "콜롬비아", Argentina: "아르헨티나", Brazil: "브라질", Peru: "페루", Chile: "칠레", Spain: "스페인", France: "프랑스", Italy: "이탈리아", "United Kingdom": "영국", Germany: "독일", Portugal: "포르투갈", Netherlands: "네덜란드", Greece: "그리스", Japan: "일본", Thailand: "태국", Vietnam: "베트남", China: "중국", "South Korea": "대한민국", Singapore: "싱가포르", India: "인도", Indonesia: "인도네시아", Malaysia: "말레이시아", Australia: "호주", "New Zealand": "뉴질랜드", "United Arab Emirates": "아랍에미리트", Egypt: "이집트", "South Africa": "남아프리카공화국", Morocco: "모로코" };
const CITY_NAMES_KO = {
  Madrid: "마드리드", Barcelona: "바르셀로나", Seville: "세비야", Valencia: "발렌시아", "Málaga": "말라가", Bilbao: "빌바오",
  "New York": "뉴욕", "Los Angeles": "로스앤젤레스", "Washington, D.C.": "워싱턴 D.C.", "San Francisco": "샌프란시스코", Chicago: "시카고", Miami: "마이애미",
  Tokyo: "도쿄", Osaka: "오사카", Kyoto: "교토", Sapporo: "삿포로", Fukuoka: "후쿠오카", Okinawa: "오키나와",
  Paris: "파리", London: "런던", Rome: "로마", Milan: "밀라노", Venice: "베네치아", Florence: "피렌체",
  Bangkok: "방콕", Phuket: "푸껫", Hanoi: "하노이", "Ho Chi Minh City": "호찌민", "Da Nang": "다낭", Singapore: "싱가포르",
  Sydney: "시드니", Melbourne: "멜버른", Beijing: "베이징", Shanghai: "상하이", Seoul: "서울", Busan: "부산", Jeju: "제주",
  "Buenos Aires": "부에노스아이레스", Lima: "리마", "Sao Paulo": "상파울루", "Rio de Janeiro": "리우데자네이루", Bogota: "보고타", "Bogotá": "보고타", "Belize City": "벨리즈시티", "San Jose": "산호세", "San Salvador": "산살바도르", "Guatemala City": "과테말라시티", Tegucigalpa: "테구시갈파", Managua: "마나과", "Panama City": "파나마시티",
  Berlin: "베를린", Munich: "뮌헨", Lisbon: "리스본", Amsterdam: "암스테르담", Athens: "아테네", Dubai: "두바이", Delhi: "델리", Bali: "발리",
  Auckland: "오클랜드", "Cape Town": "케이프타운", Cairo: "카이로", Marrakesh: "마라케시"
};
Object.assign(CITY_NAMES_KO, {
  Toronto: "토론토", Vancouver: "밴쿠버", Montreal: "몬트리올", Calgary: "캘거리", Ottawa: "오타와", "Quebec City": "퀘벡시티",
  Nice: "니스", Lyon: "리옹", Marseille: "마르세유", Bordeaux: "보르도", Strasbourg: "스트라스부르",
  Naples: "나폴리", Bologna: "볼로냐", Edinburgh: "에든버러", Manchester: "맨체스터", Liverpool: "리버풀", Oxford: "옥스퍼드", Bath: "바스",
  Frankfurt: "프랑크푸르트", Hamburg: "함부르크", Cologne: "쾰른", Dresden: "드레스덴",
  Brisbane: "브리즈번", Perth: "퍼스", Adelaide: "애들레이드", "Gold Coast": "골드코스트",
  "Chiang Mai": "치앙마이", Krabi: "끄라비", Pattaya: "파타야", "Koh Samui": "코사무이",
  "Hoi An": "호이안", "Nha Trang": "나트랑", "Phu Quoc": "푸꾸옥", Guangzhou: "광저우", Shenzhen: "선전", Chengdu: "청두", "Xi'an": "시안",
  Gyeongju: "경주", Incheon: "인천", Gangneung: "강릉", "Medellín": "메데인", Cartagena: "카르타헤나", Cali: "칼리", "Santa Marta": "산타마르타", Pereira: "페레이라",
  "Mexico City": "멕시코시티", "Cancún": "칸쿤", "Los Cabos": "로스카보스", Oaxaca: "오악사카", Guadalajara: "과달라하라", "Puerto Vallarta": "푸에르토바야르타",
  Belmopan: "벨모판", "San Ignacio": "산이그나시오", "San Pedro": "산페드로", Liberia: "리베리아", Limon: "리몬", "La Fortuna": "라포르투나",
  "Santa Ana": "산타아나", "La Libertad": "라리베르타드", Suchitoto: "수치토토", "Antigua Guatemala": "안티과과테말라", Flores: "플로레스", Quetzaltenango: "케찰테낭고",
  "San Pedro Sula": "산페드로술라", "La Ceiba": "라세이바", Roatan: "로아탄", Granada: "그라나다", Leon: "레온", "San Juan del Sur": "산후안델수르",
  "Bocas del Toro": "보카스델토로", Boquete: "보케테", Colon: "콜론", Mendoza: "멘도사", Cordoba: "코르도바", Bariloche: "바릴로체",
  Brasilia: "브라질리아", Salvador: "사우바도르", Cusco: "쿠스코", Arequipa: "아레키파", Trujillo: "트루히요", Santiago: "산티아고", Valparaiso: "발파라이소",
  "Puerto Montt": "푸에르토몬트", "San Pedro de Atacama": "산페드로데아타카마", Porto: "포르투", Faro: "파루", Coimbra: "코임브라",
  Rotterdam: "로테르담", "The Hague": "헤이그", Utrecht: "위트레흐트", Thessaloniki: "테살로니키", Santorini: "산토리니", Mykonos: "미코노스",
  "Abu Dhabi": "아부다비", Sharjah: "샤르자", Mumbai: "뭄바이", Bengaluru: "벵갈루루", Jaipur: "자이푸르", Jakarta: "자카르타", Yogyakarta: "욕야카르타", Surabaya: "수라바야",
  "Kuala Lumpur": "쿠알라룸푸르", Penang: "페낭", "Kota Kinabalu": "코타키나발루", Malacca: "말라카", Queenstown: "퀸스타운", Wellington: "웰링턴", Christchurch: "크라이스트처치",
  Johannesburg: "요하네스버그", Durban: "더반", Pretoria: "프리토리아", Luxor: "룩소르", Alexandria: "알렉산드리아", "Sharm El Sheikh": "샤름엘셰이크",
  Casablanca: "카사블랑카", Fes: "페스", Rabat: "라바트"
});
const cityLabel = (city, language) => language === "ko" ? (CITY_NAMES_KO[city] || city) : city;
const worldwideCityLabelCache = new Map();
const koreanCityLabel = async (city, country) => {
  if (CITY_NAMES_KO[city]) return CITY_NAMES_KO[city];
  const key = `${city}|${country}`;
  if (worldwideCityLabelCache.has(key)) return worldwideCityLabelCache.get(key);
  const lookup = fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&namedetails=1&limit=1&accept-language=ko&q=${encodeURIComponent(`${city}, ${country}`)}`)
    .then((response) => response.ok ? response.json() : [])
    .then(([place]) => {
      const label = place?.namedetails?.["name:ko"] || String(place?.display_name || "").split(",")[0] || city;
      return /[가-힣]/.test(label) ? label : city;
    })
    .catch(() => city);
  worldwideCityLabelCache.set(key, lookup);
  return lookup;
};
const normalizeDestinationLookup = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const CITY_ALIASES = {
  nyc: "New York", la: "Los Angeles", "l.a.": "Los Angeles", "엘에이": "Los Angeles",
  washington: "Washington, D.C.", "washington dc": "Washington, D.C.", "washington d.c.": "Washington, D.C.", "워싱턴": "Washington, D.C.", "워싱턴 dc": "Washington, D.C.",
  "sao paulo": "Sao Paulo", "são paulo": "Sao Paulo", "상파울로": "Sao Paulo", "상파울루": "Sao Paulo", bogota: "Bogotá", "buenos aires": "Buenos Aires"
};
const findDestinationMatch = (value, language) => {
  const normalized = normalizeDestinationLookup(value);
  const aliasCity = CITY_ALIASES[normalized];
  for (const item of TRAVEL_DESTINATION_CHOICES) {
    const city = item.cities.find((candidate) => {
      return normalizeDestinationLookup(candidate) === normalized || normalizeDestinationLookup(cityLabel(candidate, language)) === normalized || candidate === aliasCity;
    });
    if (city) return { item, city };
  }
  const country = TRAVEL_DESTINATION_CHOICES.find((item) => item.aliases.some((alias) => normalizeDestinationLookup(alias) === normalized));
  return country ? { item: country, city: country.cities[0] } : null;
};
const countryForCity = (value, language) => {
  const match = findDestinationMatch(value, language);
  return match ? { country: match.item.country, code: TRAVEL_COUNTRY_CODES[match.item.country] || "", city: match.city } : null;
};

const resolveWorldwideDestination = async (value, language) => {
  const local = countryForCity(value, language);
  if (local) return local;
  const query = String(value || "").trim();
  if (query.length < 2) return null;
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&featuretype=city&q=${encodeURIComponent(query)}`, {
      headers: { "Accept-Language": language === "ko" ? "ko,en;q=0.8" : "en" }
    });
    if (!response.ok) return null;
    const [place] = await response.json();
    if (!place?.address) return null;
    const code = String(place.address.country_code || "").toUpperCase();
    const city = place.address.city || place.address.town || place.address.village || place.address.municipality || String(place.display_name || "").split(",")[0] || query;
    let country = place.address.country || "";
    let continent = "";
    let currency = "";
    if (code) {
      const countryResponse = await fetch(`https://restcountries.com/v3.1/alpha/${encodeURIComponent(code)}?fields=name,region,subregion,currencies`);
      if (countryResponse.ok) {
        const countryData = await countryResponse.json();
        country = countryData?.name?.common || country;
        continent = countryData?.region === "Americas"
          ? (countryData?.subregion === "South America" ? "South America" : countryData?.subregion === "Central America" ? "Central America" : countryData?.subregion === "Caribbean" ? "Caribbean" : "North America")
          : (countryData?.region === "Oceania" ? "Oceania" : countryData?.region || "");
        currency = Object.keys(countryData?.currencies || {})[0] || "";
      }
    }
    return { country, code, city, continent, currency };
  } catch {
    return null;
  }
};

let worldwideCountriesPromise;
const loadWorldwideCountries = () => {
  if (worldwideCountriesPromise) return worldwideCountriesPromise;
  worldwideCountriesPromise = fetch("https://restcountries.com/v3.1/all?fields=name,cca2,region,subregion,translations,currencies,capital")
    .then((response) => response.ok ? response.json() : [])
    .then((countries) => countries.map((country) => {
      const continent = country.region === "Americas"
        ? (country.subregion === "South America" ? "South America" : country.subregion === "Central America" ? "Central America" : country.subregion === "Caribbean" ? "Caribbean" : "North America")
        : (country.region === "Oceania" ? "Oceania" : country.subregion === "Western Asia" ? "Middle East" : country.region || "Other");
      return {
        country: country.name?.common || "",
        countryKo: country.translations?.kor?.common || country.name?.common || "",
        code: country.cca2 || "",
        continent,
        currency: Object.keys(country.currencies || {})[0] || "",
        cities: Array.isArray(country.capital) ? country.capital : []
      };
    }).filter((country) => country.country && country.continent).sort((a, b) => a.country.localeCompare(b.country)))
    .catch(() => []);
  return worldwideCountriesPromise;
};

const inferTravelContext = (mission = "") => {
  const text = String(mission).toLowerCase();
  const destinations = [
    ["New York", ["new york", "nyc", "뉴욕"]],
    ["Los Angeles", ["los angeles", "l.a.", "로스앤젤레스", "엘에이"]],
    ["Washington, D.C.", ["washington dc", "washington d.c.", "워싱턴"]],
    ["Buenos Aires", ["buenos aires", "부에노스아이레스"]],
    ["Sao Paulo", ["sao paulo", "são paulo", "상파울로", "상파울루"]],
    ["Japan", ["japan", "tokyo", "일본", "도쿄"]],
    ["Madrid", ["madrid", "마드리드"]],
    ["Colombia", ["colombia", "bogota", "bogotá", "콜롬비아", "보고타"]],
    ["South Korea", ["south korea", "korea", "seoul", "대한민국", "한국", "서울"]],
    ["Paris", ["paris", "파리"]],
    ["London", ["london", "런던"]],
    ["Canada", ["canada", "캐나다"]],
    ["Thailand", ["thailand", "bangkok", "태국", "방콕"]],
    ["Singapore", ["singapore", "싱가포르"]],
    ["Australia", ["australia", "sydney", "호주", "시드니"]],
    ["Italy", ["italy", "rome", "이탈리아", "로마"]],
    ["Vietnam", ["vietnam", "hanoi", "베트남", "하노이"]]
  ];
  const exactCity = destinations.find(([, aliases]) => aliases.some((alias) => text.includes(alias)))?.[0] || "";
  const countryMatch = TRAVEL_DESTINATION_CHOICES.find((item) =>
    item.aliases.some((alias) => text.includes(alias)) || item.cities.some((city) => text.includes(city.toLowerCase()) || text.includes(CITY_NAMES_KO[city] || "\u0000"))
  );
  if (countryMatch) {
    const city = countryMatch.cities.find((item) => text.includes(item.toLowerCase()) || text.includes(CITY_NAMES_KO[item] || "\u0000"));
    return { country: countryMatch.country, code: TRAVEL_COUNTRY_CODES[countryMatch.country] || "", value: city || exactCity || countryMatch.cities[0], cities: countryMatch.cities };
  }
  if (exactCity) return { country: exactCity, value: exactCity, cities: [exactCity] };
  const phrase = text.match(/(?:trip|travel|flight|vacation|holiday)\s+(?:to|in)\s+([a-z][a-z .'-]{1,40})/i)?.[1]
    ?.replace(/\b(?:for|from|with|on)\b.*$/i, "").trim();
  return phrase ? { country: phrase, value: phrase.replace(/\b\w/g, (letter) => letter.toUpperCase()), cities: [] } : { country: "", value: "", cities: [] };
};

const getDialog = () => {
  let dialog = document.getElementById("missionFollowUpDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "missionFollowUpDialog";
    dialog.className = "mission-followup-modal";
    dialog.setAttribute("aria-labelledby", "missionFollowUpTitle");
    document.body.append(dialog);
  }
  return dialog;
};

const renderField = ([name, en, ko, placeholder, type], language, required = true) => {
  const label = language === "ko" ? ko : en;
  if (type === "select") return `<label><span>${label}</span><select name="${name}" ${required ? "required" : ""}><option value="cheapest">${language === "ko" ? "최저가" : "Cheapest"}</option><option value="quality">${language === "ko" ? "최고 품질" : "Best quality"}</option><option value="fastest">${language === "ko" ? "최단 시간" : "Fastest"}</option><option value="balanced" selected>${language === "ko" ? "균형형" : "Balanced"}</option></select></label>`;
  const min = type === "number" ? ' min="0"' : "";
  const className = type === "date" ? ' class="mission-followup-date-field"' : "";
  return `<label${className}><span>${label}</span><input name="${name}" type="${type}" placeholder="${esc(placeholder)}"${min} ${required ? "required" : ""}></label>`;
};

export function openMissionFollowUp({ mission, type, language = "en", demoMode = false, restoreFocusTo, onComplete }) {
  const dialog = getDialog();
  const ko = language === "ko";
  const travel = type === "travel";
  const destinationContext = travel ? inferTravelContext(mission) : null;
  const steps = travel ? TRAVEL_STEPS : [{ title: ["Mission details", "미션 세부 정보"], fields: CATEGORY_FIELDS[type] || CATEGORY_FIELDS.general_mission }];
  const savedProfile = getProfileForMission(type);
  const savedPrefill = getSuggestedPrefill(type);
  const sampleProfile = demoMode ? getSampleProfile() : null;
  const sampleTravel = sampleProfile?.travel || {};
  const suggested = travel ? { ...savedPrefill, ...(sampleTravel.departureAirport ? { departure: sampleTravel.departureAirport, priority: sampleTravel.tripPace?.toLowerCase(), preferences: [sampleTravel.cabin, sampleTravel.seat, sampleTravel.hotelStyle].filter(Boolean).join(" · ") } : {}) } : savedPrefill;
  const suggestedEntries = Object.entries(suggested).filter(([, value]) => value);
  trackEvent("followup_opened", { page: "home", language, mission_category: type, demo_mode: demoMode });
  if (suggestedEntries.length) trackEvent("saved_profile_suggestion_shown", { page: "home", language, mission_category: type, demo_mode: demoMode });
  let current = 0;
  let resolvedDestination = null;
  let showResolvedDestination = () => {};
  let destinationLookupTimer = 0;
  let destinationLookupSequence = 0;

  dialog.innerHTML = `<form method="dialog" class="mission-followup-form" novalidate>
    <button class="schedule-modal-close" type="button" data-action="cancel" aria-label="${ko ? "닫기" : "Close"}">×</button>
    <p class="login-modal-kicker">KASTIZ ONE</p>
    <h2 id="missionFollowUpTitle">${ko ? "미션에 필요한 정보를 알려주세요" : "Help ONE prepare the mission"}</h2>
    <p class="mission-followup-mission">${esc(mission)}</p>
    ${suggestedEntries.length ? `<aside class="profile-prefill-summary" aria-label="${ko ? "저장된 설정" : "Saved preferences"}"><strong>${ko ? "다음 설정을 사용할게요" : "We'll use"}</strong><ul>${suggestedEntries.map(([key, value]) => `<li><span>${esc(key)}</span><b>${esc(value)}</b><em>${ko ? "사용" : "Use"}</em><button type="button" data-action="change-pref" data-pref-key="${esc(key)}">${ko ? "변경" : "Change"}</button></li>`).join("")}</ul></aside>` : ""}
    ${demoMode && !sampleProfile && !savedProfile.enabled ? `<button type="button" class="profile-sample-button" data-action="sample">${ko ? "샘플 프로필 사용" : "Use sample profile"}</button>` : ""}
    <div class="mission-followup-progress" aria-live="polite"></div>
    ${steps.map((step, index) => `<section class="mission-followup-step" data-step="${index}" ${index ? "hidden" : ""}><h3>${ko ? step.title[1] : step.title[0]}</h3>${step.fields.some((field) => field[0] === "departure") ? `<p class="mission-step-why">${ko ? "기기의 지역 설정을 기준으로 제안했습니다. 정확한 위치는 저장하지 않습니다." : "Suggested from your device region. ONE does not store your precise location."}</p>` : ""}<div class="mission-followup-fields">${step.fields.map((field, fieldIndex) => renderField(field, language, field[0] !== "preferences" && field[0] !== "brands" && field[0] !== "constraints")).join("")}</div></section>`).join("")}
    ${savedProfile.enabled ? `<label class="profile-remember-row"><input type="checkbox" name="rememberPreferences"><span>${ko ? "다음 미션에도 이 설정을 사용하기" : "Save these preferences for future missions"}</span></label><p class="profile-local-note">${ko ? "선택한 비민감 설정만 이 기기에 저장됩니다. 여권·결제·건강 정보는 저장하지 않습니다." : "Only selected non-sensitive preferences are stored on this device. Passport, payment and health data are not saved."}</p>` : ""}
    <p class="mission-followup-error" role="alert" aria-live="assertive"></p>
    <div class="mission-followup-actions"><button type="button" class="mission-followup-back" data-action="back">${ko ? "이전" : "Back"}</button><button type="button" class="schedule-confirm" data-action="next"></button></div>
  </form>`;

  const form = dialog.querySelector("form");
  const error = form.querySelector(".mission-followup-error");
  const progress = form.querySelector(".mission-followup-progress");
  const back = form.querySelector('[data-action="back"]');
  const next = form.querySelector('[data-action="next"]');
  const sections = Array.from(form.querySelectorAll(".mission-followup-step"));

  if (travel) {
    const today = new Date();
    const end = new Date(today); end.setDate(end.getDate() + 6);
    const defaults = {
      destination: destinationContext?.value ? cityLabel(destinationContext.value, language) : (demoMode ? cityLabel("Tokyo", language) : ""),
      startDate: iso(today),
      endDate: iso(end),
      adults: "1",
      children: "0",
      departure: inferDepartureFromDevice(),
      priority: "balanced"
    };
    Object.assign(defaults, suggested);
    if (demoMode && !defaults.departure) defaults.departure = "Incheon International Airport (ICN)";
    Object.entries(defaults).forEach(([name, value]) => { const field = form.elements.namedItem(name); if (field && !field.value) field.value = value; });
    const destinationInput = form.elements.namedItem("destination");
    if (destinationInput) {
      destinationInput.readOnly = false;
      destinationInput.placeholder = ko
        ? "파리, LA, 부에노스아이레스 또는 원하는 도시"
        : "Paris, LA, Buenos Aires or any city";
      destinationInput.setAttribute("aria-label", ko ? "목적지" : "Destination");
      const hierarchy = document.createElement("div");
      hierarchy.className = "destination-hierarchy";
      hierarchy.innerHTML = `
        <label><span>${ko ? "대륙" : "Continent"}</span><select data-destination-level="continent"><option value="">${ko ? "대륙 선택" : "Select a continent"}</option></select></label>
        <label><span>${ko ? "국가" : "Country"}</span><select data-destination-level="country" disabled><option value="">${ko ? "국가 선택" : "Select a country"}</option></select></label>
        <label><span>${ko ? "도시" : "City"}</span><select data-destination-level="city" disabled><option value="">${ko ? "도시 선택" : "Select a city"}</option></select></label>`;
      destinationInput.closest("label")?.after(hierarchy);
      const continentSelect = hierarchy.querySelector('[data-destination-level="continent"]');
      const countrySelect = hierarchy.querySelector('[data-destination-level="country"]');
      const citySelect = hierarchy.querySelector('[data-destination-level="city"]');
      let globalCountries = [];
      const continents = [...new Set(Object.values(CONTINENT_BY_COUNTRY))];
      continentSelect.insertAdjacentHTML("beforeend", continents.map((continent) => `<option value="${esc(continent)}">${esc(ko ? CONTINENT_NAMES_KO[continent] || continent : continent)}</option>`).join(""));
      const fillCountries = (continent, selected = "") => {
        const builtIn = TRAVEL_DESTINATION_CHOICES.filter((item) => CONTINENT_BY_COUNTRY[item.country] === continent).map((item) => ({ ...item, countryKo: COUNTRY_NAMES_KO[item.country] || item.country }));
        const merged = [...builtIn, ...globalCountries.filter((item) => item.continent === continent)]
          .filter((item, index, all) => all.findIndex((candidate) => candidate.country === item.country) === index)
          .sort((a, b) => a.country.localeCompare(b.country));
        countrySelect.innerHTML = `<option value="">${ko ? "국가 선택" : "Select a country"}</option>${merged.map((item) => `<option value="${esc(item.country)}" ${item.country === selected ? "selected" : ""}>${esc(ko ? item.countryKo || item.country : item.country)}</option>`).join("")}`;
        countrySelect.disabled = !continent;
      };
      const fillCities = (country, selected = "") => {
        const item = TRAVEL_DESTINATION_CHOICES.find((candidate) => candidate.country === country) || globalCountries.find((candidate) => candidate.country === country);
        citySelect.innerHTML = `<option value="">${ko ? "도시 선택" : "Select a city"}</option>${(item?.cities || []).map((city) => `<option value="${esc(city)}" ${city === selected ? "selected" : ""}>${esc(cityLabel(city, language))}</option>`).join("")}`;
        citySelect.disabled = !item;
        if (ko && item) {
          Promise.all(item.cities.map(async (city) => [city, await koreanCityLabel(city, country)])).then((labels) => {
            if (countrySelect.value !== country) return;
            labels.forEach(([city, label]) => {
              const option = [...citySelect.options].find((candidate) => candidate.value === city);
              if (option) option.textContent = label;
            });
          });
        }
      };
      const syncHierarchy = (value) => {
        const match = findDestinationMatch(value, language);
        if (!match) return;
        const continent = CONTINENT_BY_COUNTRY[match.item.country] || "";
        continentSelect.value = continent;
        fillCountries(continent, match.item.country);
        fillCities(match.item.country, match.city);
        resolvedDestination = { country: match.item.country, code: TRAVEL_COUNTRY_CODES[match.item.country] || "", city: match.city };
      };
      showResolvedDestination = (resolved) => {
        if (!resolved) return;
        const continent = resolved.continent || CONTINENT_BY_COUNTRY[resolved.country] || "";
        if (continent && ![...continentSelect.options].some((option) => option.value === continent)) continentSelect.add(new Option(ko ? CONTINENT_NAMES_KO[continent] || continent : continent, continent));
        continentSelect.value = continent;
        fillCountries(continent);
        if (resolved.country && ![...countrySelect.options].some((option) => option.value === resolved.country)) countrySelect.add(new Option(resolved.country, resolved.country));
        countrySelect.disabled = false;
        countrySelect.value = resolved.country;
        fillCities(resolved.country);
        if (resolved.city && ![...citySelect.options].some((option) => option.value === resolved.city)) citySelect.add(new Option(cityLabel(resolved.city, language), resolved.city));
        citySelect.disabled = false;
        citySelect.value = resolved.city;
      };
      continentSelect.addEventListener("change", () => { resolvedDestination = null; fillCountries(continentSelect.value); fillCities(""); });
      countrySelect.addEventListener("change", () => { resolvedDestination = null; fillCities(countrySelect.value); });
      citySelect.addEventListener("change", () => {
        if (citySelect.value) {
          destinationInput.value = cityLabel(citySelect.value, language);
          const globalCountry = globalCountries.find((item) => item.country === countrySelect.value);
          resolvedDestination = countryForCity(citySelect.value, language) || { country: countrySelect.value, code: globalCountry?.code || TRAVEL_COUNTRY_CODES[countrySelect.value] || "", city: citySelect.value, continent: globalCountry?.continent || continentSelect.value, currency: globalCountry?.currency || "" };
        }
      });
      destinationInput.addEventListener("input", () => {
        resolvedDestination = null;
        const typedValue = destinationInput.value;
        syncHierarchy(typedValue);
        if (resolvedDestination || typedValue.trim().length < 2) return;
        window.clearTimeout(destinationLookupTimer);
        const lookupSequence = ++destinationLookupSequence;
        destinationLookupTimer = window.setTimeout(async () => {
          const worldwideMatch = await resolveWorldwideDestination(typedValue, language);
          if (!worldwideMatch || lookupSequence !== destinationLookupSequence || destinationInput.value !== typedValue) return;
          resolvedDestination = worldwideMatch;
          showResolvedDestination(worldwideMatch);
        }, 450);
      });
      loadWorldwideCountries().then((countries) => {
        globalCountries = countries;
        [...new Set(countries.map((country) => country.continent))].forEach((continent) => {
          if (continent && ![...continentSelect.options].some((option) => option.value === continent)) continentSelect.add(new Option(ko ? CONTINENT_NAMES_KO[continent] || continent : continent, continent));
        });
        if (continentSelect.value) fillCountries(continentSelect.value, countrySelect.value);
      });
      if (destinationInput.value) syncHierarchy(destinationInput.value);
    }
    form.elements.startDate.min = iso(today);
    form.elements.endDate.min = form.elements.startDate.value;
  }

  form.addEventListener("click", (event) => {
    const dateField = event.target.closest(".mission-followup-date-field");
    if (!dateField) return;
    const input = dateField.querySelector('input[type="date"]');
    if (event.target !== input) event.preventDefault();
    input?.focus();
    input?.showPicker?.();
  });

  form.elements.startDate?.addEventListener("change", () => {
    form.elements.endDate.min = form.elements.startDate.value;
    if (form.elements.endDate.value < form.elements.startDate.value) {
      const estimate = new Date(`${form.elements.startDate.value}T12:00:00`);
      estimate.setDate(estimate.getDate() + 6);
      form.elements.endDate.value = iso(estimate);
    }
  });

  const render = () => {
    sections.forEach((section, index) => { section.hidden = index !== current; });
    progress.textContent = travel ? `${current + 1} / ${steps.length}` : "";
    back.hidden = current === 0;
    next.textContent = current === steps.length - 1 ? (ko ? "미션 준비하기" : "Prepare Mission") : (ko ? "계속" : "Continue");
    error.textContent = "";
    sections[current].querySelector("input, select")?.focus();
    trackEvent("followup_step_viewed", { page: "home", language, mission_category: type, step: String(current + 1) });
  };

  const validateStep = () => {
    const fields = Array.from(sections[current].querySelectorAll("input, select"));
    const invalid = fields.find((field) => !field.checkValidity());
    if (invalid) {
      error.textContent = ko ? "필수 정보를 입력해주세요." : "Please complete the required information.";
      invalid.focus();
      trackEvent("followup_validation_error", { page: "home", language, mission_category: type, error_code: "required_field" });
      return false;
    }
    if (travel && current === 1 && form.elements.endDate.value < form.elements.startDate.value) {
      error.textContent = ko ? "귀국 날짜는 출국 날짜 이후여야 합니다." : "End date must be on or after the start date.";
      form.elements.endDate.focus();
      trackEvent("followup_validation_error", { page: "home", language, mission_category: type, error_code: "invalid_date_range" });
      return false;
    }
    return true;
  };

  form.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "cancel") { trackEvent("followup_cancelled", { page: "home", language, mission_category: type }); dialog.close("cancel"); return; }
    if (action === "sample") { useSampleProfile(); trackEvent("sample_profile_used", { page: "home", language, mission_category: type, demo_mode: true }); dialog.close("sample"); openMissionFollowUp({ mission, type, language, demoMode, restoreFocusTo, onComplete }); return; }
    if (action === "change-pref") { const key = event.target.closest("[data-pref-key]")?.dataset.prefKey; const field = form.elements.namedItem(key); const target = field?.closest(".mission-followup-step"); const index = sections.indexOf(target); if (index >= 0) { current = index; render(); field.focus(); } return; }
    if (action === "back") { trackEvent("followup_back_clicked", { page: "home", language, mission_category: type, step: String(current + 1) }); current = Math.max(0, current - 1); render(); return; }
    if (action === "next") {
      if (!validateStep()) return;
      if (travel && current === 0 && !resolvedDestination) {
        next.disabled = true;
        next.textContent = ko ? "목적지 확인 중..." : "Checking destination...";
        resolvedDestination = await resolveWorldwideDestination(form.elements.destination.value, language);
        next.disabled = false;
        if (resolvedDestination) {
          form.elements.destination.value = cityLabel(resolvedDestination.city, language);
          showResolvedDestination(resolvedDestination);
        } else {
          resolvedDestination = { country: ko ? "확인할 국가" : "Country to confirm", code: "", city: form.elements.destination.value };
        }
      }
      trackEvent("followup_step_completed", { page: "home", language, mission_category: type, step: String(current + 1) });
      if (current < steps.length - 1) { current += 1; render(); return; }
      const values = Object.fromEntries(new FormData(form).entries());
      if (travel) {
        const selectedCountry = resolvedDestination || countryForCity(values.destination, language) || (destinationContext?.country
          ? { country: destinationContext.country, code: destinationContext.code || "", city: destinationContext.value }
          : null);
        if (selectedCountry) {
          values.destination = cityLabel(selectedCountry.city, language);
          values.destinationCountry = selectedCountry.country;
          values.destinationCountryCode = selectedCountry.code;
          if (selectedCountry.currency) values.destinationCurrency = selectedCountry.currency;
        }
      }
      if (values.rememberPreferences === "on") {
        const missionId = `mission-${Date.now()}`;
        if (savedProfile.profile.profileConsent.enabled && travel) {
          saveApprovedPreference("travel", "departureAirport", values.departure, missionId);
          saveApprovedPreference("travel", "tripPace", values.priority, missionId);
        } else if (savedProfile.profile.profileConsent.enabled && (type === "tutoring" || type === "language_exchange")) {
          saveApprovedPreference("education", "subject", values.subject || values.language, missionId);
          saveApprovedPreference("education", "level", values.level, missionId);
          saveApprovedPreference("education", "format", values.format, missionId);
          saveApprovedPreference("education", "schedule", values.schedule, missionId);
        } else if (type === "shopping") {
          saveApprovedPreference("shopping", "brands", values.brands, missionId);
          saveApprovedPreference("shopping", "priorities", values.priority, missionId);
          saveApprovedPreference("shopping", "deliveryCountry", values.country, missionId);
        }
        trackEvent("preference_saved", { page: "home", language, mission_category: type, success: true });
      } else {
        trackEvent("preference_declined", { page: "home", language, mission_category: type });
      }
      const schedule = travel ? { startDate: values.startDate, endDate: values.endDate, timePreference: "any" } : null;
      dialog.close("complete");
      trackEvent("followup_completed", { page: "home", language, mission_category: type, success: true });
      onComplete?.({ type, answers: values, schedule, completedAt: new Date().toISOString() });
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    next.click();
  });

  form.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing || event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    next.click();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    if (dialog.returnValue !== "complete") restoreFocusTo?.focus();
  }, { once: true });
  document.body.classList.add("modal-open");
  dialog.showModal();
  render();
}
