export const OFFICIAL_LOCALES = Object.freeze(["en", "ko", "ja", "es", "fr", "de", "it", "pt", "zh-Hans", "zh-Hant"]);

export const LOCALE_VARIANTS = Object.freeze({
  en: ["en-US", "en-GB", "en-CA", "en-AU"],
  ko: ["ko-KR"],
  ja: ["ja-JP"],
  es: ["es-ES", "es-MX", "es-US"],
  fr: ["fr-FR", "fr-CA"],
  de: ["de-DE", "de-AT", "de-CH"],
  it: ["it-IT"],
  pt: ["pt-BR", "pt-PT"],
  "zh-Hans": ["zh-CN", "zh-SG", "zh-Hans"],
  "zh-Hant": ["zh-TW", "zh-HK", "zh-Hant"]
});

export const LANGUAGE_LABELS = Object.freeze({
  en: "English",
  ko: "한국어",
  ja: "日本語",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  "zh-Hans": "中文（简体）",
  "zh-Hant": "中文（繁體）"
});

export const RTL_READY_LOCALES = Object.freeze(["ar", "he"]);

const themeLabels = Object.freeze({
  en: { light: "Light", gray: "Gray", midnight: "Midnight" },
  ko: { light: "라이트", gray: "그레이", midnight: "미드나이트" },
  ja: { light: "ライト", gray: "グレー", midnight: "ミッドナイト" },
  es: { light: "Claro", gray: "Gris", midnight: "Medianoche" },
  fr: { light: "Clair", gray: "Gris", midnight: "Minuit" },
  de: { light: "Hell", gray: "Grau", midnight: "Mitternacht" },
  it: { light: "Chiaro", gray: "Grigio", midnight: "Mezzanotte" },
  pt: { light: "Claro", gray: "Cinza", midnight: "Meia-noite" },
  "zh-Hans": { light: "浅色", gray: "灰色", midnight: "午夜" },
  "zh-Hant": { light: "淺色", gray: "灰色", midnight: "午夜" }
});

const common = {
  en: {
    languageName: "English", theme: "Theme", language: "Language", upgrade: "Upgrade", login: "Login", settings: "Settings", partners: "Partners", business: "Business", developers: "Developers", poweredBy: "Powered by Kastiz", privacy: "Privacy", terms: "Terms", account: "Account", profile: "Profile", subscriptions: "Subscriptions", wallet: "Wallet", missionCoins: "Mission Coins", memory: "Mission Memory", familyWorkspace: "Family workspace", groupWorkspace: "Group workspace", businessWorkspace: "Business workspace", enterpriseWorkspace: "Enterprise workspace", oneMax: "ONE Max", save: "Save", cancel: "Cancel", continue: "Continue", back: "Back", close: "Close", optional: "Optional", required: "Required", loading: "Loading", error: "Something went wrong", retry: "Try again", accessibility: "Accessibility", safetyNotice: "Safety notice", paymentSummary: "Payment summary", refundExplanation: "Refund explanation", integrationStatus: "Integration status", founderAlpha: "Founder Alpha", noExternalExecution: "Nothing is booked, purchased, paid, submitted, signed, reserved, or shared with a provider without your explicit approval.", followMyLocation: "Follow my current location", autoDetectLanguage: "Automatic language", languageOverride: "Manual language override", providerUnavailable: "Provider unavailable", setupRequired: "Setup required"
  },
  ko: {
    languageName: "한국어", theme: "테마", language: "언어", upgrade: "업그레이드", login: "로그인", settings: "설정", partners: "파트너", business: "비즈니스", developers: "개발자", poweredBy: "Kastiz 제공", privacy: "개인정보", terms: "약관", account: "계정", profile: "프로필", subscriptions: "구독", wallet: "지갑", missionCoins: "미션 코인", memory: "미션 메모리", familyWorkspace: "가족 워크스페이스", groupWorkspace: "그룹 워크스페이스", businessWorkspace: "비즈니스 워크스페이스", enterpriseWorkspace: "기업 워크스페이스", oneMax: "ONE Max", save: "저장", cancel: "취소", continue: "계속", back: "이전", close: "닫기", optional: "선택", required: "필수", loading: "불러오는 중", error: "문제가 발생했습니다", retry: "다시 시도", accessibility: "접근성", safetyNotice: "안전 안내", paymentSummary: "결제 요약", refundExplanation: "환불 안내", integrationStatus: "연동 상태", founderAlpha: "파운더 알파", noExternalExecution: "명확한 승인 전에는 예약, 구매, 결제, 제출, 서명, 제공업체 공유가 진행되지 않습니다.", followMyLocation: "현재 위치에 맞추기", autoDetectLanguage: "언어 자동 감지", languageOverride: "수동 언어 선택", providerUnavailable: "제공업체 사용 불가", setupRequired: "설정 필요"
  },
  ja: {
    languageName: "日本語", theme: "テーマ", language: "言語", upgrade: "アップグレード", login: "ログイン", settings: "設定", partners: "パートナー", business: "ビジネス", developers: "開発者", poweredBy: "Kastiz 提供", privacy: "プライバシー", terms: "利用規約", account: "アカウント", profile: "プロフィール", subscriptions: "サブスクリプション", wallet: "ウォレット", missionCoins: "ミッションコイン", memory: "ミッションメモリー", familyWorkspace: "家族ワークスペース", groupWorkspace: "グループワークスペース", businessWorkspace: "ビジネスワークスペース", enterpriseWorkspace: "企業ワークスペース", oneMax: "ONE Max", save: "保存", cancel: "キャンセル", continue: "続ける", back: "戻る", close: "閉じる", optional: "任意", required: "必須", loading: "読み込み中", error: "問題が発生しました", retry: "再試行", accessibility: "アクセシビリティ", safetyNotice: "安全に関する案内", paymentSummary: "支払い概要", refundExplanation: "返金案内", integrationStatus: "連携状態", founderAlpha: "Founder Alpha", noExternalExecution: "明確な承認なしに予約、購入、支払い、提出、署名、提供者への共有は行われません。", followMyLocation: "現在地に合わせる", autoDetectLanguage: "言語を自動検出", languageOverride: "手動言語設定", providerUnavailable: "提供者を利用できません", setupRequired: "設定が必要です"
  },
  es: {
    languageName: "Español", theme: "Tema", language: "Idioma", upgrade: "Mejorar plan", login: "Iniciar sesión", settings: "Configuración", partners: "Socios", business: "Empresas", developers: "Desarrolladores", poweredBy: "Desarrollado por Kastiz", privacy: "Privacidad", terms: "Términos", account: "Cuenta", profile: "Perfil", subscriptions: "Suscripciones", wallet: "Cartera", missionCoins: "Monedas de misión", memory: "Memoria de misiones", familyWorkspace: "Espacio familiar", groupWorkspace: "Espacio de grupo", businessWorkspace: "Espacio empresarial", enterpriseWorkspace: "Espacio corporativo", oneMax: "ONE Max", save: "Guardar", cancel: "Cancelar", continue: "Continuar", back: "Atrás", close: "Cerrar", optional: "Opcional", required: "Obligatorio", loading: "Cargando", error: "Algo salió mal", retry: "Intentar de nuevo", accessibility: "Accesibilidad", safetyNotice: "Aviso de seguridad", paymentSummary: "Resumen de pago", refundExplanation: "Explicación del reembolso", integrationStatus: "Estado de integración", founderAlpha: "Founder Alpha", noExternalExecution: "Nada se reserva, compra, paga, envía, firma ni comparte con un proveedor sin tu aprobación explícita.", followMyLocation: "Seguir mi ubicación actual", autoDetectLanguage: "Idioma automático", languageOverride: "Idioma manual", providerUnavailable: "Proveedor no disponible", setupRequired: "Configuración requerida"
  }
};

common.fr = { ...common.en, languageName: "Français", theme: "Thème", language: "Langue", upgrade: "Améliorer", login: "Connexion", settings: "Paramètres", save: "Enregistrer", cancel: "Annuler", continue: "Continuer", back: "Retour", close: "Fermer", optional: "Optionnel", required: "Obligatoire", loading: "Chargement", error: "Un problème est survenu", retry: "Réessayer", followMyLocation: "Suivre ma position actuelle", autoDetectLanguage: "Langue automatique", languageOverride: "Langue manuelle", setupRequired: "Configuration requise", providerUnavailable: "Fournisseur indisponible" };
common.de = { ...common.en, languageName: "Deutsch", theme: "Design", language: "Sprache", upgrade: "Upgrade", login: "Anmelden", settings: "Einstellungen", save: "Speichern", cancel: "Abbrechen", continue: "Weiter", back: "Zurück", close: "Schließen", optional: "Optional", required: "Erforderlich", loading: "Wird geladen", error: "Etwas ist schiefgelaufen", retry: "Erneut versuchen", followMyLocation: "Meinem aktuellen Standort folgen", autoDetectLanguage: "Automatische Sprache", languageOverride: "Manuelle Sprache", setupRequired: "Einrichtung erforderlich", providerUnavailable: "Anbieter nicht verfügbar" };
common.it = { ...common.en, languageName: "Italiano", theme: "Tema", language: "Lingua", upgrade: "Upgrade", login: "Accedi", settings: "Impostazioni", save: "Salva", cancel: "Annulla", continue: "Continua", back: "Indietro", close: "Chiudi", optional: "Opzionale", required: "Obbligatorio", loading: "Caricamento", error: "Si è verificato un problema", retry: "Riprova", followMyLocation: "Segui la mia posizione attuale", autoDetectLanguage: "Lingua automatica", languageOverride: "Lingua manuale", setupRequired: "Configurazione richiesta", providerUnavailable: "Provider non disponibile" };
common.pt = { ...common.en, languageName: "Português", theme: "Tema", language: "Idioma", upgrade: "Upgrade", login: "Entrar", settings: "Configurações", save: "Salvar", cancel: "Cancelar", continue: "Continuar", back: "Voltar", close: "Fechar", optional: "Opcional", required: "Obrigatório", loading: "Carregando", error: "Algo deu errado", retry: "Tentar novamente", followMyLocation: "Seguir minha localização atual", autoDetectLanguage: "Idioma automático", languageOverride: "Idioma manual", setupRequired: "Configuração necessária", providerUnavailable: "Provedor indisponível" };
common["zh-Hans"] = { ...common.en, languageName: "中文（简体）", theme: "主题", language: "语言", upgrade: "升级", login: "登录", settings: "设置", save: "保存", cancel: "取消", continue: "继续", back: "返回", close: "关闭", optional: "可选", required: "必填", loading: "加载中", error: "出现问题", retry: "重试", followMyLocation: "跟随我的当前位置", autoDetectLanguage: "自动语言", languageOverride: "手动语言", setupRequired: "需要设置", providerUnavailable: "服务商不可用" };
common["zh-Hant"] = { ...common.en, languageName: "中文（繁體）", theme: "主題", language: "語言", upgrade: "升級", login: "登入", settings: "設定", save: "儲存", cancel: "取消", continue: "繼續", back: "返回", close: "關閉", optional: "選用", required: "必填", loading: "載入中", error: "發生問題", retry: "重試", followMyLocation: "跟隨我的目前位置", autoDetectLanguage: "自動語言", languageOverride: "手動語言", setupRequired: "需要設定", providerUnavailable: "服務提供者無法使用" };

const home = {
  en: { description: "Kastiz ONE structures real-world goals into approval-ready missions.", siteNavigation: "Kastiz ONE navigation", preferences: "Preferences", themeLabel: "Theme", languageLabel: "Language", loginWelcome: "Welcome to Kastiz ONE", loginComingSoon: "Account access is being released gradually.", loginPriority: "Join early access or request an invitation.", joinEarlyAccess: "Join Early Access", requestInvitation: "Request Invitation", contactSupport: "Contact Support", notifyMe: "Notify Me", notifyConfirmed: "You're on the priority list.", scheduleTitle: "Choose dates and time", scheduleHelp: "Select the required date range. Time is optional.", startDate: "Start date", endDate: "End date", timePreference: "Time preference", anyTime: "Any time / No preference", morning: "Morning · 06:00–12:00", afternoon: "Afternoon · 12:00–17:00", evening: "Evening · 17:00–22:00", confirmSchedule: "Confirm and Continue", searchLabel: "Enter your mission", searchDefault: "Plan my Japan trip.", missionTools: "Mission tools", microphone: "Use microphone", uploadImage: "Upload image", aiPowered: "AI powered", startMission: "Start mission", footer: "Footer", unknownLocation: "Unknown Location", travelerCount: "Travelers", roomCount: "Rooms", departureAirport: "Departure airport", missions: ["Plan my Japan trip.", "Find an English tutor.", "Recommend the best laptop.", "Help me start a business."] },
  ko: { description: "Kastiz ONE은 현실의 목표를 승인 가능한 미션으로 정리합니다.", siteNavigation: "Kastiz ONE 내비게이션", preferences: "환경설정", themeLabel: "테마", languageLabel: "언어", loginWelcome: "Kastiz ONE에 오신 것을 환영합니다", loginComingSoon: "계정 기능을 순차적으로 제공하고 있습니다.", loginPriority: "얼리 액세스 또는 초대를 요청하세요.", joinEarlyAccess: "얼리 액세스 참여", requestInvitation: "초대 요청", contactSupport: "고객 지원", notifyMe: "알림 신청", notifyConfirmed: "우선 알림 목록에 등록되었습니다.", scheduleTitle: "날짜와 시간을 선택하세요", scheduleHelp: "필요한 날짜 범위를 선택하세요. 시간은 선택 사항입니다.", startDate: "시작 날짜", endDate: "종료 날짜", timePreference: "선호 시간", anyTime: "시간 무관 / 선호 없음", morning: "오전 · 06:00–12:00", afternoon: "오후 · 12:00–17:00", evening: "저녁 · 17:00–22:00", confirmSchedule: "확인 후 계속", searchLabel: "미션 입력", searchDefault: "일본 여행 계획해줘", missionTools: "미션 도구", microphone: "마이크 사용", uploadImage: "이미지 업로드", aiPowered: "AI 기능", startMission: "미션 시작", footer: "푸터", unknownLocation: "알 수 없는 위치", travelerCount: "여행 인원", roomCount: "객실 수", departureAirport: "출발 공항", missions: ["일본 여행 계획해줘", "영어 선생님 찾아줘", "좋은 노트북 추천해줘", "사업 시작을 도와줘"] },
  ja: { searchDefault: "日本旅行を計画して", searchLabel: "ミッションを入力", languageLabel: "言語", themeLabel: "テーマ", scheduleTitle: "日付と時間を選択", confirmSchedule: "確認して続ける", unknownLocation: "不明な場所", travelerCount: "旅行人数", roomCount: "客室数", departureAirport: "出発空港", missions: ["日本旅行を計画して", "英語講師を探して", "最適なノートPCをすすめて", "起業を手伝って"] },
  es: { description: "Kastiz ONE convierte objetivos reales en misiones listas para tu aprobación.", siteNavigation: "Navegación de Kastiz ONE", preferences: "Preferencias", themeLabel: "Tema", languageLabel: "Idioma", loginWelcome: "Te damos la bienvenida a Kastiz ONE", loginComingSoon: "El acceso a cuentas se está habilitando gradualmente.", loginPriority: "Únete al acceso anticipado o solicita una invitación.", joinEarlyAccess: "Unirme al acceso anticipado", requestInvitation: "Solicitar invitación", contactSupport: "Contactar con soporte", notifyMe: "Avísame", notifyConfirmed: "Estás en la lista prioritaria.", scheduleTitle: "Elige fechas y horario", scheduleHelp: "Selecciona las fechas necesarias. El horario es opcional.", startDate: "Fecha de inicio", endDate: "Fecha de fin", timePreference: "Horario preferido", anyTime: "Cualquier hora / Sin preferencia", morning: "Mañana · 06:00–12:00", afternoon: "Tarde · 12:00–17:00", evening: "Noche · 17:00–22:00", confirmSchedule: "Confirmar y continuar", searchLabel: "Escribe tu misión", searchDefault: "Planea mi viaje a Japón.", missionTools: "Herramientas de misión", microphone: "Usar micrófono", uploadImage: "Subir imagen", aiPowered: "Con tecnología de IA", startMission: "Iniciar misión", footer: "Pie de página", unknownLocation: "Ubicación desconocida", travelerCount: "Viajeros", roomCount: "Habitaciones", departureAirport: "Aeropuerto de salida", missions: ["Planea mi viaje a Japón.", "Encuentra un profesor de inglés.", "Recomiéndame el mejor portátil.", "Ayúdame a iniciar un negocio."] }
};

home.fr = { ...home.en, searchDefault: "Planifie mon voyage au Japon.", searchLabel: "Saisissez votre mission", languageLabel: "Langue", themeLabel: "Thème", confirmSchedule: "Confirmer et continuer", missions: ["Planifie mon voyage au Japon.", "Trouve un professeur d'anglais.", "Recommande le meilleur ordinateur portable.", "Aide-moi à créer une entreprise."] };
home.de = { ...home.en, searchDefault: "Plane meine Japanreise.", searchLabel: "Mission eingeben", languageLabel: "Sprache", themeLabel: "Design", confirmSchedule: "Bestätigen und weiter", missions: ["Plane meine Japanreise.", "Finde einen Englischlehrer.", "Empfiehl mir den besten Laptop.", "Hilf mir, ein Unternehmen zu gründen."] };
home.it = { ...home.en, searchDefault: "Organizza il mio viaggio in Giappone.", searchLabel: "Inserisci la missione", languageLabel: "Lingua", themeLabel: "Tema", confirmSchedule: "Conferma e continua", missions: ["Organizza il mio viaggio in Giappone.", "Trova un insegnante di inglese.", "Consigliami il miglior laptop.", "Aiutami ad avviare un'attività."] };
home.pt = { ...home.en, searchDefault: "Planeje minha viagem ao Japão.", searchLabel: "Digite sua missão", languageLabel: "Idioma", themeLabel: "Tema", confirmSchedule: "Confirmar e continuar", missions: ["Planeje minha viagem ao Japão.", "Encontre um professor de inglês.", "Recomende o melhor notebook.", "Ajude-me a abrir um negócio."] };
home["zh-Hans"] = { ...home.en, searchDefault: "帮我规划日本旅行。", searchLabel: "输入你的任务", languageLabel: "语言", themeLabel: "主题", confirmSchedule: "确认并继续", missions: ["帮我规划日本旅行。", "帮我找英语老师。", "推荐最适合的笔记本电脑。", "帮我创业。"] };
home["zh-Hant"] = { ...home.en, searchDefault: "幫我規劃日本旅行。", searchLabel: "輸入你的任務", languageLabel: "語言", themeLabel: "主題", confirmSchedule: "確認並繼續", missions: ["幫我規劃日本旅行。", "幫我找英文老師。", "推薦最適合的筆電。", "幫我創業。"] };

const results = {
  en: { missionReady: "Mission Ready", preparedByOne: "Prepared by ONE", customize: "Customize", makeItReality: "Approve & Proceed", withOne: "with ONE", withOnePrefix: "with", withOneSuffix: "", revisionTitle: "Anything you’d like ONE to change or add?", revisionLabel: "Mission revision command", revisionPlaceholder: "Add a musical, reduce the budget, change the hotel area…", revisionSend: "Send", revisionLoading: "ONE is updating the mission…", revisionComplete: "Mission updated.", revisionError: "ONE could not apply that change. Try a more specific instruction.", missionApproved: "Mission Approved", oneIsWorking: "ONE is preparing the approved outcome.", finalMessage: "ONE'D", returnHomeNow: "HOME", recommended: "⭐ ONE Pick", reason: "Reason:", otherOptions: "Other options:", modify: "Modify", weather: "Weather", exchangeRate: "Exchange Rate", visa: "Visa", approvalProtectionTitle: "Approval Protection", approvalProtection: common.en.noExternalExecution, executionSteps: ["Preparing flight options...", "Preparing accommodation...", "Preparing checklist...", "Preparing local options...", "Preparing transport...", "Finalizing your mission..."] },
  ko: { missionReady: "미션 준비 완료", preparedByOne: "ONE이 준비했습니다.", customize: "맞춤 설정", makeItReality: "승인 후 실행", withOne: "ONE과 함께", withOnePrefix: "", withOneSuffix: "과 함께", revisionTitle: "ONE이 변경하거나 추가할 내용이 있나요?", revisionLabel: "미션 수정 명령", revisionPlaceholder: "뮤지컬 추가, 예산 축소, 호텔 지역 변경…", revisionSend: "보내기", revisionLoading: "ONE이 미션을 업데이트하고 있어요…", revisionComplete: "미션을 업데이트했습니다.", revisionError: "변경 내용을 적용하지 못했습니다. 조금 더 구체적으로 알려주세요.", missionApproved: "미션 승인 완료", oneIsWorking: "ONE이 승인된 결과를 준비하고 있습니다.", finalMessage: "ONE'D", returnHomeNow: "HOME", recommended: "⭐ ONE Pick", reason: "선정 이유:", otherOptions: "다른 옵션:", modify: "수정", weather: "날씨", exchangeRate: "환율", visa: "비자", approvalProtectionTitle: "승인 보호", approvalProtection: common.ko.noExternalExecution, executionSteps: ["항공편 준비 중...", "숙박 준비 중...", "체크리스트 준비 중...", "현지 옵션 준비 중...", "교통 준비 중...", "미션 최종 정리 중..."] },
  ja: { missionReady: "ミッション準備完了", preparedByOne: "ONEが準備しました。", customize: "カスタマイズ", makeItReality: "承認して進む", withOne: "ONEと一緒に", revisionTitle: "ONEに変更または追加してほしいことはありますか？", revisionSend: "送信", revisionComplete: "ミッションを更新しました。", recommended: "⭐ ONE Pick", reason: "理由:", otherOptions: "他の選択肢:", modify: "変更", weather: "天気", exchangeRate: "為替レート", visa: "ビザ", approvalProtectionTitle: "承認保護", approvalProtection: common.ja.noExternalExecution },
  es: { missionReady: "Misión lista", preparedByOne: "Preparado por ONE", customize: "Personalizar", makeItReality: "Aprobar y continuar", withOne: "con ONE", withOnePrefix: "con", withOneSuffix: "", revisionTitle: "¿Quieres que ONE cambie o añada algo?", revisionLabel: "Comando de revisión de la misión", revisionPlaceholder: "Añade un musical, reduce el presupuesto, cambia la zona del hotel…", revisionSend: "Enviar", revisionLoading: "ONE está actualizando la misión…", revisionComplete: "Misión actualizada.", revisionError: "ONE no pudo aplicar ese cambio. Prueba una instrucción más específica.", missionApproved: "Misión aprobada", oneIsWorking: "ONE está preparando el resultado aprobado.", finalMessage: "ONE'D", returnHomeNow: "INICIO", recommended: "⭐ ONE Pick", reason: "Motivo:", otherOptions: "Otras opciones:", modify: "Modificar", weather: "Clima", exchangeRate: "Tipo de cambio", visa: "Visado", approvalProtectionTitle: "Protección de aprobación", approvalProtection: common.es.noExternalExecution, executionSteps: ["Preparando opciones de vuelo...", "Preparando alojamiento...", "Preparando la lista...", "Preparando opciones locales...", "Preparando transporte...", "Finalizando tu misión..."] }
};

results.fr = {
  ...results.en,
  missionReady: "Mission prête", preparedByOne: "Préparée par ONE", customize: "Personnaliser", makeItReality: "Approuver et continuer",
  withOne: "avec ONE", withOnePrefix: "avec", withOneSuffix: "",
  revisionTitle: "Souhaitez-vous que ONE modifie ou ajoute quelque chose ?", revisionLabel: "Instruction de modification de la mission",
  revisionPlaceholder: "Ajoutez un spectacle, réduisez le budget, changez le quartier de l’hôtel…", revisionSend: "Envoyer",
  revisionLoading: "ONE met à jour la mission…", revisionComplete: "Mission mise à jour.",
  revisionError: "ONE n’a pas pu appliquer cette modification. Essayez une instruction plus précise.",
  missionApproved: "Mission approuvée", oneIsWorking: "ONE prépare le résultat approuvé.", returnHomeNow: "ACCUEIL",
  reason: "Pourquoi :", otherOptions: "Autres options :", modify: "Modifier", weather: "Météo", exchangeRate: "Taux de change", visa: "Visa",
  approvalProtectionTitle: "Protection de l’approbation",
  approvalProtection: "Aucune réservation, aucun achat, paiement, envoi, signature ni partage avec un fournisseur n’est effectué sans votre approbation explicite.",
  executionSteps: ["Préparation des vols…", "Préparation de l’hébergement…", "Préparation de la liste de contrôle…", "Préparation des options locales…", "Préparation du transport…", "Finalisation de votre mission…"]
};

for (const locale of ["de", "it", "pt", "zh-Hans", "zh-Hant"]) {
  results[locale] = { ...results.en, approvalProtection: common[locale].noExternalExecution, weather: common[locale].language === "Langue" ? "Météo" : results.en.weather };
}

export const LOCALE_RESOURCES = Object.freeze(Object.fromEntries(OFFICIAL_LOCALES.map((locale) => [locale, Object.freeze({
  common: Object.freeze({ ...common.en, ...common[locale], languages: LANGUAGE_LABELS, themes: themeLabels[locale] || themeLabels.en }),
  home: Object.freeze({ ...home.en, ...home[locale] }),
  results: Object.freeze({ ...results.en, ...results[locale] })
})])));

export function normalizeInterfaceLocale(value, fallback = "en") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  const lower = text.toLowerCase();
  if (["zh-cn", "zh-sg", "zh-hans", "zh"].includes(lower)) return "zh-Hans";
  if (["zh-tw", "zh-hk", "zh-mo", "zh-hant"].includes(lower)) return "zh-Hant";
  const base = lower.split("-")[0];
  const matched = OFFICIAL_LOCALES.find((locale) => locale.toLowerCase() === lower || locale.toLowerCase() === base);
  return matched || fallback;
}

export function localeSection(locale, section) {
  const normalized = normalizeInterfaceLocale(locale);
  const englishSection = LOCALE_RESOURCES.en?.[section] || {};
  const localizedResource = LOCALE_RESOURCES[normalized] || LOCALE_RESOURCES.en;
  const localizedCommon = localizedResource?.common || {};
  const localizedSection = localizedResource?.[section] || {};
  return {
    ...LOCALE_RESOURCES.en.common,
    ...englishSection,
    ...localizedCommon,
    ...localizedSection,
    themes: themeLabels[normalized] || themeLabels.en,
    languages: LANGUAGE_LABELS,
    locale: normalized,
    fallbackLocale: localizedResource === LOCALE_RESOURCES.en && normalized !== "en" ? "en" : null
  };
}

export function localeDateTimeOptions(locale) {
  const normalized = normalizeInterfaceLocale(locale);
  return {
    locale: LOCALE_VARIANTS[normalized]?.[0] || "en-US",
    direction: RTL_READY_LOCALES.includes(normalized) ? "rtl" : "ltr",
    weekStartsOn: ["en"].includes(normalized) ? 0 : 1,
    hourCycle: ["en"].includes(normalized) ? "h12" : "h23",
    measurementSystem: normalized === "en" ? "mixed" : "metric"
  };
}

export function validateLocaleParity() {
  const commonKeys = Object.keys(LOCALE_RESOURCES.en.common).sort().join("|");
  return OFFICIAL_LOCALES.every((locale) => Object.keys(LOCALE_RESOURCES[locale].common).sort().join("|") === commonKeys);
}
