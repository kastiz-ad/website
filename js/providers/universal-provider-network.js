import { providerRegistry } from "./provider-registry.js";
import { CapabilityRouter } from "./capability-router.js";
import { getMissionPack } from "./packs/mission-packs.js";

export const capabilityRouter=new CapabilityRouter(providerRegistry);
export const requestCapability=request=>capabilityRouter.route(request);
export const planMissionCapabilities=missionType=>getMissionPack(missionType).capabilities;
export const getConnector=id=>providerRegistry.get(id);
export const listConnectors=()=>providerRegistry.list().map(connector=>connector.definition);
