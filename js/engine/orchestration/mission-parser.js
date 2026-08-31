const normalize = (value = "") => String(value).normalize("NFKC").trim();

const stripCommandPrefix = (text = "") => normalize(text)
  .replace(/^(?:please\s+)?(?:add|include|put in|find|show me|추가|넣어|찾아줘|보여줘|añade|incluye|agrega|busca)\s*/i, "")
  .replace(/^(?:remove|delete|skip|avoid|without|no|빼|제외|없애|싫어|quita|elimina|sin|no)\s*/i, "")
  .trim();

const moneyAmount = (text = "") => {
  const match = normalize(text).replace(/,/g, "").match(/(?:[$€₩]\s*)?(\d{2,})(?:\s*(?:dollars|usd|원|달러|euros?))?/i);
  return match ? Number(match[1]) : null;
};

export const parseMissionSeed = (text = "") => {
  const value = normalize(text);
  return {
    raw: value,
    destinationHints: [...value.matchAll(/\b(?:to|in|for)\s+([A-Z][\w\s]+?)(?:\s+trip|\s+travel|$)/g)].map((match) => match[1].trim()),
    duration: Number(value.match(/(\d+)\s*(?:day|days|일|박)/i)?.[1] || 0) || null,
    travellers: /mother|mom|엄마|어머니|madre/i.test(value) ? ["user", "mother"] : []
  };
};

export const parseMissionEdit = (command = "") => {
  const text = normalize(command);
  const lower = text.toLowerCase();
  const entity = stripCommandPrefix(text);
  if (!text) return { type: "NOOP", command: text, confidence: 0, changedFields: [], entity: "" };

  if (/mother|mom|엄마|어머니|madre/i.test(text) && /stairs|계단|escalera/i.test(text)) {
    return { type: "ADD_MOBILITY_REQUIREMENT", command: text, entity: "no stairs", value: text, changedFields: ["mobilityRequirements"], confidence: 0.95 };
  }
  if (/wheelchair|휠체어|silla de ruedas/i.test(text)) {
    return { type: "ADD_MOBILITY_REQUIREMENT", command: text, entity: "wheelchair accessible", value: text, changedFields: ["mobilityRequirements"], confidence: 0.95 };
  }
  if (/no stairs|cannot use stairs|can't use stairs|계단/i.test(text)) {
    return { type: "ADD_MOBILITY_REQUIREMENT", command: text, entity: "no stairs", value: text, changedFields: ["mobilityRequirements"], confidence: 0.92 };
  }
  if (/vegetarian|vegan|채식|비건|vegetar/i.test(text)) {
    return { type: "ADD_FOOD_CONSTRAINT", command: text, entity: "vegetarian", value: text, changedFields: ["foodPreferences", "hardConstraints"], confidence: 0.93 };
  }
  if (/no seafood|without seafood|seafood.*remove|해산물|생선.*제외|sin mariscos/i.test(text)) {
    return { type: "ADD_FOOD_CONSTRAINT", command: text, entity: "no seafood", value: text, changedFields: ["foodPreferences", "hardConstraints"], confidence: 0.94 };
  }
  if (/no museums|without museums|remove museums|박물관|미술관|sin museos/i.test(text)) {
    return { type: "ADD_PLACE_CONSTRAINT", command: text, entity: "no museums", value: text, changedFields: ["hardConstraints", "places", "dailyPlan"], confidence: 0.94 };
  }
  if (/matcha|말차|green tea/i.test(text)) {
    return { type: "ADD_FOOD_STOP", command: text, entity: entity || "matcha ice cream", value: "matcha dessert", changedFields: ["foodPreferences", "restaurants", "dailyPlan"], confidence: 0.95 };
  }
  if (/sushi|스시|초밥|寿司/i.test(text)) {
    return { type: "ADD_FOOD_STOP", command: text, entity: entity || "sushi", value: "sushi", changedFields: ["foodPreferences", "restaurants", "dailyPlan"], confidence: 0.93 };
  }
  if (/add more restaurants|more restaurants|another restaurant|레스토랑.*추가|식당.*추가|más restaurantes|otro restaurante/i.test(text)) {
    return { type: "ADD_RESTAURANT_OPTIONS", command: text, entity: "additional restaurants", value: text, changedFields: ["restaurants"], confidence: 0.9 };
  }
  if (/another hotel|more hotels|hotel option|숙소.*추가|호텔.*추가|otro hotel|más hoteles/i.test(text)) {
    return { type: "ADD_HOTEL_OPTION", command: text, entity: "additional hotel", value: text, changedFields: ["hotels"], confidence: 0.9 };
  }
  if (/cheaper flights?|lower[- ]cost flights?|저렴한 항공|항공.*저렴|vuelos? más baratos/i.test(text)) {
    return { type: "ADD_LOWER_FARE_FLIGHT", command: text, entity: "lower-fare flight", value: text, changedFields: ["flights", "budget"], confidence: 0.9 };
  }
  if (/attraction.*shibuya|place.*shibuya|시부야.*명소|atracci[oó]n.*shibuya/i.test(text)) {
    return { type: "ADD_SHIBUYA_PLACE", command: text, entity: "Shibuya attraction", value: text, changedFields: ["places"], confidence: 0.9 };
  }
  if (/move|day\s*\d|일차|디즈니|disney/i.test(text) && /disney|디즈니/i.test(text)) {
    const day = Number(text.match(/day\s*(\d+)|(\d+)\s*일차/i)?.[1] || text.match(/day\s*(\d+)|(\d+)\s*일차/i)?.[2] || 3);
    return { type: "MOVE_PLACE", command: text, entity: "Disney", value: { place: "Disney", day }, changedFields: ["dailyPlan", "places"], confidence: 0.9 };
  }
  if (/reduce|lower|cheaper|save|budget|예산|줄|저렴|presupuesto|barato/i.test(text) && /budget|예산|presupuesto|[$€₩]|\d/.test(text)) {
    return { type: "LOWER_BUDGET", command: text, entity: "budget", value: moneyAmount(text), changedFields: ["budget"], confidence: 0.88 };
  }
  if (/upgrade.*hotel|better hotel|luxury hotel|호텔.*업그레이드|숙소.*업그레이드|mejor hotel/i.test(text)) {
    return { type: "UPGRADE_HOTEL", command: text, entity: "hotel upgrade", value: text, changedFields: ["hotelPreferences", "selectedHotel"], confidence: 0.9 };
  }
  if (/shibuya|시부야|渋谷/i.test(text) && /stay|hotel|closer|near|숙소|호텔|가까/i.test(text)) {
    return { type: "CHANGE_HOTEL_AREA", command: text, entity: "Shibuya", value: "Shibuya", changedFields: ["hotelPreferences", "selectedHotel"], confidence: 0.92 };
  }
  if (/tokyo station|도쿄역|東京駅/i.test(text) && /stay|hotel|closer|near|숙소|호텔|가까/i.test(text)) {
    return { type: "CHANGE_HOTEL_AREA", command: text, entity: "Tokyo Station", value: "Tokyo Station", changedFields: ["hotelPreferences", "selectedHotel"], confidence: 0.92 };
  }
  if (/shopping|shop|쇼핑|compras/i.test(text)) {
    return { type: "ADD_INTEREST", command: text, entity: "shopping", value: "shopping", changedFields: ["interests", "places", "dailyPlan"], confidence: 0.86 };
  }
  if (/kyoto|교토|京都/i.test(text) && /(more|another|one more|spend|하루|더|más)/i.test(text)) {
    return { type: "EXTEND_DESTINATION_TIME", command: text, entity: "Kyoto", value: "Kyoto", changedFields: ["destinations", "duration", "dailyPlan", "hotelPreferences"], confidence: 0.84 };
  }
  if (/remove|delete|skip|avoid|without|no|빼|제외|없애|quita|elimina|sin/i.test(text)) {
    return { type: "REMOVE_ITEM", command: text, entity, value: entity, changedFields: ["hardConstraints", "dailyPlan", "places", "restaurants"], confidence: 0.78 };
  }
  return { type: "NOOP", command: text, entity: entity || text, value: entity || text, changedFields: [], confidence: 0.2 };
};

