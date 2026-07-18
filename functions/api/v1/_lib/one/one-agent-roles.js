export const PROFESSIONAL_ROLES=Object.freeze(["TRAVEL_PLANNER","EXECUTIVE_ASSISTANT","PERSONAL_SECRETARY","CHIEF_OF_STAFF","RESEARCHER","WRITER","EDITOR","PROGRAMMER","TECHNICAL_ADVISOR","PROJECT_MANAGER","RESTAURANT_PLANNER","EVENT_COORDINATOR","FAMILY_COORDINATOR","EDUCATION_COORDINATOR","HEALTHCARE_LOGISTICS_ASSISTANT","SHOPPING_ASSISTANT","PROVIDER_RESEARCHER","TRANSPORT_COORDINATOR","BUSINESS_OPERATIONS_ASSISTANT","ADMINISTRATIVE_ASSISTANT"]);
const rules=[
  [/travel|trip|flight|hotel|여행|출장/i,["TRAVEL_PLANNER","TRANSPORT_COORDINATOR","RESEARCHER"]],
  [/date|girlfriend|boyfriend|데이트|여친|남친/i,["EVENT_COORDINATOR","RESTAURANT_PLANNER","TRANSPORT_COORDINATOR"]],
  [/supplier|business|meeting|inspection|사업|공급|회의/i,["EXECUTIVE_ASSISTANT","BUSINESS_OPERATIONS_ASSISTANT","WRITER"]],
  [/presentation|slides|script|발표|프레젠테이션/i,["WRITER","EDITOR","PROJECT_MANAGER"]],
  [/tutor|teacher|lesson|과외|튜터|선생/i,["EDUCATION_COORDINATOR","PROVIDER_RESEARCHER"]],
  [/hospital|clinic|doctor|병원|의원|진료/i,["HEALTHCARE_LOGISTICS_ASSISTANT","TRANSPORT_COORDINATOR"]],
  [/family|daughter|son|가족|딸|아들/i,["FAMILY_COORDINATOR"]],
  [/code|program|repository|bug|코드|프로그램|버그/i,["PROGRAMMER","TECHNICAL_ADVISOR"]]
];
export function selectRoles(request){const selected=new Set(["PERSONAL_SECRETARY"]);for(const[pattern,roles]of rules)if(pattern.test(request))roles.forEach(role=>selected.add(role));return[...selected].slice(0,8).map(role=>({role,reason:`Required to prepare the ${role.toLowerCase().replaceAll("_"," ")} portion of this outcome.`,tasks:[]}));}
