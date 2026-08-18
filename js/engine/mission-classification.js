const RULES = {
  presentation: /presentation|pitch deck|slide deck|speaker notes|rehears(?:al|e)|present it|발표|프레젠테이션|피치덱|슬라이드|발표 대본|리허설|presentaci[oó]n|diapositivas/i,
  meeting: /prepare (?:me |everything )?for .*meeting|investor meeting|client meeting|team meeting|meeting preparation|미팅 준비|회의 준비|투자자 미팅|고객 미팅|팀 회의|reuni[oó]n/i,
  interview: /interview preparation|prepare (?:me )?for .*interview|i have an interview|mock interview|면접 준비|면접.*준비|모의 면접|entrevista/i,
  learning: /pass topik|learn .* in (?:six|\d+) months|study plan|learning plan|시험 준비|학습 계획|공부 계획|topik|aprender|plan de estudio/i,
  research: /research .* and prepare|competitor research|research mission|경쟁사 조사|리서치 미션|조사해서.*준비|investigaci[oó]n/i,
  document: /prepare .*report|monthly report|quarterly report|client proposal|executive summary|보고서 준비|월간 보고서|분기 보고서|제안서 작성|informe|propuesta/i,
  travel: /travel|trip|business trip|vacation|honeymoon|flight|hotel|japan|tokyo|osaka|kyoto|surat|airport|여행|출장|해외출장|업무출장|일본|도쿄|오사카|교토|수라트|항공권|호텔|신혼여행|공항/i,
  shopping: /buy|laptop|phone|product|compare|deal|구매|노트북|핸드폰|제품|비교|최저가|추천/i,
  housing: /home|house|apartment|rent|mortgage|property|집|아파트|전세|월세|부동산|주택담보대출/i,
  foreigner_korea: /study in korea|work in korea|start a business in korea|foreigner in korea|korea settlement|한국 유학|한국 취업|외국인.*한국|한국에서 외국인|외국인이 회사를 시작|한국 정착/i,
  professionals: /immigration specialist|patent attorney|architect|real estate agent|translator|interpreter|financial advisor|labor attorney|professional|이민 전문|변리사|건축사|공인중개사|번역가|통역사|재무상담사|노무사|전문가/i,
  legal: /lawyer|legal|attorney|divorce|contract|lawsuit|trademark|변호사|법률|이혼|계약서|소송|상표/i,
  moving: /move|immigration|visa|overseas|relocation|move to korea|이주|이민|비자|해외|한국 이주/i,
  business: /business|company|startup|register|tax|supplier|사업|창업|회사|법인|세금|공급업체/i,
  healthcare: /doctor|dentist|hospital|clinic|checkup|appointment|pharmacy|emergency|orthopedic|pediatric|gynecology|cancer|rehabilitation|physical therapy|manual therapy|병원|의사|치과|약국|응급|정형외과|소아과|산부인과|암|대학병원|재활|물리치료|도수치료|건강검진|진료/i,
  finance: /loan|mortgage|savings|credit card|investment|insurance|대출|저축|신용카드|투자|보험/i,
  career: /job|career|resume|interview|employment|hiring|candidate|salary|experience|일자리|취업|직업|이력서|면접|커리어|채용|후보자|연봉|경력/i,
  tutoring: /tutor|tutoring|private lesson|english tutor|과외|튜터|개인 수업|영어 선생님/i,
  childcare: /babysitter|babysitting|childcare|nanny|trusted babysitter|베이비시터|아이 돌봄|보육|믿을 수 있는 베이비시터/i,
  language_exchange: /language[ -]?exchange|conversation partner|언어[ -]?교환|회화 파트너|언어교환 파트너/i,
  sports_wellness: /gym|personal trainer|pt|yoga|pilates|swimming|tennis|golf|baseball|bowling|climbing|boxing|martial arts|dance|physical therapy|rehabilitation|acupuncture|massage|헬스|피티|요가|필라테스|수영|테니스|골프|야구|볼링|클라이밍|복싱|무술|댄스|물리치료|재활|침술|마사지/i,
  beauty: /hair salon|nail|skin care|skin clinic|laser clinic|laser treatment|plastic surgery|cosmetic dentistry|vision correction|weight-management|beauty|미용실|네일|피부관리|피부과|레이저|성형외과|미용치과|시력교정|체중관리|다이어트|뷰티/i,
  home_services: /cleaning|moving company|repair|plumbing|electrical|boiler|air-conditioner|locksmith|pest control|appliance repair|sink leak|leak|home service|청소|이사업체|수리|배관|전기|보일러|에어컨|열쇠|방역|해충|가전수리|싱크대|누수|생활 서비스/i,
  education: /academy|course|class|teacher|school|education|lesson|language institute|math academy|science academy|coding academy|학원|내신|수업|선생님|학교|교육|어학원|수학|과학|코딩/i,
  government_services: /government service|public office|certificate|permit|passport|driver'?s license|resident service|business registration|정부 서비스|민원|증명서|허가|여권|운전면허|주민센터|사업자등록/i,
  lifestyle: /wedding|event|restaurant|reservation|date\s*(?:night|plan)?|weekend\s*date|girlfriend|boyfriend|couple|anniversary|결혼식|행사|레스토랑|예약|데이트|주말\s*데이트|여친|여자친구|남친|남자친구|커플|기념일/i
};

const PRIORITY_LOCAL_RULES = {
  foreigner_korea: /move to korea|study in korea|work in korea|start a business in korea|foreigner in korea|korea settlement|한국 이주|한국 유학|한국 취업|외국인.*한국|한국에서 외국인|외국인이 회사를 시작|한국 정착/i,
  education: /academy|english academy|math academy|science academy|coding academy|language institute|학원|내신|어학원/i,
  healthcare: /dentist|pharmacy|emergency|orthopedic|pediatric|gynecology|cancer|university hospital|rehabilitation|physical therapy|manual therapy|치과|약국|응급|정형외과|소아과|산부인과|암|대학병원|재활|물리치료|도수치료/i,
  sports_wellness: /gym|personal trainer|\bpt\b|yoga|pilates|swimming|tennis|golf|baseball|bowling|climbing|boxing|martial arts|dance|헬스|피티|요가|필라테스|수영|테니스|골프|야구|볼링|클라이밍|복싱|무술|댄스/i,
  beauty: /hair salon|nail|skin care|skin clinic|laser clinic|laser treatment|plastic surgery|cosmetic dentistry|vision correction|weight-management|미용실|네일|피부관리|피부과|레이저|성형외과|미용치과|시력교정|체중관리|다이어트/i,
  professionals: /immigration specialist|patent attorney|architect|real estate agent|translator|interpreter|financial advisor|labor attorney|이민 전문|변리사|건축사|공인중개사|번역가|통역사|재무상담사|노무사/i,
  home_services: /cleaning|moving company|plumbing|electrical|boiler|air-conditioner|locksmith|pest control|appliance repair|sink leak|leak|청소|이사업체|배관|전기|보일러|에어컨|열쇠|방역|해충|가전수리|싱크대|누수/i
};

export function normalizeMissionText(value = "") {
  return String(value).normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function classifyMission(value) {
  const text = normalizeMissionText(value);
  if (/child.*english|english.*child|student.*english|english.*student|english.*weak|weak.*english|grades?.*english|english.*grades?|아이.*영어|자녀.*영어|학생.*영어|영어.*부족|영어.*어려|영어.*성적|성적.*영어|영어.*떨어|중학생.*영어|초등.*영어|고등.*영어/i.test(text)) return "education";
  if (/viaje|viajar|vacaciones|luna de miel|vuelo|aeropuerto/i.test(text)) return "travel";
  const priority = Object.entries(PRIORITY_LOCAL_RULES).find(([, pattern]) => pattern.test(text));
  if (priority) return priority[0];
  return Object.entries(RULES).find(([, pattern]) => pattern.test(text))?.[0] || "general_mission";
}

export const MISSION_CATEGORIES = Object.freeze([
  "travel", "work", "presentation", "meeting", "research", "document",
  "interview", "learning", "planning", "personal"
]);

export function missionCategoryFor(type = "general_mission") {
  if (["presentation", "meeting", "research", "document", "interview"].includes(type)) return "work";
  if (type === "learning" || type === "education" || type === "tutoring") return "learning";
  if (type === "travel") return "travel";
  return "personal";
}
