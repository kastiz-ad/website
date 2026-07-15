import { BaseConnector } from "./base-connector.js";
import { CONNECTOR_STATUS, connectorResult } from "../connector-contract.js";
import { fetchJson } from "../../engine/providers.js";

export class PublicApiConnector extends BaseConnector {
  constructor(definition, handlers={}) { super(definition); this.handlers=handlers; }
  async perform(action, request) {
    const handler=this.handlers[action];
    if (!handler) return super.perform(action,request);
    try {
      const spec=handler(request);
      const raw=await fetchJson(spec.url,{ timeout:spec.timeout||6000, retries:spec.retries??1, cacheTtl:spec.cacheTtl||300000, fetchImpl:request.fetchImpl||fetch });
      const data=spec.transform?spec.transform(raw,request):raw;
      return connectorResult({ connectorId:this.definition.id, action, status:CONNECTOR_STATUS.OK, data, live:true, metadata:{ capability:request.capability, source:this.definition.name, attribution:this.definition.attribution||"" } });
    } catch(error) {
      return connectorResult({ connectorId:this.definition.id, action, status:CONNECTOR_STATUS.ERROR, message:error?.name==="AbortError"?"Provider timed out.":"Provider unavailable.", metadata:{ capability:request.capability } });
    }
  }
}
