import{validateMission}from"./one-agent-schema.js";import{missionQualityGate}from"./one-quality-gate.js";
export function validateAgentOutput(output){const mission=validateMission(output),quality=missionQualityGate(mission);if(!quality.passed)throw Object.assign(new TypeError("mission_quality_failed"),{quality});return mission;}
