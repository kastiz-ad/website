import { getMissionPack } from "./packs/mission-packs.js";

const TYPE_TO_PACK=Object.freeze({travel:"travel",shopping:"shopping",tutoring:"learning",language_exchange:"learning",moving:"relocation",business:"services",childcare:"services",general_mission:"services"});
export const selectMissionPack=missionType=>getMissionPack(TYPE_TO_PACK[missionType]||"services");
export const buildCapabilityRequests=(missionType,context={})=>selectMissionPack(missionType).capabilities.map(capability=>Object.freeze({capability,action:"search",country:context.country||"*",strategy:context.strategy||"balanced"}));
