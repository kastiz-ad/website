const LEVELS = Object.freeze({ debug: 10, info: 20, warning: 30, error: 40 });
const SECRET_PATTERN = /(authorization|cookie|password|secret|token|api.?key|card|cvv|otp|resident|passport|private.?key)/i;

function safeValue(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > 240 ? `${value.slice(0, 240)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(safeValue);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      SECRET_PATTERN.test(key) ? "[redacted]" : safeValue(item)
    ]));
  }
  return String(value);
}

export function createLogger({ requestId = null, environment = "development", service = "kastiz-one-api", logLevel = "info" } = {}) {
  const threshold = LEVELS[logLevel] || LEVELS.info;
  const emit = (level, message, metadata = {}) => {
    if ((LEVELS[level] || LEVELS.info) < threshold) return;
    const payload = {
      level,
      message,
      requestId,
      environment,
      service,
      timestamp: new Date().toISOString(),
      ...safeValue(metadata)
    };
    const line = JSON.stringify(payload);
    if (level === "error") console.error(line);
    else if (level === "warning") console.warn(line);
    else console.log(line);
  };
  return Object.freeze({
    debug: (message, metadata) => emit("debug", message, metadata),
    info: (message, metadata) => emit("info", message, metadata),
    warning: (message, metadata) => emit("warning", message, metadata),
    error: (message, metadata) => emit("error", message, metadata)
  });
}
