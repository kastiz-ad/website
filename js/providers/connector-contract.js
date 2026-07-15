export const CONNECTOR_ACTIONS = Object.freeze(["search","compare","availability","estimate","reserve","purchase","cancel","status","health","capabilities"]);
export const CONNECTOR_STATUS = Object.freeze({ OK:"OK", UNSUPPORTED:"UNSUPPORTED", UNAVAILABLE:"UNAVAILABLE", REQUIRES_KEY:"REQUIRES_KEY", REQUIRES_PARTNERSHIP:"REQUIRES_PARTNERSHIP", APPROVAL_REQUIRED:"APPROVAL_REQUIRED", EXECUTION_DISABLED:"EXECUTION_DISABLED", FALLBACK:"FALLBACK", ERROR:"ERROR" });
export const ACCESS_LEVEL = Object.freeze({ PUBLIC_FREE:"public_free", API_KEY:"api_key", PARTNERSHIP:"partnership", ENTERPRISE:"enterprise", PLACEHOLDER:"placeholder" });
export const EXECUTION_ACTIONS = Object.freeze(["reserve","purchase","cancel"]);

export const connectorResult = ({ connectorId, action, status, data=[], live=false, simulated=false, message="", metadata={} }) => Object.freeze({ connectorId, action, status, data:Array.isArray(data)?data:[data], live:Boolean(live), simulated:Boolean(simulated), message, metadata:Object.freeze({ ...metadata }), retrievedAt:new Date().toISOString() });
export const unsupportedResult = (connectorId, action) => connectorResult({ connectorId, action, status:CONNECTOR_STATUS.UNSUPPORTED, message:`${connectorId} does not support ${action}.` });
