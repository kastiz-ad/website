const candidateName = (item = {}) => String(item?.name || item?.venueName || item?.label || "").trim();

const candidateKey = (item = {}) => candidateName(item)
  .normalize("NFKC")
  .toLocaleLowerCase("en")
  .replace(/[\p{P}\p{S}\s]+/gu, " ")
  .trim();

export const prioritizeRevisionCandidates = ({ revision = [], selected = [], curated = [], fallback = [], limit = 12 } = {}) => {
  const seen = new Set();
  return [...revision, ...selected, ...curated, ...fallback].filter((item) => {
    const key = candidateKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, Math.max(0, Number(limit) || 0));
};

export const presentationContainsCandidate = (items = [], expectedName = "") => {
  const expectedKey = candidateKey({ name: expectedName });
  return Boolean(expectedKey) && items.some((item) => candidateKey(item) === expectedKey);
};
