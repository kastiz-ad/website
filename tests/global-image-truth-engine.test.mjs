import test from "node:test";
import assert from "node:assert/strict";
import { IMAGE_SCOPES, imageCacheKey, preserveResolvedImage, resolveEntityImage } from "../js/engine/world/global-image-truth-engine.js";

const destination = (key, countryCode, latitude, longitude) => ({ key, countryCode, latitude, longitude });
const entity = (name, destinationIdentity, extras = {}) => ({ id: `entity:${name}`, name, namedEntity: true, destinationIdentity, destinationKey: destinationIdentity.key, ...extras });

test("exact provider entity identity wins", () => {
  const paris = destination("city:FR:ile-de-france:paris", "FR", 48.8566, 2.3522);
  const eiffel = entity("Eiffel Tower", paris, { provenance: { providerId: "osm-1" }, latitude: 48.8584, longitude: 2.2945 });
  const resolved = resolveEntityImage({ entity: eiffel, candidates: [{ id: "img-1", url: "eiffel.jpg", entityId: "osm-1", countryCode: "FR", latitude: 48.8584, longitude: 2.2945, source: "Wikimedia Commons" }] });
  assert.equal(resolved.imageScope, IMAGE_SCOPES.exactEntity);
  assert.equal(resolved.image.url, "eiffel.jpg");
});

test("Paris France imagery is rejected for Paris Texas", () => {
  const texas = destination("city:US:texas:paris", "US", 33.6609, -95.5555);
  const place = entity("Downtown Paris", texas);
  assert.equal(resolveEntityImage({ entity: place, candidates: [{ url: "eiffel.jpg", entityName: "Eiffel Tower", destinationKey: "city:FR:ile-de-france:paris", countryCode: "FR" }] }).imageScope, IMAGE_SCOPES.none);
});

test("Cartagena Spain and Osaka candidates cannot cross destination boundaries", () => {
  const colombia = destination("city:CO:bolivar:cartagena", "CO", 10.391, -75.479);
  assert.equal(resolveEntityImage({ entity: entity("Old City", colombia), candidates: [{ url: "spain.jpg", entityName: "Old City", countryCode: "ES" }] }).image, null);
  const tokyo = destination("city:JP:_:tokyo", "JP", 35.6762, 139.6503);
  assert.equal(resolveEntityImage({ entity: entity("Meiji Shrine", tokyo), candidates: [{ url: "osaka.jpg", entityName: "Meiji Shrine", latitude: 34.6937, longitude: 135.5023 }] }).image, null);
});

test("generic food cannot masquerade as a named restaurant", () => {
  const tokyo = destination("city:JP:_:tokyo", "JP", 35.6762, 139.6503);
  const restaurant = entity("Named Restaurant", tokyo, { kind: "restaurant" });
  assert.equal(resolveEntityImage({ entity: restaurant, candidates: [{ url: "sushi.jpg", category: "restaurant", destinationKey: tokyo.key }] }).imageScope, IMAGE_SCOPES.none);
});

test("destination and category context are allowed only for generic entities", () => {
  const medellin = destination("city:CO:antioquia:medellin", "CO", 6.2442, -75.5812);
  const generic = { id: "search-food", name: "Search local food", namedEntity: false, kind: "restaurant", category: "restaurant", destinationIdentity: medellin, destinationKey: medellin.key };
  assert.equal(resolveEntityImage({ entity: generic, candidates: [{ url: "context.jpg", category: "restaurant", destinationKey: medellin.key }] }).imageScope, IMAGE_SCOPES.categoryContext);
});

test("neighborhood and nearby excursion use their actual identity", () => {
  const paris = destination("city:FR:ile-de-france:paris", "FR", 48.8566, 2.3522);
  const montmartre = entity("Montmartre", paris, { entityType: "NEIGHBORHOOD" });
  assert.equal(resolveEntityImage({ entity: montmartre, candidates: [{ url: "montmartre.jpg", locality: "Montmartre", destinationKey: paris.key }] }).imageScope, IMAGE_SCOPES.localArea);
  const versailles = entity("Palace of Versailles", paris, { entityType: "NEARBY_EXCURSION", latitude: 48.8049, longitude: 2.1204 });
  assert.equal(resolveEntityImage({ entity: versailles, candidates: [{ url: "versailles.jpg", entityName: "Palace of Versailles", latitude: 48.8049, longitude: 2.1204 }] }).imageScope, IMAGE_SCOPES.exactEntity);
});

test("cache and restore remain isolated by destination entity and scope", () => {
  const first = imageCacheKey({ destinationKey: "city:FR:_:paris", entityKey: "eiffel", scope: IMAGE_SCOPES.exactEntity });
  const second = imageCacheKey({ destinationKey: "city:US:texas:paris", entityKey: "eiffel", scope: IMAGE_SCOPES.exactEntity });
  assert.notEqual(first, second);
  const restored = preserveResolvedImage({ id: "eiffel", destinationKey: "city:FR:_:paris", image: { url: "eiffel.jpg", imageScope: IMAGE_SCOPES.exactEntity } });
  assert.equal(restored.image.url, "eiffel.jpg");
  assert.match(restored.imageCacheKey, /city:FR/);
});

test("sparse and random destinations prefer no image", () => {
  const samples = ["Tirana", "Arequipa", "Gaborone", "Kaohsiung", "Porto Alegre", "Ohrid", "Pokhara", "Nouméa", "Muscat", "Kigali"];
  for (const city of samples) {
    const place = destination(`city:XX:_#:${city.toLowerCase()}`, "", 0, 0);
    assert.equal(resolveEntityImage({ entity: entity(`${city} local search`, place), candidates: [] }).imageScope, IMAGE_SCOPES.none, city);
  }
});
