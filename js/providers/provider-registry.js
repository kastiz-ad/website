import { PROVIDER_DEFINITIONS } from "./catalog/provider-definitions.js";
import { PUBLIC_CONNECTOR_IDS, createPublicConnector } from "./connectors/public-connectors.js";
import { PlaceholderConnector } from "./connectors/placeholder-connector.js";

export class ProviderRegistry {
  constructor(definitions=PROVIDER_DEFINITIONS){this.connectors=new Map(definitions.map(definition=>[definition.id,PUBLIC_CONNECTOR_IDS.includes(definition.id)?createPublicConnector(definition.id):new PlaceholderConnector(definition)]));}
  get(id){return this.connectors.get(id)}
  list(){return [...this.connectors.values()]}
  forCapability(capability,{country="*",action="search"}={}){return this.list().filter(connector=>connector.definition.enabled&&connector.supports(action,capability,country));}
  setEnabled(id,enabled){const connector=this.get(id);if(!connector)return false;connector.definition=Object.freeze({...connector.definition,enabled:Boolean(enabled)});return true;}
}
export const providerRegistry=new ProviderRegistry();
