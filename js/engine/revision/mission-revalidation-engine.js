import{validateMissionCompleteness}from"../completeness/mission-completeness-validator.js";
export function revalidateMission(mission){const quality=validateMissionCompleteness(mission);return{quality,externalExecution:false,bookingEnabled:false,paymentEnabled:false,taxiDispatchEnabled:false,providerContactEnabled:false};}
