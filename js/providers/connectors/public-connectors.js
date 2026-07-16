import { PublicApiConnector } from "./public-api-connector.js";
import { getProviderDefinition } from "../catalog/provider-definitions.js";

const enc=encodeURIComponent;
const handlers=Object.freeze({
  open_meteo:{
    search:request=>({url:`https://api.open-meteo.com/v1/forecast?latitude=${enc(request.latitude)}&longitude=${enc(request.longitude)}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_max&timezone=auto${request.startDate&&request.endDate?`&start_date=${enc(request.startDate)}&end_date=${enc(request.endDate)}`:""}`,transform:data=>(data?.daily?.time||[]).slice(0,16).map((date,index)=>({date,min:data.daily.temperature_2m_min[index],max:data.daily.temperature_2m_max[index],precipitation:data.daily.precipitation_probability_max[index],humidity:data.daily.relative_humidity_2m_max?.[index]}))})
  },
  open_meteo_geocoding:{
    search:request=>({url:`https://geocoding-api.open-meteo.com/v1/search?name=${enc(request.query||"")}&count=${Math.min(10,request.limit||5)}&language=${enc(request.language||"en")}&format=json`,cacheTtl:86400000,transform:data=>(data?.results||[]).map(item=>({label:[item.name,item.admin1,item.country].filter(Boolean).join(", "),city:item.name,state:item.admin1||"",country:item.country||"",countryCode:item.country_code||"",latitude:Number(item.latitude),longitude:Number(item.longitude),type:item.feature_code||""}))})
  },
  openstreetmap_nominatim:{
    search:request=>({url:`https://nominatim.openstreetmap.org/search?q=${enc(request.query||"")}&format=json&limit=${Math.min(5,request.limit||3)}`,cacheTtl:86400000,transform:data=>(Array.isArray(data)?data:[]).map(item=>({label:item.display_name,latitude:Number(item.lat),longitude:Number(item.lon),type:item.type}))})
  },
  openstreetmap_overpass:{
    search:request=>{
      const radius=Math.min(20000,Math.max(1000,Number(request.radius)||12000));
      const query=`[out:json][timeout:15];(nwr(around:${radius},${Number(request.latitude)},${Number(request.longitude)})[tourism~"hotel|hostel|guest_house|motel|apartment"];nwr(around:${radius},${Number(request.latitude)},${Number(request.longitude)})[amenity~"restaurant|cafe|fast_food"];nwr(around:${radius},${Number(request.latitude)},${Number(request.longitude)})[public_transport];);out center 60;`;
      return {url:`https://overpass-api.de/api/interpreter?data=${enc(query)}`,timeout:12000,cacheTtl:86400000,retries:0,transform:data=>(data?.elements||[]).filter(item=>item.tags?.name).map(item=>({name:item.tags.name,nameEn:item.tags["name:en"]||"",nameKo:item.tags["name:ko"]||"",kind:item.tags.tourism?"hotel":item.tags.amenity&&/restaurant|cafe|fast_food/.test(item.tags.amenity)?"restaurant":"transport",type:item.tags.tourism||item.tags.amenity||item.tags.public_transport||"place",cuisine:item.tags.cuisine||"",stars:item.tags.stars||"",website:item.tags.website||"",latitude:Number(item.lat??item.center?.lat),longitude:Number(item.lon??item.center?.lon)}))};
    }
  },
  frankfurter:{
    search:request=>({url:`https://api.frankfurter.dev/v2/rate/${enc(request.from||"KRW")}/${enc(request.to||"USD")}`,transform:data=>[{from:data.base||request.from,to:data.quote||request.to,rate:Number(data.rate),date:data.date}]})
  },
  exchange_rate_open:{
    search:request=>({url:`https://open.er-api.com/v6/latest/${enc(request.from||"KRW")}`,transform:data=>{const to=request.to||"USD";return [{from:data.base_code||request.from,to,rate:Number(data?.rates?.[to]),date:data.time_last_update_utc||""}]}})
  },
  countries_now:{
    search:request=>({url:`https://countriesnow.space/api/v0.1/countries/capital/q?country=${enc(request.countryName||request.countryCode||"South Korea")}`,cacheTtl:86400000,transform:payload=>payload?.data?[{name:payload.data.name,capital:payload.data.capital,code:payload.data.iso2}]:[]})
  },
  wikipedia:{
    search:request=>({url:`https://en.wikipedia.org/api/rest_v1/page/summary/${enc(request.topic||"")}`,cacheTtl:86400000,transform:data=>[{title:data.title,summary:data.extract,url:data.content_urls?.desktop?.page}]})
  },
  govuk_travel_advice:{
    search:request=>({url:`https://www.gov.uk/api/content/foreign-travel-advice/${enc(request.slug||request.country||"")}`,cacheTtl:3600000,transform:data=>[{title:data.title,summary:data.description||"",updatedAt:data.public_updated_at||data.updated_at||"",url:`https://www.gov.uk${data.base_path||`/foreign-travel-advice/${request.slug||request.country||""}`}`}]})
  }
});

export const createPublicConnector=id=>new PublicApiConnector(getProviderDefinition(id),handlers[id]);
export const PUBLIC_CONNECTOR_IDS=Object.freeze(Object.keys(handlers));
