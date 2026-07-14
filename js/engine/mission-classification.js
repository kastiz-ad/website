const RULES = {
  travel: /travel|trip|vacation|honeymoon|flight|hotel|japan|tokyo|osaka|kyoto|airport|여행|일본|도쿄|오사카|교토|항공권|호텔|신혼여행|공항/i,
  shopping: /buy|laptop|phone|product|compare|deal|구매|노트북|핸드폰|제품|비교|최저가|추천/i,
  housing: /home|house|apartment|rent|mortgage|property|집|아파트|전세|월세|부동산|주택담보대출/i,
  legal: /lawyer|legal|attorney|divorce|contract|lawsuit|trademark|변호사|법률|이혼|계약서|소송|상표/i,
  moving: /move|immigration|visa|overseas|relocation|이주|이민|비자|해외/i,
  business: /business|company|startup|register|tax|supplier|사업|창업|회사|법인|세금|공급업체/i,
  healthcare: /doctor|dentist|hospital|clinic|checkup|appointment|병원|의사|치과|건강검진|진료/i,
  finance: /loan|mortgage|savings|credit card|investment|insurance|대출|저축|신용카드|투자|보험/i,
  career: /job|career|resume|interview|employment|취업|직업|이력서|면접|커리어/i,
  tutoring: /tutor|tutoring|private lesson|과외|튜터|개인 수업/i,
  childcare: /babysitter|babysitting|childcare|nanny|베이비시터|아이 돌봄|보육/i,
  language_exchange: /language exchange|conversation partner|언어 교환|회화 파트너/i,
  education: /course|class|teacher|school|education|lesson|수업|선생님|학교|교육/i,
  government_services: /government service|public office|certificate|permit|정부 서비스|민원|증명서|허가/i,
  lifestyle: /wedding|childcare|event|restaurant|reservation|결혼식|육아|행사|레스토랑|예약/i
};

export function normalizeMissionText(value = "") {
  return String(value).normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function classifyMission(value) {
  const text = normalizeMissionText(value);
  return Object.entries(RULES).find(([, pattern]) => pattern.test(text))?.[0] || "general_mission";
}


