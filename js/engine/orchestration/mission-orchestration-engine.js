import { MissionStore, MISSION_ORCHESTRATION_VERSION, missionStateChangedFields } from "./mission-store.js";
import { parseMissionEdit } from "./mission-parser.js?v=20260907-founder-revision-v4";
import { dependenciesToSections, providerRefreshPlan, resolveDependencies } from "./dependency-engine.js";
import { destinationIdentityFromMissionResult } from "../world/canonical-destination-identity.js";
import { createEntitySearchFallback } from "../world/global-entity-resolver.js";
import { finalizeModifiedMission } from "./global-modify-state-isolation.js";

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

const compactRevisionSnapshot = (value) => {
  const snapshot = clone(value);
  if (snapshot?.missionOrchestration) snapshot.missionOrchestration.previousResult = null;
  if (snapshot?.alpha15LastAddition) snapshot.alpha15LastAddition.previousResult = null;
  if (snapshot?.completeMissionExperience) {
    snapshot.completeMissionExperience.undoStack = [];
    snapshot.completeMissionExperience.redoStack = [];
  }
  return snapshot;
};

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

const numberedRevisionName = (items = [], baseName = "Additional option") => {
  const count = items.filter((item) => item?.source === "user_revision" && String(item?.name || "").startsWith(baseName)).length;
  return count ? `${baseName} ${count + 1}` : baseName;
};

const destinationLabel = (missionState = {}) => {
  const destination = missionState.destinations?.[0] || {};
  return destination.city || destination.country || "destination";
};

const makeRestaurantInjection = (kind, destinationIdentity, language = "en") => {
  const categories = { matcha: "matcha dessert café", sushi: "sushi restaurant", vegetarian: "vegetarian restaurant", additional: "another restaurant" };
  const fallback = createEntitySearchFallback({ identity: destinationIdentity, kind: "restaurant", category: categories[kind] || "restaurant", locale: language });
  return fallback ? { ...fallback, icon: kind === "matcha" ? "🍵" : kind === "sushi" ? "🍣" : kind === "vegetarian" ? "🥗" : "🍽️", tags: [kind, "live search required"], source: "generic_fallback", providerEvidence: { sourceState: "setup_required", provider: "provider-search", query: fallback.providerHandoff.query } } : null;
};

const makePlaceInjection = (kind, destinationIdentity, language = "en") => {
  const fallback = createEntitySearchFallback({ identity: destinationIdentity, kind: "place", category: kind === "shopping" ? "shopping district" : "theme park", locale: language });
  return fallback ? { ...fallback, icon: kind === "shopping" ? "🛍️" : "🎢", tags: [kind, "user requested", "live search required"], source: "generic_fallback" } : null;
};

const updateLegacyResult = (result, state, intent, dependencies, sections, beforeResult) => {
  const destination = destinationLabel(state);
  const destinationIdentity = destinationIdentityFromMissionResult(result);
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
      previousResult: compactRevisionSnapshot(beforeResult),
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
    const restaurant = makeRestaurantInjection(kind, destinationIdentity, result.language);
    if (restaurant) next.orchestrationInjections.restaurants = prependUniqueByName(next.orchestrationInjections.restaurants, restaurant);
  }
  if (intent.type === "ADD_RESTAURANT_OPTIONS") {
    const restaurant = makeRestaurantInjection("additional", destinationIdentity, result.language);
    if (restaurant) next.orchestrationInjections.restaurants = prependUniqueByName(next.orchestrationInjections.restaurants, restaurant);
  }
  if (intent.type === "ADD_SHIBUYA_PLACE") {
    next.orchestrationInjections.places = prependUniqueByName(next.orchestrationInjections.places, { name: "Shibuya nearby attraction candidate · live search needed", tags: ["Shibuya", "user requested"], source: "provider_search_ready" });
  }
  if (intent.type === "ADD_HOTEL_OPTION") {
    const name = numberedRevisionName(next.hotels || [], `Additional ${destination} hotel option`);
    next.hotels = prependUniqueByName(next.hotels || [], { name, source: "user_revision", revisionCandidate: true, sourceState: "estimated" });
  }
  if (intent.type === "ADD_LOWER_FARE_FLIGHT") {
    next.flights = prependUniqueByName(next.flights || [], { name: `Lower-fare ${destination} flight search · live price check needed`, sourceState: "estimated" });
  }
  if (intent.type === "ADD_FOOD_CONSTRAINT" && /vegetarian|vegan|채식|비건/i.test(intent.command)) {
    const restaurant = makeRestaurantInjection("vegetarian", destinationIdentity, result.language);
    if (restaurant) next.orchestrationInjections.restaurants = prependUniqueByName(next.orchestrationInjections.restaurants, restaurant);
  }
  if (intent.type === "ADD_FOOD_CONSTRAINT" && /seafood|해산물|생선|mariscos/i.test(intent.command)) {
    next.orchestrationInjections.restaurants = next.orchestrationInjections.restaurants.filter((item) => (
      !/seafood|fish|sushi|해산물|생선|스시|초밥|mariscos/i.test(`${item.name || item.venueName || ""} ${(item.tags || []).join(" ")}`)
    ));
  }
  if (intent.type === "ADD_INTEREST" && /shopping|쇼핑|compras/i.test(intent.command)) {
    const place = makePlaceInjection("shopping", destinationIdentity, result.language);
    if (place) next.orchestrationInjections.places = prependUniqueByName(next.orchestrationInjections.places, place);
  }
  if (intent.type === "MOVE_PLACE") {
    const place = makePlaceInjection("disney", destinationIdentity, result.language);
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
  if (intent.type === "ADD_RESTAURANT_OPTIONS") return `Added another ${destination} restaurant search candidate; live identity and availability still need verification.`;
  if (intent.type === "ADD_HOTEL_OPTION") return `Added another ${destination} hotel candidate; live availability still needs verification.`;
  if (intent.type === "ADD_LOWER_FARE_FLIGHT") return `Added a lower-fare ${destination} flight search candidate; live price still needs verification.`;
  if (intent.type === "ADD_SHIBUYA_PLACE") return "Added a Shibuya-area attraction search candidate; live place details still need verification.";
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
  const destinationIdentity = destinationIdentityFromMissionResult(currentResult);
  const updated = store.update((state) => {
    if (intent.type === "ADD_FOOD_STOP") {
      state.foodPreferences = uniquePush(state.foodPreferences, intent.value);
      const restaurant = makeRestaurantInjection(/matcha|말차|green tea/i.test(intent.command) ? "matcha" : "sushi", destinationIdentity, options.language);
      if (restaurant) state.restaurants = prependUniqueByName(state.restaurants, restaurant);
    }
    if (intent.type === "ADD_FOOD_CONSTRAINT") {
      state.foodPreferences = uniquePush(state.foodPreferences, intent.entity);
      state.hardConstraints = uniquePush(state.hardConstraints, intent.entity);
      if (/vegetarian|vegan|채식|비건/i.test(intent.command)) {
        const restaurant = makeRestaurantInjection("vegetarian", destinationIdentity, options.language);
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
      const place = makePlaceInjection(intent.value, destinationIdentity, options.language);
      if (place) state.places = prependUniqueByName(state.places, place);
    }
    if (intent.type === "MOVE_PLACE") {
      const place = makePlaceInjection("disney", destinationIdentity, options.language);
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
  const legacyMission = updateLegacyResult(currentResult, updated.after, { ...intent, changedFields: changedFields.length ? changedFields : intent.changedFields }, dependencies, sections, beforeResult);
  const mission = finalizeModifiedMission({ before: currentResult, after: legacyMission, explicitDestinationIdentity: options.explicitDestinationIdentity || null, changedFields: changedFields.length ? changedFields : intent.changedFields }).mission;
  const visibleIntent = intent.type !== "NOOP" && (intent.type !== "ADD_INTEREST" || /shopping|쇼핑|compras/i.test(intent.command));
  const hasMeaningfulRevision = visibleIntent && (changedFields.length > 0 || ["ADD_RESTAURANT_OPTIONS", "ADD_HOTEL_OPTION", "ADD_LOWER_FARE_FLIGHT", "ADD_SHIBUYA_PLACE"].includes(intent.type));
  return {
    mission,
    intent,
    changedFields: changedFields.length ? changedFields : intent.changedFields,
    dependencies,
    affectedSections: sections,
    providerRefreshPlan: mission.missionOrchestration.providerRefreshPlan,
    summary: mission.missionOrchestration.summary,
    hasMeaningfulRevision,
    presentationCandidateName: intent.type === "ADD_RESTAURANT_OPTIONS"
      ? mission.orchestrationInjections?.restaurants?.find((item) => ["generic_fallback", "provider", "verified_curated_override"].includes(item?.source || item?.provenance?.source))?.name || ""
      : intent.type === "ADD_HOTEL_OPTION"
        ? mission.hotels?.find((item) => item?.source === "user_revision")?.name || ""
        : "",
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
