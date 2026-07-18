import{CORE_AGENT_DEMOS}from"./one-demo-missions.js";
const map=[[/date|girlfriend|boyfriend|데이트|여친|남친/i,"jamsil_date"],[/tokyo|japan|도쿄|일본/i,"tokyo_family_trip"],[/business trip|출장/i,"business_trip"],[/family dinner|가족.*(저녁|식사)/i,"family_dinner"],[/supplier|inspection|공급|검사/i,"supplier_email"],[/presentation|slides|발표|프레젠테이션/i,"presentation"],[/tutor|teacher|과외|튜터|선생/i,"tutor"],[/hospital|clinic|병원|진료/i,"hospital_logistics"]];
export function chooseDemo(request){return CORE_AGENT_DEMOS[map.find(([pattern])=>pattern.test(request))?.[1]||"presentation"];}
export function decomposeMission(request){return structuredClone(chooseDemo(request));}
