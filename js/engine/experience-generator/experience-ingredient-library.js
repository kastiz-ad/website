const freeze = (items) => Object.freeze(items.map((item) => Object.freeze(item)));

export const EXPERIENCE_INGREDIENTS = Object.freeze({
  locations: freeze([
    { id: "river", tags: ["sunset", "romantic", "walk"] }, { id: "beach", tags: ["sunset", "healing", "summer"] },
    { id: "mountain", tags: ["adventure", "view", "nature"] }, { id: "forest", tags: ["healing", "quiet", "rain"] },
    { id: "lake", tags: ["romantic", "quiet", "picnic"] }, { id: "downtown", tags: ["energetic", "night", "food"] },
    { id: "traditional-village", tags: ["traditional", "photography", "culture"] }, { id: "island", tags: ["adventure", "water", "weekend"] },
    { id: "countryside", tags: ["healing", "local", "drive"] }, { id: "rooftop", tags: ["night", "romantic", "view"] },
    { id: "hidden-alley", tags: ["hidden", "food", "photography"] }, { id: "theme-park", tags: ["fun", "energetic", "family"] },
    { id: "aquarium", tags: ["rain", "cute", "family"] }, { id: "gallery", tags: ["elegant", "indoor", "culture"] },
    { id: "market", tags: ["food", "local", "energetic"] }, { id: "observatory", tags: ["sunset", "night", "view"] },
    { id: "temple", tags: ["healing", "traditional", "quiet"] }, { id: "hanok", tags: ["traditional", "cozy", "photography"] },
    { id: "han-river", tags: ["seoul", "river", "sunset", "picnic", "budget"] }, { id: "jamsil", tags: ["seoul", "jamsil", "aquarium", "observatory", "date"] },
    { id: "hongdae", tags: ["seoul", "hongdae", "music", "youth", "night"] }, { id: "myeongdong", tags: ["seoul", "myeongdong", "shopping", "street-food", "night"] },
    { id: "gangnam", tags: ["seoul", "gangnam", "modern", "cafe", "night"] }, { id: "seongsu", tags: ["seoul", "seongsu", "pop-up", "cafe", "creative"] },
    { id: "ikseondong", tags: ["seoul", "ikseondong", "hanok", "cafe", "romantic"] }, { id: "namsan", tags: ["seoul", "namsan", "view", "sunset", "romantic"] },
    { id: "bukchon", tags: ["seoul", "bukchon", "hanok", "walk", "photography"] }, { id: "yeouido", tags: ["seoul", "yeouido", "river", "park", "sunset"] },
    { id: "yeonnam", tags: ["seoul", "yeonnam", "walk", "cafe", "cute"] }, { id: "seokchon-lake", tags: ["seoul", "jamsil", "lake", "walk", "romantic"] }
  ]),
  activities: freeze([
    { id: "kayak", tags: ["water", "adventure", "summer"] }, { id: "rail-bike", tags: ["outdoor", "fun", "couple"] },
    { id: "bowling", tags: ["indoor", "fun", "friends"] }, { id: "vr", tags: ["indoor", "energetic", "rain"] },
    { id: "escape-room", tags: ["indoor", "team", "fun"] }, { id: "cooking-class", tags: ["food", "learning", "couple"] },
    { id: "pottery", tags: ["creative", "romantic", "rain"] }, { id: "painting", tags: ["creative", "healing", "indoor"] },
    { id: "shopping", tags: ["city", "flexible", "style"] }, { id: "wine-tasting", tags: ["elegant", "romantic", "night"] },
    { id: "jazz", tags: ["night", "romantic", "music"] }, { id: "mini-golf", tags: ["fun", "couple", "friends"] },
    { id: "camping", tags: ["nature", "adventure", "weekend"] }, { id: "photography-walk", tags: ["creative", "hidden", "walk"] },
    { id: "massage", tags: ["healing", "luxury", "indoor"] }, { id: "bike-ride", tags: ["outdoor", "energetic", "local"] },
    { id: "picnic", tags: ["sunset", "romantic", "budget"] }, { id: "arcade", tags: ["fun", "night", "rain"] },
    { id: "coin-karaoke", tags: ["fun", "music", "budget"] }, { id: "flower-class", tags: ["creative", "romantic", "cute"] },
    { id: "perfume-making", tags: ["creative", "romantic", "memory"] }, { id: "sunset-ferry", tags: ["sunset", "water", "memory"] },
    { id: "han-river-ramen", tags: ["seoul", "river", "han-river", "food", "budget", "couple"] }, { id: "han-river-picnic", tags: ["seoul", "river", "han-river", "sunset", "romantic"] },
    { id: "lotte-aquarium", tags: ["seoul", "jamsil", "aquarium", "indoor", "rain", "couple"] }, { id: "seoul-sky", tags: ["seoul", "jamsil", "observatory", "sunset", "night", "view"] },
    { id: "seokchon-lake-walk", tags: ["seoul", "jamsil", "lake", "walk", "romantic"] }, { id: "lotte-world", tags: ["seoul", "jamsil", "theme-park", "fun", "energetic"] },
    { id: "hongdae-street-date", tags: ["seoul", "hongdae", "music", "shopping", "night"] }, { id: "hongdae-live-music", tags: ["seoul", "hongdae", "music", "night", "energetic"] },
    { id: "yeonnam-park-walk", tags: ["seoul", "yeonnam", "walk", "cafe", "cute"] }, { id: "photo-booth", tags: ["seoul", "hongdae", "gangnam", "cute", "memory", "indoor"] },
    { id: "myeongdong-street-food", tags: ["seoul", "myeongdong", "street-food", "food", "night"] }, { id: "myeongdong-shopping", tags: ["seoul", "myeongdong", "shopping", "style", "flexible"] },
    { id: "namsan-cable-car", tags: ["seoul", "namsan", "view", "romantic", "sunset"] }, { id: "n-seoul-tower", tags: ["seoul", "namsan", "observatory", "night", "romantic"] },
    { id: "gangnam-cafe-date", tags: ["seoul", "gangnam", "cafe", "modern", "couple"] }, { id: "coex-starfield-library", tags: ["seoul", "gangnam", "indoor", "photography", "rain"] },
    { id: "coex-aquarium", tags: ["seoul", "gangnam", "aquarium", "indoor", "rain"] }, { id: "seongsu-pop-up-tour", tags: ["seoul", "seongsu", "pop-up", "creative", "shopping"] },
    { id: "seongsu-cafe-hopping", tags: ["seoul", "seongsu", "cafe", "dessert", "creative"] }, { id: "ikseondong-hanok-cafe", tags: ["seoul", "ikseondong", "hanok", "cafe", "romantic"] },
    { id: "bukchon-photo-walk", tags: ["seoul", "bukchon", "hanok", "photography", "walk"] }, { id: "palace-night-walk", tags: ["seoul", "traditional", "night", "romantic", "walk"] },
    { id: "board-game-cafe", tags: ["seoul", "indoor", "rain", "fun", "couple"] }, { id: "comic-book-cafe", tags: ["seoul", "indoor", "rain", "cozy", "budget"] },
    { id: "indoor-climbing", tags: ["seoul", "indoor", "adventure", "energetic", "couple"] }, { id: "ice-skating", tags: ["seoul", "winter", "fun", "couple"] },
    { id: "river-cruise", tags: ["seoul", "river", "sunset", "night", "romantic"] }, { id: "rooftop-cinema", tags: ["seoul", "rooftop", "movie", "night", "romantic"] },
    { id: "traditional-tea", tags: ["seoul", "traditional", "hanok", "tea", "cozy"] }, { id: "couple-ring-making", tags: ["seoul", "creative", "couple", "memory", "indoor"] }
  ]),
  foods: freeze([
    { id: "bbq", tags: ["social", "local"] }, { id: "steak", tags: ["elegant", "celebration"] },
    { id: "italian", tags: ["romantic", "comfort"] }, { id: "japanese", tags: ["elegant", "light"] },
    { id: "chinese", tags: ["social", "variety"] }, { id: "thai", tags: ["energetic", "variety"] },
    { id: "french", tags: ["luxury", "romantic"] }, { id: "mexican", tags: ["fun", "social"] },
    { id: "vegan", tags: ["light", "wellness"] }, { id: "dessert", tags: ["cute", "romantic"] },
    { id: "bakery", tags: ["morning", "cozy"] }, { id: "cafe", tags: ["flexible", "cozy"] },
    { id: "makgeolli-jeon", tags: ["traditional", "rain"] }, { id: "hotpot", tags: ["social", "cold"] },
    { id: "market-tasting", tags: ["local", "discovery"] }, { id: "chef-tasting", tags: ["luxury", "memory"] },
    { id: "han-river-ramen-meal", tags: ["seoul", "river", "han-river", "budget", "casual"] }, { id: "tteokbokki-sundae", tags: ["seoul", "street-food", "casual", "fun"] },
    { id: "korean-bbq-date", tags: ["seoul", "korean", "social", "dinner"] }, { id: "pasta-tiramisu", tags: ["italian", "romantic", "dinner", "dessert"] },
    { id: "omakase", tags: ["japanese", "luxury", "celebration", "dinner"] }, { id: "bingsu", tags: ["korean", "dessert", "summer", "cute"] },
    { id: "croffle-coffee", tags: ["cafe", "dessert", "cute", "afternoon"] }, { id: "rooftop-dinner", tags: ["rooftop", "night", "romantic", "dinner"] }
  ]),
  moods: freeze(["romantic", "healing", "luxury", "funny", "cute", "adventure", "hidden", "instagram", "classic", "traditional", "elegant", "night", "sunset", "rainy", "cozy", "energetic"].map((id) => ({ id, tags: [id] }))),
  transport: freeze(["walk", "subway", "bike", "KTX", "SRT", "ITX", "bus", "rental-car", "taxi", "ferry"].map((id) => ({ id, tags: [id] }))),
  durations: freeze([{ id: "2-hours", minutes: 120 }, { id: "half-day", minutes: 300 }, { id: "1-day", minutes: 600 }, { id: "weekend", minutes: 1800 }, { id: "3-days", minutes: 3000 }, { id: "week", minutes: 7200 }])
});

// Compatibility groups are ingredient pools, not fixed itineraries. The generator
// still varies order, mood, transport, food, and alternatives on every mission.
export const SEOUL_EXPERIENCE_CLUSTERS = Object.freeze([
  Object.freeze({ id: "han-river", location: "han-river", activities: Object.freeze(["han-river-picnic", "han-river-ramen", "river-cruise", "bike-ride", "photo-booth"]), foods: Object.freeze(["han-river-ramen-meal", "korean-bbq-date", "bingsu", "croffle-coffee"]) }),
  Object.freeze({ id: "jamsil", location: "jamsil", activities: Object.freeze(["lotte-aquarium", "seokchon-lake-walk", "seoul-sky", "lotte-world", "photo-booth"]), foods: Object.freeze(["pasta-tiramisu", "omakase", "bingsu", "korean-bbq-date"]) }),
  Object.freeze({ id: "hongdae", location: "hongdae", activities: Object.freeze(["hongdae-street-date", "hongdae-live-music", "yeonnam-park-walk", "photo-booth", "coin-karaoke", "arcade"]), foods: Object.freeze(["tteokbokki-sundae", "korean-bbq-date", "croffle-coffee", "italian"]) }),
  Object.freeze({ id: "myeongdong-namsan", location: "myeongdong", activities: Object.freeze(["myeongdong-shopping", "myeongdong-street-food", "namsan-cable-car", "n-seoul-tower", "photo-booth"]), foods: Object.freeze(["tteokbokki-sundae", "rooftop-dinner", "bingsu", "korean-bbq-date"]) }),
  Object.freeze({ id: "gangnam-coex", location: "gangnam", activities: Object.freeze(["coex-starfield-library", "coex-aquarium", "gangnam-cafe-date", "couple-ring-making", "photo-booth"]), foods: Object.freeze(["pasta-tiramisu", "omakase", "croffle-coffee", "rooftop-dinner"]) }),
  Object.freeze({ id: "seongsu", location: "seongsu", activities: Object.freeze(["seongsu-pop-up-tour", "seongsu-cafe-hopping", "couple-ring-making", "photo-booth", "indoor-climbing"]), foods: Object.freeze(["croffle-coffee", "pasta-tiramisu", "korean-bbq-date", "bingsu"]) }),
  Object.freeze({ id: "traditional-seoul", location: "ikseondong", activities: Object.freeze(["ikseondong-hanok-cafe", "bukchon-photo-walk", "palace-night-walk", "traditional-tea", "perfume-making", "pottery"]), foods: Object.freeze(["makgeolli-jeon", "korean-bbq-date", "bingsu", "market-tasting"]) }),
  Object.freeze({ id: "rainy-seoul", location: "downtown", activities: Object.freeze(["board-game-cafe", "comic-book-cafe", "escape-room", "vr", "indoor-climbing", "rooftop-cinema"]), foods: Object.freeze(["hotpot", "pasta-tiramisu", "croffle-coffee", "korean-bbq-date"]) })
]);

export const ingredientCount = () => Object.values(EXPERIENCE_INGREDIENTS).reduce((sum, list) => sum + list.length, 0);
