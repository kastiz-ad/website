import { CONNECTOR_ACTIONS, CONNECTOR_STATUS, EXECUTION_ACTIONS, connectorResult, unsupportedResult } from "../connector-contract.js";

export class BaseConnector {
  constructor(definition) { this.definition=Object.freeze({ enabled:true, capabilities:[], actions:[], countries:["*"], ...definition }); }
  capabilities() { return connectorResult({ connectorId:this.definition.id, action:"capabilities", status:CONNECTOR_STATUS.OK, data:this.definition.capabilities, metadata:{ actions:this.definition.actions, countries:this.definition.countries, access:this.definition.access } }); }
  health() { return connectorResult({ connectorId:this.definition.id, action:"health", status:this.definition.enabled?CONNECTOR_STATUS.OK:CONNECTOR_STATUS.UNAVAILABLE, data:[{ enabled:this.definition.enabled, mode:this.definition.access }] }); }
  status() { return connectorResult({ connectorId:this.definition.id, action:"status", status:CONNECTOR_STATUS.OK, data:[{ access:this.definition.access, integration:this.definition.integration, enabled:this.definition.enabled }] }); }
  supports(action, capability, country) { return CONNECTOR_ACTIONS.includes(action) && this.definition.actions.includes(action) && this.definition.capabilities.includes(capability) && (this.definition.countries.includes("*") || this.definition.countries.includes(country)); }
  async invoke(action, request={}) {
    if (!CONNECTOR_ACTIONS.includes(action) || !this.definition.actions.includes(action)) return unsupportedResult(this.definition.id, action);
    if (EXECUTION_ACTIONS.includes(action)) {
      if (!request.approval?.approved) return connectorResult({ connectorId:this.definition.id, action, status:CONNECTOR_STATUS.APPROVAL_REQUIRED, message:"Explicit approval is required." });
      return connectorResult({ connectorId:this.definition.id, action, status:CONNECTOR_STATUS.EXECUTION_DISABLED, message:"External execution is disabled in this prototype." });
    }
    return this.perform(action, request);
  }
  search(request){return this.invoke("search",request)} compare(request){return this.invoke("compare",request)} availability(request){return this.invoke("availability",request)} estimate(request){return this.invoke("estimate",request)} reserve(request){return this.invoke("reserve",request)} purchase(request){return this.invoke("purchase",request)} cancel(request){return this.invoke("cancel",request)}
  async perform(action) { return unsupportedResult(this.definition.id, action); }
}
