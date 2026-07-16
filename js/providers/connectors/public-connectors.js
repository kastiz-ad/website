import { PublicApiConnector } from "./public-api-connector.js";
import { getProviderDefinition } from "../catalog/provider-definitions.js";

const enc=encodeURIComponent;
const handlers=Object.freeze({
  open_meteo:{
    search:request=>({url:`https://api.open-meteo.com/v1/forecast?latitude=${enc(request.latitude)}&longitude=${enc(request.longitude)}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_max&timezone=auto${request.startDate&&request.endDate?`&start_date=${enc(request.startDate)}&end_date=${enc(request.endDate)}`:""}`,transform:data=>(data?.daily?.time||[]).slice(0,16).map((date,index)=>({date,min:data.daily.temperature_2m_min[index],max:data.daily.temperature_2m_max[index],precipitation:data.daily.precipitation_probability_max[index],humidity:data.daily.relative_humidity_2m_max?.[index]}))})
  },
  openstreetmap_nominatim:{
    search:request=>({url:`https://nominatim.openstreetmap.org/search?q=${enc(request.query||"")}&format=json&limit=${Math.min(5,request.limit||3)}`,cacheTtl:86400000,transform:data=>(Array.isArray(data)?data:[]).map(item=>({label:item.display_name,latitude:Number(item.lat),longitude:Number(item.lon),type:item.type}))})
  },
  frankfurter:{
    search:request=>({url:`https://api.frankfurter.dev/v2/rate/${enc(request.from||"KRW")}/${enc(request.to||"USD")}`,transform:data=>[{from:data.base||request.from,to:data.quote||request.to,rate:Number(data.rate),date:data.date}]})
  },
  countries_now:{
    search:request=>({url:`https://countriesnow.space/api/v0.1/countries/capital/q?country=${enc(request.countryName||request.countryCode||"South Korea")}`,cacheTtl:86400000,transform:payload=>payload?.data?[{name:payload.data.name,capital:payload.data.capital,code:payload.data.iso2}]:[]})
  },
  wikipedia:{
    search:request=>({url:`https://en.wikipedia.org/api/rest_v1/page/summary/${enc(request.topic||"")}`,cacheTtl:86400000,transform:data=>[{title:data.title,summary:data.extract,url:data.content_urls?.desktop?.page}]})
  }
});

export const createPublicConnector=id=>new PublicApiConnector(getProviderDefinition(id),handlers[id]);
export const PUBLIC_CONNECTOR_IDS=Object.freeze(Object.keys(handlers));
