import { sanitizeMissionMemory } from "./experience-engine-v2.js";

export const ONE_PICK = "⭐ ONE Pick";
export const ONE_READY = "ONE Ready";

export const GROUPS = Object.freeze(["solo","couple","friends","family-young","family-teen","senior","business","patient","caregiver","luxury","budget","local","international"]);
export const MODES = Object.freeze(["overall","money","time","relax","active","premium","family","romantic","accessible","local","business"]);

const urgentPattern = /(?:chest pain|can't breathe|cannot breathe|severe bleeding|unconscious|stroke|suicid|가슴\s*통증|호흡\s*곤란|숨을\s*못|심한\s*출혈|의식\s*불명|뇌졸중|자살)/i;
const medicalPattern = /(?:knee pain|hospital|clinic|doctor|dentist|orthopedic|dermatolog|pediatric|medical|무릎|병원|의원|의사|치과|정형외과|피부과|소아과)/i;

const TEXT = {
  en:{pick:"⭐ ONE Pick",brief:"Mission Brief",why:"Why this is the ONE Pick",value:"ONE Value",nearby:"Nearby with ONE",demo:"Demo availability",estimated:"Estimated travel time",sample:"Sample provider data",unknown:"Not available",approval:"Prepare Demo Mission",disclaimer:"This logistical recommendation is based on location, sample availability, language support, and your stated needs. It is not medical advice or a medical judgment.",emergency:"This may require urgent care. Contact local emergency services now or seek immediate professional medical help."},
  ko:{pick:"⭐ ONE Pick",brief:"미션 브리프",why:"이 플랜이 ONE Pick인 이유",value:"ONE이 줄인 시간과 비용",nearby:"ONE과 함께 주변 둘러보기",demo:"데모 이용 가능",estimated:"예상 이동 시간",sample:"샘플 제공업체 데이터",unknown:"확인 불가",approval:"데모 미션 준비",disclaimer:"이 추천은 위치, 샘플 이용 가능 여부, 언어 지원과 사용자가 알려준 조건을 바탕으로 한 이동·방문 안내이며 의료 조언이나 의학적 판단이 아닙니다.",emergency:"긴급한 상황일 수 있습니다. 지금 지역 응급 서비스에 연락하거나 즉시 의료 전문가의 도움을 받으세요."}
};

const GROUP_HINTS = [
  ["family-young",/(?:two children|children.*(?:age|5|9)|young child|아이|어린이|자녀)/i],
  ["senior",/(?:senior|elderly|부모님|어르신)/i], ["couple",/(?:girlfriend|boyfriend|couple|date|anniversary|아내|남편|여자친구|남자친구|커플|데이트|기념일)/i],
  ["business",/(?:business|meeting|출장|회의)/i], ["patient",medicalPattern], ["solo",/(?:alone|solo|혼자)/i]
];
const PURPOSE_HINTS = [["healthcare",medicalPattern],["business",/(?:business|meeting|출장|회의)/i],["event",/(?:musical|concert|movie|theater|festival|sports|뮤지컬|콘서트|영화|공연|축제|스포츠)/i],["global-escape",/(?:japan|disney|universal|vacation|trip|travel|일본|디즈니|유니버설|여행)/i],["korea-weekend",/(?:seoul|incheon|weekend|date|family|서울|인천|주말|데이트|가족)/i]];

export function buildExperienceContext(input={}) {
  const mission=String(input.mission||"").trim();
  const group=input.group||GROUP_HINTS.find(([,rx])=>rx.test(mission))?.[0]||"solo";
  const purpose=input.purpose||PURPOSE_HINTS.find(([,rx])=>rx.test(mission))?.[0]||"korea-weekend";
  const constraints={budget:input.budget??null,availableTime:input.availableTime||null,startingLocation:input.startingLocation||null,transport:input.transport||null,childrenAges:input.childrenAges||[],mobilityNeeds:input.mobilityNeeds||null,dietaryNeeds:input.dietaryNeeds||null,weather:input.weather||null,language:input.language||"en",returnDeadline:input.returnDeadline||null,preferences:input.preferences||[]};
  const essentialQuestions=[];
  if(!constraints.startingLocation) essentialQuestions.push(constraints.language==="ko"?"어디에서 출발하시나요?":"Where are you starting from?");
  if(!constraints.availableTime) essentialQuestions.push(constraints.language==="ko"?"하루 전체인가요, 저녁만 가능한가요?":"Do you have the full day or only the evening?");
  if(constraints.budget==null) essentialQuestions.push(constraints.language==="ko"?"대략적인 예산이 있나요? 몰라도 괜찮아요.":"Do you have an approximate budget? It is fine if you do not know.");
  return {mission,group,purpose,constraints,essentialQuestions:essentialQuestions.slice(0,3),urgent:urgentPattern.test(mission)};
}

const baseData=(provider="Kastiz demo catalog")=>({sourceType:"demo",timestamp:"2026-07-19T00:00:00Z",provider,availabilityStatus:"sample",ratingStatus:"unknown",cancellationStatus:"unknown",dataConfidence:"demo"});
const step=(time,title,duration,travelMinutes,cost,note,reservation=false)=>({time,title,duration,travelMinutes,reservation,cost,note});
const option=(id,title,identity,cost,time,score,reasons,tradeoff,itinerary,extra={})=>({id,title,identity,cost,time,score,reasons:reasons.slice(0,3),tradeoff,itinerary,transport:extra.transport||{mode:"Subway",evidence:"Estimated to avoid parking and one transfer",estimateLabel:"Estimated travel time"},weatherBackup:extra.weatherBackup||null,nearby:extra.nearby||[],value:extra.value||{baselineValid:false,convenience:["One coordinated itinerary","Transport and backup plan included","Fewer app switches"]},providerData:{...baseData(),location:extra.location||"Not specified",price:cost,transportEstimate:time},rating:null});

const itineraries={
  couple:[step("14:00–17:00","Indoor activity in Jamsil","3h",25,"₩45,000","Reservation recommended",true),step("17:30–19:00","Dinner near Jamsil","1h 30m",15,"₩60,000","Dietary needs should be confirmed",true),step("19:15–20:30","Seoul Sky night view","1h 15m",10,"₩31,000","Sample availability",true),step("20:45","Subway home","45m",5,"₩3,000","Estimated conditions")],
  family:[step("10:30–12:30","Children's museum","2h",25,"₩24,000","Age 5 and 9 suitable; sample data",true),step("12:45–13:45","Family lunch","1h",10,"₩45,000","Restroom nearby",true),step("14:15–16:00","Indoor aquarium","1h 45m",20,"₩72,000","Stroller access unknown",true)],
  solo:[step("11:00–12:30","Quiet exhibition","1h 30m",20,"₩15,000","Demo availability",true),step("12:45–13:45","Solo-friendly lunch","1h",10,"₩18,000","Sample venue"),step("14:00–16:00","Bookstore and café","2h",5,"₩14,000","Flexible timing")],
  global:[step("Day 1","Arrival and hotel check-in","4h",60,"Estimated","Allow airport and luggage buffer"),step("Day 2","Primary theme park day","10h",45,"Sample ticket price","Ticket required",true),step("Day 3","Flexible neighborhood visit and return","6h",40,"Estimated","Return-airport buffer included")],
  business:[step("08:30","Reliable transfer to meeting","45m",45,"Estimated","20-minute arrival buffer"),step("09:30–17:00","Meetings","7h 30m",0,"—","Work obligations protected"),step("17:30","Return to hotel","30m",30,"Estimated","Rest before dinner"),step("18:30","Korean dinner nearby","1h 30m",10,"Sample price","Reservation may be required",true),step("20:15","Quiet river walk or licensed spa","1h",10,"Optional","Keep original if meeting runs late")],
  event:[step("17:30","Dinner near theater","1h 15m",10,"Sample price","Reservation recommended",true),step("19:00","Arrival and entry buffer","30m",5,"—","Ticket and venue rules must be confirmed"),step("19:30–22:00","Sample musical performance","2h 30m",0,"Sample ticket price","Demo schedule; not live availability",true),step("22:10","Subway home","45m",10,"Estimated","Last train must be rechecked")],
  health:[step("09:30","Arrive and register","30m",20,"Unknown","Bring identification and insurance information if applicable"),step("10:00","Orthopedics consultation","Unknown",0,"Unknown","Appointment required; no diagnosis is made here",true),step("After visit","Nearby pharmacy or quiet café","Flexible",5,"Unknown","Follow clinician instructions")]
};

function packOptions(kind,ctx){
  const g=ctx.group, loc=ctx.constraints.language==="ko";
  if(kind==="healthcare") return [
    option("health-near","Orthopedics visit with simple transit","Best logistical match","Not available","About 2h",90,["Department matches the stated need","Short sample travel estimate","Registration buffer included"],"Provider availability and clinical suitability require direct confirmation.",itineraries.health,{transport:{mode:"Taxi or accessible transit",evidence:"Reduces walking for a knee-related visit",estimateLabel:"Estimated travel time"},nearby:["Pharmacy","Quiet café","Caregiver waiting area"]}),
    option("health-weekend","Weekend clinic logistics","Weekend availability","Not available","About 2h 30m",82,["Weekend hours in sample record","Transit route prepared"],"Operating hours are demo data and must be confirmed.",itineraries.health),
    option("health-language","Hospital with language desk","Language support","Not available","About 3h",78,["Sample language-support field","Registration checklist included"],"Longer sample travel time.",itineraries.health)
  ];
  if(kind==="business") return [option("biz-efficient","Meeting-first Ho Chi Minh plan","Business Efficient","₩1,480,000–₩1,950,000","4 days",92,["Meeting commute prioritized","Return buffers included","Quiet evening options"],"Less sightseeing time.",itineraries.business,{location:"Ho Chi Minh City",nearby:["Work café","Korean restaurant","Gym"]}),option("biz-central","Central hotel plan","Save Time","₩1,720,000–₩2,200,000","4 days",86,["Shorter sample meeting commute","Backup transport included"],"Higher estimated hotel cost.",itineraries.business),option("biz-value","Value business plan","Save Money","₩1,250,000–₩1,700,000","4 days",80,["Lower sample total","Expense summary included"],"Longer commute and less schedule flexibility.",itineraries.business)];
  if(kind==="event") return [option("event-balanced","Saturday musical evening","Best Overall","₩120,000–₩210,000","5h",91,["Fits Saturday evening","Dinner and return included","Subway access in sample data"],"The performance and ticket availability are demo data.",itineraries.event,{nearby:["Dinner","Café","Last-train route"]}),option("event-budget","Small-theater evening","Save Money","₩65,000–₩110,000","4h",83,["Lower sample ticket cost","Shorter itinerary"],"Smaller production; accessibility is unknown.",itineraries.event),option("event-premium","Premium-seat musical evening","Premium","₩220,000–₩340,000","5h",79,["Premium sample seating","Dinner reservation included"],"Higher cost and stricter sample cancellation terms.",itineraries.event)];
  if(kind==="global-escape") return [option("global-fit","Universal Studios Japan, three days","Best Overall","₩1,050,000–₩1,550,000","3 days",93,["Fits the three-day schedule","Short flight from Korea","Family activities coordinated"],"Theme-park tickets and flights are sample availability.",itineraries.global,{location:"Osaka",nearby:["Hotel area dinner","Airport transfer","Rain backup mall"]}),option("global-disney","Tokyo Disney Resort","Premium","₩1,350,000–₩1,950,000","3 days",84,["Strong Disney-focused experience","Airport and hotel plan included"],"Higher sample total and longer local transfers.",itineraries.global),option("global-fukuoka","Fukuoka short escape","Save Money","₩720,000–₩1,080,000","3 days",82,["Lower sample total","Shorter local transfers"],"Does not include a major theme park.",itineraries.global)];
  const itinerary=g==="couple"?itineraries.couple:g==="family-young"?itineraries.family:itineraries.solo;
  const title=g==="couple"?"Seoul couple afternoon and night":g==="family-young"?"Indoor family discovery day":g==="senior"?"Low-walking scenic Seoul day":"Relaxing local day";
  return [option("local-overall",title,"Best Overall",g==="couple"?"₩139,000 estimated":g==="family-young"?"₩141,000 estimated":"₩47,000 estimated","6–8h",92,[g==="couple"?"Shared activity and dinner":"Group-appropriate pacing","Mostly indoor route","Simple return transport"],"Sample venues and availability require confirmation.",itinerary,{location:"Seoul",weatherBackup:"Indoor exhibition and café",nearby:["Pharmacy","Café","Public restroom"]}),option("local-money",g==="couple"?"Han River and neighborhood dinner":"Low-cost neighborhood day","Save Money","₩55,000–₩85,000","5h",84,["Lower sample total","Flexible reservations"],"More outdoor time and weather exposure.",itinerary),option("local-relax","Spa, café, and early dinner","Relax","₩110,000–₩170,000","5h",81,["Lower walking estimate","Rest periods included"],"Fewer major activities.",itinerary)];
}

export function classifyPack(context){ return context.purpose; }
export function scoreForMode(option,mode="overall") { const boost={money:option.identity==="Save Money",time:/Time|Efficient/.test(option.identity),relax:option.identity==="Relax",premium:option.identity==="Premium",family:/family/i.test(option.title),romantic:/couple|romantic/i.test(option.title),business:/business/i.test(option.title)}[mode]?20:0; return option.score+boost; }
export function buildExperiencePack(input={}){
  const context=buildExperienceContext(input),language=context.constraints.language,t=TEXT[language]||TEXT.en,kind=classifyPack(context),mode=MODES.includes(input.mode)?input.mode:"overall";
  const ranked=packOptions(kind,context).map(x=>({...x,modeScore:scoreForMode(x,mode)})).sort((a,b)=>b.modeScore-a.modeScore);
  const [pick,...alternatives]=ranked;
  const brief=createMissionBrief(context,pick,language);
  return {id:`${kind}-${context.group}`,kind,context,mode,missionBrief:brief,onePick:{...pick,label:ONE_PICK},alternatives:alternatives.slice(0,2),exploreMore:true,oneReady:{label:ONE_READY,score:context.essentialQuestions.length?76:91},approval:{state:"not-approved",label:t.approval,reservations:pick.itinerary.filter(x=>x.reservation).map(x=>x.title),estimatedTotal:pick.cost,dataToShare:[],providerHandoffs:[],nonRefundableItems:[],deadlines:[]},healthcareDisclaimer:kind==="healthcare"?t.disclaimer:null,emergency:context.urgent?t.emergency:null,dataLabels:{demo:t.demo,estimated:t.estimated,sample:t.sample,unknown:t.unknown},generatedAt:"2026-07-19T00:00:00Z"};
}

export function createMissionBrief(context,pick,language="en"){
  const ko=language==="ko",group={solo:ko?"혼자 보내는 시간":"your solo time",couple:ko?"두 분이 함께 보내는 시간":"your time together","family-young":ko?"5세와 9세 아이가 함께하는 가족 시간":"a family day with young children",business:ko?"업무 일정":"your work schedule",patient:ko?"안전한 방문 동선":"safe visit logistics"}[context.group]||(ko?"이번 일정":"this mission");
  return ko?[`${group}에 맞춰 꼭 필요한 일정만 묶었습니다.`,`${pick.title}을 중심으로 이동과 여유 시간을 함께 준비했습니다.`,context.constraints.weather?"날씨 조건을 반영해 대체 일정도 준비했습니다.":"확인되지 않은 실시간 정보는 데모로 표시했습니다."]: [`ONE prepared a focused plan for ${group}.`,`The schedule centers on ${pick.title} with travel and buffer time included.`,context.constraints.weather?"A weather backup is included.":"Unavailable live details remain clearly labeled as demo data."];
}

export function adaptExperience(pack,condition){
  const suggestions={rain:"Use the indoor backup and keep the dinner time.",late:"Skip the optional café and keep the main reservation.",sold_out:"Choose the first alternative; do not change anything until the user confirms.",budget:"Re-rank with Save Money mode."};
  return {condition,suggestion:suggestions[condition]||"Review the changed condition.",requiresApproval:true,actions:["Update Plan","Keep Original"]};
}

export function buildExperienceReceipt(pack,selectedId=pack.onePick.id){
  const selected=[pack.onePick,...pack.alternatives].find(x=>x.id===selectedId)||pack.onePick;
  return {mission:pack.context.mission,userGroup:pack.context.group,purpose:pack.context.purpose,decisionMode:pack.mode,onePick:pack.onePick.title,selected:selected.title,alternativeSelected:selected.id!==pack.onePick.id,itinerary:selected.itinerary,totalEstimatedCost:selected.cost,estimatedTime:selected.time,oneValue:selected.value,preferencesUsed:pack.context.constraints.preferences,informationShared:[],providerHandoffs:[],approvalHistory:["Demo preparation approved"],oneReady:pack.oneReady,missionStatus:"Prepared demo only"};
}

export function safeExperienceMemory(input,consent=false){
  if(!consent)return {};
  const clean=sanitizeMissionMemory(input);
  delete clean.relationshipStatus; delete clean.medical; delete clean.symptoms; delete clean.diagnosis; delete clean.prescriptions;
  return clean;
}

export const SAMPLE_MISSIONS=[
  {id:"seoul-date",mission:"Plan a date for me and my girlfriend in Seoul this Saturday.",group:"couple",purpose:"korea-weekend",startingLocation:"Seoul",availableTime:"afternoon and evening"},
  {id:"family-children",mission:"Find something fun for my family with two children, ages 5 and 9, this weekend.",group:"family-young",purpose:"korea-weekend",childrenAges:[5,9]},
  {id:"incheon-solo",mission:"I'm alone in Incheon and want something relaxing to do.",group:"solo",purpose:"korea-weekend",startingLocation:"Incheon",mode:"relax"},
  {id:"usj",mission:"Plan a three-day Universal Studios Japan trip.",group:"family-young",purpose:"global-escape",availableTime:"3 days"},
  {id:"disney",mission:"Plan a premium Disneyland vacation for my family.",group:"family-young",purpose:"global-escape",mode:"premium"},
  {id:"hcm-business",mission:"I'm going to Ho Chi Minh City for a four-day business trip.",group:"business",purpose:"business",availableTime:"4 days"},
  {id:"musical",mission:"Find a musical this Saturday and plan dinner nearby.",purpose:"event",availableTime:"Saturday evening"},
  {id:"knee",mission:"Find a hospital department for knee pain and help me plan the visit.",group:"patient",purpose:"healthcare"},
  {id:"rain-seoul",mission:"Plan a rainy weekend in Seoul.",purpose:"korea-weekend",weather:"rain"},
  {id:"budget-date",mission:"Plan a low-budget couple's date under ₩100,000.",group:"couple",purpose:"korea-weekend",budget:100000,mode:"money"},
  {id:"mudflat",mission:"Plan a family mudflat experience near Incheon.",group:"family-young",purpose:"korea-weekend",startingLocation:"Incheon"},
  {id:"tokyo-evening",mission:"Plan an evening after my business meeting in Tokyo with a Korean restaurant and massage.",group:"business",purpose:"business",startingLocation:"Tokyo",availableTime:"evening"}
];

export function buildSamplePacks(language="en"){return SAMPLE_MISSIONS.map(x=>buildExperiencePack({...x,language}));}

