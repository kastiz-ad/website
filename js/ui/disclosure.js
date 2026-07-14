export const DISCLOSURE_VERSION = "1.0";
export const DISCLOSURE_VERSION_KEY = "kastiz-one-disclosure-version";
export const DISCLOSURE_ACK_KEY = "kastiz-one-disclosure-acknowledgement";

const copy = {
  en: {
    title: "Before ONE prepares your mission",
    body: [
      "ONE can organize options, prepare recommendations and guide the next steps for your mission.",
      "Some information may come from public data, AI-generated recommendations or prototype provider integrations.",
      "Nothing will be booked, purchased, paid, reserved, signed, submitted or shared with a provider until you explicitly approve it."
    ],
    understand: "I understand",
    cancel: "Cancel",
    privacy: "Privacy",
    terms: "Terms",
    how: "How ONE Works",
    close: "Close"
  },
  ko: {
    title: "ONE이 미션을 준비하기 전에",
    body: [
      "ONE은 사용자의 미션에 필요한 선택지와 추천 결과, 다음 단계를 준비합니다.",
      "일부 정보는 공개 데이터, AI 생성 추천 또는 프로토타입 제공업체 연동을 기반으로 제공될 수 있습니다.",
      "사용자가 명시적으로 승인하기 전에는 예약, 구매, 결제, 서명, 제출 또는 제공업체와의 정보 공유가 진행되지 않습니다."
    ],
    understand: "확인했습니다",
    cancel: "취소",
    privacy: "개인정보",
    terms: "이용약관",
    how: "ONE 작동 방식",
    close: "닫기"
  }
};

const getDialog = () => {
  let dialog = document.getElementById("missionDisclosureDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "missionDisclosureDialog";
    dialog.className = "mission-disclosure-modal";
    dialog.setAttribute("aria-labelledby", "missionDisclosureTitle");
    document.body.append(dialog);
  }
  return dialog;
};

export const hasCurrentDisclosureAcknowledgement = () => localStorage.getItem(DISCLOSURE_VERSION_KEY) === DISCLOSURE_VERSION;

export function ensureDisclosureAcknowledged({ language = "en", restoreFocusTo, onAcknowledge, onCancel }) {
  if (hasCurrentDisclosureAcknowledgement()) {
    onAcknowledge?.();
    return;
  }

  const strings = copy[language === "ko" ? "ko" : "en"];
  const dialog = getDialog();
  dialog.innerHTML = `<form method="dialog" class="mission-disclosure-content">
    <button class="schedule-modal-close" type="submit" value="cancel" aria-label="${strings.close}">×</button>
    <p class="login-modal-kicker">KASTIZ ONE</p>
    <h2 id="missionDisclosureTitle">${strings.title}</h2>
    <div class="mission-disclosure-copy">${strings.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div>
    <button class="schedule-confirm" type="submit" value="acknowledge">${strings.understand}</button>
    <button class="mission-disclosure-cancel" type="submit" value="cancel">${strings.cancel}</button>
    <nav class="mission-disclosure-links" aria-label="Kastiz ONE information"><a href="privacy.html">${strings.privacy}</a><a href="terms.html">${strings.terms}</a><a href="how-one-works.html">${strings.how}</a></nav>
  </form>`;

  document.body.classList.add("modal-open");
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    if (dialog.returnValue === "acknowledge") {
      const acknowledgement = { version: DISCLOSURE_VERSION, acknowledgedAt: new Date().toISOString(), language: language === "ko" ? "ko" : "en" };
      localStorage.setItem(DISCLOSURE_VERSION_KEY, DISCLOSURE_VERSION);
      localStorage.setItem(DISCLOSURE_ACK_KEY, JSON.stringify(acknowledgement));
      onAcknowledge?.();
    } else {
      onCancel?.();
      restoreFocusTo?.focus();
    }
  }, { once: true });
  dialog.showModal();
  dialog.querySelector('[value="acknowledge"]')?.focus();
}
