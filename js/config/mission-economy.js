export const MISSION_ECONOMY_ENABLED=true;
export const BILLING_EXECUTION_ENABLED=false;
export const TIER_KEYS=Object.freeze(["free","one_plus","one_family","one_groups","one_business","one_enterprise","one_max"]);
export const WALLET_TYPES=Object.freeze(["personal","family","group","business","enterprise"]);
export const ROLE_KEYS=Object.freeze(["owner","administrator","parent","adult_member","child","employee","manager","guest","viewer"]);

const BASE_FEATURES=["one_pick","basic_coordination","basic_preparation","community_support"];
export const SUBSCRIPTION_CATALOG=Object.freeze({
  free:{name:"Free",purpose:"Experience the magic of ONE",walletType:"personal",monthlyAllocation:5,features:[...BASE_FEATURES,"basic_mission_memory","basic_live_intelligence","single_user"]},
  one_plus:{name:"ONE+",purpose:"Individuals",walletType:"personal",monthlyAllocation:null,features:[...BASE_FEATURES,"unlimited_edits","unlimited_refinements","priority_planning","advanced_mission_memory","advanced_one_pick","live_intelligence","calendar_integration","traffic_optimization","weather_optimization","preparation_enhancements"]},
  one_family:{name:"ONE Family",purpose:"Households",walletType:"family",monthlyAllocation:null,defaultMembers:2,features:["shared_wallet","individual_schedules","individual_preferences","individual_transportation","shared_coordination","shared_calendar","shared_reservations","shared_mission_memory","family_one_pick","birthday_planning","restaurant_coordination","trip_coordination","meeting_point_intelligence","arrival_synchronization","safe_return_home"]},
  one_groups:{name:"ONE Groups",purpose:"Small communities",walletType:"group",monthlyAllocation:null,features:["shared_wallet","group_events","shared_itineraries","attendance","meeting_coordination","transportation_planning","reservation_planning","role_permissions"]},
  one_business:{name:"ONE Business",purpose:"Small and medium businesses",walletType:"business",monthlyAllocation:null,features:["employee_travel","business_meetings","corporate_dining","conference_planning","client_visits","shared_itineraries","approval_workflows","expense_preparation","workspace_administration"]},
  one_enterprise:{name:"ONE Enterprise",purpose:"Large organizations",walletType:"enterprise",monthlyAllocation:null,features:["unlimited_workspaces","department_hierarchy","organization_coordination","corporate_wallets","advanced_approval_chains","sso_ready","audit_logs","advanced_permissions","department_analytics","enterprise_dashboards","enterprise_integrations","high_priority_routing","dedicated_support_architecture","future_enterprise_apis"]},
  one_max:{name:"ONE Max",purpose:"Personal premium experience",walletType:"personal",monthlyAllocation:null,features:["all_available_features","highest_priority","priority_live_intelligence","priority_mission_generation","largest_configurable_wallet","private_mission_memory","advanced_family_coordination","future_concierge","future_human_assistance","priority_support","early_feature_access","white_glove_onboarding","future_phone_assistance"]}
});

export function configureSubscriptionCatalog(overrides={}){return Object.fromEntries(TIER_KEYS.map(key=>[key,Object.freeze({...SUBSCRIPTION_CATALOG[key],...(overrides[key]||{}),features:Object.freeze([...(overrides[key]?.features||SUBSCRIPTION_CATALOG[key].features)])})]));}

