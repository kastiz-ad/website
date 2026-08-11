export const INVESTOR_VISIBILITY = Object.freeze({
  showOnHomepage: false,
  routeEnabled: true,
  routePath: "/investor"
});

const normalizedPath = (locationLike = {}) => String(locationLike.pathname || "/").replace(/\/+$/, "") || "/";

export function isDedicatedInvestorRoute(locationLike = {}) {
  return INVESTOR_VISIBILITY.routeEnabled && normalizedPath(locationLike) === INVESTOR_VISIBILITY.routePath;
}

const isLocalInvestorPreview = (locationLike = {}) => {
  const host = String(locationLike.hostname || "");
  const params = new URLSearchParams(String(locationLike.search || ""));
  return (host === "127.0.0.1" || host === "localhost") && params.get("investorPreview") === "1";
};

export function shouldShowInvestorPanel(locationLike = {}) {
  return INVESTOR_VISIBILITY.showOnHomepage || isDedicatedInvestorRoute(locationLike) || isLocalInvestorPreview(locationLike);
}