import { ACCESS_LEVEL } from "../connector-contract.js";

const read=["search","compare","availability","estimate","status","health","capabilities"];
const full=[...read,"reserve","purchase","cancel"];
const d=(id,name,access,capabilities,actions=read,extra={})=>Object.freeze({id,name,access,capabilities,actions,integration:access===ACCESS_LEVEL.PUBLIC_FREE?"live_public_api":"placeholder",countries:["*"],...extra});

export const PROVIDER_DEFINITIONS=Object.freeze([
  d("open_meteo","Open-Meteo",ACCESS_LEVEL.PUBLIC_FREE,["weather.forecast"],read,{attribution:"Weather data by Open-Meteo; source models require attribution."}),
  d("open_meteo_geocoding","Open-Meteo Geocoding",ACCESS_LEVEL.PUBLIC_FREE,["location.geocode"],read,{attribution:"Location data by GeoNames via Open-Meteo."}),
  d("openstreetmap_nominatim","OpenStreetMap Nominatim",ACCESS_LEVEL.PUBLIC_FREE,["location.geocode","transport.place_search"],read,{attribution:"© OpenStreetMap contributors",usageLimit:"Public endpoint: maximum 1 request/second; cache and identify requests."}),
  d("openstreetmap_overpass","OpenStreetMap Overpass",ACCESS_LEVEL.PUBLIC_FREE,["accommodation.public_places","restaurant.public_places","transport.public_places"],read,{attribution:"© OpenStreetMap contributors",usageLimit:"Prototype-only public endpoint; bounded, cached queries only."}),
  d("frankfurter","Frankfurter",ACCESS_LEVEL.PUBLIC_FREE,["currency.exchange"],read),
  d("exchange_rate_open","ExchangeRate-API Open Access",ACCESS_LEVEL.PUBLIC_FREE,["currency.exchange"],read),
  d("countries_now","CountriesNow",ACCESS_LEVEL.PUBLIC_FREE,["country.information"],read),
  d("wikipedia","Wikipedia",ACCESS_LEVEL.PUBLIC_FREE,["destination.information","knowledge.summary"],read,{attribution:"Wikipedia contributors"}),
  d("govuk_travel_advice","GOV.UK Foreign Travel Advice",ACCESS_LEVEL.PUBLIC_FREE,["travel.advisory"],read,{attribution:"UK Foreign, Commonwealth & Development Office · Open Government Licence"}),
  d("korea_tourism","Korea Tourism Organization TourAPI",ACCESS_LEVEL.API_KEY,["tourism.search","accommodation.public_information","festival.search","accessibility.information"],read,{placeholderMessage:"Free data.go.kr service key required; credentials must be stored server-side."}),
  d("us_national_parks","U.S. National Park Service",ACCESS_LEVEL.API_KEY,["tourism.search","park.alerts","park.events","park.campgrounds"],read,{placeholderMessage:"Free NPS developer API key required; credentials must be stored server-side."}),
  d("booking_com","Booking.com",ACCESS_LEVEL.PARTNERSHIP,["accommodation.search","accommodation.compare","accommodation.availability","accommodation.reserve"],full,{placeholderMessage:"Managed Affiliate contract, API token and affiliate ID required."}),
  d("agoda","Agoda",ACCESS_LEVEL.PARTNERSHIP,["accommodation.search","accommodation.compare","accommodation.availability","accommodation.reserve"],full),
  d("hotels_com","Hotels.com / Expedia Rapid",ACCESS_LEVEL.PARTNERSHIP,["accommodation.search","accommodation.compare","accommodation.availability","accommodation.reserve"],full),
  d("skyscanner","Skyscanner",ACCESS_LEVEL.PARTNERSHIP,["flight.search","flight.compare","flight.availability","flight.estimate"],read),
  d("google_flights","Google Flights",ACCESS_LEVEL.ENTERPRISE,["flight.search","flight.compare"],read,{placeholderMessage:"Google Flights partner onboarding is invite-only; no consumer search API is available."}),
  d("google_places","Google Maps Places",ACCESS_LEVEL.API_KEY,["restaurant.search","restaurant.compare","location.place_search"],read),
  d("catchtable","Catchtable",ACCESS_LEVEL.PARTNERSHIP,["restaurant.search","restaurant.availability","restaurant.reserve"],full),
  d("interpark","Interpark",ACCESS_LEVEL.PARTNERSHIP,["event.search","event.availability","event.purchase"],full),
  d("yes24","YES24",ACCESS_LEVEL.PARTNERSHIP,["event.search","event.availability","event.purchase"],full),
  d("melon_ticket","Melon Ticket",ACCESS_LEVEL.PARTNERSHIP,["event.search","event.availability","event.purchase"],full),
  d("cgv","CGV",ACCESS_LEVEL.PARTNERSHIP,["movie.search","movie.availability","movie.reserve","movie.purchase"],full),
  d("lotte_cinema","Lotte Cinema",ACCESS_LEVEL.PARTNERSHIP,["movie.search","movie.availability","movie.reserve","movie.purchase"],full),
  d("megabox","Megabox",ACCESS_LEVEL.PARTNERSHIP,["movie.search","movie.availability","movie.reserve","movie.purchase"],full),
  d("coupang","Coupang",ACCESS_LEVEL.PARTNERSHIP,["product.search","product.compare","product.availability","product.purchase"],full,{placeholderMessage:"Public seller APIs do not provide a general consumer shopping-search connector."}),
  d("naver_shopping","Naver Shopping Search",ACCESS_LEVEL.API_KEY,["product.search","product.compare","product.estimate"],read,{placeholderMessage:"Application registration and server-side client ID/secret are required."}),
  d("soomgo","Soomgo",ACCESS_LEVEL.PARTNERSHIP,["service.search","service.compare","service.availability","tutor.search"],read),
  d("online_tutoring","Online Tutoring",ACCESS_LEVEL.PLACEHOLDER,["tutor.search","tutor.compare","tutor.availability","tutor.estimate"],read)
]);
export const getProviderDefinition=id=>PROVIDER_DEFINITIONS.find(provider=>provider.id===id);
