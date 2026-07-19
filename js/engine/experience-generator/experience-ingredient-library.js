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
    { id: "temple", tags: ["healing", "traditional", "quiet"] }, { id: "hanok", tags: ["traditional", "cozy", "photography"] }
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
    { id: "perfume-making", tags: ["creative", "romantic", "memory"] }, { id: "sunset-ferry", tags: ["sunset", "water", "memory"] }
  ]),
  foods: freeze([
    { id: "bbq", tags: ["social", "local"] }, { id: "steak", tags: ["elegant", "celebration"] },
    { id: "italian", tags: ["romantic", "comfort"] }, { id: "japanese", tags: ["elegant", "light"] },
    { id: "chinese", tags: ["social", "variety"] }, { id: "thai", tags: ["energetic", "variety"] },
    { id: "french", tags: ["luxury", "romantic"] }, { id: "mexican", tags: ["fun", "social"] },
    { id: "vegan", tags: ["light", "wellness"] }, { id: "dessert", tags: ["cute", "romantic"] },
    { id: "bakery", tags: ["morning", "cozy"] }, { id: "cafe", tags: ["flexible", "cozy"] },
    { id: "makgeolli-jeon", tags: ["traditional", "rain"] }, { id: "hotpot", tags: ["social", "cold"] },
    { id: "market-tasting", tags: ["local", "discovery"] }, { id: "chef-tasting", tags: ["luxury", "memory"] }
  ]),
  moods: freeze(["romantic", "healing", "luxury", "funny", "cute", "adventure", "hidden", "instagram", "classic", "traditional", "elegant", "night", "sunset", "rainy", "cozy", "energetic"].map((id) => ({ id, tags: [id] }))),
  transport: freeze(["walk", "subway", "bike", "KTX", "SRT", "ITX", "bus", "rental-car", "taxi", "ferry"].map((id) => ({ id, tags: [id] }))),
  durations: freeze([{ id: "2-hours", minutes: 120 }, { id: "half-day", minutes: 300 }, { id: "1-day", minutes: 600 }, { id: "weekend", minutes: 1800 }, { id: "3-days", minutes: 3000 }, { id: "week", minutes: 7200 }])
});

export const ingredientCount = () => Object.values(EXPERIENCE_INGREDIENTS).reduce((sum, list) => sum + list.length, 0);
