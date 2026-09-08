const clean = (value = "") => String(value || "").trim();

export const normalizedImageIdentity = (image = {}) => {
  const providerIdentity = clean(image.providerImageId || image.sourceId || image.assetKey || image.id);
  if (providerIdentity) return `provider:${providerIdentity.toLocaleLowerCase()}`;
  const url = clean(image.url || image.src);
  if (!url) return "";
  try {
    const parsed = new URL(url, "https://local.invalid");
    ["w", "width", "h", "height", "q", "quality", "fit", "crop", "auto"].forEach((key) => parsed.searchParams.delete(key));
    return `url:${parsed.hostname.toLocaleLowerCase()}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return `url:${url.toLocaleLowerCase()}`;
  }
};

export const imageCandidatesForItem = (item = {}) => {
  const primary = item?.image?.url ? item.image : item?.imageUrl ? { url: item.imageUrl, alt: item.imageAlt || item.name } : null;
  const alternates = [
    ...(Array.isArray(item?.images) ? item.images : []),
    ...(Array.isArray(item?.image?.alternates) ? item.image.alternates : [])
  ];
  return [primary, ...alternates].filter((image) => image?.url);
};

export const allocateUniqueTravelImages = (items = [], options = {}) => {
  const used = options.used instanceof Set ? options.used : new Set(options.used || []);
  return items.map((item) => {
    const image = imageCandidatesForItem(item).find((candidate) => {
      const identity = normalizedImageIdentity(candidate);
      return identity && !used.has(identity);
    }) || null;
    if (image) used.add(normalizedImageIdentity(image));
    return image;
  });
};
