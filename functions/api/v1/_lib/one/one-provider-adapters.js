const now=()=>new Date().toISOString();
const result=(provider,dataSource,status,{freshness="UNAVAILABLE",confidence=0,authenticationState="NOT_CONNECTED",approvalRequirement="NONE",executionState="NOT_EXECUTED",data=null}={})=>Object.freeze({provider,dataSource,status,lastCheckedAt:now(),freshness,confidence,authenticationState,approvalRequirement,executionState,data});
export const INTEGRATION_CLASSIFICATIONS=Object.freeze({openai_reasoning:"OPENAI_CAN_HANDLE",openai_web_research:"WEB_RESEARCH_SUFFICIENT",kakao_places:"LIVE_API_HELPFUL",naver_places:"LIVE_API_HELPFUL",kakao_route:"LIVE_API_REQUIRED",naver_route:"LIVE_API_REQUIRED",taxi_dispatch:"EXECUTION_PROVIDER_REQUIRED",booking:"EXECUTION_PROVIDER_REQUIRED",toss_payments:"PAYMENT_PROVIDER_REQUIRED",kakao_pay:"PAYMENT_PROVIDER_REQUIRED",naver_pay:"PAYMENT_PROVIDER_REQUIRED",stripe:"PAYMENT_PROVIDER_REQUIRED",paypal:"PAYMENT_PROVIDER_REQUIRED"});
export const providerAdapters=Object.freeze({
  search_kakao_places:async()=>result("Kakao Local","Kakao Local API","AUTHENTICATION_REQUIRED"),
  search_naver_places:async()=>result("Naver","Naver Search/Maps","AUTHENTICATION_REQUIRED"),
  get_kakao_place_details:async()=>result("Kakao Local","Kakao Local API","AUTHENTICATION_REQUIRED"),
  get_naver_place_details:async()=>result("Naver","Naver Maps","AUTHENTICATION_REQUIRED"),
  calculate_kakao_driving_route:async()=>result("Kakao Mobility","Kakao Mobility API","PARTNERSHIP_REQUIRED"),
  calculate_naver_driving_route:async()=>result("Naver Cloud","Naver Maps Directions","AUTHENTICATION_REQUIRED"),
  calculate_walking_route:async()=>result("Approved route provider","Walking route API","UNAVAILABLE"),
  calculate_transit_route:async()=>result("Authorized transit provider","Transit API","UNAVAILABLE"),
  estimate_arrival_time:async()=>result("Approved route provider","Live route response","UNAVAILABLE"),
  get_current_traffic:async()=>result("Approved traffic provider","Live traffic API","UNAVAILABLE"),
  prepare_taxi_handoff:async input=>result("Mobility handoff","Prepared handoff","PREPARED",{freshness:"CURRENT_DRAFT",confidence:.8,approvalRequirement:"EXPLICIT",executionState:"DRAFT_ONLY",data:{pickup:input?.pickup||null,destination:input?.destination||null}}),
  prepare_navigation_handoff:async input=>result("Navigation handoff","Prepared deep link","PREPARED",{freshness:"CURRENT_DRAFT",confidence:.8,approvalRequirement:"EXPLICIT",executionState:"DRAFT_ONLY",data:{destination:input?.destination||null}}),
  prepare_payment:async input=>result(input?.provider||"Disabled payment rail","Payment review","PREPARED",{freshness:"CURRENT_DRAFT",confidence:1,approvalRequirement:"FINAL_EXPLICIT",executionState:"DRAFT_ONLY",data:{currency:input?.currency||null,total:input?.total||null}}),
  confirm_payment_after_approval:async()=>result("Disabled payment rail","Payment adapter","DISABLED",{approvalRequirement:"FINAL_EXPLICIT",executionState:"BLOCKED_BY_FEATURE_FLAG"}),
  cancel_payment_after_approval:async()=>result("Disabled payment rail","Payment adapter","DISABLED",{approvalRequirement:"FINAL_EXPLICIT",executionState:"BLOCKED_BY_FEATURE_FLAG"})
});
export async function invokeProviderAdapter(name,input={}){const adapter=providerAdapters[name];return adapter?adapter(input):result("Unknown","Unregistered adapter","UNAVAILABLE");}
