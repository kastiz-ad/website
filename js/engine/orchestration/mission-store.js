export const MISSION_ORCHESTRATION_VERSION = "MISSION_ORCHESTRATION_ENGINE_V1";

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

const asArray = (value) => Array.isArray(value) ? value.filter((item) => item !== undefined && item !== null) : [];

const uniqueStrings = (items = []) => [...new Set(asArray(items).map((item) => String(item).trim()).filter(Boolean))];

const nowIso = () => new Date().toISOString();

const readDestination = (result = {}) => {
  const destination = result.destination || {};
  const label = destination.city || destination.name || destination.country || result.display?.destination || result.countryProfile?.name || result.country || "";
  return label ? [{
    id: destination.id || String(label).toLowerCase().replace(/\s+/g, "-"),
    city: destination.city || label,
    country: destination.country || result.countryProfile?.name || result.country || "",
    countryCode: destination.countryCode || result.countryProfile?.code || "",
    coordinates: destination.coordinates || null,
    source: destination.source || "mission"
  }] : [];
};

const readTravellers = (result = {}) => {
  const party = result.travelParty || result.party || {};
  const count = Number(party.travelerCount || party.count || result.travelers || result.travellerCount || 1);
  const relationship = party.relationship || party.type || (/mother|mom|엄마|어머니/i.test(`${result.rawInput || ""} ${result.mission || ""}`) ? "mother" : "");
  return Array.from({ length: Math.max(1, count || 1) }, (_, index) => ({
    id: index === 0 ? "traveller-user" : `traveller-${index + 1}`,
    role: index === 0 ? "user" : relationship || "companion",
    relationship: index === 0 ? "self" : relationship || "companion"
  }));
};

export const createMissionState = (result = {}) => {
  const existing = result.missionState || {};
  const createdAt = existing.createdAt || result.createdAt || nowIso();
  const updatedAt = existing.updatedAt || result.updatedAt || createdAt;
  return {
    id: existing.id || result.missionId || result.id || `mission-${Math.abs(String(result.rawInput || result.mission || "one").split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0))}`,
    version: Number(existing.version || 1),
    status: existing.status || result.status || "solution_prepared",
    createdAt,
    updatedAt,
    travellers: asArray(existing.travellers).length ? clone(existing.travellers) : readTravellers(result),
    origin: existing.origin || result.origin || result.departure || null,
    destinations: asArray(existing.destinations).length ? clone(existing.destinations) : readDestination(result),
    dates: existing.dates || result.schedule || {},
    duration: existing.duration || result.duration || result.tripDays || null,
    budget: existing.budget || result.budget || result.constraints?.budget || null,
    hardConstraints: uniqueStrings(existing.hardConstraints || result.hardConstraints || result.constraints?.hardConstraints),
    softPreferences: uniqueStrings(existing.softPreferences || result.softPreferences || result.preferences),
    interests: uniqueStrings(existing.interests || result.interests || result.experiences),
    foodPreferences: uniqueStrings(existing.foodPreferences || result.foodPreferences || result.constraints?.dietaryRequirements),
    mobilityRequirements: uniqueStrings(existing.mobilityRequirements || result.mobilityRequirements || (result.constraints?.mobility ? [result.constraints.mobility] : [])),
    transportPreferences: uniqueStrings(existing.transportPreferences || result.transportPreferences),
    hotelPreferences: uniqueStrings(existing.hotelPreferences || result.hotelPreferences || (result.accommodation?.requestedArea ? [result.accommodation.requestedArea] : [])),
    selectedFlight: existing.selectedFlight ?? result.selectedFlight ?? null,
    selectedHotel: existing.selectedHotel ?? result.selectedHotel ?? null,
    selectedTransport: existing.selectedTransport ?? result.selectedTransport ?? null,
    dailyPlan: asArray(existing.dailyPlan).length ? clone(existing.dailyPlan) : clone(result.dailyPlan || result.timeline || []),
    places: asArray(existing.places).length ? clone(existing.places) : clone(result.places || []),
    restaurants: asArray(existing.restaurants).length ? clone(existing.restaurants) : clone(result.restaurants || []),
    providerResults: asArray(existing.providerResults).length ? clone(existing.providerResults) : clone(result.providerResults || result.providers || []),
    approval: clone(existing.approval || result.approval || {}),
    reservations: clone(existing.reservations || result.reservations || {}),
    changeHistory: asArray(existing.changeHistory).length ? clone(existing.changeHistory) : clone(result.changeHistory || result.revisionHistory || [])
  };
};

export class MissionStore {
  constructor(result = {}) {
    this.state = createMissionState(result);
  }

  read() {
    return clone(this.state);
  }

  update(mutator, meta = {}) {
    const before = this.read();
    const next = this.read();
    mutator(next);
    next.version = Number(before.version || 1) + 1;
    next.updatedAt = nowIso();
    next.changeHistory = asArray(next.changeHistory);
    next.changeHistory.push({
      id: meta.id || `change-${Date.now()}`,
      at: next.updatedAt,
      command: meta.command || "",
      changedFields: asArray(meta.changedFields),
      affectedSections: asArray(meta.affectedSections),
      reason: meta.reason || ""
    });
    this.state = next;
    return { before, after: this.read() };
  }
}

export const missionStateChangedFields = (before = {}, after = {}) => {
  const changed = [];
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changed.push(key);
  }
  return changed.filter((key) => !["updatedAt", "version", "changeHistory"].includes(key));
};

