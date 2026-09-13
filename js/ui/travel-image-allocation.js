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

export const attachImageCandidatePool = (items = [], pool = [], options = {}) => {
  const candidates = pool.filter((image) => image?.url);
  const scope = options.scope || "DESTINATION";
  return items.map((item, index) => {
    const own = imageCandidatesForItem(item);
    const rotated = candidates.length
      ? [...candidates.slice(index % candidates.length), ...candidates.slice(0, index % candidates.length)]
      : [];
    const images = [...own, ...rotated.map((image) => ({ ...image, imageScope: image.imageScope || scope }))]
      .filter((image, position, all) => {
        const identity = normalizedImageIdentity(image);
        return identity && all.findIndex((candidate) => normalizedImageIdentity(candidate) === identity) === position;
      });
    return { ...item, image: images[0] || null, images, contextualImage: !own.length && Boolean(images.length), imageStatus: own.length ? "exact" : images.length ? "context" : "no_safe_candidate" };
  });
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

export const allocateSectionTravelImages = (items = [], options = {}) => {
  const globalUsed = options.globalUsed instanceof Set ? options.globalUsed : new Set(options.globalUsed || []);
  const sectionUsed = options.sectionUsed instanceof Set ? options.sectionUsed : new Set(options.sectionUsed || []);
  return items.map((item) => {
    const candidates = imageCandidatesForItem(item);
    const preferred = candidates.find((candidate) => {
      const identity = normalizedImageIdentity(candidate);
      return identity && !globalUsed.has(identity) && !sectionUsed.has(identity);
    });
    const contextualReuse = preferred || candidates.find((candidate) => {
      const identity = normalizedImageIdentity(candidate);
      return identity && !sectionUsed.has(identity);
    }) || null;
    if (contextualReuse) sectionUsed.add(normalizedImageIdentity(contextualReuse));
    return contextualReuse;
  });
};
