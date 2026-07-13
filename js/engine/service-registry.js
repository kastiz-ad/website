const commonApprovalActions = ["booking","purchase","payment","reservation","signature","submission","personal_data_sharing","provider_terms","regulated_service","legal_obligation"];
const makeRegistry = (id, overrides={}) => Object.freeze({
  id,
  userIntent: `Complete a ${id.replaceAll("_"," ")} mission safely`,
  requiredInformation:["goal","location when relevant","constraints","date or deadline when relevant","user preferences"],
  safeAssumptions:["prototype estimates are not live offers","no provider is selected without user choice","approximate location unless precise permission is granted"],
  liveProviders:[], prototypeProviders:["Kastiz ONE prototype adapter"], restrictedProviders:[],
  editableSteps:["scope","preferences","provider options","schedule","budget"],
  approvalRequiredActions:commonApprovalActions,
  resultCards:["summary","options","risks","estimated cost","next actions"],
  risks:["availability may change","estimates may be incomplete","third-party terms apply"],
  disclaimers:["Early-access prototype","Verify consequential information with the responsible provider"],
  completionStatus:"prepared_not_committed", nextActions:["customize","review","explicitly approve"], ...overrides
});

export const SERVICE_REGISTRY = Object.freeze({
  travel:makeRegistry("travel",{requiredInformation:["origin","destination","outbound date","return date when round trip","traveler count","budget","passport or visa status only when required"],liveProviders:["Open-Meteo","Frankfurter","REST Countries","OpenStreetMap Nominatim","Wikipedia"],prototypeProviders:["flight estimate adapter","hotel estimate adapter","restaurant estimate adapter","transport estimate adapter"],restrictedProviders:["airline booking","hotel booking","insurance purchase","visa submission"],resultCards:["flights","hotels","weather","currency","visa guidance","restaurants","attractions","airport transfer","local transport","packing checklist","travel insurance","emergency information","embassy or consulate guidance","lost passport steps","emergency medical guidance","provider contact checklist"],risks:["fares and availability change","entry rules are controlled by authorities","insurance exclusions apply","emergency information can be incomplete"]}),
  shopping:makeRegistry("shopping",{restrictedProviders:["merchant checkout","payment processor"]}), housing:makeRegistry("housing",{restrictedProviders:["real-estate contract","deposit payment"]}),
  legal:makeRegistry("legal",{restrictedProviders:["licensed lawyer","court or government filing"],disclaimers:["General information only","No attorney-client relationship"]}),
  healthcare:makeRegistry("healthcare",{restrictedProviders:["licensed clinic","doctor","prescription service"],disclaimers:["Not medical advice","Use local emergency services for emergencies"]}),
  finance:makeRegistry("finance",{restrictedProviders:["bank","licensed adviser","insurer"],disclaimers:["Not personalized financial advice","Capital may be at risk"]}),
  career:makeRegistry("career"), moving:makeRegistry("moving"), business:makeRegistry("business"), lifestyle:makeRegistry("lifestyle"), education:makeRegistry("education"),
  tutoring:makeRegistry("tutoring",{requiredInformation:["subject","level","online or offline","location","schedule","language preference","budget"],resultCards:["subject","level","format","location","schedule","experience","estimated price","trial lesson","curriculum","reviews","language preference"]}),
  childcare:makeRegistry("childcare",{requiredInformation:["location","schedule","child age range","language","care needs","emergency preference"],resultCards:["location","availability","experience","language","certifications","identity-check status","background-check status","hourly estimate","interview questions","reference checklist","trial session","safety checklist","emergency procedure","public meeting guidance"],risks:["Never assume identity or background verification","Guardian must independently assess suitability","Emergency procedures require direct confirmation"]}),
  language_exchange:makeRegistry("language_exchange",{resultCards:["target language","native language","location","online or offline","schedule","interests","proficiency","safety guidance","suggested public meeting location"]}),
  government_services:makeRegistry("government_services",{restrictedProviders:["government submission","identity verification","fee payment"]}), general_missions:makeRegistry("general_missions")
});
export const getServiceDefinition = category => SERVICE_REGISTRY[category] || SERVICE_REGISTRY.general_missions;
