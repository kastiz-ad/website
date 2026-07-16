import assert from "node:assert/strict";
import { BaseConnector } from "../js/providers/connectors/base-connector.js";
import { ACCESS_LEVEL, CONNECTOR_STATUS } from "../js/providers/connector-contract.js";
import { providerRegistry, ProviderRegistry } from "../js/providers/provider-registry.js";
import { CapabilityRouter } from "../js/providers/capability-router.js";
import { createPublicConnector } from "../js/providers/connectors/public-connectors.js";
import { PROVIDER_DEFINITIONS } from "../js/providers/catalog/provider-definitions.js";
import { MISSION_PACKS } from "../js/providers/packs/mission-packs.js";
import { SUPPORTED_COUNTRIES } from "../js/providers/catalog/countries.js";
import { createMission } from "../js/engine/mission-creation.js";

assert.equal(PROVIDER_DEFINITIONS.length,31);
assert.equal(providerRegistry.list().length,31);
for(const connector of providerRegistry.list())for(const method of ["search","compare","availability","estimate","reserve","purchase","cancel","status","health","capabilities"])assert.equal(typeof connector[method],"function",`${connector.definition.id}.${method} must exist`);
assert.equal(SUPPORTED_COUNTRIES.length,16);
assert.ok(MISSION_PACKS.travel.capabilities.includes("flight.search"));
assert.ok(createMission("Plan my Japan trip").requestedCapabilities.includes("weather.forecast"));

const weather=createPublicConnector("open_meteo");
const live=await weather.search({capability:"weather.forecast",latitude:35.6,longitude:139.6,fetchImpl:async()=>({ok:true,json:async()=>({daily:{time:["2026-07-16"],temperature_2m_min:[20],temperature_2m_max:[29],precipitation_probability_max:[10],relative_humidity_2m_max:[68]}})})});
assert.equal(live.status,CONNECTOR_STATUS.OK);
assert.equal(live.live,true);

const geocoder=createPublicConnector("open_meteo_geocoding");
const geocoded=await geocoder.search({capability:"location.geocode",query:"Madagascar",language:"en",fetchImpl:async()=>({ok:true,json:async()=>({results:[{name:"Madagascar",country:"Madagascar",country_code:"MG",admin1:"",latitude:-18.7,longitude:46.8}]})})});
assert.equal(geocoded.status,CONNECTOR_STATUS.OK);
assert.equal(geocoded.data[0].countryCode,"MG");

const overpass=createPublicConnector("openstreetmap_overpass");
const places=await overpass.search({capability:"accommodation.public_places",latitude:35.6,longitude:139.6,fetchImpl:async()=>({ok:true,json:async()=>({elements:[{lat:35.6,lon:139.6,tags:{name:"Test Hotel",tourism:"hotel"}}]})})});
assert.equal(places.status,CONNECTOR_STATUS.OK);
assert.equal(places.data[0].kind,"hotel");

const advice=createPublicConnector("govuk_travel_advice");
const advisory=await advice.search({capability:"travel.advisory",slug:"madagascar",fetchImpl:async()=>({ok:true,json:async()=>({title:"Madagascar travel advice",description:"Official guidance",base_path:"/foreign-travel-advice/madagascar"})})});
assert.equal(advisory.status,CONNECTOR_STATUS.OK);
assert.equal(advisory.data[0].url,"https://www.gov.uk/foreign-travel-advice/madagascar");

assert.equal((await providerRegistry.get("korea_tourism").search({capability:"tourism.search"})).status,CONNECTOR_STATUS.REQUIRES_KEY);
assert.equal((await providerRegistry.get("us_national_parks").search({capability:"tourism.search"})).status,CONNECTOR_STATUS.REQUIRES_KEY);
assert.equal((await providerRegistry.get("naver_shopping").search({capability:"product.search"})).status,CONNECTOR_STATUS.REQUIRES_KEY);
assert.equal((await providerRegistry.get("naver_maps").search({capability:"transport.directions"})).status,CONNECTOR_STATUS.REQUIRES_KEY);
assert.equal((await providerRegistry.get("naver_local").search({capability:"restaurant.search"})).status,CONNECTOR_STATUS.REQUIRES_KEY);
assert.equal((await providerRegistry.get("naver_booking").reserve({capability:"restaurant.reserve"})).status,CONNECTOR_STATUS.APPROVAL_REQUIRED);

const booking=providerRegistry.get("booking_com");
const placeholder=await booking.search({capability:"accommodation.search"});
assert.equal(placeholder.status,CONNECTOR_STATUS.REQUIRES_PARTNERSHIP);

const blocked=await booking.reserve({capability:"accommodation.reserve",approval:{approved:false}});
assert.equal(blocked.status,CONNECTOR_STATUS.APPROVAL_REQUIRED);
const stillDisabled=await booking.reserve({capability:"accommodation.reserve",approval:{approved:true}});
assert.equal(stillDisabled.status,CONNECTOR_STATUS.EXECUTION_DISABLED);

const fallbackRouter=new CapabilityRouter(new ProviderRegistry(PROVIDER_DEFINITIONS.filter(item=>item.id==="booking_com")));
const fallback=await fallbackRouter.route({capability:"accommodation.search"});
assert.equal(fallback.status,CONNECTOR_STATUS.FALLBACK);
assert.equal(fallback.simulated,true);

const unsupported=new BaseConnector({id:"test",access:ACCESS_LEVEL.PLACEHOLDER,capabilities:[],actions:[]});
assert.equal((await unsupported.purchase({approval:{approved:true}})).status,CONNECTOR_STATUS.UNSUPPORTED);
console.log("provider network checks passed");
