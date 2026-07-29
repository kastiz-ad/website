import {
  PERSONAL_MISSION_MEMORY_CATEGORIES,
  applyPersonalMissionMemory,
  clearPersonalMissionMemory,
  deleteMissionMemory,
  disableMissionMemory,
  editMissionMemory,
  exportPersonalMissionMemory,
  isSensitiveMissionMemory,
  readPersonalMissionMemoryFromBrowser,
  rememberMissionPreference,
  seedFounderPreviewMemory,
  writePersonalMissionMemoryToBrowser
} from "./js/profile/personal-mission-memory-alpha07.js?v=20260729-alpha07-personal-mission-memory";

const $ = (selector) => document.querySelector(selector);
const groups = $("#memoryGroups");
const search = $("#memorySearch");
const form = $("#memoryForm");
const status = $("#memoryStatus");
const languageButton = $("#languageButton");
const categorySelect = form.elements.category;

let language = localStorage.getItem("kastiz-one-language") || "en";
if (!["en", "ko", "es"].includes(language)) language = "en";

const copy = {
  en: {
    results: "Results",
    title: "ONE remembers what helps, not everything.",
    intro: "Mission memory stores useful preferences only, so future missions need fewer repeated questions.",
    safety: "No passwords, payment credentials, passport numbers, identity numbers, medical records, private conversations, or authentication secrets are stored here.",
    search: "Search memory",
    seed: "Load founder preview",
    export: "Export",
    clear: "Clear all",
    addEyebrow: "ADD MEMORY",
    addTitle: "Save a useful mission preference",
    addCopy: "Add only something you want ONE to use later. Sensitive data will be rejected.",
    category: "Category",
    key: "Preference type",
    value: "Preference",
    save: "Remember",
    disabled: "Disabled",
    confidence: "Confidence",
    source: "Source",
    lastConfirmed: "Last confirmed",
    why: "Why it exists",
    how: "How it is used",
    edit: "Edit",
    disable: "Disable",
    delete: "Delete",
    empty: "No personal mission memories yet.",
    saved: "Memory saved.",
    sensitive: "That looks sensitive, so ONE did not save it.",
    exported: "Memory export copied to clipboard.",
    cleared: "All personal mission memory cleared.",
    preview: "Founder preview memory loaded.",
    deleted: "Memory deleted.",
    disabledStatus: "Memory disabled.",
    edited: "Memory edited."
  },
  ko: {
    results: "결과",
    title: "ONE은 도움이 되는 것만 기억합니다.",
    intro: "미션 기억은 유용한 선호만 저장해서 다음 미션의 반복 질문을 줄입니다.",
    safety: "비밀번호, 결제 정보, 여권 번호, 신분 번호, 의료 기록, 사적인 대화, 인증 비밀은 여기에 저장하지 않습니다.",
    search: "기억 검색",
    seed: "창업자 미리보기 불러오기",
    export: "내보내기",
    clear: "전체 삭제",
    addEyebrow: "기억 추가",
    addTitle: "유용한 미션 선호 저장",
    addCopy: "나중에 ONE이 사용해도 되는 내용만 추가하세요. 민감 정보는 거부됩니다.",
    category: "카테고리",
    key: "선호 유형",
    value: "선호 내용",
    save: "기억하기",
    disabled: "비활성화",
    confidence: "확신도",
    source: "출처",
    lastConfirmed: "최근 확인",
    why: "존재 이유",
    how: "사용 방식",
    edit: "수정",
    disable: "비활성화",
    delete: "삭제",
    empty: "아직 개인 미션 기억이 없습니다.",
    saved: "기억을 저장했습니다.",
    sensitive: "민감 정보로 보여 저장하지 않았습니다.",
    exported: "기억 내보내기를 클립보드에 복사했습니다.",
    cleared: "개인 미션 기억을 모두 삭제했습니다.",
    preview: "창업자 미리보기 기억을 불러왔습니다.",
    deleted: "기억을 삭제했습니다.",
    disabledStatus: "기억을 비활성화했습니다.",
    edited: "기억을 수정했습니다."
  },
  es: {
    results: "Resultados",
    title: "ONE recuerda lo que ayuda, no todo.",
    intro: "La memoria de misiones guarda solo preferencias útiles para reducir preguntas repetidas.",
    safety: "No se guardan contraseñas, pagos, pasaportes, documentos, historiales médicos, conversaciones privadas ni secretos de autenticación.",
    search: "Buscar memoria",
    seed: "Cargar vista fundador",
    export: "Exportar",
    clear: "Borrar todo",
    addEyebrow: "AÑADIR MEMORIA",
    addTitle: "Guardar una preferencia útil",
    addCopy: "Añade solo algo que quieres que ONE use después. Los datos sensibles serán rechazados.",
    category: "Categoría",
    key: "Tipo de preferencia",
    value: "Preferencia",
    save: "Recordar",
    disabled: "Desactivada",
    confidence: "Confianza",
    source: "Fuente",
    lastConfirmed: "Última confirmación",
    why: "Por qué existe",
    how: "Cómo se usa",
    edit: "Editar",
    disable: "Desactivar",
    delete: "Eliminar",
    empty: "Aún no hay memoria personal de misiones.",
    saved: "Memoria guardada.",
    sensitive: "Parece sensible, así que ONE no lo guardó.",
    exported: "Exportación copiada al portapapeles.",
    cleared: "Toda la memoria personal fue borrada.",
    preview: "Memoria de vista fundador cargada.",
    deleted: "Memoria eliminada.",
    disabledStatus: "Memoria desactivada.",
    edited: "Memoria editada."
  }
};

const t = (key) => copy[language]?.[key] || copy.en[key] || key;
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function setStatus(key) {
  status.textContent = t(key);
}

function syncCopy() {
  document.querySelectorAll("[data-copy]").forEach((node) => {
    node.textContent = t(node.dataset.copy);
  });
  languageButton.textContent = language === "en" ? "한국어" : language === "ko" ? "Español" : "English";
  search.placeholder = language === "ko" ? "항공사, 호텔, 음식..." : language === "es" ? "aerolínea, hotel, comida..." : "airline, hotel, food...";
  categorySelect.innerHTML = PERSONAL_MISSION_MEMORY_CATEGORIES.map((category) => `<option value="${category}">${escapeHtml(category)}</option>`).join("");
}

function currentMemory() {
  return readPersonalMissionMemoryFromBrowser();
}

function saveMemory(memory) {
  writePersonalMissionMemoryToBrowser(memory);
  render();
}

function render() {
  const memory = currentMemory();
  const q = search.value.trim().toLowerCase();
  const exported = exportPersonalMissionMemory(memory, { language });
  const rows = exported.records.filter((record) => !q || JSON.stringify(record).toLowerCase().includes(q));
  if (!rows.length) {
    groups.innerHTML = `<div class="empty-state">${escapeHtml(t("empty"))}</div>`;
    return;
  }
  const byCategory = new Map();
  for (const row of rows) {
    if (!byCategory.has(row.categoryLabel)) byCategory.set(row.categoryLabel, []);
    byCategory.get(row.categoryLabel).push(row);
  }
  groups.innerHTML = [...byCategory.entries()].map(([category, records]) => `
    <section class="memory-category">
      <h2>${escapeHtml(category)}</h2>
      ${records.map((record) => `
        <article class="memory-card" data-memory-id="${escapeHtml(record.id)}">
          <div class="memory-card-head">
            <div>
              <strong>${escapeHtml(record.key)}</strong>
              ${record.enabled ? "" : `<span class="memory-disabled">${escapeHtml(t("disabled"))}</span>`}
            </div>
            <div class="memory-meta">
              <span>${escapeHtml(t("confidence"))}: ${Math.round(record.confidence * 100)}%</span>
              <span>${escapeHtml(t("source"))}: ${escapeHtml(record.source)}</span>
            </div>
          </div>
          <div class="memory-value">${escapeHtml(record.value)}</div>
          <p><strong>${escapeHtml(t("why"))}:</strong> ${escapeHtml(record.whyExists)}</p>
          <small><strong>${escapeHtml(t("how"))}:</strong> ${escapeHtml(record.howUsed)}</small>
          <small>${escapeHtml(t("lastConfirmed"))}: ${escapeHtml(record.lastConfirmedAt || "—")}</small>
          <div class="memory-actions">
            <button type="button" data-action="edit">${escapeHtml(t("edit"))}</button>
            <button type="button" data-action="disable">${escapeHtml(t("disable"))}</button>
            <button type="button" class="danger" data-action="delete">${escapeHtml(t("delete"))}</button>
          </div>
        </article>
      `).join("")}
    </section>
  `).join("");
}

syncCopy();
render();

languageButton.addEventListener("click", () => {
  language = language === "en" ? "ko" : language === "ko" ? "es" : "en";
  localStorage.setItem("kastiz-one-language", language);
  syncCopy();
  render();
});

search.addEventListener("input", render);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  if (isSensitiveMissionMemory({ category: data.category, key: data.key, value: data.value })) {
    setStatus("sensitive");
    return;
  }
  const result = rememberMissionPreference(currentMemory(), {
    category: data.category,
    key: data.key,
    value: data.value,
    language,
    source: "explicit_user_preference",
    whyExists: "Saved because you explicitly added this preference.",
    howUsed: "Used to reduce repeated questions and improve future mission recommendations."
  }, { confirm: true });
  saveMemory(result.memory);
  form.reset();
  setStatus("saved");
});

groups.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const card = button.closest("[data-memory-id]");
  const id = card?.dataset.memoryId;
  if (!id) return;
  let memory = currentMemory();
  if (button.dataset.action === "delete") {
    saveMemory(deleteMissionMemory(memory, id));
    setStatus("deleted");
    return;
  }
  if (button.dataset.action === "disable") {
    saveMemory(disableMissionMemory(memory, id));
    setStatus("disabledStatus");
    return;
  }
  if (button.dataset.action === "edit") {
    const record = exportPersonalMissionMemory(memory, { language }).records.find((row) => row.id === id);
    const next = prompt(t("value"), record?.value || "");
    if (next === null) return;
    if (isSensitiveMissionMemory({ category: record.category, key: record.key, value: next })) {
      setStatus("sensitive");
      return;
    }
    saveMemory(editMissionMemory(memory, id, { value: next, language }));
    setStatus("edited");
  }
});

$("#seedPreview").addEventListener("click", () => {
  saveMemory(seedFounderPreviewMemory());
  setStatus("preview");
});

$("#clearMemory").addEventListener("click", () => {
  saveMemory(clearPersonalMissionMemory());
  setStatus("cleared");
});

$("#exportMemory").addEventListener("click", async () => {
  const text = JSON.stringify(exportPersonalMissionMemory(currentMemory(), { language }), null, 2);
  try {
    await navigator.clipboard.writeText(text);
    setStatus("exported");
  } catch {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kastiz-one-personal-mission-memory.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("exported");
  }
});
