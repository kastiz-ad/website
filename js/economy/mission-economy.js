import{BILLING_EXECUTION_ENABLED,configureSubscriptionCatalog,ROLE_KEYS,SUBSCRIPTION_CATALOG,TIER_KEYS,WALLET_TYPES}from"../config/mission-economy.js";

export const FREE_ACTIONS=Object.freeze(["search","plan","edit","refine","retry","change_destination","change_provider","change_budget","change_dates","review"]);
export const CHARGEABLE_EVENT="mission_completed";
const BALANCE_SOURCES=Object.freeze(["monthly","purchased","bonus","promotional"]);

export function createWallet({id,ownerId,type="personal",monthlyAllocation=0,purchased=0,bonus=0,promotional=0,expirationRules={monthly:"period_end",purchased:"none",bonus:"configured",promotional:"configured"}}){
  if(!WALLET_TYPES.includes(type))throw new TypeError("Unknown wallet type");
  const balances={monthly:Number(monthlyAllocation)||0,purchased:Number(purchased)||0,bonus:Number(bonus)||0,promotional:Number(promotional)||0};
  return Object.freeze({id,ownerId,type,balances:Object.freeze(balances),monthlyAllocation:Number(monthlyAllocation)||0,expirationRules:Object.freeze({...expirationRules}),history:Object.freeze([]),version:1});
}
export const walletBalance=wallet=>BALANCE_SOURCES.reduce((sum,key)=>sum+Number(wallet.balances[key]||0),0);
function append(wallet,event,balances){return Object.freeze({...wallet,balances:Object.freeze(balances),history:Object.freeze([...wallet.history,Object.freeze(event)]),version:wallet.version+1});}
export function allocateMonthly(wallet,{amount,periodKey,at=new Date().toISOString()}){if(wallet.history.some(x=>x.type==="monthly_allocation"&&x.periodKey===periodKey))return wallet;const balances={...wallet.balances,monthly:Number(amount)||0};return append(wallet,{type:"monthly_allocation",amount:Number(amount)||0,periodKey,at},balances);}
export function addCoins(wallet,{source,amount,reference,expiresAt=null,at=new Date().toISOString()}){if(!BALANCE_SOURCES.includes(source)||source==="monthly")throw new TypeError("Invalid coin source");if(wallet.history.some(x=>x.reference===reference))return wallet;const value=Math.max(0,Number(amount)||0),balances={...wallet.balances,[source]:wallet.balances[source]+value};return append(wallet,{type:"coins_added",source,amount:value,reference,expiresAt,at},balances);}
export function recordFreeMissionAction(wallet,{missionId,action,at=new Date().toISOString()}){if(!FREE_ACTIONS.includes(action))throw new TypeError("Action is not free");return append(wallet,{type:"free_action",missionId,action,coins:0,at},{...wallet.balances});}
export function consumeCompletedMission(wallet,{missionId,status,completionReference,at=new Date().toISOString()}){
  if(status!=="completed")return {wallet,consumed:false,reason:"mission_not_completed"};
  if(!completionReference)return {wallet,consumed:false,reason:"completion_reference_required"};
  if(wallet.history.some(x=>x.type===CHARGEABLE_EVENT&&x.missionId===missionId))return {wallet,consumed:false,reason:"already_consumed"};
  if(walletBalance(wallet)<1)return {wallet,consumed:false,reason:"insufficient_mission_coins",upgradeRequired:true};
  const balances={...wallet.balances};for(const source of["promotional","bonus","monthly","purchased"]){if(balances[source]>0){balances[source]-=1;break;}}
  return {wallet:append(wallet,{type:CHARGEABLE_EVENT,missionId,completionReference,coins:-1,at},balances),consumed:true,reason:"mission_completed"};
}

export function createFeatureFlags(catalog=SUBSCRIPTION_CATALOG){return Object.freeze(Object.fromEntries(TIER_KEYS.map(tier=>[tier,Object.freeze(Object.fromEntries(catalog[tier].features.map(feature=>[feature,true]))) ])));}
export function hasFeature({tier,feature,flags=createFeatureFlags()}){return flags[tier]?.[feature]===true;}
export function subscriptionAccess({tier="free",catalog=SUBSCRIPTION_CATALOG,flags=createFeatureFlags(catalog)}){if(!TIER_KEYS.includes(tier))throw new TypeError("Unknown tier");return Object.freeze({tier,plan:catalog[tier],flags:flags[tier]||{}});}
export function changeTier(account,nextTier,{catalog=SUBSCRIPTION_CATALOG}={}){if(!TIER_KEYS.includes(nextTier))throw new TypeError("Unknown tier");return Object.freeze({...account,tier:nextTier,plan:catalog[nextTier],history:Object.freeze([...(account.history||[]),Object.freeze({type:"tier_changed",from:account.tier,to:nextTier,at:new Date().toISOString()})]),missionHistory:Object.freeze([...(account.missionHistory||[])]),missionMemory:Object.freeze({...account.missionMemory}),inactiveFeatures:Object.freeze((account.plan?.features||[]).filter(x=>!catalog[nextTier].features.includes(x)))});}

const ROLE_PERMISSIONS={owner:["workspace_manage","wallet_manage","members_manage","approve","view","edit"],administrator:["workspace_manage","members_manage","approve","view","edit"],parent:["family_manage","approve","view","edit"],adult_member:["view","edit","request"],child:["view","request"],employee:["view","edit","request"],manager:["approve","view","edit","request"],guest:["view"],viewer:["view"]};
export function rolePermissions(role,overrides={}){if(!ROLE_KEYS.includes(role))throw new TypeError("Unknown role");return Object.freeze([...(overrides[role]||ROLE_PERMISSIONS[role])]);}
export function createWorkspace({id,type,ownerId,wallet,members=[],departments=[]}){if(!["family","group","business","enterprise"].includes(type))throw new TypeError("Invalid workspace type");const normalized=[{userId:ownerId,role:"owner"},...members.filter(m=>m.userId!==ownerId).map(m=>({userId:m.userId,role:ROLE_KEYS.includes(m.role)?m.role:"viewer"}))];return Object.freeze({id,type,ownerId,wallet,members:Object.freeze(normalized),departments:Object.freeze(departments.map(x=>Object.freeze({...x}))),history:Object.freeze([])});}
export function can(workspace,userId,permission,overrides={}){const member=workspace.members.find(x=>x.userId===userId);return Boolean(member&&rolePermissions(member.role,overrides).includes(permission));}

export function coordinateFamily({members,events,transport={}}){return Object.freeze({members:Object.freeze(members.map(x=>Object.freeze({...x}))),sharedCalendar:Object.freeze(events.map(x=>Object.freeze({...x}))),meetingPointStatus:transport.meetingPoint?"prepared":"needs_location",arrivalSynchronization:members.every(x=>x.arrivalTime)?"prepared":"needs_arrival_times",safeReturnHome:members.every(x=>x.returnPlan)?"prepared":"needs_return_plans",reservations:Object.freeze([]),executionEnabled:false});}
export function coordinateGroup({attendees=[],itinerary=[],roles={}}){return Object.freeze({attendance:Object.freeze(attendees.map(x=>Object.freeze({...x}))),sharedItinerary:Object.freeze(itinerary.map(x=>Object.freeze({...x}))),roles:Object.freeze({...roles}),transportationStatus:"preparation_only",reservations:Object.freeze([]),executionEnabled:false});}
export function createBusinessWorkspace(input){return createWorkspace({...input,type:input.type||"business"});}
export function createEnterpriseHierarchy({workspaceId,ownerId,wallet,departments=[]}){const workspace=createWorkspace({id:workspaceId,type:"enterprise",ownerId,wallet,departments});return Object.freeze({...workspace,ssoReady:true,auditLog:Object.freeze([]),approvalChains:Object.freeze([]),integrations:Object.freeze([])});}

export function upgradeState(wallet,language="en"){if(walletBalance(wallet)>0)return {required:false,canReview:true,message:null};return {required:true,canReview:true,message:language==="ko"?"이번 달 미션 코인을 모두 사용했습니다. 미션 준비를 계속하려면 업그레이드하세요.":"You've used all Mission Coins this month. Upgrade to continue preparing missions."};}
export function createBillingAdapter(name){return Object.freeze({name,enabled:BILLING_EXECUTION_ENABLED,capabilities:Object.freeze(["quote_interface","checkout_interface","subscription_interface","refund_interface"]),async quote(){return {status:"unavailable",reason:"billing_not_connected"}},async checkout(){return {status:"blocked",reason:"billing_execution_disabled"}},async subscribe(){return {status:"blocked",reason:"billing_execution_disabled"}}});}
export const BILLING_ADAPTERS=Object.freeze(["Stripe","Apple","Google","KakaoPay","Naver Pay","PayPal","Regional"].map(createBillingAdapter));

export function missionEconomyAnalytics(events=[]){const completed=events.filter(x=>x.type===CHARGEABLE_EVENT),durations=completed.map(x=>Number(x.planningMinutes)).filter(Number.isFinite),satisfaction=completed.map(x=>Number(x.satisfaction)).filter(Number.isFinite);const categories=completed.reduce((a,x)=>(a[x.category||"unknown"]=(a[x.category||"unknown"]||0)+1,a),{});return Object.freeze({completedMissions:completed.length,missionCategories:Object.freeze(categories),averagePlanningTime:durations.length?durations.reduce((a,b)=>a+b,0)/durations.length:null,missionCoinUsage:completed.length,missionSuccessRate:events.length?completed.length/events.length:null,missionSatisfaction:satisfaction.length?satisfaction.reduce((a,b)=>a+b,0)/satisfaction.length:null,familyCoordinationFrequency:events.filter(x=>x.workspaceType==="family").length,businessCoordinationFrequency:events.filter(x=>["business","enterprise"].includes(x.workspaceType)).length});}
export function configuredCatalog(overrides={}){return configureSubscriptionCatalog(overrides);}

