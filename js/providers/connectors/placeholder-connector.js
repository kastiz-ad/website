import { BaseConnector } from "./base-connector.js";
import { ACCESS_LEVEL, CONNECTOR_STATUS, connectorResult } from "../connector-contract.js";

export class PlaceholderConnector extends BaseConnector {
  async perform(action, request) {
    const access=this.definition.access;
    const status=access===ACCESS_LEVEL.API_KEY?CONNECTOR_STATUS.REQUIRES_KEY:[ACCESS_LEVEL.PARTNERSHIP,ACCESS_LEVEL.ENTERPRISE].includes(access)?CONNECTOR_STATUS.REQUIRES_PARTNERSHIP:CONNECTOR_STATUS.FALLBACK;
    return connectorResult({ connectorId:this.definition.id, action, status, simulated:true, message:this.definition.placeholderMessage||"Provider connector is ready for authorized credentials or partnership access.", metadata:{ capability:request.capability, access, noExternalRequest:true } });
  }
}
