import { ACCESS_LEVEL, CONNECTOR_STATUS, EXECUTION_ACTIONS, connectorResult } from "./connector-contract.js";

const STRATEGY_ORDER=Object.freeze({ balanced:[ACCESS_LEVEL.PUBLIC_FREE,ACCESS_LEVEL.API_KEY,ACCESS_LEVEL.PARTNERSHIP,ACCESS_LEVEL.ENTERPRISE,ACCESS_LEVEL.PLACEHOLDER], cheapest:[ACCESS_LEVEL.PUBLIC_FREE,ACCESS_LEVEL.API_KEY,ACCESS_LEVEL.PARTNERSHIP,ACCESS_LEVEL.PLACEHOLDER,ACCESS_LEVEL.ENTERPRISE], fastest:[ACCESS_LEVEL.PUBLIC_FREE,ACCESS_LEVEL.API_KEY,ACCESS_LEVEL.PARTNERSHIP,ACCESS_LEVEL.ENTERPRISE,ACCESS_LEVEL.PLACEHOLDER], highest_rated:[ACCESS_LEVEL.PARTNERSHIP,ACCESS_LEVEL.API_KEY,ACCESS_LEVEL.PUBLIC_FREE,ACCESS_LEVEL.ENTERPRISE,ACCESS_LEVEL.PLACEHOLDER], best_value:[ACCESS_LEVEL.PUBLIC_FREE,ACCESS_LEVEL.PARTNERSHIP,ACCESS_LEVEL.API_KEY,ACCESS_LEVEL.ENTERPRISE,ACCESS_LEVEL.PLACEHOLDER] });
const rank=(connector,strategy)=>Math.max(0,(STRATEGY_ORDER[strategy]||STRATEGY_ORDER.balanced).indexOf(connector.definition.access));

export class CapabilityRouter {
  constructor(registry){this.registry=registry;}
  async route({capability,action="search",country="*",strategy="balanced",request={},approval={approved:false}}){
    if(EXECUTION_ACTIONS.includes(action)&&!approval.approved)return connectorResult({connectorId:"one_approval_guard",action,status:CONNECTOR_STATUS.APPROVAL_REQUIRED,message:"ONE will not execute without explicit approval.",metadata:{capability}});
    const candidates=this.registry.forCapability(capability,{country,action}).sort((a,b)=>rank(a,strategy)-rank(b,strategy));
    const attempts=[];
    for(const connector of candidates){const result=await connector.invoke(action,{...request,capability,country,strategy,approval});attempts.push({connectorId:connector.definition.id,status:result.status});if(result.status===CONNECTOR_STATUS.OK)return Object.freeze({...result,metadata:Object.freeze({...result.metadata,strategy,attempts})});}
    return connectorResult({connectorId:"one_fallback",action,status:CONNECTOR_STATUS.FALLBACK,simulated:true,message:"No live provider is available. ONE returned a safe prototype fallback.",metadata:{capability,strategy,attempts}});
  }
  async compare(requests){return Promise.all(requests.map(request=>this.route({...request,action:"compare"})));}
}
