export const MISSION_ECONOMY_ENABLED=true;
export const BILLING_EXECUTION_ENABLED=false;
export const PURCHASES_ENABLED=false;
export const TRANSFERS_ENABLED=false;

export const TIER_KEYS=Object.freeze(["free","one_plus","one_family","one_groups","one_max","one_business","one_enterprise"]);
export const PERSONAL_TIERS=Object.freeze(["free","one_plus","one_family","one_groups","one_max"]);
export const BUSINESS_TIERS=Object.freeze(["one_business","one_enterprise"]);
export const WALLET_TYPES=Object.freeze(["personal","family","group","business","enterprise"]);
export const ROLE_KEYS=Object.freeze(["owner","parent","adult_member","child_member","dependent","organizer","admin","member","workspace_admin","finance_admin","manager","employee","travel_coordinator","guest","viewer"]);
export const PERMISSION_KEYS=Object.freeze(["view_mission","create_mission","edit_own_mission","edit_shared_mission","approve_mission","complete_mission","view_wallet","manage_wallet","invite_member","remove_member","manage_roles","view_shared_memory","edit_shared_memory","view_analytics","manage_workspace","manage_billing_future","view_audit_log"]);
export const ENTITLEMENT_KEYS=Object.freeze(["mission_monthly_allowance","family_workspace","group_workspace","business_workspace","enterprise_hierarchy","shared_mission_memory","advanced_live_intelligence","priority_planning","concierge_support","advanced_approvals","audit_logs","department_wallets","early_access","calendar_integration","advanced_coordination","human_assistance_future"]);

const entitlement=(state="disabled",quantity=null,extra={})=>Object.freeze({state,quantity,trial:false,featureFlag:true,promotionalOverride:null,administrativeOverride:null,...extra});
const shared=Object.freeze({mission_monthly_allowance:entitlement("limited",0),family_workspace:entitlement(),group_workspace:entitlement(),business_workspace:entitlement(),enterprise_hierarchy:entitlement(),shared_mission_memory:entitlement(),advanced_live_intelligence:entitlement(),priority_planning:entitlement(),concierge_support:entitlement(),advanced_approvals:entitlement(),audit_logs:entitlement(),department_wallets:entitlement(),early_access:entitlement(),calendar_integration:entitlement(),advanced_coordination:entitlement(),human_assistance_future:entitlement()});
const entitlements=(quantity,overrides={})=>Object.freeze({...shared,mission_monthly_allowance:entitlement("limited",quantity),...overrides});
const plan=(name,audience,walletType,monthlyAllocation,supportLevel,entitlementOverrides,extra={})=>Object.freeze({name,audience,walletType,monthlyAllocation,supportLevel,pricingLabel:"Pricing coming soon",rollover:{enabled:null,cap:null},fairUse:null,memberLimit:null,workspaceLimit:null,trialRules:Object.freeze({enabled:false}),promotionalOverrides:Object.freeze({}),entitlements:entitlements(monthlyAllocation,entitlementOverrides),...extra});

export const SUBSCRIPTION_CATALOG=Object.freeze({
  free:plan("ONE Free","Single users trying ONE","personal",5,"STANDARD",{}, {purpose:"Experience ONE",memberLimit:1}),
  one_plus:plan("ONE+","Regular individual users","personal",30,"PRIORITY",{advanced_live_intelligence:entitlement("enabled"),priority_planning:entitlement("enabled"),calendar_integration:entitlement("enabled")},{purpose:"Up to one completed mission per day",memberLimit:1}),
  one_family:plan("ONE Family","Households and families","family",null,"PRIORITY",{family_workspace:entitlement("enabled"),shared_mission_memory:entitlement("enabled"),calendar_integration:entitlement("enabled"),advanced_coordination:entitlement("enabled")},{purpose:"Shared family planning",memberLimit:null,defaultMembers:2}),
  one_groups:plan("ONE Groups","Communities and organized groups","group",null,"PRIORITY",{group_workspace:entitlement("enabled"),shared_mission_memory:entitlement("enabled"),calendar_integration:entitlement("enabled"),advanced_coordination:entitlement("enabled")},{purpose:"Group coordination",memberLimit:null}),
  one_max:plan("ONE Max","High-frequency individuals and households","personal",null,"MAX_CONCIERGE",{family_workspace:entitlement("enabled"),shared_mission_memory:entitlement("enabled"),advanced_live_intelligence:entitlement("enabled"),priority_planning:entitlement("enabled"),concierge_support:entitlement("limited",null,{label:"Future capability"}),early_access:entitlement("enabled"),calendar_integration:entitlement("enabled"),advanced_coordination:entitlement("enabled"),human_assistance_future:entitlement("limited",null,{label:"Coming later"})},{purpose:"Highest personal allowance",fairUse:Object.freeze({enabled:true,label:"Generous fair-use access",policy:"configurable"})}),
  one_business:plan("ONE Business","Small and medium-sized companies","business",null,"BUSINESS_PRIORITY",{business_workspace:entitlement("enabled"),shared_mission_memory:entitlement("enabled"),advanced_approvals:entitlement("enabled"),audit_logs:entitlement("enabled"),calendar_integration:entitlement("enabled"),advanced_coordination:entitlement("enabled")},{purpose:"Company mission coordination"}),
  one_enterprise:plan("ONE Enterprise","Large organizations and institutions","enterprise",null,"ENTERPRISE_DEDICATED",{business_workspace:entitlement("enabled"),enterprise_hierarchy:entitlement("enabled"),shared_mission_memory:entitlement("enabled"),advanced_live_intelligence:entitlement("enabled"),priority_planning:entitlement("enabled"),advanced_approvals:entitlement("enabled"),audit_logs:entitlement("enabled"),department_wallets:entitlement("enabled"),calendar_integration:entitlement("enabled"),advanced_coordination:entitlement("enabled")},{purpose:"Highest organization plan",workspaceLimit:null})
});

export const COIN_POLICY=Object.freeze({spendingOrder:Object.freeze(["promotional","monthly","bonus","purchased"]),monthlyReset:true,purchasedExpiration:null,bonusExpiration:"configurable",promotionalExpiration:"configurable"});

export function configureSubscriptionCatalog(overrides={}){
  return Object.freeze(Object.fromEntries(TIER_KEYS.map(key=>{const base=SUBSCRIPTION_CATALOG[key],change=overrides[key]||{};return[key,Object.freeze({...base,...change,entitlements:Object.freeze({...base.entitlements,...(change.entitlements||{})}),rollover:Object.freeze({...base.rollover,...(change.rollover||{})})})]})));
}
