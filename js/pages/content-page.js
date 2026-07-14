import { trackEvent } from "../analytics.js";

const PAGE = document.body.dataset.page;
const POLICY_KEYS = new Set(["terms","privacy","cookies","acceptable-use","ai-policy","data-retention","third-party-providers","marketplace-disclosure","approval-execution","refunds","minors","provider-verification","travel-disclaimer","visa-disclaimer","medical-disclaimer","legal-disclaimer","financial-disclaimer","insurance-disclaimer","emergency-disclaimer","intellectual-property","copyright","accessibility-statement","responsible-disclosure"]);
const titles = {
  about:["About Kastiz","Kastiz 소개"],story:["Our Story","Kastiz 이야기"],mission:["Mission","미션"],vision:["Vision","비전"],"how-one-works":["How ONE Works","ONE 작동 방식"],"approval-protection":["Approval Protection","승인 보호"],services:["Services","서비스"],"supported-missions":["Supported Missions","지원 미션"],partners:["Partners","파트너"],business:["Business","비즈니스"],developers:["Developers","개발자"],careers:["Careers","채용"],press:["Press","언론"],contact:["Contact","문의"],help:["Help Center","도움말 센터"],faq:["FAQ","자주 묻는 질문"],security:["Security Overview","보안 개요"],safety:["Safety","안전"],"ai-transparency":["AI Transparency","AI 투명성"],accessibility:["Accessibility","접근성"],status:["Service Status","서비스 상태"],"early-access":["Early Access","얼리 액세스"],roadmap:["Roadmap","로드맵"],pricing:["Pricing","요금제"],"provider-standards":["Provider Standards","제공업체 기준"],terms:["Terms of Service","서비스 이용약관"],privacy:["Privacy Policy","개인정보 처리방침"],cookies:["Cookie and Local Storage Policy","쿠키 및 로컬 저장소 정책"],"acceptable-use":["Acceptable Use Policy","허용 가능한 사용 정책"],"ai-policy":["AI Transparency and Automated Decision Policy","AI 투명성 및 자동화된 의사결정 정책"],"data-retention":["Data Retention and Deletion Policy","데이터 보관 및 삭제 정책"],"third-party-providers":["Third-Party Provider Disclosure","제3자 제공업체 고지"],"marketplace-disclosure":["Marketplace and Intermediary Disclosure","마켓플레이스 및 중개자 고지"],"approval-execution":["Approval and Execution Policy","승인 및 실행 정책"],refunds:["Refund and Cancellation Policy","환불 및 취소 정책"],minors:["Child and Minor User Policy","아동 및 미성년자 정책"],"provider-verification":["Provider Verification Policy","제공업체 검증 정책"],"travel-disclaimer":["Travel Disclaimer","여행 고지"],"visa-disclaimer":["Visa and Immigration Disclaimer","비자 및 이민 고지"],"medical-disclaimer":["Medical Disclaimer","의료 고지"],"legal-disclaimer":["Legal Information Disclaimer","법률 정보 고지"],"financial-disclaimer":["Financial Information Disclaimer","금융 정보 고지"],"insurance-disclaimer":["Insurance Disclaimer","보험 고지"],"emergency-disclaimer":["Emergency Information Disclaimer","긴급 정보 고지"],"intellectual-property":["Intellectual Property Policy","지식재산권 정책"],copyright:["Copyright Policy","저작권 정책"],"accessibility-statement":["Accessibility Statement","접근성 선언"],"responsible-disclosure":["Security and Responsible Disclosure Policy","보안 및 책임 있는 공개 정책"]
};
const descriptions = {
  about:["Kastiz builds ONE, an early-access AI Mission Operating System designed to prepare complex real-life missions clearly and safely.","Kastiz는 복잡한 현실 미션을 명확하고 안전하게 준비하는 얼리 액세스 AI 미션 운영체제 ONE을 만들고 있습니다."],
  story:["Kastiz began with a simple observation: searching gives people information, but completing a real mission still requires comparison, coordination, and careful approval.","Kastiz는 검색이 정보를 주지만 실제 미션 완수에는 비교, 조율, 신중한 승인이 여전히 필요하다는 관찰에서 시작했습니다."],
  mission:["Google searches. AI answers. Kastiz ONE completes missions—while keeping the user in control.","Google은 검색하고 AI는 답합니다. Kastiz ONE은 사용자의 통제 아래 미션을 완수합니다."],
  vision:["A future where people spend less time coordinating fragmented services and more time living, building, and deciding.","사람들이 흩어진 서비스를 조율하는 시간을 줄이고 삶과 창조와 결정에 더 집중하는 미래를 지향합니다."],
  "how-one-works":["ONE understands the mission, prepares options, explains trade-offs, and waits for explicit approval before any consequential action.","ONE은 미션을 이해하고 선택지를 준비하며 차이를 설명한 뒤 중요한 행동 전 명시적 승인을 기다립니다."],
  "approval-protection":["ONE never books, buys, pays, reserves, signs, submits, shares personal data with a provider, or creates a legal obligation without explicit approval.","ONE은 명시적 승인 없이 예약, 구매, 결제, 서명, 제출, 제공업체와의 개인정보 공유 또는 법적 의무 생성을 하지 않습니다."],
  services:["ONE currently demonstrates mission planning, comparison, customization, public-data lookups, provider preparation, and simulated execution.","ONE은 현재 미션 계획, 비교, 맞춤 설정, 공개 데이터 조회, 제공업체 준비 및 실행 시뮬레이션을 제공합니다."],
  "supported-missions":["Early-access coverage includes travel, shopping, housing, legal, healthcare, finance, career, moving, business, lifestyle, education, tutoring, childcare, language exchange, government services, and general missions.","얼리 액세스는 여행, 쇼핑, 주거, 법률, 의료, 금융, 커리어, 이사, 비즈니스, 라이프스타일, 교육, 튜터링, 돌봄, 언어 교환, 정부 서비스 및 일반 미션을 포함합니다."],
  partners:["Kastiz is preparing a partner network. No partnership is implied unless a provider is specifically labeled Partner.","Kastiz는 파트너 네트워크를 준비 중입니다. 제공업체에 파트너 표시가 없는 한 제휴를 의미하지 않습니다."],
  business:["Kastiz ONE is being prepared for individuals, teams, service providers, and mission-based business workflows.","Kastiz ONE은 개인, 팀, 서비스 제공업체 및 미션 기반 비즈니스 워크플로를 위해 준비 중입니다."],
  developers:["Developer APIs and provider adapters are planned. Current public-data adapters are prototypes and not a production service guarantee.","개발자 API와 제공업체 어댑터를 계획하고 있습니다. 현재 공개 데이터 어댑터는 프로토타입이며 운영 서비스 보장이 아닙니다."],
  careers:["Kastiz is not currently publishing open roles. Expressions of interest are welcome for future opportunities.","Kastiz는 현재 공개 채용 중이 아닙니다. 향후 기회에 대한 관심 등록은 환영합니다."],
  press:["Official product facts, positioning, and launch-stage information for media and creators.","언론 및 크리에이터를 위한 공식 제품 정보와 출시 단계 안내입니다."],
  contact:["Contact the early-access team for product questions, support, privacy, safety, partnerships, or press.","제품, 지원, 개인정보, 안전, 파트너십 또는 언론 문의를 얼리 액세스 팀에 전달하세요."],
  help:["Find guidance for missions, customization, approval protection, prototype results, and support requests.","미션, 맞춤 설정, 승인 보호, 프로토타입 결과 및 지원 요청에 대한 안내를 확인하세요."],
  faq:["Clear answers about what ONE can do today, what remains simulated, and how approval protection works.","ONE이 현재 할 수 있는 일, 시뮬레이션 범위, 승인 보호 방식에 대한 명확한 답변입니다."],
  security:["Kastiz minimizes frontend data, does not store payment-card details in the website, and treats sensitive mission data as restricted.","Kastiz는 프런트엔드 데이터를 최소화하고 결제 카드 정보를 웹사이트에 저장하지 않으며 민감한 미션 데이터를 제한 정보로 취급합니다."],
  safety:["Safety controls prioritize user consent, specific provider-status labels, regulated-service boundaries, and escalation for emergencies.","안전 통제는 사용자 동의, 구체적인 제공업체 상태 표시, 규제 서비스 경계 및 긴급 상황 대응을 우선합니다."],
  "ai-transparency":["AI may organize, summarize, classify, and suggest. Results can be incomplete or wrong and should be verified before consequential decisions.","AI는 정리, 요약, 분류 및 제안을 수행할 수 있습니다. 결과는 불완전하거나 틀릴 수 있으므로 중요한 결정 전에 확인해야 합니다."],
  accessibility:["Kastiz ONE aims to support keyboard navigation, screen readers, readable contrast, responsive layouts, and reduced motion.","Kastiz ONE은 키보드 탐색, 스크린 리더, 읽기 쉬운 대비, 반응형 레이아웃 및 동작 줄이기를 지원하고자 합니다."],
  status:["Public prototype status. Live public-data services may be unavailable, delayed, incomplete, or replaced with clearly labeled estimates.","공개 프로토타입 상태입니다. 실시간 공개 데이터 서비스는 중단, 지연, 불완전할 수 있으며 명확히 표시된 추정치로 대체될 수 있습니다."],
  "early-access":["Private Alpha is targeted for August or September 2026, followed by a planned Public Beta in Q4 2026. Dates may change.","비공개 알파는 2026년 8월 또는 9월, 공개 베타는 2026년 4분기를 목표로 하며 일정은 변경될 수 있습니다."],
  roadmap:["The roadmap prioritizes reliable mission routing, account controls, provider integrations, approval records, and safe production execution.","로드맵은 신뢰할 수 있는 미션 라우팅, 계정 통제, 제공업체 연동, 승인 기록 및 안전한 운영 실행을 우선합니다."],
  pricing:["Founder-approved early-access pricing. Payments remain disabled until operational and legal launch requirements are complete.","창업자 승인 얼리 액세스 요금 안내입니다. 운영 및 법률 출시 요건이 완료될 때까지 결제는 비활성화됩니다."],
  "provider-standards":["Provider status must be precise: Recommended, Partner, Identity Verified, License Verified, Background Checked, Community Reviewed, Prototype Profile, Publicly Sourced, or Unverified.","제공업체 상태는 추천, 파트너, 신원 확인, 면허 확인, 신원조회 완료, 커뮤니티 리뷰, 프로토타입 프로필, 공개 출처 또는 미확인으로 구체적으로 표시해야 합니다."]
};
const policyFocus = {
  terms:"use of the early-access website, user responsibilities, prohibited conduct, service boundaries, approval, suspension, disclaimers, and Korean jurisdiction",
  privacy:"purpose limitation, data minimization, mission data, uploads, location permission, processors, user rights, international processing, security, and contact",
  cookies:"necessary storage, preferences, privacy-conscious analytics, optional marketing consent, controls, and retention",
  "acceptable-use":"lawful use, safety, abuse, fraud, harassment, malware, regulated activities, and enforcement",
  "ai-policy":"AI assistance, automated classification, human choice, known limitations, source verification, and contesting outcomes",
  "data-retention":"mission-history choices, 30-day upload defaults, deletion, export, correction, restriction, legal holds, fraud prevention, and backups",
  "third-party-providers":"independent providers, external terms, data sharing, provider status, availability, prices, and user approval",
  "marketplace-disclosure":"Kastiz roles as planner, intermediary, connector, marketplace, or authorized direct provider; independent-provider responsibility",
  "approval-execution":"explicit confirmation before booking, purchase, payment, reservation, signature, submission, data sharing, terms acceptance, regulated services, or legal obligations",
  refunds:"future Kastiz subscriptions, Korean consumer-law review, third-party cancellation terms, fees, timing, and dispute handling",
  minors:"planning access under 18, guardian authorization for binding actions, age-appropriate data minimization, and safety",
  "provider-verification":"specific evidence-based status labels, expiry, re-checking, complaints, limitations, and no use of a generic Verified label",
  "travel-disclaimer":"schedule and price changes, carrier and accommodation terms, safety, local law, documents, insurance, and emergency resources",
  "visa-disclaimer":"official authority controls, eligibility changes, no guarantee, document security, and qualified immigration advice",
  "medical-disclaimer":"general information only, no diagnosis or treatment, licensed professionals, emergencies, and local emergency services",
  "legal-disclaimer":"general information only, no attorney-client relationship, jurisdiction differences, deadlines, and qualified counsel",
  "financial-disclaimer":"general information only, no personalized financial advice, loss risk, fees, taxes, and licensed professionals",
  "insurance-disclaimer":"comparison and preparation only, no insurer or broker claim, exclusions, underwriting, provider terms, and approval before purchase",
  "emergency-disclaimer":"no emergency-monitoring service, contact local emergency services first, location limitations, and optional sensitive emergency contacts",
  "intellectual-property":"Kastiz materials, user content permissions, provider marks, feedback, prohibited copying, and complaint process",
  copyright:"copyright ownership, permitted use, notices, takedown requests, counter-notices, and repeat misuse",
  "accessibility-statement":"accessibility goals, known limitations, feedback channels, compatible technology, and ongoing improvement",
  "responsible-disclosure":"good-faith research scope, safe testing, privacy, reporting, response expectations, and prohibited exploitation"
};
const genericSections = (key, lang) => {
  const ko = lang === "ko";
  if (key === "pricing") return ko ? [
    {h:"ONE Free · ₩0",p:"월 5개 자동화 미션 · 기본 실시간 공개 데이터 · 활성 저장 미션 1개 · 기본 맞춤 설정 · 사람의 검토 또는 실행 없음"},
    {h:"ONE Plus · 베타 출시가 ₩9,900/월",p:"예정 정상가 ₩14,900/월 · 공정 사용 기준 확대된 자동화 미션 · 미션 기록 및 메모리 · 고급 비교 및 맞춤 설정 · 알림 및 선호 설정 · 우선 처리 · 월 1회 제한된 지원/검토 크레딧"},
    {h:"ONE Assist · 선택형 미션별 추가 서비스",p:"간단한 미션 ₩9,900 · 표준 미션 ₩19,900 · 사람 검토 · 제공업체 후보 확인 · 수정 1회 · 승인 준비 요약"},
    {h:"ONE Complete · 복잡한 미션 ₩39,000부터",p:"승인 전 맞춤 견적 표시 · 이주, 복잡한 여행, 사업 준비 또는 여러 제공업체 조율용"},
    {h:"파운딩 멤버 혜택",p:"조건을 충족하는 선착순 100명 · 첫 3개월 월 ₩4,900 · 사람 검토가 포함된 베타 미션 1개"},
    {h:"중요 안내",p:"제3자 가격은 항상 별도입니다. 명시적 승인 없이 구매, 예약, 결제, 제공업체 연락 또는 어떠한 약속도 진행되지 않습니다. 사업자 등록, 결제 처리, 환불 운영 및 법률 검토가 완료될 때까지 결제는 비활성화됩니다."}
  ] : [
    {h:"ONE Free · ₩0",p:"5 automated missions per month · Basic live public data · One active saved mission · Basic customization · No human review or execution"},
    {h:"ONE Plus · Introductory beta ₩9,900/month",p:"Planned standard price ₩14,900/month · Expanded automated missions subject to fair use · Mission history and memory · Advanced comparison and customization · Notifications and preferences · Priority processing · One limited support/review credit monthly"},
    {h:"ONE Assist · Optional per-mission add-on",p:"₩9,900 for simple missions · ₩19,900 for standard missions · Human review · Provider shortlist check · One revision · Approval-ready summary"},
    {h:"ONE Complete · From ₩39,000",p:"Custom quote shown before approval · For relocation, complex travel, business setup, or multi-provider coordination"},
    {h:"Founding Member Offer",p:"First 100 qualifying users · ₩4,900/month for the first three months · One human-reviewed beta mission included"},
    {h:"Important",p:"Third-party prices are always separate. No purchase, booking, payment, reservation, provider contact, or commitment occurs without explicit approval. Payments remain disabled until business registration, payment processing, refund operations, and legal review are complete."}
  ];
  if (POLICY_KEYS.has(key)) {
    const focus = policyFocus[key];
    return ko ? [
      {h:"적용 범위",p:`이 정책은 Kastiz ONE 얼리 액세스와 관련된 ${focus} 내용을 다룹니다. 기능이 실제로 연결되지 않은 경우 프로토타입 또는 준비 중으로 표시합니다.`},
      {h:"사용자 통제",p:"필요한 정보만 현재 미션에 사용합니다. 중요한 행동, 제공업체와의 개인정보 공유 및 법적 의무 생성 전에는 선택된 행동, 제공업체, 예상 비용, 알려진 세금·수수료, 취소 조건, 공유 데이터 및 주요 위험을 표시하고 명시적 승인을 요구합니다."},
      {h:"제3자와 제한",p:"독립 제공업체의 가격, 가용성, 자격, 정책 및 결과는 변경될 수 있습니다. Kastiz는 별도로 권한을 부여받지 않은 규제 서비스 제공업체라고 주장하지 않습니다."},
      {h:"권리와 문의",p:"사용자는 계정·미션 기록·업로드 파일 삭제, 데이터 내보내기, 정정 및 처리 제한을 요청할 수 있습니다. 개인정보 문의: privacy@kastiz.com"},
      {h:"관할 및 변경",p:"출시 관할은 대한민국입니다. 정책은 서비스, 법률 및 제공업체 연동 변화에 따라 갱신될 수 있으며 중요한 변경은 합리적인 방식으로 고지합니다."}
    ] : [
      {h:"Scope",p:`This policy covers ${focus} for the Kastiz ONE early-access experience. Capabilities that are not connected are labeled Prototype, Planned, or Coming Soon.`},
      {h:"User control",p:"Kastiz uses only information needed for the current mission. Before consequential action or provider data sharing, ONE presents the selected action, provider, estimated total, known taxes or fees, cancellation terms, data shared, material risks, and a final explicit confirmation."},
      {h:"Third parties and limitations",p:"Independent-provider prices, availability, qualifications, policies, and outcomes can change. Kastiz does not claim to be a regulated provider unless separately authorized."},
      {h:"Rights and contact",p:"Users may request account, mission-history, and upload deletion; data export; correction; or processing restriction. Privacy contact: privacy@kastiz.com."},
      {h:"Jurisdiction and changes",p:"The launch jurisdiction is the Republic of Korea. Policies may change with the service, law, and provider integrations; material changes will be communicated reasonably."}
    ];
  }
  const shared = ko ? [
    {h:"현재 제공 범위",p:"Kastiz ONE은 얼리 액세스 프로토타입입니다. 공개 데이터 조회와 준비 워크플로는 작동할 수 있지만 예약, 구매, 결제 및 규제 서비스는 승인된 운영 연동 전까지 시뮬레이션입니다."},
    {h:"승인 보호",p:"ONE은 모든 선택지를 준비하고 설명하지만 사용자가 명시적으로 승인하기 전에는 예약, 구매, 결제, 서명, 제출 또는 법적 약속을 하지 않습니다."},
    {h:"정직한 상태 표시",p:"실제 상태에 따라 추천, 파트너, 신원 확인, 면허 확인, 신원조회 완료, 커뮤니티 리뷰, 프로토타입 프로필, 공개 출처 또는 미확인으로 표시합니다."},
    {h:"다음 단계",p:"얼리 액세스 요청, 피드백 또는 관련 문의를 제출할 수 있습니다. 팀은 수신 내용을 검토하지만 응답 시간이나 액세스를 보장하지 않습니다."}
  ] : [
    {h:"Current scope",p:"Kastiz ONE is an early-access prototype. Public-data lookups and preparation workflows may operate, while booking, purchasing, payment, and regulated services remain simulated until authorized production integrations exist."},
    {h:"Approval protection",p:"ONE prepares and explains options, but does not book, buy, pay, sign, submit, or create a legal commitment until the user explicitly approves."},
    {h:"Honest status labels",p:"Provider status is shown as Recommended, Partner, Identity Verified, License Verified, Background Checked, Community Reviewed, Prototype Profile, Publicly Sourced, or Unverified—only when supported."},
    {h:"Next step",p:"You may submit an early-access, feedback, or relevant inquiry. The team reviews submissions but does not guarantee access or response time."}
  ];
  return shared;
};
const forms = new Set(["early-access","contact","partners","business","developers","careers","press","help","provider-standards","responsible-disclosure"]);
const language = localStorage.getItem("kastiz-one-language") || (navigator.language.startsWith("ko") ? "ko" : "en");
const theme = localStorage.getItem("kastiz-one-theme") || "light";
document.documentElement.dataset.theme = theme; document.documentElement.lang = language;
const ko = language === "ko"; const title = titles[PAGE] || ["Kastiz ONE","Kastiz ONE"];
const desc = descriptions[PAGE] || (POLICY_KEYS.has(PAGE) ? ["Operational policy for the Kastiz ONE early-access service.","Kastiz ONE 얼리 액세스 서비스를 위한 운영 정책입니다."] : ["Kastiz ONE launch information.","Kastiz ONE 출시 정보입니다."]);
const sections = genericSections(PAGE, language);
const app = document.getElementById("content");
document.title = `${title[ko?1:0]} — Kastiz ONE`;
const draft = POLICY_KEYS.has(PAGE) ? `<p class="policy-draft"><strong>${ko?"운영 검토용 초안입니다. 상업 출시 전 자격을 갖춘 한국 법률 전문가의 최종 검토를 권장합니다.":"Draft for operational review. Final review by qualified Korean legal counsel is recommended before commercial launch."}</strong></p>` : "";
const form = forms.has(PAGE) ? `<section class="content-card wide"><h2>${ko?"요청 보내기":"Send a request"}</h2><form class="request-form" data-request-type="${PAGE}"><label>${ko?"이름":"Name"}<input name="name" autocomplete="name" required maxlength="80"></label><label>${ko?"이메일":"Email"}<input name="email" type="email" autocomplete="email" required maxlength="120"></label><label>${ko?"요청 유형":"Request type"}<select name="kind"><option>${title[ko?1:0]}</option><option>${ko?"피드백":"Feedback"}</option><option>${ko?"버그 신고":"Bug report"}</option><option>${ko?"안전 신고":"Safety report"}</option><option>${ko?"제공업체 관심":"Provider interest"}</option></select></label><label>${ko?"내용":"Message"}<textarea name="message" required maxlength="2000"></textarea></label><label class="form-consent"><input type="checkbox" required><span>${ko?"이 요청을 검토하는 데 필요한 정보 처리에 동의합니다. 마케팅 동의와는 별개입니다.":"I consent to processing the information needed to review this request. This is separate from marketing consent."}</span></label><button class="button primary" type="submit">${ko?"안전하게 저장":"Save request safely"}</button><p class="form-status" role="status"></p></form></section>` : "";
app.innerHTML=`<section class="hero"><p class="eyebrow">KASTIZ ONE · ${POLICY_KEYS.has(PAGE)?(ko?"정책":"POLICY"):(ko?"얼리 액세스":"EARLY ACCESS")}</p><h1>${title[ko?1:0]}</h1><p class="lead">${desc[ko?1:0]}</p><span class="status">${ko?"얼리 액세스 · 프로토타입":"EARLY ACCESS · PROTOTYPE"}</span>${draft}</section><section class="content-grid">${sections.map((s,i)=>`<article class="content-card ${i===0?"wide":""}"><h2>${s.h}</h2><p>${s.p}</p></article>`).join("")}${form}</section><div class="actions"><a class="button primary" href="early-access.html">${ko?"얼리 액세스 참여":"Join Early Access"}</a><a class="button" href="help.html">${ko?"도움말":"Help Center"}</a></div>`;
document.getElementById("languageButton").textContent=ko?"English":"한국어";
document.getElementById("languageButton").addEventListener("click",()=>{localStorage.setItem("kastiz-one-language",ko?"en":"ko");location.reload()});
document.querySelectorAll(".brand img").forEach(img=>img.classList.toggle("light-logo",theme==="light"));
document.querySelectorAll(".request-form").forEach(formEl=>formEl.addEventListener("submit",event=>{event.preventDefault();const payload={type:formEl.dataset.requestType,createdAt:new Date().toISOString()};const requests=JSON.parse(localStorage.getItem("kastiz-one-local-requests")||"[]");localStorage.setItem("kastiz-one-local-requests",JSON.stringify([...requests.slice(-19),payload]));formEl.reset();formEl.querySelector(".form-status").textContent=ko?"요청이 이 브라우저에 저장되었습니다. 전송 서비스가 연결되기 전에는 외부로 전송되지 않습니다.":"Saved in this browser. It is not transmitted externally until a submission service is connected.";trackEvent(PAGE==="early-access"?"early_access_request":PAGE==="partners"?"partner_inquiry":PAGE==="provider-standards"?"provider_inquiry":"contact_submission",{page:PAGE,language});}));
trackEvent("page_visit",{page:PAGE,language});
