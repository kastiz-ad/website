(() => {
  const local = location.protocol === "file:" || ["localhost","127.0.0.1"].includes(location.hostname);
  const preview = new URLSearchParams(location.search).get("founder-preview") === "1";
  if (!local || !preview) return;
  const shell = document.getElementById("founderOs");
  document.getElementById("accessDenied").hidden = true;
  shell.hidden = false;
  const nav = document.getElementById("moduleNav");
  const content = document.getElementById("moduleContent");
  const title = document.getElementById("moduleTitle");
  const { metrics, activity, health, flags, providers } = window.FOUNDER_OS_SAMPLE;

  const statusDot = (state) => `<i class="status-dot ${state}"></i>`;
  const overview = () => `<section class="metric-grid">${metrics.map(([label,value,change]) => `<article><span>${label}</span><strong>${value}</strong><small>${change} this week</small></article>`).join("")}</section><section class="fos-grid"><article class="fos-card wide"><div class="card-head"><div><p>MISSION CONTROL</p><h2>Latest activity</h2></div><button disabled>View all</button></div><div class="activity-list">${activity.map(([mission,status,time]) => `<div><span class="mission-icon">✓</span><strong>${mission}</strong><span>${status}</span><time>${time}</time></div>`).join("")}</div></article><article class="fos-card"><div class="card-head"><div><p>SYSTEM HEALTH</p><h2>Everything at a glance</h2></div></div>${health.map(([name,state,label]) => `<div class="health-row">${statusDot(state)}<span>${name}</span><strong>${label}</strong></div>`).join("")}</article><article class="fos-card"><div class="card-head"><div><p>MISSION FUNNEL</p><h2>Today</h2></div></div><div class="funnel"><div><b style="height:88%"></b><span>Started</span><strong>146</strong></div><div><b style="height:70%"></b><span>Results</span><strong>112</strong></div><div><b style="height:44%"></b><span>Approval</span><strong>56</strong></div><div><b style="height:30%"></b><span>Complete</span><strong>39</strong></div></div></article></section>`;
  const table = (heading, columns, rows) => `<article class="fos-card full"><div class="card-head"><div><p>FOUNDER CONTROL</p><h2>${heading}</h2></div><button disabled>Export</button></div><div class="fos-table"><div class="tr th">${columns.map(c=>`<span>${c}</span>`).join("")}</div>${rows.map(row=>`<div class="tr">${row.map(cell=>`<span>${cell}</span>`).join("")}</div>`).join("")}</div></article>`;
  const renders = {
    overview,
    users:()=>table("User Management",["User","Status","Type","Last active"],[["K-10284","Active","Early Access","Today"],["K-10283","Active","Returning","Today"],["K-10282","Pending","Provider","Yesterday"],["K-10281","Inactive","User","3 days ago"]]),
    missions:()=>table("Mission Control",["Mission ID","Category","Status","Language","Duration"],[["ONE-8F21","Travel","Waiting approval","Korean","4m 12s"],["ONE-8F20","Tutor","Results viewed","English","2m 44s"],["ONE-8F19","Business","Preparing","Korean","1m 08s"],["ONE-8F18","Shopping","Completed","English","5m 31s"]]),
    providers:()=>table("Provider Control",["Provider","Mode","Average response","Last failure"],providers),
    early:()=>table("Early Access",["Applicant","Country","Interest","Status"],[["EA-204","South Korea","Travel","Invited"],["EA-203","United States","Business","Contacted"],["EA-202","Japan","Tutor","Accepted"],["EA-201","Spain","General","New"]]),
    feedback:()=>table("Feedback Center",["Type","Summary","Votes","Severity"],[["Suggestion","Faster date selection","18","Medium"],["Praise","Approval flow feels safe","14","—"],["Bug","Landscape spacing","9","High"],["Request","More tutor filters","7","Low"]]),
    analytics:overview,
    content:()=>table("Content Management",["Surface","Status","Updated","Action"],[["Homepage tagline","Published","Today","Edit"],["Mission examples","Published","Today","Edit"],["Pricing","Draft","Yesterday","Review"],["FAQ","Published","3 days ago","Edit"]]),
    flags:()=>`<article class="fos-card full"><div class="card-head"><div><p>RELEASE CONTROL</p><h2>Feature Flags</h2></div><span class="read-only">Read-only preview</span></div><div class="flag-list">${flags.map(([name,on])=>`<div><span>${name}</span><button class="switch ${on?"on":""}" disabled aria-label="${name}: ${on?"on":"off"}"><i></i></button></div>`).join("")}</div></article>`,
    health:()=>table("System Health",["Service","Signal","State","Note"],health.map(([name,state,label])=>[name,statusDot(state),label,state==="yellow"?"Setup required":"No action needed"])),
    audit:()=>table("Audit Log",["Time","Action","Founder","Result"],[["14:32","Viewed mission ONE-8F21","Founder","Success"],["14:18","Exported weekly summary","Founder","Success"],["13:54","Changed demo flag","Founder","Recorded"],["13:22","Reviewed provider health","Founder","Success"]])
  };
  const select = (id) => {
    nav.querySelectorAll("button").forEach(button => button.classList.toggle("active", button.dataset.module === id));
    const module = window.FOUNDER_OS_MODULES.find(item => item.id === id);
    title.textContent = module.label;
    content.innerHTML = renders[id]();
  };
  nav.innerHTML = window.FOUNDER_OS_MODULES.map(item => `<button type="button" data-module="${item.id}"><span>${item.icon}</span>${item.label}</button>`).join("");
  nav.addEventListener("click", event => { const button = event.target.closest("button[data-module]"); if (button) select(button.dataset.module); });
  select("overview");
})();
