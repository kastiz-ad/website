import { sanitizeMissionMemory } from "../engine/experience-engine-v2.js";
const KEY="kastiz-one-mission-memory-v2",CONSENT_KEY="kastiz-one-mission-memory-consent";
export const missionMemoryEnabled=()=>localStorage.getItem(CONSENT_KEY)==="true";
export const setMissionMemoryEnabled=enabled=>localStorage.setItem(CONSENT_KEY,String(Boolean(enabled)));
export const readMissionMemories=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]").slice(0,20)}catch{return[]}};
export function saveMissionMemory(memory){if(!missionMemoryEnabled())return{saved:false,reason:"consent_required"};const safe=sanitizeMissionMemory(memory);if(!Object.keys(safe).length)return{saved:false,reason:"nothing_safe_to_save"};const rows=readMissionMemories();rows.unshift({id:crypto.randomUUID(),...safe,createdAt:new Date().toISOString(),storage:"device-local"});localStorage.setItem(KEY,JSON.stringify(rows.slice(0,20)));return{saved:true};}
export function deleteMissionMemory(id){localStorage.setItem(KEY,JSON.stringify(readMissionMemories().filter(row=>row.id!==id)));}
export const clearMissionMemories=()=>localStorage.removeItem(KEY);
export function memoryPrompts(){const rows=readMissionMemories();if(!rows.length)return[];const latest=rows[0],prompts=[];if(latest.favoriteLocations)prompts.push(`Use ${latest.favoriteLocations} again?`);if(latest.favoriteHotels)prompts.push("Use the previous hotel area?");if(latest.disliked)prompts.push(`Avoid ${latest.disliked} again?`);return prompts.slice(0,3);}
