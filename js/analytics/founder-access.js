import { founderDashboardEnabled } from "../config/analytics.js";
export const getFounderAccess=()=>{const development=["localhost","127.0.0.1"].includes(location.hostname);const unlocked=development&&sessionStorage.getItem("kastiz-one-founder-dev-access")==="true";return{allowed:founderDashboardEnabled&&unlocked,development,method:"development-session-only",productionAuthorization:false}};
export const enableDevelopmentFounderAccess=()=>{if(!["localhost","127.0.0.1"].includes(location.hostname))return false;sessionStorage.setItem("kastiz-one-founder-dev-access","true");return true};
