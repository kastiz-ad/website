const clampInteger = (value, min, max) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : null;
};

const WORD_NUMBERS = Object.freeze({
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5, 여섯: 6, 일곱: 7
});

const numberValue = (value) => clampInteger(/^\d+$/.test(value) ? value : WORD_NUMBERS[value.toLocaleLowerCase()], 1, 30);

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addLocalDays = (date, days) => {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
};

const MONTH_NAMES = Object.freeze([
  [0, ["january", "jan", "enero"]], [1, ["february", "feb", "febrero"]],
  [2, ["march", "mar", "marzo"]], [3, ["april", "apr", "abril"]],
  [4, ["may", "mayo"]], [5, ["june", "jun", "junio"]],
  [6, ["july", "jul", "julio"]], [7, ["august", "aug", "agosto"]],
  [8, ["september", "sep", "sept", "septiembre", "setiembre"]],
  [9, ["october", "oct", "octubre"]], [10, ["november", "nov", "noviembre"]],
  [11, ["december", "dec", "diciembre"]]
]);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const validLocalIsoDate = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
};

const inclusiveDaySpan = (startDate, endDate) => {
  const start = validLocalIsoDate(startDate);
  const end = validLocalIsoDate(endDate);
  if (!start || !end || end < start) return null;
  return clampInteger(Math.round((end - start) / 86400000) + 1, 1, 30);
};

const parseExplicitMonth = (text) => {
  const normalized = String(text || "").normalize("NFKC").toLocaleLowerCase();
  const korean = normalized.match(/(?:(20\d{2})\s*년\s*)?(1[0-2]|[1-9])\s*월/u);
  if (korean) return { monthIndex: Number(korean[2]) - 1, explicitYear: korean[1] ? Number(korean[1]) : null, label: `${korean[2]}월` };
  for (const [monthIndex, names] of MONTH_NAMES) {
    const match = normalized.match(new RegExp(`\\b(${names.map(escapeRegex).join("|")})\\b(?:\\s+(?:of\\s+|de\\s+)?(20\\d{2}))?`, "iu"));
    if (match) return { monthIndex, explicitYear: match[2] ? Number(match[2]) : null, label: match[1] };
  }
  return null;
};

const parseDuration = (text) => {
  const normalized = String(text || "").normalize("NFKC");
  const match = normalized.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s*[- ]?\s*(day|days|night|nights)\b/iu)
    || normalized.match(/\b(\d{1,2}|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*[- ]?\s*(día|días|dia|dias|noche|noches)\b/iu)
    || normalized.match(/(\d{1,2}|한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱)\s*(일|박)/u);
  if (match) {
    const count = numberValue(match[1]);
    const isNights = /night|noche|박/iu.test(match[2]);
    return { durationDays: clampInteger(count + (isNights ? 1 : 0), 1, 30), durationNights: isNights ? count : Math.max(0, count - 1), source: "explicit" };
  }
  if (/\b(?:a|one)\s+week\b|\buna\s+semana\b|일주일|한\s*주/iu.test(normalized)) {
    return { durationDays: 7, durationNights: 6, source: "explicit" };
  }
  return { durationDays: null, durationNights: null, source: "unspecified" };
};

const parseTravelers = (text) => {
  const normalized = String(text || "").normalize("NFKC").toLocaleLowerCase();
  if (/\b(?:my wife|my husband|my partner|my spouse)\s+and\s+me\b|\b(?:mi esposa|mi marido|mi pareja)\s+y\s+yo\b|(?:아내|남편|배우자|여자친구|남자친구)와?\s*(?:나|저)/iu.test(normalized)) return 2;
  if (/\b(?:solo|alone|by myself|viajo solo|viajo sola)\b|혼자|나홀로/iu.test(normalized)) return 1;
  const match = normalized.match(/(?:\bfor\s+|\bpara\s+)(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:people|persons?|travelers?|travellers?|adults?|personas?|viajeros?|adultos?)\b/iu)
    || normalized.match(/(?:\bfor\s+|\bpara\s+)(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)(?=\s*(?:$|[.,!?]))/iu)
    || normalized.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:people|persons?|travelers?|travellers?|adults?|personas?|viajeros?|adultos?)\b/iu)
    || normalized.match(/(\d{1,2}|한|하나|두|둘|세|셋|네|넷|다섯|여섯|일곱)\s*명/u);
  return match ? clampInteger(numberValue(match[1]), 1, 12) : null;
};

const parseDateIntent = (text, now, durationDays) => {
  const normalized = String(text || "").normalize("NFKC");
  if (/\bnext\s+(?:calendar\s+)?month\b|다음\s*달|\b(?:el\s+)?próximo\s+mes\b|\bmes\s+que\s+viene\b/iu.test(normalized)) {
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = durationDays
      ? addLocalDays(start, durationDays - 1)
      : new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { kind: "next_month", label: "next month", startDate: isoDate(start), endDate: isoDate(end), resolvedAt: isoDate(now) };
  }
  const explicitMonth = parseExplicitMonth(normalized);
  if (explicitMonth) {
    const currentYear = now.getFullYear();
    const currentMonthStart = new Date(currentYear, explicitMonth.monthIndex, 1);
    const today = new Date(currentYear, now.getMonth(), now.getDate());
    const year = explicitMonth.explicitYear || (currentMonthStart >= today ? currentYear : currentYear + 1);
    const start = new Date(year, explicitMonth.monthIndex, 1);
    const end = durationDays ? addLocalDays(start, durationDays - 1) : new Date(year, explicitMonth.monthIndex + 1, 0);
    return {
      kind: "explicit_month", label: explicitMonth.label, month: explicitMonth.monthIndex + 1,
      year, explicitYear: Boolean(explicitMonth.explicitYear), startDate: isoDate(start), endDate: isoDate(end), resolvedAt: isoDate(now)
    };
  }
  return null;
};

export function parseTravelConstraints(text, { now = new Date() } = {}) {
  const duration = parseDuration(text);
  const travelerCount = parseTravelers(text);
  const dateIntent = parseDateIntent(text, now, duration.durationDays);
  return { ...duration, travelerCount, dateIntent, startDate: dateIntent?.startDate || null, endDate: dateIntent?.endDate || null };
}

export function applyTravelConstraints(result = {}, text = "", options = {}) {
  const parsed = parseTravelConstraints(text, options);
  const schedule = result.schedule || {};
  const fieldSources = schedule.fieldSources || {};
  const legacyConfirmation = schedule.source === "user_confirmed" || schedule.userConfirmed === true;
  const datesManuallyEdited = fieldSources.startDate === "manual" || fieldSources.endDate === "manual" || (legacyConfirmation && !Object.keys(fieldSources).length);
  const travelersManuallyEdited = fieldSources.travelerCount === "manual" || (legacyConfirmation && !Object.keys(fieldSources).length);
  const confirmedStart = datesManuallyEdited ? schedule.startDate || null : null;
  const confirmedEnd = datesManuallyEdited ? schedule.endDate || null : null;
  const confirmedRangeDays = inclusiveDaySpan(confirmedStart, confirmedEnd);
  const structuredDuration = clampInteger(schedule.durationDays || result.durationDays, 1, 30);
  const structuredTravelers = clampInteger(schedule.travelerCount || schedule.travelers || schedule.adults || result.travelerCount || result.travelers || result.followUp?.answers?.adults, 1, 12);
  const durationDays = (datesManuallyEdited && confirmedRangeDays) || parsed.durationDays || structuredDuration;
  const travelerCount = (travelersManuallyEdited && structuredTravelers) || parsed.travelerCount || structuredTravelers;
  const manualRangeValid = Boolean(confirmedRangeDays);
  const structuredStart = validLocalIsoDate(schedule.startDate) ? schedule.startDate : null;
  const structuredEnd = validLocalIsoDate(schedule.endDate) ? schedule.endDate : null;
  const startDate = (manualRangeValid && confirmedStart) || parsed.startDate || structuredStart || null;
  const preferredEnd = (manualRangeValid && confirmedEnd) || parsed.endDate || structuredEnd || null;
  const preferredSpan = inclusiveDaySpan(startDate, preferredEnd);
  const finalDurationDays = preferredSpan || durationDays;
  const endDate = startDate && finalDurationDays
    ? isoDate(addLocalDays(validLocalIsoDate(startDate), finalDurationDays - 1))
    : null;
  const dateIntent = manualRangeValid ? schedule.dateIntent || null : parsed.dateIntent || schedule.dateIntent || result.dateIntent || null;
  const normalized = {
    ...result,
    ...(finalDurationDays ? { durationDays: finalDurationDays } : {}),
    ...(travelerCount ? { travelerCount, travelers: travelerCount } : {}),
    schedule: { ...schedule, ...(startDate ? { startDate } : {}), ...(endDate ? { endDate } : {}), ...(finalDurationDays ? { durationDays: finalDurationDays } : {}), ...(dateIntent ? { dateIntent } : {}) },
    ...(dateIntent ? { dateIntent } : {})
  };
  if (!dateIntent) delete normalized.dateIntent;
  return normalized;
}
