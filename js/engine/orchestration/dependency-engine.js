export const DEPENDENCY_MAP = Object.freeze({
  travellers: ["budget", "dailyPlan", "hotels", "transport", "approval"],
  destinations: ["dailyPlan", "places", "restaurants", "hotels", "transport", "routes", "map", "budget", "approval"],
  dates: ["dailyPlan", "flights", "hotels", "providerResults", "budget", "approval"],
  duration: ["dailyPlan", "hotels", "budget", "places", "restaurants", "approval"],
  budget: ["budget", "flights", "hotels", "restaurants", "approval"],
  hardConstraints: ["dailyPlan", "places", "restaurants", "routes", "map", "approval"],
  softPreferences: ["dailyPlan", "places", "restaurants"],
  interests: ["dailyPlan", "places", "map"],
  foodPreferences: ["restaurants", "dailyPlan", "routes", "map"],
  mobilityRequirements: ["dailyPlan", "places", "restaurants", "transport", "routes", "map", "approval"],
  transportPreferences: ["transport", "routes", "map", "dailyPlan"],
  hotelPreferences: ["hotels", "transport", "routes", "dailyPlan", "budget", "approval"],
  selectedFlight: ["flights", "transport", "dailyPlan", "approval"],
  selectedHotel: ["hotels", "transport", "routes", "dailyPlan", "budget", "approval"],
  selectedTransport: ["transport", "routes", "map", "dailyPlan", "approval"],
  dailyPlan: ["dailyPlan", "routes", "map", "approval"],
  places: ["places", "dailyPlan", "routes", "map"],
  restaurants: ["restaurants", "dailyPlan", "routes", "map"],
  providerResults: ["providerResults", "map", "routes"]
});

const SECTION_ALIASES = Object.freeze({
  dailyPlan: "timeline",
  transport: "preparation",
  routes: "preparation",
  map: "journey",
  providerResults: "preparation",
  selectedHotel: "hotels",
  selectedFlight: "flights",
  selectedTransport: "preparation"
});

export const resolveDependencies = (changedFields = []) => {
  const affected = new Set();
  for (const field of changedFields) {
    for (const dependency of DEPENDENCY_MAP[field] || [field]) affected.add(dependency);
  }
  return [...affected];
};

export const dependenciesToSections = (dependencies = []) => {
  const sections = new Set();
  for (const dependency of dependencies) {
    sections.add(SECTION_ALIASES[dependency] || dependency);
  }
  return [...sections].filter((section) => ["journey", "restaurants", "places", "timeline", "flights", "hotels", "preparation", "insights", "approval", "budget"].includes(section));
};

export const providerRefreshPlan = (dependencies = []) => {
  const set = new Set(dependencies);
  const requests = [];
  if (set.has("restaurants")) requests.push({ providerType: "places", scope: "nearby_food_only", reason: "food preference changed" });
  if (set.has("places")) requests.push({ providerType: "places", scope: "destination_attractions_only", reason: "place preference changed" });
  if (set.has("routes")) requests.push({ providerType: "routes", scope: "changed_itinerary_segments_only", reason: "route-affecting mission edit" });
  if (set.has("map")) requests.push({ providerType: "map", scope: "changed_markers_only", reason: "visible map pins changed" });
  if (set.has("hotels")) requests.push({ providerType: "places", scope: "lodging_area_only", reason: "hotel preference changed" });
  return requests;
};

