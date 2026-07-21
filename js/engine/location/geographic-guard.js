const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase();

const coordinate = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

const distanceKm = (first, second) => {
  const aLat = coordinate(first?.latitude);
  const aLon = coordinate(first?.longitude);
  const bLat = coordinate(second?.latitude);
  const bLon = coordinate(second?.longitude);
  if ([aLat, aLon, bLat, bLon].some((value) => value === null)) return null;
  const radians = (degrees) => degrees * Math.PI / 180;
  const deltaLat = radians(bLat - aLat);
  const deltaLon = radians(bLon - aLon);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(aLat)) * Math.cos(radians(bLat)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export const createGeographicScope = (mission, center = null) => Object.freeze({
  country: String(mission?.destination?.country || mission?.countryProfile?.name || "").trim(),
  countryCode: String(mission?.destination?.countryCode || mission?.countryProfile?.code || mission?.country || "").trim().toUpperCase(),
  state: String(mission?.destination?.state || "").trim(),
  city: String(mission?.destination?.city || mission?.countryProfile?.capital || "").trim(),
  latitude: coordinate(center?.latitude ?? mission?.destination?.latitude),
  longitude: coordinate(center?.longitude ?? mission?.destination?.longitude),
  radiusKm: 30,
  strict: true
});

export const stampGeographicEvidence = (item, scope, coordinates = null) => ({
  ...item,
  city: scope.city,
  country: scope.country,
  countryCode: scope.countryCode,
  latitude: coordinate(coordinates?.latitude),
  longitude: coordinate(coordinates?.longitude),
  geographicVerified: true
});

export const recommendationMatchesScope = (item, scope) => {
  if (!scope?.strict || !scope.city) return false;
  if (item?.countryCode && scope.countryCode && String(item.countryCode).toUpperCase() !== scope.countryCode) return false;
  if (item?.country && scope.country && normalize(item.country) !== normalize(scope.country)) return false;
  if (item?.city && normalize(item.city) !== normalize(scope.city)) return false;
  const distance = distanceKm(scope, item);
  if (distance !== null && distance > scope.radiusKm) return false;
  return Boolean(item?.geographicVerified && (item?.city || distance !== null));
};

export const enforceGeographicScope = (items, scope) => (items || []).filter((item) => recommendationMatchesScope(item, scope));
