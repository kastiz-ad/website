window.FOUNDER_OS_MODULES = Object.freeze([
  { id:"overview", label:"Overview", icon:"⌂" },
  { id:"users", label:"User Management", icon:"◎" },
  { id:"missions", label:"Mission Control", icon:"◫" },
  { id:"providers", label:"Provider Control", icon:"◇" },
  { id:"early", label:"Early Access", icon:"✦" },
  { id:"feedback", label:"Feedback Center", icon:"◌" },
  { id:"analytics", label:"Analytics Summary", icon:"↗" },
  { id:"content", label:"Content Management", icon:"T" },
  { id:"flags", label:"Feature Flags", icon:"⊙" },
  { id:"health", label:"System Health", icon:"●" },
  { id:"audit", label:"Audit Log", icon:"≡" }
]);

window.FOUNDER_OS_SAMPLE = Object.freeze({
  metrics: [["Total users","1,284","+8.2%"],["Missions today","146","+12.4%"],["Approval rate","38.6%","+3.1%"],["Returning users","31.2%","+1.8%"]],
  activity: [["Japan travel","Ready for approval","2m ago"],["English tutor","Results viewed","6m ago"],["Business setup","Preparing","11m ago"],["Laptop research","Completed","18m ago"]],
  health: [["Public data APIs","green","Operational"],["Analytics","green","Receiving events"],["Authentication","yellow","Not connected"],["Deployment","green","Preview healthy"]],
  flags: [["Memory",true],["Analytics",true],["Early Access",true],["Provider",true],["Demo Mode",true],["Maintenance Mode",false],["Authentication",false]],
  providers: [["Open-Meteo","Live","248 ms","—"],["Frankfurter","Live","312 ms","—"],["REST Countries","Fallback","481 ms","14:20"],["Prototype adapters","Disabled","—","—"]]
});
