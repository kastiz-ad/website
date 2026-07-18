import { buildExperienceContext, buildExperiencePack, ONE_PICK } from "./experience-engine-v3.js";

export const PIPELINE=Object.freeze(["mission","classifier","context","experience","provider","live-intelligence","one-pick","preparation","approval","receipt"]);
export const PROVIDER_TYPES=Object.freeze(["education","healthcare","restaurant","accommodation","transportation","entertainment","professional-service","government","pet-care","home-services","beauty","sports","shopping","repair","photography","legal","finance","events","travel","childcare","senior-care","automotive"]);

const RULES=[
  ["education",/tutor|lesson|teacher|spanish|piano|driving instructor|과외|튜터|수업|스페인어|피아노|운전 강사/i],
  ["healthcare",/hospital|doctor|dentist|dermatolog|clinic|orthopedic|병원|의사|치과|피부과|의원|정형외과/i],
  ["restaurant",/restaurant|korean bbq|dinner|lunch|food|레스토랑|식당|고기|저녁|점심|맛집/i],
  ["accommodation",/hotel|accommodation|stay|호텔|숙소|숙박/i],
  ["transportation",/flight|taxi|train|subway|bus|항공|택시|기차|지하철|버스/i],
  ["entertainment",/concert|musical|movie|theater|ticket|festival|콘서트|뮤지컬|영화|공연|티켓|축제/i],
  ["beauty",/hair salon|haircut|stylist|beauty|미용실|헤어|커트|뷰티/i],
  ["pet-care",/dog grooming|pet grooming|veterinary|pet|애견 미용|반려동물|동물병원/i],
  ["home-services",/cleaner|cleaning|moving company|babysitter|senior care|청소|이사|베이비시터|돌봄/i],
  ["repair",/repair|washing machine|appliance|수리|세탁기|가전/i],
  ["photography",/photographer|photo studio|사진작가|촬영|사진관/i],
  ["legal",/lawyer|attorney|legal|변호사|법률/i],
  ["finance",/cpa|accountant|tax|financial|회계사|세무사|세금|금융/i],
  ["government",/visa|passport renewal|permit|certificate|비자|여권 갱신|허가|증명서/i],
  ["shopping",/flowers|camping equipment|buy|shop|꽃|캠핑 장비|구매|쇼핑/i],
  ["sports",/personal trainer|gym|golf|sports|트레이너|헬스|골프|스포츠/i],
  ["events",/wedding|event|celebration|웨딩|결혼식|행사/i],
  ["travel",/trip|travel|vacation|business trip|family weekend|여행|출장|휴가|가족 주말/i]
];
const KOREAN={education:"교육",healthcare:"의료",restaurant:"레스토랑",accommodation:"숙박",transportation:"교통",entertainment:"엔터테인먼트",beauty:"뷰티","pet-care":"반려동물 케어","home-services":"생활 서비스",repair:"수리",photography:"사진",legal:"법률",finance:"금융",government:"정부 서비스",shopping:"쇼핑",sports:"스포츠",events:"행사",travel:"여행","professional-service":"전문 서비스"};

export function classifyUniversalMission(value=""){
  const mission=String(value).normalize("NFKC").trim().replace(/\s+/g," ");
  const providerType=RULES.find(([,rx])=>rx.test(mission))?.[0]||"professional-service";
  return {mission,providerType,confidence:providerType==="professional-service"?"unknown":"rule-supported",categorySelectionRequired:false};
}

export function normalizeProvider(record={}){
  const type=PROVIDER_TYPES.includes(record.providerType)?record.providerType:"professional-service";
  return Object.freeze({providerId:String(record.providerId||"unknown"),providerType:type,businessName:record.businessName||"Not available",location:record.location||"Not available",operatingHours:record.operatingHours||"Not available",reservationMethod:record.reservationMethod||"Not available",availability:record.availability||"Unknown",price:record.price??null,estimatedCost:record.estimatedCost??null,cancellationPolicy:record.cancellationPolicy||"Unknown",providerTrust:record.providerTrust||"Unknown",reviewQuality:record.reviewQuality||"Unknown",languagesSupported:Array.isArray(record.languagesSupported)?record.languagesSupported:[],accessibility:record.accessibility||"Unknown",transportation:record.transportation||"Unknown",parking:record.parking||"Unknown",nearestSubway:record.nearestSubway||"Unknown",estimatedWalkingTime:record.estimatedWalkingTime||"Unknown",website:record.website||null,phone:record.phone||null,providerSource:record.providerSource||"Kastiz demo catalog",sourceFreshness:record.sourceFreshness||"2026-07-19T00:00:00Z",dataState:["live","demo","unknown","cached"].includes(record.dataState)?record.dataState:"unknown",specificFields:{...(record.specificFields||{})}});
}

export function createLiveIntelligence(input={}){
  const fields=["weather","nationalHoliday","schoolHoliday","businessHours","lastOrder","lastAdmission","parkingClose","airportStatus","flightDelay","traffic","roadClosures","transitDisruption","crowds","airQuality","sunrise","sunset","seasonality","specialEvents"];
  return Object.fromEntries(fields.map(key=>[key,input[key]?.value!=null?{value:input[key].value,state:input[key].state||"estimated",source:input[key].source||null,freshness:input[key].freshness||null}:{value:null,state:"unavailable",source:null,freshness:null}]));
}

export function buildTransitIntelligence(input={}){
  const modes=input.modes||["walking","subway","bus","taxi","driving"];
  const ranked=modes.map((mode,index)=>({mode,estimatedMinutes:input.estimates?.[mode]??null,cost:input.costs?.[mode]??null,reliability:input.reliability?.[mode]??"Unknown",evidence:input.evidence?.[mode]||"Unavailable",state:input.estimates?.[mode]!=null?"estimated":"unavailable",score:(input.scores?.[mode]??(100-index*5))})).sort((a,b)=>b.score-a.score);
  return {recommended:ranked[0],alternatives:ranked.slice(1),liveTrafficClaim:false};
}

const CHECKLISTS={
  education:["Format: online or offline","Travel time","Lesson duration","Trial lesson","Estimated monthly cost","Languages","Availability","Materials to prepare","Transportation"],
  restaurant:["Cuisine and menu highlights","Reservation method","Estimated waiting time","Nearby parking","Nearest subway","Dessert nearby","Transportation"],
  healthcare:["Department","Location and operating hours","Language support","Accessibility","Arrival recommendation","Documents to bring","Insurance notes","Transportation","Nearby pharmacy","Follow-up reminder"],
  beauty:["Available stylist","Services","Estimated duration","Price","Parking","Reservation","Nearby café"],
  legal:["Practice area","Languages","Consultation type","Availability","Estimated consultation fee","Required documents"],
  "pet-care":["Services","Estimated duration","Drop-off time","Pickup time","Nearby café"],
  accommodation:["Dates","Room requirements","Estimated total","Cancellation","Transport","Check-in requirements"],
  transportation:["Route","Schedule","Estimated total","Luggage","Transfers","Fallback"],
  default:["Mission scope","Availability","Estimated cost","Requirements","Transportation","Approval checkpoint"]
};
const CHECKLISTS_KO={education:["온라인 또는 오프라인","이동 시간","수업 시간","체험 수업","예상 월 비용","사용 언어","가능 시간","준비할 교재","이동 방법"],restaurant:["음식 종류와 대표 메뉴","예약 방법","예상 대기 시간","주변 주차","가까운 지하철","근처 디저트","이동 방법"],healthcare:["진료과","위치와 운영 시간","언어 지원","접근성","권장 도착 시간","준비 서류","보험 확인 사항","이동 방법","근처 약국","후속 알림"],beauty:["가능한 스타일리스트","서비스","예상 소요 시간","가격","주차","예약","근처 카페"],legal:["전문 분야","사용 언어","상담 방식","가능 시간","예상 상담료","준비 서류"],"pet-care":["서비스","예상 소요 시간","맡기는 시간","데려오는 시간","근처 카페"],default:["미션 범위","이용 가능 여부","예상 비용","준비 사항","이동 방법","승인 확인"]};
export function buildPreparation(providerType,context={}){const source=context.language==="ko"?(CHECKLISTS_KO[providerType]||CHECKLISTS_KO.default):(CHECKLISTS[providerType]||CHECKLISTS.default);return {providerType,checklist:[...source],contextUsed:{location:context.startingLocation||null,budget:context.budget??null,language:context.language||"en"},approvalRequired:true,executionEnabled:false};}

const DEMO_NAMES={education:["ONE Language Studio","City Tutor Collective","Flexible Online Tutor"],restaurant:["Neighborhood Table","Station Grill","Evening Kitchen"],healthcare:["Central Hospital Department","Weekend Clinic","Language Support Hospital"],beauty:["Station Hair Studio","Neighborhood Salon","Flexible Style Lab"],legal:["City Legal Consultation","Bilingual Counsel Desk","Remote Legal Review"],"pet-care":["Neighborhood Pet Grooming","Calm Pet Studio","Flexible Grooming Care"],repair:["Local Appliance Repair","Same-Week Repair Desk","Home Service Network"],"professional-service":["Local Professional Desk","Remote Consultation Network","Flexible Service Studio"]};
function universalOptions(type,language="en"){
  const names=DEMO_NAMES[type]||[`${type.replaceAll("-"," ")} provider A`,`${type.replaceAll("-"," ")} provider B`,`${type.replaceAll("-"," ")} provider C`];
  const ko=language==="ko";return names.map((name,i)=>({id:`${type}-${i+1}`,title:ko&&KOREAN[type]?`${KOREAN[type]} 옵션 ${i+1}`:name,identity:i===0?(ko?"종합 추천":"Best Overall"):i===1?(ko?"비용 절약":"Save Money"):(ko?"시간 절약":"Save Time"),cost:i===0?(ko?"확인 후 예상":"Estimated after confirmation"):i===1?(ko?"더 낮은 예상 비용":"Lower estimated cost"):(ko?"확인 후 예상":"Estimated after confirmation"),time:i===2?(ko?"가장 짧은 예상 시간":"Shortest estimated time"):(ko?"시간 확인 불가":"Time unavailable"),score:90-i*6,reasons:i===0?(ko?["요청한 미션과 일치","준비 목록이 완성됨","중요한 차이를 확인 가능"]:["Matches the stated mission","Preparation checklist is complete","Trade-offs are visible"]):i===1?(ko?["더 낮은 예상 비용","동일한 승인 보호"]:["Lower estimated cost","Same approval protection"]):(ko?["더 짧은 예상 이동","이용 가능 여부는 확인 불가"]:["Shorter estimated travel","Availability remains unknown"]),tradeoff:i===0?(ko?"가격과 이용 가능 여부는 데모 정보이며 확인이 필요합니다.":"Price and availability are demo data and require confirmation."):i===1?(ko?"예상 비용은 낮지만 이용 가능 여부와 이동 시간이 덜 확실합니다.":"Lower estimated cost, but availability and travel time are less certain."):(ko?"예상 이동은 짧지만 가격을 확인할 수 없습니다.":"Shorter estimated travel, but price is unavailable."),itinerary:[{time:ko?"준비":"Prepare",title:ko?"필요 조건 확인":"Confirm requirements",duration:"5 min",travelMinutes:0,reservation:false,cost:"—",note:ko?"제공업체에 연락하지 않음":"No provider contact"},{time:ko?"검토":"Review",title:ko?"표준화된 제공업체 정보 비교":"Compare normalized provider details",duration:"5 min",travelMinutes:0,reservation:false,cost:"—",note:ko?"데모 데이터":"Demo data"},{time:ko?"승인":"Approval",title:ko?"명시적 승인 대기":"Wait for explicit approval",duration:ko?"사용자가 결정":"User controlled",travelMinutes:0,reservation:false,cost:"—",note:ko?"실행 비활성화":"Execution disabled"}],transport:{mode:ko?"공통 이동 서비스":"Shared transit service",evidence:ko?"출발 위치가 확인되기 전에는 이동 근거를 제공할 수 없습니다.":"No route evidence is available until location is confirmed",estimateLabel:ko?"확인 불가":"Unavailable"},weatherBackup:null,nearby:[],value:{baselineValid:false,convenience:ko?["하나의 준비 목록","하나의 승인 단계","앱 전환 감소"]:["One preparation checklist","One approval checkpoint","Fewer app switches"]},providerData:normalizeProvider({providerId:`demo-${type}-${i+1}`,providerType:type,businessName:name,dataState:"demo"}),rating:null}));
}

export function buildUniversalMission(input={}){
  const rawClassification=classifyUniversalMission(input.mission),purposeType={"korea-weekend":"travel","global-escape":"travel",business:"travel",event:"entertainment",healthcare:"healthcare"}[input.purpose];const classification=purposeType?{...rawClassification,providerType:purposeType,confidence:"context-supported"}:rawClassification,language=input.language||"en",context=buildExperienceContext({...input,purpose:classification.providerType==="travel"?undefined:classification.providerType});
  let experience;
  if(["travel","healthcare","restaurant","entertainment"].includes(classification.providerType)&&classification.providerType!=="restaurant") {const mappedPurpose=classification.providerType==="entertainment"?"event":classification.providerType==="travel"?"global-escape":classification.providerType;const experiencePurpose=input.purpose||mappedPurpose;experience=buildExperiencePack({...input,purpose:experiencePurpose});}
  else {const options=universalOptions(classification.providerType,language),[onePick,...alternatives]=options;experience={id:`ume-${classification.providerType}`,kind:classification.providerType,context,mode:input.mode||"overall",missionBrief:language==="ko"?[`요청하신 ${KOREAN[classification.providerType]||"미션"} 준비에 필요한 정보만 정리했습니다.`,`확인되지 않은 정보는 데모 또는 확인 불가로 표시합니다.`]:[`ONE prepared only what is needed to complete this ${classification.providerType.replaceAll("-"," ")} mission.`,`Unverified details remain labeled as demo or unavailable.`],onePick:{...onePick,label:ONE_PICK},alternatives,exploreMore:true,oneReady:{label:"ONE Ready",score:78},approval:{state:"not-approved",label:language==="ko"?"데모 미션 준비":"Prepare Demo Mission",reservations:[],estimatedTotal:onePick.cost,dataToShare:[],providerHandoffs:[],nonRefundableItems:[],deadlines:[]},healthcareDisclaimer:null,emergency:null,dataLabels:{demo:language==="ko"?"데모 이용 가능":"Demo availability",estimated:language==="ko"?"예상":"Estimated",sample:language==="ko"?"샘플 제공업체 데이터":"Sample provider data",unknown:language==="ko"?"확인 불가":"Unavailable"},generatedAt:"2026-07-19T00:00:00Z"};}
  const liveIntelligence=createLiveIntelligence(input.liveIntelligence),transit=buildTransitIntelligence(input.transit||{}),preparation=buildPreparation(classification.providerType,{...context.constraints,language});
  return {...experience,pipeline:PIPELINE,classification,providerType:classification.providerType,providers:[experience.onePick,...experience.alternatives].map(x=>x.providerData||normalizeProvider({providerId:x.id,providerType:classification.providerType,businessName:x.title,dataState:"demo"})),liveIntelligence,transit,preparation,whyNotOthers:experience.alternatives.map(x=>({id:x.id,title:x.title,tradeoff:x.tradeoff}))};
}

export const UNIVERSAL_SAMPLES=[
  "I need a Spanish tutor.","I need an orthopedic doctor.","I need Korean BBQ tonight.","I need someone to repair my washing machine.","I need flowers.","I need a CPA.","I need a visa.","I need a wedding photographer.","I need a babysitter.","I need dog grooming.","I need a personal trainer.","I need a lawyer.","I need a hair salon.","I need concert tickets.","I need a hotel.","I need a flight.","I need a business trip.","I need a family weekend."
];
