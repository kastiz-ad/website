import { ApiError } from "./http.js";

export const PRICE_STRATEGIES = Object.freeze(["lowest_total_price", "maximum_points", "best_balance", "preferred_brands_first"]);
export const PROGRAM_CATEGORIES = Object.freeze(["airline", "hotel", "ota", "car_rental", "credit_card_rewards", "other_travel_program"]);
export const VERIFICATION_STATUSES = Object.freeze(["saved_reference", "unverified", "verified_connection", "live_integration", "expired"]);

const TEXT_LIMIT = 120;
const NOTE_LIMIT = 300;
const ARRAY_LIMIT = 12;
const SENSITIVE_ARRAY_LIMIT = 6;
const TOKEN = /^[\p{L}\p{N} .,'&()/_+-]{1,120}$/u;
const AIRPORT = /^[A-Z0-9]{2,5}$/;
const CURRENCY = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ENUMS = Object.freeze({
  seat_location: ["window", "aisle", "middle", "no_preference"],
  cabin_preference: ["economy", "premium_economy", "business", "first", "no_preference"],
  smoking_preference: ["non_smoking", "smoking", "no_preference"],
  travel_pace: ["relaxed", "balanced", "packed"],
  budget_level: ["budget", "standard", "premium", "luxury"],
  direct_flight_preference: ["prefer_direct", "allow_one_stop", "price_first"],
  flexible_date_preference: ["fixed_dates", "flexible_1_2_days", "flexible_week"],
  refundability_preference: ["refundable_preferred", "nonrefundable_ok", "depends_on_savings"],
  baggage_preference: ["carry_on_only", "checked_bag", "extra_baggage"],
  travel_purpose: ["solo", "couple", "family", "business", "friends", "mixed"],
  price_points_strategy: PRICE_STRATEGIES,
  budget_preference: ["lowest_price", "maximum_points", "best_balance", "preferred_brands"]
});

export const LOYALTY_CATALOG = Object.freeze([
  { provider: "korean_air", program: "Korean Air SKYPASS", category: "airline", aliases: ["Korean Air", "SKYPASS"] },
  { provider: "asiana", program: "Asiana Club", category: "airline", aliases: ["Asiana"] },
  { provider: "ana", program: "ANA Mileage Club", category: "airline", aliases: ["ANA", "All Nippon Airways"] },
  { provider: "jal", program: "Japan Airlines Mileage Bank", category: "airline", aliases: ["JAL", "Japan Airlines"] },
  { provider: "delta", program: "Delta SkyMiles", category: "airline", aliases: ["Delta"] },
  { provider: "united", program: "United MileagePlus", category: "airline", aliases: ["United"] },
  { provider: "air_canada", program: "Air Canada Aeroplan", category: "airline", aliases: ["Aeroplan"] },
  { provider: "marriott", program: "Marriott Bonvoy", category: "hotel", aliases: ["Marriott"] },
  { provider: "hilton", program: "Hilton Honors", category: "hotel", aliases: ["Hilton"] },
  { provider: "hyatt", program: "World of Hyatt", category: "hotel", aliases: ["Hyatt"] },
  { provider: "ihg", program: "IHG One Rewards", category: "hotel", aliases: ["IHG"] },
  { provider: "accor", program: "Accor Live Limitless", category: "hotel", aliases: ["Accor", "ALL"] },
  { provider: "booking", program: "Booking.com Genius", category: "ota", aliases: ["Booking.com"] },
  { provider: "agoda", program: "Agoda membership", category: "ota", aliases: ["Agoda"] },
  { provider: "expedia", program: "Expedia One Key", category: "ota", aliases: ["Expedia", "Hotels.com"] }
]);

const compact = value => String(value || "").trim();
const text = (value, max = TEXT_LIMIT) => {
  const next = compact(value);
  if (!next) return null;
  if (next.length > max || !TOKEN.test(next)) throw new ApiError(400, "validation_failed", "Check the text value.");
  return next;
};
const enumValue = (key, value) => {
  const next = compact(value);
  if (!next) return null;
  if (!ENUMS[key]?.includes(next)) throw new ApiError(400, "validation_failed", `Unsupported ${key}.`);
  return next;
};
const list = (value, { max = ARRAY_LIMIT, airport = false, currency = false } = {}) => {
  const input = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const normalized = [...new Set(input.map(item => compact(item)).filter(Boolean))];
  if (normalized.length > max) throw new ApiError(400, "too_many_values", "Too many values were supplied.");
  return normalized.map(item => {
    const next = airport || currency ? item.toUpperCase() : text(item);
    if (airport && !AIRPORT.test(next)) throw new ApiError(400, "invalid_airport", "Use valid airport codes.");
    if (currency && !CURRENCY.test(next)) throw new ApiError(400, "invalid_currency", "Use ISO currency codes.");
    return next;
  });
};
const optionText = value => text(value, 120) || "";

const preferenceSignals = (values = [], kind) => {
  const input = Array.isArray(values) ? values : [];
  const signals = new Set();
  for (const raw of input) {
    const value = compact(raw).toLowerCase();
    if (!value) continue;
    if (kind === "diet") {
      if (/vegetarian|채식|vegetar/i.test(value)) signals.add("Requests vegetarian meal");
      else if (/vegan|비건|vegano/i.test(value)) signals.add("Requests vegan meal");
      else if (/halal|할랄/i.test(value)) signals.add("Requests halal meal");
      else if (/kosher|코셔/i.test(value)) signals.add("Requests kosher meal");
      else if (/seafood|shellfish|fish|해산물|marisco|pescado/i.test(value)) signals.add("Has seafood-related dining preference");
      else signals.add("Has dietary preference");
    } else {
      if (/wheelchair|step-free|accessible|mobility|엘리베이터|휠체어|accesible|movilidad/i.test(value)) signals.add("Needs accessible room or route");
      else if (/hearing|visual|시각|청각|auditiva|visual/i.test(value)) signals.add("Requests accessibility support");
      else signals.add("Has accessibility preference");
    }
  }
  return [...signals];
};

export function validateTravelProfile(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "validation_failed", "Check the travel profile.");
  if ("user_id" in input || "userId" in input) throw new ApiError(400, "owner_not_allowed", "User ownership is determined by the signed-in session.");
  const allowed = new Set(["preferred_name", "preferred_language", "timezone", "home_city_region", "departure_airports", "arrival_airports", "airlines", "avoided_airlines", "hotel_brands", "avoided_hotel_brands", "seat_preference", "seat_location", "cabin_preference", "meal_preference", "dietary_restrictions", "accessibility_requirements", "room_preference", "room_type", "bed_preference", "bed_type", "smoking_preference", "floor_preference", "view_preference", "preferred_transport", "transport_preference", "travel_pace", "budget_preference", "budget_level", "checkin_preferences", "preferred_currencies", "direct_flight_preference", "maximum_stopovers", "flexible_date_preference", "refundability_preference", "baggage_preference", "travel_purpose", "party_preference", "price_points_strategy", "travel_style"]);
  if (Object.keys(input).some(key => !allowed.has(key))) throw new ApiError(400, "validation_failed", "Unsupported travel profile field.");
  const profile = {};
  if ("preferred_name" in input) profile.preferred_name = text(input.preferred_name, 80);
  if ("preferred_language" in input) profile.preferred_language = text(input.preferred_language, 20);
  if ("timezone" in input) profile.timezone = text(input.timezone, 80);
  if ("home_city_region" in input) profile.home_city_region = text(input.home_city_region, 120);
  if ("departure_airports" in input) profile.departure_airports = list(input.departure_airports, { airport: true });
  if ("arrival_airports" in input) profile.arrival_airports = list(input.arrival_airports, { airport: true });
  if ("airlines" in input) profile.airlines = list(input.airlines);
  if ("avoided_airlines" in input) profile.avoided_airlines = list(input.avoided_airlines);
  if ("hotel_brands" in input) profile.hotel_brands = list(input.hotel_brands);
  if ("avoided_hotel_brands" in input) profile.avoided_hotel_brands = list(input.avoided_hotel_brands);
  if ("preferred_transport" in input || "transport_preference" in input) profile.preferred_transport = list(input.preferred_transport || input.transport_preference);
  if ("dietary_restrictions" in input) profile.dietary_restrictions = list(input.dietary_restrictions, { max: SENSITIVE_ARRAY_LIMIT });
  if ("accessibility_requirements" in input) profile.accessibility_requirements = list(input.accessibility_requirements, { max: SENSITIVE_ARRAY_LIMIT });
  if ("preferred_currencies" in input) profile.preferred_currencies = list(input.preferred_currencies, { currency: true, max: 6 });
  if ("seat_location" in input || "seat_preference" in input) profile.seat_preference = enumValue("seat_location", input.seat_location || input.seat_preference);
  if ("cabin_preference" in input) profile.cabin_preference = enumValue("cabin_preference", input.cabin_preference);
  if ("smoking_preference" in input) profile.smoking_preference = enumValue("smoking_preference", input.smoking_preference);
  if ("travel_pace" in input || "travel_style" in input) profile.travel_style = enumValue("travel_pace", input.travel_pace || input.travel_style);
  if ("price_points_strategy" in input) profile.budget_preference = ({ lowest_total_price: "lowest_price", maximum_points: "maximum_points", best_balance: "best_balance", preferred_brands_first: "preferred_brands" }[enumValue("price_points_strategy", input.price_points_strategy)]);
  else if ("budget_preference" in input) profile.budget_preference = enumValue("budget_preference", input.budget_preference);
  const detail = {};
  for (const [source, target] of [["meal_preference", "meal"], ["room_type", "room_type"], ["room_preference", "room"], ["bed_type", "bed_type"], ["bed_preference", "bed"], ["floor_preference", "floor"], ["view_preference", "view"], ["direct_flight_preference", "direct_flight"], ["flexible_date_preference", "flexible_dates"], ["refundability_preference", "refundability"], ["baggage_preference", "baggage"], ["travel_purpose", "purpose"], ["party_preference", "party"], ["budget_level", "budget_level"]]) if (source in input) detail[target] = ENUMS[source]?.length ? enumValue(source, input[source]) : text(input[source]);
  if ("maximum_stopovers" in input) {
    const stops = Number(input.maximum_stopovers);
    if (!Number.isInteger(stops) || stops < 0 || stops > 5) throw new ApiError(400, "invalid_stopovers", "Maximum stopovers must be between 0 and 5.");
    detail.maximum_stopovers = stops;
  }
  if (input.checkin_preferences && typeof input.checkin_preferences === "object" && !Array.isArray(input.checkin_preferences)) detail.checkin = input.checkin_preferences;
  if (Object.keys(detail).length) profile.checkin_preferences = detail;
  return Object.fromEntries(Object.entries(profile).filter(([, value]) => value !== undefined));
}

export function maskMembershipNumber(value = "") {
  const raw = compact(value).replace(/\s+/g, "");
  if (!raw || raw.length < 4 || raw.length > 40 || !/^[A-Za-z0-9-]+$/.test(raw)) throw new ApiError(400, "invalid_membership_number", "Check the membership number.");
  return `${"*".repeat(Math.min(8, Math.max(4, raw.length - 4)))}${raw.slice(-4)}`;
}

export function maskedOnlyReference() {
  if (!globalThis.crypto?.randomUUID) throw new ApiError(503, "secure_reference_unavailable", "Secure reference generation is unavailable.");
  return `masked-only:${globalThis.crypto.randomUUID()}`;
}

export function validateLoyaltyRecord(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "validation_failed", "Check the loyalty record.");
  if ("user_id" in input || "userId" in input) throw new ApiError(400, "owner_not_allowed", "User ownership is determined by the signed-in session.");
  const forbidden = Object.keys(input).find(key => /password|security_question|security_answer|login|credential|token|secret|oauth/i.test(key));
  if (forbidden) throw new ApiError(400, "sensitive_field_rejected", "ONE never stores loyalty passwords, security answers, tokens, or login secrets.");
  const category = compact(input.category || input.program_category);
  if (!PROGRAM_CATEGORIES.includes(category)) throw new ApiError(400, "invalid_program_category", "Choose a supported loyalty category.");
  const membership = compact(input.membership_number || input.membershipNumber || input.protected_membership_reference);
  if (!membership) throw new ApiError(400, "membership_number_required", "Enter a membership number.");
  const record = { provider: text(input.provider, 80), program: text(input.program, 120), program_category: category, protected_membership_reference: maskedOnlyReference(), masked_membership_number: maskMembershipNumber(membership), member_name: text(input.member_name || input.memberName, 80), tier: text(input.tier, 80), preferred_usage: enumValue("price_points_strategy", input.preferred_usage || input.preferredUsage) || "best_balance", verification_status: VERIFICATION_STATUSES.includes(input.verification_status) ? input.verification_status : "saved_reference", notes: text(input.notes, NOTE_LIMIT) };
  if (input.expires_at || input.expiration_date) {
    const expires = compact(input.expires_at || input.expiration_date);
    if (!DATE.test(expires)) throw new ApiError(400, "invalid_expiration", "Use YYYY-MM-DD for expiration date.");
    record.expires_at = expires;
  }
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== null && value !== undefined));
}

export const publicLoyaltyRecord = record => record ? { id: record.id, provider: record.provider, program: record.program, program_category: record.program_category || "other_travel_program", masked_membership_number: record.masked_membership_number, full_membership_stored: false, member_name: record.member_name || null, tier: record.tier || null, expires_at: record.expires_at || null, preferred_usage: record.preferred_usage || "best_balance", verification_status: record.verification_status || "saved_reference", notes: record.notes || null, created_at: record.created_at, updated_at: record.updated_at, last_used_at: record.last_used_at || null } : null;

export function safeTravelPlanningContext({ travelProfile = {}, loyaltyAccounts = [] } = {}) {
  const checkin = travelProfile.checkin_preferences || {};
  return { preferredDepartureAirports: travelProfile.departure_airports || [], preferredArrivalAirports: travelProfile.arrival_airports || [], preferredAirlines: travelProfile.airlines || [], avoidedAirlines: travelProfile.avoided_airlines || [], preferredHotels: travelProfile.hotel_brands || [], avoidedHotels: travelProfile.avoided_hotel_brands || [], seatPreference: travelProfile.seat_preference || null, cabinPreference: travelProfile.cabin_preference || null, dietaryPreferenceSignals: preferenceSignals(travelProfile.dietary_restrictions, "diet"), accessibilityPreferenceSignals: preferenceSignals(travelProfile.accessibility_requirements, "accessibility"), transportPreference: travelProfile.preferred_transport || [], travelPace: travelProfile.travel_style || checkin.pace || null, pricePointsStrategy: checkin.price_points_strategy || travelProfile.budget_preference || null, directFlightPreference: checkin.direct_flight || null, maximumStopovers: checkin.maximum_stopovers ?? null, loyaltyPrograms: loyaltyAccounts.map(item => ({ provider: item.provider, program: item.program, category: item.program_category, tier: item.tier || null, preferredUsage: item.preferred_usage || null, verificationStatus: item.verification_status || "saved_reference" })) };
}

const providerOf = option => compact(option.provider || option.airline || option.hotelBrand || option.hotel || option.brand);
const totalPrice = option => Number(option.basePrice || 0) + Number(option.taxesAndFees || 0) + Number(option.providerFee || 0) + Number(option.bookingFee || 0);
const pointsValue = option => Number(option.confirmedPoints || option.estimatedPoints || 0);

export function compareTravelOptions(options = [], context = {}) {
  if (!Array.isArray(options) || !options.length) throw new ApiError(400, "options_required", "Comparison options are required.");
  const profile = context.travelProfile || {};
  const loyalty = context.loyaltyAccounts || [];
  const safe = safeTravelPlanningContext({ travelProfile: profile, loyaltyAccounts: loyalty });
  const preferred = new Set([...(safe.preferredAirlines || []), ...(safe.preferredHotels || [])].map(v => String(v).toLowerCase()));
  const avoided = new Set([...(safe.avoidedAirlines || []), ...(safe.avoidedHotels || [])].map(v => String(v).toLowerCase()));
  const loyaltyProviders = new Set(loyalty.map(item => compact(item.provider).toLowerCase()));
  const compared = options.map((option, index) => {
    const provider = optionText(providerOf(option));
    const providerKey = provider.toLowerCase();
    const price = totalPrice(option);
    const preferenceMatch = (preferred.has(providerKey) ? 25 : 0) - (avoided.has(providerKey) ? 60 : 0) + (safe.directFlightPreference === "prefer_direct" && option.stopovers === 0 ? 12 : 0) + (safe.maximumStopovers !== null && Number(option.stopovers || 0) <= Number(safe.maximumStopovers) ? 8 : 0) + (/refundable/i.test(String(option.refundability || option.cancellationPolicy || "")) ? 8 : 0);
    const loyaltyAdvantage = (loyaltyProviders.has(providerKey) ? 18 : 0) + Math.min(20, pointsValue(option) / 1000);
    const flexibilityScore = /refundable/i.test(String(option.refundability || option.cancellationPolicy || "")) ? 85 : 45;
    const convenienceScore = Math.max(0, 90 - Number(option.stopovers || 0) * 18 - Math.max(0, Number(option.durationMinutes || 0) - 480) / 30);
    const confidenceLevel = option.source === "live" && option.lastLivePriceCheckTime ? "high" : option.dataConfidence || "demo";
    const importantWarnings = [];
    if (option.estimatedPoints && !option.confirmedPoints) importantWarnings.push("Points are estimated, not provider-confirmed.");
    if (option.channel === "ota" && option.kind === "hotel") importantWarnings.push("OTA hotel bookings may not earn hotel points or elite benefits.");
    if (avoided.has(providerKey)) importantWarnings.push("This provider is on the avoided list.");
    const score = (1000 / Math.max(price, 1)) * 18 + preferenceMatch + loyaltyAdvantage + flexibilityScore * 0.25 + convenienceScore * 0.35;
    return { id: optionText(option.id) || `option-${index + 1}`, label: optionText(option.label) || provider || `Option ${index + 1}`, provider, totalPrice: price, currency: option.currency || "USD", preferenceMatch, loyaltyAdvantage, flexibilityScore, convenienceScore: Math.round(convenienceScore), confidenceLevel, recommendationReason: `${provider || "This option"} balances price, preferences, and loyalty signals without claiming live booking.`, importantWarnings, source: option.source || "fictional_demo", score: Number(score.toFixed(3)), estimatedPoints: option.estimatedPoints || null, confirmedPoints: option.confirmedPoints || null };
  }).sort((a, b) => b.score - a.score || a.totalPrice - b.totalPrice || a.label.localeCompare(b.label));
  return { compared, bestPriceOption: [...compared].sort((a, b) => a.totalPrice - b.totalPrice)[0], bestPointsOption: [...compared].sort((a, b) => b.loyaltyAdvantage - a.loyaltyAdvantage || a.totalPrice - b.totalPrice)[0], bestBalancedOption: compared[0], safePlanningContext: safe, note: "Fictional demonstration only. No live prices, availability, points, booking, or provider connection is claimed." };
}
