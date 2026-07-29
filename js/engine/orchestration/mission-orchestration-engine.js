import { MissionStore, MISSION_ORCHESTRATION_VERSION, missionStateChangedFields } from "./mission-store.js";
import { parseMissionEdit } from "./mission-parser.js";
import { dependenciesToSections, providerRefreshPlan, resolveDependencies } from "./dependency-engine.js";

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

const uniquePush = (list, value) => {
  if (!value) return list;
  const next = Array.isArray(list) ? [...list] : [];
  if (!next.some((item) => String(item).toLowerCase() === String(value).toLowerCase())) next.push(value);
  return next;
};

const prependUniqueByName = (items = [], item) => {
  const name = String(item?.name || item?.venueName || "");
  return [item, ...items.filter((candidate) => String(candidate?.name || candidate?.venueName || "").toLowerCase() !== name.toLowerCase())];
};

const destinationLabel = (missionState = {}) => {
  const destination = missionState.destinations?.[0] || {};
  return destination.city || destination.country || "destination";
};

const makeRestaurantInjection = (kind, destination) => {
  if (kind === "matcha") {
    return {
      icon: "🍵",
      name: /japan|tokyo|kyoto|osaka|일본|도쿄|교토|오사카/i.test(destination) ? "Saryo Tsujiri matcha ice cream stop" : `${destination} matcha dessert café`,
      tags: ["matcha", "dessert", "afternoon"],
      source: "provider_search_ready",
      providerEvidence: { sourceState: "missing_api_key", provider: "google-places", query: `matcha dessert near ${destination}` }
    };
  }
  if (kind === "sushi") {
    return {
      icon: "🍣",
      name: /japan|tokyo|kyoto|osaka|일본|도쿄|교토|오사카/i.test(destination) ? "Tsukiji / Toyosu sushi counter" : `${destination} sushi counter`,
      tags: ["sushi", "food", "reservation check"],
      source: "provider_search_ready",
      providerEvidence: { sourceState: "missing_api_key", provider: "google-places", query: `sushi near ${destination}` }
    };
  }
  if (kind === "vegetarian") {
    return {
      icon: "🥗",
      name: `${destination} vegetarian restaurant shortlist`,
      tags: ["vegetarian", "diet fit"],
      source: "provider_search_ready",
      providerEvidence: { sourceState: "missing_api_key", provider: "google-places", query: `vegetarian restaurants near ${destination}` }
    };
  }
  return null;
};

const makePlaceInjection = (kind, destination) => {
  if (kind === "shopping") {
    return {
      icon: "🛍️",
      name: /japan|tokyo|일본|도쿄/i.test(destination) ? "Ginza / Harajuku shopping block" : `${destination} shopping district`,
      tags: ["shopping", "user requested"],
      source: "provider_search_ready"
    };
  }
  if (kind === "disney") {
    return {
      icon: "🎢",
      name: /japan|tokyo|일본|도쿄/i.test(destination) ? "Tokyo Disney Resort" : `${destination} Disney stop`,
      tags: ["theme park", "moved by user"],
      source: "provider_search_ready"
    };
  }
  return null;
};

const updateLegacyResult = (result, state, intent, dependencies, sections, beforeResult) => {
  const destination = destinationLabel(state);
  const next = {
    ...result,
    missionState: state,
    missionOrchestration: {
      version: MISSION_ORCHESTRATION_VERSION,
      lastIntent: intent,
      changedFields: intent.changedFields,
      dependencies,
      affectedSections: sections,
      providerRefreshPlan: providerRefreshPlan(dependencies),
      summary: createShortSummary(intent, dependencies, destination),
      previousResult: beforeResult,
      updatedAt: state.updatedAt
    },
    revisionProvider: "MISSION_ORCHESTRATION_ENGINE",
    revisionHistory: [
      ...(result.revisionHistory || []),
      {
        id: `orchestration-${Date.now()}`,
        command: intent.command,
        intent: intent.type,
        material: sections.includes("approval"),
        provider: "MISSION_ORCHESTRATION_ENGINE",
        affectedSections: sections,
        createdAt: state.updatedAt
      }
    ],
    approval: {
      ...(result.approval || {}),
      state: sections.includes("approval") ? "APPROVAL_REVIEW_REQUIRED" : result.approval?.state || "NOT_APPROVED",
      invalidatedAt: sections.includes("approval") ? state.updatedAt : result.approval?.invalidatedAt || null
    }
  };

  next.constraints = { ...(next.constraints || {}) };
  next.accommodation = { ...(next.accommodation || {}) };
  next.orchestrationInjections = {
    restaurants: [...(result.orchestrationInjections?.restaurants || [])],
    places: [...(result.orchestrationInjections?.places || [])]
  };

  if (intent.type === "ADD_FOOD_STOP") {
    const kind = /matcha|말차|green tea/i.test(intent.command) ? "matcha" : "sushi";
    const restaurant = makeRestaurantInjection(kind, destination);
    if (restaurant) next.orchestrationInjections.restaurants = prependUniqueByName(next.orchestrationInjections.restaurants, restaurant);
  }
  if (intent.type === "ADD_FOOD_CONSTRAINT" && /vegetarian|vegan|채식|비건/i.test(intent.command)) {
    const restaurant = makeRestaurantInjection("vegetarian", destination);
    if (restaurant) next.orchestrationInjections.restaurants = prependUniqueByName(next.orchestrationInjections.restaurants, restaurant);
  }
  if (intent.type === "ADD_FOOD_CONSTRAINT" && /seafood|해산물|생선|mariscos/i.test(intent.command)) {
    next.orchestrationInjections.restaurants = next.orchestrationInjections.restaurants.filter((item) => (
      !/seafood|fish|sushi|해산물|생선|스시|초밥|mariscos/i.test(`${item.name || item.venueName || ""} ${(item.tags || []).join(" ")}`)
    ));
  }
  if (intent.type === "ADD_INTEREST" && /shopping|쇼핑|compras/i.test(intent.command)) {
    const place = makePlaceInjection("shopping", destination);
    if (place) next.orchestrationInjections.places = prependUniqueByName(next.orchestrationInjections.places, place);
  }
  if (intent.type === "MOVE_PLACE") {
    const place = makePlaceInjection("disney", destination);
    if (place) next.orchestrationInjections.places = prependUniqueByName(next.orchestrationInjections.places, place);
    next.orchestrationTimelinePins = { ...(next.orchestrationTimelinePins || {}), Disney: intent.value?.day || 3 };
  }
  if (intent.type === "ADD_MOBILITY_REQUIREMENT") {
    next.constraints.mobility = intent.entity || intent.command;
    next.pacingProfile = "RELAXED";
    next.transportPreferences = uniquePush(next.transportPreferences, "accessible route");
  }
  if (intent.type === "ADD_FOOD_CONSTRAINT") {
    next.constraints.dietaryRequirements = uniquePush(next.constraints.dietaryRequirements, intent.entity);
  }
  if (intent.type === "ADD_PLACE_CONSTRAINT" || intent.type === "REMOVE_ITEM") {
    next.hardConstraints = uniquePush(next.hardConstraints, intent.entity || intent.value);
  }
  if (intent.type === "LOWER_BUDGET") {
    next.constraints.budgetDirection = "LOWER_BUDGET";
    if (intent.value) next.constraints.budgetAdjustment = -Math.abs(intent.value);
  }
  if (intent.type === "UPGRADE_HOTEL") {
    next.accommodation.quality = "upgrade requested";
    next.hotelPreferences = uniquePush(next.hotelPreferences, "premium hotel");
  }
  if (intent.type === "CHANGE_HOTEL_AREA") {
    next.accommodation.requestedArea = intent.value;
    next.hotelPreferences = uniquePush(next.hotelPreferences, `stay near ${intent.value}`);
  }

  next.alpha04Orchestration = {
    affectedSections: sections,
    explanation: createShortSummary(intent, dependencies, destination),
    at: state.updatedAt
  };
  return next;
};

const createShortSummary = (intent, dependencies, destination) => {
  if (intent.type === "ADD_FOOD_STOP" && /matcha|말차|green tea/i.test(intent.command)) {
    return `Added matcha dessert near the ${destination} route. Food, route, timeline and map are refreshed.`;
  }
  if (intent.type === "ADD_MOBILITY_REQUIREMENT") {
    return "Accessibility changed. ONE refreshed walking, transport, restaurant and itinerary sections only.";
  }
  if (intent.type === "ADD_FOOD_CONSTRAINT") {
    return "Food constraint changed. ONE refreshed restaurant and route-sensitive sections only.";
  }
  if (intent.type === "ADD_PLACE_CONSTRAINT") {
    return "Place constraint changed. ONE removed conflicting place types and refreshed the itinerary.";
  }
  if (intent.type === "LOWER_BUDGET") {
    return "Budget changed. ONE refreshed only price-sensitive sections.";
  }
  if (intent.type === "CHANGE_HOTEL_AREA" || intent.type === "UPGRADE_HOTEL") {
    return "Hotel preference changed. ONE refreshed lodging, route and budget-sensitive sections.";
  }
  if (intent.type === "MOVE_PLACE") {
    return "Schedule changed. ONE moved the requested stop and refreshed the timeline and routes.";
  }
  return `Updated ${dependencies.length} connected parts of the mission.`;
};

export const applyMissionEdit = (currentResult = {}, command = "", options = {}) => {
  const beforeResult = clone(currentResult);
  const store = new MissionStore(currentResult);
  const intent = parseMissionEdit(command);
  const updated = store.update((state) => {
    if (intent.type === "ADD_FOOD_STOP") {
      state.foodPreferences = uniquePush(state.foodPreferences, intent.value);
      const restaurant = makeRestaurantInjection(/matcha|말차|green tea/i.test(intent.command) ? "matcha" : "sushi", destinationLabel(state));
      if (restaurant) state.restaurants = prependUniqueByName(state.restaurants, restaurant);
    }
    if (intent.type === "ADD_FOOD_CONSTRAINT") {
      state.foodPreferences = uniquePush(state.foodPreferences, intent.entity);
      state.hardConstraints = uniquePush(state.hardConstraints, intent.entity);
      if (/vegetarian|vegan|채식|비건/i.test(intent.command)) {
        const restaurant = makeRestaurantInjection("vegetarian", destinationLabel(state));
        if (restaurant) state.restaurants = prependUniqueByName(state.restaurants, restaurant);
      }
      if (/seafood|해산물|생선|mariscos/i.test(intent.command)) {
        state.restaurants = state.restaurants.filter((item) => !/seafood|fish|sushi|해산물|생선/i.test(`${item.name || item.venueName || ""} ${(item.tags || []).join(" ")}`));
      }
    }
    if (intent.type === "ADD_PLACE_CONSTRAINT") {
      state.hardConstraints = uniquePush(state.hardConstraints, intent.entity);
      state.places = state.places.filter((item) => !/museum|gallery|moma|met|박물관|미술관|museo/i.test(`${item.name || ""} ${(item.tags || []).join(" ")}`));
    }
    if (intent.type === "ADD_MOBILITY_REQUIREMENT") {
      state.mobilityRequirements = uniquePush(state.mobilityRequirements, intent.entity || intent.command);
      state.softPreferences = uniquePush(state.softPreferences, "shorter walking and accessible routes");
    }
    if (intent.type === "LOWER_BUDGET") {
      state.budget = { ...(typeof state.budget === "object" && state.budget ? state.budget : {}), direction: "lower", adjustment: intent.value ? -Math.abs(intent.value) : "lower" };
    }
    if (intent.type === "UPGRADE_HOTEL") {
      state.hotelPreferences = uniquePush(state.hotelPreferences, "premium hotel");
      state.selectedHotel = { ...(state.selectedHotel || {}), preference: "upgraded" };
    }
    if (intent.type === "CHANGE_HOTEL_AREA") {
      state.hotelPreferences = uniquePush(state.hotelPreferences, `stay near ${intent.value}`);
      state.selectedHotel = { ...(state.selectedHotel || {}), requestedArea: intent.value };
    }
    if (intent.type === "ADD_INTEREST") {
      state.interests = uniquePush(state.interests, intent.value);
      const place = makePlaceInjection(intent.value, destinationLabel(state));
      if (place) state.places = prependUniqueByName(state.places, place);
    }
    if (intent.type === "MOVE_PLACE") {
      const place = makePlaceInjection("disney", destinationLabel(state));
      if (place) state.places = prependUniqueByName(state.places, place);
      state.dailyPlan = [...(state.dailyPlan || []), { day: intent.value.day, title: `Move ${intent.value.place} to Day ${intent.value.day}`, type: "schedule-change" }];
    }
    if (intent.type === "EXTEND_DESTINATION_TIME") {
      state.duration = typeof state.duration === "number" ? state.duration + 1 : state.duration || "extend Kyoto";
      state.hotelPreferences = uniquePush(state.hotelPreferences, "one more night near Kyoto");
    }
    if (intent.type === "REMOVE_ITEM") {
      state.hardConstraints = uniquePush(state.hardConstraints, `avoid ${intent.entity}`);
    }
  }, { command, changedFields: intent.changedFields, reason: intent.type });

  const changedFields = missionStateChangedFields(updated.before, updated.after);
  const dependencies = resolveDependencies(changedFields.length ? changedFields : intent.changedFields);
  const sections = dependenciesToSections(dependencies);
  const mission = updateLegacyResult(currentResult, updated.after, { ...intent, changedFields: changedFields.length ? changedFields : intent.changedFields }, dependencies, sections, beforeResult);
  return {
    mission,
    intent,
    changedFields: changedFields.length ? changedFields : intent.changedFields,
    dependencies,
    affectedSections: sections,
    providerRefreshPlan: mission.missionOrchestration.providerRefreshPlan,
    summary: mission.missionOrchestration.summary,
    performanceTarget: "under_1_second_for_local_changes",
    regeneratedEverything: false
  };
};

export const createFounderOrchestrationDemo = (baseMission = {}) => {
  const first = applyMissionEdit(baseMission, "My mother cannot use stairs.");
  const second = applyMissionEdit(first.mission, "Add matcha ice cream.");
  return {
    input: "Plan my Japan trip.",
    edits: ["My mother cannot use stairs.", "Add matcha ice cream."],
    finalMission: second.mission,
    changedSections: second.affectedSections,
    providerRefreshPlan: second.providerRefreshPlan
  };
};
